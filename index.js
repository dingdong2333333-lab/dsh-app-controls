/**
 * dsh-app-controls — Host half.
 *
 * Serves two loopback-only routes for the Client half:
 * - `GET  /dsh-app-controls/status`  — where the client runs and whether a restart is possible.
 * - `POST /dsh-app-controls/restart` — schedule a restart of the DSH service.
 *
 * A page cannot restart the desktop shell by itself: the Host is a child of
 * the Electron process, and the shell treats a Host exit as a crash. The
 * restart therefore runs in a detached worker outside the shell process tree
 * (Windows: started through WMI, so the shell's job object cannot take it
 * down; POSIX: a detached child), which stops the old processes, waits for
 * them to exit, and launches the application again.
 */
import { spawn } from 'node:child_process'
import { appendFileSync, existsSync, mkdirSync, writeFileSync } from 'node:fs'
import { homedir, tmpdir } from 'node:os'
import { basename, dirname, join } from 'node:path'

export const name = 'dsh-app-controls'
export const inject = ['webServer']

const PREFIX = '/dsh-app-controls'
const LOG_DIR = join(homedir(), '.dsh', 'logs')
const LOG_PATH = join(LOG_DIR, 'dsh-app-controls.log')
const RESTART_COOLDOWN_MS = 15_000

let lastRestartAt = 0

function log(message) {
  try {
    mkdirSync(LOG_DIR, { recursive: true })
    appendFileSync(LOG_PATH, `[${new Date().toISOString()}] ${message}\n`)
  } catch {
    // Logging must never break the route.
  }
}

function sendJson(response, status, body) {
  const text = JSON.stringify(body)
  response.writeHead(status, {
    'content-type': 'application/json; charset=utf-8',
    'cache-control': 'no-store',
  })
  response.end(text)
}

function isLoopbackHostname(hostname) {
  const name = String(hostname).toLowerCase().replace(/^\[|\]$/g, '')
  return name === 'localhost' || name === '127.0.0.1' || name === '::1' || name === '0.0.0.0'
}

/** Same-origin check for state-changing POSTs; `dsh-app:` is the desktop shell's own scheme. */
function isSameOrigin(request) {
  const origin = request.headers.origin
  if (origin === undefined || origin === '') return true
  let url
  try {
    url = new URL(origin)
  } catch {
    return false
  }
  if (url.protocol === 'dsh-app:') return true
  if (url.protocol !== 'http:' && url.protocol !== 'https:') return false
  const host = request.headers.host
  if (typeof host !== 'string' || host === '') return false
  let hostUrl
  try {
    hostUrl = new URL(`${url.protocol}//${host}`)
  } catch {
    return false
  }
  return isLoopbackHostname(url.hostname) && url.port === hostUrl.port
}

function isDesktopHost() {
  return process.env.ELECTRON_RUN_AS_NODE === '1'
}

function runtimeInfo() {
  const desktop = isDesktopHost()
  const exe = process.execPath
  const exeName = basename(exe)
  const looksLikeApp = !/^(electron|node)(\.exe)?$/iu.test(exeName)
  const restartable = existsSync(exe) && (!desktop || looksLikeApp)
  return { desktop, exe, restartable, platform: process.platform }
}

/** Quote a value as a PowerShell single-quoted literal. */
function psQuote(value) {
  return `'${String(value).replace(/'/gu, "''")}'`
}

/**
 * Windows desktop worker: a PowerShell script started through WMI so it lives
 * outside the Electron job object, then stops the app, stops the Host and
 * launches the executable again.
 */
function writeWindowsRelaunchWorker({ appPid, hostPid, exe }) {
  const script = `$ErrorActionPreference = 'SilentlyContinue'
$log = ${psQuote(LOG_PATH)}
function Write-Log([string]$message) {
  try { Add-Content -LiteralPath $log -Value ('[' + (Get-Date).ToString('o') + '] ' + $message) -Encoding UTF8 } catch {}
}
$exe = ${psQuote(exe)}
$appPid = ${appPid}
$hostPid = ${hostPid}
Start-Sleep -Milliseconds 900
if (-not (Test-Path -LiteralPath $exe)) { Write-Log 'restart aborted: application executable is missing'; exit 1 }
Write-Log ('restart: stopping application ' + $appPid)
if ($appPid -gt 0) { Stop-Process -Id $appPid -Force }
for ($i = 0; $i -lt 24; $i++) { if ($appPid -le 0 -or -not (Get-Process -Id $appPid -ErrorAction SilentlyContinue)) { break }; Start-Sleep -Milliseconds 250 }
Write-Log ('restart: stopping host ' + $hostPid)
if ($hostPid -gt 0) { Stop-Process -Id $hostPid -Force }
for ($i = 0; $i -lt 24; $i++) { if ($hostPid -le 0 -or -not (Get-Process -Id $hostPid -ErrorAction SilentlyContinue)) { break }; Start-Sleep -Milliseconds 250 }
Start-Sleep -Milliseconds 500
Write-Log 'restart: launching application'
try {
  $exeDir = [System.IO.Path]::GetDirectoryName($exe)
  # Start the application through WMI: WmiPrvSE creates it in the user's
  # session without a console, so the new process neither inherits this
  # worker's console (closing it would kill DSH) nor spawns a console window.
  $launchCommand = '"' + $exe + '"'
  $launched = Invoke-CimMethod -ClassName Win32_Process -MethodName Create -Arguments @{ CommandLine = $launchCommand; CurrentDirectory = $exeDir }
  Write-Log ('restart: launch requested pid=' + $launched.ProcessId + ' in ' + $exeDir)
} catch {
  Write-Log ('restart: launch failed ' + $_.Exception.Message)
}
`
  const worker = join(tmpdir(), `dsh-app-controls-worker-${process.pid}-${Date.now()}.ps1`)
  writeFileSync(worker, `\uFEFF${script}`, 'utf8')
  return worker
}

/** Start the worker through WMI so the Electron job object cannot terminate it with the shell. */
function launchWindowsWorker(workerPath) {
  const windowsPowerShell = join(process.env.SystemRoot ?? 'C:\\Windows', 'System32', 'WindowsPowerShell', 'v1.0', 'powershell.exe')
  const powershell = existsSync(windowsPowerShell) ? windowsPowerShell : 'powershell.exe'
  const commandLine = `"${powershell}" -NoProfile -ExecutionPolicy Bypass -WindowStyle Hidden -File "${workerPath}"`
  const gateway = `$commandLine = ${psQuote(commandLine)}
try {
  $result = Invoke-CimMethod -ClassName Win32_Process -MethodName Create -Arguments @{ CommandLine = $commandLine }
  Add-Content -LiteralPath ${psQuote(LOG_PATH)} -Value ('[' + (Get-Date).ToString('o') + '] restart: WMICreate return=' + $result.ReturnValue + ' pid=' + $result.ProcessId) -Encoding UTF8
} catch {
  Add-Content -LiteralPath ${psQuote(LOG_PATH)} -Value ('[' + (Get-Date).ToString('o') + '] restart: WMICreate failed ' + $_.Exception.Message) -Encoding UTF8
}
`
  const gatewayPath = join(tmpdir(), `dsh-app-controls-gate-${process.pid}-${Date.now()}.ps1`)
  writeFileSync(gatewayPath, `\uFEFF${gateway}`, 'utf8')
  // A short-lived helper: DETACHED_PROCESS would break PowerShell, so it stays
  // attached and simply exits after the WMI call; the WMI-created worker is the
  // process that survives the shell.
  const child = spawn(powershell, ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-WindowStyle', 'Hidden', '-File', gatewayPath], {
    stdio: 'ignore',
    windowsHide: true,
  })
  child.on('error', (error) => log(`restart: gateway spawn failed: ${String((error && error.message) || error)}`))
  child.on('exit', (code) => log(`restart: gateway exited with ${String(code)}`))
  return gatewayPath
}

/** POSIX / `dsh web` worker: a detached Node script that replaces the processes. */
function launchNodeWorker(params) {
  const script = `'use strict'
const C = require('node:child_process')
const F = require('node:fs')
const P = require('node:path')
const params = ${JSON.stringify(params)}
function log(message) {
  try { F.mkdirSync(P.dirname(params.logPath), { recursive: true }); F.appendFileSync(params.logPath, '[' + new Date().toISOString() + '] ' + message + '\\n') } catch {}
}
function sleep(ms) { return new Promise((resolve) => setTimeout(resolve, ms)) }
function alive(pid) { try { process.kill(pid, 0); return true } catch { return false } }
;(async () => {
  log('restart begin mode=' + params.mode)
  await sleep(900)
  if (params.appPid > 0) {
    try { process.kill(params.appPid) } catch {}
    for (let i = 0; i < 24 && alive(params.appPid); i++) await sleep(250)
  }
  if (params.hostPid > 0) {
    try { process.kill(params.hostPid) } catch {}
    for (let i = 0; i < 24 && alive(params.hostPid); i++) await sleep(250)
  }
  await sleep(500)
  if (params.mode === 'relaunch') {
    if (!F.existsSync(params.exe)) { log('restart aborted: executable is missing'); return }
    const child = C.spawn(params.exe, [], { detached: true, stdio: 'ignore', cwd: P.dirname(params.exe), env: params.env })
    child.unref()
    log('restart: relaunched pid ' + child.pid)
    return
  }
  const child = C.spawn(params.node, params.argv, { detached: true, stdio: 'ignore', cwd: params.cwd, env: params.env })
  child.unref()
  log('restart: respawned pid ' + child.pid)
})().catch((error) => log('restart failed: ' + ((error && error.stack) || String(error))))
`
  const worker = join(tmpdir(), `dsh-app-controls-worker-${process.pid}-${Date.now()}.cjs`)
  writeFileSync(worker, script, 'utf8')
  const child = spawn(process.execPath, [worker], {
    detached: true,
    stdio: 'ignore',
    windowsHide: true,
    env: { ...process.env, ELECTRON_RUN_AS_NODE: '1' },
  })
  child.unref()
  return worker
}

function cleanEnv() {
  const env = { ...process.env }
  delete env.ELECTRON_RUN_AS_NODE
  delete env.ELECTRON_NO_ATTACH_CONSOLE
  return env
}

function launchRestart(ctx, info) {
  let port = ''
  try {
    port = new URL(ctx.webServer.getOrigin()).port
  } catch {
    port = ''
  }
  const appPid = process.ppid
  const hostPid = process.pid
  log(`restart requested: desktop=${String(info.desktop)} app=${String(appPid)} host=${String(hostPid)} port=${port}`)

  if (info.desktop) {
    if (process.platform === 'win32') {
      const worker = writeWindowsRelaunchWorker({ appPid, hostPid, exe: info.exe })
      launchWindowsWorker(worker)
      return { mode: 'relaunch', worker }
    }
    const worker = launchNodeWorker({
      mode: 'relaunch',
      appPid,
      hostPid,
      exe: info.exe,
      node: process.execPath,
      argv: [],
      cwd: dirname(info.exe),
      env: cleanEnv(),
      logPath: LOG_PATH,
    })
    return { mode: 'relaunch', worker }
  }

  const worker = launchNodeWorker({
    mode: 'respawn',
    appPid: appPid > 0 ? appPid : 0,
    hostPid,
    exe: info.exe,
    node: process.execPath,
    argv: process.argv.slice(1),
    cwd: process.cwd(),
    env: cleanEnv(),
    logPath: LOG_PATH,
  })
  return { mode: 'respawn', worker }
}

export function apply(ctx) {
  ctx.effect(
    () =>
      ctx.webServer.register({
        kind: 'exact',
        path: `${PREFIX}/status`,
        handler: (request, response) => {
          request.resume()
          if (request.method !== 'GET') {
            sendJson(response, 405, { ok: false, error: 'method-not-allowed' })
            return
          }
          const info = runtimeInfo()
          sendJson(response, 200, {
            ok: true,
            desktop: info.desktop,
            platform: info.platform,
            restartable: info.restartable,
            mode: info.desktop ? 'relaunch' : 'respawn',
          })
        },
      }),
    'dsh-app-controls: status route',
  )

  ctx.effect(
    () =>
      ctx.webServer.register({
        kind: 'exact',
        path: `${PREFIX}/restart`,
        handler: (request, response) => {
          request.resume()
          if (request.method !== 'POST') {
            sendJson(response, 405, { ok: false, error: 'method-not-allowed' })
            return
          }
          if (!isSameOrigin(request)) {
            sendJson(response, 403, { ok: false, error: 'untrusted-origin' })
            return
          }
          const info = runtimeInfo()
          if (!info.restartable) {
            sendJson(response, 409, {
              ok: false,
              error: 'restart-unavailable',
              desktop: info.desktop,
            })
            return
          }
          const now = Date.now()
          if (now - lastRestartAt < RESTART_COOLDOWN_MS) {
            sendJson(response, 200, { ok: true, already: true })
            return
          }
          lastRestartAt = now
          try {
            const result = launchRestart(ctx, info)
            sendJson(response, 200, { ok: true, mode: result.mode })
          } catch (error) {
            log(`restart launch failed: ${String((error && error.stack) || error)}`)
            lastRestartAt = 0
            sendJson(response, 500, {
              ok: false,
              error: 'restart-failed',
              message: String((error && error.message) || error),
            })
          }
        },
      }),
    'dsh-app-controls: restart route',
  )
}

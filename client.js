window.__ModuleLoader__.load({
  id: 'dsh-app-controls',
  factory(require) {
    const React = require('react')
    const h = React.createElement

    const NS = 'dsh-app-controls'
    const PREFIX = '/dsh-app-controls'
    const STYLE_ATTR = 'data-dsh-app-controls'

    const zh = {
      nav: '应用',
      title: '应用',
      subtitle: '重启 DSH 服务，或重新加载当前页面。',
      'restart.title': '重启 DSH 服务',
      'restart.desc': '结束当前应用与后台 Host，然后自动重新打开。插件安装、配置修改后需要整体重启时使用；进行中的任务会被中断。',
      'restart.button': '立即重启',
      'restart.short': '重启',
      'restart.aria': '重启 DSH 服务',
      'refresh.title': '刷新网页',
      'refresh.desc': '只重新加载当前页面，不重启后台服务；页面状态会重新从 Host 读取。',
      'refresh.button': '刷新页面',
      'refresh.short': '刷新',
      'refresh.aria': '刷新网页',
      'confirm.title': '确定重启 DSH 服务？',
      'confirm.body': '应用与后台服务会立即关闭并自动重新打开。正在运行的任务会中断，已保存的会话与文件不受影响。',
      'confirm.ok': '重启',
      'confirm.cancel': '取消',
      'confirm.busy': '正在重启…',
      'status.desktop': '桌面客户端 · 重启会重新启动整个应用',
      'status.web': '网页版 dsh web · 重启会拉起新的 dsh web 进程',
      'status.unsupported': '当前环境无法自动重启，请手动退出后重新打开。',
      'status.checking': '正在检查运行环境…',
      'restart.sent': '已发送重启请求，应用即将重新启动…',
      'restart.failed': '重启失败：{message}',
      'restart.already': '已在重启中，请稍候…',
      'hint': '提示：刷新页面也可使用浏览器刷新（Ctrl+R）；重启等效于退出应用后重新打开。',
    }

    const en = {
      nav: 'Application',
      title: 'Application',
      subtitle: 'Restart the DSH service, or reload the current page.',
      'restart.title': 'Restart DSH service',
      'restart.desc': 'Stops the application and its Host, then opens it again. Use it after installing plugins or changing configuration; running tasks are interrupted.',
      'restart.button': 'Restart now',
      'restart.short': 'Restart',
      'restart.aria': 'Restart the DSH service',
      'refresh.title': 'Reload page',
      'refresh.desc': 'Reloads only this page; the Host keeps running and page state is read again from it.',
      'refresh.button': 'Reload page',
      'refresh.short': 'Reload',
      'refresh.aria': 'Reload the page',
      'confirm.title': 'Restart the DSH service?',
      'confirm.body': 'The application and its Host close and reopen right away. Running tasks are interrupted; saved sessions and files are not affected.',
      'confirm.ok': 'Restart',
      'confirm.cancel': 'Cancel',
      'confirm.busy': 'Restarting…',
      'status.desktop': 'Desktop client · restart reopens the whole application',
      'status.web': 'Web dsh web · restart starts a new dsh web process',
      'status.unsupported': 'This environment cannot restart automatically; quit and open it again.',
      'status.checking': 'Checking the runtime…',
      'restart.sent': 'Restart requested; the application is about to reopen…',
      'restart.failed': 'Restart failed: {message}',
      'restart.already': 'Already restarting, please wait…',
      'hint': 'Tip: the page can also be reloaded with Ctrl+R; restarting is the same as quitting and opening the app again.',
    }

    const CSS = `
.dshac-hd { display: inline-flex; align-items: center; gap: 2px; margin-left: 2px; }
.dshac-hbtn { display: inline-flex; align-items: center; gap: 5px; height: 28px; padding: 0 8px;
  border: 1px solid transparent; border-radius: 7px; background: transparent;
  color: var(--dsw-alias-label-secondary); font: inherit; font-size: 12px; line-height: 1;
  cursor: pointer; white-space: nowrap; transition: background .12s, color .12s; }
.dshac-hbtn:hover { background: var(--dsw-alias-bg-layer-1); color: var(--dsw-alias-label-primary); }
.dshac-hbtn:disabled { opacity: .45; cursor: default; }
.dshac-page { display: flex; flex-direction: column; gap: 14px; max-width: 760px; padding: 2px 0 8px; }
.dshac-head { display: flex; flex-direction: column; gap: 4px; }
.dshac-h2 { margin: 0; font-size: 18px; font-weight: 600; color: var(--dsw-alias-label-primary); }
.dshac-sub { margin: 0; font-size: 13px; line-height: 20px; color: var(--dsw-alias-label-secondary); }
.dshac-cards { display: flex; flex-direction: column; gap: 10px; }
.dshac-card { display: flex; align-items: flex-start; gap: 12px; padding: 14px 16px;
  border: 1px solid var(--dsw-alias-border-l1); border-radius: 12px; background: var(--dsw-alias-bg-layer-1); }
.dshac-icon { flex: none; display: inline-flex; align-items: center; justify-content: center;
  width: 34px; height: 34px; border-radius: 9px; background: var(--dsw-alias-bg-layer-2);
  color: var(--dsw-alias-brand-primary); }
.dshac-body { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 3px; }
.dshac-title { font-size: 14px; font-weight: 600; color: var(--dsw-alias-label-primary); }
.dshac-desc { font-size: 12.5px; line-height: 19px; color: var(--dsw-alias-label-secondary); }
.dshac-action { flex: none; align-self: center; }
.dshac-btn { display: inline-flex; align-items: center; justify-content: center; gap: 6px;
  height: 30px; padding: 0 14px; border-radius: 8px; border: 1px solid transparent;
  font: inherit; font-size: 12.5px; font-weight: 500; cursor: pointer;
  transition: filter .12s, background .12s, color .12s, border-color .12s; }
.dshac-btn:disabled { opacity: .55; cursor: default; }
.dshac-primary { background: var(--dsw-alias-brand-primary); color: #fff; }
.dshac-primary:hover:not(:disabled) { filter: brightness(1.08); }
.dshac-ghost { background: transparent; color: var(--dsw-alias-label-primary); border-color: var(--dsw-alias-border-l2); }
.dshac-ghost:hover:not(:disabled) { background: var(--dsw-alias-bg-layer-2); }
.dshac-status { display: inline-flex; align-items: center; gap: 8px; font-size: 12px;
  color: var(--dsw-alias-label-secondary); }
.dshac-dot { width: 7px; height: 7px; border-radius: 50%; background: var(--dsw-alias-state-success-primary); flex: none; }
.dshac-dot-warn { background: var(--dsw-alias-state-warn-primary); }
.dshac-note { font-size: 11.5px; line-height: 18px; color: var(--dsw-alias-label-secondary); opacity: .85; }
.dshac-msg { font-size: 12px; color: var(--dsw-alias-label-secondary); }
.dshac-msg-error { color: var(--dsw-alias-state-error-primary); }
.dshac-overlay { position: fixed; inset: 0; z-index: 1300; display: flex; align-items: center;
  justify-content: center; background: rgba(0, 0, 0, .48); }
.dshac-dialog { display: flex; flex-direction: column; gap: 10px; width: min(420px, calc(100vw - 40px));
  padding: 18px 20px; border: 1px solid var(--dsw-alias-border-l1); border-radius: 14px;
  background: var(--dsw-alias-bg-overlay); box-shadow: 0 18px 50px rgba(0, 0, 0, .35); }
.dshac-dialog-title { font-size: 15px; font-weight: 600; color: var(--dsw-alias-label-primary); }
.dshac-dialog-body { font-size: 12.5px; line-height: 20px; color: var(--dsw-alias-label-secondary); }
.dshac-dialog-actions { display: flex; justify-content: flex-end; gap: 8px; margin-top: 4px; }
`

    function ensureStyle() {
      if (typeof document === 'undefined') return
      if (document.querySelector(`style[${STYLE_ATTR}]`) !== null) return
      const style = document.createElement('style')
      style.setAttribute(STYLE_ATTR, '')
      style.textContent = CSS
      document.head.append(style)
    }

    function dropStyle() {
      if (typeof document === 'undefined') return
      document.querySelectorAll(`style[${STYLE_ATTR}]`).forEach((node) => node.remove())
    }

    function PowerIcon({ size = 14 }) {
      return h('svg', {
        width: size, height: size, viewBox: '0 0 16 16', fill: 'none',
        'aria-hidden': true, focusable: 'false', xmlns: 'http://www.w3.org/2000/svg',
      }, [
        h('path', {
          key: 'ring',
          d: 'M8 2.6v4.3',
          stroke: 'currentColor', strokeWidth: 1.7, strokeLinecap: 'round',
        }),
        h('path', {
          key: 'arc',
          d: 'M11.1 4.4a4.6 4.6 0 1 1-6.2 0',
          stroke: 'currentColor', strokeWidth: 1.5, strokeLinecap: 'round',
        }),
      ])
    }

    function RefreshIcon({ size = 14 }) {
      return h('svg', {
        width: size, height: size, viewBox: '0 0 16 16', fill: 'none',
        'aria-hidden': true, focusable: 'false', xmlns: 'http://www.w3.org/2000/svg',
      }, [
        h('path', {
          key: 'arc',
          d: 'M13 8a5 5 0 1 1-1.6-3.7',
          stroke: 'currentColor', strokeWidth: 1.6, strokeLinecap: 'round',
        }),
        h('path', {
          key: 'head',
          d: 'M13.1 2.7v3.2H9.9',
          stroke: 'currentColor', strokeWidth: 1.6, strokeLinecap: 'round', strokeLinejoin: 'round',
        }),
      ])
    }

    function readJson(response) {
      return response.json().catch(() => ({ ok: false, error: 'invalid-response' }))
    }

    function fetchStatus() {
      return fetch(`${PREFIX}/status`, { headers: { accept: 'application/json' } })
        .then(readJson)
        .catch((error) => ({ ok: false, error: 'unreachable', message: String((error && error.message) || error) }))
    }

    function postRestart() {
      return fetch(`${PREFIX}/restart`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: '{}' })
        .then(readJson)
        .catch((error) => ({ ok: false, error: 'unreachable', message: String((error && error.message) || error) }))
    }

    function useStatus() {
      const [status, setStatus] = React.useState(null)
      React.useEffect(() => {
        let active = true
        fetchStatus().then((value) => {
          if (active) setStatus(value)
        })
        return () => {
          active = false
        }
      }, [])
      return status
    }

    function reloadPage() {
      try {
        location.reload()
      } catch {
        // Nothing else to do when reload is unavailable.
      }
    }

    function ConfirmDialog({ t, busy, error, onCancel, onConfirm }) {
      React.useEffect(() => {
        const onKeyDown = (event) => {
          if (event.key === 'Escape' && !busy) onCancel()
        }
        window.addEventListener('keydown', onKeyDown, true)
        return () => window.removeEventListener('keydown', onKeyDown, true)
      }, [busy, onCancel])
      return h('div', {
        className: 'dshac-overlay',
        role: 'presentation',
        onClick: (event) => {
          if (event.target === event.currentTarget && !busy) onCancel()
        },
      }, h('div', {
        className: 'dshac-dialog',
        role: 'dialog',
        'aria-modal': 'true',
        'aria-label': t('confirm.title'),
      }, [
        h('div', { key: 'title', className: 'dshac-dialog-title' }, t('confirm.title')),
        h('div', { key: 'body', className: 'dshac-dialog-body' }, t('confirm.body')),
        busy ? h('div', { key: 'busy', className: 'dshac-msg' }, t('confirm.busy')) : null,
        error !== null ? h('div', { key: 'error', className: 'dshac-msg dshac-msg-error' }, error) : null,
        h('div', { key: 'actions', className: 'dshac-dialog-actions' }, [
          h('button', {
            key: 'cancel',
            type: 'button',
            className: 'dshac-btn dshac-ghost',
            disabled: busy,
            onClick: onCancel,
          }, t('confirm.cancel')),
          h('button', {
            key: 'ok',
            type: 'button',
            className: 'dshac-btn dshac-primary',
            disabled: busy,
            autoFocus: true,
            onClick: onConfirm,
          }, busy ? t('confirm.busy') : t('confirm.ok')),
        ]),
      ]))
    }

    function errorText(t, result) {
      if (result === null || result === undefined) return t('restart.failed', { message: 'unknown' })
      if (result.error === 'restart-unavailable') return t('status.unsupported')
      const message = result.message || result.error || 'unknown'
      return t('restart.failed', { message: String(message) })
    }

    function useRestart(t) {
      const [confirming, setConfirming] = React.useState(false)
      const [busy, setBusy] = React.useState(false)
      const [error, setError] = React.useState(null)
      const [notice, setNotice] = React.useState(null)

      const open = React.useCallback(() => {
        setError(null)
        setConfirming(true)
      }, [])

      const close = React.useCallback(() => {
        if (busy) return
        setConfirming(false)
        setError(null)
      }, [busy])

      const confirm = React.useCallback(async () => {
        if (busy) return
        setBusy(true)
        setError(null)
        const result = await postRestart()
        if (result && result.ok) {
          setNotice(result.already === true ? t('restart.already') : t('restart.sent'))
          setConfirming(false)
          setBusy(false)
          return
        }
        setBusy(false)
        setError(errorText(t, result))
      }, [busy, t])

      const dialog = confirming || busy
        ? h(ConfirmDialog, {
            t,
            busy,
            error,
            onCancel: close,
            onConfirm: confirm,
          })
        : null

      return { open, notice, dialog }
    }

    function HeaderButtons({ t }) {
      const status = useStatus()
      const restart = useRestart(t)
      const disabled = status !== null && status.ok === true && status.restartable === false
      const title = disabled ? t('status.unsupported') : t('restart.aria')
      return h(React.Fragment, null, [
        h('div', { key: 'buttons', className: 'dshac-hd', 'data-dsh-app-controls-header': true }, [
          h('button', {
            key: 'restart',
            type: 'button',
            className: 'dshac-hbtn',
            title,
            'aria-label': t('restart.aria'),
            disabled,
            onClick: restart.open,
          }, [h(PowerIcon, { key: 'icon', size: 13 }), h('span', { key: 'label' }, t('restart.short'))]),
          h('button', {
            key: 'refresh',
            type: 'button',
            className: 'dshac-hbtn',
            title: t('refresh.aria'),
            'aria-label': t('refresh.aria'),
            onClick: reloadPage,
          }, [h(RefreshIcon, { key: 'icon', size: 13 }), h('span', { key: 'label' }, t('refresh.short'))]),
          restart.notice !== null
            ? h('span', { key: 'notice', className: 'dshac-msg', title: restart.notice }, '·')
            : null,
        ]),
        restart.dialog === null ? null : h('div', { key: 'dialog' }, restart.dialog),
      ])
    }

    function AppControlsSection({ t }) {
      const status = useStatus()
      const restart = useRestart(t)
      const unsupported = status !== null && status.ok === true && status.restartable === false
      const desktop = status !== null && status.desktop === true

      let statusText = t('status.checking')
      let statusWarn = false
      if (status !== null) {
        if (status.ok !== true) {
          statusText = t('status.unsupported')
          statusWarn = true
        } else if (status.restartable === false) {
          statusText = t('status.unsupported')
          statusWarn = true
        } else {
          statusText = desktop ? t('status.desktop') : t('status.web')
        }
      }

      return h('div', { className: 'dshac-page', 'data-dsh-app-controls-page': true }, [
        h('div', { key: 'head', className: 'dshac-head' }, [
          h('h2', { key: 'title', className: 'dshac-h2' }, t('title')),
          h('p', { key: 'subtitle', className: 'dshac-sub' }, t('subtitle')),
        ]),
        h('div', { key: 'cards', className: 'dshac-cards' }, [
          h('div', { key: 'restart', className: 'dshac-card' }, [
            h('span', { key: 'icon', className: 'dshac-icon' }, h(PowerIcon, { size: 18 })),
            h('div', { key: 'body', className: 'dshac-body' }, [
              h('div', { key: 'title', className: 'dshac-title' }, t('restart.title')),
              h('div', { key: 'desc', className: 'dshac-desc' }, t('restart.desc')),
              restart.notice !== null
                ? h('div', { key: 'notice', className: 'dshac-msg' }, restart.notice)
                : null,
            ]),
            h('div', { key: 'action', className: 'dshac-action' }, h('button', {
              type: 'button',
              className: 'dshac-btn dshac-primary',
              disabled: unsupported,
              title: unsupported ? t('status.unsupported') : t('restart.aria'),
              onClick: restart.open,
            }, t('restart.button'))),
          ]),
          h('div', { key: 'refresh', className: 'dshac-card' }, [
            h('span', { key: 'icon', className: 'dshac-icon' }, h(RefreshIcon, { size: 18 })),
            h('div', { key: 'body', className: 'dshac-body' }, [
              h('div', { key: 'title', className: 'dshac-title' }, t('refresh.title')),
              h('div', { key: 'desc', className: 'dshac-desc' }, t('refresh.desc')),
            ]),
            h('div', { key: 'action', className: 'dshac-action' }, h('button', {
              type: 'button',
              className: 'dshac-btn dshac-ghost',
              title: t('refresh.aria'),
              onClick: reloadPage,
            }, t('refresh.button'))),
          ]),
        ]),
        h('div', { key: 'status', className: 'dshac-status' }, [
          h('span', { key: 'dot', className: `dshac-dot${statusWarn ? ' dshac-dot-warn' : ''}` }),
          h('span', { key: 'text' }, statusText),
        ]),
        h('div', { key: 'hint', className: 'dshac-note' }, t('hint')),
        restart.dialog === null ? null : h('div', { key: 'dialog' }, restart.dialog),
      ])
    }

    return {
      inject: ['locale', 'slots'],
      apply(ctx) {
        const safe = (label, run) => {
          try {
            return run()
          } catch (error) {
            console.warn(`[${NS}] ${label} degraded: ${String((error && error.message) || error)}`)
            return undefined
          }
        }

        safe('style', () => {
          ctx.effect(() => {
            ensureStyle()
            return () => dropStyle()
          }, `${NS}: styles`)
        })

        let t = (key) => key
        safe('locale', () => {
          ctx.effect(() => ctx.locale.register(NS, { zh, en }), `${NS}: dictionaries`)
          t = ctx.locale.bind(NS)
        })

        safe('slots:settings.section', () => ctx.slots.inject('settings.section', () => ctx.slots.register({
          name: 'settings.section',
          id: NS,
          order: 26,
          label: () => t('nav'),
          locale: NS,
          inject: () => ({ t }),
        }, AppControlsSection)))

        safe('slots:conversation.session.header.actions', () => ctx.slots.inject('conversation.session.header.actions', () => ctx.slots.register({
          name: 'conversation.session.header.actions',
          id: NS,
          order: -20,
          locale: NS,
          inject: () => ({ t }),
        }, HeaderButtons)))
      },
    }
  },
})

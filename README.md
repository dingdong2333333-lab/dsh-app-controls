# DSH App Controls

DSH 官方客户端有一个小小的遗憾：**没有“重启”和“刷新”按钮**。

每次装完插件、改完配置，流程基本是：关掉窗口，重新打开，然后祈祷它还记得刚才改了什么。为了不再做这套仪式，我写了这个插件。

它在会话标题栏和 **设置 → 应用** 里放了两颗按钮：

- **重启 DSH**：结束当前应用和后台 Host，再通过 WMI 在用户会话中无控制台启动它。
- **刷新页面**：只重新加载当前页面，后台服务继续运行。

没有新的服务，没有复杂的配置，也没有“企业级解决方案”。就是两个按钮。

## 安装

从 GitHub 安装：

```bash
dsh plugin --profile desktop add github:dingdong2333333-lab/dsh-app-controls
```

从本地目录安装：

```bash
dsh plugin add <本目录>
```

从打包产物安装：

```bash
dsh plugin add ./dsh-app-controls-1.0.0.tgz
```

安装后按钮会出现在会话标题栏和 **设置 → 应用**。首次使用“重启”会关闭并重新打开整个应用。

## 这两个按钮做什么

### 重启 DSH

桌面端会启动一个 WMI worker，把重启动作放到当前 Electron 进程树之外，然后结束应用与 Host，再重新拉起应用。这样即使当前窗口被关掉，worker 也不会被一起带走。

重启会中断正在运行的任务；会话记录和工作区文件不受影响。

### 刷新页面

只在客户端执行 `location.reload()`。Host 不重启，页面会重新从 Host 读取状态。适合刚装完插件、想让界面重新拉取数据的场景。

## 一些细节

- 运行日志：`~/.dsh/logs/dsh-app-controls.log`
- 重启路由带 15 秒冷却，避免连点导致进程互相踩踏。
- Windows 桌面版使用 WMI 启动独立 worker；`dsh web` 下改用结束旧进程、以原命令行拉起新宿主的方式。
- 如果重启后应用没有自动回来，手动打开应用，再看一眼上面的日志。
- 这个插件不修改 DSH 本体，也不接管你的会话和工作区。

## 开发

```bash
npm pack
```

产物 `dsh-app-controls-1.0.0.tgz` 可以直接用 `dsh plugin add` 安装。

源码结构：

```text
index.js              Host half：状态、重启路由、WMI/进程 worker
client.js             Client half：标题栏与设置页按钮
cordis.patch.yml      DSH 插件挂载声明
locale/*.json         中英文文案
icon.svg              图标
```

## 许可证

本插件使用 [Unlicense](LICENSE) 释放到公共领域。DSH 是 DeepSeek 的产品；本项目是独立插件，与 DeepSeek 官方无隶属关系。

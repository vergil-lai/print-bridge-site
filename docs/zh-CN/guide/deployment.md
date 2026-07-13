---
description: 在仓库、门店和工位部署 PrintBridge Desktop 或 Linux Headless，使用 CLI、systemd、白名单和远程任务完成运维。
---

# 部署与配置

PrintBridge 适合仓库、门店、生产工位等需要稳定静默打印的场景。业务系统可以通过 JSSDK 连接本机 WebSocket，也可以让 Agent 主动拉取远程任务。

## 选择产品

v0.2.0 提供两个互斥产品：

| 产品 | 平台 | 运行方式 |
| --- | --- | --- |
| Desktop | Windows、macOS、Linux | 设置界面、托盘常驻、桌面自启动 |
| Linux Headless | x86_64、ARM64 Linux | 无 GUI，由 systemd system service 托管 |

两者都会安装名为 `print-bridge` 的 CLI，但不能在同一台机器上同时安装。Desktop 不提供 `serve`；只有 Linux Headless 提供 `print-bridge serve`。

## 基础配置

每台机器至少需要确认：

1. 默认打印机和纸张。
2. 业务系统 Origin 白名单。
3. 客户端 IP 白名单。
4. 远程任务配置（如果启用远程模式）。
5. CUPS、浏览器和 Office 转换软件等平台依赖。

## CLI 运维

Desktop 和 Headless 共用相同的功能命令：

```bash
print-bridge printer
print-bridge printer set-default "Printer Name"
print-bridge paper
print-bridge paper set 60 40

print-bridge origin add "https://erp.example.com"
print-bridge ip add "192.168.1.0/24"

print-bridge remote set-url "https://example.com/print-task"
print-bridge remote enable

print-bridge task
print-bridge status
print-bridge doctor
print-bridge config validate
```

CLI 和 GUI 共用同一个 `CommandService`。Agent 运行时，CLI 优先通过本地 IPC 执行命令；允许离线执行的命令可以直接读取配置和本地数据。Desktop 额外支持 `autostart` 和 `app language`。

## Linux Headless

从[下载页](../download.md)安装 `print-bridge-server` deb/rpm 后，安装脚本会：

- 创建 `printbridge` 系统用户。
- 安装并启用 `print-bridge.service`。
- 由 systemd 自动运行 `print-bridge serve`。

正常安装后无需手工运行 `serve`，也没有 `serve install` 或 `serve uninstall` 命令。

常用排障命令：

```bash
systemctl status print-bridge
journalctl -u print-bridge
print-bridge status
print-bridge doctor
```

Headless 使用以下系统路径：

| 用途 | 路径 |
| --- | --- |
| 配置 | `/etc/print-bridge` |
| 数据 | `/var/lib/print-bridge` |
| Runtime / IPC | `/run/print-bridge` |

升级会保留配置和数据，只有 purge 才删除 `/etc/print-bridge` 和 `/var/lib/print-bridge`。

## 配置导入导出

Desktop 设置界面和 CLI 都支持加密配置导入导出。导入前会展示预览，并且只覆盖文件中包含的配置项：

```bash
print-bridge config export ./printbridge-config.json --only service-port --only allowed-ips
print-bridge config import ./printbridge-config.json --preview
print-bridge config validate
```

企业部署时可以先配置一台样板机器，再把所需字段导出并分发到其他主机。

## HTML 与 Office 前置条件

HTML 打印需要系统已安装 Chromium 系浏览器：

| 平台 | 浏览器渲染器 |
| --- | --- |
| Windows | Edge → Chrome → Chromium |
| macOS | Chrome → Chromium |
| Linux | Chrome → Chromium |

没有可用浏览器时，HTML 任务会返回 renderer-unavailable。Headless 主机也必须自行安装 Chrome 或 Chromium。

Office 文件不会由 PrintBridge 自带转换器处理：Windows 需要对应的 Microsoft Office 应用，macOS/Linux 需要 LibreOffice。Linux 打印还需要系统已安装并启用 CUPS。

## 远程任务轮询

远程任务适合“业务服务器集中生成任务，工位 Agent 自动打印”的模式：

```text
业务服务器
  |
  | Agent 通过 HTTP(S) 定时拉取任务并上报状态
  v
PrintBridge Agent
  |
  | 下载、转换、排队、提交打印
  v
系统打印队列
```

这里的 HTTP(S) 是 Agent 访问业务服务器的出站请求；PrintBridge 对外监听的网络入口只有 WebSocket `/ws`。

## 批量部署建议

- 先在样板机器配置打印机、纸张、白名单和远程任务。
- 使用加密配置文件迁移可复用字段。
- 使用 `print-bridge doctor` 检查目录权限、IPC、打印机、浏览器和 Office 依赖。
- Linux 无 GUI 主机直接安装 Headless deb/rpm，由安装包管理 systemd 服务。
- 在业务系统侧管理设备编号、用户权限和任务来源。

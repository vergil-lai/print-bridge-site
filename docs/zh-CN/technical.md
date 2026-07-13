---
description: PrintBridge v0.2.0 技术文档，说明 Desktop/Headless 架构、WebSocket 协议、本地 IPC、CLI、配置和打印边界。
---

# 技术文档

## v0.2.0 架构

PrintBridge v0.2.0 采用 Cargo workspace，将模型、功能命令、运行时和最终产品分开：

```text
PrintBridge/
├── crates/
│   ├── core/       # 配置、协议、任务和队列模型
│   ├── cli/        # CommandService、Clap parser、本地 IPC client
│   └── runtime/    # Agent、worker、打印适配器、WebSocket、本地 IPC server
└── apps/
    ├── desktop/    # Vue + Tauri Desktop 产品
    └── server/     # Linux Headless、systemd、deb/rpm
```

设置、打印机、纸张、日志、任务历史、配置导入导出、连接测试和测试打印都表示为统一命令，并由同一个 `CommandService` 执行。

```text
Vue 设置界面 → Tauri IPC ─┐
                          ├→ CommandService → Agent / 本机配置与数据
print-bridge CLI → 本地 IPC ┘
```

GUI 不经过 HTTP，也不会启动 CLI 子进程。外部 CLI 管理运行中 Agent 时，Unix 使用 `agent.sock`，Windows 使用命名管道；只有明确允许离线执行的命令才会直接读取本机配置和数据。

## 两个产品

| 产品 | 包 | 无参数行为 | `serve` |
| --- | --- | --- | --- |
| Desktop | `print-bridge-desktop` | 启动 GUI | 明确拒绝 |
| Linux Headless | `print-bridge-server` | 显示 CLI 帮助 | 启动 Agent |

两种软件包都交付名为 `print-bridge` 的可执行文件，并且不能同时安装。Headless 安装时创建 `printbridge` 系统用户并自动启用 systemd system service。

## 网络与 IPC 边界

Axum 对外只暴露：

```text
GET /ws
```

配置、打印机、纸张、日志、任务历史和测试打印均不提供 REST API。WebSocket 连接同时受客户端 IP 白名单和浏览器 Origin 白名单限制。

本地 IPC 只用于 CLI 管理 Agent，不对浏览器或局域网开放。Desktop 默认把 runtime 文件放在应用配置目录的 `run/`；Linux Headless 使用 `/run/print-bridge/agent.sock`。

## WebSocket 消息

主要能力包括：

- `ping`
- `get_printers_list`
- `get_printer_info`
- `get_print_queue`
- `print`
- `print_batch`
- `job_status`
- `error`

JSSDK 输入使用 camelCase，发送给本机 Agent 时转换为 snake_case。

## 支持格式

- PDF。
- PNG/JPEG 图片。
- `docx`、`xlsx`、`pptx` Office 文件；转换为临时 PDF 后打印。
- `html`：下载公开 HTTP(S) 页面并渲染为 PDF。
- `raw-html`：渲染调用方提供的内联 HTML。
- `raw`：使用 `data_base64` 承载 ESC/POS、TSPL、ZPL、EPL、PCL、PostScript 等设备指令。

HTML 页面和所有子资源只允许使用公开 HTTP/HTTPS 地址；本机、私网和 `file:` 资源会被拒绝。HTML 渲染依赖系统浏览器：Windows 按 Edge → Chrome → Chromium 查找，macOS/Linux 按 Chrome → Chromium 查找。

Windows Office 转换分别调用 Microsoft Word、Excel、PowerPoint；macOS/Linux 使用 LibreOffice。单次转换最长 120 秒。Windows 转换超时时只清理当前任务启动的 Office 实例。

## 配置示例

```json
{
  "service": { "host": "127.0.0.1", "port": 17890 },
  "security": {
    "allowed_origins": ["https://erp.example.com"],
    "allowed_ips": ["127.0.0.1"]
  },
  "printing": {
    "default_printer": null,
    "default_paper": null,
    "default_copies": 1
  },
  "remote": {
    "enabled": false,
    "endpoint_url": null,
    "bearer_token": null,
    "device_id": null,
    "device_name": null,
    "poll_interval_seconds": 10,
    "max_report_retries": 10,
    "history_retention_days": 3
  }
}
```

`service.host` 是兼容字段；服务实际绑定 `0.0.0.0:{port}`。同机网页仍应连接 `ws://127.0.0.1:17890/ws`。

## CLI 运维入口

Desktop 和 Headless 共用 `crates/cli` 中的 Clap parser。常用命令：

```bash
print-bridge printer
print-bridge printer "Printer Name"
print-bridge printer set-default "Printer Name"
print-bridge paper
print-bridge paper set 60 40

print-bridge service
print-bridge service set-port 17521
print-bridge origin
print-bridge origin add "https://example.com"
print-bridge origin delete "https://example.com"
print-bridge ip
print-bridge ip add "192.168.1.0/24"
print-bridge ip delete "192.168.1.0/24"

print-bridge remote
print-bridge remote enable
print-bridge remote disable
print-bridge remote set-url "https://example.com/print-task"
print-bridge remote set-token "token"
print-bridge remote set-device-id "factory-pi-01"
print-bridge remote set-device-name "packing-station-01"
print-bridge remote set-interval 10
print-bridge remote set-max-retries 10
print-bridge remote generate-device-id

print-bridge task
print-bridge task "JOB-001"
print-bridge task clear
print-bridge status
print-bridge logs
print-bridge test-remote
print-bridge test-print
print-bridge doctor
print-bridge doctor --json

print-bridge config export ./printbridge-config.json --only service-port --only allowed-ips
print-bridge config import ./printbridge-config.json --preview
print-bridge config validate

# 仅 Desktop
print-bridge autostart enable
print-bridge app language zh-CN

# 仅 Linux Headless
print-bridge serve
```

`status`、内存日志、连接测试和测试打印等在线命令要求 Agent 正在运行。`doctor` 只检查本机配置、目录权限、IPC、端口、打印机、浏览器、Office/LibreOffice、远程配置和 Headless systemd 环境，不会连接远程服务器、提交打印或修改配置。

稳定退出码：参数错误 2、Agent 未运行 3、权限错误 4、冲突 5；`doctor` 有 FAIL 时返回 1，只有 WARN 时仍返回 0。

## Linux Headless

`print-bridge serve` 只存在于 `print-bridge-server`。deb/rpm 安装时创建系统用户并启用 `print-bridge.service`，没有 `serve install/uninstall`。

| 用途 | 路径 |
| --- | --- |
| 配置 | `/etc/print-bridge` |
| 数据 | `/var/lib/print-bridge` |
| Runtime / IPC | `/run/print-bridge` |

服务使用 `Type=notify`。可使用 `systemctl status print-bridge`、`journalctl -u print-bridge` 或 `print-bridge status` 排障。

## 状态语义

WebSocket 任务状态包括 `queued`、`downloading`、`printing`、`submitted`、`completed`、`failed`、`unknown`、`cancelled`。

- `queued`：Agent 已接收任务并放入队列。
- `submitted`：已提交到系统打印队列，不代表物理出纸。
- `success`：远程任务上报语义，同样表示已提交到系统打印队列。
- `completed`：系统或驱动层观察到任务结束，不等同于物理出纸确认。
- `failed`：下载、转换、校验或系统打印命令失败。
- `unknown`：平台不可追踪、追踪超时或无法可靠判断后续状态。

## 更多源码文档

- [PrintBridge GitHub](https://github.com/vergil-lai/print-bridge)
- [print-bridge-sdk GitHub](https://github.com/vergil-lai/print-bridge-jssdk)

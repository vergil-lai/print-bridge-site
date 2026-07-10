---
description: PrintBridge 技术文档，汇总协议、HTTP API、WebSocket API、配置格式、CLI 命令、状态语义和平台打印边界。
---

# 技术文档

这一页汇总 PrintBridge 的协议、API、配置格式、状态语义和平台打印边界。

## 技术栈

| 层级 | 技术 |
| --- | --- |
| 桌面框架 | Tauri 2 |
| 前端 | Vue 3 + TypeScript |
| 后端 | Rust + Axum + Tokio |
| 存储 | JSON 配置文件 + SQLite |
| Windows 打印 | SumatraPDF |
| macOS / Linux 打印 | CUPS `lp` |

## 产品边界

PrintBridge 是本机打印 Agent，不是打印机驱动，也不替代系统打印队列。

- 浏览器侧主要通过 WebSocket `/ws` 下发任务。
- 安全模型由 Origin 白名单和 IP 白名单组成。
- 打印队列串行执行。
- `submitted` / `success` 表示已提交到系统打印队列，不表示打印机已经真实出纸。
- Windows 使用随包资源中的 SumatraPDF。
- macOS 和 Linux 使用系统 CUPS 命令行工具。

## 支持格式

- PDF。
- PNG/JPEG 图片。
- Office 文件：`docx`、`xlsx`、`pptx`，本机 Agent 会先转换为 PDF。
- HTML：`html` 渲染公开 HTTP(S) `file_url`，`raw-html` 渲染调用方提供的内联 `html`；两者都会先由本机 Agent 转换为 PDF。
- raw 指令：使用 `data_base64` 承载 ESC/POS、TSPL、ZPL、EPL、PCL、PostScript 等设备指令。

## HTML 渲染

`html` 用于 HTML 页面 URL，`raw-html` 用于内联 HTML。`html` 必须提供 `file_url`，不接受内联 `html`；`raw-html` 必须提供非空 `html`，不接受 `file_url`。两种任务的 `wait_ms` 都可为 0 到 30000 毫秒，且支持 `copies` 和 `paper`。

```json
{
  "type": "print",
  "job_id": "JOB-HTML-001",
  "format": "html",
  "file_url": "https://example.com/invoice/1",
  "wait_ms": 1000,
  "copies": 1,
  "paper": { "width_mm": 210, "height_mm": 297 }
}
```

```json
{
  "type": "print",
  "job_id": "JOB-RAW-HTML-001",
  "format": "raw-html",
  "html": "<main><h1>Invoice</h1></main>",
  "wait_ms": 1000,
  "copies": 1,
  "paper": { "width_mm": 210, "height_mm": 297 }
}
```

JSSDK 只序列化任务；本机 Agent 负责将 HTML 渲染为 PDF 并打印。HTML 页面及其加载的所有资源只允许访问公开 HTTP/HTTPS 地址；本机、私网和 `file:` 资源会被拒绝。

PrintBridge 不内置浏览器。桌面 GUI 和 `print-bridge serve` 都必须使用已安装的 Chromium 系浏览器；不提供原生 WebView fallback。Windows 按 Edge → Chrome → Chromium 查找，macOS 和 Linux 按 Chrome → Chromium 查找。没有可用浏览器时，HTML 打印会以 renderer-unavailable（`RendererUnavailable`）失败。

代理会安全拦截没有 `Referer` 或 `Origin` 的被拒资源；但这类请求无法可靠关联到当前 HTML 页面，任务历史未必记录 `BlockedResource`，生成的 PDF 也可能缺少该资源。

渲染器在总 deadline 上使用协作式取消：超时后不再开始后续浏览器阶段；已经开始的同步浏览器调用会在自身有界等待结束后再清理资源。

## 本地服务

默认 WebSocket 地址：

```text
ws://127.0.0.1:17890/ws
```

同机 Web 页面通常连接 `127.0.0.1`。局域网设备需要连接时，应使用目标电脑的局域网 IP，并配置 IP 白名单。

## HTTP API

HTTP API 主要供桌面设置界面和诊断使用：

```text
GET  /health
GET  /printers
GET  /printers/{printer_name}/papers
GET  /config
POST /config
GET  /logs
POST /print/test
GET  /ws
```

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

SDK 输入使用 camelCase，发送给本机 Agent 时会转换为 snake_case。

## 配置示例

```json
{
  "service": {
    "host": "127.0.0.1",
    "port": 17890
  },
  "security": {
    "allowed_origins": [],
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

`service.host` 是兼容字段；同机页面仍应优先连接 `127.0.0.1`。
Origin 白名单约束网页来源，IP 白名单约束客户端地址，默认保留 `127.0.0.1`。

## CLI 运维

PrintBridge 提供 `print-bridge` CLI。CLI 在 GUI 启动前执行，不要求本地 Agent 服务已经运行；它直接读写与 GUI 相同的 `config.json`，并读取本地 `task_history.sqlite3`。

CLI 默认配置位置由系统决定，也可以用环境变量覆盖：

| 环境变量 | 说明 |
| --- | --- |
| `PRINT_BRIDGE_CONFIG_PATH` | 覆盖 `config.json` 文件路径。 |
| `PRINT_BRIDGE_DATA_DIR` | 覆盖数据目录；同时影响任务历史数据库位置。 |

### `print-bridge printer`

查看打印机列表、查看单个打印机信息，或设置默认打印机。

| 命令 | 参数 | 说明 |
| --- | --- | --- |
| `print-bridge printer` | 无 | 列出系统可见的打印机。默认打印机会用 `*` 标记。 |
| `print-bridge printer "Printer Name"` | `printer_name` | 查看指定打印机详情，包括是否默认、DPI、端口、本地/网络/虚拟打印机标记。 |
| `print-bridge printer set-default "Printer Name"` | `printer_name` | 校验打印机存在后，写入 `printing.default_printer`。 |

### `print-bridge paper`

查看或设置默认纸张尺寸。

| 命令 | 参数 | 说明 |
| --- | --- | --- |
| `print-bridge paper` | 无 | 显示当前默认打印机、默认纸张；如果已配置默认打印机，也会列出该打印机可用纸张。 |
| `print-bridge paper set 60 40` | `width`、`height` | 设置默认纸张尺寸，单位为毫米，写入 `printing.default_paper`。 |

### `print-bridge origin`

管理浏览器 Origin 白名单。Origin 白名单用于约束哪些 Web 页面可以连接本机 WebSocket 服务。

| 命令 | 参数 | 说明 |
| --- | --- | --- |
| `print-bridge origin` | 无 | 列出当前允许的 Origin。 |
| `print-bridge origin add "https://erp.example.com"` | `origin` | 校验并加入 Origin 白名单。 |
| `print-bridge origin delete "https://erp.example.com"` | `origin` | 从 Origin 白名单中删除。不存在时会提示未找到。 |

### `print-bridge remote`

查看或修改远程任务配置。

| 命令 | 参数 | 说明 |
| --- | --- | --- |
| `print-bridge remote` | 无 | 显示远程任务开关、URL、Token 是否已设置、设备 ID、设备名称和轮询间隔。 |
| `print-bridge remote enable` | 无 | 开启远程任务轮询，写入 `remote.enabled = true`。 |
| `print-bridge remote disable` | 无 | 关闭远程任务轮询，写入 `remote.enabled = false`。 |
| `print-bridge remote set-url "https://example.com/print-task"` | `url` | 设置远程任务 URL。URL 必须使用 `http` 或 `https`。传空字符串可清空。 |
| `print-bridge remote set-token "token"` | `token` | 设置 Bearer Token。传空字符串可清空。 |
| `print-bridge remote set-device-id "factory-pi-01"` | `device_id` | 设置设备 ID。传空字符串可清空。 |
| `print-bridge remote set-device-name "packing-station-01"` | `device_name` | 设置设备名称。传空字符串可清空。 |
| `print-bridge remote set-interval 10` | `seconds` | 设置轮询间隔秒数。必须是正整数。 |

### `print-bridge task`

查看或清空本地任务历史。

| 命令 | 参数 | 说明 |
| --- | --- | --- |
| `print-bridge task` | 无 | 显示最近 50 条任务摘要，包括更新时间、任务 ID、当前状态和消息。 |
| `print-bridge task "JOB-001"` | `job_id` | 查看指定任务的状态事件时间线。 |
| `print-bridge task clear` | 无 | 清空本地任务历史。 |

### `print-bridge serve`

在不打开 Tauri GUI 的情况下运行本机 Agent。

| 命令 | 平台 | 说明 |
| --- | --- | --- |
| `print-bridge serve` | Windows、macOS、Linux | 前台启动本地 HTTP/WebSocket 服务、打印队列 worker 和远程轮询 worker。 |
| `print-bridge serve install` | Linux、macOS | 把前台 serve 命令安装为 systemd user service 或 launchd LaunchAgent。 |
| `print-bridge serve uninstall` | Linux、macOS | 停止并删除托管的 systemd user service 或 launchd LaunchAgent。 |

Linux 下，`serve install` 会写入 `~/.config/systemd/user/print-bridge.service`，刷新 user systemd，并立即启用服务。

macOS 下，`serve install` 会写入 `~/Library/LaunchAgents/com.printbridge.agent.plist`，再通过 `launchctl` 加载并启动。

Windows 不提供 `serve install` 和 `serve uninstall`。普通 Windows 桌面部署建议继续使用 GUI 托盘常驻；如果确实需要 Windows Service，需要通过外部 wrapper 托管 `print-bridge serve`，并先确认服务账号能看到目标打印机。

> **注意：** GUI 和 `print-bridge serve` 当前互斥运行。如果已经有 PrintBridge Agent 占用当前本地端口，第二个入口会直接退出，不会再启动另一套 HTTP/WebSocket 服务、打印队列 worker 或远程轮询 worker。

## 配置导入导出格式

配置导出文件是普通 JSON 外壳，内部 payload 使用加密内容保存：

```json
{
  "format": "printbridge-config-encrypted",
  "version": 1,
  "crypto": {
    "kdf": "argon2id13",
    "cipher": "aes-256-gcm"
  },
  "payload": "<base64(ciphertext || tag)>"
}
```

导入时只覆盖文件中包含的配置项；文件中没有包含的配置会保留现有值。

## 状态语义

```text
queued
downloading
printing
submitted
completed
failed
unknown
cancelled
```

- `queued`：本机 Agent 已接收任务并放入队列。
- `submitted`：任务已提交到系统打印队列。
- `success`：远程任务上报语义，表示任务已提交到系统打印队列，不代表物理出纸确认。  
  WebSocket 状态语义以本列表为准。
- `completed`：系统或驱动层面观察到任务结束，不等同于物理出纸确认。
- `failed`：Agent 下载、转换、校验或系统打印命令失败。
- `unknown`：平台不可追踪、追踪超时，或无法可靠判断后续状态。

## 更多源码文档

- [PrintBridge GitHub](https://github.com/vergil-lai/print-bridge)
- [print-bridge-sdk GitHub](https://github.com/vergil-lai/print-bridge-jssdk)

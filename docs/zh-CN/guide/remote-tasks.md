# 远程任务

远程任务适合“业务服务器集中生成打印任务，本地 Agent 自动拉取并打印”的场景。它和浏览器 SDK 是两条入口：SDK 由网页主动连接本机 Agent；远程任务由本机 Agent 定时访问业务服务器。

## 工作方式

开启后，PrintBridge 使用同一个任务 URL 做两类请求：

```text
GET  {endpoint_url}  拉取待打印任务
POST {endpoint_url}  上报任务状态
```

本机 Agent 拉到任务后，会下载文件、转换 Office 文件、排队并提交到系统打印队列。状态上报中的 `success` 表示已提交系统打印队列，不代表打印机已经物理出纸。

## 本机配置参数

| 参数 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `remote.enabled` | boolean | `false` | 是否开启远程任务轮询。 |
| `remote.endpoint_url` | string \| null | `null` | 业务服务器任务 URL。必须是 `http` 或 `https`。 |
| `remote.bearer_token` | string \| null | `null` | 可选。填写后请求会携带 `Authorization: Bearer <token>`。 |
| `remote.device_id` | string \| null | `null` | 可选。设备唯一标识，会作为请求头和上报字段发送。 |
| `remote.device_name` | string \| null | `null` | 可选。设备可读名称，会作为请求头和上报字段发送。 |
| `remote.poll_interval_seconds` | number | `10` | 拉取任务间隔，最小值为 `3` 秒。 |
| `remote.max_report_retries` | number | `10` | 状态上报失败后的最大重试次数，最小值为 `1`。 |
| `remote.history_retention_days` | number | `3` | 本地远程任务记录保留天数。 |

## 请求头

如果配置了 Token：

```text
Authorization: Bearer <bearer_token>
```

如果配置了设备信息：

```text
X-PrintBridge-Device-Id: <device_id>
X-PrintBridge-Device-Name: <device_name>
```

保存远程配置或点击“测试连接”时，PrintBridge 会分别测试 `GET` 和 `POST`，并额外携带：

```text
X-PrintBridge-Test: true
```

业务服务器可以识别这个请求头，只做连通性响应，不生成真实打印任务。

## 拉取任务响应

`GET` 响应可以是空响应、`null`、单个任务对象，或任务对象数组。空响应和 `null` 都表示当前没有任务。

单个 PDF 任务：

```json
{
  "type": "print",
  "request_id": "REQ-001",
  "job_id": "JOB-001",
  "format": "pdf",
  "printer_name": "Office Printer",
  "file_url": "https://example.com/label.pdf",
  "copies": 1,
  "paper": {
    "width_mm": 60,
    "height_mm": 40
  }
}
```

raw 指令任务：

```json
{
  "type": "print",
  "request_id": "REQ-RAW-001",
  "job_id": "JOB-RAW-001",
  "format": "raw",
  "printer_name": "TSC TE244",
  "data_base64": "U0laRSA2MCBtbSw0MCBtbQpHQVAgMiBtbSwwCkNMUwo="
}
```

批量任务：

```json
{
  "type": "print_batch",
  "request_id": "REQ-002",
  "batch_id": "BATCH-001",
  "jobs": [
    {
      "job_id": "A-001",
      "format": "image",
      "file_url": "https://example.com/a.png",
      "copies": 1
    },
    {
      "job_id": "B-001",
      "format": "image",
      "file_url": "https://example.com/b.jpg",
      "copies": 2
    }
  ]
}
```

## 任务字段

| 字段 | 必填 | 说明 |
| --- | --- | --- |
| `type` | 是 | `print` 或 `print_batch`。 |
| `request_id` | 是 | 业务服务器生成的请求 ID，用于状态上报关联。 |
| `batch_id` | 批量任务必填 | 批量任务 ID。 |
| `jobs` | 批量任务必填 | 批量任务中的打印任务数组。 |
| `job_id` | 是 | 打印任务 ID，也是本地远程任务去重键。已记录过的 `job_id` 不会重复入队。 |
| `format` | 是 | `pdf`、`image`、`png`、`jpg`、`jpeg`、`docx`、`xlsx`、`pptx` 或 `raw`。 |
| `printer_name` | 否 | 指定打印机。省略时使用本机默认打印机。 |
| `file_url` | 文件任务必填 | PDF、图片和 Office 文件的下载地址。 |
| `data_base64` | raw 任务必填 | raw 指令的 base64 内容。 |
| `copies` | 否 | 打印份数。raw 任务不支持该字段。 |
| `paper` | 否 | 纸张尺寸，例如 `{ "width_mm": 60, "height_mm": 40 }`。raw 任务不支持该字段。 |

raw 任务只负责把 `data_base64` 解码后的字节提交给系统打印队列。纸张、份数、条码、RFID 等设备语言参数应由业务系统写入 raw 指令本身。

## 状态上报

PrintBridge 只向远程服务器上报三个状态：

```text
accepted
success
failed
```

本地队列状态映射：

```text
queued    -> accepted
submitted -> success
failed    -> failed
cancelled -> failed
```

状态上报请求体示例：

```json
{
  "event": "status",
  "event_id": "8c3f0f3a-0f6c-44c1-9e8e-1f0a60f5c813",
  "request_id": "REQ-001",
  "batch_id": "BATCH-001",
  "job_id": "JOB-001",
  "status": "success",
  "message": "submitted to system print queue",
  "occurred_at": "2026-07-06T10:00:00Z",
  "device_id": "f77160d2-fa59-4ddb-93d9-205cd2dec3ac",
  "device_name": "packing-station-01"
}
```

`event_id` 由本机 Agent 生成 UUID v4，并持久化到 SQLite。远程服务器可以用它做状态上报的幂等键。

PrintBridge 只把 HTTP `2xx` 视为上报成功。网络错误或非 `2xx` 响应会按 `remote.max_report_retries` 重试。`401`、`403` 和 `404` 会被视为配置类错误，远程轮询和状态上报会暂停，等待用户修正配置后恢复。

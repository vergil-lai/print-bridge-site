# Technical Docs

This page summarizes the PrintBridge protocol, APIs, configuration format, status semantics, and platform printing boundaries.

## Technology Stack

| Layer | Technology |
| --- | --- |
| Desktop framework | Tauri 2 |
| Frontend | Vue 3 + TypeScript |
| Backend | Rust + Axum + Tokio |
| Storage | JSON configuration file + SQLite |
| Windows printing | SumatraPDF |
| macOS / Linux printing | CUPS `lp` |

## Product Boundaries

PrintBridge is a local print Agent. It is not a printer driver and does not replace the system print queue.

- Browser clients mainly submit jobs through WebSocket `/ws`.
- The security model consists of an Origin allowlist and an IP allowlist.
- The print queue executes serially.
- `submitted` / `success` means the job has been submitted to the system print queue. It does not mean the printer has physically printed the output.
- Windows uses the bundled SumatraPDF resource.
- macOS and Linux use the system CUPS command-line tools.

## Supported Formats

- PDF.
- PNG/JPEG images.
- Office files: `docx`, `xlsx`, and `pptx`. The local Agent converts them to PDF first.
- Raw commands: `data_base64` carries device commands such as ESC/POS, TSPL, ZPL, EPL, PCL, and PostScript.

## Local Service

Default WebSocket address:

```text
ws://127.0.0.1:17890/ws
```

Web pages on the same machine usually connect to `127.0.0.1`. If LAN devices need to connect, use the target computer's LAN IP and configure the IP allowlist.

## HTTP API

The HTTP API is mainly used by the desktop settings UI and diagnostics:

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

## WebSocket Messages

Main capabilities include:

- `ping`
- `get_printers_list`
- `get_printer_info`
- `get_print_queue`
- `print`
- `print_batch`
- `job_status`
- `error`

SDK input uses camelCase and is converted to snake_case before being sent to the local Agent.

## Configuration Example

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

`service.host` is a compatibility field. Same-machine web pages should still prefer `127.0.0.1`.
The Origin allowlist restricts web page origins, while the IP allowlist restricts client addresses. `127.0.0.1` is kept by default.

## CLI Operations

PrintBridge provides the `print-bridge` CLI. The CLI runs before the GUI starts and does not require the local Agent service to be running. It directly reads and writes the same `config.json` as the GUI, and reads the local `task_history.sqlite3`.

The default configuration location is determined by the system, but can be overridden with environment variables:

| Environment variable | Description |
| --- | --- |
| `PRINT_BRIDGE_CONFIG_PATH` | Override the `config.json` file path. |
| `PRINT_BRIDGE_DATA_DIR` | Override the data directory; this also affects the task history database location. |

### `print-bridge printer`

List printers, inspect one printer, or set the default printer.

| Command | Parameters | Description |
| --- | --- | --- |
| `print-bridge printer` | None | List printers visible to the system. The default printer is marked with `*`. |
| `print-bridge printer "Printer Name"` | `printer_name` | Show printer details, including default status, DPI, port, and local/network/virtual printer flags. |
| `print-bridge printer set-default "Printer Name"` | `printer_name` | Validate that the printer exists, then write `printing.default_printer`. |

### `print-bridge paper`

View or set the default paper size.

| Command | Parameters | Description |
| --- | --- | --- |
| `print-bridge paper` | None | Show the current default printer and default paper. If a default printer is configured, it also lists available paper sizes for that printer. |
| `print-bridge paper set 60 40` | `width`, `height` | Set the default paper size in millimeters and write `printing.default_paper`. |

### `print-bridge origin`

Manage the browser Origin allowlist. The Origin allowlist restricts which web pages can connect to the local WebSocket service.

| Command | Parameters | Description |
| --- | --- | --- |
| `print-bridge origin` | None | List currently allowed Origins. |
| `print-bridge origin add "https://erp.example.com"` | `origin` | Validate and add an Origin to the allowlist. |
| `print-bridge origin delete "https://erp.example.com"` | `origin` | Remove an Origin from the allowlist. If it does not exist, the command reports that it was not found. |

### `print-bridge remote`

View or modify remote task configuration.

| Command | Parameters | Description |
| --- | --- | --- |
| `print-bridge remote` | None | Show the remote task switch, URL, whether the token is set, device ID, device name, and polling interval. |
| `print-bridge remote enable` | None | Enable remote task polling by writing `remote.enabled = true`. |
| `print-bridge remote disable` | None | Disable remote task polling by writing `remote.enabled = false`. |
| `print-bridge remote set-url "https://example.com/print-task"` | `url` | Set the remote task URL. The URL must use `http` or `https`. Pass an empty string to clear it. |
| `print-bridge remote set-token "token"` | `token` | Set the Bearer Token. Pass an empty string to clear it. |
| `print-bridge remote set-device-id "factory-pi-01"` | `device_id` | Set the device ID. Pass an empty string to clear it. |
| `print-bridge remote set-device-name "packing-station-01"` | `device_name` | Set the device name. Pass an empty string to clear it. |
| `print-bridge remote set-interval 10` | `seconds` | Set the polling interval in seconds. Must be a positive integer. |

### `print-bridge task`

View or clear local task history.

| Command | Parameters | Description |
| --- | --- | --- |
| `print-bridge task` | None | Show the latest 50 task summaries, including updated time, task ID, current status, and message. |
| `print-bridge task "JOB-001"` | `job_id` | Show the status event timeline for a specific task. |
| `print-bridge task clear` | None | Clear local task history. |

## Configuration Import/Export Format

The exported configuration file is a plain JSON wrapper. The internal payload is encrypted:

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

During import, only configuration items included in the file are overwritten. Configuration not included in the file keeps its existing value.

## Status Semantics

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

- `queued`: The local Agent has accepted the job and placed it in the queue.
- `submitted`: The job has been submitted to the system print queue.
- `success`: Remote task reporting semantics. It means the job has been submitted to the system print queue, not that physical output is confirmed.  
  WebSocket status semantics follow this list.
- `completed`: The system or driver layer observed the job ending. This is not the same as physical output confirmation.
- `failed`: The Agent failed during download, conversion, validation, or system print command execution.
- `unknown`: The platform cannot track the job, tracking timed out, or later status cannot be determined reliably.

## More Source Documentation

- [PrintBridge GitHub](https://github.com/vergil-lai/print-bridge)
- [print-bridge-sdk GitHub](https://github.com/vergil-lai/print-bridge-jssdk)

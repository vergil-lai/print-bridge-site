---
description: PrintBridge v0.2.0 technical reference for the Desktop/Headless architecture, WebSocket protocol, local IPC, CLI, configuration, and printing boundaries.
---

# Technical Reference

## v0.2.0 Architecture

PrintBridge v0.2.0 uses a Cargo workspace that separates models, functional commands, runtime capabilities, and final products:

```text
PrintBridge/
├── crates/
│   ├── core/       # Configuration, protocol, task, and queue models
│   ├── cli/        # CommandService, Clap parser, local IPC client
│   └── runtime/    # Agent, workers, print adapters, WebSocket, local IPC server
└── apps/
    ├── desktop/    # Vue + Tauri Desktop product
    └── server/     # Linux Headless, systemd, deb/rpm
```

Settings, printers, paper, logs, task history, configuration transfer, connection tests, and test printing are represented as shared commands executed by the same `CommandService`.

```text
Vue settings UI → Tauri IPC ─┐
                             ├→ CommandService → Agent / local config and data
print-bridge CLI → local IPC ┘
```

The GUI does not use HTTP or spawn the CLI. When the external CLI manages a running Agent, Unix uses `agent.sock` and Windows uses a named pipe. Only commands explicitly allowed offline read local configuration and data directly.

## Two Products

| Product | Package | No-argument behavior | `serve` |
| --- | --- | --- | --- |
| Desktop | `print-bridge-desktop` | Starts the GUI | Explicitly rejected |
| Linux Headless | `print-bridge-server` | Shows CLI help | Starts the Agent |

Both packages ship an executable named `print-bridge` and cannot be installed together. Headless creates the `printbridge` system user and enables a systemd system service during installation.

## Network and IPC Boundary

The Axum router exposes only:

```text
GET /ws
```

Configuration, printers, paper, logs, task history, and test printing do not have REST APIs. WebSocket connections are checked against both the client IP allowlist and browser Origin allowlist.

Local IPC is only for CLI-to-Agent management and is not exposed to browsers or the LAN. Desktop stores runtime files under `run/` in the application configuration directory; Linux Headless uses `/run/print-bridge/agent.sock`.

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

The JSSDK accepts camelCase input and serializes it to snake_case for the local Agent.

## Supported Formats

- PDF.
- PNG/JPEG images.
- `docx`, `xlsx`, and `pptx` Office documents, converted to temporary PDF files.
- `html`, which downloads a public HTTP(S) page and renders it to PDF.
- `raw-html`, which renders inline HTML supplied by the caller.
- `raw`, which carries ESC/POS, TSPL, ZPL, EPL, PCL, or PostScript bytes in `data_base64`.

HTML pages and all subresources may only use public HTTP/HTTPS addresses. Local, private-network, and `file:` resources are rejected. Browser discovery is Edge → Chrome → Chromium on Windows and Chrome → Chromium on macOS/Linux.

Windows Office conversion calls Microsoft Word, Excel, or PowerPoint. macOS/Linux use LibreOffice. Conversion is limited to 120 seconds. On Windows, a timeout only cleans up Office processes started by the current task.

## Configuration Example

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

`service.host` is a compatibility field; the service binds to `0.0.0.0:{port}`. A page on the same machine should still connect to `ws://127.0.0.1:17890/ws`.

## CLI Operations

Desktop and Headless share the Clap parser in `crates/cli`. Common commands:

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

# Desktop only
print-bridge autostart enable
print-bridge app language en-US

# Linux Headless only
print-bridge serve
```

Online commands such as `status`, in-memory logs, connection tests, and test printing require a running Agent. `doctor` only checks local configuration, directory permissions, IPC, ports, printers, browsers, Office/LibreOffice, remote configuration, and the Headless systemd environment. It does not connect to the remote task server, submit print jobs, or modify configuration.

Stable exit codes are 2 for invalid arguments, 3 when the Agent is not running, 4 for permission errors, and 5 for conflicts. `doctor` returns 1 when it finds a FAIL and still returns 0 for WARN-only results.

## Linux Headless

`print-bridge serve` only exists in `print-bridge-server`. Installing a deb/rpm creates the system user and enables `print-bridge.service`. There are no `serve install/uninstall` commands.

| Purpose | Path |
| --- | --- |
| Configuration | `/etc/print-bridge` |
| Data | `/var/lib/print-bridge` |
| Runtime / IPC | `/run/print-bridge` |

The service uses `Type=notify`. Diagnose it with `systemctl status print-bridge`, `journalctl -u print-bridge`, or `print-bridge status`.

## Status Semantics

WebSocket task states include `queued`, `downloading`, `printing`, `submitted`, `completed`, `failed`, `unknown`, and `cancelled`.

- `queued`: the Agent accepted and queued the task.
- `submitted`: the task reached the system print queue; it does not confirm physical output.
- `success`: remote reporting semantics for the same system-queue submission point.
- `completed`: the OS or driver observed completion; it still does not prove physical output.
- `failed`: download, conversion, validation, or system print command failure.
- `unknown`: tracking is unavailable, timed out, or cannot reliably determine a later state.

## Source Documentation

- [PrintBridge GitHub](https://github.com/vergil-lai/print-bridge)
- [print-bridge-sdk GitHub](https://github.com/vergil-lai/print-bridge-jssdk)

---
description: Deploy PrintBridge in warehouses, stores, and workstations with printer defaults, allowlists, remote task polling, CLI operations, and encrypted configuration import/export.
---

# Deployment and Configuration

PrintBridge is designed for stable silent printing in warehouses, stores, production stations, and similar environments. One computer runs the Agent persistently. Business systems can connect directly through the SDK, or the Agent can actively pull remote tasks.

## Basic Configuration

Each computer running PrintBridge should confirm at least:

1. Default printer.
2. Default paper.
3. Business system Origin allowlist.
4. IP allowlist.
5. Remote task polling configuration, if remote task mode is used.

## Configuration Import and Export

The settings UI can export part of the configuration as an encrypted JSON file, and it can also import configuration from an encrypted JSON file. Enterprises can use this to reduce per-device manual setup.

Configuration suitable for migration includes:

- Local port.
- Origin allowlist.
- Remote task switch.
- Remote task URL.
- Remote task Authorization Token.
- Polling interval.
- Report retry count.

The default exported filename is:

```text
printbridge-config.json
```

During import, PrintBridge shows a preview first. After confirmation, it only overwrites configuration items included in the file. Configuration not included in the file keeps its existing value.

## CLI Operations

PrintBridge provides the `print-bridge` CLI for basic operations and diagnostics without opening the GUI:

```bash
print-bridge printer
print-bridge printer set-default "Printer Name"

print-bridge paper
print-bridge paper set 60 40

print-bridge origin add "https://erp.example.com"

print-bridge remote set-url "https://example.com/print-task"
print-bridge remote enable

print-bridge task
print-bridge serve
print-bridge serve install
print-bridge serve uninstall
```

The CLI reads and writes the same local configuration as the GUI. It is suitable for bulk deployment, remote support, and environments without a GUI.

## Headless Serve

`print-bridge serve` starts the local Agent without the desktop GUI. It runs in the foreground, starts the HTTP/WebSocket service, the print queue worker, and the remote polling worker, then writes logs to the terminal.

Use it when a workstation or small host should run PrintBridge without opening the Tauri window. The host operating system still needs to see the target printer through its normal printing stack.

On Linux and macOS, PrintBridge can install this foreground command as a managed user service:

```bash
print-bridge serve install
```

- Linux installs a systemd user service at `~/.config/systemd/user/print-bridge.service`.
- macOS installs a launchd LaunchAgent at `~/Library/LaunchAgents/com.printbridge.agent.plist`.
- The generated service points at the current `print-bridge` executable and uses the same CLI config/data paths.

Remove the managed service with:

```bash
print-bridge serve uninstall
```

Windows does not provide `serve install` or `serve uninstall`. For regular Windows desktops, keep using the GUI tray app. If unattended Windows service hosting is required, use a wrapper such as WinSW or NSSM and validate that the service account can see the target printer.

> **Note:** the GUI and `print-bridge serve` are currently mutually exclusive. If one PrintBridge Agent is already using the configured local port, the second entrypoint exits instead of starting another server or queue worker.

## Remote Task Polling

Remote task polling fits the pattern where a business server creates tasks centrally and workstation Agents print automatically.

```text
Business server
  |
  | Agent periodically pulls pending print tasks
  v
PrintBridge Agent
  |
  | Download, convert, queue, and submit
  v
System print queue
```

This mode is suitable for warehouse labels, store receipts, production-station labels, picking lists, and similar workflows.

## Bulk Deployment Suggestions

- Configure the default printer, paper, allowlists, and remote tasks on one template machine.
- Export the encrypted configuration package.
- Import the configuration package on other workstations.
- Use the CLI to check printers, paper, and the remote task switch.
- Use `print-bridge serve install` on Linux/macOS headless hosts when the Agent should start as a managed user service.
- Control device IDs, user permissions, and task sources in the business system.

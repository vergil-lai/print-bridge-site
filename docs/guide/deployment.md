---
description: Deploy PrintBridge Desktop or Linux Headless with the CLI, systemd, allowlists, and remote task polling.
---

# Deployment and Configuration

PrintBridge is designed for stable silent printing in warehouses, stores, and production stations. A business system can connect to the local WebSocket through the JSSDK, or the Agent can poll a remote task service.

## Choose a Product

v0.2.0 ships two mutually exclusive products:

| Product | Platform | Runtime model |
| --- | --- | --- |
| Desktop | Windows, macOS, Linux | Settings UI, tray app, and desktop autostart |
| Linux Headless | x86_64 and ARM64 Linux | No GUI; managed as a systemd system service |

Both install a CLI named `print-bridge`, but they cannot be installed on the same machine. Desktop does not provide `serve`; only Linux Headless provides `print-bridge serve`.

## Basic Configuration

Confirm at least the following on every machine:

1. Default printer and paper.
2. Business system Origin allowlist.
3. Client IP allowlist.
4. Remote task settings, if remote mode is enabled.
5. Platform dependencies such as CUPS, a supported browser, and Office conversion software.

## CLI Operations

Desktop and Headless share the same functional commands:

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

The CLI and GUI use the same `CommandService`. When the Agent is running, the CLI prefers local IPC. Commands that allow offline execution can read local configuration and data directly. Desktop additionally supports `autostart` and `app language`.

## Linux Headless

Installing a `print-bridge-server` deb/rpm from the [Download page](../download.md):

- Creates the `printbridge` system user.
- Installs and enables `print-bridge.service`.
- Lets systemd run `print-bridge serve` automatically.

A normal installation does not require running `serve` manually, and there are no `serve install` or `serve uninstall` commands.

Common diagnostic commands:

```bash
systemctl status print-bridge
journalctl -u print-bridge
print-bridge status
print-bridge doctor
```

Headless uses these system paths:

| Purpose | Path |
| --- | --- |
| Configuration | `/etc/print-bridge` |
| Data | `/var/lib/print-bridge` |
| Runtime / IPC | `/run/print-bridge` |

Upgrades preserve configuration and data. Only package purge removes `/etc/print-bridge` and `/var/lib/print-bridge`.

## Configuration Import and Export

The Desktop settings UI and CLI support encrypted configuration import and export. Import shows a preview and only overwrites fields included in the file:

```bash
print-bridge config export ./printbridge-config.json --only service-port --only allowed-ips
print-bridge config import ./printbridge-config.json --preview
print-bridge config validate
```

For fleet deployment, configure a template machine first, then export and distribute only the fields that should be shared.

## HTML and Office Prerequisites

HTML printing requires an installed Chromium-family browser:

| Platform | Browser renderer |
| --- | --- |
| Windows | Edge → Chrome → Chromium |
| macOS | Chrome → Chromium |
| Linux | Chrome → Chromium |

Without a supported browser, HTML tasks return renderer-unavailable. Headless hosts must also install Chrome or Chromium.

PrintBridge does not bundle an Office converter. Windows requires the corresponding Microsoft Office application; macOS and Linux require LibreOffice. Linux printing also requires CUPS to be installed and enabled.

## Remote Task Polling

Remote tasks fit the model where a business server creates jobs centrally and workstation Agents print automatically:

```text
Business server
  |
  | Agent polls and reports status over HTTP(S)
  v
PrintBridge Agent
  |
  | Download, convert, queue, and submit
  v
System print queue
```

This HTTP(S) traffic is outbound from the Agent to the business server. The only network endpoint exposed by PrintBridge is WebSocket `/ws`.

## Fleet Deployment Suggestions

- Configure printers, paper, allowlists, and remote tasks on a template machine.
- Migrate reusable fields with an encrypted configuration file.
- Run `print-bridge doctor` to check directory permissions, IPC, printers, browsers, and Office dependencies.
- Install a Headless deb/rpm on Linux hosts without a GUI; the package manages systemd automatically.
- Manage device IDs, user permissions, and task sources in the business system.

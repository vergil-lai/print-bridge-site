---
description: Understand PrintBridge security boundaries, including Origin allowlists, IP allowlists, service port exposure, and business-system authorization.
---

# Security Boundaries

PrintBridge runs on the user's local machine and can access local printers. Deployment must only grant printing capability to trusted systems.

## Origin Allowlist

When a browser connects to the PrintBridge WebSocket service, it sends the page Origin. PrintBridge verifies the Origin during the handshake.

Allowed examples:

```text
https://erp.example.com
http://localhost:5173
```

The Origin must exactly match protocol, host, and port.

## IP Allowlist

The IP allowlist restricts which client addresses can access the local service. The default `127.0.0.1` cannot be removed.

If LAN devices need to connect to PrintBridge on a specific computer, explicitly add trusted IP addresses or CIDR ranges, for example:

```text
192.168.1.10
192.168.1.0/24
```

## Port Exposure Boundary

Do not expose the PrintBridge service port to untrusted networks. Even when LAN access is enabled, only controlled network ranges should be allowed, together with operating-system firewall rules.

## Business System Permissions

PrintBridge only validates local sources and submits print jobs. It does not decide whether a business user is allowed to print.

The business system still needs to control:

- Who can initiate printing.
- Which files can be printed.
- How many copies can be printed.
- Whether sensitive file URLs can be accessed.
- Whether a task belongs to the current store, warehouse, or workstation.

## Status Semantics

`submitted` or `success` in remote reporting means the job has been submitted to the system print queue. It does not mean the printer has physically finished output.

# Quick Start

This page walks from installation to the first print job, helping you confirm that the PrintBridge Agent, allowlists, and SDK are connected correctly.

## Why PrintBridge

Modern browsers cannot directly access local printers.

PrintBridge provides a secure local agent between your web application and printers.

### How It Differs from Traditional Web Printing Controls

PrintBridge is not a traditional Web printing control. [C-Lodop / Lodop](https://www.lodop.ne/) is better at print design, form printing, tables, barcodes, and printing page content; PrintBridge focuses on being an open-source local print agent, remote task polling, raw commands, CLI operations, and private integration.

If your business system already generates PDF, images, Office files, or device commands such as ESC/POS, TSPL, ZPL, EPL, and PCL, PrintBridge is more like a stable, auditable, and customizable local print bridge.

### How It Works

```text
Web page / remote business server
  |
  | Sends jobs over WebSocket, or polls remote jobs over HTTP
  v
PrintBridge
  |
  | Verifies sources, downloads files, converts formats, and enters a serial queue
  v
System print queue
  |
  v
Printer driver and printer
```

## 1. Download and Start PrintBridge

Download the installer for your system from [GitHub Releases](https://github.com/vergil-lai/print-bridge/releases).

After the first launch, PrintBridge stays on the user's computer and starts the local service:

```text
ws://127.0.0.1:17890/ws
```

Web pages on the same machine usually connect to `127.0.0.1`. If another device on the LAN needs to connect to this computer's Agent, use this computer's LAN IP and configure the IP allowlist.

## 2. Select the Default Printer and Paper

In PrintBridge settings:

1. Select the default printer.
2. Select or enter the default paper size.
3. Confirm the local service port. The default is `17890`.

A print job can also specify `printerName` and `paper`. If a job does not specify them, the Agent uses the default configuration.

## 3. Add the Business System Origin

Add your business system Origin to the website allowlist, for example:

```text
https://erp.example.com
http://localhost:5173
```

The Origin must exactly match the value sent by the browser during the WebSocket handshake, including protocol, host, and port.

## 4. Install the SDK

```bash
pnpm add print-bridge-sdk
```

You can also use npm or yarn:

```bash
npm install print-bridge-sdk
```

```bash
yarn add print-bridge-sdk
```

## 5. Send the First Print Job

```ts
import { PrintBridgeClient } from 'print-bridge-sdk';

const client = new PrintBridgeClient({
  ip: '127.0.0.1',
  port: 17890,
});

await client.connect();

await client.print({
  type: 'pdf',
  printerName: 'Label Printer',
  fileUrl: 'https://example.com/label.pdf',
  copies: 1,
  paper: {
    widthMm: 60,
    heightMm: 40,
  },
});
```

`print()` returning `queued` only means the local Agent has accepted the job. Listen to events for later download, conversion, printing, and failure status.

## Next Steps

- Read [SDK Integration](./sdk.md)
- Read [Deployment and Configuration](./deployment.md)
- Read [Security Boundaries](./security.md)

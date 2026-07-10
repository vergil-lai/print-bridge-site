---
description: Integrate print-bridge-sdk in browser applications to connect to the local PrintBridge Agent and submit PDF, image, Office, HTML, raw, or batch print jobs.
---

# SDK Integration

`print-bridge-sdk` is the browser-side JSSDK for PrintBridge. It connects to the PrintBridge Agent on the user's computer and sends print jobs over WebSocket.

## Installation

```bash
pnpm add print-bridge-sdk
```

## Create a Client

```ts
import { PrintBridgeClient } from 'print-bridge-sdk';

const client = new PrintBridgeClient({
  ip: '127.0.0.1',
  port: 17890,
  connectTimeoutMs: 3000,
  requestTimeoutMs: 3000,
  heartbeatIntervalMs: 15000,
});
```

The SDK does not connect automatically. Business pages should call `connect()` before printing and call `disconnect()` when the page unloads or printing is no longer needed.

## Connection and Heartbeat

```ts
await client.connect();

const pong = await client.ping();
console.log(pong.agentStatus);

client.disconnect();
```

## Print a PDF

```ts
await client.print({
  requestId: 'REQ-001',
  jobId: 'JOB-001',
  type: 'pdf',
  printerName: 'Office Printer',
  fileUrl: 'https://example.com/label.pdf',
  copies: 1,
  paper: {
    widthMm: 60,
    heightMm: 40,
  },
});
```

## Print Images and Office Files

```ts
await client.print({
  type: 'image',
  fileUrl: 'https://example.com/label.png',
  copies: 2,
});

await client.print({
  type: 'docx',
  fileUrl: 'https://example.com/report.docx',
  copies: 1,
});
```

Office files support `docx`, `xlsx`, and `pptx`. The local Agent converts them to PDF before submitting them to the system print queue.

## Print HTML

```ts
await client.print({
  type: 'html',
  fileUrl: 'https://example.com/invoice/1',
  waitMs: 1000,
  copies: 1,
  paper: { widthMm: 210, heightMm: 297 },
});

await client.print({
  type: 'raw-html',
  html: '<main><h1>Invoice</h1></main>',
  waitMs: 1000,
  copies: 1,
  paper: { widthMm: 210, heightMm: 297 },
});
```

`html` requires an HTTP(S) `fileUrl`; `raw-html` requires a non-empty inline `html` string and does not accept `fileUrl`. `waitMs` is an integer from 0 to 30000 for HTML jobs. The SDK only serializes the task. The local Agent renders HTML to PDF before printing.

The HTML page and all loaded resources may use only public HTTP/HTTPS addresses. Local, private-network, and `file:` resources are rejected.

## Print Raw Commands

```ts
const text = `SIZE 60 mm,40 mm
GAP 2 mm,0
CLS
TEXT 40,40,"3",0,1,1,"PrintBridge"
PRINT 1,1`;

await client.print({
  type: 'raw',
  printerName: 'TSC TE244',
  dataBase64: btoa(text),
});
```

Raw mode is for systems that already generate device commands such as ESC/POS, TSPL, ZPL, EPL, PCL, or PostScript. The SDK only sends the payload to the local Agent; it does not generate or parse device commands.

## Batch Printing

```ts
await client.printBatch({
  requestId: 'REQ-BATCH-001',
  batchId: 'BATCH-001',
  jobs: [
    {
      jobId: 'A-001',
      type: 'pdf',
      fileUrl: 'https://example.com/a.pdf',
      copies: 1,
    },
    {
      jobId: 'B-001',
      type: 'raw',
      printerName: 'TSC TE244',
      dataBase64: 'XlhB...',
    },
  ],
});
```

The local Agent still executes batch jobs serially to avoid concurrent contention on the same printer.

## Status Events

```ts
const offStatus = client.on('status', (event) => {
  console.log(event.requestId, event.jobId, event.status, event.message);
});

const offError = client.on('error', (error) => {
  console.error(error.code, error.message);
});

offStatus();
offError();
```

Common statuses include:

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

`submitted` means the job has been submitted to the system print queue. It does not mean the printer has physically finished output.

## Common Errors

- `CONNECTION_FAILED`: Cannot connect to PrintBridge. The local service may not be running, the port may be wrong, or the Origin/IP may not be allowlisted.
- `CONNECTION_TIMEOUT`: Connection, heartbeat, or request timeout.
- `NOT_CONNECTED`: A print method was called before connecting.
- `ORIGIN_NOT_ALLOWED`: The browser page Origin is not in the PrintBridge allowlist.
- `PRINTER_NOT_CONFIGURED`: PrintBridge has no default printer configured.
- `DOWNLOAD_FAILED`: The local Agent cannot download the file.
- `FORMAT_MISMATCH`: The declared format does not match the file content.
- `PRINT_FAILED`: The system print command failed.

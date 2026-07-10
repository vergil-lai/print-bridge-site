---
description: 使用 print-bridge-sdk 在浏览器应用中连接本机 PrintBridge Agent，下发 PDF、图片、Office、HTML、raw 指令和批量打印任务。
---

# SDK 接入

`print-bridge-sdk` 是 PrintBridge 的浏览器端 JSSDK。它连接用户电脑上的 PrintBridge Agent，并通过 WebSocket 下发打印任务。

## 安装

```bash
pnpm add print-bridge-sdk
```

## 创建客户端

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

SDK 不会自动连接。业务页面应在需要打印前调用 `connect()`，并在页面卸载或不再需要打印时调用 `disconnect()`。

## 连接和心跳

```ts
await client.connect();

const pong = await client.ping();
console.log(pong.agentStatus);

client.disconnect();
```

## 打印 PDF

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

## 打印图片和 Office 文件

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

Office 文件支持 `docx`、`xlsx`、`pptx`。本机 Agent 会先转换为 PDF，再提交到系统打印队列。

## 打印 HTML

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

`html` 必须提供 HTTP(S) `fileUrl`；`raw-html` 必须提供非空内联 `html`，且不接受 `fileUrl`。HTML 任务的 `waitMs` 必须是 0 到 30000 的整数。SDK 只负责序列化任务，由本机 Agent 将 HTML 渲染为 PDF 后打印。

HTML 页面及其加载的所有资源只允许访问公开 HTTP/HTTPS 地址；本机、私网和 `file:` 资源会被拒绝。

## 打印 raw 指令

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

raw 模式适合业务系统已经生成好 ESC/POS、TSPL、ZPL、EPL、PCL 或 PostScript 等设备指令的场景。SDK 只负责把 payload 发给本机 Agent，不生成或解析设备指令。

## 批量打印

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

本机 Agent 仍会串行执行批量任务，避免同一台打印机并发抢占。

## 状态监听

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

常见状态包括：

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

`submitted` 表示任务已提交到系统打印队列，不代表打印机已经真实完成出纸。

## 常见错误

- `CONNECTION_FAILED`：无法连接 PrintBridge，可能是本地服务未启动、端口不对、Origin 未加入白名单，或 IP 未加入白名单。
- `CONNECTION_TIMEOUT`：连接、心跳或请求超时。
- `NOT_CONNECTED`：尚未连接就调用了打印方法。
- `ORIGIN_NOT_ALLOWED`：浏览器页面 Origin 不在 PrintBridge 白名单中。
- `PRINTER_NOT_CONFIGURED`：PrintBridge 未配置默认打印机。
- `DOWNLOAD_FAILED`：本机 Agent 无法下载文件。
- `FORMAT_MISMATCH`：声明格式与文件内容不匹配。
- `PRINT_FAILED`：系统打印命令失败。

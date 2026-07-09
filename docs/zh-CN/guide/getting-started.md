# 快速开始

这一页从下载安装到完成第一单打印，帮你确认 PrintBridge Agent、白名单和 SDK 都已经连通。

## 1. 下载并启动 PrintBridge

在 [GitHub Releases](https://github.com/vergil-lai/print-bridge/releases) 下载适合当前系统的安装包。

首次运行后，PrintBridge 会常驻在用户电脑上，并启动本机服务：

```text
ws://127.0.0.1:17890/ws
```

同机 Web 页面通常连接 `127.0.0.1`。如果要从局域网其他设备连接这台电脑上的 Agent，需要使用这台电脑的局域网 IP，并配置 IP 白名单。

## 2. 选择默认打印机和纸张

在 PrintBridge 设置界面完成：

1. 选择默认打印机。
2. 选择或填写默认纸张。
3. 确认本机服务端口，默认是 `17890`。

打印任务也可以单独指定 `printerName` 和 `paper`。如果任务未指定，Agent 会使用默认配置。

## 3. 添加业务系统 Origin

把业务系统的 Origin 加入网站白名单，例如：

```text
https://erp.example.com
http://localhost:5173
```

Origin 必须精确匹配浏览器 WebSocket 握手中携带的来源，包括协议、域名和端口。

## 4. 安装 SDK

```bash
pnpm add print-bridge-sdk
```

也可以使用 npm 或 yarn：

```bash
npm install print-bridge-sdk
```

```bash
yarn add print-bridge-sdk
```

## 5. 发送第一单打印

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

`print()` 返回 `queued` 只表示本机 Agent 已接收任务。后续下载、转换、打印和失败状态需要通过事件监听。

## 下一步

- 阅读 [SDK 接入](./sdk.md)
- 阅读 [部署与配置](./deployment.md)
- 阅读 [安全边界](./security.md)

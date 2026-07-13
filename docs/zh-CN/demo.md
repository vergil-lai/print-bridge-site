---
description: 在浏览器中使用 Vue 和 print-bridge-sdk 体验 PrintBridge，选择本机打印机与纸张，打印 PDF、JPG、HTML 或 DOCX 样例。
---

# PrintBridge Demo

本页面会直接连接你电脑上运行的 PrintBridge Agent。打印机列表、所选纸张、文件 URL 和运行日志都不会上传到官网服务器。

## 使用前准备

1. [下载并启动 PrintBridge Agent](/zh-CN/download)。
2. 将当前官网 Origin 加入 Agent 的 Origin 白名单。
3. 点击下方的**连接 Agent**。
4. 选择打印机及该打印机支持的纸张尺寸。
5. 保留内置样例 URL，或填写你自己的公网 HTTP/HTTPS 文件地址。
6. 点击对应格式的打印按钮，并在运行日志中查看任务状态。

::: warning 需要访问本机 Agent
如果 Agent 未启动、端口 `17890` 不可用，或当前官网 Origin 未加入白名单，Demo 将无法连接。
:::

<ClientOnly>
  <PrintDemo />
</ClientOnly>

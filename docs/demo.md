---
description: Try PrintBridge in the browser with Vue and print-bridge-sdk. Select a local printer and paper size, then print PDF, JPG, HTML, or DOCX samples.
---

# PrintBridge Demo

This page connects directly to the PrintBridge Agent running on your computer. It does not upload your printer list, selected paper, file URLs, or activity log to the website server.

## Before you start

1. [Download and start PrintBridge Agent](/download).
2. Add this website Origin to the Agent's Origin allowlist.
3. Click **Connect Agent** below.
4. Select a printer and one of its supported paper sizes.
5. Keep the built-in sample URL or enter your own public HTTP/HTTPS file URL.
6. Click the matching print button and follow the job in the activity log.

::: warning Local access required
The Demo cannot connect if the Agent is stopped, port `17890` is unavailable, or this website Origin is not allowed by the Agent.
:::

## Install in a Vue project

Install the published SDK from npm:

```bash
npm install print-bridge-sdk
```

Create the client inside your Vue application, then connect before querying printers or submitting jobs:

```vue
<script setup lang="ts">
import { PrintBridgeClient } from 'print-bridge-sdk'

const client = new PrintBridgeClient({
  ip: '127.0.0.1',
  port: 17890
})
</script>
```

The live Demo below uses this Vue integration together with `getPrintersList()`, `getPrinterInfo()`, and `print()`.

<ClientOnly>
  <PrintDemo />
</ClientOnly>


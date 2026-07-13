---
aside: false
description: Download PrintBridge for Windows, macOS, and Linux, including installers for enterprise local printing and remote print task deployment.
---

<script setup>
import DownloadOptions from './.vitepress/theme/components/DownloadOptions.vue'
</script>

# Download PrintBridge

The current stable release is v0.2.0. Choose a product, platform, and architecture.

<DownloadOptions />

## Which product should I choose?

- **Desktop**: for Windows, macOS, and Linux workstations with a desktop environment. It includes the settings UI and tray app.
- **Linux Headless**: for servers, Raspberry Pi devices, industrial PCs, and dedicated print hosts. It has no GUI and is configured through the `print-bridge` CLI.

Desktop and Headless both install a command named `print-bridge`, but they are mutually exclusive products and cannot be installed on the same machine. Installing the Headless deb/rpm package creates the `printbridge` system user and enables the systemd system service automatically.

See [Deployment and configuration](./guide/deployment.md) for setup details.

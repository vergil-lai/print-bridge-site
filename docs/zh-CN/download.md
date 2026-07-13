---
aside: false
description: 下载 PrintBridge，支持 Windows、macOS 和 Linux 安装包，用于企业 Web 应用本机静默打印和远程打印任务部署。
---

<script setup>
import DownloadOptions from '../.vitepress/theme/components/DownloadOptions.vue'
</script>

# 下载 PrintBridge

当前稳定版本为 v0.2.0。请选择产品、平台和架构进行下载。

<DownloadOptions />

## 如何选择

- **Desktop 桌面版**：适合 Windows、macOS 和带桌面环境的 Linux 工作站，提供设置界面和托盘常驻。
- **Linux Headless**：适合服务器、树莓派、工控机和专用打印主机，没有 GUI，通过 `print-bridge` CLI 配置和诊断。

Desktop 和 Headless 都安装名为 `print-bridge` 的命令，但属于互斥产品，不能在同一台机器上同时安装。Headless deb/rpm 安装后会自动创建 `printbridge` 系统用户并启用 systemd system service。

需要详细部署步骤时，请阅读[部署与配置](./guide/deployment.md)。

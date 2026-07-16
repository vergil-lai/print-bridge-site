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

## Install with a package manager

### Homebrew (macOS)

```bash
brew tap vergil-lai/tap
brew install --cask printbridge
```

### APT (Debian/Ubuntu)

Add the PrintBridge repository and signing key before the first installation:

```bash
sudo install -d -m 0755 /etc/apt/keyrings

curl -fsSL \
  https://printbridge.pages.dev/apt/printbridge-archive-keyring.gpg \
  | sudo tee /etc/apt/keyrings/printbridge.gpg >/dev/null

sudo tee /etc/apt/sources.list.d/printbridge.sources >/dev/null <<'EOF'
Types: deb
URIs: https://printbridge.pages.dev/apt
Suites: stable
Components: main
Signed-By: /etc/apt/keyrings/printbridge.gpg
EOF

sudo apt update
```

Install the Desktop version:

```bash
sudo apt install print-bridge
```

For systems without a desktop environment, install the Headless server version:

```bash
sudo apt install print-bridge-server
```

The repository signing key fingerprint is `7D9F6986BAD473CE95B1FDA55B1B363C885CD16D`.

### RPM/DNF (Fedora/RHEL/Rocky Linux/AlmaLinux)

Add the PrintBridge repository before the first installation:

```bash
curl -fsSL https://printbridge.pages.dev/rpm/printbridge.repo \
  | sudo tee /etc/yum.repos.d/printbridge.repo >/dev/null

sudo dnf makecache
```

Install the Desktop version:

```bash
sudo dnf install print-bridge
```

For systems without a desktop environment, install the Headless server version:

```bash
sudo dnf install print-bridge-server
```

When the repository is refreshed for the first time, DNF prompts you to import the PrintBridge GPG key. Its fingerprint is also `7D9F6986BAD473CE95B1FDA55B1B363C885CD16D`.

## Which product should I choose?

- **Desktop**: for Windows, macOS, and Linux workstations with a desktop environment. It includes the settings UI and tray app.
- **Linux Headless**: for servers, Raspberry Pi devices, industrial PCs, and dedicated print hosts. It has no GUI and is configured through the `print-bridge` CLI.

Desktop and Headless both install a command named `print-bridge`, but they are mutually exclusive products and cannot be installed on the same machine. Installing the Headless deb/rpm package creates the `printbridge` system user and enables the systemd system service automatically.

See [Deployment and configuration](./guide/deployment.md) for setup details.

import { existsSync } from 'node:fs'
import { mkdir, writeFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { pathToFileURL } from 'node:url'

const sourceUrl = 'https://github.com/vergil-lai/print-bridge/releases/latest/download/latest.json'
const outputPath = resolve('docs/public/releases/latest.json')

export function buildDownloadManifest(updater) {
  const version = updater.version

  if (!/^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/.test(version ?? '')) {
    throw new Error(`Unexpected updater version: ${version ?? '(missing)'}`)
  }

  const baseUrl = `https://github.com/vergil-lai/print-bridge/releases/download/printbridge-v${version}`
  const filenames = {
    'windows-x86_64-nsis': `PrintBridge_${version}_x64-setup.exe`,
    'windows-x86_64-msi': `PrintBridge_${version}_x64_en-US.msi`,
    'darwin-aarch64-dmg': `PrintBridge_${version}_aarch64.dmg`,
    'darwin-x86_64-dmg': `PrintBridge_${version}_x64.dmg`,
    'linux-x86_64-deb': `PrintBridge_${version}_amd64.deb`,
    'linux-x86_64-rpm': `PrintBridge-${version}-1.x86_64.rpm`,
    'linux-x86_64-appimage': `PrintBridge_${version}_amd64.AppImage`,
    'linux-aarch64-deb': `PrintBridge_${version}_arm64.deb`,
    'linux-aarch64-rpm': `PrintBridge-${version}-1.aarch64.rpm`,
    'linux-aarch64-appimage': `PrintBridge_${version}_aarch64.AppImage`,
    'linux-headless-x86_64-deb': `print-bridge-server_${version}_amd64.deb`,
    'linux-headless-x86_64-rpm': `print-bridge-server-${version}-1.x86_64.rpm`,
    'linux-headless-aarch64-deb': `print-bridge-server_${version}_arm64.deb`,
    'linux-headless-aarch64-rpm': `print-bridge-server-${version}-1.aarch64.rpm`
  }

  return {
    version,
    notes: updater.notes ?? '',
    pub_date: updater.pub_date,
    platforms: Object.fromEntries(
      Object.entries(filenames).map(([platformKey, filename]) => [
        platformKey,
        { url: `${baseUrl}/${filename}` }
      ])
    )
  }
}

async function main() {
  try {
    const response = await fetch(sourceUrl, { cache: 'no-store' })

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`)
    }

    const updater = await response.json()
    const manifest = `${JSON.stringify(buildDownloadManifest(updater), null, 2)}\n`

    await mkdir(dirname(outputPath), { recursive: true })
    await writeFile(outputPath, manifest)

    console.log(`Synced latest release manifest to ${outputPath}`)
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)

    if (existsSync(outputPath)) {
      console.warn(`Could not sync latest release manifest: ${message}`)
      console.warn(`Using cached manifest at ${outputPath}`)
      return
    }

    throw error
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main()
}

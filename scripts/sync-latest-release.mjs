import { existsSync } from 'node:fs'
import { mkdir, writeFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { pathToFileURL } from 'node:url'
import { buildDownloadManifest } from '../lib/download-manifest.mjs'

export { buildDownloadManifest } from '../lib/download-manifest.mjs'

const sourceUrl = 'https://github.com/vergil-lai/print-bridge/releases/latest/download/latest.json'
const outputPath = resolve('docs/public/releases/latest.json')

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

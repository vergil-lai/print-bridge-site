import { existsSync } from 'node:fs'
import { mkdir, writeFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'

const sourceUrl = 'https://github.com/vergil-lai/print-bridge/releases/latest/download/latest.json'
const outputPath = resolve('docs/public/releases/latest.json')

async function main() {
  try {
    const response = await fetch(sourceUrl, { cache: 'no-store' })

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`)
    }

    const manifest = await response.text()

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

main()

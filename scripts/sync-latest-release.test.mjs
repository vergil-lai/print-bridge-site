import assert from 'node:assert/strict'
import test from 'node:test'

import { buildDownloadManifest } from './sync-latest-release.mjs'

test('builds every desktop and headless download from the updater manifest', () => {
  const manifest = buildDownloadManifest({
    version: '0.2.0',
    notes: 'Release notes',
    pub_date: '2026-07-12T18:58:01Z'
  })

  assert.equal(manifest.version, '0.2.0')
  assert.equal(manifest.notes, 'Release notes')
  assert.equal(manifest.pub_date, '2026-07-12T18:58:01Z')
  assert.deepEqual(Object.keys(manifest.platforms), [
    'windows-x86_64-nsis',
    'windows-x86_64-msi',
    'darwin-aarch64-dmg',
    'darwin-x86_64-dmg',
    'linux-x86_64-deb',
    'linux-x86_64-rpm',
    'linux-x86_64-appimage',
    'linux-aarch64-deb',
    'linux-aarch64-rpm',
    'linux-aarch64-appimage',
    'linux-headless-x86_64-deb',
    'linux-headless-x86_64-rpm',
    'linux-headless-aarch64-deb',
    'linux-headless-aarch64-rpm'
  ])
  assert.equal(
    manifest.platforms['darwin-aarch64-dmg'].url,
    'https://github.com/vergil-lai/print-bridge/releases/download/printbridge-v0.2.0/PrintBridge_0.2.0_aarch64.dmg'
  )
  assert.equal(
    manifest.platforms['linux-headless-aarch64-rpm'].url,
    'https://github.com/vergil-lai/print-bridge/releases/download/printbridge-v0.2.0/print-bridge-server-0.2.0-1.aarch64.rpm'
  )
})

test('rejects versions outside the PrintBridge release format', () => {
  assert.throws(() => buildDownloadManifest({ version: 'latest' }), /Unexpected updater version/)
})

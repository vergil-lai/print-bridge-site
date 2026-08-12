import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

const scriptPath = new URL('../docs/public/install.ps1', import.meta.url)
const englishDownloadPath = new URL('../docs/download.md', import.meta.url)
const chineseDownloadPath = new URL('../docs/zh-CN/download.md', import.meta.url)
const installCommand = 'irm https://printbridge.pages.dev/install.ps1 | iex'

test('PowerShell installer resolves and verifies the latest x64 NSIS release asset', async () => {
  const script = await readFile(scriptPath, 'utf8')

  assert.match(
    script,
    /https:\/\/api\.github\.com\/repos\/\$repository\/releases\/latest/
  )
  assert.match(script, /_x64-setup\\\.exe/)
  assert.match(script, /\$asset\.digest -notmatch '\^sha256:/)
  assert.match(script, /Get-FileHash -Path \$installerPath -Algorithm SHA256/)
  assert.match(script, /-ArgumentList '\/S'/)
})

test('PowerShell installer cleans up its temporary directory', async () => {
  const script = await readFile(scriptPath, 'utf8')

  assert.match(script, /finally \{/)
  assert.match(
    script,
    /Remove-Item -Path \$temporaryDirectory -Recurse -Force/
  )
})

test('both download pages document the PowerShell installer command', async () => {
  const [english, chinese] = await Promise.all([
    readFile(englishDownloadPath, 'utf8'),
    readFile(chineseDownloadPath, 'utf8')
  ])

  assert.match(english, /### PowerShell \(Windows\)/)
  assert.match(chinese, /### PowerShell（Windows）/)
  assert.equal(english.split(installCommand).length - 1, 1)
  assert.equal(chinese.split(installCommand).length - 1, 1)
})

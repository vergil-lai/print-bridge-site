$ErrorActionPreference = 'Stop'

$repository = 'vergil-lai/print-bridge'
$releaseApi = "https://api.github.com/repos/$repository/releases/latest"
$assetPattern = '^PrintBridge_[0-9]+\.[0-9]+\.[0-9]+(?:-[0-9A-Za-z.-]+)?_x64-setup\.exe$'
$headers = @{
    Accept                 = 'application/vnd.github+json'
    'X-GitHub-Api-Version' = '2022-11-28'
    'User-Agent'           = 'PrintBridge-Installer'
}

if ($env:OS -ne 'Windows_NT') {
    throw 'PrintBridge can only be installed by this script on Windows.'
}

if ($PSVersionTable.PSVersion.Major -lt 5) {
    throw 'PowerShell 5.1 or later is required.'
}

$isX64 = $env:PROCESSOR_ARCHITECTURE -eq 'AMD64' -or
    $env:PROCESSOR_ARCHITEW6432 -eq 'AMD64'

if (-not $isX64) {
    throw 'This installer currently supports only x64 Windows.'
}

[Net.ServicePointManager]::SecurityProtocol =
    [Net.ServicePointManager]::SecurityProtocol -bor [Net.SecurityProtocolType]::Tls12

$temporaryDirectory = Join-Path ([System.IO.Path]::GetTempPath()) (
    'printbridge-install-{0}' -f [Guid]::NewGuid().ToString('N')
)
$previousProgressPreference = $ProgressPreference

try {
    Write-Host 'Finding the latest PrintBridge release...'
    $release = Invoke-RestMethod -Uri $releaseApi -Headers $headers
    $assets = @($release.assets | Where-Object { $_.name -match $assetPattern })

    if ($assets.Count -ne 1) {
        throw "Expected exactly one x64 Windows installer, found $($assets.Count)."
    }

    $asset = $assets[0]

    if ($asset.digest -notmatch '^sha256:([0-9a-fA-F]{64})$') {
        throw "The release asset $($asset.name) does not provide a valid SHA256 digest."
    }

    $expectedSha256 = $Matches[1]
    New-Item -ItemType Directory -Path $temporaryDirectory | Out-Null
    $installerPath = Join-Path $temporaryDirectory $asset.name

    Write-Host "Downloading PrintBridge $($release.tag_name)..."
    $ProgressPreference = 'SilentlyContinue'
    Invoke-WebRequest `
        -Uri $asset.browser_download_url `
        -Headers $headers `
        -OutFile $installerPath `
        -UseBasicParsing

    Write-Host 'Verifying SHA256 checksum...'
    $actualSha256 = (Get-FileHash -Path $installerPath -Algorithm SHA256).Hash

    if (-not [string]::Equals(
        $actualSha256,
        $expectedSha256,
        [System.StringComparison]::OrdinalIgnoreCase
    )) {
        throw "SHA256 verification failed for $($asset.name)."
    }

    Write-Host 'Installing PrintBridge...'
    $process = Start-Process `
        -FilePath $installerPath `
        -ArgumentList '/S' `
        -Wait `
        -PassThru

    if ($process.ExitCode -ne 0) {
        throw "The PrintBridge installer exited with code $($process.ExitCode)."
    }

    Write-Host 'PrintBridge was installed successfully.'
}
finally {
    $ProgressPreference = $previousProgressPreference

    if (Test-Path $temporaryDirectory) {
        Remove-Item -Path $temporaryDirectory -Recurse -Force
    }
}

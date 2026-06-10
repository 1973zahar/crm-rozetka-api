param(
  [string]$SourceRoot = (Split-Path -Parent $MyInvocation.MyCommand.Path),
  [string]$AppRoot = "C:\CRM\marketplace-crm",
  [string]$ProgramDataRoot = "C:\ProgramData\MarketplaceCRMLive",
  [int]$Port = 8798,
  [string]$ExpectedBuild = "20260610-roles-create-select-view-1",
  [string]$Url = "http://127.0.0.1:8798/index.html"
)

$ErrorActionPreference = "Stop"

function Stop-PortProcess {
  param([int]$TargetPort)
  $processIds = @()
  try {
    $processIds += Get-NetTCPConnection -LocalPort $TargetPort -State Listen -ErrorAction SilentlyContinue |
      Select-Object -ExpandProperty OwningProcess
  } catch {
    $processIds += @()
  }
  if (-not $processIds) {
    $lines = netstat -ano | Select-String ":$TargetPort" | Select-String "LISTENING"
    foreach ($line in $lines) {
      $parts = ($line.Line.Trim() -split "\s+")
      $pidText = $parts[-1]
      if ($pidText -match "^\d+$") { $processIds += [int]$pidText }
    }
  }
  foreach ($processId in ($processIds | Where-Object { $_ -and $_ -ne $PID } | Select-Object -Unique)) {
    Stop-Process -Id $processId -Force -ErrorAction SilentlyContinue
  }
}

$sourceRootFull = [System.IO.Path]::GetFullPath($SourceRoot)
$filesToCopy = @(
  "index.html",
  "styles.css",
  "app.js",
  "mock-api.ps1",
  "server-live.mjs",
  "start-marketplace-crm-meser.ps1",
  "start-marketplace-crm-live-meser.ps1",
  "open-marketplace-crm-live-meser.ps1"
)

foreach ($file in $filesToCopy) {
  $sourcePath = Join-Path $sourceRootFull $file
  if (-not (Test-Path -LiteralPath $sourcePath -PathType Leaf)) {
    throw "Missing source file: $sourcePath"
  }
}

New-Item -ItemType Directory -Path $AppRoot -Force | Out-Null
New-Item -ItemType Directory -Path (Join-Path $ProgramDataRoot "logs") -Force | Out-Null
New-Item -ItemType Directory -Path (Join-Path $ProgramDataRoot "config") -Force | Out-Null

foreach ($file in $filesToCopy) {
  Copy-Item -LiteralPath (Join-Path $sourceRootFull $file) -Destination (Join-Path $AppRoot $file) -Force
}

$taskName = "MarketplaceCRMLive"
Stop-ScheduledTask -TaskName $taskName -ErrorAction SilentlyContinue
Stop-PortProcess -TargetPort $Port
Start-ScheduledTask -TaskName $taskName
Start-Sleep -Seconds 4

$response = Invoke-WebRequest -UseBasicParsing -Uri $Url -TimeoutSec 15
$build = ""
if ($response.Content -match 'app\.js\?v=([^"''>]+)') {
  $build = $matches[1]
}
if ($build -ne $ExpectedBuild) {
  throw "MARKETPLACE_LIVE_LOCAL_PUBLISH_BUILD_MISMATCH: expected $ExpectedBuild, got $build"
}

[pscustomobject]@{
  ok = $true
  taskName = $taskName
  port = $Port
  url = $Url
  build = $build
  appRoot = $AppRoot
}

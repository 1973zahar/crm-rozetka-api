param(
  [int]$Port = 8797,
  [string]$BindAddress = "0.0.0.0",
  [string]$ProgramDataRoot = "C:\ProgramData\MarketplaceCRM",
  [string]$OneCToCRMPath = "D:\CRM_Exchange\ToCRM"
)

$ErrorActionPreference = "Stop"

$AppRoot = [System.IO.Path]::GetFullPath((Split-Path -Parent $MyInvocation.MyCommand.Path))
$LogDir = Join-Path $ProgramDataRoot "logs"
$CacheDir = Join-Path $ProgramDataRoot "cache"
$ConfigDir = Join-Path $ProgramDataRoot "config"
$EnvPath = Join-Path $ConfigDir "marketplace-crm.env"
$RuntimeNode = Join-Path $AppRoot "runtime\node\node.exe"

New-Item -ItemType Directory -Path $LogDir -Force | Out-Null
New-Item -ItemType Directory -Path $CacheDir -Force | Out-Null
New-Item -ItemType Directory -Path $ConfigDir -Force | Out-Null

$LaunchInfoPath = Join-Path $LogDir "marketplace-crm-launcher-info.txt"
$LaunchErrorPath = Join-Path $LogDir "marketplace-crm-launcher-error.txt"

function Stop-LegacyPortProcess {
  param([int]$TargetPort)
  $ProcessIds = @()
  try {
    $ProcessIds += Get-NetTCPConnection -LocalPort $TargetPort -State Listen -ErrorAction SilentlyContinue |
      Select-Object -ExpandProperty OwningProcess
  } catch {
    $ProcessIds += @()
  }
  if (-not $ProcessIds) {
    $NetstatLines = netstat -ano | Select-String ":$TargetPort" | Select-String "LISTENING"
    foreach ($Line in $NetstatLines) {
      $Parts = ($Line.Line.Trim() -split "\s+")
      $PidText = $Parts[-1]
      if ($PidText -match "^\d+$") { $ProcessIds += [int]$PidText }
    }
  }
  foreach ($ProcessId in ($ProcessIds | Where-Object { $_ -and $_ -ne $PID } | Select-Object -Unique)) {
    Add-Content -LiteralPath $LaunchInfoPath -Value "$(Get-Date -Format o) STOP_OLD_LISTENER port=$TargetPort pid=$ProcessId" -Encoding UTF8
    Stop-Process -Id $ProcessId -Force -ErrorAction SilentlyContinue
  }
}

$env:MARKETPLACE_CRM_ENV_PATH = $EnvPath
$env:CRM_LOG_PATH = Join-Path $LogDir "marketplace-crm-http.ndjson"
$env:NOVA_POSHTA_CACHE_PATH = Join-Path $CacheDir "nova-poshta-documents-cache.json"
$env:NOVAPAY_CACHE_PATH = Join-Path $CacheDir "novapay-payments-cache.json"
$env:NODE_SKIP_PLATFORM_CHECK = "1"

if (Test-Path -LiteralPath $RuntimeNode -PathType Leaf) {
  $env:ROZETKA_NODE_PATH = $RuntimeNode
}

if ([string]::IsNullOrWhiteSpace($env:CRM_SQL_API_BASE_URL)) {
  $env:CRM_SQL_API_BASE_URL = "http://192.168.0.166:3000"
}

Write-Host "Marketplace CRM MESER app root: $AppRoot"
Write-Host "Marketplace CRM runtime data: $ProgramDataRoot"
Write-Host "Marketplace CRM config: $EnvPath"
Write-Host "Marketplace CRM URL: http://$BindAddress`:$Port/index.html"

try {
  Set-Location -LiteralPath $AppRoot
  $startLine = "$(Get-Date -Format o) START port=$Port bind=$BindAddress app=$AppRoot programData=$ProgramDataRoot envPath=$EnvPath"
  Add-Content -LiteralPath $LaunchInfoPath -Value $startLine -Encoding UTF8
  Stop-LegacyPortProcess -TargetPort $Port

  & (Join-Path $AppRoot "mock-api.ps1") `
    -Port $Port `
    -BindAddress $BindAddress `
    -OneCToCRMPath $OneCToCRMPath `
    -LogPath $env:CRM_LOG_PATH
}
catch {
  $errorLine = "$(Get-Date -Format o) MARKETPLACE_CRM_LAUNCHER_FAILED $($_.Exception.Message)"
  Add-Content -LiteralPath $LaunchErrorPath -Value $errorLine -Encoding UTF8
  if ($_.ScriptStackTrace) {
    Add-Content -LiteralPath $LaunchErrorPath -Value $_.ScriptStackTrace -Encoding UTF8
  }
  throw
}

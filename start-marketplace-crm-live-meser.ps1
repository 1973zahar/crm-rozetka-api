param(
  [int]$Port = 8798,
  [string]$BindAddress = "0.0.0.0",
  [string]$ProgramDataRoot = "C:\ProgramData\MarketplaceCRMLive"
)

$ErrorActionPreference = "Stop"

$AppRoot = [System.IO.Path]::GetFullPath((Split-Path -Parent $MyInvocation.MyCommand.Path))
$LogDir = Join-Path $ProgramDataRoot "logs"
$ConfigDir = Join-Path $ProgramDataRoot "config"
$EnvPath = Join-Path $ConfigDir "marketplace-crm-live.env"
$RuntimeNode = Join-Path $AppRoot "runtime\node\node.exe"
$ServerScript = Join-Path $AppRoot "server-live.mjs"
$InfoPath = Join-Path $LogDir "marketplace-crm-live-launcher-info.txt"
$ErrorPath = Join-Path $LogDir "marketplace-crm-live-launcher-error.txt"

New-Item -ItemType Directory -Path $LogDir -Force | Out-Null
New-Item -ItemType Directory -Path $ConfigDir -Force | Out-Null

function Stop-LivePortProcess {
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
    try {
      Stop-Process -Id $ProcessId -Force -ErrorAction Stop
      Add-Content -LiteralPath $InfoPath -Encoding UTF8 -Value "$(Get-Date -Format o) STOP_OLD_LISTENER port=$TargetPort pid=$ProcessId"
    } catch {
      Add-Content -LiteralPath $ErrorPath -Encoding UTF8 -Value "$(Get-Date -Format o) STOP_OLD_LISTENER_FAILED port=$TargetPort pid=$ProcessId error=$($_.Exception.Message)"
    }
  }
}

$env:MARKETPLACE_CRM_ENV_PATH = $EnvPath
$env:MARKETPLACE_CRM_LEGACY_API_BASE_URL = if ([string]::IsNullOrWhiteSpace($env:MARKETPLACE_CRM_LEGACY_API_BASE_URL)) { "http://127.0.0.1:8797" } else { $env:MARKETPLACE_CRM_LEGACY_API_BASE_URL }
$env:NODE_SKIP_PLATFORM_CHECK = "1"

if ([string]::IsNullOrWhiteSpace($env:CRM_SQL_API_BASE_URL)) {
  $env:CRM_SQL_API_BASE_URL = "http://192.168.0.166:3000"
}

if (-not (Test-Path -LiteralPath $RuntimeNode -PathType Leaf)) {
  throw "Node runtime not found: $RuntimeNode"
}
if (-not (Test-Path -LiteralPath $ServerScript -PathType Leaf)) {
  throw "Live server script not found: $ServerScript"
}

try {
  Set-Location -LiteralPath $AppRoot
  Stop-LivePortProcess -TargetPort $Port
  Add-Content -LiteralPath $InfoPath -Encoding UTF8 -Value "$(Get-Date -Format o) START live port=$Port bind=$BindAddress app=$AppRoot envPath=$EnvPath sql=$env:CRM_SQL_API_BASE_URL legacy=$env:MARKETPLACE_CRM_LEGACY_API_BASE_URL"
  & $RuntimeNode $ServerScript --port $Port --bind $BindAddress
}
catch {
  Add-Content -LiteralPath $ErrorPath -Encoding UTF8 -Value "$(Get-Date -Format o) MARKETPLACE_CRM_LIVE_FAILED $($_.Exception.Message)"
  if ($_.ScriptStackTrace) {
    Add-Content -LiteralPath $ErrorPath -Encoding UTF8 -Value $_.ScriptStackTrace
  }
  throw
}

param(
  [int]$Port = 8797,
  [string]$Url = "http://192.168.0.5:8797/index.html",
  [string]$TaskName = "MarketplaceCRM",
  [string]$ProgramDataRoot = "C:\ProgramData\MarketplaceCRM",
  [int]$StartupWaitSeconds = 25
)

$ErrorActionPreference = "Stop"

$AppRoot = [System.IO.Path]::GetFullPath((Split-Path -Parent $MyInvocation.MyCommand.Path))
$LogDir = Join-Path $ProgramDataRoot "logs"
$ConfigDir = Join-Path $ProgramDataRoot "config"
$ConfigPath = Join-Path $ConfigDir "marketplace-crm.env"
$Launcher = Join-Path $AppRoot "start-marketplace-crm-meser.ps1"
$OpenLogPath = Join-Path $LogDir "marketplace-crm-open-link.txt"
$LaunchInfoPath = Join-Path $LogDir "marketplace-crm-launcher-info.txt"

New-Item -ItemType Directory -Path $LogDir -Force | Out-Null
New-Item -ItemType Directory -Path $ConfigDir -Force | Out-Null

function Add-OpenLinkLog($Message) {
  Add-Content -LiteralPath $OpenLogPath -Encoding UTF8 -Value "$(Get-Date -Format o) $Message"
}

function Test-MarketplaceCrmPort {
  $client = New-Object System.Net.Sockets.TcpClient
  try {
    $async = $client.BeginConnect("127.0.0.1", $Port, $null, $null)
    if (-not $async.AsyncWaitHandle.WaitOne(800, $false)) {
      return $false
    }
    $client.EndConnect($async)
    return $true
  }
  catch {
    return $false
  }
  finally {
    $client.Close()
  }
}

function Wait-MarketplaceCrmPort {
  param([int]$Seconds)
  $deadline = (Get-Date).AddSeconds($Seconds)
  while ((Get-Date) -lt $deadline) {
    if (Test-MarketplaceCrmPort) {
      return $true
    }
    Start-Sleep -Milliseconds 500
  }
  return Test-MarketplaceCrmPort
}

function Test-ConfigNewerThanServerStart {
  if (-not (Test-Path -LiteralPath $ConfigPath -PathType Leaf)) {
    return $false
  }
  if (-not (Test-Path -LiteralPath $LaunchInfoPath -PathType Leaf)) {
    return $true
  }
  return ((Get-Item -LiteralPath $ConfigPath).LastWriteTimeUtc -gt (Get-Item -LiteralPath $LaunchInfoPath).LastWriteTimeUtc)
}

function Wait-MarketplaceCrmPortClosed {
  param([int]$Seconds)
  $deadline = (Get-Date).AddSeconds($Seconds)
  while ((Get-Date) -lt $deadline) {
    if (-not (Test-MarketplaceCrmPort)) {
      return $true
    }
    Start-Sleep -Milliseconds 500
  }
  return -not (Test-MarketplaceCrmPort)
}

function Show-MarketplaceCrmMessage($Message) {
  try {
    $shell = New-Object -ComObject WScript.Shell
    $shell.Popup($Message, 0, "Marketplace CRM", 48) | Out-Null
  }
  catch {
    Write-Host $Message
  }
}

Add-OpenLinkLog "OPEN_REQUEST url=$Url port=$Port"

$PortOpen = Test-MarketplaceCrmPort
$ConfigChanged = $PortOpen -and (Test-ConfigNewerThanServerStart)
if ($ConfigChanged) {
  Add-OpenLinkLog "CONFIG_CHANGED restarting task=$TaskName config=$ConfigPath"
  Stop-ScheduledTask -TaskName $TaskName -ErrorAction SilentlyContinue
  [void](Wait-MarketplaceCrmPortClosed -Seconds 10)
  $PortOpen = Test-MarketplaceCrmPort
}

if (-not $PortOpen) {
  Add-OpenLinkLog "PORT_CLOSED starting task=$TaskName"
  $task = Get-ScheduledTask -TaskName $TaskName -ErrorAction SilentlyContinue
  if ($task) {
    Start-ScheduledTask -TaskName $TaskName -ErrorAction SilentlyContinue
  }
  elseif (Test-Path -LiteralPath $Launcher -PathType Leaf) {
    Add-OpenLinkLog "TASK_MISSING starting launcher=$Launcher"
    Start-Process -FilePath "powershell.exe" `
      -ArgumentList @("-NoProfile", "-ExecutionPolicy", "Bypass", "-File", $Launcher, "-Port", $Port, "-BindAddress", "0.0.0.0", "-ProgramDataRoot", $ProgramDataRoot) `
      -WorkingDirectory $AppRoot `
      -WindowStyle Hidden
  }
}

if (-not (Wait-MarketplaceCrmPort -Seconds $StartupWaitSeconds)) {
  Add-OpenLinkLog "START_FAILED port=$Port"
  Show-MarketplaceCrmMessage "Marketplace CRM не стартував на порту $Port. Перевірте C:\ProgramData\MarketplaceCRM\logs\marketplace-crm-launcher-error.txt"
  exit 1
}

Add-OpenLinkLog "OPEN_BROWSER url=$Url"
Start-Process $Url

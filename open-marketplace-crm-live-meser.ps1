param(
  [int]$Port = 8798,
  [string]$Url = "http://192.168.0.5:8798/index.html",
  [string]$TaskName = "MarketplaceCRMLive",
  [string]$ProgramDataRoot = "C:\ProgramData\MarketplaceCRMLive",
  [int]$StartupWaitSeconds = 25
)

$ErrorActionPreference = "Stop"

$AppRoot = [System.IO.Path]::GetFullPath((Split-Path -Parent $MyInvocation.MyCommand.Path))
$LogDir = Join-Path $ProgramDataRoot "logs"
$ConfigDir = Join-Path $ProgramDataRoot "config"
$ConfigPath = Join-Path $ConfigDir "marketplace-crm-live.env"
$Launcher = Join-Path $AppRoot "start-marketplace-crm-live-meser.ps1"
$OpenLogPath = Join-Path $LogDir "marketplace-crm-live-open-link.txt"
$LaunchInfoPath = Join-Path $LogDir "marketplace-crm-live-launcher-info.txt"

New-Item -ItemType Directory -Path $LogDir -Force | Out-Null
New-Item -ItemType Directory -Path $ConfigDir -Force | Out-Null

function Add-OpenLinkLog($Message) {
  Add-Content -LiteralPath $OpenLogPath -Encoding UTF8 -Value "$(Get-Date -Format o) $Message"
}

function Test-LivePort {
  $client = New-Object System.Net.Sockets.TcpClient
  try {
    $async = $client.BeginConnect("127.0.0.1", $Port, $null, $null)
    if (-not $async.AsyncWaitHandle.WaitOne(800, $false)) { return $false }
    $client.EndConnect($async)
    return $true
  } catch {
    return $false
  } finally {
    $client.Close()
  }
}

function Wait-LivePort([int]$Seconds) {
  $deadline = (Get-Date).AddSeconds($Seconds)
  while ((Get-Date) -lt $deadline) {
    if (Test-LivePort) { return $true }
    Start-Sleep -Milliseconds 500
  }
  return Test-LivePort
}

function Wait-LivePortClosed([int]$Seconds) {
  $deadline = (Get-Date).AddSeconds($Seconds)
  while ((Get-Date) -lt $deadline) {
    if (-not (Test-LivePort)) { return $true }
    Start-Sleep -Milliseconds 500
  }
  return -not (Test-LivePort)
}

function Stop-LivePortProcess {
  $ProcessIds = @()
  try {
    $ProcessIds += Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction SilentlyContinue |
      Select-Object -ExpandProperty OwningProcess
  } catch {
    $ProcessIds += @()
  }
  if (-not $ProcessIds) {
    $NetstatLines = netstat -ano | Select-String ":$Port" | Select-String "LISTENING"
    foreach ($Line in $NetstatLines) {
      $Parts = ($Line.Line.Trim() -split "\s+")
      $PidText = $Parts[-1]
      if ($PidText -match "^\d+$") { $ProcessIds += [int]$PidText }
    }
  }
  foreach ($ProcessId in ($ProcessIds | Where-Object { $_ -and $_ -ne $PID } | Select-Object -Unique)) {
    try {
      Stop-Process -Id $ProcessId -Force -ErrorAction Stop
      Add-OpenLinkLog "STOP_OLD_LISTENER port=$Port pid=$ProcessId"
    } catch {
      Add-OpenLinkLog "STOP_OLD_LISTENER_FAILED port=$Port pid=$ProcessId error=$($_.Exception.Message)"
    }
  }
}

function Test-ConfigNewerThanServerStart {
  if (-not (Test-Path -LiteralPath $ConfigPath -PathType Leaf)) { return $false }
  if (-not (Test-Path -LiteralPath $LaunchInfoPath -PathType Leaf)) { return $true }
  return ((Get-Item -LiteralPath $ConfigPath).LastWriteTimeUtc -gt (Get-Item -LiteralPath $LaunchInfoPath).LastWriteTimeUtc)
}

Add-OpenLinkLog "OPEN_REQUEST url=$Url port=$Port"

$PortOpen = Test-LivePort
if ($PortOpen -and (Test-ConfigNewerThanServerStart)) {
  Add-OpenLinkLog "CONFIG_CHANGED restarting task=$TaskName"
  Stop-ScheduledTask -TaskName $TaskName -ErrorAction SilentlyContinue
  [void](Wait-LivePortClosed -Seconds 10)
  if (Test-LivePort) {
    Stop-LivePortProcess
    [void](Wait-LivePortClosed -Seconds 5)
  }
  $PortOpen = Test-LivePort
}

if (-not $PortOpen) {
  Add-OpenLinkLog "PORT_CLOSED starting task=$TaskName"
  $task = Get-ScheduledTask -TaskName $TaskName -ErrorAction SilentlyContinue
  if ($task) {
    Start-ScheduledTask -TaskName $TaskName -ErrorAction SilentlyContinue
  } elseif (Test-Path -LiteralPath $Launcher -PathType Leaf) {
    Start-Process -FilePath "powershell.exe" `
      -ArgumentList @("-NoProfile", "-ExecutionPolicy", "Bypass", "-File", $Launcher, "-Port", $Port, "-BindAddress", "0.0.0.0", "-ProgramDataRoot", $ProgramDataRoot) `
      -WorkingDirectory $AppRoot `
      -WindowStyle Hidden
  }
}

if (-not (Wait-LivePort -Seconds $StartupWaitSeconds)) {
  Add-OpenLinkLog "START_FAILED port=$Port"
  exit 1
}

Add-OpenLinkLog "OPEN_BROWSER url=$Url"
Start-Process $Url

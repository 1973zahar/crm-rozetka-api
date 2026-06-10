param(
  [string]$ComputerName = "192.168.0.5",
  [string]$CredentialPath = "$env:USERPROFILE\.ssh\meser-fresh-zahar.credential.xml",
  [string]$RemoteAppRoot = "C:\CRM\marketplace-crm",
  [string]$RemoteProgramDataRoot = "C:\ProgramData\MarketplaceCRMLive",
  [int]$Port = 8798,
  [string]$Url = "http://192.168.0.5:8798/index.html",
  [switch]$RestartLegacy
)

$ErrorActionPreference = "Stop"

$LocalRoot = [System.IO.Path]::GetFullPath((Split-Path -Parent $MyInvocation.MyCommand.Path))
$RuntimeNodeSource = "C:\Users\User\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe"
$FilesToCopy = @(
  "index.html",
  "styles.css",
  "app.js",
  "mock-api.ps1",
  "server-live.mjs",
  "start-marketplace-crm-meser.ps1",
  "start-marketplace-crm-live-meser.ps1",
  "open-marketplace-crm-live-meser.ps1"
)

foreach ($File in $FilesToCopy) {
  $Path = Join-Path $LocalRoot $File
  if (-not (Test-Path -LiteralPath $Path -PathType Leaf)) {
    throw "Missing file: $Path"
  }
}
if (-not (Test-Path -LiteralPath $RuntimeNodeSource -PathType Leaf)) {
  throw "Missing bundled Node runtime: $RuntimeNodeSource"
}

$Credential = Import-Clixml $CredentialPath
$Session = New-PSSession -ComputerName $ComputerName -Credential $Credential
try {
  Invoke-Command -Session $Session -ScriptBlock {
    param($AppRoot, $ProgramDataRoot)
    New-Item -ItemType Directory -Path $AppRoot -Force | Out-Null
    New-Item -ItemType Directory -Path (Join-Path $AppRoot "runtime\node") -Force | Out-Null
    New-Item -ItemType Directory -Path (Join-Path $ProgramDataRoot "logs") -Force | Out-Null
    New-Item -ItemType Directory -Path (Join-Path $ProgramDataRoot "config") -Force | Out-Null
  } -ArgumentList $RemoteAppRoot, $RemoteProgramDataRoot

  foreach ($File in $FilesToCopy) {
    Copy-Item -ToSession $Session -LiteralPath (Join-Path $LocalRoot $File) -Destination (Join-Path $RemoteAppRoot $File) -Force
  }
  $RemoteNodePath = Join-Path $RemoteAppRoot "runtime\node\node.exe"
  $RuntimeNodeLength = (Get-Item -LiteralPath $RuntimeNodeSource).Length
  $ShouldCopyNode = Invoke-Command -Session $Session -ScriptBlock {
    param($Path, $ExpectedLength)
    $Item = Get-Item -LiteralPath $Path -ErrorAction SilentlyContinue
    return (-not $Item) -or ($Item.Length -ne $ExpectedLength)
  } -ArgumentList $RemoteNodePath, $RuntimeNodeLength
  if ($ShouldCopyNode) {
    Stop-ScheduledTask -TaskName "MarketplaceCRMLive" -ErrorAction SilentlyContinue
    Copy-Item -ToSession $Session -LiteralPath $RuntimeNodeSource -Destination $RemoteNodePath -Force
  }

  Invoke-Command -Session $Session -ScriptBlock {
    param($AppRoot, $ProgramDataRoot, $Port, $Url, $RestartLegacy)
    $TaskName = "MarketplaceCRMLive"
    $Launcher = Join-Path $AppRoot "start-marketplace-crm-live-meser.ps1"
    $OpenScript = Join-Path $AppRoot "open-marketplace-crm-live-meser.ps1"
    $ConfigDir = Join-Path $ProgramDataRoot "config"
    $ConfigPath = Join-Path $ConfigDir "marketplace-crm-live.env"
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
        Stop-Process -Id $ProcessId -Force -ErrorAction SilentlyContinue
      }
    }
    if (-not (Test-Path -LiteralPath $ConfigPath -PathType Leaf)) {
      @(
        "CRM_SQL_API_BASE_URL=http://192.168.0.166:3000",
        "CRM_SQL_API_TIMEOUT_SEC=15",
        "MARKETPLACE_CRM_LEGACY_API_BASE_URL=http://127.0.0.1:8797"
      ) | Set-Content -LiteralPath $ConfigPath -Encoding UTF8
    }

    $Action = New-ScheduledTaskAction -Execute "powershell.exe" -Argument "-NoProfile -ExecutionPolicy Bypass -File `"$Launcher`" -Port $Port -BindAddress 0.0.0.0 -ProgramDataRoot `"$ProgramDataRoot`""
    $CurrentUser = [System.Security.Principal.WindowsIdentity]::GetCurrent().Name
    $Trigger = New-ScheduledTaskTrigger -AtLogOn -User $CurrentUser
    $Principal = New-ScheduledTaskPrincipal -UserId $CurrentUser -LogonType Interactive -RunLevel Highest
    $Settings = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries -MultipleInstances IgnoreNew -RestartCount 3 -RestartInterval (New-TimeSpan -Minutes 1)
    Register-ScheduledTask -TaskName $TaskName -Action $Action -Trigger $Trigger -Principal $Principal -Settings $Settings -Force | Out-Null

    Stop-ScheduledTask -TaskName $TaskName -ErrorAction SilentlyContinue
    Stop-LivePortProcess -TargetPort $Port
    Start-ScheduledTask -TaskName $TaskName
    if ($RestartLegacy) {
      $LegacyTaskName = "MarketplaceCRM"
      $LegacyTask = Get-ScheduledTask -TaskName $LegacyTaskName -ErrorAction SilentlyContinue
      if ($LegacyTask) {
        Stop-ScheduledTask -TaskName $LegacyTaskName -ErrorAction SilentlyContinue
        Stop-LivePortProcess -TargetPort 8797
        Start-ScheduledTask -TaskName $LegacyTaskName
      }
    }
    Start-Sleep -Seconds 3

    $PowerShellPath = Join-Path $env:SystemRoot "System32\WindowsPowerShell\v1.0\powershell.exe"
    $NotepadPath = Join-Path $env:SystemRoot "System32\notepad.exe"
    $Shell = New-Object -ComObject WScript.Shell
    $ShortcutDirs = @(
      [Environment]::GetFolderPath("Desktop"),
      [Environment]::GetFolderPath("CommonDesktopDirectory"),
      (Join-Path ([Environment]::GetFolderPath("Programs")) "Marketplace CRM Live")
    ) | Where-Object { -not [string]::IsNullOrWhiteSpace($_) } | Select-Object -Unique
    $OpenShortcuts = @()
    $ConfigShortcuts = @()
    foreach ($Directory in $ShortcutDirs) {
      New-Item -ItemType Directory -Path $Directory -Force | Out-Null
      $ShortcutPath = Join-Path $Directory "Marketplace CRM Live.lnk"
      $Shortcut = $Shell.CreateShortcut($ShortcutPath)
      $Shortcut.TargetPath = $PowerShellPath
      $Shortcut.Arguments = "-NoProfile -ExecutionPolicy Bypass -File `"$OpenScript`" -Port $Port -Url `"$Url`""
      $Shortcut.WorkingDirectory = $AppRoot
      $Shortcut.IconLocation = "$env:SystemRoot\System32\shell32.dll,220"
      $Shortcut.Description = "Start and open Marketplace CRM Live"
      $Shortcut.Save()
      $OpenShortcuts += $ShortcutPath

      $ConfigShortcutPath = Join-Path $Directory "Marketplace CRM Live Config.lnk"
      $ConfigShortcut = $Shell.CreateShortcut($ConfigShortcutPath)
      $ConfigShortcut.TargetPath = $NotepadPath
      $ConfigShortcut.Arguments = "`"$ConfigPath`""
      $ConfigShortcut.WorkingDirectory = $ConfigDir
      $ConfigShortcut.IconLocation = "$env:SystemRoot\System32\shell32.dll,70"
      $ConfigShortcut.Description = "Edit Marketplace CRM Live config"
      $ConfigShortcut.Save()
      $ConfigShortcuts += $ConfigShortcutPath
    }

    $Task = Get-ScheduledTask -TaskName $TaskName
    $TaskInfo = Get-ScheduledTaskInfo -TaskName $TaskName
    $Ports = netstat -ano | Select-String ":$Port"
    [pscustomobject]@{
      TaskName = $TaskName
      User = $CurrentUser
      TaskState = $Task.State.ToString()
      LastTaskResult = $TaskInfo.LastTaskResult
      Url = $Url
      AppRoot = $AppRoot
      ProgramDataRoot = $ProgramDataRoot
      ConfigPath = $ConfigPath
      Ports = if ($Ports) { ($Ports | ForEach-Object { $_.Line.Trim() }) -join "; " } else { "none" }
      OpenShortcuts = $OpenShortcuts
      ConfigShortcuts = $ConfigShortcuts
    }
  } -ArgumentList $RemoteAppRoot, $RemoteProgramDataRoot, $Port, $Url, [bool]$RestartLegacy
}
finally {
  Remove-PSSession $Session
}

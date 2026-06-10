param(
  [string]$ComputerName = "192.168.0.5",
  [string]$CredentialPath = "$env:USERPROFILE\.ssh\meser-fresh-zahar.credential.xml",
  [string]$RemoteAppRoot = "C:\CRM\marketplace-crm",
  [string]$RemoteProgramDataRoot = "C:\ProgramData\MarketplaceCRM",
  [int]$Port = 8797,
  [string]$Url = "http://192.168.0.5:8797/index.html"
)

$ErrorActionPreference = "Stop"

$LocalRoot = [System.IO.Path]::GetFullPath((Split-Path -Parent $MyInvocation.MyCommand.Path))
$OpenScript = Join-Path $LocalRoot "open-marketplace-crm-meser.ps1"
$LauncherScript = Join-Path $LocalRoot "start-marketplace-crm-meser.ps1"
$MockApiScript = Join-Path $LocalRoot "mock-api.ps1"
$ConfigTemplate = Join-Path $LocalRoot "config\marketplace-crm.env.template"

if (-not (Test-Path -LiteralPath $OpenScript -PathType Leaf)) {
  throw "Missing open script: $OpenScript"
}
if (-not (Test-Path -LiteralPath $LauncherScript -PathType Leaf)) {
  throw "Missing launcher script: $LauncherScript"
}
if (-not (Test-Path -LiteralPath $MockApiScript -PathType Leaf)) {
  throw "Missing mock API script: $MockApiScript"
}
if (-not (Test-Path -LiteralPath $ConfigTemplate -PathType Leaf)) {
  throw "Missing config template: $ConfigTemplate"
}

$Credential = Import-Clixml $CredentialPath
$Session = New-PSSession -ComputerName $ComputerName -Credential $Credential
try {
  Invoke-Command -Session $Session -ScriptBlock {
    param($AppRoot, $ProgramDataRoot)
    New-Item -ItemType Directory -Path $AppRoot -Force | Out-Null
    New-Item -ItemType Directory -Path (Join-Path $ProgramDataRoot "config") -Force | Out-Null
  } -ArgumentList $RemoteAppRoot, $RemoteProgramDataRoot

  Copy-Item -ToSession $Session -LiteralPath $OpenScript -Destination (Join-Path $RemoteAppRoot "open-marketplace-crm-meser.ps1") -Force
  Copy-Item -ToSession $Session -LiteralPath $LauncherScript -Destination (Join-Path $RemoteAppRoot "start-marketplace-crm-meser.ps1") -Force
  Copy-Item -ToSession $Session -LiteralPath $MockApiScript -Destination (Join-Path $RemoteAppRoot "mock-api.ps1") -Force
  Copy-Item -ToSession $Session -LiteralPath $ConfigTemplate -Destination (Join-Path $RemoteProgramDataRoot "config\marketplace-crm.env.template") -Force

  Invoke-Command -Session $Session -ScriptBlock {
    param($AppRoot, $ProgramDataRoot, $Port, $Url)

    $ScriptPath = Join-Path $AppRoot "open-marketplace-crm-meser.ps1"
    $ConfigDir = Join-Path $ProgramDataRoot "config"
    $ConfigPath = Join-Path $ConfigDir "marketplace-crm.env"
    $ConfigTemplatePath = Join-Path $ConfigDir "marketplace-crm.env.template"
    $PowerShellPath = Join-Path $env:SystemRoot "System32\WindowsPowerShell\v1.0\powershell.exe"
    $NotepadPath = Join-Path $env:SystemRoot "System32\notepad.exe"
    $ShortcutName = "Marketplace CRM.lnk"
    $ConfigShortcutName = "Marketplace CRM Config.lnk"
    $ShortcutArgs = "-NoProfile -ExecutionPolicy Bypass -File `"$ScriptPath`" -Port $Port -Url `"$Url`""
    $Shell = New-Object -ComObject WScript.Shell
    $Created = @()
    $ConfigShortcuts = @()

    if (-not (Test-Path -LiteralPath $ConfigPath -PathType Leaf)) {
      Copy-Item -LiteralPath $ConfigTemplatePath -Destination $ConfigPath -Force
    }

    $ShortcutDirectories = @(
      [Environment]::GetFolderPath("Desktop"),
      [Environment]::GetFolderPath("CommonDesktopDirectory"),
      (Join-Path ([Environment]::GetFolderPath("Programs")) "Marketplace CRM")
    ) | Where-Object { -not [string]::IsNullOrWhiteSpace($_) } | Select-Object -Unique

    foreach ($Directory in $ShortcutDirectories) {
      New-Item -ItemType Directory -Path $Directory -Force | Out-Null
      $ShortcutPath = Join-Path $Directory $ShortcutName
      $Shortcut = $Shell.CreateShortcut($ShortcutPath)
      $Shortcut.TargetPath = $PowerShellPath
      $Shortcut.Arguments = $ShortcutArgs
      $Shortcut.WorkingDirectory = $AppRoot
      $Shortcut.IconLocation = "$env:SystemRoot\System32\shell32.dll,220"
      $Shortcut.Description = "Start and open Marketplace CRM"
      $Shortcut.Save()
      $Created += $ShortcutPath

      $ConfigShortcutPath = Join-Path $Directory $ConfigShortcutName
      $ConfigShortcut = $Shell.CreateShortcut($ConfigShortcutPath)
      $ConfigShortcut.TargetPath = $NotepadPath
      $ConfigShortcut.Arguments = "`"$ConfigPath`""
      $ConfigShortcut.WorkingDirectory = $ConfigDir
      $ConfigShortcut.IconLocation = "$env:SystemRoot\System32\shell32.dll,70"
      $ConfigShortcut.Description = "Edit local Marketplace CRM integration config"
      $ConfigShortcut.Save()
      $ConfigShortcuts += $ConfigShortcutPath
    }

    $Task = Get-ScheduledTask -TaskName "MarketplaceCRM" -ErrorAction SilentlyContinue
    $TaskInfo = if ($Task) { Get-ScheduledTaskInfo -TaskName "MarketplaceCRM" } else { $null }
    [pscustomobject]@{
      Url = $Url
      Port = $Port
      OpenScript = $ScriptPath
      ConfigPath = $ConfigPath
      Shortcuts = $Created
      ConfigShortcuts = $ConfigShortcuts
      TaskState = if ($Task) { $Task.State.ToString() } else { "missing" }
      LastTaskResult = if ($TaskInfo) { $TaskInfo.LastTaskResult } else { $null }
    }
  } -ArgumentList $RemoteAppRoot, $RemoteProgramDataRoot, $Port, $Url
}
finally {
  Remove-PSSession $Session
}

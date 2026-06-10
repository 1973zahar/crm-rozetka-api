param(
  [string]$ComputerName = "192.168.0.5",
  [string]$CredentialPath = "$env:USERPROFILE\.ssh\meser-fresh-zahar.credential.xml",
  [string]$RemoteAppRoot = "C:\CRM\marketplace-crm",
  [string]$RemoteProgramDataRoot = "C:\ProgramData\MarketplaceCRM",
  [int]$Port = 8797
)

$ErrorActionPreference = "Stop"

$LocalRoot = [System.IO.Path]::GetFullPath((Split-Path -Parent $MyInvocation.MyCommand.Path))
$PackageRoot = Join-Path $env:TEMP "marketplace-crm-meser-package"
$RuntimeNodeSource = "C:\Users\User\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe"

$ExcludeDirectories = @(".git", ".cache", ".secrets", "node_modules")
$ExcludeFiles = @(".env", ".secrets", "crm-http.ndjson", "crm-http*.ndjson", "server-start*.log")

if (Test-Path -LiteralPath $PackageRoot) {
  Remove-Item -LiteralPath $PackageRoot -Recurse -Force
}
New-Item -ItemType Directory -Path $PackageRoot -Force | Out-Null

Get-ChildItem -LiteralPath $LocalRoot -Force | ForEach-Object {
  if ($_.PSIsContainer -and $ExcludeDirectories -contains $_.Name) { return }
  foreach ($Pattern in $ExcludeFiles) {
    if (-not $_.PSIsContainer -and $_.Name -like $Pattern) { return }
  }
  Copy-Item -LiteralPath $_.FullName -Destination (Join-Path $PackageRoot $_.Name) -Recurse -Force
}

$RuntimeNodeTarget = Join-Path $PackageRoot "runtime\node"
New-Item -ItemType Directory -Path $RuntimeNodeTarget -Force | Out-Null
if (Test-Path -LiteralPath $RuntimeNodeSource -PathType Leaf) {
  Copy-Item -LiteralPath $RuntimeNodeSource -Destination (Join-Path $RuntimeNodeTarget "node.exe") -Force
}

$Credential = Import-Clixml $CredentialPath
$Session = New-PSSession -ComputerName $ComputerName -Credential $Credential
try {
  Invoke-Command -Session $Session -ScriptBlock {
    param($AppRoot, $ProgramDataRoot)
    New-Item -ItemType Directory -Path $AppRoot -Force | Out-Null
    New-Item -ItemType Directory -Path (Join-Path $ProgramDataRoot "logs") -Force | Out-Null
    New-Item -ItemType Directory -Path (Join-Path $ProgramDataRoot "cache") -Force | Out-Null
    New-Item -ItemType Directory -Path (Join-Path $ProgramDataRoot "config") -Force | Out-Null
  } -ArgumentList $RemoteAppRoot, $RemoteProgramDataRoot

  Copy-Item -ToSession $Session -Path (Join-Path $PackageRoot "*") -Destination $RemoteAppRoot -Recurse -Force

  Invoke-Command -Session $Session -ScriptBlock {
    param($AppRoot, $ProgramDataRoot, $Port)
    $TaskName = "MarketplaceCRM"
    $Launcher = Join-Path $AppRoot "start-marketplace-crm-meser.ps1"
    $OpenScript = Join-Path $AppRoot "open-marketplace-crm-meser.ps1"
    $AppUrl = "http://192.168.0.5`:$Port/index.html"
    $ConfigDir = Join-Path $ProgramDataRoot "config"
    $ConfigPath = Join-Path $ConfigDir "marketplace-crm.env"
    $ConfigTemplatePath = Join-Path $AppRoot "config\marketplace-crm.env.template"
    $Action = New-ScheduledTaskAction -Execute "powershell.exe" -Argument "-NoProfile -ExecutionPolicy Bypass -File `"$Launcher`" -Port $Port -BindAddress 0.0.0.0 -ProgramDataRoot `"$ProgramDataRoot`""
    $CurrentUser = [System.Security.Principal.WindowsIdentity]::GetCurrent().Name
    $Trigger = New-ScheduledTaskTrigger -AtLogOn -User $CurrentUser
    $Principal = New-ScheduledTaskPrincipal -UserId $CurrentUser -LogonType Interactive -RunLevel Highest
    $Settings = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries -MultipleInstances IgnoreNew -RestartCount 3 -RestartInterval (New-TimeSpan -Minutes 1)
    Register-ScheduledTask -TaskName $TaskName -Action $Action -Trigger $Trigger -Principal $Principal -Settings $Settings -Force | Out-Null

    Stop-ScheduledTask -TaskName $TaskName -ErrorAction SilentlyContinue
    Start-ScheduledTask -TaskName $TaskName
    Start-Sleep -Seconds 2

    if (Test-Path -LiteralPath $ConfigTemplatePath -PathType Leaf) {
      Copy-Item -LiteralPath $ConfigTemplatePath -Destination (Join-Path $ConfigDir "marketplace-crm.env.template") -Force
      if (-not (Test-Path -LiteralPath $ConfigPath -PathType Leaf)) {
        Copy-Item -LiteralPath $ConfigTemplatePath -Destination $ConfigPath -Force
      }
    }

    if (Test-Path -LiteralPath $OpenScript -PathType Leaf) {
      $PowerShellPath = Join-Path $env:SystemRoot "System32\WindowsPowerShell\v1.0\powershell.exe"
      $NotepadPath = Join-Path $env:SystemRoot "System32\notepad.exe"
      $ShortcutName = "Marketplace CRM.lnk"
      $ConfigShortcutName = "Marketplace CRM Config.lnk"
      $ShortcutArgs = "-NoProfile -ExecutionPolicy Bypass -File `"$OpenScript`" -Port $Port -Url `"$AppUrl`""
      $Shell = New-Object -ComObject WScript.Shell
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

        $ConfigShortcutPath = Join-Path $Directory $ConfigShortcutName
        $ConfigShortcut = $Shell.CreateShortcut($ConfigShortcutPath)
        $ConfigShortcut.TargetPath = $NotepadPath
        $ConfigShortcut.Arguments = "`"$ConfigPath`""
        $ConfigShortcut.WorkingDirectory = $ConfigDir
        $ConfigShortcut.IconLocation = "$env:SystemRoot\System32\shell32.dll,70"
        $ConfigShortcut.Description = "Edit local Marketplace CRM integration config"
        $ConfigShortcut.Save()
      }
    }

    [pscustomobject]@{
      TaskName = $TaskName
      User = $CurrentUser
      AppRoot = $AppRoot
      ProgramDataRoot = $ProgramDataRoot
      ConfigPath = $ConfigPath
      Port = $Port
      TaskState = (Get-ScheduledTask -TaskName $TaskName).State
      Url = $AppUrl
    }
  } -ArgumentList $RemoteAppRoot, $RemoteProgramDataRoot, $Port
}
finally {
  Remove-PSSession $Session
}

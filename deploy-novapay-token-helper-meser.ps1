param(
  [string]$ComputerName = "192.168.0.5",
  [string]$CredentialPath = "$env:USERPROFILE\.ssh\meser-fresh-zahar.credential.xml",
  [string]$RemotePath = "C:\CRM\marketplace-crm\set-novapay-token-meser.ps1"
)

$ErrorActionPreference = "Stop"

$LocalRoot = [System.IO.Path]::GetFullPath((Split-Path -Parent $MyInvocation.MyCommand.Path))
$LocalPath = Join-Path $LocalRoot "set-novapay-token-meser.ps1"

if (-not (Test-Path -LiteralPath $LocalPath -PathType Leaf)) {
  throw "Missing local helper: $LocalPath"
}

$Credential = Import-Clixml $CredentialPath
$Session = New-PSSession -ComputerName $ComputerName -Credential $Credential
try {
  Invoke-Command -Session $Session -ScriptBlock {
    param($Path)
    New-Item -ItemType Directory -Path (Split-Path -Parent $Path) -Force | Out-Null
  } -ArgumentList $RemotePath

  Copy-Item -ToSession $Session -LiteralPath $LocalPath -Destination $RemotePath -Force

  Invoke-Command -Session $Session -ScriptBlock {
    param($Path)
    $errors = $null
    [System.Management.Automation.PSParser]::Tokenize((Get-Content -Raw -Encoding UTF8 $Path), [ref]$errors) | Out-Null
    if ($errors) {
      [pscustomobject]@{
        Status = "parser-error"
        Path = $Path
        Errors = ($errors | ForEach-Object { $_.Message }) -join "; "
      }
      return
    }
    $Item = Get-Item -LiteralPath $Path
    [pscustomobject]@{
      Status = "ok"
      Path = $Path
      Length = $Item.Length
      LastWriteTime = $Item.LastWriteTime
    }
  } -ArgumentList $RemotePath
}
finally {
  Remove-PSSession $Session
}

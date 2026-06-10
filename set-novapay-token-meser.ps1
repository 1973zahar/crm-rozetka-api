param(
  [ValidateSet("RefreshToken", "GatewayToken")]
  [string]$TokenType = "RefreshToken",
  [string]$GatewayUrl = "",
  [switch]$NoRestart
)

$ErrorActionPreference = "Stop"

$ConfigPaths = @(
  "C:\ProgramData\MarketplaceCRM\config\marketplace-crm.env",
  "C:\ProgramData\MarketplaceCRMLive\config\marketplace-crm-live.env"
)
$LogDir = "C:\ProgramData\MarketplaceCRMLive\logs"
$LogPath = Join-Path $LogDir "novapay-token-update.txt"

function Add-SafeLog($Message) {
  New-Item -ItemType Directory -Path $LogDir -Force | Out-Null
  Add-Content -LiteralPath $LogPath -Encoding UTF8 -Value "$(Get-Date -Format o) $Message"
}

function ConvertFrom-SecureText([securestring]$SecureText) {
  $Bstr = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($SecureText)
  try {
    return [Runtime.InteropServices.Marshal]::PtrToStringBSTR($Bstr)
  } finally {
    if ($Bstr -ne [IntPtr]::Zero) {
      [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($Bstr)
    }
  }
}

function Set-EnvFileValue {
  param(
    [Parameter(Mandatory = $true)][string]$Path,
    [Parameter(Mandatory = $true)][string]$Key,
    [Parameter(Mandatory = $true)][string]$Value
  )

  $Dir = Split-Path -Parent $Path
  New-Item -ItemType Directory -Path $Dir -Force | Out-Null

  $Lines = @()
  if (Test-Path -LiteralPath $Path -PathType Leaf) {
    $Lines = @(Get-Content -LiteralPath $Path -Encoding UTF8)
  }

  $Found = $false
  $Next = foreach ($Line in $Lines) {
    if ($Line -match "^\s*$([regex]::Escape($Key))\s*=") {
      $Found = $true
      "$Key=$Value"
    } else {
      $Line
    }
  }

  if (-not $Found) {
    $Next += "$Key=$Value"
  }

  Set-Content -LiteralPath $Path -Encoding UTF8 -Value $Next
}

function Test-EnvFileKey {
  param(
    [Parameter(Mandatory = $true)][string]$Path,
    [Parameter(Mandatory = $true)][string]$Key
  )

  if (-not (Test-Path -LiteralPath $Path -PathType Leaf)) { return $false }
  foreach ($Line in Get-Content -LiteralPath $Path -Encoding UTF8) {
    if ($Line -match "^\s*$([regex]::Escape($Key))\s*=(.*)$") {
      return -not [string]::IsNullOrWhiteSpace($matches[1])
    }
  }
  return $false
}

$KeyName = if ($TokenType -eq "GatewayToken") { "NOVAPAY_GATEWAY_TOKEN" } else { "NOVAPAY_REFRESH_TOKEN" }
$Prompt = if ($TokenType -eq "GatewayToken") { "Paste NovaPay external gateway token" } else { "Paste NovaPay refresh token" }
$Token = ConvertFrom-SecureText (Read-Host -AsSecureString $Prompt)

if ([string]::IsNullOrWhiteSpace($Token)) {
  Add-SafeLog "FAILED key=$KeyName reason=EMPTY_TOKEN"
  throw "EMPTY_TOKEN: NovaPay token is empty."
}

foreach ($ConfigPath in $ConfigPaths) {
  Set-EnvFileValue -Path $ConfigPath -Key $KeyName -Value $Token
  if ($TokenType -eq "GatewayToken" -and -not [string]::IsNullOrWhiteSpace($GatewayUrl)) {
    Set-EnvFileValue -Path $ConfigPath -Key "NOVAPAY_GATEWAY_URL" -Value $GatewayUrl.Trim()
  }
  Add-SafeLog "UPDATED config=$ConfigPath key=$KeyName gatewayUrlUpdated=$($TokenType -eq "GatewayToken" -and -not [string]::IsNullOrWhiteSpace($GatewayUrl))"
}

Remove-Variable Token -ErrorAction SilentlyContinue

$Status = foreach ($ConfigPath in $ConfigPaths) {
  [pscustomobject]@{
    Config = $ConfigPath
    RefreshTokenConfigured = Test-EnvFileKey -Path $ConfigPath -Key "NOVAPAY_REFRESH_TOKEN"
    GatewayUrlConfigured = Test-EnvFileKey -Path $ConfigPath -Key "NOVAPAY_GATEWAY_URL"
    GatewayTokenConfigured = Test-EnvFileKey -Path $ConfigPath -Key "NOVAPAY_GATEWAY_TOKEN"
    BusinessLoginConfigured = Test-EnvFileKey -Path $ConfigPath -Key "NOVAPAY_BUSINESS_LOGIN"
    CertificatePathConfigured = Test-EnvFileKey -Path $ConfigPath -Key "NOVAPAY_CERTIFICATE_PATH"
  }
}

$Status | Format-Table -AutoSize

if (-not $NoRestart) {
  foreach ($TaskName in @("MarketplaceCRM", "MarketplaceCRMLive")) {
    $Task = Get-ScheduledTask -TaskName $TaskName -ErrorAction SilentlyContinue
    if ($Task) {
      Stop-ScheduledTask -TaskName $TaskName -ErrorAction SilentlyContinue
      Start-Sleep -Seconds 1
      Start-ScheduledTask -TaskName $TaskName
      Add-SafeLog "RESTARTED task=$TaskName"
      Write-Host "Restarted task $TaskName"
    } else {
      Add-SafeLog "TASK_NOT_FOUND task=$TaskName"
      Write-Host "Task not found: $TaskName"
    }
  }
  Start-Sleep -Seconds 5
}

try {
  $Response = Invoke-WebRequest -UseBasicParsing -Uri "http://127.0.0.1:8798/api/novapay/status" -TimeoutSec 10
  $Data = $Response.Content | ConvertFrom-Json
  $Diagnostics = $Data.diagnostics
  [pscustomobject]@{
    HttpStatus = $Response.StatusCode
    DirectConfigured = $Diagnostics.directConfigured
    RefreshTokenConfigured = $Diagnostics.refreshTokenConfigured
    BusinessLoginConfigured = $Diagnostics.businessLoginConfigured
    PublicCertificateConfigured = $Diagnostics.publicCertificateConfigured
    GatewayUrlConfigured = $Diagnostics.gatewayUrlConfigured
  } | Format-List
  Add-SafeLog "VERIFY status=OK http=$($Response.StatusCode)"
} catch {
  Add-SafeLog "VERIFY status=FAILED code=NOVAPAY_STATUS_CHECK_FAILED message=$($_.Exception.Message)"
  Write-Host "NOVAPAY_STATUS_CHECK_FAILED: $($_.Exception.Message)"
}

param(
  [int]$Port = 8787,
  [string]$BindAddress = "127.0.0.1",
  [switch]$Once
)

$ErrorActionPreference = "Stop"
$Root = [System.IO.Path]::GetFullPath((Split-Path -Parent $MyInvocation.MyCommand.Path))
$Address = [System.Net.IPAddress]::Parse($BindAddress)
$Script:RozetkaAccessToken = ""

try {
  [Net.ServicePointManager]::SecurityProtocol = [Net.ServicePointManager]::SecurityProtocol -bor [Net.SecurityProtocolType]::Tls12
} catch {
}

function Import-EnvFile {
  $EnvPath = Join-Path $Root ".env"
  if (-not (Test-Path -LiteralPath $EnvPath -PathType Leaf)) {
    return
  }

  foreach ($Line in [System.IO.File]::ReadAllLines($EnvPath)) {
    $Trimmed = $Line.Trim()
    if ([string]::IsNullOrWhiteSpace($Trimmed) -or $Trimmed.StartsWith("#")) {
      continue
    }

    $Index = $Trimmed.IndexOf("=")
    if ($Index -lt 1) {
      continue
    }

    $Key = $Trimmed.Substring(0, $Index).Trim()
    $Value = $Trimmed.Substring($Index + 1).Trim().Trim('"').Trim("'")
    if (-not [string]::IsNullOrWhiteSpace($Key) -and [string]::IsNullOrWhiteSpace([Environment]::GetEnvironmentVariable($Key, "Process"))) {
      [Environment]::SetEnvironmentVariable($Key, $Value, "Process")
    }
  }
}

Import-EnvFile

$Seed = @{
  products = @(
    @{
      id = "p-100"; type = "weapon"; brand = "Delta Arms"; model = "Карабін AR-15 Civil";
      caliber = "5.56x45"; internalCode = "WPN-AR15-001"; uktzed = "9303300000"; price = 86500; currency = "UAH"
    },
    @{
      id = "p-200"; type = "regular"; brand = "Optix"; model = "Приціл коліматорний R-Point";
      caliber = ""; internalCode = "ACC-OPT-001"; uktzed = "9013109000"; price = 5400; currency = "UAH"
    }
  )
  invoices = @(
    @{
      id = "inv-240521-001"; channel = "B2B"; clientId = "c-001"; manager = "Марія Шевчук";
      total = 86500; paid = 30000; currency = "UAH"; accounting = $true
    }
  )
  integrations = @(
    @{ id = "rozetka"; name = "Rozetka"; status = "token_needed"; scope = "товари, замовлення, залишки, ціни" },
    @{ id = "prom"; name = "Prom"; status = "ok"; scope = "товари, замовлення, залишки, ціни" },
    @{ id = "epicentr"; name = "Epicentr"; status = "mapping_needed"; scope = "товари, замовлення, залишки" },
    @{ id = "allo"; name = "Allo"; status = "ok"; scope = "товари, замовлення, залишки, ціни" }
  )
}

$RozetkaRequirements = @(
  @{ id = "credentials"; title = "Rozetka credentials"; required = $true; details = "ROZETKA_API_TOKEN or ROZETKA_USERNAME + ROZETKA_PASSWORD in .env" },
  @{ id = "goods"; title = "Goods"; required = $true; details = "GET /items/search for full active catalog; GET /goods/new for new items" },
  @{ id = "orders"; title = "Orders"; required = $true; details = "GET /orders/search and /orders/{id}, permission order_edit" },
  @{ id = "raw"; title = "Raw fields"; required = $true; details = "CRM stores full raw Rozetka JSON in rozetka.raw" }
)

$RozetkaOrderSearchExpand = @(
  "delivery", "user", "purchases", "total_quantity", "status_data", "status_payment",
  "payment_method_id", "is_payed", "last_update_status", "delivery_prices", "carrier",
  "has_kit", "auto_refund", "is_bonus", "bonus_amount", "prro"
) -join ","

$RozetkaOrderDetailsExpand = @(
  "delivery", "delivery_service", "user", "purchases", "item_details", "total_quantity",
  "status_data", "status_available", "payment", "payment_type", "payment_type_name",
  "payment_status", "status_payment", "payment_invoice_id", "credit_info", "credit_status",
  "credit_broker", "order_status_history", "can_edit", "feedback", "feedback_count",
  "is_payed", "is_free_delivery", "is_receiver_edit_available", "last_update_status",
  "delivery_prices", "delivery_commission_info", "invoice_exist", "can_create_invoice",
  "need_label", "count_buyer_orders", "rz_delivery_ttn_sender", "is_reserve_ending",
  "group_id", "group_orders_count", "has_kit", "carrier", "auto_refund", "is_smart",
  "is_bonus", "bonus_amount", "prro"
) -join ","

$RozetkaItemsSearchExpand = @(
  "sell_status", "sold", "status", "description", "description_ua", "details",
  "group_item", "parent_category", "status_available", "price_promo", "is_promo_sent"
) -join ","

function Get-StatusText {
  param([int]$StatusCode)

  switch ($StatusCode) {
    200 { "OK" }
    201 { "Created" }
    204 { "No Content" }
    400 { "Bad Request" }
    403 { "Forbidden" }
    404 { "Not Found" }
    500 { "Internal Server Error" }
    default { "OK" }
  }
}

function Get-ContentType {
  param([string]$Path)

  switch ([System.IO.Path]::GetExtension($Path).ToLowerInvariant()) {
    ".html" { "text/html; charset=utf-8" }
    ".css" { "text/css; charset=utf-8" }
    ".js" { "application/javascript; charset=utf-8" }
    ".md" { "text/markdown; charset=utf-8" }
    default { "application/octet-stream" }
  }
}

function ConvertTo-Utf8Bytes {
  param([string]$Text)
  return [System.Text.Encoding]::UTF8.GetBytes($Text)
}

function Send-Response {
  param(
    [System.Net.Sockets.TcpClient]$Client,
    [int]$StatusCode,
    [string]$ContentType,
    [byte[]]$Body
  )

  $Stream = $Client.GetStream()
  $StatusText = Get-StatusText -StatusCode $StatusCode
  $Header = "HTTP/1.1 $StatusCode $StatusText`r`n" +
    "Content-Type: $ContentType`r`n" +
    "Content-Length: $($Body.Length)`r`n" +
    "Access-Control-Allow-Origin: *`r`n" +
    "Access-Control-Allow-Methods: GET,POST,OPTIONS`r`n" +
    "Access-Control-Allow-Headers: Content-Type`r`n" +
    "Connection: close`r`n`r`n"
  $HeaderBytes = [System.Text.Encoding]::ASCII.GetBytes($Header)
  $Stream.Write($HeaderBytes, 0, $HeaderBytes.Length)
  if ($Body.Length -gt 0) {
    $Stream.Write($Body, 0, $Body.Length)
  }
  $Stream.Flush()
  $Client.Close()
}

function Send-Json {
  param(
    [System.Net.Sockets.TcpClient]$Client,
    [object]$Value,
    [int]$StatusCode = 200
  )

  $Json = $Value | ConvertTo-Json -Depth 12
  Send-Response -Client $Client -StatusCode $StatusCode -ContentType "application/json; charset=utf-8" -Body (ConvertTo-Utf8Bytes $Json)
}

function Send-Text {
  param(
    [System.Net.Sockets.TcpClient]$Client,
    [string]$Text,
    [string]$ContentType = "text/plain; charset=utf-8",
    [int]$StatusCode = 200
  )

  Send-Response -Client $Client -StatusCode $StatusCode -ContentType $ContentType -Body (ConvertTo-Utf8Bytes $Text)
}

function Read-Request {
  param([System.Net.Sockets.TcpClient]$Client)

  $Stream = $Client.GetStream()
  $Buffer = New-Object byte[] 65536
  $Read = $Stream.Read($Buffer, 0, $Buffer.Length)
  if ($Read -le 0) {
    return $null
  }

  $Raw = [System.Text.Encoding]::UTF8.GetString($Buffer, 0, $Read)
  $Parts = $Raw -split "`r`n`r`n", 2
  $Head = $Parts[0]
  $Body = if ($Parts.Count -gt 1) { $Parts[1] } else { "" }
  $Lines = $Head -split "`r`n"
  $RequestLine = $Lines[0] -split " "
  if ($RequestLine.Count -lt 2) {
    return $null
  }

  $PathAndQuery = $RequestLine[1]
  $PathParts = $PathAndQuery -split "\?", 2

  return @{
    method = $RequestLine[0]
    path = $PathParts[0]
    query = if ($PathParts.Count -gt 1) { $PathParts[1] } else { "" }
    body = $Body
  }
}

function Test-RozetkaCredentials {
  $HasToken = -not [string]::IsNullOrWhiteSpace($env:ROZETKA_API_TOKEN)
  $HasLogin = -not [string]::IsNullOrWhiteSpace($env:ROZETKA_USERNAME) -and -not [string]::IsNullOrWhiteSpace($env:ROZETKA_PASSWORD)
  return ($HasToken -or $HasLogin)
}

function Get-RozetkaBaseUrl {
  if ([string]::IsNullOrWhiteSpace($env:ROZETKA_API_BASE_URL)) {
    return "https://api-seller.rozetka.com.ua"
  }
  return $env:ROZETKA_API_BASE_URL.TrimEnd("/")
}

  function Get-RozetkaContentLanguage {
    if ([string]::IsNullOrWhiteSpace($env:ROZETKA_CONTENT_LANGUAGE)) {
      return "uk"
    }
    return $env:ROZETKA_CONTENT_LANGUAGE
  }

  function Get-NodeExecutable {
    if (-not [string]::IsNullOrWhiteSpace($env:ROZETKA_NODE_PATH) -and (Test-Path -LiteralPath $env:ROZETKA_NODE_PATH -PathType Leaf)) {
      return $env:ROZETKA_NODE_PATH
    }

    $BundledNode = Join-Path $env:USERPROFILE ".cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe"
    if (Test-Path -LiteralPath $BundledNode -PathType Leaf) {
      return $BundledNode
    }

    $NodeCommand = Get-Command node -ErrorAction SilentlyContinue
    if ($NodeCommand) {
      return $NodeCommand.Source
    }

    throw "Node.js is required for Rozetka API requests. Set ROZETKA_NODE_PATH in .env or install Node.js."
  }

function Get-RozetkaToken {
  if (-not [string]::IsNullOrWhiteSpace($env:ROZETKA_API_TOKEN)) {
    return $env:ROZETKA_API_TOKEN
  }

  if (-not [string]::IsNullOrWhiteSpace($Script:RozetkaAccessToken)) {
    return $Script:RozetkaAccessToken
  }

  if ([string]::IsNullOrWhiteSpace($env:ROZETKA_USERNAME) -or [string]::IsNullOrWhiteSpace($env:ROZETKA_PASSWORD)) {
    throw "Rozetka credentials are missing. Set ROZETKA_API_TOKEN or ROZETKA_USERNAME + ROZETKA_PASSWORD in .env."
  }

  $PasswordBase64 = [Convert]::ToBase64String([System.Text.Encoding]::UTF8.GetBytes($env:ROZETKA_PASSWORD))
  $Body = @{ username = $env:ROZETKA_USERNAME; password = $PasswordBase64 } | ConvertTo-Json
  $Response = Invoke-RestMethod -Method Post -Uri "$(Get-RozetkaBaseUrl)/sites" -ContentType "application/json" -Body $Body
  if ([string]::IsNullOrWhiteSpace($Response.content.access_token)) {
    throw "Rozetka login did not return access_token."
  }

  $Script:RozetkaAccessToken = $Response.content.access_token
  return $Script:RozetkaAccessToken
}

  function Invoke-RozetkaGet {
    param(
      [string]$Path,
      [string]$QueryString = ""
    )

    $Node = Get-NodeExecutable
    $Helper = Join-Path $Root "src\rozetka-http.mjs"
    if (-not (Test-Path -LiteralPath $Helper -PathType Leaf)) {
      throw "Rozetka Node helper is missing: $Helper"
    }

    $Request = @{
      method = "GET"
      path = $Path
      queryString = $QueryString
    } | ConvertTo-Json -Compress
    $EncodedRequest = [Convert]::ToBase64String([System.Text.Encoding]::UTF8.GetBytes($Request))
    $Output = & $Node $Helper $EncodedRequest 2>&1
    $ExitCode = $LASTEXITCODE
    $EncodedOutput = (($Output | ForEach-Object { $_.ToString() }) -join "").Trim()
    try {
      $Text = [System.Text.Encoding]::UTF8.GetString([Convert]::FromBase64String($EncodedOutput))
    } catch {
      $Text = $EncodedOutput
    }

    if ($ExitCode -ne 0) {
      $Message = $Text
      try {
        $ErrorPayload = $Text | ConvertFrom-Json
        if ($ErrorPayload.message) {
          $Message = $ErrorPayload.message
          if ($ErrorPayload.endpoint) {
            $Message = "$Message ($($ErrorPayload.endpoint))"
          }
        }
      } catch {
      }
      throw $Message
    }

    return ($Text | ConvertFrom-Json)
  }

  function Invoke-RozetkaImage {
    param([string]$Url)

    $Node = Get-NodeExecutable
    $Helper = Join-Path $Root "src\rozetka-http.mjs"
    if (-not (Test-Path -LiteralPath $Helper -PathType Leaf)) {
      throw "Rozetka Node helper is missing: $Helper"
    }

    $Request = @{
      kind = "image"
      url = $Url
    } | ConvertTo-Json -Compress
    $EncodedRequest = [Convert]::ToBase64String([System.Text.Encoding]::UTF8.GetBytes($Request))
    $Output = & $Node $Helper $EncodedRequest 2>&1
    $ExitCode = $LASTEXITCODE
    $EncodedOutput = (($Output | ForEach-Object { $_.ToString() }) -join "").Trim()
    try {
      $Text = [System.Text.Encoding]::UTF8.GetString([Convert]::FromBase64String($EncodedOutput))
    } catch {
      $Text = $EncodedOutput
    }

    if ($ExitCode -ne 0) {
      $Message = $Text
      try {
        $ErrorPayload = $Text | ConvertFrom-Json
        if ($ErrorPayload.message) { $Message = $ErrorPayload.message }
      } catch {
      }
      throw $Message
    }

    return ($Text | ConvertFrom-Json)
  }

  function Add-QueryParam {
    param(
      [string]$QueryString,
      [string]$Key,
      [string]$Value
  )

  if ($QueryString -match "(^|&)$([Regex]::Escape($Key))=") {
    return $QueryString
  }

  $Pair = "$Key=$([System.Uri]::EscapeDataString($Value))"
  if ([string]::IsNullOrWhiteSpace($QueryString)) {
    return $Pair
    }
    return "$QueryString&$Pair"
  }

  function Remove-QueryParam {
    param(
      [string]$QueryString,
      [string[]]$Keys
    )

    if ([string]::IsNullOrWhiteSpace($QueryString)) { return "" }
    $Blocked = @{}
    foreach ($Key in $Keys) { $Blocked[$Key] = $true }
    $Parts = New-Object System.Collections.ArrayList
    foreach ($Part in ($QueryString -split "&")) {
      if ([string]::IsNullOrWhiteSpace($Part)) { continue }
      $Pair = $Part -split "=", 2
      $Name = [System.Uri]::UnescapeDataString($Pair[0])
      if ($Blocked.ContainsKey($Name)) { continue }
      [void]$Parts.Add($Part)
    }
    return ($Parts -join "&")
  }

function Get-QueryValue {
  param(
    [string]$QueryString,
    [string]$Key
  )

  foreach ($Part in ($QueryString -split "&")) {
    if ([string]::IsNullOrWhiteSpace($Part)) { continue }
    $Pair = $Part -split "=", 2
    if ($Pair.Count -ge 1 -and [System.Uri]::UnescapeDataString($Pair[0]) -eq $Key) {
      if ($Pair.Count -eq 2) {
        return [System.Uri]::UnescapeDataString($Pair[1])
      }
      return ""
    }
  }
  return ""
}

function Invoke-RozetkaGoodsNewAll {
  param([string]$QueryString)

  $Page = 1
  $PageValue = Get-QueryValue -QueryString $QueryString -Key "page"
  if ($PageValue) { $Page = [int]$PageValue }
  $PageSize = 100
  $PageSizeValue = Get-QueryValue -QueryString $QueryString -Key "pageSize"
  if ($PageSizeValue) { $PageSize = [int]$PageSizeValue }
  $MaxPages = 10
    $MaxPagesValue = Get-QueryValue -QueryString $QueryString -Key "maxPages"
    if ($MaxPagesValue) { $MaxPages = [int]$MaxPagesValue }
    $BaseQuery = Remove-QueryParam -QueryString $QueryString -Keys @("maxPages", "page", "pageSize")

    $Items = New-Object System.Collections.ArrayList
    $LastMeta = $null
    for ($Index = 0; $Index -lt $MaxPages; $Index++) {
      $CurrentPage = $Page + $Index
      $PageQuery = Add-QueryParam -QueryString $BaseQuery -Key "page" -Value ([string]$CurrentPage)
      $PageQuery = Add-QueryParam -QueryString $PageQuery -Key "pageSize" -Value ([string]$PageSize)
      $Result = Invoke-RozetkaGet -Path "/goods/new" -QueryString $PageQuery
    $PageItems = @($Result.content.items)
    foreach ($Item in $PageItems) { [void]$Items.Add($Item) }
    $LastMeta = $Result.content._meta
    if ($null -ne $LastMeta -and $LastMeta.pageCount -and $CurrentPage -ge [int]$LastMeta.pageCount) { break }
    if ($PageItems.Count -lt $PageSize) { break }
  }

  return @{ success = $true; content = @{ count = $Items.Count; items = $Items; sourceMeta = $LastMeta } }
}

function Invoke-RozetkaItemsSearchAll {
  param([string]$QueryString)

  $StartPage = 1
  $PageValue = Get-QueryValue -QueryString $QueryString -Key "page"
  if ($PageValue) { $StartPage = [int]$PageValue }
  $MaxPages = 250
  $MaxPagesValue = Get-QueryValue -QueryString $QueryString -Key "maxPages"
  if ($MaxPagesValue) { $MaxPages = [int]$MaxPagesValue }
  $BaseQuery = Remove-QueryParam -QueryString $QueryString -Keys @("maxPages", "page", "pageSize")
  $BaseQuery = Add-QueryParam -QueryString $BaseQuery -Key "item_active" -Value "1"
  $BaseQuery = Add-QueryParam -QueryString $BaseQuery -Key "expand" -Value $RozetkaItemsSearchExpand

  $Items = New-Object System.Collections.ArrayList
  $LastMeta = $null
  for ($Index = 0; $Index -lt $MaxPages; $Index++) {
    $CurrentPage = $StartPage + $Index
    $PageQuery = Add-QueryParam -QueryString $BaseQuery -Key "page" -Value ([string]$CurrentPage)
    $Result = Invoke-RozetkaGet -Path "/items/search" -QueryString $PageQuery
    $PageItems = @($Result.content.items)
    foreach ($Item in $PageItems) { [void]$Items.Add($Item) }
    $LastMeta = $Result.content._meta
    if ($null -ne $LastMeta -and $LastMeta.pageCount -and $CurrentPage -ge [int]$LastMeta.pageCount) { break }
    if ($PageItems.Count -eq 0) { break }
  }

  return @{ success = $true; content = @{ count = $Items.Count; items = $Items; sourceMeta = $LastMeta; source = "/items/search" } }
}

function Invoke-RozetkaOrdersImport {
  param([string]$QueryString)

  $MaxPages = 1
  $MaxPagesValue = Get-QueryValue -QueryString $QueryString -Key "maxPages"
  if ($MaxPagesValue) { $MaxPages = [int]$MaxPagesValue }
    $MaxDetails = 20
    $MaxDetailsValue = Get-QueryValue -QueryString $QueryString -Key "maxDetails"
    if ($MaxDetailsValue) { $MaxDetails = [int]$MaxDetailsValue }
    $BaseQuery = Remove-QueryParam -QueryString $QueryString -Keys @("maxPages", "maxDetails", "page")
    $SearchQuery = Add-QueryParam -QueryString $BaseQuery -Key "expand" -Value $RozetkaOrderSearchExpand

  $Orders = New-Object System.Collections.ArrayList
  $LastMeta = $null
  $StartPage = 1
  $StartPageValue = Get-QueryValue -QueryString $QueryString -Key "page"
  if ($StartPageValue) { $StartPage = [int]$StartPageValue }
  for ($Index = 0; $Index -lt $MaxPages; $Index++) {
    $PageQuery = Add-QueryParam -QueryString $SearchQuery -Key "page" -Value ([string]($StartPage + $Index))
    $Result = Invoke-RozetkaGet -Path "/orders/search" -QueryString $PageQuery
    foreach ($Order in @($Result.content.orders)) { [void]$Orders.Add($Order) }
    $LastMeta = $Result.content._meta
    if (@($Result.content.orders).Count -eq 0) { break }
  }

  $Detailed = New-Object System.Collections.ArrayList
  foreach ($Order in @($Orders | Select-Object -First $MaxDetails)) {
    if ($null -eq $Order.id) {
      [void]$Detailed.Add($Order)
      continue
    }

    try {
      $Details = Invoke-RozetkaGet -Path "/orders/$($Order.id)" -QueryString "expand=$([System.Uri]::EscapeDataString($RozetkaOrderDetailsExpand))"
      $Details.content | Add-Member -NotePropertyName searchPayload -NotePropertyValue $Order -Force
      [void]$Detailed.Add($Details.content)
    }
    catch {
      $Order | Add-Member -NotePropertyName detailError -NotePropertyValue $_.Exception.Message -Force
      [void]$Detailed.Add($Order)
    }
  }

  return @{ success = $true; content = @{ count = $Detailed.Count; orders = $Detailed; sourceMeta = $LastMeta } }
}

function Send-Static {
  param(
    [System.Net.Sockets.TcpClient]$Client,
    [string]$RelativePath
  )

  $SafePath = $RelativePath.TrimStart("/")
  if ([string]::IsNullOrWhiteSpace($SafePath)) {
    $SafePath = "index.html"
  }
  $Resolved = [System.IO.Path]::GetFullPath((Join-Path $Root $SafePath))
  if (-not $Resolved.StartsWith($Root, [System.StringComparison]::OrdinalIgnoreCase)) {
    Send-Json -Client $Client -StatusCode 403 -Value @{ error = "Forbidden" }
    return
  }
  if (-not (Test-Path -LiteralPath $Resolved -PathType Leaf)) {
    Send-Json -Client $Client -StatusCode 404 -Value @{ error = "Not found" }
    return
  }
  $Bytes = [System.IO.File]::ReadAllBytes($Resolved)
  Send-Response -Client $Client -StatusCode 200 -ContentType (Get-ContentType $Resolved) -Body $Bytes
}

function Handle-Client {
  param([System.Net.Sockets.TcpClient]$Client)

  $Request = Read-Request -Client $Client
  if ($null -eq $Request) {
    Send-Json -Client $Client -StatusCode 400 -Value @{ error = "Bad request" }
    return
  }

  $Path = $Request.path
  if ($Request.method -eq "OPTIONS") {
    Send-Text -Client $Client -Text ""
    return
  }

  if ($Path -eq "/api/health") {
    Send-Json -Client $Client -Value @{ ok = $true; service = "arms-crm-mock-api"; date = "2026-05-23" }
    return
  }

  if ($Path -eq "/api/products") {
    Send-Json -Client $Client -Value $Seed.products
    return
  }

  if ($Path -eq "/api/invoices") {
    Send-Json -Client $Client -Value $Seed.invoices
    return
  }

  if ($Path -eq "/api/integrations") {
    $Rows = $Seed.integrations | ForEach-Object {
      $Row = $_.Clone()
      if ($Row.id -eq "rozetka" -and (Test-RozetkaCredentials)) {
        $Row.status = "ok"
      }
      $Row
    }
    Send-Json -Client $Client -Value $Rows
    return
  }

  if ($Path -eq "/api/rozetka/requirements") {
    Send-Json -Client $Client -Value @{ ok = $true; configured = (Test-RozetkaCredentials); content = $RozetkaRequirements }
    return
  }

  if ($Path -eq "/api/rozetka/image") {
    $ImageUrl = Get-QueryValue -QueryString $Request.query -Key "url"
    if ([string]::IsNullOrWhiteSpace($ImageUrl)) {
      Send-Json -Client $Client -StatusCode 400 -Value @{ ok = $false; error = "Image URL is missing." }
      return
    }
    try {
      $Image = Invoke-RozetkaImage -Url $ImageUrl
      $Bytes = [Convert]::FromBase64String($Image.data)
      Send-Response -Client $Client -StatusCode 200 -ContentType $Image.contentType -Body $Bytes
    }
    catch {
      Send-Json -Client $Client -StatusCode 502 -Value @{ ok = $false; error = $_.Exception.Message; endpoint = "/api/rozetka/image" }
    }
    return
  }

  if ($Path -eq "/api/rozetka/goods/new") {
    if (-not (Test-RozetkaCredentials)) {
      Send-Json -Client $Client -StatusCode 400 -Value @{ ok = $false; error = "Rozetka credentials are missing. Fill .env."; requirements = $RozetkaRequirements }
      return
    }
    try {
      Send-Json -Client $Client -Value (Invoke-RozetkaGet -Path "/goods/new" -QueryString $Request.query)
    }
    catch {
      Send-Json -Client $Client -StatusCode 502 -Value @{ ok = $false; error = $_.Exception.Message; endpoint = "/goods/new" }
    }
    return
  }

  if ($Path -eq "/api/rozetka/goods/new/all") {
    if (-not (Test-RozetkaCredentials)) {
      Send-Json -Client $Client -StatusCode 400 -Value @{ ok = $false; error = "Rozetka credentials are missing. Fill .env."; requirements = $RozetkaRequirements }
      return
    }
    try {
      Send-Json -Client $Client -Value (Invoke-RozetkaGoodsNewAll -QueryString $Request.query)
    }
    catch {
      Send-Json -Client $Client -StatusCode 502 -Value @{ ok = $false; error = $_.Exception.Message; endpoint = "/goods/new/all" }
    }
    return
  }

  if ($Path -eq "/api/rozetka/items/search") {
    if (-not (Test-RozetkaCredentials)) {
      Send-Json -Client $Client -StatusCode 400 -Value @{ ok = $false; error = "Rozetka credentials are missing. Fill .env."; requirements = $RozetkaRequirements }
      return
    }
    try {
      $Query = Add-QueryParam -QueryString $Request.query -Key "item_active" -Value "1"
      $Query = Add-QueryParam -QueryString $Query -Key "expand" -Value $RozetkaItemsSearchExpand
      Send-Json -Client $Client -Value (Invoke-RozetkaGet -Path "/items/search" -QueryString $Query)
    }
    catch {
      Send-Json -Client $Client -StatusCode 502 -Value @{ ok = $false; error = $_.Exception.Message; endpoint = "/items/search" }
    }
    return
  }

  if ($Path -eq "/api/rozetka/items/search/all") {
    if (-not (Test-RozetkaCredentials)) {
      Send-Json -Client $Client -StatusCode 400 -Value @{ ok = $false; error = "Rozetka credentials are missing. Fill .env."; requirements = $RozetkaRequirements }
      return
    }
    try {
      Send-Json -Client $Client -Value (Invoke-RozetkaItemsSearchAll -QueryString $Request.query)
    }
    catch {
      Send-Json -Client $Client -StatusCode 502 -Value @{ ok = $false; error = $_.Exception.Message; endpoint = "/items/search/all" }
    }
    return
  }

  if ($Path -eq "/api/rozetka/orders/search") {
    if (-not (Test-RozetkaCredentials)) {
      Send-Json -Client $Client -StatusCode 400 -Value @{ ok = $false; error = "Rozetka credentials are missing. Fill .env."; requirements = $RozetkaRequirements }
      return
    }
    try {
      $Query = Add-QueryParam -QueryString $Request.query -Key "expand" -Value $RozetkaOrderSearchExpand
      Send-Json -Client $Client -Value (Invoke-RozetkaGet -Path "/orders/search" -QueryString $Query)
    }
    catch {
      Send-Json -Client $Client -StatusCode 502 -Value @{ ok = $false; error = $_.Exception.Message; endpoint = "/orders/search" }
    }
    return
  }

  if ($Path -eq "/api/rozetka/orders/import") {
    if (-not (Test-RozetkaCredentials)) {
      Send-Json -Client $Client -StatusCode 400 -Value @{ ok = $false; error = "Rozetka credentials are missing. Fill .env."; requirements = $RozetkaRequirements }
      return
    }
    try {
      Send-Json -Client $Client -Value (Invoke-RozetkaOrdersImport -QueryString $Request.query)
    }
    catch {
      Send-Json -Client $Client -StatusCode 502 -Value @{ ok = $false; error = $_.Exception.Message; endpoint = "/orders/import" }
    }
    return
  }

  if ($Path -match "^/api/rozetka/orders/([0-9]+)$") {
    if (-not (Test-RozetkaCredentials)) {
      Send-Json -Client $Client -StatusCode 400 -Value @{ ok = $false; error = "Rozetka credentials are missing. Fill .env."; requirements = $RozetkaRequirements }
      return
    }
    try {
      $OrderId = $Matches[1]
      $Query = Add-QueryParam -QueryString $Request.query -Key "expand" -Value $RozetkaOrderDetailsExpand
      Send-Json -Client $Client -Value (Invoke-RozetkaGet -Path "/orders/$OrderId" -QueryString $Query)
    }
    catch {
      Send-Json -Client $Client -StatusCode 502 -Value @{ ok = $false; error = $_.Exception.Message; endpoint = "/orders/{id}" }
    }
    return
  }

  if ($Path -match "^/api/integrations/([^/]+)/sync$" -and $Request.method -eq "POST") {
    $Provider = $Matches[1]
    Send-Json -Client $Client -Value @{
      ok = $true
      provider = $Provider
      accepted = @("products", "orders", "stocks", "prices")
      idempotencyKey = "${Provider}:sync:$([DateTimeOffset]::Now.ToUnixTimeSeconds())"
    }
    return
  }

  if ($Path -eq "/api/bas-baf/export" -and $Request.method -eq "POST") {
    Send-Json -Client $Client -Value @{
      ok = $true
      exportedDocuments = @("inv-240521-001")
      target = "BAS/BAF"
      mode = "marked-documents-only"
    }
    return
  }

  Send-Static -Client $Client -RelativePath $Path
}

$Listener = [System.Net.Sockets.TcpListener]::new($Address, $Port)

try {
  $Listener.Start()
  $DisplayHost = if ($BindAddress -eq "0.0.0.0") { "<your-computer-ip>" } else { $BindAddress }
  Write-Host "Arms CRM mock API: http://$DisplayHost`:$Port/"
  Write-Host "Static app: http://$DisplayHost`:$Port/index.html"
  Write-Host "Stop with Ctrl+C."

  do {
    $Client = $Listener.AcceptTcpClient()
    Handle-Client -Client $Client
  } while (-not $Once)
}
finally {
  $Listener.Stop()
}

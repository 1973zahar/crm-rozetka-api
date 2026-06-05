param(
  [int]$Port = 8789,
  [string]$BindAddress = "127.0.0.1",
  [string]$OneCToCRMPath = "",
  [string]$LogPath = "",
  [switch]$Once
)

$ErrorActionPreference = "Stop"
$Root = [System.IO.Path]::GetFullPath((Split-Path -Parent $MyInvocation.MyCommand.Path))
$Address = [System.Net.IPAddress]::Parse($BindAddress)
$Script:RozetkaAccessToken = ""
$Script:CrmLogPath = ""
$Script:CurrentRequestLogContext = $null

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

function Get-OneCToCRMPath {
  if (-not [string]::IsNullOrWhiteSpace($OneCToCRMPath)) {
    return $OneCToCRMPath
  }
  if (-not [string]::IsNullOrWhiteSpace($env:ONEC_TO_CRM_PATH)) {
    return $env:ONEC_TO_CRM_PATH
  }
  return "D:\CRM_Exchange\ToCRM"
}

function Get-EnvOrDefault {
  param(
    [string]$Name,
    [string]$Default = ""
  )

  $Value = [Environment]::GetEnvironmentVariable($Name, "Process")
  if ([string]::IsNullOrWhiteSpace($Value)) {
    return $Default
  }
  return $Value
}

function ConvertTo-ArraySafe {
  param($Value)

  if ($null -eq $Value) {
    return @()
  }
  if ($Value -is [System.Array]) {
    return @($Value)
  }
  return @($Value)
}

function Get-ObjectValue {
  param(
    $Object,
    [string[]]$Names,
    $Default = $null
  )

  foreach ($Name in $Names) {
    if ($null -eq $Object) {
      continue
    }
    $Property = $Object.PSObject.Properties[$Name]
    if ($null -ne $Property -and $null -ne $Property.Value) {
      $Text = "$($Property.Value)"
      if (-not [string]::IsNullOrWhiteSpace($Text)) {
        return $Property.Value
      }
    }
  }
  return $Default
}

function ConvertTo-CrmSqlNumber {
  param(
    $Value,
    [double]$Default = 0
  )

  if ($null -eq $Value) {
    return $Default
  }
  if ($Value -is [int] -or $Value -is [long] -or $Value -is [double] -or $Value -is [decimal]) {
    return [double]$Value
  }

  $Text = "$Value".Trim()
  if ([string]::IsNullOrWhiteSpace($Text)) {
    return $Default
  }
  $Text = $Text -replace "\s", ""
  $Text = $Text -replace ",", "."

  $Parsed = 0.0
  if ([double]::TryParse($Text, [System.Globalization.NumberStyles]::Any, [System.Globalization.CultureInfo]::InvariantCulture, [ref]$Parsed)) {
    return $Parsed
  }
  return $Default
}

function Remove-CrmSqlNamePrefix {
  param($Value)

  $Text = "$Value".Trim()
  if ([string]::IsNullOrWhiteSpace($Text)) {
    return ""
  }
  $Clean = $Text -replace "^(1c|1C|1с|1С|onec|OneC|rozetka|Rozetka|розетка|Розетка|prom|Prom|пром|Пром)\s*[.:;\-_/|·]*\s*", ""
  if ([string]::IsNullOrWhiteSpace($Clean)) {
    return $Text
  }
  return $Clean.Trim()
}

function Invoke-CrmSqlApiGet {
  param(
    [string]$Path,
    [string]$QueryString = ""
  )

  $BaseUrl = (Get-EnvOrDefault -Name "CRM_SQL_API_BASE_URL" -Default "http://192.168.0.166:3000").TrimEnd("/")
  $TimeoutText = Get-EnvOrDefault -Name "CRM_SQL_API_TIMEOUT_SEC" -Default "15"
  $TimeoutSec = 15
  [void][int]::TryParse($TimeoutText, [ref]$TimeoutSec)
  if ($TimeoutSec -lt 1) {
    $TimeoutSec = 15
  }

  $Uri = "$BaseUrl$Path"
  if (-not [string]::IsNullOrWhiteSpace($QueryString)) {
    $Uri = "$Uri`?$QueryString"
  }

  $Response = Invoke-WebRequest -UseBasicParsing -Uri $Uri -TimeoutSec $TimeoutSec
  if ([string]::IsNullOrWhiteSpace($Response.Content)) {
    return @()
  }
  return ($Response.Content | ConvertFrom-Json)
}

function Get-CrmSqlApiRows {
  param(
    [string]$Path,
    [string]$QueryString = ""
  )

  $Data = Invoke-CrmSqlApiGet -Path $Path -QueryString $QueryString
  if ($null -eq $Data) {
    return @()
  }
  if ($Data -is [System.Array]) {
    return @($Data)
  }

  foreach ($Key in @("items", "data", "rows", "products", "customers", "warehouses", "firms", "organizations", "receivables", "stock")) {
    $Property = $Data.PSObject.Properties[$Key]
    if ($null -ne $Property -and $null -ne $Property.Value) {
      $Rows = ConvertTo-ArraySafe -Value $Property.Value
      if ($Rows.Count -gt 0) {
        return @($Rows)
      }
    }
  }

  return @($Data)
}

function Try-CrmSqlApiRows {
  param(
    [string]$Label,
    [string]$Path,
    [string]$QueryString,
    [System.Collections.ArrayList]$Warnings
  )

  try {
    return @(Get-CrmSqlApiRows -Path $Path -QueryString $QueryString)
  } catch {
    if ($null -ne $Warnings) {
      $Code = "CRM_SQL_SOURCE_UNAVAILABLE"
      if ($_.Exception.Message -match "\(404\)") {
        $Code = "CRM_SQL_ONEC_MIRROR_404"
      }
      [void]$Warnings.Add("${Code}: $Label unavailable: $($_.Exception.Message)")
    }
    return @()
  }
}

function Resolve-CrmSqlLimit {
  param([string]$Value)

  $FullLimit = 50000
  $Configured = Get-EnvOrDefault -Name "CRM_SQL_FULL_LIMIT" -Default ""
  if (-not [string]::IsNullOrWhiteSpace($Configured)) {
    [void][int]::TryParse($Configured, [ref]$FullLimit)
  }
  if ($FullLimit -lt 1000) { $FullLimit = 50000 }
  if ($FullLimit -gt 200000) { $FullLimit = 200000 }

  if ([string]::IsNullOrWhiteSpace($Value)) {
    return $FullLimit
  }
  $Normalized = $Value.Trim().ToLowerInvariant()
  if ($Normalized -in @("all", "*", "full")) {
    return $FullLimit
  }
  $Parsed = 0
  if ([int]::TryParse($Normalized, [ref]$Parsed) -and $Parsed -gt 0) {
    return [Math]::Min($Parsed, $FullLimit)
  }
  return $FullLimit
}

function Add-CrmSqlMirrorWarning {
  param(
    [System.Collections.ArrayList]$Warnings,
    [string]$Code,
    [string]$Message
  )

  if ($null -eq $Warnings) { return }
  [void]$Warnings.Add("${Code}: $Message")
}

function Convert-CrmSqlProductRows {
  param($Rows)

  $Result = @()
  foreach ($Row in (ConvertTo-ArraySafe -Value $Rows)) {
    $Id = Get-ObjectValue -Object $Row -Names @("id", "oneCRef", "one_c_ref", "externalId", "external_id", "productCode", "product_code", "sku", "barcode") -Default ""
    $Name = Remove-CrmSqlNamePrefix (Get-ObjectValue -Object $Row -Names @("name", "title", "productName", "product_name", "description") -Default "Product")
    $Sku = Get-ObjectValue -Object $Row -Names @("sku", "article", "internalCode", "internal_code", "code", "productCode", "product_code") -Default $Id
    $Barcode = Get-ObjectValue -Object $Row -Names @("barcode", "barCode", "ean") -Default ""
    $Price = ConvertTo-CrmSqlNumber -Value (Get-ObjectValue -Object $Row -Names @("latestPrice", "latest_price", "price", "salePrice", "sale_price", "minPrice", "min_price", "maxPrice", "max_price") -Default 0)
    $TotalQty = ConvertTo-CrmSqlNumber -Value (Get-ObjectValue -Object $Row -Names @("totalQuantity", "total_quantity", "quantity", "qty", "balance") -Default 0)
    $AvailableQty = ConvertTo-CrmSqlNumber -Value (Get-ObjectValue -Object $Row -Names @("availableQuantity", "available_quantity", "freeQuantity", "free_quantity") -Default $TotalQty)
    $OneCRef = Get-ObjectValue -Object $Row -Names @("oneCRef", "one_c_ref", "externalId", "external_id", "productCode", "product_code") -Default $Id
    $Description = Get-ObjectValue -Object $Row -Names @("description", "comment", "notes") -Default ""
    $Category = Get-ObjectValue -Object $Row -Names @("category", "categoryName", "category_name", "group", "groupName", "group_name") -Default ""
    $Unit = Get-ObjectValue -Object $Row -Names @("unit", "unitName", "unit_name") -Default ""
    $Currency = Get-ObjectValue -Object $Row -Names @("latestPriceCurrency", "latest_price_currency", "currency") -Default "UAH"

    $Result += [pscustomobject]@{
      id = "$Id"
      oneCRef = "$OneCRef"
      internalCode = "$Sku"
      sku = "$Sku"
      barcode = "$Barcode"
      name = "$Name"
      model = "$Name"
      description = "$Description"
      category = "$Category"
      unit = "$Unit"
      price = $Price
      currency = "$Currency"
      totalQuantity = $TotalQty
      availableQuantity = $AvailableQty
      source = "CRM SQL"
    }
  }
  return @($Result)
}

function Convert-CrmSqlCustomerRows {
  param($Rows)

  $Result = @()
  foreach ($Row in (ConvertTo-ArraySafe -Value $Rows)) {
    $Id = Get-ObjectValue -Object $Row -Names @("id", "externalId", "external_id", "oneCRef", "one_c_ref", "counterpartyCode", "counterparty_code", "taxId", "tax_id") -Default ""
    $ExternalId = Get-ObjectValue -Object $Row -Names @("externalId", "external_id", "id") -Default $Id
    $OneCRef = Get-ObjectValue -Object $Row -Names @("oneCRef", "one_c_ref", "ref") -Default ""
    $CounterpartyCode = Get-ObjectValue -Object $Row -Names @("counterpartyCode", "counterparty_code", "code") -Default $Id
    $Name = Get-ObjectValue -Object $Row -Names @("fullName", "full_name", "name", "counterpartyName", "counterparty_name") -Default "Client"
    $Phone = Get-ObjectValue -Object $Row -Names @("phone", "mainPhone", "main_phone") -Default ""
    $Email = Get-ObjectValue -Object $Row -Names @("email", "mail") -Default ""
    $TaxId = Get-ObjectValue -Object $Row -Names @("taxId", "tax_id", "edrpou", "inn") -Default ""
    $Type = Get-ObjectValue -Object $Row -Names @("sourceModule", "source_module", "type") -Default "1C"
    $Address = Get-ObjectValue -Object $Row -Names @("address", "legalAddress", "legal_address", "deliveryAddress", "delivery_address") -Default ""
    $Manager = Get-ObjectValue -Object $Row -Names @("manager", "responsible", "responsibleName", "responsible_name") -Default ""
    $PriceType = Get-ObjectValue -Object $Row -Names @("priceType", "price_type") -Default ""
    $Currency = Get-ObjectValue -Object $Row -Names @("currency") -Default "UAH"
    $PaymentTerms = Get-ObjectValue -Object $Row -Names @("paymentTerms", "payment_terms") -Default 0
    $CreditLimit = ConvertTo-CrmSqlNumber -Value (Get-ObjectValue -Object $Row -Names @("creditLimitUAH", "credit_limit_uah", "creditLimit") -Default 0)
    $SourceFile = Get-ObjectValue -Object $Row -Names @("sourceFile", "source_file") -Default ""
    $ImportedAt = Get-ObjectValue -Object $Row -Names @("importedAt", "imported_at") -Default ""

    $Result += [pscustomobject]@{
      id = "$Id"
      externalId = "$ExternalId"
      oneCRef = "$OneCRef"
      counterpartyCode = "$CounterpartyCode"
      name = "$Name"
      fullName = "$Name"
      phone = "$Phone"
      email = "$Email"
      taxId = "$TaxId"
      edrpou = "$TaxId"
      type = "$Type"
      address = "$Address"
      manager = "$Manager"
      priceType = "$PriceType"
      currency = "$Currency"
      paymentTerms = $PaymentTerms
      creditLimitUAH = $CreditLimit
      source = "SQL / 1C"
      sourceName = "SQL / 1C"
      sourceText = "SQL / 1C"
      createdFrom = "sql_1c"
      sourceFile = "$SourceFile"
      importedAt = "$ImportedAt"
    }
  }
  return @($Result)
}

function Convert-CrmSqlStockFromProducts {
  param($Rows)

  $Result = @()
  foreach ($Row in (ConvertTo-ArraySafe -Value $Rows)) {
    $ProductId = Get-ObjectValue -Object $Row -Names @("id", "oneCRef", "one_c_ref", "externalId", "sku", "barcode") -Default ""
    $TotalQty = ConvertTo-CrmSqlNumber -Value (Get-ObjectValue -Object $Row -Names @("totalQuantity", "total_quantity", "quantity", "qty", "balance") -Default 0)
    $AvailableQty = ConvertTo-CrmSqlNumber -Value (Get-ObjectValue -Object $Row -Names @("availableQuantity", "available_quantity", "freeQuantity", "free_quantity") -Default $TotalQty)
    if ($TotalQty -eq 0 -and $AvailableQty -eq 0) {
      continue
    }
    $Sku = Get-ObjectValue -Object $Row -Names @("sku", "article", "internalCode", "internal_code", "code") -Default $ProductId

    $Result += [pscustomobject]@{
      productId = "$ProductId"
      sku = "$Sku"
      warehouseId = "sql-total"
      warehouse = "SQL total stock"
      qty = $TotalQty
      availableQty = $AvailableQty
      reservedQty = [Math]::Max(0, $TotalQty - $AvailableQty)
      firmId = "sql-main"
      source = "CRM SQL"
    }
  }
  return @($Result)
}

function Convert-CrmSqlStockRows {
  param($Rows)

  $Result = @()
  foreach ($Row in (ConvertTo-ArraySafe -Value $Rows)) {
    $ProductId = Get-ObjectValue -Object $Row -Names @("productId", "product_id", "productCode", "product_code", "id", "oneCRef", "one_c_ref", "sku", "barcode") -Default ""
    $Sku = Get-ObjectValue -Object $Row -Names @("sku", "article", "internalCode", "internal_code", "productCode", "product_code", "code") -Default $ProductId
    $WarehouseId = Get-ObjectValue -Object $Row -Names @("warehouseId", "warehouse_id", "warehouseCode", "warehouse_code", "warehouseRef", "warehouse_ref") -Default "sql-total"
    $Warehouse = Get-ObjectValue -Object $Row -Names @("warehouse", "warehouseName", "warehouse_name", "stockName", "stock_name") -Default "SQL total stock"
    $Qty = ConvertTo-CrmSqlNumber -Value (Get-ObjectValue -Object $Row -Names @("qty", "quantity", "totalQuantity", "total_quantity", "balance") -Default 0)
    $AvailableQty = ConvertTo-CrmSqlNumber -Value (Get-ObjectValue -Object $Row -Names @("availableQty", "available_qty", "availableQuantity", "available_quantity", "freeQuantity", "free_quantity") -Default $Qty)
    $ReservedQty = ConvertTo-CrmSqlNumber -Value (Get-ObjectValue -Object $Row -Names @("reservedQty", "reserved_qty", "reservedQuantity", "reserved_quantity") -Default ([Math]::Max(0, $Qty - $AvailableQty)))
    $FirmId = Get-ObjectValue -Object $Row -Names @("firmId", "firm_id", "organizationId", "organization_id") -Default "sql-main"

    if ([string]::IsNullOrWhiteSpace("$ProductId")) {
      continue
    }

    $Result += [pscustomobject]@{
      productId = "$ProductId"
      sku = "$Sku"
      warehouseId = "$WarehouseId"
      warehouse = "$Warehouse"
      qty = $Qty
      availableQty = $AvailableQty
      reservedQty = $ReservedQty
      firmId = "$FirmId"
      source = "CRM SQL"
    }
  }
  return @($Result)
}

function Convert-CrmSqlWarehouseRows {
  param($Rows)

  $Result = @()
  foreach ($Row in (ConvertTo-ArraySafe -Value $Rows)) {
    $Id = Get-ObjectValue -Object $Row -Names @("id", "code", "warehouseId", "warehouse_id", "warehouseCode", "warehouse_code", "oneCRef", "one_c_ref") -Default ""
    $Name = Get-ObjectValue -Object $Row -Names @("name", "warehouse", "warehouseName", "warehouse_name") -Default "Warehouse"
    $Kind = Get-ObjectValue -Object $Row -Names @("kind", "type") -Default "1C"

    $Result += [pscustomobject]@{
      id = "$Id"
      name = "$Name"
      kind = "$Kind"
      source = "CRM SQL"
    }
  }
  return @($Result)
}

function Convert-CrmSqlFirmRows {
  param($Rows)

  $Result = @()
  foreach ($Row in (ConvertTo-ArraySafe -Value $Rows)) {
    $Id = Get-ObjectValue -Object $Row -Names @("id", "code", "firmId", "firm_id", "organizationId", "organization_id", "organizationCode", "organization_code", "oneCRef", "one_c_ref") -Default ""
    $Name = Get-ObjectValue -Object $Row -Names @("name", "firm", "organization", "organizationName", "organization_name") -Default "Firm"
    $TaxId = Get-ObjectValue -Object $Row -Names @("taxId", "tax_id", "edrpou") -Default ""

    $Result += [pscustomobject]@{
      id = "$Id"
      name = "$Name"
      taxId = "$TaxId"
      source = "CRM SQL"
    }
  }
  return @($Result)
}

function Convert-CrmSqlReceivableRows {
  param($Rows)

  $Result = @()
  foreach ($Row in (ConvertTo-ArraySafe -Value $Rows)) {
    $ClientId = Get-ObjectValue -Object $Row -Names @("clientId", "client_id", "customerId", "customer_id", "counterpartyId", "counterparty_id", "counterpartyCode", "counterparty_code", "id") -Default ""
    $Debt = ConvertTo-CrmSqlNumber -Value (Get-ObjectValue -Object $Row -Names @("debt", "receivable", "debit", "balance", "amount") -Default 0)
    $Id = Get-ObjectValue -Object $Row -Names @("id", "settlementId", "settlement_id", "counterpartyCode", "counterparty_code") -Default $ClientId
    $ClientName = Get-ObjectValue -Object $Row -Names @("clientName", "client_name", "customerName", "customer_name", "counterpartyName", "counterparty_name", "name") -Default ""
    $Currency = Get-ObjectValue -Object $Row -Names @("currency") -Default "UAH"
    $Date = Get-ObjectValue -Object $Row -Names @("date", "settlementDate", "settlement_date") -Default (Get-Date).ToString("yyyy-MM-dd")

    $Result += [pscustomobject]@{
      id = "$Id"
      clientId = "$ClientId"
      clientName = "$ClientName"
      debt = $Debt
      total = $Debt
      paid = 0
      currency = "$Currency"
      date = "$Date"
      source = "CRM SQL"
    }
  }
  return @($Result)
}

function Get-CrmSqlLatestPayload {
  param([string]$QueryString = "")

  $Warnings = New-Object System.Collections.ArrayList
  $Limit = Resolve-CrmSqlLimit -Value (Get-QueryValue -QueryString $QueryString -Key "limit")
  $ApiQuery = "limit=$Limit"

  $ProductRows = Try-CrmSqlApiRows -Label "one-c products" -Path "/one-c-mirror/products" -QueryString $ApiQuery -Warnings $Warnings
  $UsedProductFallback = $false
  if ($ProductRows.Count -eq 0) {
    $UsedProductFallback = $true
    $ProductRows = Try-CrmSqlApiRows -Label "products fallback" -Path "/products" -QueryString $ApiQuery -Warnings $Warnings
  }
  $CustomerRows = Try-CrmSqlApiRows -Label "one-c counterparties" -Path "/one-c-mirror/counterparties" -QueryString $ApiQuery -Warnings $Warnings
  $UsedCustomerFallback = $false
  if ($CustomerRows.Count -eq 0) {
    $UsedCustomerFallback = $true
    $CustomerRows = Try-CrmSqlApiRows -Label "customers fallback" -Path "/customers" -QueryString $ApiQuery -Warnings $Warnings
  }
  $WarehouseRows = Try-CrmSqlApiRows -Label "one-c warehouses" -Path "/one-c-mirror/warehouses" -QueryString $ApiQuery -Warnings $Warnings
  $UsedWarehouseFallback = $false
  if ($WarehouseRows.Count -eq 0) {
    $UsedWarehouseFallback = $true
    $WarehouseRows = Try-CrmSqlApiRows -Label "warehouses fallback" -Path "/warehouses" -QueryString $ApiQuery -Warnings $Warnings
  }
  $FirmRows = Try-CrmSqlApiRows -Label "one-c firms" -Path "/one-c-mirror/firms" -QueryString $ApiQuery -Warnings $Warnings
  $UsedFirmFallback = $false
  if ($FirmRows.Count -eq 0) {
    $UsedFirmFallback = $true
    $FirmRows = Try-CrmSqlApiRows -Label "firms fallback" -Path "/organizations" -QueryString $ApiQuery -Warnings $Warnings
  }
  $StockRows = Try-CrmSqlApiRows -Label "one-c stock" -Path "/one-c-mirror/stock" -QueryString $ApiQuery -Warnings $Warnings
  $ReceivableRows = Try-CrmSqlApiRows -Label "one-c receivables" -Path "/one-c-mirror/receivables" -QueryString $ApiQuery -Warnings $Warnings
  if ($ReceivableRows.Count -eq 0) {
    $ReceivableRows = Try-CrmSqlApiRows -Label "receivables fallback" -Path "/counterparty-balances" -QueryString $ApiQuery -Warnings $Warnings
  }

  if ($UsedProductFallback -or $UsedCustomerFallback -or $UsedWarehouseFallback -or $UsedFirmFallback -or $StockRows.Count -eq 0 -or $ReceivableRows.Count -eq 0) {
    Add-CrmSqlMirrorWarning -Warnings $Warnings -Code "CRM_SQL_PARTIAL_DATA" -Message "CRM SQL returned fallback or empty sections. Deploy one-c-mirror API on crm-sql to load all products, counterparties, warehouses, firms, stock and settlements."
  }

  $Products = Convert-CrmSqlProductRows -Rows $ProductRows
  $Clients = Convert-CrmSqlCustomerRows -Rows $CustomerRows
  $Warehouses = Convert-CrmSqlWarehouseRows -Rows $WarehouseRows
  if ($Warehouses.Count -eq 0) {
    $Warehouses = @([pscustomobject]@{
      id = "sql-total"
      name = "SQL total stock"
      kind = "virtual"
      source = "CRM SQL"
    })
  }
  $Firms = Convert-CrmSqlFirmRows -Rows $FirmRows
  if ($Firms.Count -eq 0) {
    $Firms = @([pscustomobject]@{
      id = "sql-main"
      name = "CRM SQL"
      taxId = ""
      source = "CRM SQL"
    })
  }
  $Stock = Convert-CrmSqlStockRows -Rows $StockRows
  if ($Stock.Count -eq 0) {
    $Stock = Convert-CrmSqlStockFromProducts -Rows $ProductRows
    if ($Stock.Count -eq 0) {
      Add-CrmSqlMirrorWarning -Warnings $Warnings -Code "CRM_SQL_EMPTY_STOCK" -Message "No stock rows returned from CRM SQL."
    }
  }
  $Receivables = Convert-CrmSqlReceivableRows -Rows $ReceivableRows
  $WarningCodes = @($Warnings | ForEach-Object {
    $Text = "$_"
    if ($Text -match "^([A-Z0-9_]+):") { $Matches[1] } else { "CRM_SQL_WARNING" }
  })
  $Partial = $WarningCodes -contains "CRM_SQL_ONEC_MIRROR_404" -or $WarningCodes -contains "CRM_SQL_PARTIAL_DATA"

  return [pscustomobject]@{
    ok = $true
    partial = $Partial
    errorCode = if ($WarningCodes.Count -gt 0) { $WarningCodes[0] } else { "" }
    source = "CRM SQL"
    generatedAt = (Get-Date).ToString("yyyy-MM-dd HH:mm:ss")
    requestedLimit = $Limit
    warnings = @($Warnings)
    warningCodes = @($WarningCodes)
    diagnostics = [pscustomobject]@{
      rawCounts = [pscustomobject]@{
        products = $ProductRows.Count
        clients = $CustomerRows.Count
        warehouses = $WarehouseRows.Count
        firms = $FirmRows.Count
        stock = $StockRows.Count
        receivables = $ReceivableRows.Count
      }
      convertedCounts = [pscustomobject]@{
        products = $Products.Count
        clients = $Clients.Count
        warehouses = $Warehouses.Count
        firms = $Firms.Count
        stock = $Stock.Count
        receivables = $Receivables.Count
      }
      fallback = [pscustomobject]@{
        products = $UsedProductFallback
        clients = $UsedCustomerFallback
        warehouses = $UsedWarehouseFallback
        firms = $UsedFirmFallback
      }
    }
    payload = [pscustomobject]@{
      schema = "marketplace-crm.onec.exchange.v1"
      source = "crm_sql"
      products = @($Products)
      clients = @($Clients)
      counterparties = @($Clients)
      warehouses = @($Warehouses)
      firms = @($Firms)
      stock = @($Stock)
      stockBalances = @($Stock)
      receivables = @($Receivables)
      counterpartyBalances = @($Receivables)
      payments = @()
      payables = @()
      shipments = @()
    }
  }
}

function ConvertFrom-Utf8Base64 {
  param([string]$Text)
  return [System.Text.Encoding]::UTF8.GetString([Convert]::FromBase64String($Text))
}

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
    @{ id = "rozetka"; name = "Rozetka"; status = "token_needed"; scope = "товари, публікації, замовлення, питання покупців, Call Center, переписка з ROZETKA" },
    @{ id = "prom"; name = "Prom"; status = "ok"; scope = "товари, замовлення, залишки, ціни" },
    @{ id = "epicentr"; name = "Epicentr"; status = "mapping_needed"; scope = "товари, замовлення, залишки" },
    @{ id = "allo"; name = "Allo"; status = "ok"; scope = "товари, замовлення, залишки, ціни" }
  )
  novaPayPayments = @(
    @{
      id = "npay-demo-001"; ttn = "NP-590010333"; date = "2026-05-23"; paidAt = "2026-05-23 12:44";
      amount = 5400; currency = "UAH"; payerName = (ConvertFrom-Utf8Base64 "0J7Qu9C10LrRgdCw0L3QtNGAINCa0LvQuNC80LXQvdC60L4="); status = "paid"; gatewayRef = "gateway-demo-ok"
    },
    @{
      id = "npay-demo-002"; ttn = ""; date = "2026-05-23"; paidAt = "2026-05-23 13:05";
      amount = 900; currency = "UAH"; payerName = (ConvertFrom-Utf8Base64 "0JHQtdC3INCi0KLQnQ=="); status = "paid"; gatewayRef = "gateway-demo-empty-ttn"
    },
    @{
      id = "npay-demo-003"; ttn = "NP-590010333"; date = "2026-05-23"; paidAt = "2026-05-23 13:15";
      amount = 5300; currency = "UAH"; payerName = (ConvertFrom-Utf8Base64 "0J7Qu9C10LrRgdCw0L3QtNGAINCa0LvQuNC80LXQvdC60L4="); status = "paid"; gatewayRef = "gateway-demo-mismatch"
    }
  )
}

$RozetkaRequirements = @(
  @{ id = "credentials"; title = "Rozetka credentials"; required = $true; details = "ROZETKA_API_TOKEN or ROZETKA_USERNAME + ROZETKA_PASSWORD in .env" },
  @{ id = "goods"; title = "Goods"; required = $true; details = "GET /items/search for full active catalog; GET /goods/new for new items" },
  @{ id = "orders"; title = "Orders"; required = $true; details = "GET /orders/search and /orders/{id}, permission order_edit" },
  @{ id = "messages"; title = "Buyer messages"; required = $true; details = "GET /messages/counts, GET /messages/search, POST /messages/create, permission correspondence" },
  @{ id = "calls"; title = "Call Center requests"; required = $true; details = "GET /calls/search, PUT /calls/change-status, permission correspondence" },
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
    502 { "Bad Gateway" }
    503 { "Service Unavailable" }
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

function Get-CrmLogPath {
  if (-not [string]::IsNullOrWhiteSpace($Script:CrmLogPath)) {
    return $Script:CrmLogPath
  }

  $ConfiguredPath = $LogPath
  if ([string]::IsNullOrWhiteSpace($ConfiguredPath)) {
    $ConfiguredPath = [Environment]::GetEnvironmentVariable("CRM_LOG_PATH", "Process")
  }

  if ([string]::IsNullOrWhiteSpace($ConfiguredPath)) {
    $ConfiguredPath = Join-Path $Root "crm-http.ndjson"
  }

  $Resolved = [System.IO.Path]::GetFullPath($ConfiguredPath)
  $Directory = [System.IO.Path]::GetDirectoryName($Resolved)
  if (-not [string]::IsNullOrWhiteSpace($Directory) -and -not (Test-Path -LiteralPath $Directory -PathType Container)) {
    [void][System.IO.Directory]::CreateDirectory($Directory)
  }
  $Script:CrmLogPath = $Resolved
  return $Script:CrmLogPath
}

function Get-BytesSha256 {
  param([byte[]]$Bytes)

  [byte[]]$InputBytes = New-Object byte[] 0
  if ($null -ne $Bytes -and $Bytes.Length -gt 0) {
    $InputBytes = $Bytes
  }
  $Hasher = [System.Security.Cryptography.SHA256]::Create()
  try {
    return ([System.BitConverter]::ToString($Hasher.ComputeHash($InputBytes, 0, $InputBytes.Length)) -replace "-", "").ToLowerInvariant()
  }
  finally {
    $Hasher.Dispose()
  }
}

function ConvertTo-LoggedBody {
  param(
    [byte[]]$Bytes,
    [string]$ContentType = ""
  )

  [byte[]]$InputBytes = New-Object byte[] 0
  if ($null -ne $Bytes -and $Bytes.Length -gt 0) {
    $InputBytes = $Bytes
  }
  $Result = [ordered]@{
    bytes = $InputBytes.Length
    sha256 = Get-BytesSha256 -Bytes $InputBytes
  }
  if ($InputBytes.Length -le 0) {
    $Result.encoding = "empty"
    $Result.text = ""
    return $Result
  }

  if ($ContentType -match "(?i)(json|text|javascript|html|css|xml|x-www-form-urlencoded)") {
    $Result.encoding = "utf8"
    $Result.text = [System.Text.Encoding]::UTF8.GetString($InputBytes)
    return $Result
  }

  $Result.encoding = "base64"
  $Result.base64 = [Convert]::ToBase64String($InputBytes)
  return $Result
}

function ConvertTo-LoggedTextBody {
  param(
    [string]$Text,
    [string]$ContentType = "text/plain; charset=utf-8"
  )

  if ($null -eq $Text) {
    $Text = ""
  }
  return ConvertTo-LoggedBody -Bytes (ConvertTo-Utf8Bytes $Text) -ContentType $ContentType
}

function Write-CrmLogRecord {
  param([object]$Record)

  try {
    $Path = Get-CrmLogPath
    $Envelope = [ordered]@{
      loggedAt = (Get-Date).ToString("o")
      record = $Record
    }
    $Json = $Envelope | ConvertTo-Json -Depth 32 -Compress
    [System.IO.File]::AppendAllText($Path, "$Json`r`n", [System.Text.Encoding]::UTF8)
  }
  catch {
    Write-Host "CRM log write failed: $($_.Exception.Message)"
  }
}

function Get-ObjectPropertyValue {
  param(
    [object]$Value,
    [string]$Name
  )

  if ($null -eq $Value -or [string]::IsNullOrWhiteSpace($Name)) {
    return $null
  }
  if ($Value -is [hashtable] -and $Value.ContainsKey($Name)) {
    return $Value[$Name]
  }
  $Property = $Value.PSObject.Properties[$Name]
  if ($null -ne $Property) {
    return $Property.Value
  }
  return $null
}

function Get-FirstTextValue {
  param([object[]]$Values)

  foreach ($Value in $Values) {
    if ($null -eq $Value) { continue }
    $Text = [string]$Value
    if (-not [string]::IsNullOrWhiteSpace($Text)) {
      return $Text
    }
  }
  return ""
}

function ConvertTo-CrmLogPreviewRow {
  param([object]$Entry)

  $LoggedAt = Get-ObjectPropertyValue -Value $Entry -Name "loggedAt"
  $Record = Get-ObjectPropertyValue -Value $Entry -Name "record"
  if ($null -eq $Record) {
    $Record = $Entry
  }

  $Event = Get-ObjectPropertyValue -Value $Record -Name "event"
  $RequestId = Get-ObjectPropertyValue -Value $Record -Name "requestId"
  $Remote = Get-ObjectPropertyValue -Value $Record -Name "remote"
  $Request = Get-ObjectPropertyValue -Value $Record -Name "request"
  $Response = Get-ObjectPropertyValue -Value $Record -Name "response"
  $Payload = Get-ObjectPropertyValue -Value $Record -Name "payload"
  $Details = Get-ObjectPropertyValue -Value $Payload -Name "details"

  $Method = Get-ObjectPropertyValue -Value $Request -Name "method"
  $Path = Get-ObjectPropertyValue -Value $Request -Name "path"
  $StatusCode = Get-ObjectPropertyValue -Value $Response -Name "statusCode"
  $PayloadEvent = Get-ObjectPropertyValue -Value $Payload -Name "event"
  $Code = Get-FirstTextValue -Values @(
    (Get-ObjectPropertyValue -Value $Payload -Name "code"),
    (Get-ObjectPropertyValue -Value $Payload -Name "errorCode"),
    (Get-ObjectPropertyValue -Value $Details -Name "code"),
    (Get-ObjectPropertyValue -Value $Details -Name "errorCode"),
    (Get-ObjectPropertyValue -Value $Details -Name "lastErrorCode")
  )
  $Summary = Get-FirstTextValue -Values @(
    (Get-ObjectPropertyValue -Value $Payload -Name "message"),
    (Get-ObjectPropertyValue -Value $Details -Name "message"),
    (Get-ObjectPropertyValue -Value $Details -Name "lastMessage"),
    $PayloadEvent,
    $Event
  )

  if ([string]::IsNullOrWhiteSpace($Summary) -and -not [string]::IsNullOrWhiteSpace($Method)) {
    $Summary = "$Method $Path"
  }
  if ($Summary.Length -gt 240) {
    $Summary = $Summary.Substring(0, 240)
  }

  return [ordered]@{
    loggedAt = [string]$LoggedAt
    event = [string](Get-FirstTextValue -Values @($PayloadEvent, $Event))
    requestId = [string]$RequestId
    remote = [string]$Remote
    method = [string]$Method
    path = [string]$Path
    statusCode = [string]$StatusCode
    code = [string]$Code
    summary = [string]$Summary
  }
}

function Read-CrmLogPreview {
  param([int]$Limit = 40)

  if ($Limit -lt 1) { $Limit = 40 }
  if ($Limit -gt 200) { $Limit = 200 }
  $Path = Get-CrmLogPath
  $Rows = @()
  if (Test-Path -LiteralPath $Path -PathType Leaf) {
    $Lines = [System.IO.File]::ReadLines($Path) | Select-Object -Last $Limit
    foreach ($Line in $Lines) {
      if ([string]::IsNullOrWhiteSpace($Line)) { continue }
      try {
        $Rows += ConvertTo-CrmLogPreviewRow -Entry ($Line | ConvertFrom-Json)
      }
      catch {
        $Rows += [ordered]@{
          loggedAt = ""
          event = "log_parse_error"
          requestId = ""
          remote = ""
          method = ""
          path = ""
          statusCode = ""
          code = "CRM_LOG_PARSE_ERROR"
          summary = $_.Exception.Message
        }
      }
    }
  }

  return [ordered]@{
    ok = $true
    logPath = $Path
    workLogPath = "D:\Codex\CRM\SQL\docs\crm-sql-work-log-2026-06-01.md"
    checkedAt = (Get-Date).ToString("o")
    count = $Rows.Count
    rows = @($Rows)
  }
}

function New-CrmRequestLogContext {
  param(
    [System.Net.Sockets.TcpClient]$Client,
    $Request
  )

  $Remote = ""
  try {
    $Remote = $Client.Client.RemoteEndPoint.ToString()
  }
  catch {
  }

  return [ordered]@{
    requestId = [Guid]::NewGuid().ToString("N")
    remote = $Remote
    receivedAt = (Get-Date).ToString("o")
    request = [ordered]@{
      method = $Request.method
      path = $Request.path
      query = $Request.query
      headers = $Request.headers
      body = ConvertTo-LoggedTextBody -Text $Request.body -ContentType ($Request.headers["Content-Type"] -as [string])
    }
  }
}

function Start-CrmRequestLog {
  param(
    [System.Net.Sockets.TcpClient]$Client,
    $Request
  )

  $Script:CurrentRequestLogContext = New-CrmRequestLogContext -Client $Client -Request $Request
  Write-CrmLogRecord -Record ([ordered]@{
    event = "http_request"
    requestId = $Script:CurrentRequestLogContext.requestId
    remote = $Script:CurrentRequestLogContext.remote
    request = $Script:CurrentRequestLogContext.request
  })
}

function Write-CrmResponseLog {
  param(
    [int]$StatusCode,
    [string]$StatusText,
    [string]$ContentType,
    [byte[]]$Body
  )

  if ($null -eq $Script:CurrentRequestLogContext) {
    return
  }

  Write-CrmLogRecord -Record ([ordered]@{
    event = "http_response"
    requestId = $Script:CurrentRequestLogContext.requestId
    remote = $Script:CurrentRequestLogContext.remote
    request = $Script:CurrentRequestLogContext.request
    response = [ordered]@{
      statusCode = $StatusCode
      statusText = $StatusText
      contentType = $ContentType
      body = ConvertTo-LoggedBody -Bytes $Body -ContentType $ContentType
    }
  })
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
  Write-CrmResponseLog -StatusCode $StatusCode -StatusText $StatusText -ContentType $ContentType -Body $Body
  $Header = "HTTP/1.1 $StatusCode $StatusText`r`n" +
    "Content-Type: $ContentType`r`n" +
    "Content-Length: $($Body.Length)`r`n" +
    "Cache-Control: no-store, no-cache, must-revalidate, max-age=0`r`n" +
    "Pragma: no-cache`r`n" +
    "Expires: 0`r`n" +
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
  $Script:CurrentRequestLogContext = $null
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

  try {
    $Stream = $Client.GetStream()
    $Buffer = New-Object byte[] 65536
    $Read = $Stream.Read($Buffer, 0, $Buffer.Length)
  }
  catch [System.IO.IOException] {
    return $null
  }
  catch [System.Net.Sockets.SocketException] {
    return $null
  }
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
  $Headers = @{}
  for ($Index = 1; $Index -lt $Lines.Count; $Index++) {
    $Line = $Lines[$Index]
    $Separator = $Line.IndexOf(":")
    if ($Separator -le 0) {
      continue
    }
    $Name = $Line.Substring(0, $Separator).Trim()
    $Value = $Line.Substring($Separator + 1).Trim()
    if (-not [string]::IsNullOrWhiteSpace($Name)) {
      $Headers[$Name] = $Value
    }
  }
  $ContentLength = 0
  [void][int]::TryParse(($Headers["Content-Length"] -as [string]), [ref]$ContentLength)
  if ($ContentLength -gt 0) {
    if (($Headers["Expect"] -as [string]) -match "100-continue") {
      $ContinueBytes = [System.Text.Encoding]::ASCII.GetBytes("HTTP/1.1 100 Continue`r`n`r`n")
      $Stream.Write($ContinueBytes, 0, $ContinueBytes.Length)
      $Stream.Flush()
    }

    $BodyStream = New-Object System.IO.MemoryStream
    $InitialBodyBytes = [System.Text.Encoding]::UTF8.GetBytes($Body)
    if ($InitialBodyBytes.Length -gt 0) {
      $BodyStream.Write($InitialBodyBytes, 0, [Math]::Min($InitialBodyBytes.Length, $ContentLength))
    }
    while ($BodyStream.Length -lt $ContentLength) {
      $Remaining = [Math]::Min($Buffer.Length, $ContentLength - [int]$BodyStream.Length)
      $BodyRead = $Stream.Read($Buffer, 0, $Remaining)
      if ($BodyRead -le 0) {
        break
      }
      $BodyStream.Write($Buffer, 0, $BodyRead)
    }
    $BodyBytes = $BodyStream.ToArray()
    $BodyLength = [Math]::Min($BodyBytes.Length, $ContentLength)
    $Body = [System.Text.Encoding]::UTF8.GetString($BodyBytes, 0, $BodyLength)
  }

  $PathAndQuery = $RequestLine[1]
  $PathParts = $PathAndQuery -split "\?", 2

  return @{
    method = $RequestLine[0]
    path = $PathParts[0]
    query = if ($PathParts.Count -gt 1) { $PathParts[1] } else { "" }
    headers = $Headers
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

  function Invoke-RozetkaPostJson {
    param(
      [string]$Path,
      [object]$BodyObject
    )

    $Node = Get-NodeExecutable
    $Helper = Join-Path $Root "src\rozetka-http.mjs"
    if (-not (Test-Path -LiteralPath $Helper -PathType Leaf)) {
      throw "Rozetka Node helper is missing: $Helper"
    }

    $Request = @{
      method = "POST"
      path = $Path
      body = $BodyObject
    } | ConvertTo-Json -Depth 20 -Compress
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

function Get-NovaPoshtaApiUrl {
  if ([string]::IsNullOrWhiteSpace($env:NOVA_POSHTA_API_URL)) {
    return "https://api.novaposhta.ua/v2.0/json/"
  }
  return $env:NOVA_POSHTA_API_URL
}

function Get-NovaPoshtaApiKey {
  if (-not [string]::IsNullOrWhiteSpace($env:NOVA_POSHTA_API_KEY)) {
    return $env:NOVA_POSHTA_API_KEY
  }
  if (-not [string]::IsNullOrWhiteSpace($env:NOVAPOSHTA_API_KEY)) {
    return $env:NOVAPOSHTA_API_KEY
  }
  return ""
}

function Get-NovaPoshtaTimeoutSec {
  $TimeoutSec = 20
  if (-not [string]::IsNullOrWhiteSpace($env:NOVA_POSHTA_TIMEOUT_SEC)) {
    [void][int]::TryParse($env:NOVA_POSHTA_TIMEOUT_SEC, [ref]$TimeoutSec)
  }
  if ($TimeoutSec -lt 1) { return 20 }
  return $TimeoutSec
}

function Get-NovaPoshtaThrottleMs {
  $ThrottleMs = 1200
  if (-not [string]::IsNullOrWhiteSpace($env:NOVA_POSHTA_THROTTLE_MS)) {
    [void][int]::TryParse($env:NOVA_POSHTA_THROTTLE_MS, [ref]$ThrottleMs)
  }
  if ($ThrottleMs -lt 0) { return 1200 }
  return $ThrottleMs
}

function Resolve-CrmServerPath {
  param([string]$Path)

  if ([string]::IsNullOrWhiteSpace($Path)) {
    return ""
  }
  if ([System.IO.Path]::IsPathRooted($Path)) {
    return [System.IO.Path]::GetFullPath($Path)
  }
  return [System.IO.Path]::GetFullPath((Join-Path $Root $Path))
}

function Test-NovaPoshtaFullHistoryMode {
  param([string]$QueryString = "")

  $Mode = (Get-QueryValue -QueryString $QueryString -Key "history").Trim().ToLowerInvariant()
  return ($Mode -in @("all", "full", "1", "true", "archive"))
}

function Get-NovaPoshtaHistoryFrom {
  param([string]$QueryString = "")

  $From = Get-QueryValue -QueryString $QueryString -Key "from"
  if ([string]::IsNullOrWhiteSpace($From)) {
    $From = Get-QueryValue -QueryString $QueryString -Key "historyFrom"
  }
  if ([string]::IsNullOrWhiteSpace($From)) {
    $From = Get-EnvOrDefault -Name "NOVA_POSHTA_HISTORY_FROM" -Default "2020-01-01"
  }
  return $From
}

function Get-NovaPoshtaHistoryWindowDays {
  param([string]$QueryString = "")

  $WindowDays = 30
  $Text = Get-QueryValue -QueryString $QueryString -Key "windowDays"
  if ([string]::IsNullOrWhiteSpace($Text)) {
    $Text = Get-EnvOrDefault -Name "NOVA_POSHTA_HISTORY_WINDOW_DAYS" -Default ""
  }
  [void][int]::TryParse($Text, [ref]$WindowDays)
  if ($WindowDays -lt 1) { return 30 }
  if ($WindowDays -gt 30) { return 30 }
  return $WindowDays
}

function Get-NovaPoshtaCachePath {
  $Configured = Get-EnvOrDefault -Name "NOVA_POSHTA_CACHE_PATH" -Default ""
  if (-not [string]::IsNullOrWhiteSpace($Configured)) {
    return Resolve-CrmServerPath -Path $Configured
  }
  return (Join-Path (Join-Path $Root ".cache") "nova-poshta-documents-cache.json")
}

function Read-NovaPoshtaDocumentCache {
  $Path = Get-NovaPoshtaCachePath
  if (-not (Test-Path -LiteralPath $Path -PathType Leaf)) {
    return [pscustomobject]@{ version = 1; documents = @(); periods = @() }
  }
  try {
    $Text = [System.IO.File]::ReadAllText($Path, [System.Text.Encoding]::UTF8)
    $Payload = $Text | ConvertFrom-Json
    if ($null -eq $Payload.PSObject.Properties["documents"]) {
      $Payload | Add-Member -NotePropertyName documents -NotePropertyValue @() -Force
    }
    if ($null -eq $Payload.PSObject.Properties["periods"]) {
      $Payload | Add-Member -NotePropertyName periods -NotePropertyValue @() -Force
    }
    return $Payload
  } catch {
    return [pscustomobject]@{ version = 1; documents = @(); periods = @(); readError = $_.Exception.Message }
  }
}

function Write-NovaPoshtaDocumentCache {
  param([object]$Payload)

  $Path = Get-NovaPoshtaCachePath
  $Directory = Split-Path -Parent $Path
  if (-not (Test-Path -LiteralPath $Directory -PathType Container)) {
    New-Item -ItemType Directory -Path $Directory -Force | Out-Null
  }
  $Json = $Payload | ConvertTo-Json -Depth 20
  [System.IO.File]::WriteAllText($Path, $Json, [System.Text.Encoding]::UTF8)
  return $Path
}

function Get-NovaPoshtaDocumentCacheKey {
  param(
    [object]$Document,
    [int]$Index = 0
  )

  $Ref = Get-ObjectValue -Object $Document -Names @("ref", "Ref", "DocumentRef", "id") -Default ""
  if (-not [string]::IsNullOrWhiteSpace("$Ref")) { return "ref:$Ref" }
  $Number = Get-ObjectValue -Object $Document -Names @("ttn", "number", "IntDocNumber", "Number", "DocumentNumber") -Default ""
  if (-not [string]::IsNullOrWhiteSpace("$Number")) { return "ttn:$Number" }
  return "row:$Index"
}

function Merge-NovaPoshtaDocumentCache {
  param(
    [object[]]$Incoming,
    [object[]]$Periods
  )

  $Cache = Read-NovaPoshtaDocumentCache
  $ExistingRows = @(ConvertTo-ArraySafe -Value $Cache.documents)
  $Map = @{}
  $Order = New-Object System.Collections.ArrayList
  $Index = 0
  foreach ($Row in $ExistingRows) {
    $Key = Get-NovaPoshtaDocumentCacheKey -Document $Row -Index $Index
    if (-not $Map.ContainsKey($Key)) {
      $Map[$Key] = $Row
      [void]$Order.Add($Key)
    }
    $Index += 1
  }

  $Added = 0
  $Updated = 0
  $Skipped = 0
  $IncomingIndex = 0
  foreach ($Row in @($Incoming)) {
    $Key = Get-NovaPoshtaDocumentCacheKey -Document $Row -Index $IncomingIndex
    $IncomingJson = $Row | ConvertTo-Json -Depth 12 -Compress
    if ($Map.ContainsKey($Key)) {
      $ExistingJson = $Map[$Key] | ConvertTo-Json -Depth 12 -Compress
      if ($ExistingJson -ne $IncomingJson) {
        $Map[$Key] = $Row
        $Updated += 1
      } else {
        $Skipped += 1
      }
    } else {
      $Map[$Key] = $Row
      [void]$Order.Add($Key)
      $Added += 1
    }
    $IncomingIndex += 1
  }

  $Merged = @($Order | ForEach-Object { $Map[$_] } | Sort-Object -Property date, number, ref -Descending)
  $Payload = [ordered]@{
    version = 1
    generatedAt = (Get-Date).ToString("yyyy-MM-dd HH:mm:ss")
    count = $Merged.Count
    added = $Added
    updated = $Updated
    skipped = $Skipped
    periods = @($Periods)
    documents = @($Merged)
  }
  $Path = Write-NovaPoshtaDocumentCache -Payload $Payload
  return [ordered]@{
    cachePath = $Path
    count = $Merged.Count
    added = $Added
    updated = $Updated
    skipped = $Skipped
    documents = @($Merged)
  }
}

function ConvertTo-NovaPoshtaDeliveryStatus {
  param(
    [string]$StatusCode = "",
    [string]$Status = ""
  )

  $Code = $StatusCode.Trim()
  $Text = $Status.ToLowerInvariant()
  if ($Code -in @("9", "10", "11", "106") -or $Text.Contains("отримано") -or $Text.Contains("отриман")) { return "delivered" }
  if ($Code -in @("102", "103", "108") -or $Text.Contains("відмова") -or $Text.Contains("повернен")) { return "delivery_problem" }
  if ($Code -in @("7", "8") -or $Text.Contains("прибув") -or $Text.Contains("відділен") -or $Text.Contains("поштомат")) { return "arrived_branch" }
  if ($Code -in @("5", "6", "41", "101") -or $Text.Contains("дороз") -or $Text.Contains("пряму")) { return "in_transit" }
  if ($Code -in @("1", "4") -or $Text.Contains("очіку")) { return "sent_to_delivery" }
  return "sent_to_delivery"
}

function Invoke-NovaPoshtaApi {
  param(
    [string]$ModelName,
    [string]$CalledMethod,
    [object]$MethodProperties
  )

  $ApiKey = Get-NovaPoshtaApiKey
  if ([string]::IsNullOrWhiteSpace($ApiKey)) {
    $ErrorRecord = New-Object System.Exception("NOVA_POSHTA_API_KEY is not configured in .env.")
    $ErrorRecord.Data["Code"] = "NP_DELIVERY_NO_KEY"
    throw $ErrorRecord
  }

  $BodyObject = [ordered]@{
    apiKey = $ApiKey
    modelName = $ModelName
    calledMethod = $CalledMethod
    methodProperties = $MethodProperties
  }
  $Body = $BodyObject | ConvertTo-Json -Depth 12 -Compress
  return Invoke-RestMethod -Method Post -Uri (Get-NovaPoshtaApiUrl) -ContentType "application/json; charset=utf-8" -Body $Body -TimeoutSec (Get-NovaPoshtaTimeoutSec)
}

function ConvertTo-NovaPoshtaApiDate {
  param(
    [string]$Value,
    [int]$OffsetDays = 0
  )

  $Text = "$Value".Trim()
  if ([string]::IsNullOrWhiteSpace($Text)) {
    $Text = (Get-Date).Date.AddDays($OffsetDays).ToString("yyyy-MM-dd")
  }
  $Parsed = [datetime]::MinValue
  foreach ($Format in @("yyyy-MM-dd", "dd.MM.yyyy", "yyyy-MM-ddTHH:mm:ss", "dd.MM.yyyy HH:mm:ss")) {
    if ([datetime]::TryParseExact($Text, $Format, [Globalization.CultureInfo]::InvariantCulture, [Globalization.DateTimeStyles]::None, [ref]$Parsed)) {
      return $Parsed.ToString("dd.MM.yyyy")
    }
  }
  if ([datetime]::TryParse($Text, [ref]$Parsed)) {
    return $Parsed.ToString("dd.MM.yyyy")
  }
  return $Text
}

function ConvertTo-NovaPoshtaDocumentRow {
  param(
    $Row,
    [int]$Index = 0
  )

  $Number = Get-ObjectValue -Object $Row -Names @("IntDocNumber", "Number", "DocumentNumber", "ttn", "TTN") -Default ""
  $Ref = Get-ObjectValue -Object $Row -Names @("Ref", "DocumentRef", "ref", "id") -Default ""
  if ([string]::IsNullOrWhiteSpace("$Ref")) {
    $Ref = "np-doc-$Number-$Index"
  }
  $Date = Get-ObjectValue -Object $Row -Names @("DateTime", "Date", "CreateTime", "CreatedAt") -Default ""
  $Status = Get-ObjectValue -Object $Row -Names @("StateName", "Status", "StatusName") -Default ""
  $StatusCode = Get-ObjectValue -Object $Row -Names @("StateId", "StatusCode", "StatusCodeId") -Default ""
  $CitySender = Get-ObjectValue -Object $Row -Names @("CitySender", "SenderCity", "CitySenderDescription") -Default ""
  $CityRecipient = Get-ObjectValue -Object $Row -Names @("CityRecipient", "RecipientCity", "CityRecipientDescription") -Default ""
  $Sender = Get-ObjectValue -Object $Row -Names @("Sender", "SenderDescription", "ContactSender") -Default ""
  $Recipient = Get-ObjectValue -Object $Row -Names @("Recipient", "RecipientDescription", "ContactRecipient") -Default ""
  $Cost = Get-ObjectValue -Object $Row -Names @("Cost", "DocumentCost", "AnnouncedPrice") -Default ""
  $SeatsAmount = Get-ObjectValue -Object $Row -Names @("SeatsAmount", "Seats") -Default ""
  return [pscustomobject]@{
    id = "$Ref"
    ref = "$Ref"
    ttn = "$Number"
    number = "$Number"
    date = "$Date"
    status = "$Status"
    statusCode = "$StatusCode"
    citySender = "$CitySender"
    cityRecipient = "$CityRecipient"
    sender = "$Sender"
    recipient = "$Recipient"
    cost = "$Cost"
    seatsAmount = "$SeatsAmount"
    raw = $Row
  }
}

function Invoke-NovaPoshtaDocuments {
  param([string]$QueryString = "")

  $FullHistoryMode = Test-NovaPoshtaFullHistoryMode -QueryString $QueryString
  $From = Get-QueryValue -QueryString $QueryString -Key "from"
  $To = Get-QueryValue -QueryString $QueryString -Key "to"
  if ([string]::IsNullOrWhiteSpace($From)) {
    $From = Get-NovaPoshtaHistoryFrom -QueryString $QueryString
  }
  $DateFrom = ConvertTo-NovaPoshtaApiDate -Value $From
  $DateTo = ConvertTo-NovaPoshtaApiDate -Value $To -OffsetDays 0
  $StartDate = [datetime]::ParseExact($DateFrom, "dd.MM.yyyy", [Globalization.CultureInfo]::InvariantCulture)
  $EndDate = [datetime]::ParseExact($DateTo, "dd.MM.yyyy", [Globalization.CultureInfo]::InvariantCulture)
  if ($StartDate -gt $EndDate) {
    $SwapDate = $StartDate
    $StartDate = $EndDate
    $EndDate = $SwapDate
  }
  $PageSize = if ($FullHistoryMode) { 500 } else { 100 }
  $PageSizeText = Get-QueryValue -QueryString $QueryString -Key "limit"
  if (-not [string]::IsNullOrWhiteSpace($PageSizeText)) {
    [void][int]::TryParse($PageSizeText, [ref]$PageSize)
  }
  if ($PageSize -lt 1) { $PageSize = 100 }
  if ($PageSize -gt 500) { $PageSize = 500 }
  $MaxPages = if ($FullHistoryMode) { 1000 } else { 100 }
  $MaxPagesText = Get-QueryValue -QueryString $QueryString -Key "maxPages"
  if (-not [string]::IsNullOrWhiteSpace($MaxPagesText)) {
    [void][int]::TryParse($MaxPagesText, [ref]$MaxPages)
  }
  if ($MaxPages -lt 1) { $MaxPages = 100 }
  if ($MaxPages -gt 5000) { $MaxPages = 5000 }
  $WindowDays = Get-NovaPoshtaHistoryWindowDays -QueryString $QueryString

  $Rows = New-Object System.Collections.ArrayList
  $Warnings = New-Object System.Collections.ArrayList
  $Partial = $false
  $ErrorCode = ""
  $StopAll = $false
  $Periods = New-Object System.Collections.ArrayList
  $WindowStart = $StartDate
  while ($WindowStart -le $EndDate -and -not $StopAll) {
    $WindowEnd = $WindowStart.AddDays($WindowDays - 1)
    if ($WindowEnd -gt $EndDate) {
      $WindowEnd = $EndDate
    }
    $WindowFrom = $WindowStart.ToString("dd.MM.yyyy")
    $WindowTo = $WindowEnd.ToString("dd.MM.yyyy")
    $Period = [ordered]@{ from = $WindowFrom; to = $WindowTo; pages = 0; count = 0; ok = $true }
    [void]$Periods.Add($Period)

    for ($Page = 1; $Page -le $MaxPages; $Page += 1) {
      $Properties = [ordered]@{
        DateTimeFrom = $WindowFrom
        DateTimeTo = $WindowTo
        Page = "$Page"
        Limit = "$PageSize"
        GetFullList = "1"
      }
      $Response = $null
      $LastErrorText = ""
      for ($Attempt = 1; $Attempt -le 3; $Attempt += 1) {
        $Response = Invoke-NovaPoshtaApi -ModelName "InternetDocument" -CalledMethod "getDocumentList" -MethodProperties $Properties
        if ([bool]$Response.success) {
          break
        }
        $AttemptErrors = @($Response.errors)
        $LastErrorText = if ($AttemptErrors.Count -gt 0) { [string]$AttemptErrors[0] } else { "Nova Poshta getDocumentList failed." }
        if ($LastErrorText.ToLowerInvariant().Contains("many request")) {
          Start-Sleep -Seconds ([Math]::Min(20, 4 * $Attempt))
          continue
        }
        break
      }
      if (-not [bool]$Response.success) {
        $Errors = @($Response.errors)
        $Message = if ($Errors.Count -gt 0) { [string]$Errors[0] } else { "Nova Poshta getDocumentList failed." }
        if ($Message.ToLowerInvariant().Contains("many request")) {
          $Partial = $true
          $ErrorCode = "NP_DOCUMENTS_RATE_LIMIT"
          [void]$Warnings.Add("${ErrorCode}: $Message")
          $Period.ok = $false
          $Period.error = $Message
          $StopAll = $true
          break
        }
        if ($FullHistoryMode) {
          $Partial = $true
          $ErrorCode = "NP_DOCUMENTS_WINDOW_FAILED"
          [void]$Warnings.Add("${ErrorCode} ${WindowFrom}..${WindowTo}: $Message")
          $Period.ok = $false
          $Period.error = $Message
          break
        }
        $ErrorRecord = New-Object System.Exception($Message)
        $ErrorRecord.Data["Code"] = "NP_DOCUMENTS_API_ERROR"
        throw $ErrorRecord
      }
      $DataRows = @($Response.data)
      $Index = $Rows.Count
      foreach ($Row in $DataRows) {
        [void]$Rows.Add((ConvertTo-NovaPoshtaDocumentRow -Row $Row -Index $Index))
        $Index += 1
      }
      foreach ($Warning in @($Response.warnings)) {
        if (-not [string]::IsNullOrWhiteSpace("$Warning")) {
          [void]$Warnings.Add("$Warning")
        }
      }
      $Period.pages = $Page
      $Period.count = [int]$Period.count + $DataRows.Count
      $ThrottleMs = Get-NovaPoshtaThrottleMs
      if ($ThrottleMs -gt 0) {
        Start-Sleep -Milliseconds $ThrottleMs
      }
      if ($DataRows.Count -lt $PageSize) {
        break
      }
    }
    $WindowStart = $WindowEnd.AddDays(1)
  }

  $Cache = $null
  $Documents = @($Rows)
  if ($FullHistoryMode) {
    $Cache = Merge-NovaPoshtaDocumentCache -Incoming @($Rows) -Periods @($Periods)
    $Documents = @($Cache.documents)
  }

  return [ordered]@{
    ok = $true
    provider = "Nova Poshta"
    source = "Nova Poshta server gateway"
    serverGateway = $true
    apiKeyInBrowser = $false
    partial = $Partial
    errorCode = $ErrorCode
    historyMode = if ($FullHistoryMode) { "all" } else { "range" }
    dateFrom = $DateFrom
    dateTo = $DateTo
    periods = @($Periods)
    count = $Documents.Count
    fetched = $Rows.Count
    generatedAt = (Get-Date).ToString("yyyy-MM-dd HH:mm:ss")
    documents = @($Documents)
    warnings = @($Warnings)
    history = if ($FullHistoryMode) {
      @{
        fetched = $Rows.Count
        cacheCount = $Cache.count
        added = $Cache.added
        updated = $Cache.updated
        skipped = $Cache.skipped
        cachePath = $Cache.cachePath
        pageSize = $PageSize
        maxPages = $MaxPages
        windowDays = $WindowDays
        periods = @($Periods)
      }
    } else { $null }
  }
}

function Invoke-NovaPoshtaTracking {
  param([string]$QueryString = "")

  $ApiKey = Get-NovaPoshtaApiKey
  if ([string]::IsNullOrWhiteSpace($ApiKey)) {
    $ErrorRecord = New-Object System.Exception("NOVA_POSHTA_API_KEY is not configured in .env.")
    $ErrorRecord.Data["Code"] = "NP_DELIVERY_NO_KEY"
    throw $ErrorRecord
  }

  $Ttn = (Get-QueryValue -QueryString $QueryString -Key "ttn").Trim()
  if ([string]::IsNullOrWhiteSpace($Ttn)) {
    $Ttn = (Get-QueryValue -QueryString $QueryString -Key "number").Trim()
  }
  if ([string]::IsNullOrWhiteSpace($Ttn)) {
    $ErrorRecord = New-Object System.Exception("TTN is required.")
    $ErrorRecord.Data["Code"] = "NP_DELIVERY_NO_TTN"
    throw $ErrorRecord
  }

  $Document = [ordered]@{ DocumentNumber = $Ttn }
  $Phone = (Get-QueryValue -QueryString $QueryString -Key "phone").Trim()
  if (-not [string]::IsNullOrWhiteSpace($Phone)) {
    $Document.Phone = $Phone
  }

  $BodyObject = [ordered]@{
    apiKey = $ApiKey
    modelName = "TrackingDocument"
    calledMethod = "getStatusDocuments"
    methodProperties = [ordered]@{
      Documents = @($Document)
    }
  }
  $Body = $BodyObject | ConvertTo-Json -Depth 10 -Compress
  $Response = Invoke-RestMethod -Method Post -Uri (Get-NovaPoshtaApiUrl) -ContentType "application/json; charset=utf-8" -Body $Body -TimeoutSec (Get-NovaPoshtaTimeoutSec)
  $Data = @($Response.data)
  $Item = if ($Data.Count -gt 0) { $Data[0] } else { $null }
  $StatusCode = [string](Get-ObjectPropertyValue -Value $Item -Name "StatusCode")
  $Status = [string](Get-ObjectPropertyValue -Value $Item -Name "Status")
  $DeliveryStatus = ConvertTo-NovaPoshtaDeliveryStatus -StatusCode $StatusCode -Status $Status
  $Success = [bool]$Response.success
  $Errors = @($Response.errors)
  $Warnings = @($Response.warnings)
  $GatewayErrorCode = ""
  if (-not $Success) {
    $ErrorText = (($Errors + $Warnings) -join " ").ToLowerInvariant()
    $GatewayErrorCode = if ($ErrorText.Contains("document number") -or $ErrorText.Contains("documentnumber")) { "NP_DELIVERY_INVALID_TTN" } else { "NP_DELIVERY_API_ERROR" }
  }

  return [ordered]@{
    ok = $Success
    provider = "Нова пошта"
    source = "Nova Poshta server gateway"
    serverGateway = $true
    apiKeyInBrowser = $false
    ttn = $Ttn
    statusCode = $StatusCode
    status = $Status
    deliveryStatus = $DeliveryStatus
    errorCode = $GatewayErrorCode
    error = if ($Errors.Count -gt 0) { [string]$Errors[0] } else { "" }
    checkedAt = (Get-Date).ToString("yyyy-MM-dd HH:mm:ss")
    errors = $Errors
    warnings = $Warnings
    info = @($Response.info)
    tracking = [ordered]@{
      number = [string](Get-ObjectPropertyValue -Value $Item -Name "Number")
      statusCode = $StatusCode
      status = $Status
      citySender = [string](Get-ObjectPropertyValue -Value $Item -Name "CitySender")
      cityRecipient = [string](Get-ObjectPropertyValue -Value $Item -Name "CityRecipient")
      warehouseRecipient = [string](Get-ObjectPropertyValue -Value $Item -Name "WarehouseRecipient")
      scheduledDeliveryDate = [string](Get-ObjectPropertyValue -Value $Item -Name "ScheduledDeliveryDate")
      actualDeliveryDate = [string](Get-ObjectPropertyValue -Value $Item -Name "ActualDeliveryDate")
    }
  }
}

function Test-NovaPayGatewayConfigured {
  return -not [string]::IsNullOrWhiteSpace($env:NOVAPAY_GATEWAY_URL)
}

function Get-NovaPayGatewayTimeoutSec {
  $TimeoutSec = 20
  if (-not [string]::IsNullOrWhiteSpace($env:NOVAPAY_GATEWAY_TIMEOUT_SEC)) {
    [void][int]::TryParse($env:NOVAPAY_GATEWAY_TIMEOUT_SEC, [ref]$TimeoutSec)
  }
  if ($TimeoutSec -lt 1) { return 20 }
  return $TimeoutSec
}

function Invoke-NovaPayGateway {
  param([string]$QueryString)

  $BaseUrl = "$($env:NOVAPAY_GATEWAY_URL)".Trim()
  if ([string]::IsNullOrWhiteSpace($BaseUrl)) {
    throw "NPAY_REAL_GATEWAY_NOT_CONFIGURED: set NOVAPAY_GATEWAY_URL in .env."
  }
  if ($BaseUrl -notmatch "^https?://") {
    throw "NPAY_REAL_GATEWAY_INVALID_URL: NOVAPAY_GATEWAY_URL must be an http(s) server gateway URL."
  }

  $ForwardQuery = Remove-QueryParam -QueryString $QueryString -Keys @("demo", "mode")
  $Uri = $BaseUrl
  if (-not [string]::IsNullOrWhiteSpace($ForwardQuery)) {
    $Separator = if ($Uri.Contains("?")) { "&" } else { "?" }
    $Uri = "$Uri$Separator$ForwardQuery"
  }

  $Headers = @{
    Accept = "application/json"
  }
  if (-not [string]::IsNullOrWhiteSpace($env:NOVAPAY_GATEWAY_TOKEN)) {
    $HeaderName = if ([string]::IsNullOrWhiteSpace($env:NOVAPAY_GATEWAY_TOKEN_HEADER)) { "Authorization" } else { $env:NOVAPAY_GATEWAY_TOKEN_HEADER }
    $HeaderValue = if ($HeaderName -eq "Authorization" -and $env:NOVAPAY_GATEWAY_TOKEN -notmatch "^\s*(Bearer|Basic)\s+") {
      "Bearer $($env:NOVAPAY_GATEWAY_TOKEN)"
    } else {
      $env:NOVAPAY_GATEWAY_TOKEN
    }
    $Headers[$HeaderName] = $HeaderValue
  }

  $Response = Invoke-WebRequest -UseBasicParsing -Method Get -Uri $Uri -Headers $Headers -TimeoutSec (Get-NovaPayGatewayTimeoutSec)
  if ([string]::IsNullOrWhiteSpace($Response.Content)) {
    throw "NPAY_REAL_GATEWAY_EMPTY_RESPONSE: NovaPay gateway returned an empty response."
  }

  $Payload = $Response.Content | ConvertFrom-Json
  if ($Payload -is [System.Array]) {
    return @{
      ok = $true
      source = "NovaPay real server gateway"
      mode = "production"
      signedOnServer = $true
      privateKeyInBrowser = $false
      generatedAt = (Get-Date).ToString("yyyy-MM-dd HH:mm:ss")
      payments = $Payload
    }
  }

  if ($Payload.PSObject.Properties.Name -notcontains "ok") {
    $Payload | Add-Member -NotePropertyName ok -NotePropertyValue $true -Force
  }
  $Payload | Add-Member -NotePropertyName source -NotePropertyValue "NovaPay real server gateway" -Force
  $Payload | Add-Member -NotePropertyName mode -NotePropertyValue "production" -Force
  $Payload | Add-Member -NotePropertyName signedOnServer -NotePropertyValue $true -Force
  $Payload | Add-Member -NotePropertyName privateKeyInBrowser -NotePropertyValue $false -Force
  if ($Payload.PSObject.Properties.Name -notcontains "generatedAt") {
    $Payload | Add-Member -NotePropertyName generatedAt -NotePropertyValue (Get-Date).ToString("yyyy-MM-dd HH:mm:ss") -Force
  }
  return $Payload
}

function ConvertTo-XmlText {
  param($Value)
  return [System.Security.SecurityElement]::Escape("$Value")
}

function Get-NovaPayClientApiUrl {
  $Url = Get-EnvOrDefault -Name "NOVAPAY_CLIENT_API_URL" -Default "https://business.novapay.ua/Services/ClientAPIService.svc"
  if ([string]::IsNullOrWhiteSpace($Url)) {
    return "https://business.novapay.ua/Services/ClientAPIService.svc"
  }
  return $Url.Trim()
}

function Resolve-NovaPayPath {
  param([string]$Path)
  if ([System.IO.Path]::IsPathRooted($Path)) {
    return $Path
  }
  return [System.IO.Path]::GetFullPath((Join-Path $Root $Path))
}

function Get-NovaPayPublicCertificate {
  if (-not [string]::IsNullOrWhiteSpace($env:NOVAPAY_PUBLIC_CERTIFICATE)) {
    return "$($env:NOVAPAY_PUBLIC_CERTIFICATE)"
  }
  if ([string]::IsNullOrWhiteSpace($env:NOVAPAY_CERTIFICATE_PATH)) {
    return ""
  }
  $CertificatePath = Resolve-NovaPayPath -Path $env:NOVAPAY_CERTIFICATE_PATH
  if (-not (Test-Path -LiteralPath $CertificatePath -PathType Leaf)) {
    return ""
  }
  return [System.IO.File]::ReadAllText($CertificatePath)
}

function Set-NovaPayEnvFileValue {
  param(
    [string]$Key,
    [string]$Value
  )

  if ([string]::IsNullOrWhiteSpace($Key) -or [string]::IsNullOrWhiteSpace($Value)) {
    return
  }
  $EnvPath = Join-Path $Root ".env"
  $Lines = New-Object "System.Collections.Generic.List[string]"
  if (Test-Path -LiteralPath $EnvPath -PathType Leaf) {
    $Lines.AddRange([string[]][System.IO.File]::ReadAllLines($EnvPath))
  }
  $Prefix = "$Key="
  $Updated = $false
  for ($Index = 0; $Index -lt $Lines.Count; $Index++) {
    if ($Lines[$Index].StartsWith($Prefix)) {
      $Lines[$Index] = "$Key=$Value"
      $Updated = $true
      break
    }
  }
  if (-not $Updated) {
    if ($Lines.Count -gt 0 -and $Lines[$Lines.Count - 1].Trim() -ne "") {
      $Lines.Add("")
    }
    $Lines.Add("$Key=$Value")
  }
  [System.IO.File]::WriteAllLines($EnvPath, $Lines, [System.Text.Encoding]::UTF8)
  [Environment]::SetEnvironmentVariable($Key, $Value, "Process")
}

function Set-NovaPayCertificateFile {
  param([string]$Certificate)

  if ([string]::IsNullOrWhiteSpace($Certificate) -or [string]::IsNullOrWhiteSpace($env:NOVAPAY_CERTIFICATE_PATH)) {
    return
  }
  $CertificatePath = Resolve-NovaPayPath -Path $env:NOVAPAY_CERTIFICATE_PATH
  $Directory = Split-Path -Parent $CertificatePath
  if (-not (Test-Path -LiteralPath $Directory -PathType Container)) {
    New-Item -ItemType Directory -Force -Path $Directory | Out-Null
  }
  [System.IO.File]::WriteAllText($CertificatePath, $Certificate, [System.Text.Encoding]::ASCII)
}

function Get-NovaPayDirectCredentialStatus {
  $Certificate = Get-NovaPayPublicCertificate
  return @{
    clientApiUrl = Get-NovaPayClientApiUrl
    businessLoginConfigured = -not [string]::IsNullOrWhiteSpace($env:NOVAPAY_BUSINESS_LOGIN)
    refreshTokenConfigured = -not [string]::IsNullOrWhiteSpace($env:NOVAPAY_REFRESH_TOKEN)
    publicCertificateConfigured = -not [string]::IsNullOrWhiteSpace($Certificate)
    publicCertificateLooksValid = ($Certificate -match "BEGIN RSA PUBLIC KEY" -and $Certificate -match "END RSA PUBLIC KEY")
    clientIdConfigured = -not [string]::IsNullOrWhiteSpace($env:NOVAPAY_CLIENT_ID)
    accountIdConfigured = -not [string]::IsNullOrWhiteSpace($env:NOVAPAY_ACCOUNT_ID)
    accountIbanConfigured = -not [string]::IsNullOrWhiteSpace($env:NOVAPAY_ACCOUNT_IBAN)
    exportEmailConfigured = -not [string]::IsNullOrWhiteSpace($env:NOVAPAY_EXPORT_EMAIL)
    directConfigured = (
      -not [string]::IsNullOrWhiteSpace($env:NOVAPAY_BUSINESS_LOGIN) -and
      -not [string]::IsNullOrWhiteSpace($env:NOVAPAY_REFRESH_TOKEN) -and
      -not [string]::IsNullOrWhiteSpace($Certificate)
    )
    gatewayUrlConfigured = Test-NovaPayGatewayConfigured
    privateKeyInBrowser = $false
  }
}

function Test-NovaPayDirectConfigured {
  $Status = Get-NovaPayDirectCredentialStatus
  return $Status.directConfigured -eq $true
}

function Invoke-NovaPaySoapMethod {
  param(
    [string]$Method,
    [string]$RequestXml
  )

  $Url = Get-NovaPayClientApiUrl
  if ($Url -notmatch "^https?://") {
    throw "NPAY_DIRECT_INVALID_URL: NOVAPAY_CLIENT_API_URL must be an http(s) URL."
  }
  $Envelope = @"
<?xml version="1.0" encoding="utf-8"?>
<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
  <soap:Body>
    <$Method xmlns="http://tempuri.org/">
      <request>
$RequestXml
      </request>
    </$Method>
  </soap:Body>
</soap:Envelope>
"@
  $Headers = @{
    SOAPAction = "http://tempuri.org/IClientAPIService/$Method"
  }
  $Response = Invoke-WebRequest -UseBasicParsing -Method Post -Uri $Url -Headers $Headers -ContentType "text/xml; charset=utf-8" -Body $Envelope -TimeoutSec (Get-NovaPayGatewayTimeoutSec)
  if ([string]::IsNullOrWhiteSpace($Response.Content)) {
    throw "NPAY_DIRECT_EMPTY_RESPONSE: NovaPay SOAP returned an empty response."
  }
  [xml]$Xml = $Response.Content
  $Fault = Select-Xml -Xml $Xml -XPath "//*[local-name()='Fault']" | Select-Object -First 1
  if ($Fault) {
    $FaultText = $Fault.Node.InnerText
    throw "NPAY_DIRECT_SOAP_FAULT: $FaultText"
  }
  $ResultNode = Select-Xml -Xml $Xml -XPath "//*[local-name()='$($Method)Result']" | Select-Object -First 1
  if (-not $ResultNode) {
    throw "NPAY_DIRECT_RESULT_NOT_FOUND: $Method result was not found in SOAP response."
  }
  return $ResultNode.Node
}

function Get-XmlChildText {
  param(
    $Node,
    [string]$Name
  )
  if ($null -eq $Node) {
    return ""
  }
  foreach ($Child in $Node.ChildNodes) {
    if ($Child.LocalName -eq $Name) {
      return "$($Child.InnerText)"
    }
  }
  return ""
}

function Assert-NovaPayResultOk {
  param(
    $Node,
    [string]$Code
  )
  $Result = Get-XmlChildText -Node $Node -Name "result"
  if (-not [string]::IsNullOrWhiteSpace($Result) -and $Result -notmatch "^(ok|success|true|0)$") {
    $ErrorText = ""
    $ErrorNode = $Node.ChildNodes | Where-Object { $_.LocalName -eq "error" } | Select-Object -First 1
    if ($ErrorNode) {
      $ErrorText = $ErrorNode.InnerText
    }
    if ([string]::IsNullOrWhiteSpace($ErrorText)) {
      $ErrorText = $Result
    }
    throw "$Code`: $ErrorText"
  }
}

function Invoke-NovaPayJwtAuthentication {
  $Certificate = Get-NovaPayPublicCertificate
  if ([string]::IsNullOrWhiteSpace($env:NOVAPAY_BUSINESS_LOGIN) -or [string]::IsNullOrWhiteSpace($env:NOVAPAY_REFRESH_TOKEN) -or [string]::IsNullOrWhiteSpace($Certificate)) {
    throw "NPAY_DIRECT_NOT_CONFIGURED: set NOVAPAY_BUSINESS_LOGIN, NOVAPAY_REFRESH_TOKEN and NOVAPAY_CERTIFICATE_PATH in .env."
  }
  $RequestRef = "crm-$([Guid]::NewGuid().ToString("N"))"
  $RequestXml = @"
        <request_ref>$(ConvertTo-XmlText $RequestRef)</request_ref>
        <refresh_token>$(ConvertTo-XmlText $env:NOVAPAY_REFRESH_TOKEN)</refresh_token>
        <login>$(ConvertTo-XmlText $env:NOVAPAY_BUSINESS_LOGIN)</login>
        <public_certificate>$(ConvertTo-XmlText $Certificate)</public_certificate>
"@
  $Result = Invoke-NovaPaySoapMethod -Method "UserAuthenticationJWT" -RequestXml $RequestXml
  Assert-NovaPayResultOk -Node $Result -Code "NPAY_DIRECT_AUTH_FAILED"
  $Jwt = Get-XmlChildText -Node $Result -Name "jwt"
  if ([string]::IsNullOrWhiteSpace($Jwt)) {
    throw "NPAY_DIRECT_AUTH_NO_JWT: NovaPay did not return a JWT."
  }
  $NewRefreshToken = Get-XmlChildText -Node $Result -Name "refresh_token"
  if (-not [string]::IsNullOrWhiteSpace($NewRefreshToken) -and $NewRefreshToken -ne $env:NOVAPAY_REFRESH_TOKEN) {
    Set-NovaPayEnvFileValue -Key "NOVAPAY_REFRESH_TOKEN" -Value $NewRefreshToken
  }
  $NewCertificate = Get-XmlChildText -Node $Result -Name "public_certificate"
  if (-not [string]::IsNullOrWhiteSpace($NewCertificate) -and $NewCertificate -ne $Certificate) {
    Set-NovaPayCertificateFile -Certificate $NewCertificate
  }
  return @{
    jwt = $Jwt
    expiration = Get-XmlChildText -Node $Result -Name "expiration"
    refreshTokenRotated = (-not [string]::IsNullOrWhiteSpace($NewRefreshToken) -and $NewRefreshToken -ne $env:NOVAPAY_REFRESH_TOKEN)
  }
}

function New-NovaPayClientRequestXml {
  param(
    [string]$Jwt,
    [string]$ExtraXml = ""
  )
  $RequestRef = "crm-$([Guid]::NewGuid().ToString("N"))"
  return @"
        <request_ref>$(ConvertTo-XmlText $RequestRef)</request_ref>
        <jwt>$(ConvertTo-XmlText $Jwt)</jwt>
$ExtraXml
"@
}

function Get-NovaPayResultShape {
  param($Result)

  if ($null -eq $Result) {
    return "empty-result"
  }
  $Counts = @{}
  foreach ($Node in @($Result.SelectNodes(".//*"))) {
    $Name = "$($Node.LocalName)"
    if ([string]::IsNullOrWhiteSpace($Name)) {
      continue
    }
    if (-not $Counts.ContainsKey($Name)) {
      $Counts[$Name] = 0
    }
    $Counts[$Name] += 1
  }
  $Parts = @(
    $Counts.GetEnumerator() |
      Sort-Object -Property Value -Descending |
      Select-Object -First 25 |
      ForEach-Object { "$($_.Key):$($_.Value)" }
  )
  if ($Parts.Count -lt 1) {
    return "no-child-elements"
  }
  return ($Parts -join ", ")
}

function Convert-NovaPayClientNodes {
  param($Result)
  $Rows = @()
  $Nodes = $Result.SelectNodes(".//*[translate(local-name(), 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', 'abcdefghijklmnopqrstuvwxyz')='clients' or translate(local-name(), 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', 'abcdefghijklmnopqrstuvwxyz')='client']")
  foreach ($Node in $Nodes) {
    $IdText = Get-XmlChildText -Node $Node -Name "id"
    $Id = 0
    if (-not [int]::TryParse($IdText, [ref]$Id)) {
      continue
    }
    $Rows += [pscustomobject]@{
      id = $Id
      name = Get-XmlChildText -Node $Node -Name "name"
      statecode = Get-XmlChildText -Node $Node -Name "statecode"
      countrycode = Get-XmlChildText -Node $Node -Name "countrycode"
    }
  }
  return @($Rows)
}

function Convert-NovaPayAccountNodes {
  param($Result)
  $Rows = @()
  $Nodes = $Result.SelectNodes(".//*[translate(local-name(), 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', 'abcdefghijklmnopqrstuvwxyz')='accounts' or translate(local-name(), 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', 'abcdefghijklmnopqrstuvwxyz')='account']")
  foreach ($Node in $Nodes) {
    $IdText = Get-XmlChildText -Node $Node -Name "id"
    $Id = 0
    if (-not [int]::TryParse($IdText, [ref]$Id)) {
      continue
    }
    $Rows += [pscustomobject]@{
      id = $Id
      IBAN = Get-XmlChildText -Node $Node -Name "IBAN"
      name = Get-XmlChildText -Node $Node -Name "name"
      currency = Get-XmlChildText -Node $Node -Name "currency"
      status = Get-XmlChildText -Node $Node -Name "status"
      statuscode = Get-XmlChildText -Node $Node -Name "statuscode"
    }
  }
  return @($Rows)
}

function Invoke-NovaPayClientsList {
  param([string]$Jwt)
  $Result = Invoke-NovaPaySoapMethod -Method "GetClientsList" -RequestXml (New-NovaPayClientRequestXml -Jwt $Jwt)
  Assert-NovaPayResultOk -Node $Result -Code "NPAY_DIRECT_CLIENTS_FAILED"
  $Rows = @(Convert-NovaPayClientNodes -Result $Result)
  if ($Rows.Count -lt 1) {
    throw "NPAY_DIRECT_NO_CLIENTS: NovaPay authenticated JWT, but GetClientsList returned no client rows for this login. Set NOVAPAY_CLIENT_ID and NOVAPAY_ACCOUNT_ID from the NovaPay cabinet, or enable/bind Client API access for this login. Response shape: $(Get-NovaPayResultShape -Result $Result)."
  }
  return $Rows
}

function Invoke-NovaPayAccountsList {
  param(
    [string]$Jwt,
    [int]$ClientId
  )
  $Extra = "        <client_id>$ClientId</client_id>"
  $Result = Invoke-NovaPaySoapMethod -Method "GetAccountsList" -RequestXml (New-NovaPayClientRequestXml -Jwt $Jwt -ExtraXml $Extra)
  Assert-NovaPayResultOk -Node $Result -Code "NPAY_DIRECT_ACCOUNTS_FAILED"
  $Rows = @(Convert-NovaPayAccountNodes -Result $Result)
  if ($Rows.Count -lt 1) {
    throw "NPAY_DIRECT_NO_ACCOUNTS: NovaPay returned no accounts for client $ClientId. Response shape: $(Get-NovaPayResultShape -Result $Result)."
  }
  return $Rows
}

function Get-NovaPayDateParam {
  param(
    [string]$QueryString,
    [string]$Name,
    [int]$OffsetDays = 0
  )
  $Value = Get-QueryValue -QueryString $QueryString -Key $Name
  if (-not [string]::IsNullOrWhiteSpace($Value)) {
    return $Value
  }
  if ($Name -eq "from") {
    $DaysText = Get-QueryValue -QueryString $QueryString -Key "days"
    $Days = 0
    if ([int]::TryParse($DaysText, [ref]$Days) -and $Days -gt 0) {
      return (Get-Date).Date.AddDays(-1 * [Math]::Min($Days, 3650)).ToString("yyyy-MM-dd")
    }
  }
  return (Get-Date).Date.AddDays($OffsetDays).ToString("yyyy-MM-dd")
}

function ConvertTo-NovaPayApiDate {
  param(
    [string]$Value,
    [string]$Default = ""
  )

  $Text = "$Value".Trim()
  if ([string]::IsNullOrWhiteSpace($Text)) {
    $Text = $Default
  }
  if ([string]::IsNullOrWhiteSpace($Text)) {
    return (Get-Date).Date.ToString("yyyy-MM-dd")
  }
  $Parsed = [datetime]::MinValue
  foreach ($Format in @("yyyy-MM-dd", "dd.MM.yyyy", "yyyy-MM-ddTHH:mm:ss", "dd.MM.yyyy HH:mm:ss")) {
    if ([datetime]::TryParseExact($Text, $Format, [Globalization.CultureInfo]::InvariantCulture, [Globalization.DateTimeStyles]::None, [ref]$Parsed)) {
      return $Parsed.ToString("yyyy-MM-dd")
    }
  }
  if ([datetime]::TryParse($Text, [ref]$Parsed)) {
    return $Parsed.ToString("yyyy-MM-dd")
  }
  return $Text
}

function Get-NovaPayHistoryWindowDays {
  param([string]$QueryString = "")
  $WindowDays = 31
  $Text = Get-QueryValue -QueryString $QueryString -Key "windowDays"
  if ([string]::IsNullOrWhiteSpace($Text)) {
    $Text = Get-EnvOrDefault -Name "NOVAPAY_HISTORY_WINDOW_DAYS" -Default ""
  }
  [void][int]::TryParse($Text, [ref]$WindowDays)
  if ($WindowDays -lt 1) { return 31 }
  if ($WindowDays -gt 93) { return 93 }
  return $WindowDays
}

function Get-NovaPayHistoryThrottleMs {
  $ThrottleMs = 700
  $Text = Get-EnvOrDefault -Name "NOVAPAY_HISTORY_THROTTLE_MS" -Default ""
  if (-not [string]::IsNullOrWhiteSpace($Text)) {
    [void][int]::TryParse($Text, [ref]$ThrottleMs)
  }
  if ($ThrottleMs -lt 0) { return 700 }
  return $ThrottleMs
}

function Get-NovaPayHistoryFrom {
  param([string]$QueryString = "")
  $From = Get-QueryValue -QueryString $QueryString -Key "from"
  if ([string]::IsNullOrWhiteSpace($From)) {
    $From = Get-QueryValue -QueryString $QueryString -Key "historyFrom"
  }
  if ([string]::IsNullOrWhiteSpace($From)) {
    $From = Get-EnvOrDefault -Name "NOVAPAY_HISTORY_FROM" -Default "2024-01-01"
  }
  return ConvertTo-NovaPayApiDate -Value $From -Default "2024-01-01"
}

function Test-NovaPayRegisterHistoryEnabled {
  param([string]$QueryString = "")

  $Value = Get-QueryValue -QueryString $QueryString -Key "includeRegisters"
  if ([string]::IsNullOrWhiteSpace($Value)) {
    $Value = Get-EnvOrDefault -Name "NOVAPAY_INCLUDE_REGISTERS" -Default "false"
  }
  if ([string]::IsNullOrWhiteSpace($Value)) {
    return $true
  }
  return ($Value.Trim().ToLowerInvariant() -notin @("0", "false", "no", "off"))
}

function Test-NovaPayAccountExtractEnabled {
  param([string]$QueryString = "")

  $Value = Get-QueryValue -QueryString $QueryString -Key "includeExtract"
  if ([string]::IsNullOrWhiteSpace($Value)) {
    $Value = Get-EnvOrDefault -Name "NOVAPAY_INCLUDE_ACCOUNT_EXTRACT" -Default "true"
  }
  if ([string]::IsNullOrWhiteSpace($Value)) {
    return $true
  }
  return ($Value.Trim().ToLowerInvariant() -notin @("0", "false", "no", "off"))
}

function Get-NovaPayRegisterFileExtension {
  param([string]$QueryString = "")

  $Value = Get-QueryValue -QueryString $QueryString -Key "registerFileExtension"
  if ([string]::IsNullOrWhiteSpace($Value)) {
    $Value = Get-EnvOrDefault -Name "NOVAPAY_REGISTER_FILE_EXTENSION" -Default "csv"
  }
  $Normalized = "$Value".Trim().TrimStart(".").ToLowerInvariant()
  if ($Normalized -notin @("csv", "xml", "dbf", "ibis")) {
    return "csv"
  }
  return $Normalized
}

function Get-NovaPayRegisterTypes {
  param([string]$QueryString = "")

  $Value = Get-QueryValue -QueryString $QueryString -Key "registerTypes"
  if ([string]::IsNullOrWhiteSpace($Value)) {
    $Value = Get-EnvOrDefault -Name "NOVAPAY_REGISTER_TYPES" -Default "1"
  }
  $Types = New-Object System.Collections.ArrayList
  foreach ($Part in ("$Value" -split "[,; ]+")) {
    $Type = 0
    if ([int]::TryParse($Part, [ref]$Type) -and $Type -gt 0 -and -not $Types.Contains($Type)) {
      [void]$Types.Add($Type)
    }
  }
  if ($Types.Count -lt 1) {
    [void]$Types.Add(1)
  }
  return @($Types | Select-Object -First 10)
}

function Get-NovaPayRegisterPollAttempts {
  $Attempts = 4
  $Value = Get-EnvOrDefault -Name "NOVAPAY_REGISTER_POLL_ATTEMPTS" -Default ""
  if (-not [string]::IsNullOrWhiteSpace($Value)) {
    [void][int]::TryParse($Value, [ref]$Attempts)
  }
  if ($Attempts -lt 1) { return 1 }
  if ($Attempts -gt 20) { return 20 }
  return $Attempts
}

function Get-NovaPayRegisterPollSleepMs {
  $SleepMs = 1500
  $Value = Get-EnvOrDefault -Name "NOVAPAY_REGISTER_POLL_SLEEP_MS" -Default ""
  if (-not [string]::IsNullOrWhiteSpace($Value)) {
    [void][int]::TryParse($Value, [ref]$SleepMs)
  }
  if ($SleepMs -lt 0) { return 1500 }
  if ($SleepMs -gt 30000) { return 30000 }
  return $SleepMs
}

function ConvertTo-NovaPayRegisterDate {
  param([string]$Value)

  $Format = Get-EnvOrDefault -Name "NOVAPAY_REGISTER_DATE_FORMAT" -Default "dd.MM.yyyy"
  $Parsed = [datetime]::MinValue
  foreach ($InputFormat in @("yyyy-MM-dd", "dd.MM.yyyy", "yyyy-MM-ddTHH:mm:ss", "dd.MM.yyyy HH:mm:ss")) {
    if ([datetime]::TryParseExact("$Value", $InputFormat, [Globalization.CultureInfo]::InvariantCulture, [Globalization.DateTimeStyles]::None, [ref]$Parsed)) {
      return $Parsed.ToString($Format, [Globalization.CultureInfo]::InvariantCulture)
    }
  }
  if ([datetime]::TryParse("$Value", [ref]$Parsed)) {
    return $Parsed.ToString($Format, [Globalization.CultureInfo]::InvariantCulture)
  }
  return "$Value"
}

function Get-NovaPayCachePath {
  $Configured = Get-EnvOrDefault -Name "NOVAPAY_CACHE_PATH" -Default ""
  if (-not [string]::IsNullOrWhiteSpace($Configured)) {
    return Resolve-NovaPayPath -Path $Configured
  }
  $CacheDir = Join-Path $Root ".cache"
  return (Join-Path $CacheDir "novapay-payments-cache.json")
}

function Read-NovaPayPaymentCache {
  $Path = Get-NovaPayCachePath
  if (-not (Test-Path -LiteralPath $Path -PathType Leaf)) {
    return [pscustomobject]@{ version = 1; payments = @(); periods = @() }
  }
  try {
    $Text = [System.IO.File]::ReadAllText($Path, [System.Text.Encoding]::UTF8)
    $Payload = $Text | ConvertFrom-Json
    if ($null -eq $Payload.PSObject.Properties["payments"]) {
      $Payload | Add-Member -NotePropertyName payments -NotePropertyValue @() -Force
    }
    if ($null -eq $Payload.PSObject.Properties["periods"]) {
      $Payload | Add-Member -NotePropertyName periods -NotePropertyValue @() -Force
    }
    return $Payload
  } catch {
    return [pscustomobject]@{ version = 1; payments = @(); periods = @(); readError = $_.Exception.Message }
  }
}

function Write-NovaPayPaymentCache {
  param([object]$Payload)
  $Path = Get-NovaPayCachePath
  $Directory = Split-Path -Parent $Path
  if (-not (Test-Path -LiteralPath $Directory -PathType Container)) {
    New-Item -ItemType Directory -Path $Directory -Force | Out-Null
  }
  $Json = $Payload | ConvertTo-Json -Depth 20
  [System.IO.File]::WriteAllText($Path, $Json, [System.Text.Encoding]::UTF8)
  return $Path
}

function Get-NovaPayPaymentCacheKey {
  param(
    [object]$Payment,
    [int]$Index = 0
  )
  $Id = Get-ObjectValue -Object $Payment -Names @("id", "gatewayRef", "ref", "reference") -Default ""
  if (-not [string]::IsNullOrWhiteSpace("$Id")) { return "id:$Id" }
  $Ttn = Get-ObjectValue -Object $Payment -Names @("ttn", "TTN") -Default ""
  $Date = Get-ObjectValue -Object $Payment -Names @("date", "paidAt") -Default ""
  $Amount = Get-ObjectValue -Object $Payment -Names @("amount", "sum") -Default ""
  $Currency = Get-ObjectValue -Object $Payment -Names @("currency") -Default "UAH"
  return "row:${Ttn}:${Date}:${Amount}:${Currency}:${Index}"
}

function Merge-NovaPayPaymentCache {
  param(
    [object[]]$Incoming,
    [string]$ClientId,
    [string]$AccountId,
    [object[]]$Periods
  )

  $Cache = Read-NovaPayPaymentCache
  $ExistingRows = @(ConvertTo-ArraySafe -Value $Cache.payments)
  $Map = @{}
  $Order = New-Object System.Collections.ArrayList
  $Index = 0
  foreach ($Row in $ExistingRows) {
    $Key = Get-NovaPayPaymentCacheKey -Payment $Row -Index $Index
    if (-not $Map.ContainsKey($Key)) {
      $Map[$Key] = $Row
      [void]$Order.Add($Key)
    }
    $Index += 1
  }

  $Added = 0
  $Updated = 0
  $Skipped = 0
  $IncomingIndex = 0
  foreach ($Row in @($Incoming)) {
    $Key = Get-NovaPayPaymentCacheKey -Payment $Row -Index $IncomingIndex
    $IncomingJson = $Row | ConvertTo-Json -Depth 12 -Compress
    if ($Map.ContainsKey($Key)) {
      $ExistingJson = $Map[$Key] | ConvertTo-Json -Depth 12 -Compress
      if ($ExistingJson -ne $IncomingJson) {
        $Map[$Key] = $Row
        $Updated += 1
      } else {
        $Skipped += 1
      }
    } else {
      $Map[$Key] = $Row
      [void]$Order.Add($Key)
      $Added += 1
    }
    $IncomingIndex += 1
  }

  $Merged = @($Order | ForEach-Object { $Map[$_] } | Sort-Object -Property date, id -Descending)
  $Payload = [ordered]@{
    version = 1
    generatedAt = (Get-Date).ToString("yyyy-MM-dd HH:mm:ss")
    clientId = $ClientId
    accountId = $AccountId
    count = $Merged.Count
    added = $Added
    updated = $Updated
    skipped = $Skipped
    periods = @($Periods)
    payments = @($Merged)
  }
  $Path = Write-NovaPayPaymentCache -Payload $Payload
  return [ordered]@{
    cachePath = $Path
    count = $Merged.Count
    added = $Added
    updated = $Updated
    skipped = $Skipped
    payments = @($Merged)
  }
}

function Convert-NovaPayPaymentObject {
  param(
    $Row,
    [int]$Index = 0
  )
  $Ttn = Get-ObjectValue -Object $Row -Names @("ttn", "TTN", "Ttn", "declaration_number", "DeclarationNumber", "doc_number", "DocNumber", "purpose", "Purpose") -Default ""
  if ($Ttn -match "(NP[-\s]?\d+|\b\d{10,20}\b)") {
    $Ttn = $Matches[1]
  }
  $Amount = Get-ObjectValue -Object $Row -Names @("amount", "Amount", "sum", "Sum", "credit", "Credit", "debet", "Debet") -Default 0
  $Id = Get-ObjectValue -Object $Row -Names @("id", "Id", "operation_id", "OperationId", "payment_id", "PaymentId", "Code", "code") -Default "npay-soap-$((Get-Date).ToString("yyyyMMddHHmmss"))-$Index"
  $Date = Get-ObjectValue -Object $Row -Names @("date", "Date", "payment_date", "PaymentDate", "OrgDate", "org_date") -Default (Get-Date).ToString("yyyy-MM-dd")
  $Currency = Get-ObjectValue -Object $Row -Names @("currency", "Currency", "CurrencyTag", "currency_tag") -Default "UAH"
  $PayerName = Get-ObjectValue -Object $Row -Names @("payerName", "PayerName", "name", "Name", "CreditName", "purpose", "Purpose") -Default ""
  $Status = Get-ObjectValue -Object $Row -Names @("status", "Status", "state", "State") -Default "paid"
  $GatewayRef = Get-ObjectValue -Object $Row -Names @("reference", "Reference", "ref", "Ref", "Code", "code") -Default ""
  return [pscustomobject]@{
    id = "$Id"
    date = "$Date"
    ttn = "$Ttn"
    amount = (ConvertTo-CrmSqlNumber -Value $Amount -Default 0)
    currency = "$Currency"
    payerName = "$PayerName"
    status = "$Status"
    gatewayRef = "$GatewayRef"
  }
}

function Get-NovaPayXmlChildText {
  param(
    $Node,
    [string[]]$Names
  )

  if ($null -eq $Node) {
    return ""
  }
  foreach ($Name in $Names) {
    $Match = $Node.SelectSingleNode(".//*[translate(local-name(), 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', 'abcdefghijklmnopqrstuvwxyz')='$($Name.ToLowerInvariant())']")
    if ($Match) {
      return "$($Match.InnerText)"
    }
  }
  return ""
}

function Convert-NovaPayDateText {
  param([string]$Value)

  $Text = "$Value".Trim()
  if ([string]::IsNullOrWhiteSpace($Text)) {
    return (Get-Date).ToString("yyyy-MM-dd")
  }
  $ParsedDate = [datetime]::MinValue
  foreach ($Format in @("dd.MM.yyyy", "yyyy-MM-dd", "dd.MM.yyyy HH:mm:ss", "yyyy-MM-ddTHH:mm:ss")) {
    if ([datetime]::TryParseExact($Text, $Format, [Globalization.CultureInfo]::InvariantCulture, [Globalization.DateTimeStyles]::None, [ref]$ParsedDate)) {
      return $ParsedDate.ToString("yyyy-MM-dd")
    }
  }
  if ([datetime]::TryParse($Text, [ref]$ParsedDate)) {
    return $ParsedDate.ToString("yyyy-MM-dd")
  }
  return $Text
}

function Get-NovaPayTtnFromPurpose {
  param([string]$Purpose)

  $Text = "$Purpose"
  if ($Text -match "(NP[-\s]?\d{6,20}|ЕН[-\s]?\d{6,20})") {
    return $Matches[1]
  }
  if ($Text -match "(?i)(?:ТТН|ЕН|експрес[-\s]?накладн\w*|накладн\w*|waybill|ttn)\D{0,40}(\d{10,20})") {
    return $Matches[1]
  }
  return ""
}

function Convert-NovaPayPaymentsXml {
  param([string]$PaymentsText)

  $Trimmed = "$PaymentsText".Trim()
  if (-not $Trimmed.StartsWith("<")) {
    return $null
  }
  try {
    [xml]$Xml = $Trimmed
  } catch {
    return $null
  }

  $Docs = @($Xml.SelectNodes("//*[translate(local-name(), 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', 'abcdefghijklmnopqrstuvwxyz')='docs']"))
  if ($Docs.Count -lt 1) {
    return [pscustomobject]@{
      parsed = $true
      rows = @()
    }
  }

  $Index = 0
  $Rows = @($Docs | ForEach-Object {
    $Doc = $_
    $Id = Get-NovaPayXmlChildText -Node $Doc -Names @("ID", "Id", "id")
    if ([string]::IsNullOrWhiteSpace($Id)) {
      $Id = "npay-soap-xml-$((Get-Date).ToString("yyyyMMddHHmmss"))-$Index"
    }
    $Purpose = Get-NovaPayXmlChildText -Node $Doc -Names @("Purpose", "purpose")
    $Amount = "$($Doc.GetAttribute("Amount"))"
    if ([string]::IsNullOrWhiteSpace($Amount)) {
      $Amount = Get-NovaPayXmlChildText -Node $Doc -Names @("Amount", "amount", "Sum", "sum")
    }
    $Currency = "$($Doc.GetAttribute("CurrencyTag"))"
    if ([string]::IsNullOrWhiteSpace($Currency)) {
      $Currency = Get-NovaPayXmlChildText -Node $Doc -Names @("CurrencyTag", "Currency", "currency")
    }
    if ([string]::IsNullOrWhiteSpace($Currency)) {
      $Currency = "UAH"
    }
    $Date = Get-NovaPayXmlChildText -Node $Doc -Names @("PayDate", "OrgDate", "DayDate", "Date", "date")
    $PayerName = Get-NovaPayXmlChildText -Node $Doc -Names @("DebitName", "CreditName", "Name", "name")
    $Index += 1
    [pscustomobject]@{
      id = "$Id"
      date = Convert-NovaPayDateText -Value $Date
      ttn = Get-NovaPayTtnFromPurpose -Purpose $Purpose
      amount = (ConvertTo-CrmSqlNumber -Value $Amount -Default 0)
      currency = "$Currency"
      payerName = "$PayerName"
      status = "paid"
      gatewayRef = "$Id"
      purpose = "$Purpose"
    }
  })
  return [pscustomobject]@{
    parsed = $true
    rows = @($Rows)
  }
}

function Convert-NovaPayPaymentsString {
  param([string]$PaymentsText)
  if ([string]::IsNullOrWhiteSpace($PaymentsText)) {
    return @()
  }
  $Trimmed = $PaymentsText.Trim()
  $XmlResult = Convert-NovaPayPaymentsXml -PaymentsText $Trimmed
  if ($null -ne $XmlResult -and $XmlResult.PSObject.Properties["parsed"]) {
    return @(ConvertTo-ArraySafe -Value $XmlResult.rows)
  }
  try {
    $Parsed = $Trimmed | ConvertFrom-Json
    $Rows = ConvertTo-ArraySafe -Value $Parsed
    if ($Parsed.PSObject.Properties["payments"]) {
      $Rows = ConvertTo-ArraySafe -Value $Parsed.payments
    } elseif ($Parsed.PSObject.Properties["items"]) {
      $Rows = ConvertTo-ArraySafe -Value $Parsed.items
    } elseif ($Parsed.PSObject.Properties["rows"]) {
      $Rows = ConvertTo-ArraySafe -Value $Parsed.rows
    }
    $Index = 0
    return @($Rows | ForEach-Object {
      $Payment = Convert-NovaPayPaymentObject -Row $_ -Index $Index
      $Index += 1
      $Payment
    })
  } catch {
  }
  try {
    $Rows = $Trimmed | ConvertFrom-Csv -Delimiter ";"
    if ($Rows.Count -gt 0 -and $Rows[0].PSObject.Properties.Count -gt 1) {
      $Index = 0
      return @($Rows | ForEach-Object {
        $Payment = Convert-NovaPayPaymentObject -Row $_ -Index $Index
        $Index += 1
        $Payment
      })
    }
  } catch {
  }
  return @([pscustomobject]@{
    id = "npay-soap-raw-$((Get-Date).ToString("yyyyMMddHHmmss"))"
    date = (Get-Date).ToString("yyyy-MM-dd")
    ttn = ""
    amount = 0
    currency = "UAH"
    payerName = "NovaPay raw response"
    status = "raw"
    gatewayRef = ""
    raw = $Trimmed.Substring(0, [Math]::Min(1000, $Trimmed.Length))
  })
}

function Invoke-NovaPayAccountExtract {
  param(
    [string]$Jwt,
    [string]$AccountId,
    [string]$DateFrom,
    [string]$DateTo
  )

  $Extra = @"
        <account_id>$(ConvertTo-XmlText $AccountId)</account_id>
        <date_from>$(ConvertTo-XmlText $DateFrom)</date_from>
        <date_to>$(ConvertTo-XmlText $DateTo)</date_to>
"@
  $Result = Invoke-NovaPaySoapMethod -Method "GetAccountExtract" -RequestXml (New-NovaPayClientRequestXml -Jwt $Jwt -ExtraXml $Extra)
  Assert-NovaPayResultOk -Node $Result -Code "NPAY_ACCOUNT_EXTRACT_FAILED"
  $Rows = @(Convert-NovaPayPaymentsString -PaymentsText (Get-XmlChildText -Node $Result -Name "extract"))
  return @{
    dateFrom = $DateFrom
    dateTo = $DateTo
    accountId = $AccountId
    rows = @($Rows)
  }
}

function Add-NovaPayRegisterMetadata {
  param(
    [object]$Payment,
    [int]$RegisterType,
    [string]$RegisterId,
    [string]$FileName,
    [string]$DateFrom,
    [string]$DateTo
  )

  $Payment | Add-Member -NotePropertyName sourceKind -NotePropertyValue "register" -Force
  $Payment | Add-Member -NotePropertyName registerType -NotePropertyValue $RegisterType -Force
  $Payment | Add-Member -NotePropertyName registerId -NotePropertyValue "$RegisterId" -Force
  $Payment | Add-Member -NotePropertyName registerFileName -NotePropertyValue "$FileName" -Force
  $Payment | Add-Member -NotePropertyName registerDateFrom -NotePropertyValue "$DateFrom" -Force
  $Payment | Add-Member -NotePropertyName registerDateTo -NotePropertyValue "$DateTo" -Force
  return $Payment
}

function Convert-NovaPayRegisterRowObject {
  param(
    $Row,
    [int]$Index,
    [int]$RegisterType,
    [string]$RegisterId,
    [string]$FileName,
    [string]$DateFrom,
    [string]$DateTo
  )

  $AllText = (@($Row.PSObject.Properties | ForEach-Object { "$($_.Name)=$($_.Value)" }) -join " | ")
  $Ttn = Get-ObjectValue -Object $Row -Names @("ttn", "TTN", "Ttn", "declaration_number", "DeclarationNumber", "doc_number", "DocNumber", "waybill", "Waybill", "express_waybill", "ExpressWaybill") -Default ""
  if ([string]::IsNullOrWhiteSpace("$Ttn")) {
    $Ttn = Get-NovaPayTtnFromPurpose -Purpose $AllText
  } elseif ("$Ttn" -match "(NP[-\s]?\d{6,20}|\b\d{10,20}\b)") {
    $Ttn = $Matches[1]
  }

  $Amount = Get-ObjectValue -Object $Row -Names @("amount", "Amount", "sum", "Sum", "payment_amount", "PaymentAmount", "credit", "Credit", "debet", "Debet") -Default 0
  if ((ConvertTo-CrmSqlNumber -Value $Amount -Default 0) -le 0) {
    foreach ($Property in @($Row.PSObject.Properties)) {
      $Candidate = ConvertTo-CrmSqlNumber -Value $Property.Value -Default 0
      if ($Candidate -gt 0 -and $Candidate -lt 100000000) {
        $Amount = $Candidate
        break
      }
    }
  }
  $Date = Get-ObjectValue -Object $Row -Names @("date", "Date", "payment_date", "PaymentDate", "PayDate", "OrgDate", "created_at", "CreatedAt") -Default ""
  if ([string]::IsNullOrWhiteSpace("$Date") -and $AllText -match "(\d{2}\.\d{2}\.\d{4}|\d{4}-\d{2}-\d{2})") {
    $Date = $Matches[1]
  }

  $PayerName = Get-ObjectValue -Object $Row -Names @("payerName", "PayerName", "payer", "Payer", "name", "Name", "client", "Client") -Default ""
  $Currency = Get-ObjectValue -Object $Row -Names @("currency", "Currency", "CurrencyTag") -Default "UAH"
  $Id = Get-ObjectValue -Object $Row -Names @("id", "Id", "ID", "operation_id", "OperationId", "payment_id", "PaymentId", "Code", "code", "reference", "Reference") -Default ""
  if ([string]::IsNullOrWhiteSpace("$Id")) {
    $Id = "npay-register-$RegisterType-$RegisterId-$Index"
  }

  $Payment = [pscustomobject]@{
    id = "$Id"
    date = Convert-NovaPayDateText -Value "$Date"
    ttn = "$Ttn"
    amount = (ConvertTo-CrmSqlNumber -Value $Amount -Default 0)
    currency = "$Currency"
    payerName = "$PayerName"
    status = "paid"
    gatewayRef = "$Id"
    purpose = $AllText.Substring(0, [Math]::Min(1000, $AllText.Length))
  }
  return Add-NovaPayRegisterMetadata -Payment $Payment -RegisterType $RegisterType -RegisterId $RegisterId -FileName $FileName -DateFrom $DateFrom -DateTo $DateTo
}

function Convert-NovaPayGenericXmlRegisterRows {
  param(
    [string]$XmlText,
    [int]$RegisterType,
    [string]$RegisterId,
    [string]$FileName,
    [string]$DateFrom,
    [string]$DateTo
  )

  try {
    [xml]$Xml = $XmlText
  } catch {
    return @()
  }
  $Rows = New-Object System.Collections.ArrayList
  $Index = 0
  foreach ($Node in @($Xml.SelectNodes("//*"))) {
    $Children = @($Node.ChildNodes | Where-Object { $_.NodeType -eq [System.Xml.XmlNodeType]::Element })
    if ($Children.Count -lt 2) { continue }
    $LeafChildren = @($Children | Where-Object {
      @($_.ChildNodes | Where-Object { $_.NodeType -eq [System.Xml.XmlNodeType]::Element }).Count -eq 0
    })
    if ($LeafChildren.Count -lt 2) { continue }
    $Object = [ordered]@{}
    foreach ($Child in $LeafChildren) {
      $Object[$Child.LocalName] = "$($Child.InnerText)"
    }
    $Payment = Convert-NovaPayRegisterRowObject -Row ([pscustomobject]$Object) -Index $Index -RegisterType $RegisterType -RegisterId $RegisterId -FileName $FileName -DateFrom $DateFrom -DateTo $DateTo
    if ($Payment.amount -gt 0 -or -not [string]::IsNullOrWhiteSpace($Payment.ttn)) {
      [void]$Rows.Add($Payment)
      $Index += 1
    }
  }
  return @($Rows)
}

function Convert-NovaPayRegisterFileContent {
  param(
    [string]$Content,
    [int]$RegisterType,
    [string]$RegisterId,
    [string]$FileName,
    [string]$DateFrom,
    [string]$DateTo
  )

  if ([string]::IsNullOrWhiteSpace($Content)) {
    return @()
  }
  $Trimmed = $Content.Trim([char]0xFEFF, [char]0x200B, " ", "`r", "`n", "`t")
  if ($Trimmed.StartsWith("<")) {
    $PaymentXml = Convert-NovaPayPaymentsXml -PaymentsText $Trimmed
    if ($null -ne $PaymentXml -and @($PaymentXml.rows).Count -gt 0) {
      return @($PaymentXml.rows | ForEach-Object {
        Add-NovaPayRegisterMetadata -Payment $_ -RegisterType $RegisterType -RegisterId $RegisterId -FileName $FileName -DateFrom $DateFrom -DateTo $DateTo
      })
    }
    return @(Convert-NovaPayGenericXmlRegisterRows -XmlText $Trimmed -RegisterType $RegisterType -RegisterId $RegisterId -FileName $FileName -DateFrom $DateFrom -DateTo $DateTo)
  }

  foreach ($Delimiter in @(";", ",", "`t")) {
    try {
      $CsvRows = @($Trimmed | ConvertFrom-Csv -Delimiter $Delimiter)
      if ($CsvRows.Count -gt 0 -and $CsvRows[0].PSObject.Properties.Count -gt 1) {
        $Index = 0
        return @($CsvRows | ForEach-Object {
          $Payment = Convert-NovaPayRegisterRowObject -Row $_ -Index $Index -RegisterType $RegisterType -RegisterId $RegisterId -FileName $FileName -DateFrom $DateFrom -DateTo $DateTo
          $Index += 1
          $Payment
        } | Where-Object { $_.amount -gt 0 -or -not [string]::IsNullOrWhiteSpace($_.ttn) })
      }
    } catch {
    }
  }
  return @()
}

function Invoke-NovaPayRegisterCreate {
  param(
    [string]$Jwt,
    [int]$ClientId,
    [int]$Type,
    [string]$DateFrom,
    [string]$DateTo,
    [string]$FileExtension
  )

  $RegisterDateFrom = ConvertTo-NovaPayRegisterDate -Value $DateFrom
  $RegisterDateTo = ConvertTo-NovaPayRegisterDate -Value $DateTo
  $Extra = @"
        <Type>$Type</Type>
        <ClientId>$ClientId</ClientId>
        <From>$(ConvertTo-XmlText $RegisterDateFrom)</From>
        <Into>$(ConvertTo-XmlText $RegisterDateTo)</Into>
        <FileExtension>$(ConvertTo-XmlText $FileExtension)</FileExtension>
"@
  $Result = Invoke-NovaPaySoapMethod -Method "GetRegister" -RequestXml (New-NovaPayClientRequestXml -Jwt $Jwt -ExtraXml $Extra)
  Assert-NovaPayResultOk -Node $Result -Code "NPAY_REGISTER_CREATE_FAILED"
  $StatementId = Get-XmlChildText -Node $Result -Name "statement_id"
  if ([string]::IsNullOrWhiteSpace($StatementId)) {
    throw "NPAY_REGISTER_EMPTY_STATEMENT_ID: NovaPay GetRegister returned no statement_id."
  }
  return @{
    id = $StatementId
    createdAt = Get-XmlChildText -Node $Result -Name "created_datetime"
  }
}

function Invoke-NovaPayRegisterDownload {
  param(
    [string]$Jwt,
    [int]$Type,
    [int]$Id
  )

  $Extra = @"
        <Type>$Type</Type>
        <Id>$Id</Id>
"@
  $Result = Invoke-NovaPaySoapMethod -Method "DownloadRegister" -RequestXml (New-NovaPayClientRequestXml -Jwt $Jwt -ExtraXml $Extra)
  Assert-NovaPayResultOk -Node $Result -Code "NPAY_REGISTER_DOWNLOAD_FAILED"
  return @{
    id = Get-XmlChildText -Node $Result -Name "id"
    scroogeId = Get-XmlChildText -Node $Result -Name "scrooge_id"
    dateRange = Get-XmlChildText -Node $Result -Name "date_range"
    dateFrom = Get-XmlChildText -Node $Result -Name "date_from"
    dateTo = Get-XmlChildText -Node $Result -Name "date_to"
    createdAt = Get-XmlChildText -Node $Result -Name "created_at"
    removedAt = Get-XmlChildText -Node $Result -Name "removed_at"
    status = Get-XmlChildText -Node $Result -Name "status"
    url = Get-XmlChildText -Node $Result -Name "url"
    fileType = Get-XmlChildText -Node $Result -Name "file_type"
    fileName = Get-XmlChildText -Node $Result -Name "file_name"
  }
}

function Invoke-NovaPayRegisterPeriod {
  param(
    [string]$Jwt,
    [int]$ClientId,
    [string]$DateFrom,
    [string]$DateTo,
    [int[]]$Types,
    [string]$FileExtension,
    [System.Collections.ArrayList]$Warnings
  )

  $Rows = New-Object System.Collections.ArrayList
  $Stats = New-Object System.Collections.ArrayList
  foreach ($Type in @($Types)) {
    $Stat = [ordered]@{
      type = $Type
      from = $DateFrom
      to = $DateTo
      fileExtension = $FileExtension
      statementId = ""
      fileName = ""
      urlPresent = $false
      rows = 0
      ok = $false
    }
    try {
      $Created = Invoke-NovaPayRegisterCreate -Jwt $Jwt -ClientId $ClientId -Type $Type -DateFrom $DateFrom -DateTo $DateTo -FileExtension $FileExtension
      $Stat.statementId = "$($Created.id)"
      $StatementNumericId = 0
      if (-not [int]::TryParse("$($Created.id)", [ref]$StatementNumericId)) {
        throw "NPAY_REGISTER_NON_NUMERIC_STATEMENT_ID: NovaPay statement_id '$($Created.id)' cannot be passed to DownloadRegister Id."
      }

      $Downloaded = $null
      $Attempts = Get-NovaPayRegisterPollAttempts
      for ($Attempt = 1; $Attempt -le $Attempts; $Attempt++) {
        $Downloaded = Invoke-NovaPayRegisterDownload -Jwt $Jwt -Type $Type -Id $StatementNumericId
        if (-not [string]::IsNullOrWhiteSpace($Downloaded.url)) {
          break
        }
        if ($Attempt -lt $Attempts) {
          $SleepMs = Get-NovaPayRegisterPollSleepMs
          if ($SleepMs -gt 0) {
            Start-Sleep -Milliseconds $SleepMs
          }
        }
      }

      if ($null -eq $Downloaded -or [string]::IsNullOrWhiteSpace($Downloaded.url)) {
        throw "NPAY_REGISTER_FILE_NOT_READY: NovaPay did not return a register file URL for statement $($Created.id), status '$($Downloaded.status)'."
      }

      $Stat.urlPresent = $true
      $Stat.fileName = "$($Downloaded.fileName)"
      $Response = Invoke-WebRequest -UseBasicParsing -Uri $Downloaded.url -TimeoutSec (Get-NovaPayGatewayTimeoutSec)
      if ([string]::IsNullOrWhiteSpace($Response.Content)) {
        throw "NPAY_REGISTER_EMPTY_FILE: downloaded register file is empty for statement $($Created.id)."
      }
      $ParsedRows = @(Convert-NovaPayRegisterFileContent -Content "$($Response.Content)" -RegisterType $Type -RegisterId "$($Created.id)" -FileName "$($Downloaded.fileName)" -DateFrom $DateFrom -DateTo $DateTo)
      foreach ($Row in $ParsedRows) {
        [void]$Rows.Add($Row)
      }
      $Stat.rows = $ParsedRows.Count
      $Stat.ok = $true
    } catch {
      $Stat.error = $_.Exception.Message
      if ($null -ne $Warnings) {
        [void]$Warnings.Add("NPAY_REGISTER_PERIOD_FAILED ${DateFrom}..${DateTo} type ${Type}: $($_.Exception.Message)")
      }
    }
    [void]$Stats.Add($Stat)
  }

  return @{
    rows = @($Rows)
    stats = @($Stats)
  }
}

function Invoke-NovaPayPaymentsList {
  param(
    [string]$Jwt,
    [string]$QueryString,
    [string]$AccountId
  )
  $DateFrom = Get-NovaPayDateParam -QueryString $QueryString -Name "from" -OffsetDays -7
  $DateTo = Get-NovaPayDateParam -QueryString $QueryString -Name "to" -OffsetDays 0
  $DateType = Get-QueryValue -QueryString $QueryString -Key "dateType"
  if ([string]::IsNullOrWhiteSpace($DateType)) {
    $DateType = Get-EnvOrDefault -Name "NOVAPAY_DATE_TYPE" -Default ""
  }
  $Extra = @"
        <account_id>$(ConvertTo-XmlText $AccountId)</account_id>
        <date_from>$(ConvertTo-XmlText $DateFrom)</date_from>
        <date_to>$(ConvertTo-XmlText $DateTo)</date_to>
        <date_type>$(ConvertTo-XmlText $DateType)</date_type>
"@
  $Result = Invoke-NovaPaySoapMethod -Method "GetPaymentsList" -RequestXml (New-NovaPayClientRequestXml -Jwt $Jwt -ExtraXml $Extra)
  Assert-NovaPayResultOk -Node $Result -Code "NPAY_DIRECT_PAYMENTS_FAILED"
  return @{
    dateFrom = $DateFrom
    dateTo = $DateTo
    accountId = $AccountId
    payments = @(Convert-NovaPayPaymentsString -PaymentsText (Get-XmlChildText -Node $Result -Name "payments"))
  }
}

function Invoke-NovaPayDirectPayments {
  param([string]$QueryString)

  $Auth = Invoke-NovaPayJwtAuthentication
  $AccountRefSource = "account_id"
  $AccountIdText = Get-QueryValue -QueryString $QueryString -Key "accountId"
  if ([string]::IsNullOrWhiteSpace($AccountIdText)) {
    $AccountIdText = Get-EnvOrDefault -Name "NOVAPAY_ACCOUNT_ID" -Default ""
  }
  if ([string]::IsNullOrWhiteSpace($AccountIdText)) {
    $AccountIbanText = Get-QueryValue -QueryString $QueryString -Key "accountIban"
    if ([string]::IsNullOrWhiteSpace($AccountIbanText)) {
      $AccountIbanText = Get-EnvOrDefault -Name "NOVAPAY_ACCOUNT_IBAN" -Default ""
    }
    if (-not [string]::IsNullOrWhiteSpace($AccountIbanText)) {
      $AccountIdText = $AccountIbanText
      $AccountRefSource = "account_iban"
    }
  }
  $ClientIdText = Get-QueryValue -QueryString $QueryString -Key "clientId"
  if ([string]::IsNullOrWhiteSpace($ClientIdText)) {
    $ClientIdText = Get-EnvOrDefault -Name "NOVAPAY_CLIENT_ID" -Default ""
  }
  $Clients = @()
  if ([string]::IsNullOrWhiteSpace($ClientIdText) -and [string]::IsNullOrWhiteSpace($AccountIdText)) {
    $Clients = @(Invoke-NovaPayClientsList -Jwt $Auth.jwt)
    if ($Clients.Count -lt 1) {
      throw "NPAY_DIRECT_NO_CLIENTS: NovaPay authenticated JWT, but GetClientsList returned no client rows for this login. Set NOVAPAY_CLIENT_ID and NOVAPAY_ACCOUNT_ID from the NovaPay cabinet, or enable/bind Client API access for this login."
    }
    $ClientIdText = "$($Clients[0].id)"
    Set-NovaPayEnvFileValue -Key "NOVAPAY_CLIENT_ID" -Value $ClientIdText
  }
  $Accounts = @()
  if ([string]::IsNullOrWhiteSpace($AccountIdText)) {
    $Accounts = @(Invoke-NovaPayAccountsList -Jwt $Auth.jwt -ClientId ([int]$ClientIdText))
    if ($Accounts.Count -lt 1) {
      throw "NPAY_DIRECT_NO_ACCOUNTS: NovaPay returned no accounts for client $ClientIdText."
    }
    $AccountIbanText = Get-EnvOrDefault -Name "NOVAPAY_ACCOUNT_IBAN" -Default ""
    $ActiveAccount = $null
    if (-not [string]::IsNullOrWhiteSpace($AccountIbanText)) {
      $ActiveAccount = $Accounts | Where-Object { "$($_.IBAN)" -eq $AccountIbanText } | Select-Object -First 1
    }
    if (-not $ActiveAccount) {
      $ActiveAccount = $Accounts | Where-Object { "$($_.statuscode)".ToLowerInvariant() -in @("active", "open", "opened") -or "$($_.status)" -eq "1" } | Select-Object -First 1
    }
  if (-not $ActiveAccount) {
      $ActiveAccount = $Accounts[0]
    }
    $AccountIdText = "$($ActiveAccount.id)"
    $AccountRefSource = "discovered_account_id"
    Set-NovaPayEnvFileValue -Key "NOVAPAY_ACCOUNT_ID" -Value $AccountIdText
  }
  $HistoryMode = (Get-QueryValue -QueryString $QueryString -Key "history").Trim().ToLowerInvariant()
  if ($HistoryMode -in @("all", "full", "1", "true")) {
    $HistoryFromText = Get-NovaPayHistoryFrom -QueryString $QueryString
    $HistoryToText = ConvertTo-NovaPayApiDate -Value (Get-QueryValue -QueryString $QueryString -Key "to") -Default ((Get-Date).Date.ToString("yyyy-MM-dd"))
    $HistoryFromDate = [datetime]::ParseExact($HistoryFromText, "yyyy-MM-dd", [Globalization.CultureInfo]::InvariantCulture)
    $HistoryToDate = [datetime]::ParseExact($HistoryToText, "yyyy-MM-dd", [Globalization.CultureInfo]::InvariantCulture)
    if ($HistoryFromDate -gt $HistoryToDate) {
      $SwapDate = $HistoryFromDate
      $HistoryFromDate = $HistoryToDate
      $HistoryToDate = $SwapDate
    }
    $WindowDays = Get-NovaPayHistoryWindowDays -QueryString $QueryString
    $BaseQuery = Remove-QueryParam -QueryString $QueryString -Keys @("from", "to", "days", "history", "historyFrom", "windowDays")
    $AllPayments = New-Object System.Collections.ArrayList
    $Periods = New-Object System.Collections.ArrayList
    $Warnings = New-Object System.Collections.ArrayList
    $RegisterStats = New-Object System.Collections.ArrayList
    $Partial = $false
    $PaymentsListFetched = 0
    $ExtractRowsFetched = 0
    $ExtractEnabled = Test-NovaPayAccountExtractEnabled -QueryString $QueryString
    $RegisterRowsFetched = 0
    $RegisterEnabled = Test-NovaPayRegisterHistoryEnabled -QueryString $QueryString
    $RegisterFileExtension = Get-NovaPayRegisterFileExtension -QueryString $QueryString
    $RegisterTypes = @(Get-NovaPayRegisterTypes -QueryString $QueryString)
    $RegisterClientId = 0
    if ($RegisterEnabled -and -not [int]::TryParse("$ClientIdText", [ref]$RegisterClientId)) {
      $RegisterEnabled = $false
      [void]$Warnings.Add("NPAY_REGISTER_CLIENT_ID_REQUIRED: NovaPay register history requires numeric NOVAPAY_CLIENT_ID.")
    }
    $WindowStart = $HistoryFromDate
    while ($WindowStart -le $HistoryToDate) {
      $WindowEnd = $WindowStart.AddDays($WindowDays - 1)
      if ($WindowEnd -gt $HistoryToDate) { $WindowEnd = $HistoryToDate }
      $WindowFrom = $WindowStart.ToString("yyyy-MM-dd")
      $WindowTo = $WindowEnd.ToString("yyyy-MM-dd")
      $WindowQuery = Add-QueryParam -QueryString $BaseQuery -Key "from" -Value $WindowFrom
      $WindowQuery = Add-QueryParam -QueryString $WindowQuery -Key "to" -Value $WindowTo
      try {
        $WindowResult = Invoke-NovaPayPaymentsList -Jwt $Auth.jwt -QueryString $WindowQuery -AccountId $AccountIdText
        foreach ($Payment in @($WindowResult.payments)) {
          $Payment | Add-Member -NotePropertyName sourceKind -NotePropertyValue "paymentsList" -Force
          [void]$AllPayments.Add($Payment)
        }
        $PaymentsListFetched += @($WindowResult.payments).Count
        [void]$Periods.Add([ordered]@{
          from = $WindowFrom
          to = $WindowTo
          count = @($WindowResult.payments).Count
          ok = $true
        })
      } catch {
        $Partial = $true
        [void]$Warnings.Add("NPAY_HISTORY_WINDOW_FAILED ${WindowFrom}..${WindowTo}: $($_.Exception.Message)")
        [void]$Periods.Add([ordered]@{
          from = $WindowFrom
          to = $WindowTo
          count = 0
          ok = $false
          error = $_.Exception.Message
        })
      }
      if ($ExtractEnabled) {
        try {
          $ExtractResult = Invoke-NovaPayAccountExtract -Jwt $Auth.jwt -AccountId $AccountIdText -DateFrom $WindowFrom -DateTo $WindowTo
          foreach ($Payment in @($ExtractResult.rows)) {
            $Payment | Add-Member -NotePropertyName sourceKind -NotePropertyValue "accountExtract" -Force
            [void]$AllPayments.Add($Payment)
          }
          $ExtractRowsFetched += @($ExtractResult.rows).Count
        } catch {
          $Partial = $true
          [void]$Warnings.Add("NPAY_ACCOUNT_EXTRACT_WINDOW_FAILED ${WindowFrom}..${WindowTo}: $($_.Exception.Message)")
        }
      }
      if ($RegisterEnabled) {
        try {
          $RegisterResult = Invoke-NovaPayRegisterPeriod -Jwt $Auth.jwt -ClientId $RegisterClientId -DateFrom $WindowFrom -DateTo $WindowTo -Types $RegisterTypes -FileExtension $RegisterFileExtension -Warnings $Warnings
          foreach ($Payment in @($RegisterResult.rows)) {
            [void]$AllPayments.Add($Payment)
          }
          foreach ($Stat in @($RegisterResult.stats)) {
            [void]$RegisterStats.Add($Stat)
          }
          $RegisterRowsFetched += @($RegisterResult.rows).Count
        } catch {
          $Partial = $true
          [void]$Warnings.Add("NPAY_REGISTER_HISTORY_FAILED ${WindowFrom}..${WindowTo}: $($_.Exception.Message)")
        }
      }
      $ThrottleMs = Get-NovaPayHistoryThrottleMs
      if ($ThrottleMs -gt 0) {
        Start-Sleep -Milliseconds $ThrottleMs
      }
      $WindowStart = $WindowEnd.AddDays(1)
    }
    $Cache = Merge-NovaPayPaymentCache -Incoming @($AllPayments) -ClientId $ClientIdText -AccountId $AccountIdText -Periods @($Periods)
    return @{
      ok = $true
      source = "NovaPay Business SOAP gateway"
      mode = "production"
      historyMode = "all"
      signedOnServer = $true
      privateKeyInBrowser = $false
      generatedAt = (Get-Date).ToString("yyyy-MM-dd HH:mm:ss")
      authExpiration = $Auth.expiration
      clientId = $ClientIdText
      accountId = $AccountIdText
      dateFrom = $HistoryFromDate.ToString("yyyy-MM-dd")
      dateTo = $HistoryToDate.ToString("yyyy-MM-dd")
      payments = @($Cache.payments)
      partial = ($Partial -or $Warnings.Count -gt 0)
      warnings = @($Warnings)
      history = @{
        fetched = $AllPayments.Count
        paymentsListFetched = $PaymentsListFetched
        accountExtractFetched = $ExtractRowsFetched
        registerRowsFetched = $RegisterRowsFetched
        cacheCount = $Cache.count
        added = $Cache.added
        updated = $Cache.updated
        skipped = $Cache.skipped
        periods = @($Periods)
        cachePath = $Cache.cachePath
        registers = @{
          enabled = $RegisterEnabled
          fileExtension = $RegisterFileExtension
          types = @($RegisterTypes)
          files = $RegisterStats.Count
          filesOk = @($RegisterStats | Where-Object { $_.ok }).Count
          rows = $RegisterRowsFetched
          stats = @($RegisterStats)
        }
        accountExtract = @{
          enabled = $ExtractEnabled
          rows = $ExtractRowsFetched
        }
      }
      diagnostics = @{
        clientsDiscovered = $Clients.Count
        accountsDiscovered = $Accounts.Count
        accountRefSource = $AccountRefSource
        accountIbanConfigured = -not [string]::IsNullOrWhiteSpace($env:NOVAPAY_ACCOUNT_IBAN)
        refreshTokenRotated = $Auth.refreshTokenRotated
      }
    }
  }
  $Result = Invoke-NovaPayPaymentsList -Jwt $Auth.jwt -QueryString $QueryString -AccountId $AccountIdText
  return @{
    ok = $true
    source = "NovaPay Business SOAP gateway"
    mode = "production"
    signedOnServer = $true
    privateKeyInBrowser = $false
    generatedAt = (Get-Date).ToString("yyyy-MM-dd HH:mm:ss")
    authExpiration = $Auth.expiration
    clientId = $ClientIdText
    accountId = $Result.accountId
    dateFrom = $Result.dateFrom
    dateTo = $Result.dateTo
    payments = $Result.payments
    diagnostics = @{
      clientsDiscovered = $Clients.Count
      accountsDiscovered = $Accounts.Count
      accountRefSource = $AccountRefSource
      accountIbanConfigured = -not [string]::IsNullOrWhiteSpace($env:NOVAPAY_ACCOUNT_IBAN)
      refreshTokenRotated = $Auth.refreshTokenRotated
    }
  }
}

function Resolve-RozetkaLimit {
  param(
    [string]$Value,
    [int]$Default,
    [int]$AllValue = 100000
  )

  if ([string]::IsNullOrWhiteSpace($Value)) { return $Default }
  $Normalized = $Value.Trim().ToLowerInvariant()
  if ($Normalized -in @("all", "всі", "все", "*")) { return $AllValue }
  $Parsed = 0
  if ([int]::TryParse($Normalized, [ref]$Parsed) -and $Parsed -gt 0) { return $Parsed }
  return $Default
}

function Invoke-RozetkaGoodsNewAll {
  param([string]$QueryString)

  $Page = 1
  $PageValue = Get-QueryValue -QueryString $QueryString -Key "page"
  if ($PageValue) { $Page = [int]$PageValue }
  $PageSize = 100
  $PageSizeValue = Get-QueryValue -QueryString $QueryString -Key "pageSize"
  if ($PageSizeValue) { $PageSize = [int]$PageSizeValue }
  $MaxPages = Resolve-RozetkaLimit -Value (Get-QueryValue -QueryString $QueryString -Key "maxPages") -Default 10
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
  $MaxPages = Resolve-RozetkaLimit -Value (Get-QueryValue -QueryString $QueryString -Key "maxPages") -Default 5
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

function Get-RozetkaContentList {
  param(
    [object]$Content,
    [string[]]$Keys
  )

  if ($null -eq $Content) { return @() }
  foreach ($Key in $Keys) {
    if ($Content.PSObject.Properties.Name -contains $Key -and $null -ne $Content.$Key) {
      return @($Content.$Key)
    }
  }
  if ($Content -is [System.Array]) { return @($Content) }
  return @()
}

function Invoke-RozetkaMessagesImport {
  param([string]$QueryString)

  $MaxPages = Resolve-RozetkaLimit -Value (Get-QueryValue -QueryString $QueryString -Key "maxPages") -Default 3
  $StartPage = 1
  $PageValue = Get-QueryValue -QueryString $QueryString -Key "page"
  if ($PageValue) { $StartPage = [int]$PageValue }
  $MsgType = Get-QueryValue -QueryString $QueryString -Key "msgType"
  if ([string]::IsNullOrWhiteSpace($MsgType)) { $MsgType = "orders" }
  $Types = if ($MsgType -eq "all") { @("orders", "items") } else { @($MsgType) }
  $BaseQuery = Remove-QueryParam -QueryString $QueryString -Keys @("maxPages", "page", "msgType", "source")
  $BaseQuery = Add-QueryParam -QueryString $BaseQuery -Key "expand" -Value "messages,item,user_fio,order_status,order"

  $Chats = New-Object System.Collections.ArrayList
  $LastMeta = $null
  foreach ($Type in $Types) {
    $TypedQuery = Add-QueryParam -QueryString $BaseQuery -Key "msgType" -Value $Type
    for ($Index = 0; $Index -lt $MaxPages; $Index++) {
      $PageQuery = Add-QueryParam -QueryString $TypedQuery -Key "page" -Value ([string]($StartPage + $Index))
      $Result = Invoke-RozetkaGet -Path "/messages/search" -QueryString $PageQuery
      $PageChats = Get-RozetkaContentList -Content $Result.content -Keys @("chats", "items", "messages")
      foreach ($Chat in $PageChats) {
        if ($Chat.PSObject.Properties.Name -notcontains "msgType") {
          $Chat | Add-Member -NotePropertyName msgType -NotePropertyValue $Type -Force
        }
        [void]$Chats.Add($Chat)
      }
      $LastMeta = $Result.content._meta
      if ($PageChats.Count -eq 0) { break }
      if ($null -ne $LastMeta -and $LastMeta.pageCount -and ($StartPage + $Index) -ge [int]$LastMeta.pageCount) { break }
    }
  }

  return @{ success = $true; content = @{ count = $Chats.Count; chats = $Chats; sourceMeta = $LastMeta; source = "/messages/search" } }
}

function Invoke-RozetkaCallsImport {
  param([string]$QueryString)

  $MaxPages = Resolve-RozetkaLimit -Value (Get-QueryValue -QueryString $QueryString -Key "maxPages") -Default 3
  $StartPage = 1
  $PageValue = Get-QueryValue -QueryString $QueryString -Key "page"
  if ($PageValue) { $StartPage = [int]$PageValue }
  $BaseQuery = Remove-QueryParam -QueryString $QueryString -Keys @("maxPages", "page")

  $Calls = New-Object System.Collections.ArrayList
  $LastMeta = $null
  for ($Index = 0; $Index -lt $MaxPages; $Index++) {
    $PageQuery = Add-QueryParam -QueryString $BaseQuery -Key "page" -Value ([string]($StartPage + $Index))
    $Result = Invoke-RozetkaGet -Path "/calls/search" -QueryString $PageQuery
    $PageCalls = Get-RozetkaContentList -Content $Result.content -Keys @("calls", "items", "requests")
    foreach ($Call in $PageCalls) { [void]$Calls.Add($Call) }
    $LastMeta = $Result.content._meta
    if ($PageCalls.Count -eq 0) { break }
    if ($null -ne $LastMeta -and $LastMeta.pageCount -and ($StartPage + $Index) -ge [int]$LastMeta.pageCount) { break }
  }

  return @{ success = $true; content = @{ count = $Calls.Count; calls = $Calls; sourceMeta = $LastMeta; source = "/calls/search" } }
}

function Invoke-RozetkaOrdersImport {
  param([string]$QueryString)

  $MaxPages = Resolve-RozetkaLimit -Value (Get-QueryValue -QueryString $QueryString -Key "maxPages") -Default 1
    $MaxDetails = Resolve-RozetkaLimit -Value (Get-QueryValue -QueryString $QueryString -Key "maxDetails") -Default 20
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

  $Client.ReceiveTimeout = 3000
  $Client.SendTimeout = 3000

  $Request = Read-Request -Client $Client
  if ($null -eq $Request) {
    try { $Client.Close() } catch {}
    return
  }
  Start-CrmRequestLog -Client $Client -Request $Request

  $Path = $Request.path
  if ($Request.method -eq "OPTIONS") {
    Send-Text -Client $Client -Text ""
    return
  }

  if ($Path -eq "/api/log/client-action" -and $Request.method -eq "GET") {
    $Limit = 40
    [void][int]::TryParse((Get-QueryValue -QueryString $Request.query -Key "limit"), [ref]$Limit)
    Send-Json -Client $Client -Value (Read-CrmLogPreview -Limit $Limit)
    return
  }

  if ($Path -eq "/api/log/client-action" -and $Request.method -eq "POST") {
    $Payload = $Request.body
    try {
      if (-not [string]::IsNullOrWhiteSpace($Request.body)) {
        $Payload = $Request.body | ConvertFrom-Json
      }
    }
    catch {
      $Payload = @{ raw = $Request.body; parseError = $_.Exception.Message }
    }
    Write-CrmLogRecord -Record ([ordered]@{
      event = "client_action"
      requestId = $Script:CurrentRequestLogContext.requestId
      remote = $Script:CurrentRequestLogContext.remote
      payload = $Payload
    })
    Send-Json -Client $Client -Value @{ ok = $true; loggedAt = (Get-Date).ToString("o"); logPath = (Get-CrmLogPath) }
    return
  }

  if ($Path -eq "/api/delivery/nova-poshta/documents") {
    try {
      Send-Json -Client $Client -Value (Invoke-NovaPoshtaDocuments -QueryString $Request.query)
    }
    catch {
      $Code = "NP_DOCUMENTS_GATEWAY_ERROR"
      if ($_.Exception.Data.Contains("Code")) {
        $Code = [string]$_.Exception.Data["Code"]
      }
      $StatusCode = if ($Code -eq "NP_DELIVERY_NO_KEY") { 400 } else { 502 }
      Send-Json -Client $Client -StatusCode $StatusCode -Value @{
        ok = $false
        provider = "Nova Poshta"
        source = "Nova Poshta server gateway"
        serverGateway = $true
        apiKeyInBrowser = $false
        errorCode = $Code
        error = $_.Exception.Message
      }
    }
    return
  }

  if ($Path -eq "/api/delivery/nova-poshta/track") {
    try {
      $Result = Invoke-NovaPoshtaTracking -QueryString $Request.query
      $StatusCode = if ($Result.ok) { 200 } else { 502 }
      Send-Json -Client $Client -StatusCode $StatusCode -Value $Result
    }
    catch {
      $Code = "NP_DELIVERY_GATEWAY_ERROR"
      if ($_.Exception.Data.Contains("Code")) {
        $Code = [string]$_.Exception.Data["Code"]
      }
      $StatusCode = if ($Code -in @("NP_DELIVERY_NO_KEY", "NP_DELIVERY_NO_TTN")) { 400 } else { 502 }
      Send-Json -Client $Client -StatusCode $StatusCode -Value @{
        ok = $false
        provider = "Нова пошта"
        source = "Nova Poshta server gateway"
        serverGateway = $true
        apiKeyInBrowser = $false
        errorCode = $Code
        error = $_.Exception.Message
      }
    }
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

  if ($Path -eq "/api/novapay/payments") {
    $DemoMode = (Get-QueryValue -QueryString $Request.query -Key "demo") -in @("1", "true", "yes")
    if ($DemoMode) {
      Send-Json -Client $Client -Value @{
        ok = $true
        source = "NovaPay server gateway demo"
        mode = "demo"
        signedOnServer = $true
        privateKeyInBrowser = $false
        generatedAt = (Get-Date).ToString("yyyy-MM-dd HH:mm:ss")
        payments = $Seed.novaPayPayments
      }
      return
    }
    if (Test-NovaPayGatewayConfigured) {
      try {
        Send-Json -Client $Client -Value (Invoke-NovaPayGateway -QueryString $Request.query)
      }
      catch {
        Send-Json -Client $Client -StatusCode 502 -Value @{
          ok = $false
          errorCode = "NPAY_REAL_GATEWAY_FAILED"
          error = $_.Exception.Message
          source = "NovaPay real server gateway"
          configured = $true
          signedOnServer = $true
          privateKeyInBrowser = $false
        }
      }
      return
    }
    if (Test-NovaPayDirectConfigured) {
      try {
        Send-Json -Client $Client -Value (Invoke-NovaPayDirectPayments -QueryString $Request.query)
      }
      catch {
        $ErrorCode = "NPAY_DIRECT_GATEWAY_FAILED"
        $Message = "$($_.Exception.Message)"
        if ($Message -match "^(NPAY_[A-Z0-9_]+):") {
          $ErrorCode = $Matches[1]
        }
        Send-Json -Client $Client -StatusCode 502 -Value @{
          ok = $false
          errorCode = $ErrorCode
          error = $Message
          source = "NovaPay Business SOAP gateway"
          configured = $true
          signedOnServer = $true
          privateKeyInBrowser = $false
          diagnostics = Get-NovaPayDirectCredentialStatus
        }
      }
      return
    }
    Send-Json -Client $Client -StatusCode 503 -Value @{
      ok = $false
      errorCode = "NPAY_DIRECT_GATEWAY_NOT_CONFIGURED"
      error = "NovaPay direct gateway is not configured. Set NOVAPAY_BUSINESS_LOGIN, NOVAPAY_REFRESH_TOKEN and NOVAPAY_CERTIFICATE_PATH in .env, or set NOVAPAY_GATEWAY_URL to an external gateway."
      source = "NovaPay real server gateway"
      configured = $false
      signedOnServer = $true
      privateKeyInBrowser = $false
      diagnostics = Get-NovaPayDirectCredentialStatus
      requirements = @(
        "NOVAPAY_BUSINESS_LOGIN",
        "NOVAPAY_REFRESH_TOKEN",
        "NOVAPAY_CERTIFICATE_PATH",
        "NOVAPAY_CLIENT_ID optional",
        "NOVAPAY_ACCOUNT_ID optional",
        "NOVAPAY_ACCOUNT_IBAN optional",
        "NOVAPAY_CLIENT_API_URL optional",
        "or NOVAPAY_GATEWAY_URL",
        "NOVAPAY_GATEWAY_TOKEN optional",
        "NOVAPAY_GATEWAY_TOKEN_HEADER optional",
        "NOVAPAY_GATEWAY_TIMEOUT_SEC optional"
      )
    }
    return
  }

  if ($Path -eq "/api/novapay/status") {
    Send-Json -Client $Client -Value @{
      ok = $true
      source = "NovaPay server diagnostics"
      generatedAt = (Get-Date).ToString("yyyy-MM-dd HH:mm:ss")
      diagnostics = Get-NovaPayDirectCredentialStatus
    }
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

  if ($Path -eq "/api/rozetka/messages/import") {
    if (-not (Test-RozetkaCredentials)) {
      Send-Json -Client $Client -StatusCode 400 -Value @{ ok = $false; error = "Rozetka credentials are missing. Fill .env."; requirements = $RozetkaRequirements }
      return
    }
    try {
      Send-Json -Client $Client -Value (Invoke-RozetkaMessagesImport -QueryString $Request.query)
    }
    catch {
      Send-Json -Client $Client -StatusCode 502 -Value @{ ok = $false; error = $_.Exception.Message; endpoint = "/messages/search" }
    }
    return
  }

  if ($Path -eq "/api/rozetka/messages/counts") {
    if (-not (Test-RozetkaCredentials)) {
      Send-Json -Client $Client -StatusCode 400 -Value @{ ok = $false; error = "Rozetka credentials are missing. Fill .env."; requirements = $RozetkaRequirements }
      return
    }
    try {
      Send-Json -Client $Client -Value (Invoke-RozetkaGet -Path "/messages/counts" -QueryString $Request.query)
    }
    catch {
      Send-Json -Client $Client -StatusCode 502 -Value @{ ok = $false; error = $_.Exception.Message; endpoint = "/messages/counts" }
    }
    return
  }

  if ($Path -eq "/api/rozetka/messages/create" -and $Request.method -eq "POST") {
    if (-not (Test-RozetkaCredentials)) {
      Send-Json -Client $Client -StatusCode 400 -Value @{ ok = $false; error = "Rozetka credentials are missing. Fill .env."; requirements = $RozetkaRequirements }
      return
    }
    try {
      $BodyObject = $Request.body | ConvertFrom-Json
      Send-Json -Client $Client -Value (Invoke-RozetkaPostJson -Path "/messages/create" -BodyObject $BodyObject)
    }
    catch {
      Send-Json -Client $Client -StatusCode 502 -Value @{ ok = $false; error = $_.Exception.Message; endpoint = "/messages/create" }
    }
    return
  }

  if ($Path -eq "/api/rozetka/calls/import") {
    if (-not (Test-RozetkaCredentials)) {
      Send-Json -Client $Client -StatusCode 400 -Value @{ ok = $false; error = "Rozetka credentials are missing. Fill .env."; requirements = $RozetkaRequirements }
      return
    }
    try {
      Send-Json -Client $Client -Value (Invoke-RozetkaCallsImport -QueryString $Request.query)
    }
    catch {
      Send-Json -Client $Client -StatusCode 502 -Value @{ ok = $false; error = $_.Exception.Message; endpoint = "/calls/search" }
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

  if ($Path -eq "/api/crm-sql/latest") {
    try {
      Send-Json -Client $Client -Value (Get-CrmSqlLatestPayload -QueryString $Request.query)
    }
    catch {
      Send-Json -Client $Client -StatusCode 502 -Value @{ ok = $false; error = $_.Exception.Message; source = "CRM SQL" }
    }
    return
  }

  if ($Path -eq "/api/onec/latest") {
    try {
      $Directory = Get-OneCToCRMPath
      if (-not (Test-Path -LiteralPath $Directory -PathType Container)) {
        Send-Json -Client $Client -StatusCode 404 -Value @{ ok = $false; error = "1C ToCRM folder not found: $Directory" }
        return
      }
      $Latest = Get-ChildItem -LiteralPath $Directory -Filter "*.json" |
        Sort-Object LastWriteTime -Descending |
        Select-Object -First 1
      if ($null -eq $Latest) {
        Send-Json -Client $Client -StatusCode 404 -Value @{ ok = $false; error = "No JSON files in 1C ToCRM folder: $Directory" }
        return
      }
      $Text = [System.IO.File]::ReadAllText($Latest.FullName, [System.Text.Encoding]::UTF8)
      $Payload = $Text | ConvertFrom-Json
      Send-Json -Client $Client -Value @{
        ok = $true
        fileName = $Latest.Name
        fullName = $Latest.FullName
        modifiedAt = $Latest.LastWriteTime.ToString("yyyy-MM-dd HH:mm:ss")
        payload = $Payload
      }
    }
    catch {
      Send-Json -Client $Client -StatusCode 500 -Value @{ ok = $false; error = $_.Exception.Message }
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
  Write-Host "Marketplace CRM mock API: http://$DisplayHost`:$Port/"
  Write-Host "Static app: http://$DisplayHost`:$Port/index.html"
  Write-Host "1C ToCRM folder: $(Get-OneCToCRMPath)"
  try {
    Write-Host "Log file: $(Get-CrmLogPath)"
  }
  catch {
    Write-Host "Log file unavailable: $($_.Exception.Message)"
  }
  Write-Host "Stop with Ctrl+C."

  do {
    $Client = $Listener.AcceptTcpClient()
    try {
      Handle-Client -Client $Client
    }
    catch {
      try {
        Send-Json -Client $Client -StatusCode 500 -Value @{ ok = $false; error = $_.Exception.Message }
      }
      catch {
        try { $Client.Close() } catch {}
      }
    }
  } while (-not $Once)
}
finally {
  $Listener.Stop()
}

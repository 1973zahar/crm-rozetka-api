import http from "node:http";
import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.dirname(fileURLToPath(import.meta.url));
const DEFAULT_PORT = 8798;
const DEFAULT_BIND = "0.0.0.0";
const DEFAULT_SQL_API = "http://192.168.0.166:3000";
const DEFAULT_LEGACY_API = "http://127.0.0.1:8797";
const DEFAULT_PRODUCT_PHOTO_MEDIA_ROOT = "D:\\CRM\\ProductPhotos";
const MAX_PRODUCT_PHOTO_UPLOAD_BYTES = Number(process.env.PRODUCT_PHOTO_MAX_BYTES || 8 * 1024 * 1024);
const SQL_API_TIMEOUT_MS = Math.max(1000, Number(process.env.CRM_SQL_API_TIMEOUT_SEC || 15) * 1000);
const LEGACY_CREDENTIAL_FORWARD_TIMEOUT_MS = 1800;
const LEGACY_STATUS_TIMEOUT_MS = Number(process.env.MARKETPLACE_CRM_LEGACY_STATUS_TIMEOUT_MS || 1500);
const LEGACY_PROXY_QUICK_TIMEOUT_MS = Number(process.env.MARKETPLACE_CRM_LEGACY_PROXY_QUICK_TIMEOUT_MS || 1500);
const LEGACY_PROXY_LONG_TIMEOUT_MS = Number(process.env.MARKETPLACE_CRM_LEGACY_PROXY_LONG_TIMEOUT_MS || 1800);
const EXCHANGE_JOB_TIMEOUT_MS = Number(process.env.MARKETPLACE_CRM_EXCHANGE_JOB_TIMEOUT_MS || 30000);
const EXCHANGE_JOB_TTL_MS = Number(process.env.MARKETPLACE_CRM_EXCHANGE_JOB_TTL_MS || 10 * 60 * 1000);
const STOCK_REFRESH_INTERVAL_MS = envNumber("MARKETPLACE_CRM_STOCK_REFRESH_INTERVAL_MS", 60 * 60 * 1000, 60 * 1000, 24 * 60 * 60 * 1000);
const STOCK_REFRESH_PAGE_LIMIT = envNumber("MARKETPLACE_CRM_STOCK_REFRESH_PAGE_LIMIT", 100, 1, 100);
const STOCK_REFRESH_MAX_PAGES = envNumber("MARKETPLACE_CRM_STOCK_REFRESH_MAX_PAGES", 500, 1, 5000);
const STOCK_REFRESH_CONCURRENCY = envNumber("MARKETPLACE_CRM_STOCK_REFRESH_CONCURRENCY", 10, 1, 16);
const STOCK_REFRESH_STALE_MS = envNumber("MARKETPLACE_CRM_STOCK_REFRESH_STALE_MS", 75 * 60 * 1000, 60 * 1000, 7 * 24 * 60 * 60 * 1000);
const DEFAULT_PROGRAM_DATA = process.env.ProgramData || "C:\\ProgramData";
const LIVE_ENV_PATH = process.env.MARKETPLACE_CRM_ENV_PATH || path.join(DEFAULT_PROGRAM_DATA, "MarketplaceCRMLive", "config", "marketplace-crm-live.env");
const LEGACY_ENV_PATH = process.env.MARKETPLACE_CRM_LEGACY_ENV_PATH || path.join(DEFAULT_PROGRAM_DATA, "MarketplaceCRM", "config", "marketplace-crm.env");
const NOVAPAY_CERTIFICATE_UPLOAD_PATH = process.env.NOVAPAY_CERTIFICATE_UPLOAD_PATH || path.join(path.dirname(LIVE_ENV_PATH), "certificates", "novapay-public-certificate.pem");
const CREDENTIAL_PROVIDER_KEYS = {
  rozetka: ["ROZETKA_API_TOKEN", "ROZETKA_USERNAME", "ROZETKA_PASSWORD"],
  novaPay: [
    "NOVAPAY_GATEWAY_URL",
    "NOVAPAY_GATEWAY_TOKEN",
    "NOVAPAY_GATEWAY_TOKEN_HEADER",
    "NOVAPAY_BUSINESS_LOGIN",
    "NOVAPAY_REFRESH_TOKEN",
    "NOVAPAY_CERTIFICATE_PATH",
    "NOVAPAY_CERTIFICATE_CONTENT",
    "NOVAPAY_CLIENT_ID",
    "NOVAPAY_ACCOUNT_ID",
    "NOVAPAY_ACCOUNT_IBAN"
  ],
  novaPoshta: ["NOVA_POSHTA_API_KEY"]
};

const CONTENT_TYPES = new Map([
  [".html", "text/html; charset=utf-8"],
  [".js", "text/javascript; charset=utf-8"],
  [".css", "text/css; charset=utf-8"],
  [".json", "application/json; charset=utf-8"],
  [".svg", "image/svg+xml"],
  [".png", "image/png"],
  [".jpg", "image/jpeg"],
  [".jpeg", "image/jpeg"],
  [".ico", "image/x-icon"]
]);

function argValue(name, fallback = "") {
  const index = process.argv.indexOf(name);
  if (index >= 0 && process.argv[index + 1]) return process.argv[index + 1];
  const inline = process.argv.find((item) => item.startsWith(`${name}=`));
  return inline ? inline.slice(name.length + 1) : fallback;
}

async function loadEnvFile(filePath) {
  if (!filePath) return;
  try {
    const text = await fs.readFile(filePath, "utf8");
    for (const rawLine of text.split(/\r?\n/)) {
      const line = rawLine.trim();
      if (!line || line.startsWith("#")) continue;
      const index = line.indexOf("=");
      if (index <= 0) continue;
      const key = line.slice(0, index).trim();
      const value = line.slice(index + 1).trim().replace(/^['"]|['"]$/g, "");
      if (key && !process.env[key]) process.env[key] = value;
    }
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
  }
}

await loadEnvFile(LIVE_ENV_PATH);

const PORT = Number(argValue("--port", process.env.PORT || DEFAULT_PORT)) || DEFAULT_PORT;
const BIND = argValue("--bind", process.env.BIND_ADDRESS || DEFAULT_BIND);
const SQL_API_BASE = (process.env.CRM_SQL_API_BASE_URL || DEFAULT_SQL_API).replace(/\/+$/, "");
const LEGACY_API_BASE = (process.env.MARKETPLACE_CRM_LEGACY_API_BASE_URL || DEFAULT_LEGACY_API).replace(/\/+$/, "");
const PRODUCT_PHOTO_MEDIA_ROOT = path.resolve(process.env.PRODUCT_PHOTO_MEDIA_ROOT || DEFAULT_PRODUCT_PHOTO_MEDIA_ROOT);
const LIVE_MODEL_ATTEMPTS = {
  products: ["/products", "/one-c-mirror/products"],
  customers: ["/customers"],
  warehouses: ["/one-c-mirror/warehouses", "/warehouses"],
  stockBalances: ["/one-c-mirror/stock-balances", "/one-c-mirror/stock", "/stock-balances", "/stock"],
  counterpartyBalances: ["/one-c-mirror/counterparty-balances", "/one-c-mirror/balances", "/counterparty-balances", "/balances", "/receivables"],
  serialStock: ["/one-c-mirror/serial-stock", "/one-c-mirror/serials", "/one-c-mirror/serial-stock-current", "/serial-stock", "/serials"],
  serialStockSummary: ["/one-c-mirror/serial-stock-summary", "/serial-stock-summary"]
};

function sendJson(res, statusCode, payload) {
  const body = JSON.stringify(payload);
  res.writeHead(statusCode, {
    "content-type": "application/json; charset=utf-8",
    "cache-control": "no-store",
    "content-length": Buffer.byteLength(body)
  });
  res.end(body);
}

function clampInt(value, fallback, min, max) {
  const parsed = Number.parseInt(String(value ?? ""), 10);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.max(min, Math.min(max, parsed));
}

function envNumber(name, fallback, min, max) {
  const parsed = Number(process.env[name]);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.max(min, Math.min(max, parsed));
}

function pick(row, keys, fallback = "") {
  for (const key of keys) {
    if (row && row[key] !== undefined && row[key] !== null && String(row[key]).trim() !== "") return row[key];
  }
  return fallback;
}

function numberValue(value, fallback = 0) {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  const parsed = Number.parseFloat(String(value ?? "").replace(/\s/g, "").replace(",", "."));
  return Number.isFinite(parsed) ? parsed : fallback;
}

function stringValue(value, fallback = "") {
  const text = String(value ?? "").trim();
  return text || fallback;
}

function searchText(row) {
  return [
    row.id,
    row.productId,
    row.code,
    row.name,
    row.productName,
    row.product_name,
    row.model,
    row.title,
    row.entityName,
    row.entity_name,
    row.brand,
    row.brandName,
    row.category,
    row.productGroupName,
    row.supplierSku,
    row.supplier_sku,
    row.internalCode,
    row.internal_code,
    row.barcode,
    row.qrCode,
    row.marketplaceSku
  ].filter(Boolean).join(" ").toLowerCase();
}

function normalizeProduct(row) {
  const id = String(pick(row, ["id", "productId", "product_id", "externalRef", "external_ref", "code"], "")).trim();
  const name = String(pick(row, ["name", "productName", "product_name", "model", "title", "entityName", "entity_name"], id)).trim();
  const supplierSku = String(pick(row, ["supplierSku", "supplier_sku", "sku", "article", "vendorCode", "vendor_code"], "")).trim();
  const internalCode = String(pick(row, ["internalCode", "internal_code", "code"], "")).trim();
  const barcode = String(pick(row, ["barcode", "qrCode", "qr_code"], "")).trim();
  const category = pick(row, ["category", "categoryName", "category_name", "productGroupName", "product_group_name", "folderLevel1", "folder_level_1", "folderLevel2", "folder_level_2"], "");
  const folderPath = [row.folderPath, row.folder_path, row.productFullPath, row.product_full_path, category].filter(Boolean).join(" / ");
  const type = String(pick(row, ["type", "productType", "product_type"], "") || "").trim()
    || (/збро/i.test(folderPath) ? "weapon" : "regular");
  return {
    ...row,
    id,
    name,
    productName: pick(row, ["productName", "product_name"], name),
    model: pick(row, ["model"], name),
    brand: pick(row, ["brand", "brandName", "brand_name"], ""),
    category,
    type,
    productType: type,
    supplierSku,
    internalCode,
    barcode,
    qrCode: pick(row, ["qrCode", "qr_code"], barcode),
    marketplaceSku: pick(row, ["marketplaceSku", "marketplace_sku"], supplierSku),
    price: numberValue(pick(row, ["price", "latestPrice", "latest_price", "minPrice", "min_price"], 0), 0),
    currency: pick(row, ["currency", "latestPriceCurrency", "latest_price_currency", "priceCurrency"], "UAH"),
    totalQuantity: numberValue(pick(row, ["totalQuantity", "total_quantity", "quantity", "qty"], 0), 0),
    availableQuantity: numberValue(pick(row, ["availableQuantity", "available_quantity", "quantity", "qty"], 0), 0),
    sourceType: "crm_sql_live",
    createdFrom: "crm_sql_live"
  };
}

function normalizeWarehouse(row) {
  const id = stringValue(pick(row, ["id", "warehouseId", "warehouse_id", "warehouseCode", "warehouse_code", "code", "oneCRef", "one_c_ref"], ""));
  const code = stringValue(pick(row, ["warehouseCode", "warehouse_code", "code", "id", "warehouseId", "warehouse_id"], id), id);
  const name = stringValue(pick(row, ["name", "warehouse", "warehouseName", "warehouse_name", "title"], ""), code || id);
  return {
    ...row,
    id: id || code,
    code,
    warehouseCode: code,
    name,
    warehouseName: name,
    sourceType: "crm_sql_live"
  };
}

function productCodeFromRow(row) {
  return stringValue(pick(row, [
    "productCode", "product_code", "productId", "product_id", "productCrmId", "product_crm_id",
    "id", "internalCode", "internal_code", "sku", "article", "code", "barcode"
  ], ""));
}

function warehouseCodeFromRow(row) {
  return stringValue(pick(row, ["warehouseCode", "warehouse_code", "warehouseId", "warehouse_id", "warehouseRef", "warehouse_ref", "warehouse", "code"], ""));
}

function enterpriseCodeFromRow(row) {
  return stringValue(pick(row, ["enterpriseCode", "enterprise_code", "enterpriseId", "enterprise_id", "organizationCode", "organization_code", "firmCode", "firm_code"], ""));
}

function normalizeStockBalance(row) {
  const productCode = productCodeFromRow(row);
  const warehouseCode = warehouseCodeFromRow(row);
  const productName = stringValue(pick(row, [
    "productName", "product_name", "name", "model", "title", "entityName", "entity_name", "nomenclature", "nomenclatureName"
  ], ""), productCode);
  const warehouseName = stringValue(pick(row, ["warehouseName", "warehouse_name", "warehouse", "stockName", "stock_name"], ""), warehouseCode);
  const quantity = numberValue(pick(row, ["qty", "quantity", "totalQuantity", "total_quantity", "balanceQuantity", "balance_quantity", "balance"], 0), 0);
  const availableQuantity = numberValue(pick(row, [
    "availableQuantity", "available_quantity", "availableQty", "available_qty", "freeQuantity", "free_quantity",
    "serialQuantity", "serial_quantity", "balanceQuantity", "balance_quantity", "qty", "quantity", "balance"
  ], quantity), quantity);
  return {
    ...row,
    productCode,
    enterpriseCode: enterpriseCodeFromRow(row),
    productId: stringValue(pick(row, ["productId", "product_id", "productCrmId", "product_crm_id"], ""), productCode),
    productName,
    name: productName,
    warehouseCode,
    warehouseId: stringValue(pick(row, ["warehouseId", "warehouse_id"], ""), warehouseCode),
    warehouseName,
    warehouse: warehouseName,
    quantity,
    qty: quantity,
    availableQuantity,
    availableQty: availableQuantity,
    sourceType: "crm_sql_live"
  };
}

function normalizeProductFromStock(row) {
  const stock = normalizeStockBalance(row);
  return normalizeProduct({
    ...row,
    id: stock.productId || stock.productCode,
    productId: stock.productId || stock.productCode,
    productCode: stock.productCode,
    code: stock.productCode,
    name: stock.productName,
    productName: stock.productName,
    warehouseCode: stock.warehouseCode,
    warehouseId: stock.warehouseId || stock.warehouseCode,
    warehouseName: stock.warehouseName,
    selectedWarehouseQuantity: stock.quantity,
    selectedWarehouseAvailableQuantity: stock.availableQuantity,
    totalQuantity: stock.quantity,
    availableQuantity: stock.availableQuantity
  });
}

function normalizeSerialStock(row) {
  const productCode = productCodeFromRow(row);
  const warehouseCode = warehouseCodeFromRow(row);
  const serial = stringValue(pick(row, ["serial", "serialNumber", "serial_number", "serialNo", "serial_no", "number", "name"], ""));
  const id = stringValue(pick(row, ["id", "serialId", "serial_id", "serialRef", "serial_ref"], ""), [productCode, warehouseCode, serial].filter(Boolean).join(":"));
  const status = stringValue(pick(row, ["status", "serialStatus", "serial_status", "stockStatus", "stock_status"], ""), "available");
  const availableRaw = pick(row, ["available", "isAvailable", "is_available", "actual"], "");
  const unavailableStatus = /sold|прод|blocked|блок|reserved|резерв|write.?off|спис/i.test(status);
  const available = String(availableRaw).trim() === ""
    ? !unavailableStatus
    : !["false", "0", "no", "ні"].includes(String(availableRaw).trim().toLowerCase());
  return {
    ...row,
    id,
    productCode,
    productId: stringValue(pick(row, ["productId", "product_id", "productCrmId", "product_crm_id"], ""), productCode),
    warehouseCode,
    warehouseId: stringValue(pick(row, ["warehouseId", "warehouse_id"], ""), warehouseCode),
    warehouseName: stringValue(pick(row, ["warehouseName", "warehouse_name", "warehouse"], ""), warehouseCode),
    serial,
    serialName: stringValue(pick(row, ["serialName", "serial_name"], ""), serial),
    serialNumber: serial,
    status: available ? "available" : status,
    available,
    actual: available,
    sourceType: "crm_sql_live"
  };
}

function normalizeSerialStockSummary(row) {
  const productCode = productCodeFromRow(row);
  const warehouseCode = warehouseCodeFromRow(row);
  const serialRows = numberValue(pick(row, ["serialRows", "serial_rows", "serialCount", "serial_count", "count"], 0), 0);
  const id = stringValue(pick(row, ["id", "summaryId", "summary_id"], ""), [productCode, warehouseCode].filter(Boolean).join(":"));
  return {
    ...row,
    id,
    productCode,
    productId: stringValue(pick(row, ["productId", "product_id", "productCrmId", "product_crm_id"], ""), productCode),
    warehouseCode,
    warehouseId: stringValue(pick(row, ["warehouseId", "warehouse_id"], ""), warehouseCode),
    warehouseName: stringValue(pick(row, ["warehouseName", "warehouse_name", "warehouse"], ""), warehouseCode),
    serialRows,
    serialCount: serialRows,
    count: serialRows,
    sourceType: "crm_sql_live"
  };
}

function unwrapRows(payload) {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.products)) return payload.products;
  if (Array.isArray(payload?.customers)) return payload.customers;
  if (Array.isArray(payload?.warehouses)) return payload.warehouses;
  if (Array.isArray(payload?.stockBalances)) return payload.stockBalances;
  if (Array.isArray(payload?.stock_balances)) return payload.stock_balances;
  if (Array.isArray(payload?.counterpartyBalances)) return payload.counterpartyBalances;
  if (Array.isArray(payload?.counterparty_balances)) return payload.counterparty_balances;
  if (Array.isArray(payload?.balances)) return payload.balances;
  if (Array.isArray(payload?.receivables)) return payload.receivables;
  if (Array.isArray(payload?.rows)) return payload.rows;
  if (Array.isArray(payload?.items)) return payload.items;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.data?.products)) return payload.data.products;
  if (Array.isArray(payload?.data?.customers)) return payload.data.customers;
  if (Array.isArray(payload?.data?.warehouses)) return payload.data.warehouses;
  if (Array.isArray(payload?.data?.rows)) return payload.data.rows;
  if (Array.isArray(payload?.data?.rows)) return payload.data.rows;
  return [];
}

function payloadTotal(payload, rows) {
  for (const key of ["total", "totalCount", "total_count", "rowCount", "row_count"]) {
    const value = payload?.[key] ?? payload?.meta?.[key] ?? payload?.data?.[key];
    if (value === undefined || value === null || String(value).trim() === "") continue;
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return null;
}

function payloadHasMore(payload) {
  for (const key of ["hasMore", "has_more"]) {
    const value = payload?.[key] ?? payload?.meta?.[key] ?? payload?.data?.[key];
    if (typeof value === "boolean") return value;
    if (value !== undefined && value !== null && String(value).trim() !== "") return ["1", "true", "yes"].includes(String(value).toLowerCase());
  }
  return null;
}

function payloadNextOffset(payload) {
  for (const key of ["nextOffset", "next_offset"]) {
    const value = payload?.[key] ?? payload?.meta?.[key] ?? payload?.data?.[key];
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return undefined;
}

function payloadNextCursor(payload) {
  for (const key of ["nextCursor", "next_cursor"]) {
    const value = payload?.[key] ?? payload?.meta?.[key] ?? payload?.data?.[key];
    if (value !== undefined && value !== null && String(value).trim() !== "") return String(value);
  }
  return null;
}

function pagedEnvelope({ ok = true, source = "crm_sql_live", data = [], limit = 20, offset = 0, total = null, warnings = [], hasMore = null, nextOffset = undefined, nextCursor = null, ...extra } = {}) {
  const totalHasValue = total !== undefined && total !== null && String(total).trim() !== "";
  const resolvedTotal = totalHasValue && Number.isFinite(Number(total)) ? Number(total) : null;
  const resolvedHasMore = hasMore !== null && hasMore !== undefined
    ? Boolean(hasMore)
    : (resolvedTotal !== null ? offset + data.length < resolvedTotal : data.length >= limit);
  return {
    ok,
    source,
    data,
    limit,
    offset,
    total: resolvedTotal ?? (resolvedHasMore ? null : offset + data.length),
    hasMore: resolvedHasMore,
    nextOffset: nextOffset !== undefined ? nextOffset : (resolvedHasMore ? offset + limit : null),
    nextCursor,
    count: data.length,
    warnings,
    ...extra
  };
}

async function fetchJson(url) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), SQL_API_TIMEOUT_MS);
  try {
    const response = await fetch(url, { signal: controller.signal, headers: { accept: "application/json" } });
    const text = await response.text();
    const payload = text ? JSON.parse(text) : {};
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return payload;
  } finally {
    clearTimeout(timeout);
  }
}

async function postJson(url, payload) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), SQL_API_TIMEOUT_MS);
  try {
    const response = await fetch(url, {
      method: "POST",
      signal: controller.signal,
      headers: { accept: "application/json", "content-type": "application/json" },
      body: JSON.stringify(payload)
    });
    const text = await response.text();
    const data = text ? JSON.parse(text) : {};
    if (!response.ok) {
      const error = new Error(data?.message || data?.error || `HTTP ${response.status}`);
      error.statusCode = response.status;
      error.payload = data;
      throw error;
    }
    return data;
  } finally {
    clearTimeout(timeout);
  }
}

const exchangeJobs = new Map();

function cleanupExchangeJobs() {
  const cutoff = Date.now() - EXCHANGE_JOB_TTL_MS;
  for (const [id, job] of exchangeJobs.entries()) {
    if (new Date(job.updatedAt || job.createdAt || 0).getTime() < cutoff) exchangeJobs.delete(id);
  }
}

function publicExchangeJob(job) {
  return {
    ok: job.status !== "error",
    id: job.id,
    source: job.source,
    kind: job.kind,
    status: job.status,
    percent: job.percent,
    count: job.count,
    code: job.code || "",
    message: job.message || "",
    createdAt: job.createdAt,
    updatedAt: job.updatedAt,
    payload: job.status === "success" ? job.payload : undefined
  };
}

function exchangeJobSpec(source) {
  const today = new Date().toISOString().slice(0, 10);
  if (source === "rozetka") {
    const params = new URLSearchParams({ page: "1", limit: "20", sort: "-id" });
    return {
      kind: "rozetka_orders_latest",
      url: `${LEGACY_API_BASE}/api/rozetka/orders/search?${params.toString()}`
    };
  }
  if (source === "novaPay") {
    const params = new URLSearchParams({ limit: "20" });
    return {
      kind: "novapay_payments_bounded",
      url: `${LEGACY_API_BASE}/api/novapay/payments?${params.toString()}`
    };
  }
  if (source === "novaPoshta") {
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
    const params = new URLSearchParams({ historyFrom: yesterday, limit: "20", maxPages: "1", windowDays: "1" });
    return {
      kind: "nova_poshta_documents_bounded",
      url: `${LEGACY_API_BASE}/api/delivery/nova-poshta/documents?${params.toString()}`
    };
  }
  return null;
}

function exchangePayloadCount(source, payload) {
  if (source === "rozetka") {
    if (Array.isArray(payload)) return payload.length;
    if (Array.isArray(payload?.content?.orders)) return payload.content.orders.length;
    if (Array.isArray(payload?.orders)) return payload.orders.length;
    if (Array.isArray(payload?.items)) return payload.items.length;
  }
  if (source === "novaPay") {
    if (Array.isArray(payload)) return payload.length;
    if (Array.isArray(payload?.payments)) return payload.payments.length;
    if (Array.isArray(payload?.transactions)) return payload.transactions.length;
    if (Array.isArray(payload?.data)) return payload.data.length;
    if (Array.isArray(payload?.items)) return payload.items.length;
  }
  if (source === "novaPoshta") {
    if (Array.isArray(payload?.documents)) return payload.documents.length;
    if (Array.isArray(payload?.data?.documents)) return payload.data.documents.length;
    if (Array.isArray(payload?.data)) return payload.data.length;
    if (Array.isArray(payload?.items)) return payload.items.length;
    return Number(payload?.count || payload?.diagnostics?.sampleDocuments || 0) || 0;
  }
  return 0;
}

async function fetchExchangeJobPayload(url) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), EXCHANGE_JOB_TIMEOUT_MS);
  try {
    const response = await fetch(url, { signal: controller.signal, headers: { accept: "application/json" } });
    const text = await response.text();
    const payload = text ? JSON.parse(text) : {};
    if (!response.ok || payload?.ok === false || payload?.success === false) {
      const error = new Error(payload?.error || payload?.message || payload?.errors?.message || `HTTP ${response.status}`);
      error.statusCode = response.status;
      error.code = payload?.code || payload?.errorCode || payload?.errors?.code || `LEGACY_HTTP_${response.status}`;
      throw error;
    }
    return payload;
  } finally {
    clearTimeout(timeout);
  }
}

async function runExchangeJob(job) {
  job.status = "running";
  job.percent = 10;
  job.message = "Backend exchange job is running.";
  job.updatedAt = new Date().toISOString();
  const spec = exchangeJobSpec(job.source);
  try {
    if (!spec) {
      const error = new Error("Unsupported exchange source.");
      error.code = "EXCHANGE_JOB_SOURCE_UNSUPPORTED";
      throw error;
    }
    job.kind = spec.kind;
    job.percent = 35;
    job.updatedAt = new Date().toISOString();
    const payload = await fetchExchangeJobPayload(spec.url);
    job.payload = payload;
    job.count = exchangePayloadCount(job.source, payload);
    job.status = "success";
    job.percent = 100;
    job.code = "";
    job.message = `Backend job completed. Received ${job.count} row(s).`;
    job.updatedAt = new Date().toISOString();
  } catch (error) {
    job.status = "error";
    job.percent = 100;
    job.code = error.name === "AbortError" ? "EXCHANGE_JOB_TIMEOUT" : (error.code || "EXCHANGE_JOB_FAILED");
    job.message = `${job.code}: ${error.message}`;
    job.updatedAt = new Date().toISOString();
  }
}

async function handleCreateExchangeJob(req, res) {
  const body = await readJsonBody(req, { maxBytes: 4096, codePrefix: "EXCHANGE_JOB" });
  const source = String(body.source || "").trim();
  if (!["rozetka", "novaPay", "novaPoshta"].includes(source)) {
    return sendJson(res, 400, { ok: false, code: "EXCHANGE_JOB_SOURCE_REQUIRED", error: "source must be rozetka, novaPay, or novaPoshta." });
  }
  cleanupExchangeJobs();
  const job = {
    id: crypto.randomUUID(),
    source,
    kind: "",
    status: "queued",
    percent: 0,
    count: 0,
    code: "",
    message: "Backend exchange job queued.",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    payload: null
  };
  exchangeJobs.set(job.id, job);
  setTimeout(() => runExchangeJob(job).catch((error) => {
    job.status = "error";
    job.percent = 100;
    job.code = "EXCHANGE_JOB_FATAL";
    job.message = `EXCHANGE_JOB_FATAL: ${error.message}`;
    job.updatedAt = new Date().toISOString();
  }), 0);
  return sendJson(res, 202, publicExchangeJob(job));
}

async function handleGetExchangeJob(reqUrl, res) {
  cleanupExchangeJobs();
  const id = decodeURIComponent(reqUrl.pathname.split("/").pop() || "");
  const job = exchangeJobs.get(id);
  if (!job) return sendJson(res, 404, { ok: false, code: "EXCHANGE_JOB_NOT_FOUND", error: "Exchange job was not found or expired." });
  return sendJson(res, 200, publicExchangeJob(job));
}

function productPhotoError(message, code = "PRODUCT_PHOTO_ERROR", statusCode = 400) {
  const error = new Error(message);
  error.code = code;
  error.statusCode = statusCode;
  return error;
}

function cleanRequiredText(value, fieldName) {
  const text = String(value ?? "").trim();
  if (text) return text;
  throw productPhotoError(`${fieldName} is required.`, "PRODUCT_PHOTO_REQUIRED_FIELD", 400);
}

function safePathSegment(value) {
  return cleanRequiredText(value, "path segment")
    .replace(/[<>:"/\\|?*\x00-\x1f]/g, "_")
    .replace(/\.+/g, ".")
    .slice(0, 120);
}

function productPhotoExtension(mimeType, fileName = "") {
  const ext = path.extname(String(fileName || "")).toLowerCase();
  if ([".jpg", ".jpeg", ".png", ".webp", ".gif"].includes(ext)) return ext === ".jpeg" ? ".jpg" : ext;
  if (mimeType === "image/png") return ".png";
  if (mimeType === "image/webp") return ".webp";
  if (mimeType === "image/gif") return ".gif";
  return ".jpg";
}

function truthyInput(value) {
  if (typeof value === "boolean") return value;
  return ["1", "true", "yes", "y"].includes(String(value ?? "").trim().toLowerCase());
}

async function readBodyLimited(req, maxBytes) {
  const chunks = [];
  let total = 0;
  for await (const chunk of req) {
    total += chunk.length;
    if (total > maxBytes) {
      throw productPhotoError("Request body is too large.", "PRODUCT_PHOTO_PAYLOAD_TOO_LARGE", 413);
    }
    chunks.push(chunk);
  }
  return Buffer.concat(chunks);
}

function splitBuffer(buffer, delimiter) {
  const parts = [];
  let start = 0;
  let index = buffer.indexOf(delimiter, start);
  while (index !== -1) {
    parts.push(buffer.subarray(start, index));
    start = index + delimiter.length;
    index = buffer.indexOf(delimiter, start);
  }
  parts.push(buffer.subarray(start));
  return parts;
}

function parseContentDisposition(value = "") {
  const result = {};
  for (const part of value.split(";")) {
    const [rawKey, ...rest] = part.trim().split("=");
    const key = rawKey.trim().toLowerCase();
    if (!key) continue;
    result[key] = rest.join("=").trim().replace(/^"|"$/g, "");
  }
  return result;
}

function trimMultipartBody(buffer) {
  let start = 0;
  let end = buffer.length;
  if (buffer[start] === 13 && buffer[start + 1] === 10) start += 2;
  if (buffer[end - 2] === 13 && buffer[end - 1] === 10) end -= 2;
  return buffer.subarray(start, end);
}

async function readMultipartForm(req) {
  const contentType = String(req.headers["content-type"] || "");
  const boundaryMatch = contentType.match(/boundary=(?:"([^"]+)"|([^;]+))/i);
  if (!boundaryMatch) throw productPhotoError("multipart/form-data boundary is missing.", "PRODUCT_PHOTO_MULTIPART_BOUNDARY_MISSING", 400);
  const boundary = Buffer.from(`--${boundaryMatch[1] || boundaryMatch[2]}`);
  const body = await readBodyLimited(req, MAX_PRODUCT_PHOTO_UPLOAD_BYTES + 128 * 1024);
  const fields = {};
  const files = [];
  for (const rawPart of splitBuffer(body, boundary)) {
    let part = trimMultipartBody(rawPart);
    if (!part.length || part.equals(Buffer.from("--"))) continue;
    if (part.subarray(0, 2).toString() === "--") continue;
    const headerEnd = part.indexOf(Buffer.from("\r\n\r\n"));
    if (headerEnd < 0) continue;
    const headerText = part.subarray(0, headerEnd).toString("utf8");
    const content = trimMultipartBody(part.subarray(headerEnd + 4));
    const headers = Object.fromEntries(headerText.split(/\r\n/).map((line) => {
      const index = line.indexOf(":");
      return index > 0 ? [line.slice(0, index).trim().toLowerCase(), line.slice(index + 1).trim()] : ["", ""];
    }).filter(([key]) => key));
    const disposition = parseContentDisposition(headers["content-disposition"] || "");
    const name = disposition.name || "";
    if (!name) continue;
    if (disposition.filename !== undefined) {
      files.push({
        fieldName: name,
        fileName: disposition.filename || "product-photo",
        mimeType: headers["content-type"] || "application/octet-stream",
        content
      });
    } else {
      fields[name] = content.toString("utf8");
    }
  }
  return { fields, files };
}

function imageDimensions(buffer, mimeType) {
  if (mimeType === "image/png" && buffer.length >= 24 && buffer.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))) {
    return { width: buffer.readUInt32BE(16), height: buffer.readUInt32BE(20) };
  }
  if ((mimeType === "image/jpeg" || mimeType === "image/jpg") && buffer.length > 4 && buffer[0] === 0xff && buffer[1] === 0xd8) {
    let offset = 2;
    while (offset + 9 < buffer.length) {
      if (buffer[offset] !== 0xff) break;
      const marker = buffer[offset + 1];
      const size = buffer.readUInt16BE(offset + 2);
      if (marker >= 0xc0 && marker <= 0xc3) {
        return { height: buffer.readUInt16BE(offset + 5), width: buffer.readUInt16BE(offset + 7) };
      }
      offset += 2 + size;
    }
  }
  return { width: null, height: null };
}

function normalizePhotoMetadata(row = {}) {
  const id = String(row.id || row.photoId || "").trim();
  return {
    id,
    photoId: id,
    enterpriseCode: stringValue(pick(row, ["enterpriseCode", "enterprise_code"], "")),
    productCode: stringValue(pick(row, ["productCode", "product_code"], "")),
    productName: stringValue(pick(row, ["productName", "product_name"], "")),
    photoRole: stringValue(pick(row, ["photoRole", "photo_role"], "gallery"), "gallery"),
    sortOrder: numberValue(pick(row, ["sortOrder", "sort_order"], 100), 100),
    isPrimary: Boolean(row.isPrimary ?? row.is_primary),
    storageBackend: stringValue(pick(row, ["storageBackend", "storage_backend"], "file"), "file"),
    storageBucket: stringValue(pick(row, ["storageBucket", "storage_bucket"], "product-photos"), "product-photos"),
    storageKey: stringValue(pick(row, ["storageKey", "storage_key"], "")),
    storageUri: stringValue(pick(row, ["storageUri", "storage_uri"], "")),
    publicUrl: stringValue(pick(row, ["publicUrl", "public_url"], "")),
    contentUrl: id ? `/api/live/product-photos/${encodeURIComponent(id)}/content` : stringValue(row.contentUrl || row.content_url || ""),
    fileName: stringValue(pick(row, ["fileName", "file_name"], "")),
    mimeType: stringValue(pick(row, ["mimeType", "mime_type"], "")),
    byteSize: numberValue(pick(row, ["byteSize", "byte_size"], 0), 0),
    checksumSha256: stringValue(pick(row, ["checksumSha256", "checksum_sha256"], "")),
    widthPx: row.widthPx ?? row.width_px ?? null,
    heightPx: row.heightPx ?? row.height_px ?? null,
    status: stringValue(row.status, "active")
  };
}

async function verifyProductIdentity({ enterpriseCode, productCode }) {
  const params = new URLSearchParams({ limit: "1", offset: "0", enterpriseCode, productCode });
  const attempts = [
    `${SQL_API_BASE}/one-c-mirror/products?${params.toString()}`,
    `${SQL_API_BASE}/products?${params.toString()}`
  ];
  const warnings = [];
  for (const url of attempts) {
    try {
      const payload = await fetchJson(url);
      const rows = unwrapRows(payload).map(normalizeProduct);
      const found = rows.find((row) => {
        const rowProductCode = stringValue(pick(row, ["productCode", "product_code", "id", "code", "internalCode"], ""));
        const rowEnterpriseCode = stringValue(pick(row, ["enterpriseCode", "enterprise_code"], enterpriseCode), enterpriseCode);
        return rowProductCode === productCode && rowEnterpriseCode === enterpriseCode;
      });
      if (found) return found;
    } catch (error) {
      warnings.push({ code: "PRODUCT_PHOTO_PRODUCT_VERIFY_FAILED", upstream: url.replace(/\?.*$/, ""), message: error.message });
    }
  }
  const error = productPhotoError("Product was not found by enterpriseCode + productCode.", "PRODUCT_PHOTO_PRODUCT_NOT_FOUND", 400);
  error.warnings = warnings;
  throw error;
}

async function listProductPhotosFromSql({ enterpriseCode = "", productCode = "", photoId = "", search = "", limit = 50, offset = 0 } = {}) {
  const params = new URLSearchParams({ limit: String(limit), offset: String(offset) });
  if (enterpriseCode) params.set("enterpriseCode", enterpriseCode);
  if (productCode) params.set("productCode", productCode);
  if (photoId) params.set("photoId", photoId);
  if (search) params.set("search", search);
  const url = `${SQL_API_BASE}/one-c-mirror/product-photos?${params.toString()}`;
  const payload = await fetchJson(url);
  const rows = unwrapRows(payload).map(normalizePhotoMetadata);
  return {
    rows,
    total: payloadTotal(payload, rows),
    hasMore: payloadHasMore(payload),
    nextOffset: payloadNextOffset(payload),
    nextCursor: payloadNextCursor(payload),
    upstream: url.replace(/\?.*$/, "")
  };
}

async function writeProductPhotoMetadataToSql(metadata) {
  const payload = await postJson(`${SQL_API_BASE}/one-c-mirror/product-photos`, metadata);
  return unwrapRows(payload).map(normalizePhotoMetadata);
}

async function storeProductPhotoFile({ enterpriseCode, productCode, fileName, mimeType, content }) {
  if (!mimeType.startsWith("image/")) {
    throw productPhotoError("Only image/* files are accepted.", "PRODUCT_PHOTO_MIME_INVALID", 400);
  }
  if (!content.length || content.length > MAX_PRODUCT_PHOTO_UPLOAD_BYTES) {
    throw productPhotoError("Image file is empty or exceeds the configured size limit.", "PRODUCT_PHOTO_SIZE_INVALID", 413);
  }
  const checksumSha256 = crypto.createHash("sha256").update(content).digest("hex");
  const extension = productPhotoExtension(mimeType, fileName);
  const storageKey = `${safePathSegment(enterpriseCode)}/${safePathSegment(productCode)}/${checksumSha256}${extension}`;
  const filePath = path.resolve(PRODUCT_PHOTO_MEDIA_ROOT, ...storageKey.split("/"));
  if (!filePath.startsWith(`${PRODUCT_PHOTO_MEDIA_ROOT}${path.sep}`)) {
    throw productPhotoError("Resolved product photo path is outside the media root.", "PRODUCT_PHOTO_STORAGE_PATH_INVALID", 400);
  }
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, content);
  const dimensions = imageDimensions(content, mimeType);
  return {
    checksumSha256,
    storageKey,
    storageUri: `crm-media://product-photos/${storageKey}`,
    fileName: path.basename(fileName || `${checksumSha256}${extension}`),
    mimeType,
    byteSize: content.length,
    widthPx: dimensions.width,
    heightPx: dimensions.height
  };
}

async function handleProductPhotoList(reqUrl, res) {
  const search = String(reqUrl.searchParams.get("search") || "").trim();
  const enterpriseCode = String(reqUrl.searchParams.get("enterpriseCode") || "").trim();
  const productCode = String(reqUrl.searchParams.get("productCode") || "").trim();
  const limit = clampInt(reqUrl.searchParams.get("limit"), 50, 1, 100);
  const offset = clampInt(reqUrl.searchParams.get("offset"), 0, 0, 100000);
  if (!productCode && !search) {
    return sendJson(res, 400, pagedEnvelope({
      ok: false,
      data: [],
      limit,
      offset,
      total: 0,
      code: "PRODUCT_PHOTO_PRODUCT_OR_SEARCH_REQUIRED",
      error: "productCode or search is required for product photo queries."
    }));
  }
  try {
    const result = await listProductPhotosFromSql({ enterpriseCode, productCode, search, limit, offset });
    const payload = pagedEnvelope({
      ok: true,
      source: "crm_sql_core_product_photos",
      data: result.rows,
      limit,
      offset,
      total: result.total,
      hasMore: result.hasMore,
      nextOffset: result.nextOffset,
      nextCursor: result.nextCursor,
      upstream: result.upstream,
      productCode,
      enterpriseCode
    });
    payload.rows = payload.data;
    return sendJson(res, 200, payload);
  } catch (error) {
    return sendJson(res, error.statusCode || 502, pagedEnvelope({
      ok: false,
      data: [],
      limit,
      offset,
      total: 0,
      code: error.code || "PRODUCT_PHOTO_SQL_READ_FAILED",
      error: error.message
    }));
  }
}

async function persistProductPhoto({ enterpriseCode, productCode, photoRole, sortOrder, isPrimary, sourceSystem = "crm", externalId = "", fileName, mimeType, content, metadata = {} }) {
  const product = await verifyProductIdentity({ enterpriseCode, productCode });
  const stored = await storeProductPhotoFile({ enterpriseCode, productCode, fileName, mimeType, content });
  const rows = await writeProductPhotoMetadataToSql({
    enterpriseCode,
    productCode,
    productName: product.productName || product.name || "",
    sourceModule: "marketplace",
    sourceSystem,
    externalId,
    photoRole: isPrimary ? "primary" : photoRole || "gallery",
    sortOrder,
    isPrimary,
    storageBackend: "file",
    storageBucket: "product-photos",
    storageKey: stored.storageKey,
    storageUri: stored.storageUri,
    fileName: stored.fileName,
    mimeType: stored.mimeType,
    byteSize: stored.byteSize,
    checksumSha256: stored.checksumSha256,
    widthPx: stored.widthPx,
    heightPx: stored.heightPx,
    metadata
  });
  return rows[0] || normalizePhotoMetadata({ ...stored, enterpriseCode, productCode, photoRole, sortOrder, isPrimary });
}

async function handleProductPhotoUpload(req, res) {
  try {
    const { fields, files } = await readMultipartForm(req);
    const file = files.find((item) => item.fieldName === "file") || files[0];
    if (!file) throw productPhotoError("Photo file is missing.", "PRODUCT_PHOTO_FILE_REQUIRED", 400);
    const enterpriseCode = cleanRequiredText(fields.enterpriseCode, "enterpriseCode");
    const productCode = cleanRequiredText(fields.productCode, "productCode");
    const sortOrder = clampInt(fields.sortOrder, 100, 0, 100000);
    const isPrimary = truthyInput(fields.isPrimary);
    const photo = await persistProductPhoto({
      enterpriseCode,
      productCode,
      photoRole: String(fields.photoRole || (isPrimary ? "primary" : "gallery")).trim(),
      sortOrder,
      isPrimary,
      sourceSystem: String(fields.sourceSystem || "manual_upload").trim(),
      externalId: String(fields.externalId || "").trim(),
      fileName: file.fileName,
      mimeType: file.mimeType,
      content: file.content,
      metadata: { uploadSource: "marketplace-crm-live" }
    });
    return sendJson(res, 201, { ok: true, data: [photo], rows: [photo], count: 1 });
  } catch (error) {
    return sendJson(res, error.statusCode || 500, {
      ok: false,
      code: error.code || "PRODUCT_PHOTO_UPLOAD_FAILED",
      error: error.message,
      warnings: error.warnings || []
    });
  }
}

async function handleProductPhotoImportUrl(req, res) {
  try {
    const payload = await readJsonBody(req, { maxBytes: 64 * 1024, codePrefix: "PRODUCT_PHOTO_IMPORT" });
    const enterpriseCode = cleanRequiredText(payload.enterpriseCode, "enterpriseCode");
    const productCode = cleanRequiredText(payload.productCode, "productCode");
    const sourceUrl = cleanRequiredText(payload.sourceUrl, "sourceUrl");
    if (!/^https?:\/\//i.test(sourceUrl)) throw productPhotoError("sourceUrl must be HTTP(S).", "PRODUCT_PHOTO_SOURCE_URL_INVALID", 400);
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 20000);
    try {
      const response = await fetch(sourceUrl, { signal: controller.signal, headers: { accept: "image/*" } });
      if (!response.ok) throw productPhotoError(`Source image returned HTTP ${response.status}.`, "PRODUCT_PHOTO_SOURCE_FETCH_FAILED", 502);
      const mimeType = String(response.headers.get("content-type") || "").split(";")[0].trim().toLowerCase();
      if (!mimeType.startsWith("image/")) throw productPhotoError("Source URL did not return image/*.", "PRODUCT_PHOTO_SOURCE_MIME_INVALID", 400);
      const content = Buffer.from(await response.arrayBuffer());
      const sourceName = path.basename(new URL(sourceUrl).pathname) || "imported-product-photo";
      const photo = await persistProductPhoto({
        enterpriseCode,
        productCode,
        photoRole: String(payload.photoRole || (truthyInput(payload.isPrimary) ? "primary" : "gallery")).trim(),
        sortOrder: clampInt(payload.sortOrder, 100, 0, 100000),
        isPrimary: truthyInput(payload.isPrimary),
        sourceSystem: String(payload.sourceSystem || "import_url").trim(),
        externalId: String(payload.externalId || "").trim(),
        fileName: sourceName,
        mimeType,
        content,
        metadata: { sourceUrl, importSource: "marketplace-crm-live" }
      });
      return sendJson(res, 201, { ok: true, data: [photo], rows: [photo], count: 1 });
    } finally {
      clearTimeout(timeout);
    }
  } catch (error) {
    return sendJson(res, error.statusCode || 500, {
      ok: false,
      code: error.code || "PRODUCT_PHOTO_IMPORT_URL_FAILED",
      error: error.message,
      warnings: error.warnings || []
    });
  }
}

async function handleProductPhotoContent(reqUrl, res) {
  try {
    const match = reqUrl.pathname.match(/^\/api\/live\/product-photos\/([^/]+)\/content$/);
    const photoId = decodeURIComponent(match?.[1] || "");
    if (!photoId) throw productPhotoError("photoId is required.", "PRODUCT_PHOTO_ID_REQUIRED", 400);
    const result = await listProductPhotosFromSql({ photoId, limit: 1, offset: 0 });
    const photo = result.rows[0];
    if (!photo) throw productPhotoError("Product photo was not found.", "PRODUCT_PHOTO_NOT_FOUND", 404);
    if (photo.storageBackend !== "file") {
      if (photo.publicUrl) {
        res.writeHead(302, { location: photo.publicUrl, "cache-control": "no-store" });
        return res.end();
      }
      throw productPhotoError("Product photo is not stored in file backend and has no public URL.", "PRODUCT_PHOTO_CONTENT_UNAVAILABLE", 404);
    }
    const filePath = path.resolve(PRODUCT_PHOTO_MEDIA_ROOT, ...String(photo.storageKey || "").split("/"));
    if (!filePath.startsWith(`${PRODUCT_PHOTO_MEDIA_ROOT}${path.sep}`)) {
      throw productPhotoError("Resolved product photo path is outside the media root.", "PRODUCT_PHOTO_STORAGE_PATH_INVALID", 400);
    }
    const data = await fs.readFile(filePath);
    res.writeHead(200, {
      "content-type": photo.mimeType || "application/octet-stream",
      "cache-control": "private, max-age=300",
      "content-length": data.length
    });
    return res.end(data);
  } catch (error) {
    return sendJson(res, error.statusCode || 500, {
      ok: false,
      code: error.code || "PRODUCT_PHOTO_CONTENT_FAILED",
      error: error.message
    });
  }
}

async function handleLiveProducts(reqUrl, res) {
  const search = String(reqUrl.searchParams.get("search") || "").trim();
  const limit = clampInt(reqUrl.searchParams.get("limit"), 20, 1, 100);
  const offset = clampInt(reqUrl.searchParams.get("offset"), 0, 0, 100000);
  const warehouseCode = String(reqUrl.searchParams.get("warehouseCode") || reqUrl.searchParams.get("warehouseId") || "").trim();
  const inStock = ["1", "true", "yes"].includes(String(reqUrl.searchParams.get("inStock") || reqUrl.searchParams.get("positiveOnly") || "").toLowerCase());
  if (warehouseCode || inStock) {
    const result = await readLiveProductsInStock({ search, limit, offset, warehouseCode });
    const payload = pagedEnvelope({
      ok: result.ok,
      data: result.rows,
      limit,
      offset,
      total: result.total,
      warnings: result.warnings,
      model: "products",
      upstream: result.upstream || "",
      search,
      warehouseCode,
      inStock: true,
      code: result.ok ? "" : result.code,
      error: result.error || ""
    });
    payload.products = payload.data;
    payload.rows = payload.data;
    return sendJson(res, result.ok ? 200 : 502, payload);
  }
  const upstreamLimit = search ? Math.min(Math.max(limit * 4, 40), 100) : limit;
  const params = new URLSearchParams({ limit: String(upstreamLimit), offset: String(offset) });
  if (search) params.set("search", search);

  const attempts = [
    `${SQL_API_BASE}/products?${params.toString()}`,
    `${SQL_API_BASE}/one-c-mirror/products?${params.toString()}`
  ];
  const warnings = [];
  for (const url of attempts) {
    try {
      const upstreamPayload = await fetchJson(url);
      let rows = unwrapRows(upstreamPayload);
      if (search) {
        const words = search.toLowerCase().split(/\s+/).filter(Boolean);
        rows = rows.filter((row) => words.every((word) => searchText(row).includes(word)));
      }
      const products = rows.map(normalizeProduct).filter((product) => product.id).slice(0, limit);
      const payload = pagedEnvelope({
        ok: true,
        source: "crm_sql_live",
        data: products,
        upstream: url.replace(/\?.*$/, ""),
        search,
        limit,
        offset,
        total: payloadTotal(upstreamPayload, products),
        warnings,
        model: "products"
      });
      payload.products = payload.data;
      payload.rows = payload.data;
      return sendJson(res, 200, payload);
    } catch (error) {
      warnings.push({ code: "CRM_SQL_LIVE_PRODUCTS_UPSTREAM_FAILED", upstream: url.replace(/\?.*$/, ""), message: error.message });
    }
  }
  return sendJson(res, 502, pagedEnvelope({
    ok: false,
    data: [],
    limit,
    offset,
    total: 0,
    code: "CRM_SQL_LIVE_PRODUCTS_FAILED",
    error: "Live SQL products endpoint is unavailable.",
    warnings
  }));
}

function liveModelParams(reqUrl) {
  const search = String(reqUrl.searchParams.get("search") || "").trim();
  const limit = clampInt(reqUrl.searchParams.get("limit"), 20, 1, 100);
  const offset = clampInt(reqUrl.searchParams.get("offset"), 0, 0, 100000);
  const params = new URLSearchParams({ limit: String(limit), offset: String(offset) });
  if (search) params.set("search", search);
  for (const key of ["sort", "productCode", "productId", "warehouseCode", "warehouseId", "counterpartyCode", "inStock", "positiveOnly"]) {
    const value = String(reqUrl.searchParams.get(key) || "").trim();
    if (value) params.set(key, value);
  }
  return { search, limit, offset, params };
}

function rowMatchesFilters(row, { productCode = "", warehouseCode = "", counterpartyCode = "", positiveOnly = false } = {}) {
  const normalizedProductCode = normalizedFilterValue(productCode);
  if (normalizedProductCode) {
    const values = [
      productCodeFromRow(row),
      row.productId,
      row.product_id,
      row.productCrmId,
      row.product_crm_id,
      row.internalCode,
      row.internal_code,
      row.sku,
      row.article,
      row.code,
      row.barcode
    ].map(normalizedFilterValue);
    if (!values.includes(normalizedProductCode)) return false;
  }
  const normalizedWarehouseCode = normalizedFilterValue(warehouseCode);
  if (normalizedWarehouseCode) {
    const values = [warehouseCodeFromRow(row), row.warehouseId, row.warehouse_id, row.code].map(normalizedFilterValue);
    if (!values.includes(normalizedWarehouseCode)) return false;
  }
  const normalizedCounterpartyCode = normalizedFilterValue(counterpartyCode);
  if (normalizedCounterpartyCode) {
    const values = [row.counterpartyCode, row.counterparty_code, row.clientId, row.client_id, row.customerId, row.customer_id, row.id, row.code].map(normalizedFilterValue);
    if (!values.includes(normalizedCounterpartyCode)) return false;
  }
  if (positiveOnly) {
    const qty = numberValue(pick(row, ["availableQuantity", "available_quantity", "availableQty", "available_qty", "qty", "quantity", "balance"], 0), 0);
    if (qty <= 0) return false;
  }
  return true;
}

function normalizedFilterValue(value) {
  return String(value ?? "").trim().toLowerCase();
}

function normalizeRows(modelName, rows) {
  if (modelName === "products") return rows.map(normalizeProduct).filter((row) => row.id);
  if (modelName === "warehouses") return rows.map(normalizeWarehouse).filter((row) => row.id || row.code);
  if (modelName === "stockBalances") return rows.map(normalizeStockBalance).filter((row) => row.productCode || row.productId);
  if (modelName === "serialStock") return rows.map(normalizeSerialStock).filter((row) => row.productCode && row.serial);
  if (modelName === "serialStockSummary") return rows.map(normalizeSerialStockSummary).filter((row) => row.productCode);
  return rows;
}

async function readLiveModel(modelName, { search = "", limit = 20, offset = 0, filters = {} } = {}) {
  const attempts = LIVE_MODEL_ATTEMPTS[modelName] || [];
  const params = new URLSearchParams({ limit: String(limit), offset: String(offset) });
  if (search) params.set("search", search);
  for (const [key, value] of Object.entries(filters || {})) {
    if (value !== undefined && value !== null && String(value).trim() !== "") params.set(key, String(value).trim());
  }
  const warnings = [];
  for (const pathName of attempts) {
    const url = `${SQL_API_BASE}${pathName}?${params.toString()}`;
    try {
      const payload = await fetchJson(url);
      let rows = unwrapRows(payload);
      if (search) {
        const words = search.toLowerCase().split(/\s+/).filter(Boolean);
        rows = rows.filter((row) => words.every((word) => searchText(row).includes(word)));
      }
      rows = rows.filter((row) => rowMatchesFilters(row, filters));
      rows = normalizeRows(modelName, rows).slice(0, limit);
      const upstreamHasMore = payloadHasMore(payload);
      let total = payloadTotal(payload, rows);
      if (total !== null && total < offset + rows.length) {
        total = upstreamHasMore ? null : offset + rows.length;
      }
      return {
        ok: true,
        model: modelName,
        source: "crm_sql_live",
        upstream: url.replace(/\?.*$/, ""),
        search,
        limit,
        offset,
        count: rows.length,
        total,
        hasMore: upstreamHasMore,
        nextOffset: payloadNextOffset(payload),
        nextCursor: payloadNextCursor(payload),
        rows,
        warnings
      };
    } catch (error) {
      warnings.push({ code: "CRM_SQL_LIVE_MODEL_UPSTREAM_FAILED", model: modelName, upstream: url.replace(/\?.*$/, ""), message: error.message });
    }
  }
  return {
    ok: false,
    model: modelName,
    source: "crm_sql_live",
    code: "CRM_SQL_LIVE_MODEL_UNAVAILABLE",
    error: `Live SQL model endpoint is unavailable: ${modelName}`,
    search,
    limit,
    offset,
    count: 0,
    total: 0,
    rows: [],
    warnings
  };
}

async function handleLiveModel(modelName, reqUrl, res) {
  const options = liveModelParams(reqUrl);
  const filters = {
    productCode: reqUrl.searchParams.get("productCode") || reqUrl.searchParams.get("productId") || "",
    warehouseCode: reqUrl.searchParams.get("warehouseCode") || reqUrl.searchParams.get("warehouseId") || "",
    counterpartyCode: reqUrl.searchParams.get("counterpartyCode") || reqUrl.searchParams.get("counterpartyId") || "",
    positiveOnly: ["1", "true", "yes"].includes(String(reqUrl.searchParams.get("positiveOnly") || reqUrl.searchParams.get("inStock") || "").toLowerCase())
  };
  const result = await readLiveModel(modelName, { ...options, filters });
  const payload = pagedEnvelope({
    ok: result.ok,
    data: result.rows,
    limit: options.limit,
    offset: options.offset,
    total: result.total,
    hasMore: result.hasMore,
    nextOffset: result.nextOffset,
    nextCursor: result.nextCursor,
    warnings: result.warnings,
    model: modelName,
    upstream: result.upstream || "",
    search: options.search,
    code: result.ok ? "" : result.code,
    error: result.error || ""
  });
  payload.rows = payload.data;
  if (modelName === "warehouses") payload.warehouses = payload.data;
  if (modelName === "stockBalances") payload.stockBalances = payload.data;
  if (modelName === "counterpartyBalances") payload.counterpartyBalances = payload.data;
  if (modelName === "serialStock") payload.serialStock = payload.data;
  if (modelName === "serialStockSummary") payload.serialStockSummary = payload.data;
  return sendJson(res, result.ok ? 200 : 502, payload);
}

async function handleLiveSerialStock(reqUrl, res) {
  const productCode = String(reqUrl.searchParams.get("productCode") || reqUrl.searchParams.get("productId") || "").trim();
  if (!productCode) {
    return sendJson(res, 400, pagedEnvelope({
      ok: false,
      data: [],
      limit: clampInt(reqUrl.searchParams.get("limit"), 20, 1, 100),
      offset: clampInt(reqUrl.searchParams.get("offset"), 0, 0, 100000),
      total: 0,
      hasMore: false,
      nextOffset: null,
      nextCursor: null,
      code: "SERIAL_PRODUCT_REQUIRED",
      error: "productCode is required for serial stock lookup."
    }));
  }
  return await handleLiveModel("serialStock", reqUrl, res);
}

async function handleLiveSerialStockSummary(reqUrl, res) {
  const productCode = String(reqUrl.searchParams.get("productCode") || reqUrl.searchParams.get("productId") || "").trim();
  if (!productCode) {
    return sendJson(res, 400, pagedEnvelope({
      ok: false,
      data: [],
      limit: clampInt(reqUrl.searchParams.get("limit"), 20, 1, 100),
      offset: clampInt(reqUrl.searchParams.get("offset"), 0, 0, 100000),
      total: 0,
      hasMore: false,
      nextOffset: null,
      nextCursor: null,
      code: "SERIAL_PRODUCT_REQUIRED",
      error: "productCode is required for serial stock summary lookup."
    }));
  }
  return await handleLiveModel("serialStockSummary", reqUrl, res);
}

async function readLiveProductsInStock({ search = "", limit = 20, offset = 0, warehouseCode = "" } = {}) {
  const result = await readLiveModel("stockBalances", {
    search,
    limit,
    offset,
    filters: { warehouseCode, positiveOnly: true }
  });
  const productsById = new Map();
  for (const row of result.rows || []) {
    const product = normalizeProductFromStock(row);
    const key = product.id || product.productCode || product.internalCode;
    if (!key) continue;
    const existing = productsById.get(key);
    if (existing) {
      existing.selectedWarehouseAvailableQuantity += product.selectedWarehouseAvailableQuantity || product.availableQuantity || 0;
      existing.availableQuantity = existing.selectedWarehouseAvailableQuantity;
      existing.totalQuantity += product.totalQuantity || 0;
    } else {
      productsById.set(key, product);
    }
  }
  return {
    ...result,
    rows: [...productsById.values()].slice(0, limit),
    total: result.total
  };
}

async function handleCrmSqlLiveDiagnostics(reqUrl, res) {
  const limit = clampInt(reqUrl.searchParams.get("limit"), 1, 1, 5);
  const modelNames = ["products", "customers", "warehouses", "stockBalances", "counterpartyBalances"];
  const entries = await Promise.all(modelNames.map(async (modelName) => {
    const result = await readLiveModel(modelName, { limit, offset: 0 });
    return [modelName, {
      ok: result.ok,
      code: result.ok ? "" : result.code,
      upstream: result.upstream || "",
      count: result.count,
      total: result.total,
      warnings: result.warnings
    }];
  }));
  const models = Object.fromEntries(entries);
  const unavailable = Object.entries(models).filter(([, item]) => !item.ok).map(([modelName]) => modelName);
  return sendJson(res, 200, {
    ok: true,
    source: "crm_sql_live",
    architecture: "postgresql_live_source_of_truth_backend_api",
    noFullImport: true,
    sqlApiBase: SQL_API_BASE,
    generatedAt: new Date().toISOString(),
    partial: unavailable.length > 0,
    errorCode: unavailable.length ? "CRM_SQL_LIVE_MODELS_PARTIAL" : "",
    unavailable,
    models
  });
}

const stockRefreshJobs = new Map();
const stockRefreshState = {
  status: "idle",
  runningJobId: "",
  updatedAt: "",
  lastStartedAt: "",
  lastCompletedAt: "",
  lastError: "",
  lastJob: null,
  snapshot: {
    generatedAt: "",
    rowCount: 0,
    productCount: 0,
    warehouseCount: 0,
    productCodes: new Set(),
    warehouseCodes: new Set(),
    productWarehouses: new Map(),
    productTotals: new Map()
  }
};

function stockRefreshPublicJob(job) {
  return {
    ok: job.status !== "error",
    id: job.id,
    status: job.status,
    reason: job.reason || "",
    percent: job.percent,
    count: job.count,
    pages: job.pages || 0,
    total: job.total ?? null,
    code: job.code || "",
    message: job.message || "",
    startedAt: job.startedAt,
    updatedAt: job.updatedAt,
    completedAt: job.completedAt || "",
    latencyMs: job.latencyMs ?? null,
    summary: job.summary || null
  };
}

function stockRefreshPublicStatus() {
  const snapshot = stockRefreshState.snapshot || {};
  const ageMs = snapshot.generatedAt ? Date.now() - new Date(snapshot.generatedAt).getTime() : null;
  return {
    ok: stockRefreshState.status !== "error",
    status: stockRefreshState.status,
    runningJobId: stockRefreshState.runningJobId,
    updatedAt: stockRefreshState.updatedAt,
    lastStartedAt: stockRefreshState.lastStartedAt,
    lastCompletedAt: stockRefreshState.lastCompletedAt,
    lastError: stockRefreshState.lastError,
    stale: ageMs === null || ageMs > STOCK_REFRESH_STALE_MS,
    ageMs,
    intervalMs: STOCK_REFRESH_INTERVAL_MS,
    pageLimit: STOCK_REFRESH_PAGE_LIMIT,
    snapshot: {
      generatedAt: snapshot.generatedAt || "",
      rowCount: snapshot.rowCount || 0,
      productCount: snapshot.productCount || 0,
      warehouseCount: snapshot.warehouseCount || 0
    },
    lastJob: stockRefreshState.lastJob ? stockRefreshPublicJob(stockRefreshState.lastJob) : null
  };
}

function cleanupStockRefreshJobs() {
  const cutoff = Date.now() - EXCHANGE_JOB_TTL_MS;
  for (const [id, job] of stockRefreshJobs.entries()) {
    if (new Date(job.updatedAt || job.startedAt || 0).getTime() < cutoff) stockRefreshJobs.delete(id);
  }
}

function stockKeyPart(value, fallback = "*") {
  const text = String(value ?? "").trim().toLowerCase();
  return text || fallback;
}

function stockProductKeys({ enterpriseCode = "", productCode = "" } = {}) {
  const product = stockKeyPart(productCode, "");
  if (!product) return [];
  const enterprise = stockKeyPart(enterpriseCode, "");
  const keys = enterprise ? [`${enterprise}::${product}`, `*::${product}`] : [`*::${product}`];
  return [...new Set(keys)];
}

function normalizeStockQuantity(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function emptyStockSnapshot() {
  return {
    generatedAt: new Date().toISOString(),
    rowCount: 0,
    productCount: 0,
    warehouseCount: 0,
    productCodes: new Set(),
    warehouseCodes: new Set(),
    productWarehouses: new Map(),
    productTotals: new Map()
  };
}

function addStockSnapshotRow(snapshot, row) {
  const productCode = stringValue(row.productCode || row.productId || "");
  if (!productCode) return;
  const enterpriseCode = stringValue(row.enterpriseCode || "");
  const warehouseCode = stringValue(row.warehouseCode || row.warehouseId || "");
  const warehouseName = stringValue(row.warehouseName || row.warehouse || "", warehouseCode);
  const quantity = normalizeStockQuantity(row.quantity ?? row.qty);
  const availableQuantity = normalizeStockQuantity(row.availableQuantity ?? row.availableQty ?? quantity);
  const productName = stringValue(row.productName || row.name || "", productCode);
  const keys = stockProductKeys({ enterpriseCode, productCode });
  snapshot.rowCount += 1;
  snapshot.productCodes.add(stockKeyPart(productCode, productCode));
  snapshot.warehouseCodes.add(stockKeyPart(warehouseCode, "unknown"));
  for (const productKey of keys) {
    if (!snapshot.productWarehouses.has(productKey)) snapshot.productWarehouses.set(productKey, new Map());
    const byWarehouse = snapshot.productWarehouses.get(productKey);
    const warehouseKey = stockKeyPart(warehouseCode, "unknown");
    const warehouse = byWarehouse.get(warehouseKey) || {
      productCode,
      enterpriseCode,
      productName,
      warehouseCode,
      warehouseName,
      quantity: 0,
      availableQuantity: 0,
      rowCount: 0
    };
    warehouse.quantity += quantity;
    warehouse.availableQuantity += availableQuantity;
    warehouse.rowCount += 1;
    if (!warehouse.warehouseName && warehouseName) warehouse.warehouseName = warehouseName;
    byWarehouse.set(warehouseKey, warehouse);
    const total = snapshot.productTotals.get(productKey) || {
      productCode,
      enterpriseCode,
      productName,
      quantity: 0,
      availableQuantity: 0,
      warehouseCount: 0,
      rowCount: 0
    };
    total.quantity += quantity;
    total.availableQuantity += availableQuantity;
    total.rowCount += 1;
    total.warehouseCount = byWarehouse.size;
    snapshot.productTotals.set(productKey, total);
  }
}

function finalizeStockSnapshot(snapshot) {
  const warehouses = new Set();
  for (const byWarehouse of snapshot.productWarehouses.values()) {
    for (const [warehouseKey] of byWarehouse.entries()) warehouses.add(warehouseKey);
  }
  snapshot.productCount = snapshot.productCodes.size;
  snapshot.warehouseCount = snapshot.warehouseCodes.size || warehouses.size;
  snapshot.generatedAt = new Date().toISOString();
  return snapshot;
}

async function readStockRefreshPage(offset) {
  const result = await readLiveModel("stockBalances", { limit: STOCK_REFRESH_PAGE_LIMIT, offset });
  if (!result.ok) {
    const error = new Error(result.error || "Live stock-balances read model is unavailable.");
    error.code = result.code || "STOCK_REFRESH_SQL_READ_FAILED";
    throw error;
  }
  return result;
}

async function runStockRefreshJob(job) {
  const startedMs = Date.now();
  const snapshot = emptyStockSnapshot();
  job.status = "running";
  job.percent = 1;
  job.updatedAt = new Date().toISOString();
  stockRefreshState.status = "running";
  stockRefreshState.runningJobId = job.id;
  stockRefreshState.lastStartedAt = job.startedAt;
  stockRefreshState.updatedAt = job.updatedAt;
  stockRefreshState.lastError = "";
  try {
    const applyResult = (result, completedPages, totalPages) => {
      result.rows.forEach((row) => addStockSnapshotRow(snapshot, row));
      job.pages = completedPages;
      job.count = snapshot.rowCount;
      job.total = result.total;
      job.updatedAt = new Date().toISOString();
      job.percent = result.total
        ? Math.min(95, Math.max(1, Math.round((completedPages / Math.max(totalPages, 1)) * 95)))
        : Math.min(95, Math.max(1, Math.round((completedPages / STOCK_REFRESH_MAX_PAGES) * 95)));
      stockRefreshState.updatedAt = job.updatedAt;
    };
    const first = await readStockRefreshPage(0);
    const hasMore = first.hasMore === null || first.hasMore === undefined
      ? first.rows.length >= STOCK_REFRESH_PAGE_LIMIT
      : Boolean(first.hasMore);
    const total = Number(first.total || 0);
    const knownTotalPages = total > 0 ? Math.min(STOCK_REFRESH_MAX_PAGES, Math.ceil(total / STOCK_REFRESH_PAGE_LIMIT)) : 1;
    applyResult(first, 1, knownTotalPages);
    if (hasMore && total > STOCK_REFRESH_PAGE_LIMIT) {
      const offsets = [];
      for (let nextOffset = Number(first.nextOffset || STOCK_REFRESH_PAGE_LIMIT); nextOffset < total && offsets.length + 1 < STOCK_REFRESH_MAX_PAGES; nextOffset += STOCK_REFRESH_PAGE_LIMIT) {
        offsets.push(nextOffset);
      }
      let completedPages = 1;
      for (let index = 0; index < offsets.length; index += STOCK_REFRESH_CONCURRENCY) {
        const chunk = offsets.slice(index, index + STOCK_REFRESH_CONCURRENCY);
        const results = await Promise.all(chunk.map((pageOffset) => readStockRefreshPage(pageOffset)));
        for (const result of results) {
          completedPages += 1;
          applyResult(result, completedPages, knownTotalPages);
        }
      }
    } else if (hasMore) {
      let offset = Number(first.nextOffset || STOCK_REFRESH_PAGE_LIMIT);
      for (let page = 1; page < STOCK_REFRESH_MAX_PAGES; page += 1) {
        const result = await readStockRefreshPage(offset);
        applyResult(result, page + 1, STOCK_REFRESH_MAX_PAGES);
        const resultHasMore = result.hasMore === null || result.hasMore === undefined
        ? result.rows.length >= STOCK_REFRESH_PAGE_LIMIT
        : Boolean(result.hasMore);
        if (!resultHasMore || !result.rows.length) break;
        offset = Number.isFinite(Number(result.nextOffset)) ? Number(result.nextOffset) : offset + STOCK_REFRESH_PAGE_LIMIT;
      }
    }
    finalizeStockSnapshot(snapshot);
    job.status = "success";
    job.percent = 100;
    job.completedAt = new Date().toISOString();
    job.updatedAt = job.completedAt;
    job.latencyMs = Date.now() - startedMs;
    job.summary = {
      rowCount: snapshot.rowCount,
      productCount: snapshot.productCount,
      warehouseCount: snapshot.warehouseCount,
      generatedAt: snapshot.generatedAt
    };
    job.message = `Stock refresh completed: ${snapshot.rowCount} rows.`;
    stockRefreshState.snapshot = snapshot;
    stockRefreshState.status = "success";
    stockRefreshState.runningJobId = "";
    stockRefreshState.lastCompletedAt = job.completedAt;
    stockRefreshState.updatedAt = job.updatedAt;
    stockRefreshState.lastJob = job;
  } catch (error) {
    job.status = "error";
    job.percent = 100;
    job.code = error.code || "STOCK_REFRESH_FAILED";
    job.message = error.message;
    job.completedAt = new Date().toISOString();
    job.updatedAt = job.completedAt;
    job.latencyMs = Date.now() - startedMs;
    stockRefreshState.status = "error";
    stockRefreshState.runningJobId = "";
    stockRefreshState.lastError = `[${job.code}] ${job.message}`;
    stockRefreshState.updatedAt = job.updatedAt;
    stockRefreshState.lastJob = job;
  }
}

function createStockRefreshJob(reason = "manual") {
  cleanupStockRefreshJobs();
  if (stockRefreshState.runningJobId) {
    const running = stockRefreshJobs.get(stockRefreshState.runningJobId);
    if (running) return running;
  }
  const now = new Date().toISOString();
  const job = {
    id: `stock-${Date.now()}-${crypto.randomBytes(3).toString("hex")}`,
    reason,
    status: "queued",
    percent: 0,
    count: 0,
    pages: 0,
    total: null,
    code: "",
    message: "Stock refresh queued.",
    startedAt: now,
    updatedAt: now,
    completedAt: "",
    latencyMs: null,
    summary: null
  };
  stockRefreshJobs.set(job.id, job);
  stockRefreshState.runningJobId = job.id;
  stockRefreshState.status = "queued";
  stockRefreshState.updatedAt = now;
  stockRefreshState.lastStartedAt = now;
  setTimeout(() => runStockRefreshJob(job), 0);
  return job;
}

async function handleCreateStockRefreshJob(req, res) {
  const payload = await readJsonBody(req, { maxBytes: 16 * 1024, codePrefix: "STOCK_REFRESH" }).catch(() => ({}));
  const reason = String(payload.reason || "manual").trim() || "manual";
  const job = createStockRefreshJob(reason);
  return sendJson(res, job.status === "running" || job.status === "queued" ? 202 : 200, {
    ok: job.status !== "error",
    job: stockRefreshPublicJob(job),
    status: stockRefreshPublicStatus()
  });
}

async function handleGetStockRefreshJob(reqUrl, res) {
  cleanupStockRefreshJobs();
  const id = decodeURIComponent(reqUrl.pathname.split("/").pop() || "");
  const job = stockRefreshJobs.get(id);
  if (!job) return sendJson(res, 404, { ok: false, code: "STOCK_REFRESH_JOB_NOT_FOUND", error: "Stock refresh job was not found." });
  return sendJson(res, 200, { ok: job.status !== "error", job: stockRefreshPublicJob(job), status: stockRefreshPublicStatus() });
}

function stockImpactForPublication(item) {
  const productCode = stringValue(item.productCode || item.product_code || "");
  if (!productCode) {
    return {
      id: stringValue(item.id || ""),
      ok: false,
      code: "STOCK_PRODUCT_CODE_REQUIRED",
      message: "productCode is required for stock impact lookup.",
      productCode: ""
    };
  }
  const enterpriseCode = stringValue(item.enterpriseCode || item.enterprise_code || "");
  const warehouseCode = stringValue(item.warehouseCode || item.warehouse_code || item.warehouseId || item.warehouse_id || "");
  const snapshot = stockRefreshState.snapshot || {};
  const keys = stockProductKeys({ enterpriseCode, productCode });
  let total = null;
  let byWarehouse = null;
  for (const key of keys) {
    total = snapshot.productTotals?.get(key);
    byWarehouse = snapshot.productWarehouses?.get(key);
    if (total || byWarehouse) break;
  }
  const warehouses = byWarehouse ? [...byWarehouse.values()]
    .sort((first, second) => second.availableQuantity - first.availableQuantity || String(first.warehouseName).localeCompare(String(second.warehouseName)))
    : [];
  const matchedWarehouse = warehouseCode
    ? warehouses.find((row) => stockKeyPart(row.warehouseCode, "unknown") === stockKeyPart(warehouseCode, "unknown"))
    : null;
  const source = matchedWarehouse || total || { quantity: 0, availableQuantity: 0, rowCount: 0, warehouseCount: 0 };
  const availableQuantity = normalizeStockQuantity(source.availableQuantity);
  const quantity = normalizeStockQuantity(source.quantity);
  const currentStockQty = normalizeStockQuantity(item.currentStockQty ?? item.stockQty ?? 0);
  const changed = currentStockQty !== availableQuantity;
  return {
    id: stringValue(item.id || ""),
    ok: true,
    code: "",
    marketplace: stringValue(item.marketplace || ""),
    sku: stringValue(item.sku || ""),
    productCode,
    enterpriseCode,
    warehouseCode: matchedWarehouse?.warehouseCode || warehouseCode,
    warehouseName: matchedWarehouse?.warehouseName || "",
    availableQuantity,
    quantity,
    currentStockQty,
    changed,
    shouldHideOnline: availableQuantity <= 0,
    shouldPublishOnline: availableQuantity > 0,
    rowCount: source.rowCount || 0,
    warehouseCount: matchedWarehouse ? 1 : (source.warehouseCount || warehouses.length || 0),
    warehouses: warehouses.slice(0, 10).map((row) => ({
      warehouseCode: row.warehouseCode,
      warehouseName: row.warehouseName,
      availableQuantity: row.availableQuantity,
      quantity: row.quantity
    }))
  };
}

async function handleStockPublicationImpact(req, res) {
  const payload = await readJsonBody(req, { maxBytes: 128 * 1024, codePrefix: "STOCK_PUBLICATION_IMPACT" });
  const limit = clampInt(payload.limit, 50, 1, 100);
  const rows = Array.isArray(payload.publications) ? payload.publications.slice(0, limit) : [];
  if (!rows.length) return sendJson(res, 400, { ok: false, code: "STOCK_PUBLICATION_ROWS_REQUIRED", error: "publications array is required.", impacts: [] });
  const status = stockRefreshPublicStatus();
  if (!stockRefreshState.snapshot?.generatedAt) {
    return sendJson(res, 409, {
      ok: false,
      code: "STOCK_REFRESH_SNAPSHOT_EMPTY",
      error: "Run stock refresh before requesting publication impact.",
      impacts: [],
      status
    });
  }
  const impacts = rows.map(stockImpactForPublication);
  return sendJson(res, 200, {
    ok: true,
    source: "crm_sql_live_stock_refresh_snapshot",
    count: impacts.length,
    impacts,
    status: stockRefreshPublicStatus()
  });
}

function startStockRefreshScheduler() {
  if (!STOCK_REFRESH_INTERVAL_MS) return;
  const startScheduled = (reason) => {
    try {
      createStockRefreshJob(reason);
    } catch (error) {
      stockRefreshState.status = "error";
      stockRefreshState.lastError = `[STOCK_REFRESH_SCHEDULER_FAILED] ${error.message}`;
      stockRefreshState.updatedAt = new Date().toISOString();
    }
  };
  setTimeout(() => startScheduled("scheduled_startup"), 5000).unref?.();
  setInterval(() => startScheduled("scheduled_hourly"), STOCK_REFRESH_INTERVAL_MS).unref?.();
}

async function readBody(req) {
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  return Buffer.concat(chunks);
}

async function readJsonBody(req, { maxBytes = 256 * 1024, codePrefix = "CREDENTIAL_PAYLOAD" } = {}) {
  const body = await readBody(req);
  if (body.length > maxBytes) {
    const error = new Error("JSON payload is too large.");
    error.statusCode = 413;
    error.code = `${codePrefix}_TOO_LARGE`;
    throw error;
  }
  if (!body.length) return {};
  try {
    return JSON.parse(body.toString("utf8"));
  } catch (error) {
    const parseError = new Error("Invalid JSON payload.");
    parseError.statusCode = 400;
    parseError.code = `${codePrefix}_INVALID_JSON`;
    throw parseError;
  }
}

function envLineMatchesKey(line, key) {
  return new RegExp(`^\\s*${key.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\s*=`).test(line);
}

async function setEnvFileValues(filePath, values) {
  if (!filePath) return;
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  const existing = await fs.readFile(filePath, "utf8").catch((error) => {
    if (error.code === "ENOENT") return "";
    throw error;
  });
  const lines = existing ? existing.split(/\r?\n/) : [];
  const updated = new Set();
  const next = lines.map((line) => {
    for (const [key, value] of Object.entries(values)) {
      if (envLineMatchesKey(line, key)) {
        updated.add(key);
        return `${key}=${value}`;
      }
    }
    return line;
  });
  for (const [key, value] of Object.entries(values)) {
    if (!updated.has(key)) {
      if (next.length && next[next.length - 1].trim()) next.push("");
      next.push(`${key}=${value}`);
    }
  }
  await fs.writeFile(filePath, next.join("\n").replace(/\n*$/, "\n"), "utf8");
}

function looksLikeCertificateText(value) {
  const text = String(value || "");
  return /-----BEGIN [^-]+-----/.test(text) || /-----END [^-]+-----/.test(text);
}

function validateCertificatePath(value) {
  const text = String(value || "").trim();
  if (!text) return;
  if (looksLikeCertificateText(text) || text.length > 240 || /[\r\n]/.test(text)) {
    const error = new Error("NOVAPAY_CERTIFICATE_PATH must be a short server-side file path. Paste certificate text into NOVAPAY_CERTIFICATE_CONTENT.");
    error.statusCode = 400;
    error.code = "NOVAPAY_CERTIFICATE_PATH_INVALID";
    throw error;
  }
}

async function saveNovaPayCertificateContent(certificateText) {
  const text = String(certificateText || "").trim();
  if (!text) return "";
  if (!looksLikeCertificateText(text)) {
    const error = new Error("NovaPay certificate content does not look like PEM text.");
    error.statusCode = 400;
    error.code = "NOVAPAY_CERTIFICATE_CONTENT_INVALID";
    throw error;
  }
  await fs.mkdir(path.dirname(NOVAPAY_CERTIFICATE_UPLOAD_PATH), { recursive: true });
  await fs.writeFile(NOVAPAY_CERTIFICATE_UPLOAD_PATH, `${text}\n`, "ascii");
  return NOVAPAY_CERTIFICATE_UPLOAD_PATH;
}

function configuredFlag(key) {
  return !String(process.env[key] || "").trim() ? false : true;
}

function credentialStatus(provider) {
  if (provider === "rozetka") {
    return {
      tokenConfigured: configuredFlag("ROZETKA_API_TOKEN"),
      usernameConfigured: configuredFlag("ROZETKA_USERNAME"),
      passwordConfigured: configuredFlag("ROZETKA_PASSWORD"),
      configured: configuredFlag("ROZETKA_API_TOKEN") || (configuredFlag("ROZETKA_USERNAME") && configuredFlag("ROZETKA_PASSWORD"))
    };
  }
  if (provider === "novaPay") {
    return {
      gatewayUrlConfigured: configuredFlag("NOVAPAY_GATEWAY_URL"),
      gatewayTokenConfigured: configuredFlag("NOVAPAY_GATEWAY_TOKEN"),
      businessLoginConfigured: configuredFlag("NOVAPAY_BUSINESS_LOGIN"),
      refreshTokenConfigured: configuredFlag("NOVAPAY_REFRESH_TOKEN"),
      certificatePathConfigured: configuredFlag("NOVAPAY_CERTIFICATE_PATH"),
      clientIdConfigured: configuredFlag("NOVAPAY_CLIENT_ID"),
      accountIdConfigured: configuredFlag("NOVAPAY_ACCOUNT_ID"),
      accountIbanConfigured: configuredFlag("NOVAPAY_ACCOUNT_IBAN"),
      directConfigured: configuredFlag("NOVAPAY_BUSINESS_LOGIN") && configuredFlag("NOVAPAY_REFRESH_TOKEN") && configuredFlag("NOVAPAY_CERTIFICATE_PATH"),
      configured: configuredFlag("NOVAPAY_GATEWAY_URL") || (configuredFlag("NOVAPAY_BUSINESS_LOGIN") && configuredFlag("NOVAPAY_REFRESH_TOKEN") && configuredFlag("NOVAPAY_CERTIFICATE_PATH"))
    };
  }
  if (provider === "novaPoshta") {
    return {
      apiKeyConfigured: configuredFlag("NOVA_POSHTA_API_KEY"),
      configured: configuredFlag("NOVA_POSHTA_API_KEY")
    };
  }
  return {};
}

function normalizeCredentialPayload(payload) {
  const provider = String(payload.provider || "").trim();
  const allowedKeys = CREDENTIAL_PROVIDER_KEYS[provider];
  if (!allowedKeys) {
    const error = new Error("Unknown credential provider.");
    error.statusCode = 400;
    error.code = "CREDENTIAL_PROVIDER_UNKNOWN";
    throw error;
  }
  const source = payload.values && typeof payload.values === "object" ? payload.values : payload;
  const values = {};
  for (const key of allowedKeys) {
    const value = source[key];
    if (value === undefined || value === null) continue;
    const text = String(value).trim();
    if (!text) continue;
    values[key] = text;
  }
  if (values.NOVAPAY_CERTIFICATE_PATH) validateCertificatePath(values.NOVAPAY_CERTIFICATE_PATH);
  if (!Object.keys(values).length) {
    const error = new Error("No credential values were provided.");
    error.statusCode = 400;
    error.code = "CREDENTIAL_VALUES_EMPTY";
    throw error;
  }
  return { provider, values };
}

async function prepareCredentialValues(provider, values) {
  const prepared = { ...values };
  let certificateContentSaved = false;
  if (provider === "novaPay" && prepared.NOVAPAY_CERTIFICATE_CONTENT) {
    const certificatePath = await saveNovaPayCertificateContent(prepared.NOVAPAY_CERTIFICATE_CONTENT);
    delete prepared.NOVAPAY_CERTIFICATE_CONTENT;
    if (certificatePath) {
      prepared.NOVAPAY_CERTIFICATE_PATH = certificatePath;
      certificateContentSaved = true;
    }
  }
  return { values: prepared, certificateContentSaved };
}

async function handleCredentialUpdate(req, res) {
  try {
    const payload = await readJsonBody(req);
    const normalized = normalizeCredentialPayload(payload);
    const prepared = await prepareCredentialValues(normalized.provider, normalized.values);
    const provider = normalized.provider;
    const values = prepared.values;
    await setEnvFileValues(LIVE_ENV_PATH, values);
    await setEnvFileValues(LEGACY_ENV_PATH, values);
    for (const [key, value] of Object.entries(values)) process.env[key] = value;

    let legacyRuntimeUpdated = false;
    let legacyRuntimeCode = "";
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), LEGACY_CREDENTIAL_FORWARD_TIMEOUT_MS);
      const response = await fetch(`${LEGACY_API_BASE}/api/config/credentials`, {
        method: "POST",
        headers: { "content-type": "application/json", accept: "application/json" },
        body: JSON.stringify({ provider, values }),
        signal: controller.signal
      });
      clearTimeout(timeout);
      legacyRuntimeUpdated = response.ok;
      if (!response.ok) legacyRuntimeCode = `HTTP_${response.status}`;
    } catch (error) {
      legacyRuntimeCode = error.name === "AbortError" ? "LEGACY_CREDENTIAL_RUNTIME_UPDATE_TIMEOUT" : "LEGACY_CREDENTIAL_RUNTIME_UPDATE_FAILED";
    }

    return sendJson(res, 200, {
      ok: true,
      provider,
      updatedKeys: Object.keys(values),
      status: credentialStatus(provider),
      certificateContentSaved: prepared.certificateContentSaved,
      persisted: true,
      liveEnvUpdated: true,
      legacyEnvUpdated: true,
      legacyRuntimeUpdated,
      legacyRuntimeCode
    });
  } catch (error) {
    return sendJson(res, error.statusCode || 500, {
      ok: false,
      code: error.code || "CREDENTIAL_UPDATE_FAILED",
      error: error.message
    });
  }
}

async function proxyToLegacy(req, res, reqUrl) {
  const body = req.method === "GET" || req.method === "HEAD" ? undefined : await readBody(req);
  const target = `${LEGACY_API_BASE}${reqUrl.pathname}${reqUrl.search}`;
  const timeoutMs = legacyProxyTimeoutMs(reqUrl);
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(target, {
      method: req.method,
      headers: {
        accept: req.headers.accept || "*/*",
        "content-type": req.headers["content-type"] || "application/json"
      },
      body,
      signal: controller.signal
    });
    const buffer = Buffer.from(await response.arrayBuffer());
    res.writeHead(response.status, {
      "content-type": response.headers.get("content-type") || "application/octet-stream",
      "cache-control": "no-store"
    });
    res.end(buffer);
  } catch (error) {
    const isTimeout = error.name === "AbortError";
    sendJson(res, isTimeout ? 504 : 502, {
      ok: false,
      code: isTimeout ? "LEGACY_API_PROXY_TIMEOUT" : "LEGACY_API_PROXY_FAILED",
      error: isTimeout ? `Legacy gateway did not answer within ${timeoutMs} ms.` : error.message,
      legacyApiBase: LEGACY_API_BASE
    });
  } finally {
    clearTimeout(timeout);
  }
}

async function handleLegacyStatus(res) {
  const target = `${LEGACY_API_BASE}/api/novapay/status`;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), LEGACY_STATUS_TIMEOUT_MS);
  const started = Date.now();
  try {
    const response = await fetch(target, {
      method: "GET",
      headers: { accept: "application/json" },
      signal: controller.signal
    });
    const text = await response.text();
    return sendJson(res, 200, {
      ok: response.ok,
      code: response.ok ? "" : `LEGACY_GATEWAY_HTTP_${response.status}`,
      status: response.status,
      latencyMs: Date.now() - started,
      legacyApiBase: LEGACY_API_BASE,
      sample: text.slice(0, 160)
    });
  } catch (error) {
    const isTimeout = error.name === "AbortError";
    return sendJson(res, 200, {
      ok: false,
      code: isTimeout ? "LEGACY_GATEWAY_TIMEOUT" : "LEGACY_GATEWAY_UNAVAILABLE",
      error: isTimeout ? `Legacy gateway did not answer within ${LEGACY_STATUS_TIMEOUT_MS} ms.` : error.message,
      latencyMs: Date.now() - started,
      legacyApiBase: LEGACY_API_BASE
    });
  } finally {
    clearTimeout(timeout);
  }
}

function legacyProxyTimeoutMs(reqUrl) {
  const quickPaths = new Set([
    "/api/novapay/auth-check",
    "/api/novapay/status",
    "/api/delivery/nova-poshta/diagnostics"
  ]);
  return quickPaths.has(reqUrl.pathname) ? LEGACY_PROXY_QUICK_TIMEOUT_MS : LEGACY_PROXY_LONG_TIMEOUT_MS;
}

function isDisabledLegacyBrowserJob(reqUrl) {
  const pathName = reqUrl.pathname;
  if (pathName.startsWith("/api/rozetka/") && /(\/all$|\/import$)/i.test(pathName)) return true;
  if (pathName === "/api/novapay/payments" && (
    reqUrl.searchParams.get("history") === "all"
    || reqUrl.searchParams.get("includeRegisters") === "true"
    || reqUrl.searchParams.get("includeExtract") === "true"
  )) return true;
  if (pathName === "/api/delivery/nova-poshta/documents" && (
    reqUrl.searchParams.get("history") === "all"
    || Number(reqUrl.searchParams.get("maxPages") || 0) > 10
  )) return true;
  return false;
}

async function serveStatic(reqUrl, res) {
  const rawPath = decodeURIComponent(reqUrl.pathname === "/" ? "/index.html" : reqUrl.pathname);
  const resolved = path.resolve(ROOT, `.${rawPath}`);
  if (!resolved.startsWith(ROOT)) return sendJson(res, 403, { ok: false, error: "Forbidden" });
  const stat = await fs.stat(resolved).catch(() => null);
  if (!stat || !stat.isFile()) return sendJson(res, 404, { ok: false, error: "Not found" });
  const ext = path.extname(resolved).toLowerCase();
  const data = await fs.readFile(resolved);
  res.writeHead(200, {
    "content-type": CONTENT_TYPES.get(ext) || "application/octet-stream",
    "cache-control": ext === ".html" ? "no-store" : "public, max-age=30",
    "content-length": data.length
  });
  res.end(data);
}

const server = http.createServer(async (req, res) => {
  try {
    const reqUrl = new URL(req.url || "/", `http://${req.headers.host || "localhost"}`);
    if (req.method === "GET" && reqUrl.pathname === "/api/health") {
      return sendJson(res, 200, {
        ok: true,
        service: "marketplace-crm-live",
        port: PORT,
        bind: BIND,
        sqlApiBase: SQL_API_BASE,
        legacyApiBase: LEGACY_API_BASE,
        pid: process.pid,
        time: new Date().toISOString()
      });
    }
    if (req.method === "GET" && reqUrl.pathname === "/api/legacy/status") {
      return await handleLegacyStatus(res);
    }
    if (req.method === "GET" && ["/api/live/products", "/products", "/one-c-mirror/products"].includes(reqUrl.pathname)) {
      return await handleLiveProducts(reqUrl, res);
    }
    if (req.method === "GET" && reqUrl.pathname === "/api/live/customers") {
      return await handleLiveModel("customers", reqUrl, res);
    }
    if (req.method === "GET" && ["/api/live/warehouses", "/one-c-mirror/warehouses", "/warehouses"].includes(reqUrl.pathname)) {
      return await handleLiveModel("warehouses", reqUrl, res);
    }
    if (req.method === "GET" && ["/api/live/stock-balances", "/one-c-mirror/stock-balances", "/stock-balances"].includes(reqUrl.pathname)) {
      return await handleLiveModel("stockBalances", reqUrl, res);
    }
    if (req.method === "GET" && ["/api/live/counterparty-balances", "/api/live/balances", "/one-c-mirror/counterparty-balances", "/one-c-mirror/balances", "/counterparty-balances", "/balances"].includes(reqUrl.pathname)) {
      return await handleLiveModel("counterpartyBalances", reqUrl, res);
    }
    if (req.method === "GET" && ["/api/live/serial-stock", "/one-c-mirror/serial-stock", "/one-c-mirror/serials", "/serial-stock", "/serials"].includes(reqUrl.pathname)) {
      return await handleLiveSerialStock(reqUrl, res);
    }
    if (req.method === "GET" && ["/api/live/serial-stock-summary", "/one-c-mirror/serial-stock-summary", "/serial-stock-summary"].includes(reqUrl.pathname)) {
      return await handleLiveSerialStockSummary(reqUrl, res);
    }
    if (req.method === "GET" && reqUrl.pathname === "/api/live/product-photos") {
      return await handleProductPhotoList(reqUrl, res);
    }
    if (req.method === "POST" && reqUrl.pathname === "/api/live/product-photos/upload") {
      return await handleProductPhotoUpload(req, res);
    }
    if (req.method === "POST" && reqUrl.pathname === "/api/live/product-photos/import-url") {
      return await handleProductPhotoImportUrl(req, res);
    }
    if (req.method === "GET" && /^\/api\/live\/product-photos\/[^/]+\/content$/.test(reqUrl.pathname)) {
      return await handleProductPhotoContent(reqUrl, res);
    }
    if (req.method === "GET" && reqUrl.pathname === "/api/live/stock-refresh/status") {
      return sendJson(res, 200, stockRefreshPublicStatus());
    }
    if (req.method === "POST" && reqUrl.pathname === "/api/live/stock-refresh/jobs") {
      return await handleCreateStockRefreshJob(req, res);
    }
    if (req.method === "GET" && reqUrl.pathname.startsWith("/api/live/stock-refresh/jobs/")) {
      return await handleGetStockRefreshJob(reqUrl, res);
    }
    if (req.method === "POST" && reqUrl.pathname === "/api/live/stock-refresh/publication-impact") {
      return await handleStockPublicationImpact(req, res);
    }
    if (req.method === "GET" && reqUrl.pathname === "/api/live/crm-sql/diagnostics") {
      return await handleCrmSqlLiveDiagnostics(reqUrl, res);
    }
    if (req.method === "POST" && reqUrl.pathname === "/api/config/credentials") {
      return await handleCredentialUpdate(req, res);
    }
    if (reqUrl.pathname === "/api/crm-sql/latest") {
      return sendJson(res, 410, {
        ok: false,
        code: "CRM_SQL_FULL_IMPORT_DISABLED",
        error: "Full CRM SQL snapshots are disabled in Marketplace CRM Live. Use bounded /api/live/* backend endpoints.",
        replacement: "/api/live/crm-sql/diagnostics",
        noFullImport: true
      });
    }
    if (req.method === "POST" && reqUrl.pathname === "/api/live/exchange/jobs") {
      return await handleCreateExchangeJob(req, res);
    }
    if (req.method === "GET" && reqUrl.pathname.startsWith("/api/live/exchange/jobs/")) {
      return await handleGetExchangeJob(reqUrl, res);
    }
    if (req.method === "POST" && reqUrl.pathname === "/api/log/client-action") {
      await readBody(req);
      return sendJson(res, 200, { ok: true });
    }
    if (reqUrl.pathname.startsWith("/api/")) {
      if (isDisabledLegacyBrowserJob(reqUrl)) {
        return sendJson(res, 409, {
          ok: false,
          code: "LEGACY_BROWSER_LONG_JOB_DISABLED",
          error: "Long external exchange through legacy 8797 is disabled in Marketplace CRM Live. Use backend jobs/outbox instead of a browser-triggered legacy import.",
          legacyApiBase: LEGACY_API_BASE,
          replacement: "backend_job_or_integration_outbox"
        });
      }
      return await proxyToLegacy(req, res, reqUrl);
    }
    if (req.method !== "GET" && req.method !== "HEAD") {
      return sendJson(res, 405, { ok: false, error: "Method not allowed" });
    }
    return await serveStatic(reqUrl, res);
  } catch (error) {
    return sendJson(res, 500, { ok: false, code: "MARKETPLACE_CRM_LIVE_SERVER_ERROR", error: error.message });
  }
});

server.listen(PORT, BIND, () => {
  console.log(`Marketplace CRM Live listening on http://${BIND}:${PORT}`);
  console.log(`SQL API: ${SQL_API_BASE}`);
  console.log(`Legacy API: ${LEGACY_API_BASE}`);
});

startStockRefreshScheduler();

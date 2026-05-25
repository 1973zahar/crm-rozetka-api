# API Contract Draft

Це чернетка контракту для backend, marketplace-конекторів і BAS/BAF обміну. Поточний MVP працює в браузері, але сутності нижче вже відображені в UI.

## Core Resources

### Product

```json
{
  "id": "p-100",
  "type": "weapon",
  "model": "Карабін AR-15 Civil",
  "caliber": "5.56x45",
  "brand": "Delta Arms",
  "erzRequired": true,
  "barcode": "4820001000019",
  "supplierSku": "DA-AR15-CIV",
  "internalCode": "WPN-AR15-001",
  "uktzed": "9303300000",
  "price": 86500,
  "currency": "UAH",
  "cost": 1620,
  "costCurrency": "USD"
}
```

### WeaponSerial

```json
{
  "id": "s-001",
  "productId": "p-100",
  "serial": "AR15-UA-24001",
  "warehouseId": "wh-main",
  "status": "available",
  "erzStatus": "verified",
  "clientId": null,
  "permitNumber": null,
  "permitDate": null
}
```

Rules:

- `serial` must be globally unique.
- `weapon` sale requires `serialId`, `permitNumber`, `permitDate`.
- `erzStatus` must be `verified` before sale.
- Documents older than `settings.closedDay` are editable only by roles with `canEditClosedDay`.

### Invoice

```json
{
  "id": "inv-240521-001",
  "date": "2026-05-21",
  "firmId": "vat",
  "channel": "B2B",
  "clientId": "c-001",
  "manager": "Марія Шевчук",
  "currency": "UAH",
  "total": 86500,
  "paid": 30000,
  "dueDate": "2026-06-04",
  "accounting": true,
  "locked": true,
  "status": "partial",
  "delivery": "Спецзв'язок Укрпошти",
  "ttn": "SZ-009812",
  "lines": [
    {
      "productId": "p-100",
      "qty": 1,
      "price": 86500,
      "serialId": "s-002",
      "permitNumber": "ДЗ-450112",
      "permitDate": "2026-05-19"
    }
  ]
}
```

### PurchaseReceipt

```json
{
  "id": "pin-240520-001",
  "date": "2026-05-20",
  "documentType": "Прибуткова накладна",
  "supplier": "Delta Arms",
  "supplierDoc": "DA-8801",
  "firmId": "vat",
  "warehouseId": "wh-main",
  "productId": "p-100",
  "productType": "weapon",
  "qty": 2,
  "cost": 1620,
  "currency": "USD",
  "serials": ["AR15-UA-24001", "AR15-UA-24002"],
  "accounting": true,
  "basStatus": "pending_export"
}
```

Rules:

- If `productType=weapon`, `serials.length` must equal `qty`.
- Serial numbers must be unique inside the document and globally unique in CRM.
- Receipt export/import with BAS/BAF must include document, product, warehouse, firm, currency, quantity, cost and serials.
- Regular products ignore `serials` and update quantity stock.

### Payment

```json
{
  "id": "pay-001",
  "invoiceId": "inv-240521-001",
  "date": "2026-05-21",
  "amount": 30000,
  "currency": "UAH",
  "rate": 1,
  "method": "Безготівка",
  "bankRef": "mono-88210"
}
```

## Suggested Endpoints

```text
GET    /api/products
POST   /api/products
GET    /api/serials
POST   /api/serials
POST   /api/serials/{id}/verify-erz
GET    /api/purchases
POST   /api/purchases
POST   /api/purchases/bas-baf/import
POST   /api/purchases/bas-baf/export
GET    /api/invoices
POST   /api/invoices
POST   /api/invoices/{id}/payments
POST   /api/invoices/{id}/lock
GET    /api/clients/{id}/cabinet
GET    /api/inventory
POST   /api/inventory/reports
GET    /api/integrations
POST   /api/integrations/{provider}/sync
GET    /api/rozetka/requirements
GET    /api/rozetka/items/search
GET    /api/rozetka/items/search/all
GET    /api/rozetka/goods/new
GET    /api/rozetka/goods/new/all
GET    /api/rozetka/orders/search
GET    /api/rozetka/orders/import
GET    /api/rozetka/orders/{id}
POST   /api/bas-baf/export
POST   /api/bank-statements/import
```

## Rozetka API inbound

Новий CRM має окремий read-only блок у розділі `Маркетплейси`.

Товари:

- основне джерело повного каталогу: `GET /api/rozetka/items/search` і `GET /api/rozetka/items/search/all`;
- додаткове джерело нових/неопрацьованих позицій: `GET /api/rozetka/goods/new` і `GET /api/rozetka/goods/new/all`;
- CRM записує товар у `state.products`;
- CRM записує публікацію у `state.marketplacePublications`;
- повний JSON Rozetka зберігається у `product.rozetka.raw`.

Замовлення:

- джерело: `GET /api/rozetka/orders/search`, `GET /api/rozetka/orders/{id}`, `GET /api/rozetka/orders/import`;
- CRM записує замовлення у `state.marketplaceOrders`;
- повний JSON Rozetka зберігається у `order.rozetka.raw`.

Основний мапінг товарів:

- `price_offer_id` -> SKU маркетплейсу;
- `item_id`, `rz_item_id` -> зовнішні ідентифікатори Rozetka;
- `article` -> артикул постачальника;
- `name_ua` / `name` -> назва товару;
- `price` -> ціна;
- `stock_quantity` -> залишок каналу;
- `available`, `upload_status`, `rz_sell_status`, `duplicate_mark` -> метадані Rozetka.

## Marketplace Sync Model

Each marketplace connector should normalize external payloads into these internal commands:

```json
{
  "provider": "rozetka",
  "direction": "inbound",
  "entity": "order",
  "externalId": "RZ-123456",
  "idempotencyKey": "rozetka:order:RZ-123456",
  "payload": {}
}
```

Outbound sync batches:

```json
{
  "provider": "prom",
  "entities": ["products", "prices", "stocks"],
  "warehouseId": "wh-main",
  "priceListId": "retail-uah",
  "changedSince": "2026-05-23T00:00:00+03:00"
}
```

## BAS/BAF Exchange

Only documents with `accounting: true` are exported. Recommended mapping:

- `firmId=vat` → ТОВ з ПДВ.
- `firmId=fop` → ФОП без ПДВ.
- `Invoice` → реалізація товарів / видаткова накладна.
- `Payment` → банківська виписка або касовий ордер.
- `responsible_storage` movements → акти приймання/передачі на відповідальне зберігання.

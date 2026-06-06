# CRM Rozetka API New Chat Handoff - 2026-06-06

This file is the start point for the next Codex chat that continues the B2C retail CRM/API work.

## Current State

The SQL source of truth is the separate repository:

```text
D:\Codex\CRM\SQL
https://github.com/1973zahar/SQL
```

The B2C/API app repository is:

```text
D:\Codex\CRM\crm-rozetka-full-api
https://github.com/1973zahar/crm-rozetka-api
```

The SQL layer already has CRM-ready PostgreSQL views in schema:

```text
one_c_mirror
```

The latest important SQL commits already pushed to `1973zahar/SQL`:

```text
74fb07c Add 1C serial stock views
3bc2f72 Add folder-derived product attributes
```

## Important SQL Files

Read these first in the SQL repo:

```text
D:\Codex\CRM\SQL\docs\crm-sql-new-chat-handoff-2026-06-04.md
D:\Codex\CRM\SQL\docs\crm-sql-work-log-2026-06-01.md
D:\Codex\CRM\SQL\db\migrations\004_one_c_serial_stock_views.sql
D:\Codex\CRM\SQL\db\migrations\005_one_c_product_folder_attributes.sql
```

The work log is large and has known encoding/index problems in the SQL repo. Do not blindly commit or rewrite it. Use it as a local chronological record.

A compact log export for the current handoff is also available in this B2C/API repo:

```text
D:\Codex\CRM\crm-rozetka-full-api\docs\WORK_LOG_EXPORT_2026-06-06_SQL_CURRENT.md
```

## PostgreSQL Views For B2C Retail

Use these views instead of querying 1C directly.

Products and product metadata:

```text
one_c_mirror.crm_products
one_c_mirror.crm_products_enriched
one_c_mirror.crm_product_prices
one_c_mirror.crm_product_price_summary
one_c_mirror.crm_product_groups
one_c_mirror.crm_product_folders
one_c_mirror.crm_product_kinds
one_c_mirror.crm_product_series
one_c_mirror.crm_product_characteristics
```

Folder-derived attributes:

```text
one_c_mirror.crm_product_folder_attribute_rules
one_c_mirror.crm_product_folder_path_parts
one_c_mirror.crm_product_folder_attribute_matches
one_c_mirror.crm_product_folder_attributes
one_c_mirror.crm_products_enriched
```

Serial numbers and weapon/product serial stock:

```text
one_c_mirror.crm_serial_stock_current
one_c_mirror.crm_serial_stock_by_serial
one_c_mirror.crm_serial_stock_summary
```

Stock and warehouses:

```text
one_c_mirror.crm_stock_balances
one_c_mirror.crm_warehouses
```

Counterparties, clients, contracts, settlement balances:

```text
one_c_mirror.crm_counterparties
one_c_mirror.crm_counterparty_contracts
one_c_mirror.crm_counterparty_settlements
one_c_mirror.crm_counterparty_balance_summary
```

Reference data:

```text
one_c_mirror.crm_units
one_c_mirror.crm_currencies
one_c_mirror.crm_price_types
one_c_mirror.crm_organizations
one_c_mirror.crm_persons
one_c_mirror.crm_bank_accounts
one_c_mirror.crm_reference_catalog_summary
```

## Folder Attributes Applied

Migration `005_one_c_product_folder_attributes.sql` was applied on Ubuntu from `/tmp` because `git pull` in `~/SQL` is currently blocked by local uncommitted Ubuntu changes.

Successful PostgreSQL output:

```text
BEGIN
CREATE TABLE
INSERT 0 8
CREATE VIEW
CREATE VIEW
CREATE VIEW
CREATE VIEW
COMMIT
```

Verified object existence:

```text
rules_table     = one_c_mirror.crm_product_folder_attribute_rules
path_parts_view = one_c_mirror.crm_product_folder_path_parts
matches_view    = one_c_mirror.crm_product_folder_attribute_matches
attributes_view = one_c_mirror.crm_product_folder_attributes
enriched_view   = one_c_mirror.crm_products_enriched
```

Verified counts:

```text
products_total          = 32691
products_with_path      = 32351
with_category_primary   = 15463
with_category_secondary = 489
with_supply_channel     = 6574
with_importer           = 752
spare_parts             = 489
```

Initial folder rules:

```text
ПНЕВМАТИКА        -> category_primary = Пневматика
ОПТИКА            -> category_primary = Оптика
АКСЕСУАРИ         -> category_primary = Аксесуари та інше
ЗАПЧАСТИНИ        -> category_secondary = Запчастини
ЗАПЧАСТИНИ        -> is_spare_part = true
НАШ ІМПОРТ        -> supply_channel = Наш імпорт
ФОП СЗМ           -> importer = ФОП СЗМ
```

Use `one_c_mirror.crm_products_enriched` for product cards and filters. It exposes:

```text
product_group_path
product_full_path
folder_level_1
folder_level_2
folder_level_3
folder_level_4
folder_level_5
folder_level_6
category_primary
category_secondary
supply_channel
importer
is_spare_part_from_folder
folder_attributes
```

## Serial Stock Applied

The current serial-stock dataset is imported into PostgreSQL:

```text
dataset_name = serial_stock_current
batch_id     = 222aa6f8-2760-409a-9ebc-3e746c9c128b
rows         = 7188
products     = 443
warehouses   = 6
serials      = 6557
quantity_sum = 3214.000
```

Use:

```text
one_c_mirror.crm_serial_stock_current
one_c_mirror.crm_serial_stock_by_serial
one_c_mirror.crm_serial_stock_summary
```

For weapon/serial products, keep product + warehouse + serial together. Do not flatten serials into product-only stock.

## Retail Store Assumptions

Main retail warehouse:

```text
warehouse_code = 2
warehouse_name = Склад №1
```

Other warehouses must not be discarded. For B2C show:

```text
stock_on_retail_warehouse
stock_on_wholesale_warehouse
stock_total_all_warehouses
serials_by_warehouse
```

The B2C product model should include:

```text
product_code
product_name
product_group_path
product_full_path
folder-derived category fields
1C product characteristics/reference data
prices
currency
stock on Склад №1
stock on other warehouses
serial numbers by warehouse when serial-managed
```

## Current Blockers / Warnings

1. In Ubuntu `~/SQL`, normal `git pull` is blocked by local changes:

```text
db/migrations/002_one_c_mirror.sql
db/migrations/003_one_c_crm_ready_views.sql
scripts/ubuntu/import-1c-operational-http.sh
scripts/ubuntu/run-1c-crm-viewer.py
scripts/ubuntu/run-1c-import-now.sh
```

Do not overwrite these. If a single SQL file is needed from GitHub, use:

```bash
git fetch origin main
git show FETCH_HEAD:path/to/file > /tmp/file.sql
```

2. In local SQL repo, the work log has an unsafe `MM` git state and large rewrite/encoding diff. Do not commit it blindly.

3. In `D:\Codex\CRM\crm-rozetka-full-api`, `app.js` had a pre-existing one-line indentation diff before this handoff was created. This handoff commit should not include that app.js change unless explicitly reviewed.

## Next Tasks

1. Query `one_c_mirror.crm_products_enriched` for real product examples and decide if more folder rules are needed.

2. Add B2C API endpoints or update existing app data mapping to use `crm_products_enriched` instead of raw products when showing categories and filters.

3. Add product availability logic:

```text
retail stock from Склад №1
total stock from all warehouses
serial stock from crm_serial_stock_* views
```

4. Add filters:

```text
category_primary
category_secondary
supply_channel
importer
is_spare_part_from_folder
warehouse availability
has serial numbers
price range
```

5. Add customer/counterparty lookup and balance views for retail workflows:

```text
crm_counterparties
crm_counterparty_contracts
crm_counterparty_settlements
crm_counterparty_balance_summary
```

6. Keep every command/action logged in:

```text
D:\Codex\CRM\SQL\docs\crm-sql-work-log-2026-06-01.md
```

## Useful Verification Queries

Run in `Вікно 1 - убунту`:

```bash
sudo -u postgres psql -d crm_hub -x <<'SQL'
SELECT
  product_code,
  product_name,
  product_group_path,
  product_full_path,
  folder_level_1,
  folder_level_2,
  folder_level_3,
  folder_level_4,
  category_primary,
  category_secondary,
  supply_channel,
  importer,
  is_spare_part_from_folder,
  folder_attributes
FROM one_c_mirror.crm_products_enriched
WHERE product_code IN ('8601444','868609683','868607183','868609869','8607570','868607397','868607410')
ORDER BY product_code;
SQL
```

```bash
sudo -u postgres psql -d crm_hub -x <<'SQL'
SELECT
  attribute_code,
  attribute_value,
  count(*) AS products
FROM one_c_mirror.crm_product_folder_attributes
GROUP BY attribute_code, attribute_value
ORDER BY attribute_code, products DESC;
SQL
```


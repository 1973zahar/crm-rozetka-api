# Work Log Export - SQL/B2C Current Handoff - 2026-06-06

This is a compact export for continuing the work in a new Codex chat.
The full append-only raw log remains local at:

```text
D:\Codex\CRM\SQL\docs\crm-sql-work-log-2026-06-01.md
```

Do not rewrite the raw SQL work log. It is large and has known encoding/index
problems in the SQL repo. Append to it only.

## Window Map

```text
Вікно 1 - убунту: crmadmin@crm-sql, ~/SQL, PostgreSQL crm_hub
Вікно 2 - месер: Windows Server / 1C COM host, [192.168.0.5]
Вікно 3 - локальний: local Codex Windows workspace, D:\Codex\CRM
```

## Current SQL State

Serial stock current balance was imported from 1C into PostgreSQL:

```text
dataset_name = serial_stock_current
batch_id = 222aa6f8-2760-409a-9ebc-3e746c9c128b
rows = 7188
products = 443
warehouses = 6
serials = 6557
quantity_sum = 3214.000
negative_qty = 1977
positive_qty = 5211
blank_product = 0
blank_warehouse = 0
blank_serial = 0
```

Serial stock views exist in PostgreSQL:

```text
one_c_mirror.crm_serial_stock_current
one_c_mirror.crm_serial_stock_by_serial
one_c_mirror.crm_serial_stock_summary
```

Folder-derived product attribute views exist in PostgreSQL:

```text
one_c_mirror.crm_product_folder_attribute_rules
one_c_mirror.crm_product_folder_path_parts
one_c_mirror.crm_product_folder_attribute_matches
one_c_mirror.crm_product_folder_attributes
one_c_mirror.crm_products_enriched
```

Folder-derived attribute verification after migration 005:

```text
products_total = 32691
products_with_path = 32351
with_category_primary = 15463
with_category_secondary = 489
with_supply_channel = 6574
with_importer = 752
spare_parts = 489
```

## SQL Commits Already Pushed

```text
74fb07c Add 1C serial stock views
3bc2f72 Add folder-derived product attributes
```

Important SQL files:

```text
D:\Codex\CRM\SQL\db\migrations\004_one_c_serial_stock_views.sql
D:\Codex\CRM\SQL\db\migrations\005_one_c_product_folder_attributes.sql
D:\Codex\CRM\SQL\docs\crm-sql-new-chat-handoff-2026-06-04.md
D:\Codex\CRM\SQL\docs\crm-sql-work-log-2026-06-01.md
```

## Current CRM Rozetka API Handoff

The handoff files added to `1973zahar/crm-rozetka-api` are:

```text
docs/crm-rozetka-api-new-chat-handoff-2026-06-06.md
docs/new-chat-start-message-2026-06-06.txt
docs/WORK_LOG_EXPORT_2026-06-06_SQL_CURRENT.md
```

Push path used:

```text
D:\Codex\CRM\crm-rozetka-api-handoff-push-20260606
```

Reason: the normal local repo `D:\Codex\CRM\crm-rozetka-full-api` had an
uncommitted local `app.js` change, and GitHub had newer commits. A clean
worktree from `origin/main` was used so that `app.js` was not touched.

## Current B2C Assumptions

For the retail B2C store:

```text
main retail warehouse: Склад №1
main retail warehouse_code: 2
```

Do not ignore other warehouses. The API/UI should show:

```text
stock on Склад №1
stock on other warehouses
total stock
serial numbers by warehouse
```

Use SQL views as the source of truth instead of querying 1C directly:

```text
one_c_mirror.crm_products_enriched
one_c_mirror.crm_serial_stock_current
one_c_mirror.crm_serial_stock_by_serial
one_c_mirror.crm_serial_stock_summary
```

## Next Tasks

1. Read the handoff file in this repo:

```text
D:\Codex\CRM\crm-rozetka-full-api\docs\crm-rozetka-api-new-chat-handoff-2026-06-06.md
```

2. Verify the SQL views from Ubuntu:

```sql
SELECT *
FROM one_c_mirror.crm_products_enriched
WHERE product_code IN ('8601444','868609683','868607183','868609869','8607570','868607397','868607410')
ORDER BY product_code;

SELECT *
FROM one_c_mirror.crm_serial_stock_summary
ORDER BY abs(serial_quantity) DESC NULLS LAST, product_code, warehouse_code
LIMIT 20;
```

3. Continue B2C/API integration in `D:\Codex\CRM\crm-rozetka-full-api`.

4. Keep logging every action to:

```text
D:\Codex\CRM\SQL\docs\crm-sql-work-log-2026-06-01.md
```

## Known Local Caveats

In `D:\Codex\CRM\crm-rozetka-full-api`, `app.js` had an existing uncommitted
local change before this handoff work. It was intentionally not committed.

In Ubuntu `~/SQL`, a normal `git pull` was blocked by local changes in:

```text
db/migrations/002_one_c_mirror.sql
db/migrations/003_one_c_crm_ready_views.sql
scripts/ubuntu/import-1c-operational-http.sh
scripts/ubuntu/run-1c-crm-viewer.py
scripts/ubuntu/run-1c-import-now.sh
```

Do not overwrite those files. Use `git fetch` and targeted `git show` when a
single migration file is needed.

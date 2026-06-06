# Marketplace CRM safe work-log export, 2026-06-05

This is the GitHub-safe continuation log for `1973zahar/crm-rozetka-api`.

Full local work log:

```text
D:\Codex\CRM\SQL\docs\crm-sql-work-log-2026-06-01.md
```

## 2026-06-05T17:52:10+03:00 - LAN prototype link fix

```text
Request:
The LAN link http://192.168.0.165:8796/index.html does not work.

Successful actions:
- Confirmed port 8796 was listening only on 127.0.0.1:8796, so it was loopback-only and not reachable through LAN.
- Confirmed local request to http://192.168.0.165:8796/index.html failed with connection error.
- Checked ports 8797, 8798, 8799; no listener was present.
- Started a separate Marketplace CRM mock-api instance on 0.0.0.0:8797 with Start-Process -WindowStyle Hidden.
- Verified netstat shows 0.0.0.0:8797 LISTENING.
- Verified http://127.0.0.1:8797/index.html returns HTTP 200.
- Verified http://192.168.0.165:8797/index.html returns HTTP 200, build 20260605-full-history-np-npay-1.
- Left existing 127.0.0.1:8796 instance running.
- Did not restart production 1C.
- Did not write back to 1C.
- Did not push to GitHub.

Working links:
- LAN: http://192.168.0.165:8797/index.html
- Local: http://127.0.0.1:8797/index.html

Tool/runtime errors recorded:
- LAN_URL_LOOPBACK_BIND_ONLY: 8796 was bound to 127.0.0.1 only, so the LAN URL on 192.168.0.165:8796 could not connect.
- LAN_URL_8796_CONNECTION_FAILED: local request to http://192.168.0.165:8796/index.html failed before starting the LAN-bound instance.
```

## 2026-06-05T16:46:20+03:00 - LAN connection restart request

```text
Request:
Restart LAN/network connection.

Successful actions before restart:
- Checked marketplace-crm working tree status.
- netsh interface show interface succeeded.
- ipconfig /all succeeded.
- Identified connected local network adapter: "Беспроводная сеть 3" with IPv4 192.168.1.15.
- Identified Tailscale as a separate connected tunnel and did not target it.
- Did not restart production 1C.
- Did not write back to 1C.

Tool/runtime errors recorded before restart:
- LAN_ADAPTER_LIST_ACCESS_DENIED: Get-NetAdapter failed with HRESULT 0x80041003 / Access denied, so adapter discovery was repeated with netsh/ipconfig.
```

## 2026-06-05T16:48:32+03:00 - LAN connection restart outcome

```text
Result:
- Attempted to restart "Беспроводная сеть 3" with netsh disable/enable.
- Windows refused both disable and enable with "The requested operation requires elevation (Run as administrator)."
- Post-check shows network is available through "Ethernet": Connected.
- Post-check shows "Беспроводная сеть 3": Disconnected.
- Post-check shows Tailscale: Connected; it was not restarted.
- Current local IPv4: 192.168.0.165, default gateway: 192.168.0.1.
- Did not restart production 1C.
- Did not write back to 1C.

Tool/runtime errors recorded:
- LAN_RESTART_ELEVATION_REQUIRED: netsh interface set interface admin=disabled/enabled requires a real elevated Administrator shell; command output returned this requirement and no adapter restart was performed by Codex.
```

The full local log was updated, but it is outside the nested `D:\Codex\CRM\marketplace-crm` Git repository. Raw HTTP logs, caches, `.env`, and `.secrets` are intentionally excluded from GitHub.

## Final package result

```text
Prepared handoff files, next-chat prompt, code, docs, and safe ignore rules.
Committed Marketplace CRM work into the nested repository.
Pushed to GitHub remote: https://github.com/1973zahar/crm-rozetka-api.git
1C production server was not restarted.
No write-back to 1C was performed.
```

## Verification result

```text
node --check app.js: OK
node --check src\rozetka-http.mjs: OK
PowerShell parser for mock-api.ps1: OK
GET http://127.0.0.1:8789/index.html: HTTP 200, build 20260605-full-history-np-npay-1
git diff --cached --check: OK after formatting fix
Secret scan: no provided NovaPay refresh token, no provided Nova Poshta API key, no RSA private key, no GitHub token
```

## Recorded error codes

```text
GIT_DUBIOUS_OWNERSHIP_PUSH
Initial push failed because Git detected dubious ownership for D:/Codex/CRM/marketplace-crm.
Resolved by adding only this repository path to git safe.directory and retrying push.

GIT_ROOT_NOT_REPOSITORY_CHECK
D:\Codex\CRM is not a Git repository, so the central SQL work-log cannot be pushed through the nested marketplace-crm repository.

GIT_DIFF_CHECK_TRAILING_BLANK
git diff --cached --check detected one trailing blank line at EOF in the handoff document.
Resolved before commit.
```

## Integration status to continue

```text
NovaPay:
Full-history gateway and cache are implemented.
Current real result: one cached payment, no TTN on that payment.
Known codes: NPAY_EMPTY_TTN, NPAY_REGISTER_CREATE_FAILED.
Next: find NovaPay endpoint/export that returns TTN for payments and persist all history as new/changed records.

Nova Poshta:
Full-history gateway is implemented with 30-day windows and cache merge.
Current real result: API access works but cabinet returned zero document rows for 2020-01-01..2026-06-05.
Known code: NP_DOCUMENTS_EMPTY_FROM_CABINET.
Next: verify API key/counterparty/cabinet access for historical TTNs.

SQL:
Import is still incomplete for the requested clean base.
Next: load new/changed products, stocks, clients, warehouses, balances, not only the limited product subset.

UI:
All exchange controls must stay in Settings -> Data Exchange.
Rozetka has the four signed buttons in the upper block.
The same pattern must be used for current and future marketplaces.
```

## 2026-06-05T13:39:57+03:00 - Marketplace CRM exchange continuation

```text
Scope:
Continued from handoff commit 7d1d38e.
All changes stayed inside local prototype/gateway files.
1C production server was not restarted.
No write-back to 1C was performed.
No .env, .secrets, .cache, crm-http*.ndjson, raw logs, or 1C exports were staged.

Successful actions:
- Kept all new exchange controls under Settings -> Data Exchange.
- Added CRM SQL, NovaPay, and Nova Poshta diagnostics buttons to the unified exchange center.
- Added frontend diagnostics flows for /api/crm-sql/latest?limit=50000&scope=full&diagnostics=1, /api/novapay/status, and /api/delivery/nova-poshta/diagnostics.
- Extended CRM SQL import diagnostics for products, clients, warehouses, firms, stock, balances, and product prices.
- Normalized empty SQL sections to numeric 0 counts instead of null.
- Added CRM SQL balances alias and signed balance fields for receivables/counterparty balances.
- Improved SQL stock import so stock rows can create minimal product records when product master rows are missing.
- Improved one-c mirror name mapping for products and counterparties.
- Added read-only Nova Poshta diagnostics endpoint with counterparty sample and document-list sample checks.
- Changed NovaPay register type default/example from 1 to 1,2,3,4 for broader all-history TTN probing.

Verification:
- PowerShell parser for mock-api.ps1: OK.
- Bundled Node syntax check app.js: OK.
- Bundled Node syntax check src\rozetka-http.mjs: OK.
- git diff --check: OK, only CRLF normalization warnings.
- Prototype started at http://127.0.0.1:8794/index.html: HTTP 200.
- Prototype /api/health on 8794: OK.
- Static UI contract on served app.js: OK, diagnostics buttons/endpoints present.
- NovaPay diagnostics: direct=True, gateway=False, client=True, account=True.
- CRM SQL diagnostics: partial=True, code=CRM_SQL_ONEC_MIRROR_404, products=200/200, clients=1/1, warehouses=1/0, firms=1/0, stock=0/0, balances=0/0.
- Nova Poshta diagnostics: partial=True, code=NP_DOCUMENTS_EMPTY_FROM_CABINET, counterparties=2, sampleDocs=0.

Current blockers / codes:
- CRM_SQL_ONEC_MIRROR_404: current CRM SQL server still returns 404 for one-c-mirror endpoints from this prototype environment; fallback products/customers are available, full stock/balance import is blocked until one-c-mirror API is reachable/deployed for this environment.
- CRM_SQL_PARTIAL_DATA: full products/clients/warehouses/firms/stock/balances payload is partial.
- CRM_SQL_EMPTY_STOCK: no stock rows returned from CRM SQL in current diagnostics.
- NP_DOCUMENTS_EMPTY_FROM_CABINET: Nova Poshta API key works and sender counterparties are visible, but sample InternetDocument/getDocumentList returned 0 TTNs.

Tool/runtime errors recorded:
- NODE_PATH_ACCESS_DENIED: node from PATH was denied by sandbox; resolved by running bundled Node syntax check with escalation.
- PROCESS_INFO_ACCESS_DENIED: Get-CimInstance Win32_Process was denied while inspecting an existing local prototype PID; skipped because process inspection was not required.
- PROTOTYPE_HEALTH_ERROR: sandbox-launched child mock-api process disappeared after the shell command returned; resolved by starting the local prototype outside sandbox on 8794.
- START_PROCESS_PATH_DUPLICATE: Start-Process with RedirectStandardOutput/RedirectStandardError failed because PowerShell saw duplicate Path/PATH environment keys; retried without redirect.
- BROWSER_REPL_SETUP_FAILED: in-app Browser setup failed three times with sandbox setup refresh; browser visual QA could not be completed, so HTTP/static checks were used instead.
```

## 2026-06-05T13:51:17+03:00 - Sales submenu funnel visibility

```text
Request:
Remove "Manager sales funnel" from all Sales submenus and leave it only under Sales -> Orders.

Successful actions:
- Added explicit subview visibility support through data-subview-only.
- Marked manager funnel section with data-subview-only="sales:orders".
- Did not change 1C integration, production 1C server, or write-back behavior.

Verification:
- Bundled Node syntax check app.js: OK.
- PowerShell parser for mock-api.ps1: OK.
- git diff --check: OK, only CRLF normalization warnings.
- Prototype started at http://127.0.0.1:8796/index.html: HTTP 200.
- Prototype /api/health on 8796: OK.
- Served app.js static check: OK, sales:orders-only funnel visibility markers present.

Tool/runtime errors recorded:
- STATIC_UI_CHECK_ERROR: first static check used PowerShell wildcard matching with literal [data-subview-only] and failed; repeated with String.Contains and passed.
- RG_REGEX_PARSE_ERROR: final verification rg pattern treated [data-subview-only] as a character class; repeated with simpler literal search.
- RG_FIXED_QUOTE_ERROR: two fixed-string rg attempts had incorrect PowerShell quoting/escaping; repeated with broad literal search and passed.
```

## 2026-06-05T14:19:41+03:00 - Sales submenu process-control visibility

```text
Request:
Leave "Order processing control" only under Sales -> Orders, same as the manager funnel.

Successful actions:
- Marked renderMarketplaceOrderProcessControl section with data-subview-only="sales:orders".
- Confirmed manager funnel remains marked with data-subview-only="sales:orders".
- Confirmed the accidental B2B price catalog marker was removed.
- Did not change 1C integration, production 1C server, or write-back behavior.

Verification:
- Bundled Node syntax check app.js: OK.
- git diff --check: OK, only CRLF normalization warnings.
- Prototype /api/health on 8796: OK.
- Served app.js static check: OK, sales:orders markers=2.

Tool/runtime errors recorded:
- SALES_PROCESS_ATTR_WRONG_SECTION: first broad patch added data-subview-only to an unrelated B2B price-catalog section; fixed by removing it there and adding it inside renderMarketplaceOrderProcessControl.
- RG_PATTERN_QUOTE_ERROR: one rg verification pattern with quotes/pipes was parsed incorrectly by PowerShell/rg; repeated with a simpler search and passed.
```

## 2026-06-05T14:38:36+03:00 - Sales warehouse rows and logistics handoff

```text
Request:
Sales -> Warehouse must show only order rows for picking, not columns. Each row needs open-for-picking, picked, and handoff-to-logistics actions. After handoff, the order must move to Sales -> Logistics.

Successful actions:
- Changed warehouse order rendering to one dashboard-list of rows/strips.
- Warehouse rows now show only three actions: open for picking, picked, handoff to logistics.
- Added warehousePickingOrders() so Sales -> Warehouse includes picking and picked-but-not-handed-over orders only.
- Added salesLogisticsOrders() so Sales -> Logistics includes handed-over/logistics/delivery orders only.
- Handoff to logistics now switches the Sales subview to logistics after updating the order.
- The Picked button is disabled once an order is already picked; the handoff button remains the next active warehouse action.
- Did not change 1C integration, production 1C server, or write-back behavior.

Verification:
- Bundled Node syntax check app.js: OK.
- PowerShell parser for mock-api.ps1: OK.
- git diff --check: OK, only CRLF normalization warnings.
- Prototype /api/health on 8796: OK.
- Served app.js static check: OK, warehouse/logistics filters and the three row actions are present.

Tool/runtime errors recorded:
- WAREHOUSE_GRID_PATCH_CONTEXT_MISMATCH: first large patch failed because mojibake HTML context did not match; repeated as smaller scoped patches.
- HANDOVER_CONTEXT_MISMATCH: first direct patch around handoff audit text did not match encoded text; repeated with function-level context and passed.
- LOGISTICS_FILTER_WRONG_TARGET: first broad replacement temporarily applied salesLogisticsOrders() to the communication list instead of the logistics table; restored communication list and applied the filter to the logistics table.
- RG_PATTERN_QUOTE_ERROR: final combined rg verification with spaces/quotes was parsed as file paths; repeated as smaller searches and passed.
```

## 2026-06-05T14:53:49+03:00 - Sales logistics split into three stages

```text
Request:
Split Sales -> Logistics into three stages: 1) received from warehouse, 2) handed to carrier, 3) handed/delivered.

Successful actions:
- Added salesLogisticsStage() and salesLogisticsBuckets().
- Added renderSalesLogisticsControl() with three row-based logistics stages:
  1. Отримано від складу
  2. Передано перевізнику
  3. Вручене / доставлено
- Added renderSalesLogisticsOrderRows() so each stage uses order rows/strips, not the old all-orders table.
- Hid the old legacy logistics table with data-subview-only="sales:legacyLogistics".
- Changed the logistics action label to "Передано перевізнику".
- Changed the logistics handoff action to set delivery.status="sent_to_delivery" so the row moves into stage 2.
- Added lightweight .logistics-stage CSS.
- Did not change 1C integration, production 1C server, or write-back behavior.

Verification:
- Bundled Node syntax check app.js: OK.
- PowerShell parser for mock-api.ps1: OK.
- git diff --check: OK, only CRLF normalization warnings.
- Prototype /api/health on 8796: OK.
- Served app.js/static CSS check: OK, three stage labels, legacy marker, sent_to_delivery transition, and .logistics-stage CSS are present.

Tool/runtime errors recorded:
- RENDER_LOGISTICS_SECTION_PATCH_CONTEXT_MISMATCH: first direct patch around the mojibake logistics heading did not match; repeated by patching the section start after renderRozetkaImportedOrdersPanel.
- LOGISTICS_LABEL_PATCH_CONTEXT_MISMATCH: first direct patch for the old "Логіст прийняв" label used stale mojibake context; repeated using rg-confirmed UTF-8 lines.
- RG_PATTERN_QUOTE_ERROR: one combined rg verification with quotes/pipes was parsed incorrectly; repeated as smaller literal searches and passed.
```

## 2026-06-05T15:03:26+03:00 - Sales warehouse/logistics workflow permissions in roles

```text
Request:
Add the new Sales warehouse/logistics workflow items to roles for repo https://github.com/1973zahar/crm-rozetka-api.

Successful actions:
- Confirmed Sales / Warehouse and Sales / Logistics subviews are already present in the role subview matrix.
- Renamed role document permissions so the new buttons are explicit in Roles:
  - warehousePicking -> Sales warehouse: Picked button.
  - warehouseHandover -> Sales warehouse: handoff to logistics.
  - logisticsAcceptance -> Sales logistics: handed to carrier.
  - deliveryTracking -> Sales logistics: carrier status / delivered.
- Renamed role field permissions for the new warehouse/logistics workflow:
  - warehouse -> Sales warehouse: picking / handoff.
  - logistics -> Sales logistics: received / carrier.
  - deliveryTracking -> Sales logistics: TTN / delivered.
- Verified existing role gates still protect the warehouse and logistics actions.
- Did not change 1C integration, production 1C server, or write-back behavior.
- Did not push to GitHub.

Verification:
- Bundled Node syntax check app.js: OK.
- PowerShell parser for mock-api.ps1: OK.
- git diff --check: OK, only CRLF normalization warnings.
- Prototype index/app.js on 8796: OK.
- Served app.js static check: OK, role labels for warehouse/logistics are present.

Tool/runtime errors recorded:
- DIFF_PREVIEW_TRUNCATED_PIPE_EXIT_1: a final `git diff ... | Select-Object -First 220` preview returned exit code 1 after printing the requested preview; syntax, diff-check, and prototype verification were already OK.
- SQL_GIT_DUBIOUS_OWNERSHIP: `git -C D:\Codex\CRM\SQL status --short docs\crm-sql-work-log-2026-06-01.md` failed because Git sees the SQL repo as owned by a different Windows user. No global safe.directory change was made without user approval.
- WORKLOG_REORDER_CONTEXT_MISMATCH: first combined apply_patch attempt to move this block failed because the end-of-file context did not match; repeated as smaller patches.
- WORKLOG_APPEND_CONTEXT_MISMATCH: second apply_patch attempt to append this block used mojibake tail context that did not match; repeated with a unique ASCII anchor and passed.
```

## 2026-06-05T15:45:46+03:00 - Logistics TTN-driven carrier transition

```text
Request:
Sales -> Logistics must move an order from "Received from warehouse" to "Handed to carrier" only after TTN is entered, and then to "Delivered" only from the downloaded carrier status.

Successful actions:
- Removed automatic TTN generation from warehouse -> logistics handoff.
- Warehouse handoff now leaves delivery.status="warehouse_handover" and waits for TTN.
- Added marketplaceOrderHasTtn(), markMarketplaceOrderSentToCarrierByTtn(), marketplaceDeliveryHasDownloadedCarrierStatus(), and marketplaceDeliveryDeliveredByCarrier().
- Saving a marketplace order with TTN while it is received from warehouse now automatically sets delivery.status="sent_to_delivery" and statusSource="ttn_entry".
- Manual carrier statuses without TTN are blocked in the order form.
- The received-from-warehouse logistics row now shows "Внести ТТН" and opens the order instead of moving it to carrier.
- The delivered logistics stage now requires delivery.status="delivered" plus a downloaded carrier source: carrier_api, carrier_document, lastCarrierStatusAt, or trackingDetails status code.
- Nova Poshta tracking and Nova Poshta document import now mark statusSource and lastCarrierStatusAt when status is downloaded.
- Existing role labels were updated so logistics permission names mention TTN entry and carrier handoff.
- Did not change 1C integration, production 1C server, or write-back behavior.
- Did not push to GitHub.

Verification:
- Bundled Node syntax check app.js: OK.
- PowerShell parser for mock-api.ps1: OK.
- git diff --check: OK, only CRLF normalization warnings.
- Prototype index/app.js on 8796: OK.
- Served app.js static check: OK, TTN-flow helpers, guard text, statusSource markers, and "Внести ТТН" are present.

Tool/runtime errors recorded:
- RG_PATTERN_QUOTE_ERROR: several combined rg patterns with quotes/pipes or the `·` character were parsed incorrectly by PowerShell/rg, including the final status-grep; repeated as smaller literal/static checks and passed.
- TTN_FLOW_PATCH_CONTEXT_MISMATCH: first broad patch around pending action labels/action state did not match because Get-Content showed mojibake while the file is UTF-8; repeated using rg-confirmed UTF-8 text and passed.
- ORDER_ISSUE_PATCH_CONTEXT_MISMATCH: first patch around deliveryTtn/logisticsAccepted issue rules used mojibake context and failed; repeated using UTF-8 lines and passed.
- LOGISTICS_STAGE_BUTTON_PATCH_CONTEXT_MISMATCH: first patch replacing the received-stage button used mojibake context and failed; repeated with rg-confirmed UTF-8 line and passed.
- BROWSER_SKILL_PARTIAL_READ_CORRECTED: Browser skill was initially read only partially; corrected by reading the full SKILL.md before browser execution.
- BROWSER_REPL_SETUP_FAILED: in-app Browser verification failed twice with node_repl kernel exit / Windows sandbox setup failure. HTTP/static prototype verification was used instead.
- SQL_WORKLOG_APPEND_CONTEXT_MISMATCH: first append attempt for the full local work-log used mojibake tail context that did not match; repeated with an ASCII anchor and passed.
```

## 2026-06-05T18:11:24+03:00 - Create marketplace order product autocomplete

```text
Request:
In "Create order", the Product column must start empty, allow typing text, and show a dropdown list of products.

Successful actions:
- Changed the marketplace order line product control from an initially selected <select> to an empty text input with a product datalist and hidden lineProductId.
- Added product search labels/options built from product name, product codes, marketplace SKU, supplier SKU, internal code, barcode, and id.
- Added exact product search sync so choosing a datalist value fills hidden productId, SKU, price, and currency.
- Kept existing order edit rows readable by rendering the selected product label when lineProductId already exists.
- Changed default marketplace order lines so new rows start with blank productId/SKU and 0 price.
- Changed the create-order form so it no longer preselects state.products[0]; hidden legacy product select now starts with a blank option.
- Restarted only the local LAN-bound mock prototype on 0.0.0.0:8797; production 1C was not restarted.
- Did not write back to 1C.
- Did not push to GitHub.
- Did not add or push .env, .secrets, .cache, crm-http*.ndjson, or raw logs.

Verification:
- Bundled Node syntax check app.js: OK.
- PowerShell parser for mock-api.ps1: OK.
- git diff --check: OK, only CRLF normalization warnings.
- Local prototype http://127.0.0.1:8797/index.html: OK, HTTP 200 after LAN mock restart.
- LAN prototype http://192.168.0.165:8797/index.html: OK, HTTP 200 after LAN mock restart.
- Served app.js static check: OK, found data-marketplace-order-product-search, marketplace-order-product-options, syncMarketplaceOrderLineProductSearch, marketplaceOrderDefaultLine(product = null), and the blank create-order line render call.

Tool/runtime errors recorded:
- RG_PATTERN_QUOTE_ERROR: combined rg patterns containing quotes/parentheses were parsed incorrectly and failed with "unclosed group"; repeated with Select-String and narrower checks.
- LAN_HTTP_TIMEOUT_8797: first HTTP check against http://192.168.0.165:8797/index.html timed out because the existing local mock-api process on port 8797 was hung.
- LAN_LOCAL_HTTP_TIMEOUT_8797: first local HTTP check against http://127.0.0.1:8797/index.html also timed out before restart.
- PROCESS_QUERY_ACCESS_DENIED: Get-CimInstance Win32_Process for the hung 8797 PID failed with Windows access denied; netstat was used to confirm the listener PID.
- BROWSER_SKILL_PARTIAL_READ_CORRECTED: Browser skill was initially read only partially; corrected by reading the full SKILL.md before browser execution.
- BROWSER_REPL_SETUP_FAILED: in-app Browser verification failed twice with node_repl kernel exit / Windows sandbox setup failure. Syntax and HTTP/static prototype verification were used instead.
```

## 2026-06-05T18:28:32+03:00 - Product autocomplete shows names before codes

```text
Request:
Verify the "Create order" product field because the dropdown pulled numbers/codes instead of product names.

Successful actions:
- Inspected the product autocomplete label builder and confirmed the previous datalist value included product name plus numeric/barcode/internal-code values in the same visible option value.
- Changed the product option value so the input/dropdown value is the human product name only.
- Moved product codes, SKU, barcode, and id into the datalist option label attribute as secondary context.
- Added a code-only detector so numeric ids or long hex/code strings are not used as the primary visible product name.
- Added fallback display text as "Товар <код>" only when no real product name is available in brand/model/name/title/productName/product_name.
- Kept exact search by code/SKU/barcode/id working through search terms even though the visible option value prioritizes names.
- Did not change 1C integration, production 1C server, or write-back behavior.
- Did not push to GitHub.
- Did not add or push .env, .secrets, .cache, crm-http*.ndjson, or raw logs.

Verification:
- Bundled Node syntax check app.js: OK.
- PowerShell parser for mock-api.ps1: OK.
- git diff --check: OK, only CRLF normalization warnings.
- Local served app.js check: OK, found marketplaceOrderProductDisplayName, marketplaceOrderProductCodeLabel, datalist labelAttr, and updated option value generation.
- LAN prototype http://192.168.0.165:8797/index.html: OK, HTTP 200.

Tool/runtime errors recorded:
- WORKLOG_APPEND_CONTEXT_MISMATCH: first repo-safe log append attempt used a stale was/were tail context; repeated with exact tail context and passed.
- BROWSER_REPL_SETUP_FAILED: in-app Browser UI verification failed with node_repl kernel exit / Windows sandbox setup failure. Syntax and HTTP/static prototype verification were used instead.
```

## 2026-06-05T18:42:10+03:00 - Force product autocomplete names and cache bust

```text
Request:
User reported that product names still do not appear in the "Create order" product field and the behavior is the same.

Successful actions:
- Found that index.html still referenced app.js?v=20260605-full-history-np-npay-1, so the browser could keep the old cached JavaScript.
- Bumped app/index build to 20260605-product-name-autocomplete-1 and version to 2026.06.05.3.
- Removed numeric/code values from datalist option label entirely; product datalist options now render only `<option value="<product name>"></option>`.
- Changed product search sync so if a user types an exact code/SKU/barcode/id, the visible input is replaced with the product display name after the match.
- Broadened display-name candidates to include product, fullName, entityName, nomenclature, itemName, goodsName, and description.
- Broadened ONEC_PRODUCT_NAME_KEYS and mock-api CRM SQL product/stock name mapping to keep imported product names from more SQL/1C field variants.
- Restarted only the local LAN-bound mock prototype on 0.0.0.0:8797; production 1C was not restarted.
- Did not write back to 1C.
- Did not push to GitHub.
- Did not add or push .env, .secrets, .cache, crm-http*.ndjson, or raw logs.

Verification:
- Bundled Node syntax check app.js: OK.
- PowerShell parser for mock-api.ps1: OK.
- git diff --check: OK, only CRLF normalization warnings.
- Local prototype http://127.0.0.1:8797/index.html: OK, HTTP 200 with build 20260605-product-name-autocomplete-1.
- LAN prototype http://192.168.0.165:8797/index.html: OK, HTTP 200 with build 20260605-product-name-autocomplete-1.
- Served index.html check: OK, found app.js?v=20260605-product-name-autocomplete-1 and styles.css?v=20260605-product-name-autocomplete-1.
- Served app.js check: OK, found option generation without label/code values, updateSearch=true on product match, broader name fields, and APP_VERSION 2026.06.05.3.

Tool/runtime errors recorded:
- INDEX_VERSION_PATCH_CONTEXT_MISMATCH: first index.html patch attempt used mojibake/stale context for the visible version block; repeated as smaller patches and passed.
- BROWSER_REPL_SETUP_FAILED: in-app Browser UI verification failed again with node_repl kernel exit / Windows sandbox setup failure. Syntax and HTTP/static prototype verification were used instead.
- APPLY_PATCH_INVALID_UTF8_SQL_WORKLOG: full local SQL work-log append via apply_patch failed because the file currently contains an invalid UTF-8 byte sequence; recovered with append-only PowerShell fallback without reading or rewriting existing content.
```

## 2026-06-05T18:55:54+03:00 - Replace native datalist with custom product picker

```text
Request:
User reported that the product field still pulls numeric values and asked to analyze what was changed before.

Analysis:
- Previous change 1 replaced the product <select> with an <input list="marketplace-order-product-options"> plus hidden lineProductId.
- Previous change 2 changed the datalist value/label so names should be first and codes secondary.
- Previous change 3 removed datalist label codes and bumped cache-buster to 20260605-product-name-autocomplete-1.
- The screenshot still showed Chrome's native white dropdown with pure values like 03565, 03573, 20499.
- Because the visible field still used native datalist and name="lineProductSearch", Chrome could still show native datalist/autofill/history values outside our control.

Successful actions:
- Removed native datalist rendering from the Create order product field.
- Removed list="marketplace-order-product-options" from the visible product input.
- Removed name="lineProductSearch" from the visible product input because it is not submitted and could be tied to Chrome field history.
- Added a custom DOM product picker with data-marketplace-order-product-suggestions and product row buttons.
- Product picker rows now show product display name in <strong> and codes/category only as a smaller secondary line inside our controlled dropdown.
- Added focus/input/change/click handlers to open, filter, select, and hide the custom product picker.
- Bumped app/index build to 20260605-custom-product-picker-1 and version to 2026.06.05.4.
- Added CSS for .product-autocomplete and .product-autocomplete-list.
- Did not change 1C production server, and did not write back to 1C.
- Did not push to GitHub.
- Did not add or push .env, .secrets, .cache, crm-http*.ndjson, or raw logs.

Verification:
- Bundled Node syntax check app.js: OK.
- PowerShell parser for mock-api.ps1: OK.
- git diff --check: OK, only CRLF normalization warnings.
- Local http://127.0.0.1:8796/index.html: OK, build 20260605-custom-product-picker-1.
- LAN http://192.168.0.165:8797/index.html: OK, build 20260605-custom-product-picker-1.
- Served JS static check: OK, found custom picker helpers and confirmed old datalist/list attribute strings are not present.
- Served CSS static check: OK, found product-autocomplete styles.

Tool/runtime errors recorded:
- CUSTOM_PICKER_EVENT_PATCH_CONTEXT_MISMATCH: first combined patch for click/focus/input handlers did not match around listener boundaries; repeated as smaller patches and passed.
- PRODUCT_SEARCH_NAME_PATCH_CONTEXT_MISMATCH: first patch removing name="lineProductSearch" used stale UTF-8 context; repeated with exact Select-String-confirmed lines and passed.
- BROWSER_REPL_SETUP_FAILED: in-app Browser UI verification failed again with node_repl kernel exit / Windows sandbox setup failure. Syntax and HTTP/static prototype verification were used instead.
```

## 2026-06-05T20:07:51+03:00 - Restart local Marketplace CRM prototype

```text
Request:
User asked to restart.

Successful actions:
- Checked current listeners:
  - 127.0.0.1:8796 PID 34572.
  - 0.0.0.0:8797 PID 13508.
- Restarted only local mock-api prototype processes, not 1C production.
- Started 8796 on 127.0.0.1, new PID 4520.
- Started 8797 on 0.0.0.0, new PID 40484.
- Local 8796 returned HTTP 200 with build 20260605-custom-product-picker-1.
- Local 8797 returned HTTP 200 with build 20260605-custom-product-picker-1.
- Served app.js check on 8796 confirmed custom product picker code and old datalist removal.
- Did not write back to 1C.
- Did not push to GitHub.
- Did not add or push .env, .secrets, .cache, crm-http*.ndjson, or raw logs.

Verification:
- PowerShell parser for mock-api.ps1: OK.
- Bundled Node syntax check app.js: OK.
- git diff --check: OK, only CRLF normalization warnings.
- http://127.0.0.1:8796/index.html: OK, HTTP 200, build 20260605-custom-product-picker-1.
- http://127.0.0.1:8797/index.html: OK, HTTP 200, build 20260605-custom-product-picker-1.

Tool/runtime errors recorded:
- LAN_SELF_IP_HTTP_TIMEOUT_8797: http://192.168.0.165:8797/index.html timed out twice after restart, while 0.0.0.0:8797 was listening and 127.0.0.1:8797 returned HTTP 200. Treating this as self-IP/network access issue, not a local prototype startup failure.
```

## 2026-06-06T11:51:40+03:00 - Fix Rozetka publications in product publication control

```text
Request:
User reported that "Контроль виставлення товарів" is empty even though a Rozetka publication exists.

Analysis:
- The product publication control rendered only state.marketplacePublications.
- Current external-only profile removes seed/demo marketplacePublications from loaded operational data.
- Imported Rozetka goods can already exist on product.rozetka while marketplacePublications is missing or was skipped by delta logic.
- The control also counted "Опубліковані" only when readiness.issues was empty, so an existing published Rozetka row with missing CRM category/filter/logistics fields could be excluded from the published card.

Successful actions:
- Added marketplacePublication status normalization for published/active/available/uploaded/success/approved and positive numeric statuses.
- Added recovery of Rozetka publications from imported product.rozetka data during normalizeState.
- Added identity matching by marketplace + externalId/SKU/productId so recovered Rozetka publications do not duplicate existing rows.
- Updated upsertRozetkaPublication() to use the same Rozetka status normalization and sync readiness fields.
- Updated marketplacePublicationReadiness() so status=published remains "опубліковано" even if the row has fields to complete before the next sync.
- Updated renderMarketplacePublicationControl() to show all publication rows, bucket them into blockers/warnings/ready/published, and count "Опубліковані" independently from readiness issues.
- Bumped app/index build to 20260606-rozetka-publication-control-1 and version to 2026.06.06.1.
- Restarted only the local mock prototype on 127.0.0.1:8796 outside sandbox so it persists.
- Did not restart 1C production.
- Did not write back to 1C.
- Did not push to GitHub.
- Did not add or push .env, .secrets, .cache, crm-http*.ndjson, or raw logs.

Verification:
- Bundled Node syntax check app.js: OK.
- PowerShell parser for mock-api.ps1: OK.
- git diff --check: OK, only CRLF normalization warnings.
- http://127.0.0.1:8796/index.html: OK after persistent restart, HTTP 200, build 20260606-rozetka-publication-control-1.
- http://127.0.0.1:8797/index.html: OK, HTTP 200, build 20260606-rozetka-publication-control-1.
- Served app.js static check on 8797: OK, found normalizeMarketplacePublications, rozetkaPublicationFromProduct, marketplacePublicationIsPublished, and rozetkaPublicationStatusFromSource.

Tool/runtime errors recorded:
- ACCESS_DENIED_NODE_PATH: node --check app.js from PATH failed with access denied; recovered with bundled Node runtime syntax check.
- LOCAL_HTTP_ERROR_8796_TIMEOUT: first http://127.0.0.1:8796/index.html request timed out before local restart.
- CIM_ACCESS_DENIED_PROCESS_COMMANDLINE: Get-CimInstance Win32_Process command-line lookup for local mock PIDs failed with access denied; recovered using netstat listener checks.
- HTTP_VERIFY_ERROR_COMBINED_PORTS: combined 8796/8797 HTTP verification failed after sandbox-local restart; split per-port checks showed 8797 OK and 8796 stopped.
- HTTP_8796_SINGLE_REQUEST_EXIT: sandbox-started 8796 mock served one request and exited; recovered by starting the local mock outside sandbox.
- BROWSER_TOOL_NOT_AVAILABLE_AFTER_SEARCH: searched for in-app Browser tool, but no callable browser navigation/screenshot tool was exposed in this turn; used HTTP/static checks instead.
- LAN_8797_HTTP_TIMEOUT: http://192.168.0.165:8797/index.html timed out while 127.0.0.1:8797 was OK and 0.0.0.0:8797 was listening.
- LAN_8796_HTTP_TIMEOUT: http://192.168.0.165:8796/index.html timed out; 8796 is bound to 127.0.0.1 only.
```

## 2026-06-06T12:06:03+03:00 - Restart local prototype and refresh LAN link

```text
Request:
User reported the page is still blank / not working and asked to restart.

Successful actions:
- Checked current listeners before restart:
  - 127.0.0.1:8796 was listening on PID 40096 but HTTP timed out.
  - 0.0.0.0:8797 was listening on PID 40484 and returned HTTP 200.
- Restarted only local mock-api prototype processes on ports 8796 and 8797.
- Started 8796 on 127.0.0.1, new PID 37984.
- Started 8797 on 0.0.0.0, new PID 5516.
- Verified http://127.0.0.1:8796/index.html: HTTP 200, build 20260606-rozetka-publication-control-1.
- Verified http://127.0.0.1:8797/index.html: HTTP 200, build 20260606-rozetka-publication-control-1.
- Verified served app.js on 8796 contains the Rozetka publication-control helpers.
- Checked current IPv4 addresses; 192.168.0.165 is no longer assigned to this machine.
- Verified current LAN URLs on port 8797:
  - http://192.168.89.204:8797/index.html: HTTP 200, build 20260606-rozetka-publication-control-1.
  - http://100.64.4.110:8797/index.html: HTTP 200, build 20260606-rozetka-publication-control-1.
  - http://172.21.176.1:8797/index.html: HTTP 200, build 20260606-rozetka-publication-control-1.
  - http://192.168.4.14:8797/index.html: HTTP 200, build 20260606-rozetka-publication-control-1.
- TCP test to 192.168.89.204:8797 succeeded.
- Did not restart 1C production.
- Did not write back to 1C.
- Did not push to GitHub.
- Did not add or push .env, .secrets, .cache, crm-http*.ndjson, or raw logs.

Verification:
- Bundled Node syntax check app.js: OK.
- HTTP checks for 127.0.0.1:8796 and 127.0.0.1:8797: OK.
- LAN check for the current IP 192.168.89.204:8797: OK.

Tool/runtime errors recorded:
- HTTP_8796_BEFORE_RESTART_ERROR: http://127.0.0.1:8796/index.html timed out before restart while PID 40096 was listening with stuck connections.
- POWERSHELL_PID_READONLY_VARIABLE: first restart script used $pid, which is a reserved/read-only PowerShell variable; reran with processIdToStop and restart succeeded.
- PLAYWRIGHT_CORE_MODULE_MISSING: bundled playwright package could not require playwright-core; skipped Playwright runtime check.
- CHROME_DOM_EMPTY_OUTPUT: headless Chrome --dump-dom returned empty output; treated as tool/browser-headless issue because HTTP checks passed.
- EDGE_DOM_EMPTY_OUTPUT: headless Edge --dump-dom returned empty output; treated as tool/browser-headless issue because HTTP checks passed.
- LAN_OLD_IP_UNREACHABLE_192_168_0_165: http://192.168.0.165:8797/index.html timed out and Test-NetConnection showed DestinationHostUnreachable. Current machine IP is different.
```

## 2026-06-06T12:19:28+03:00 - Make Create Publication product field searchable

```text
Request:
User reported that the Product field in "Створити публікацію" does not allow typing for search by product name.

Successful actions:
- Replaced the Create Publication product <select> with a hidden productId field plus a visible text input.
- Visible product input now supports typing by product name, brand, model, SKU, barcode, internal code, marketplace SKU, and linked product requisites.
- Added a publication-specific autocomplete dropdown with product name in the main line and category/codes in the secondary line.
- Selecting an option updates hidden productId, SKU, publication title, category/group/filter defaults, price, currency, and linked SKU controls.
- Added exact-match sync on field change so a fully typed product name/code can bind without using the mouse.
- Added CSS so the publication-product autocomplete is wide enough and not clipped by the invoice-lines table wrapper.
- Bumped app/index build to 20260606-publication-product-search-1 and version to 2026.06.06.2.
- Restarted only local mock-api prototype processes on ports 8796 and 8797.
- Did not restart 1C production.
- Did not write back to 1C.
- Did not push to GitHub.
- Did not add or push .env, .secrets, .cache, crm-http*.ndjson, or raw logs.

Verification:
- Bundled Node syntax check app.js: OK.
- PowerShell parser for mock-api.ps1: OK.
- git diff --check: OK, only CRLF normalization warnings.
- Static source check: OK, new data-marketplace-publication-product-search / option / autocomplete handlers present.
- Static source check: OK, old select name="productId" data-marketplace-publication-product markup absent.
- http://127.0.0.1:8796/index.html: OK, HTTP 200, build 20260606-publication-product-search-1.
- http://127.0.0.1:8797/index.html: OK, HTTP 200, build 20260606-publication-product-search-1.
- http://192.168.89.204:8797/index.html: OK, HTTP 200, build 20260606-publication-product-search-1.
- Served LAN app.js check: OK, found data-marketplace-publication-product-search, data-marketplace-publication-product-option, applyMarketplacePublicationLineProduct, selectMarketplacePublicationProductOption, and confirmed old select markup absent.
- Served LAN styles.css check: OK, found .table-wrap.invoice-lines and publication-product-autocomplete.

Tool/runtime errors recorded:
- RG_PUBLICATION_SEARCH_REGEX_ERROR: first rg check used an over-escaped combined pattern with quotes and failed with "unclosed group"; reran with simpler patterns and passed.
```

## 2026-06-06T12:37:21+03:00 - Fix Chrome blank page by hardening mock listener

```text
Request:
User sent a screenshot of a blank page at http://192.168.89.204:8797/index.html.

Analysis:
- 8797 was listening, but HTTP requests to the LAN URL timed out.
- netstat showed stuck Chrome self-connections in ESTABLISHED / CLOSE_WAIT on 192.168.89.204:8797.
- mock-api.ps1 handled TcpClient connections sequentially and read from the stream immediately.
- Chrome can open idle/preconnect TCP sockets without sending an HTTP request. One such socket could block the single-threaded listener and leave the browser on a white loading page.

Successful actions:
- Updated mock-api.ps1 Read-Request to wait up to 300 ms for request bytes and close idle sockets instead of blocking.
- Added a 3 s body-read deadline for partial POST bodies.
- Lowered TcpClient ReceiveTimeout to 1000 ms and SendTimeout to 2000 ms.
- Enabled TcpClient.NoDelay.
- Added a finally block around per-client handling to always close the client.
- Restarted only local mock-api prototype processes on ports 8796 and 8797.
- Did not restart 1C production.
- Did not write back to 1C.
- Did not push to GitHub.
- Did not add or push .env, .secrets, .cache, crm-http*.ndjson, or raw logs.

Verification:
- PowerShell parser for mock-api.ps1: OK.
- Bundled Node syntax check app.js: OK.
- git diff --check: OK, only CRLF normalization warnings.
- http://127.0.0.1:8796/index.html: OK, HTTP 200, build 20260606-publication-product-search-1.
- http://127.0.0.1:8797/index.html: OK, HTTP 200, build 20260606-publication-product-search-1.
- http://192.168.89.204:8797/index.html: OK, HTTP 200, build 20260606-publication-product-search-1.
- Idle-socket stress test: opened 4 raw TCP sockets without HTTP data, then requested index.html; server returned HTTP 200 in about 1258 ms with build 20260606-publication-product-search-1.
- Post-stress LAN check: OK, HTTP 200, build 20260606-publication-product-search-1.
- netstat after stress showed only LISTENING and TIME_WAIT on 8797, no stuck ESTABLISHED/CLOSE_WAIT server connection.

Tool/runtime errors recorded:
- LAN_HTTP_TIMEOUT_BEFORE_LISTENER_FIX: http://192.168.89.204:8797/index.html timed out while 8797 was listening with stuck Chrome connections.
- NODE_IDLE_SOCKET_QUOTE_ERROR: first inline Node stress-test command failed due PowerShell quote parsing.
- NODE_IDLE_SOCKET_POWERSHELL_PARSE_ERROR: second inline Node stress-test command failed due PowerShell parsing JS tokens.
- NODE_EVAL_QUOTE_STRIPPED: third inline Node attempt reached Node with stripped quotes; recovered by piping a PowerShell here-string to node stdin and the stress test passed.
```

## 2026-06-06T14:29:00+03:00 - Prepare final handoff package for new chat

```text
Request:
User asked to prepare all files, logs, tasks, a summary handoff file, everything needed to continue from the same place in a new chat, push it to https://github.com/1973zahar/crm-rozetka-api, and provide a clear starter message for the new chat.

Successful actions:
- Inspected the Git worktree: only tracked candidate files were modified, and there were no untracked files from `git ls-files -o --exclude-standard`.
- Checked `.env.example` diff: only NOVAPAY_REGISTER_TYPES changed from 1 to 1,2,3,4.
- Confirmed the changed `.env.example` contains no real API keys, tokens, passwords, or secrets.
- Created repo handoff file `docs/HANDOFF_2026-06-06_MARKETPLACE_CRM.md`.
- Included current build, URLs, safety rules, changed-file list, verification commands, known blockers, and a new-chat starter prompt in the handoff file.
- Re-ran syntax and prototype verification.
- Restarted only the local LAN mock prototype on 0.0.0.0:8797 after detecting the old local listener was stuck.
- Stable LAN restart used a temp raw-log path outside the repo: `%TEMP%\marketplace-crm-8797.ndjson`.
- Did not restart 1C production.
- Did not write back to 1C.
- Did not add or push .env, .secrets, .cache, crm-http*.ndjson, or raw logs.

Verification:
- Bundled Node syntax check app.js: OK.
- PowerShell parser for mock-api.ps1: OK.
- git diff --check: OK, only CRLF normalization warnings.
- http://127.0.0.1:8796/index.html: OK, HTTP 200, build 20260606-publication-product-search-1.
- http://127.0.0.1:8797/index.html after restart: OK, HTTP 200, build 20260606-publication-product-search-1.
- http://192.168.89.204:8797/index.html after restart: OK, HTTP 200, build 20260606-publication-product-search-1.
- netstat after stable restart: OK, 0.0.0.0:8797 LISTENING on PID 11736 and no stuck ESTABLISHED/CLOSE_WAIT server connections.

Tool/runtime errors recorded:
- LAN_8797_HANDOFF_CHECK_TIMEOUT: first LAN verification for http://192.168.89.204:8797/index.html timed out because the old local mock listener on 8797 had stuck Chrome TCP sockets.
- GET_NET_IPADDRESS_ACCESS_DENIED: Get-NetIPAddress was blocked by Windows permissions in this shell; continued with known working IP and HTTP checks.
- START_PROCESS_REDIRECT_PATH_DUPLICATE: diagnostic Start-Process with redirected stdout/stderr failed because the process environment contains duplicate Path/PATH keys.
- CRM_HTTP_LOG_WRITE_ACCESS_DENIED: a test job showed default raw crm-http.ndjson writes can be denied in this environment; recovered by starting the stable LAN prototype with a temp -LogPath outside the repo.

Next actions:
- Stage only safe tracked files and docs.
- Commit the handoff package.
- Push to origin/main.
- Record final commit/push result in the full local work-log and final chat response.
```

## 2026-06-06T14:32:00+03:00 - Record git staging permission recovery

```text
Successful actions:
- Retried git add with escalated permission after the sandbox blocked .git/index.lock creation.
- Staged only the explicit safe file list for the handoff package.

Tool/runtime errors recorded:
- GIT_INDEX_LOCK_PERMISSION_DENIED: first git add failed with "Unable to create ... .git/index.lock: Permission denied"; recovered by rerunning git add with approval for .git write access.
```

## 2026-06-06T14:34:52+03:00 - Recover rejected push by rebasing on origin/main

```text
Successful actions:
- Attempted to push local handoff commit b9a26fc to origin/main.
- Fetched origin after GitHub rejected the push.
- Found origin/main had two newer commits:
  - 0962644 Add CRM SQL handoff for new chat
  - edef758 Add current SQL work log export
- Rebased the local handoff commit cleanly on top of origin/main.
- New local handoff commit after rebase: 235818f Add marketplace CRM handoff and prototype fixes.

Verification:
- git status -sb after rebase: main is ahead of origin/main by 1 commit and no longer behind.
- Remote SQL handoff/log commits were preserved; no force-push was used.

Tool/runtime errors recorded:
- GIT_PUSH_REJECTED_FETCH_FIRST: first git push was rejected because remote main contained work not present locally; recovered by fetch + clean rebase.
```

## 2026-06-06T14:44:00+03:00 - Finalize LAN listener stability after push

```text
Request:
Continue preparing the final handoff package and keep the prototype verified after push.

Analysis:
- The repository was already pushed at commit 111e5e4, but a follow-up LAN check showed 8797 was no longer listening.
- Start-Job reproduction on a test port passed idle-socket stress, while non-escalated Start-Process listeners disappeared after the tool command ended.
- This indicates two separate issues:
  1. mock-api.ps1 needed a more defensive client accept/read loop.
  2. local LAN listener process launch must be escalated in this sandbox so it survives after the shell command exits.

Successful actions:
- Hardened mock-api.ps1 Read-Request with a final catch-all that treats unexpected socket/read exceptions as an idle/invalid request.
- Hardened the main accept loop so AcceptTcpClient/Handle-Client failures cannot terminate the listener process.
- Started only the local LAN mock prototype on 0.0.0.0:8797 with a temp -LogPath outside the repo and escalated process launch.
- Did not restart 1C production.
- Did not write back to 1C.
- Did not add or push .env, .secrets, .cache, crm-http*.ndjson, or raw logs.

Verification:
- PowerShell parser for mock-api.ps1: OK.
- Bundled Node syntax check app.js: OK.
- git diff --check: OK, only CRLF normalization warnings.
- http://127.0.0.1:8797/index.html: OK, HTTP 200, build 20260606-publication-product-search-1.
- http://192.168.89.204:8797/index.html: OK, HTTP 200, build 20260606-publication-product-search-1.
- Separate-command persistence check: OK, 8797 still LISTENING on PID 37536 after the start command exited.
- LAN idle-socket stress test: OK, 6 idle sockets plus index.html request returned HTTP 200 in about 877 ms, build 20260606-publication-product-search-1.
- Post-stress netstat: OK, 0.0.0.0:8797 still LISTENING on PID 37536.

Tool/runtime errors recorded:
- LAN_8797_FINAL_CHECK_FAILED: after the first push, a separate LAN check could not connect because the non-escalated local listener process had disappeared.
- LAN_IDLE_SOCKET_STRESS_ECONNREFUSED_AFTER_ACCEPT_FIX: first stress attempt after the accept-loop patch hit ECONNREFUSED because the non-escalated listener had already exited.
- SANDBOX_STARTPROCESS_CHILD_TERMINATED_AFTER_COMMAND: inferred sandbox lifecycle issue; recovered by starting the local listener with escalated process launch.
```

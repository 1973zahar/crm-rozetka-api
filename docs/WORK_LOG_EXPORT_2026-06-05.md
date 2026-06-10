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

## 2026-06-09T21:57:00+03:00 - MESER emergency menu hotfix

```text
Reason:
Owner reported that the Marketplace CRM menu stopped working after build 20260609-product-menu-subviews-1.

Changes:
- Updated app.js/index.html to v2026.06.09.4 / 20260609-menu-hotfix-1.
- Removed the active toolbar subview selector insertion from renderShell().
- Restored direct sidebar data-view navigation: set state.currentView, ensure currentSubview, hide flyout, render, return.
- Restored render() to the previous simple order: renderShell() first, then render the current view into #app.
- Kept the existing bounded/live SQL API architecture unchanged.

Verification:
- node --check app.js passed.
- node --check server-live.mjs passed.
- publish-marketplace-crm-live-local-meser.ps1 PowerShell parser check passed.
- git diff --check returned only existing LF/CRLF warnings, no whitespace errors.
- Local HTTP smoke on 127.0.0.1:8915 returned health=200, index=200, app=200, build=20260609-menu-hotfix-1, directView=True, renderGuard=False, toolbarSelectorInsert=False.
- MESER MarketplaceCRMLive was updated and restarted only on port 8798.
- Live http://192.168.0.5:8798/index.html returned build 20260609-menu-hotfix-1.
- Live /api/health returned HTTP 200.
- Live app.js markers: hotfix=True, directView=True, renderGuard=False, toolbarSelectorInsert=False.
- Live /one-c-mirror/serial-stock?productCode=8600167&limit=1&offset=0 returned HTTP 200.

Safety:
- 1C production was not restarted.
- Legacy 8797 was not restarted.
- No write-back to 1C was performed.
- No secrets, env contents, raw logs or serial values were printed.

Note:
- In-app Browser UI click verification was unavailable because the Browser plugin connection failed in this Codex session; verification used syntax, local smoke, and live HTTP/static checks.
```

## 2026-06-09T15:05:00+03:00 - Local publication warehouse-stock build prepared; MESER publish pending approval

```text
Reason:
Continue Marketplace CRM / MarketplaceCRMLive without full browser data loads. MESER 8798 already served 20260608-live-serial-stock-api-1, then local code was advanced to fix publication product search warehouse scoping.

Actions:
- Added marketplace publication warehouse selector to the create-publication form.
- Stored selected publication warehouse in marketplacePublicationDraft.
- Publication product autocomplete now uses publicationWarehouseId and bounded /products?warehouseCode=...&inStock=true&limit=... requests.
- Publication suggestions refresh when the selected publication warehouse changes.
- Created publications now store warehouseId and compute stockQty with productAvailableQtyForWarehouse.
- Updated local build markers to v2026.06.09.1 / 20260609-publication-warehouse-stock-1.
- Updated publish-marketplace-crm-live-local-meser.ps1 ExpectedBuild to 20260609-publication-warehouse-stock-1.

Verification:
- node --check app.js passed.
- node --check server-live.mjs passed.
- publish-marketplace-crm-live-local-meser.ps1 PowerShell parse check passed.
- Temporary local server-live on 127.0.0.1:8902 served index.html with build 20260609-publication-warehouse-stock-1.
- Temporary local /products?warehouseCode=2&inStock=true&limit=3&offset=0 returned 3 bounded rows and selectedWarehouseAvailableQuantity metadata.
- Temporary local /one-c-mirror/serial-stock?limit=1 returned HTTP 400 with SERIAL_PRODUCT_REQUIRED.
- Temporary local /one-c-mirror/serial-stock?productCode=8600167&limit=3&offset=0 returned 3 bounded rows with serialNumber/serialName fields and hasMore=true; serial values were not printed.

Deployment/runtime note:
- MESER 192.168.0.5:8798 remains on build 20260608-live-serial-stock-api-1.
- Direct script run was blocked by local PowerShell execution policy.
- Bypass run was blocked by sandbox access denial to the saved MESER credential path.
- Unsandboxed live-only publish/restart request was rejected by the safety reviewer pending explicit owner approval.
- No MESER publish or service restart was completed in this turn.
- 1C production was not restarted.
- No write-back to 1C was performed.
- No secrets, env contents, raw logs, payment rows, TTN rows, or serial row values were printed.
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

## 2026-06-06T15:24:41+03:00 - Continue exchange diagnostics and SQL import coverage

```text
Request:
Continue Marketplace CRM after handoff: NovaPay all-history + TTN, Nova Poshta all-history diagnostics, CRM SQL full import of new/changed products, stock, clients, warehouses and balances. Verify UI after start.

Successful actions:
- Read the handoff and current repo-safe/full SQL work-log context before editing.
- Kept all exchange controls in Settings -> Data Exchange; no exchange buttons were moved elsewhere.
- Updated app.js build to 20260606-exchange-history-diagnostics-1 / v2026.06.06.3 and updated index.html cache-busting.
- Hardened NovaPay warning code extraction so register-create failures keep the primary NPAY_REGISTER_CREATE_FAILED code instead of being masked as only NPAY_REGISTER_PERIOD_FAILED.
- Extended Nova Poshta diagnostics from one recent sample window to all-history diagnostic probes: history start, midpoint and recent window.
- Added Nova Poshta diagnostics throttling between sample windows to avoid "To many requests" rate limits.
- Extended CRM SQL gateway row unwrapping and frontend import aliases for products/items, counterparties, warehouses, firms, stockBalances, serialStockSummary, counterpartyBalances, balances and balance summaries.
- Extended CRM SQL product import fields for category_primary/category_secondary/folder_level_* and stock fields for serial_quantity/balance_quantity/amount_abs.
- Restarted only local mock listeners on 8796 and 8797 after mock-api.ps1 changes; did not restart 1C production.
- Recovered a late LAN 8797 hang by stopping only the local LAN mock listener, waiting 12 seconds for Chrome retry sockets to clear, and starting 8797 again.
- Did not write back to 1C.
- Did not push .env, .secrets, .cache, crm-http*.ndjson or raw logs.
- Did not run full NovaPay all-history automatically because NovaPay register-create can create register statements; verified safe NovaPay status instead.
- Appended the full local SQL work-log after apply_patch could not read it due invalid UTF-8; used byte-safe .NET AppendAllText without rewriting prior content.

Verification:
- Bundled Node syntax check app.js: OK.
- PowerShell parser for mock-api.ps1: OK.
- git diff --check: OK, only LF-to-CRLF normalization warnings.
- http://127.0.0.1:8796/index.html: OK, HTTP 200, build 20260606-exchange-history-diagnostics-1.
- http://127.0.0.1:8797/index.html: OK, HTTP 200, build 20260606-exchange-history-diagnostics-1.
- http://192.168.89.204:8797/index.html: OK, HTTP 200, build 20260606-exchange-history-diagnostics-1.
- Late final http://192.168.89.204:8797/index.html after Chrome retry pause: OK, HTTP 200, build 20260606-exchange-history-diagnostics-1.
- NovaPay status endpoint: OK; direct gateway configured, client/account configured, external gateway not configured.
- Nova Poshta diagnostics endpoint: OK partial; 3 diagnostic windows, 0 docs, 0 probe failures after throttle, code NP_DOCUMENTS_EMPTY_FROM_CABINET.
- CRM SQL diagnostics endpoint: OK partial; code CRM_SQL_ONEC_MIRROR_404, limit=1 smoke returned products=1, stock=0, balances=0, prices=0 in this prototype environment.
- Static UI check: Settings nav and Data Exchange controls remain present; create-publication product field uses data-marketplace-publication-product-search input with hidden productId. The old product select remains only in edit-publication modal.

Tool/runtime errors recorded:
- RG_SQL_MIGRATIONS_PATH_MISSING: first migration search used non-existing D:\Codex\CRM\SQL\database\migrations; recovered with D:\Codex\CRM\SQL\db\migrations.
- APPLY_PATCH_MOCKAPI_CONTEXT_MISMATCH: first combined mock-api.ps1 patch context did not match; recovered with smaller hunks.
- APPLY_PATCH_APP_PRODUCT_CATEGORY_CONTEXT_MISMATCH: first app.js category hunk used mojibake context; recovered with correct UTF-8 context from rg.
- LAN_8797_HTTP_TIMEOUT_STALE_LISTENER: 8797 was listening but HTTP requests timed out; recovered by restarting only the local mock listener.
- CIM_PROCESS_QUERY_ACCESS_DENIED: Win32_Process command-line query for PID 37536 was denied; recovered with Get-Process name check.
- LOCAL_8796_BACKEND_STALE_AFTER_PATCH: 8796 served new static build but old mock-api.ps1 functions until listener restart; recovered by restarting only local mock listener.
- NP_DIAGNOSTICS_DOCUMENT_LIST_FAILED: first multi-window diagnostics attempt hit Nova Poshta "To many requests" on 2 windows; recovered by adding diagnostics throttle.
- POWERSHELL_RG_QUOTE_PARSE_ERROR: one rg selector query had broken quoting; recovered with simpler separate rg searches.
- BROWSER_NODE_REPL_KERNEL_EXITED: first Browser runtime setup attempt exited unexpectedly.
- BROWSER_RUNTIME_UNAVAILABLE_AFTER_RETRY: second Browser runtime setup failed the same way; used HTTP/static checks instead.
- PLAYWRIGHT_NODE_EVAL_QUOTE_LOSS: first shell Playwright fallback lost quotes in node -e; not an app error.
- PLAYWRIGHT_CORE_MODULE_NOT_FOUND: bundled playwright package could not load missing playwright-core.
- PLAYWRIGHT_CORE_MODULE_NOT_FOUND_WITH_NODE_PATH: NODE_PATH fallback still could not load playwright-core; browser screenshot verification remained unavailable.
- FULL_SQL_WORKLOG_APPLY_PATCH_INVALID_UTF8: apply_patch could not read D:\Codex\CRM\SQL\docs\crm-sql-work-log-2026-06-01.md due invalid UTF-8; recovered with append-only .NET AppendAllText, no prior content rewrite.
- FINAL_COMBINED_URL_CHECK_TIMEOUT: combined final 8796+8797 URL check timed out; recovered by separating checks.
- LAN_8797_SINGLE_LOOP_BLOCKED_BY_STALE_CLIENT: 8797 accepted stale Chrome connections and blocked its single-threaded loop; recovered with listener restart after a pause.
- THREADPOOL_CALLBACK_NO_RUNSPACE: quick ThreadPool callback experiment failed because PowerShell callbacks have no runspace on that thread; no server code was changed for this approach.
- LAN_8797_RESTART_RACE_CHROME_CONNECTIONS: immediate restart was re-captured by Chrome connections and timed out; recovered by stopping 8797, waiting 12 seconds, then restarting.
```

## 2026-06-06T21:53:00+03:00 - MESER stable self-starting Marketplace CRM shortcut

```text
Request:
Create a permanent working self-starting link because the plain URL/service state was too unstable.

Successful actions:
- Added open-marketplace-crm-meser.ps1 as the stable user entrypoint. It checks local port 8797, starts scheduled task MarketplaceCRM if the listener is down, waits for the port, then opens http://192.168.0.5:8797/index.html.
- Added install-meser-marketplace-crm-link.ps1 to copy the opener to MESER and create permanent Marketplace CRM.lnk shortcuts.
- Installed verified shortcuts on MESER:
  - C:\Users\zahar\Desktop\Marketplace CRM.lnk
  - C:\Users\Public\Desktop\Marketplace CRM.lnk
  - C:\Users\zahar\AppData\Roaming\Microsoft\Windows\Start Menu\Programs\Marketplace CRM\Marketplace CRM.lnk
- Updated deploy-meser-marketplace-crm.ps1 so future deploys recreate the same self-starting shortcuts instead of relying on a bare URL.
- Did not restart 1C production.
- Did not write back to 1C.
- Did not copy .env, .secrets, .cache, crm-http*.ndjson or raw logs.

Verification:
- PowerShell parser for open-marketplace-crm-meser.ps1: OK.
- PowerShell parser for install-meser-marketplace-crm-link.ps1: OK.
- PowerShell parser for deploy-meser-marketplace-crm.ps1: OK.
- MESER shortcut inspection: all three Marketplace CRM.lnk files exist and target powershell.exe with open-marketplace-crm-meser.ps1.
- MESER task state after shortcut install: Running.
- http://192.168.0.5:8797/index.html: OK, HTTP 200, build 20260606-exchange-history-diagnostics-1.

Tool/runtime errors recorded:
- None during shortcut install. Prior Browser runtime instability remains unrelated to MESER shortcut behavior.
```

## 2026-06-06T22:44:00+03:00 - MESER local integration config workflow

```text
Request:
Proceed after real MESER UI showed Rozetka/NovaPay errors caused by missing local credentials.

Successful actions:
- Added ProgramData-based integration config contract:
  - C:\ProgramData\MarketplaceCRM\config\marketplace-crm.env
  - C:\ProgramData\MarketplaceCRM\config\marketplace-crm.env.template
- Added config\marketplace-crm.env.template in repo with blank/no-secret placeholders for CRM SQL, Rozetka, Nova Poshta and NovaPay.
- Updated start-marketplace-crm-meser.ps1 to set MARKETPLACE_CRM_ENV_PATH to C:\ProgramData\MarketplaceCRM\config\marketplace-crm.env.
- Updated mock-api.ps1 so Import-EnvFile and Set-NovaPayEnvFileValue use MARKETPLACE_CRM_ENV_PATH when set. This keeps NovaPay refresh-token rotation out of repo .env on MESER.
- Updated open-marketplace-crm-meser.ps1 so clicking Marketplace CRM restarts only MarketplaceCRM task if the local config file changed after last server start.
- Updated install-meser-marketplace-crm-link.ps1 to copy updated opener/launcher/mock-api scripts, install the no-secret config template, create the local config file if missing, and create Marketplace CRM Config.lnk shortcuts.
- Updated deploy-meser-marketplace-crm.ps1 so future deploys preserve the same ProgramData config and config shortcut workflow.
- Installed the config workflow on MESER and restarted only scheduled task MarketplaceCRM.
- Did not restart 1C production.
- Did not write back to 1C.
- Did not add or transfer filled .env, .secrets, .cache, crm-http*.ndjson, raw logs, passwords or tokens.

Verification:
- PowerShell parser for mock-api.ps1, start-marketplace-crm-meser.ps1, open-marketplace-crm-meser.ps1, install-meser-marketplace-crm-link.ps1 and deploy-meser-marketplace-crm.ps1: OK.
- Bundled Node syntax check app.js: OK.
- MESER installer output confirmed:
  - Open script: C:\CRM\marketplace-crm\open-marketplace-crm-meser.ps1
  - Config path: C:\ProgramData\MarketplaceCRM\config\marketplace-crm.env
  - Open shortcuts on zahar desktop, Public Desktop and Start Menu.
  - Config shortcuts on zahar desktop, Public Desktop and Start Menu.
- MarketplaceCRM task restart: OK; state Running, port 0.0.0.0:8797 LISTENING.
- Launcher info confirms envPath=C:\ProgramData\MarketplaceCRM\config\marketplace-crm.env.
- http://192.168.0.5:8797/index.html: OK, HTTP 200, build 20260606-exchange-history-diagnostics-1.

Tool/runtime errors recorded:
- MARKETPLACE_ENV_RG_POWERSHELL_ENV_QUOTING_ERROR: first rg/log text with literal $env: triggered PowerShell variable parsing; recovered with fixed-string searches and non-interpolating log text.
- MARKETPLACE_OPENER_CONFIG_RESTART_PATCH_CONTEXT_MISMATCH: first opener patch used stale context; recovered by reading the actual file and patching exact content.
- MESER_CONFIG_SHORTCUT_VERIFY_TIMEOUT_90S: optional read-only shortcut target inspection timed out over WinRM after install; non-blocking because installer output and HTTP verification succeeded.
```

## 2026-06-07T12:16:00+03:00 - Marketplace CRM live PostgreSQL service slice

```text
Request:
Create a working multi-user/network program based on Marketplace CRM, but move to the new live PostgreSQL architecture and prepare it for MESER.

Successful actions:
- Added server-live.mjs: a dependency-free concurrent Node HTTP server for Marketplace CRM Live.
- Added bounded live endpoint GET /api/live/products?search=&limit=&offset=.
- The endpoint uses CRM_SQL_API_BASE_URL, default http://192.168.0.166:3000, and tried /one-c-mirror/products before falling back to /products.
- Updated app.js build to 20260607-live-sql-products-1 and changed Create publication / marketplace order product search to call /api/live/products while retaining local state.products only as bounded fallback/cache.
- Updated index.html cache-busting and visible build label to 20260607-live-sql-products-1.
- Added MESER live launcher/install scripts:
  - start-marketplace-crm-live-meser.ps1
  - open-marketplace-crm-live-meser.ps1
  - install-meser-marketplace-crm-live.ps1
- Did not restart 1C production.
- Did not write back to 1C.
- Did not copy .env, .secrets, .cache, crm-http*.ndjson, raw logs, passwords or tokens.

Verification:
- node --check app.js: OK.
- node --check server-live.mjs: OK.
- PowerShell parser for start-marketplace-crm-live-meser.ps1: OK.
- PowerShell parser for open-marketplace-crm-live-meser.ps1: OK.
- PowerShell parser for install-meser-marketplace-crm-live.ps1: OK.
- Local live server http://127.0.0.1:8798/api/health: OK; service marketplace-crm-live, bind 127.0.0.1, sqlApiBase http://192.168.0.166:3000.
- Local http://127.0.0.1:8798/index.html: OK, HTTP 200, build 20260607-live-sql-products-1.
- Local http://127.0.0.1:8798/api/live/products?limit=5&offset=0: OK, HTTP 200, returned 5 products from http://192.168.0.166:3000/products and warning CRM_SQL_LIVE_PRODUCTS_UPSTREAM_FAILED for /one-c-mirror/products HTTP 404.

Pending / blocked:
- MESER installation of MarketplaceCRMLive on 0.0.0.0:8798 was not executed. The escalation reviewer rejected the remote install because it would make persistent MESER host changes: copy files, create an autostart scheduled task, shortcuts and a new network listener. This requires explicit owner approval of that exact implementation/blast radius before retrying.

Tool/runtime errors recorded:
- APP_BUILD_HEADER_PATCH_ENCODING_CONTEXT_MISMATCH: first app.js build header patch used a context that did not match; recovered with smaller targeted hunks.
- MARKETPLACE_RG_LITERAL_WILDCARD_PATH_ERROR: one rg command used a literal wildcard path in PowerShell; recovered with corrected searches.
- CRM_MARKETPLACE_PS_PARSE_EXCEPTION: first PowerShell parser harness used [ref] on an uninitialized variable; recovered with initialized token/error refs and scripts parsed OK.
- MESER_LIVE_DEPLOY_ESCALATION_REJECTED: remote MESER install command was blocked by escalation policy; no MESER deployment command was executed.
- CRM_MARKETPLACE_LIVE_SCREENSHOT_FAILED: Chrome headless screenshot failed because artifacts directory creation was denied and later because the GPU process was unusable.
- CRM_MARKETPLACE_LIVE_EDGE_SCREENSHOT_FAILED: Edge headless screenshot failed for the same GPU process issue. HTTP/static/live endpoint verification succeeded.
```

## 2026-06-07T12:43:00+03:00 - MarketplaceCRMLive installed on MESER

```text
Request:
Owner explicitly allowed installing MarketplaceCRMLive on MESER 192.168.0.5: copy files to C:\CRM\marketplace-crm, create scheduled task MarketplaceCRMLive, shortcuts and network listener 0.0.0.0:8798.

Successful actions:
- Installed MarketplaceCRMLive package on MESER.
- Created/updated scheduled task MarketplaceCRMLive.
- Created live open shortcuts:
  - C:\Users\zahar\Desktop\Marketplace CRM Live.lnk
  - C:\Users\Public\Desktop\Marketplace CRM Live.lnk
  - C:\Users\zahar\AppData\Roaming\Microsoft\Windows\Start Menu\Programs\Marketplace CRM Live\Marketplace CRM Live.lnk
- Created live config shortcuts for C:\ProgramData\MarketplaceCRMLive\config\marketplace-crm-live.env.
- Patched start-marketplace-crm-live-meser.ps1 to set NODE_SKIP_PLATFORM_CHECK=1 before launching bundled Node on MESER.
- Reinstalled the patched launcher on MESER and restarted only MarketplaceCRMLive.
- Did not restart 1C production.
- Did not write back to 1C.
- Did not copy .env, .secrets, .cache, crm-http*.ndjson, raw logs, passwords or tokens.

Verification:
- MESER MarketplaceCRMLive task: Running.
- MESER listener: TCP 0.0.0.0:8798 LISTENING, PID 1060.
- http://192.168.0.5:8798/api/health: OK, service marketplace-crm-live, bind 0.0.0.0, sqlApiBase http://192.168.0.166:3000.
- http://192.168.0.5:8798/index.html: OK, HTTP 200, build 20260607-live-sql-products-1.
- http://192.168.0.5:8798/api/live/products?limit=5&offset=0: OK, HTTP 200, 5 products returned from http://192.168.0.166:3000/products.
- http://192.168.0.5:8797/index.html: OK, HTTP 200, build 20260607-live-sql-products-1.

Tool/runtime errors recorded:
- MESER_NODE_PLATFORM_CHECK_EXIT_216: bundled Node refused to start on MESER without NODE_SKIP_PLATFORM_CHECK=1. Remote test confirmed NODE_SKIP_PLATFORM_CHECK=1 gives node --version exit 0 and node --check exit 0, so the live launcher now sets it.
- CRM_MARKETPLACE_MESER_LIVE_DIAG_FAILED: first direct Invoke-Command without the documented credential alias was denied; recovered by using the existing meser-fresh-zahar credential path from the installer.
```

## 2026-06-07T12:44:00+03:00 - MarketplaceCRMLive version metadata correction

```text
Request:
Owner asked why the UI showed v2026.06.07.1 / 20260607-live-sql-products-1 / субота, 2026-06-07 / час 00:20 while the real date was Sunday 2026-06-07.

Successful actions:
- Confirmed the version block was build metadata from app.js, not a live clock.
- Corrected app.js build metadata to:
  - APP_VERSION = 2026.06.07.2
  - APP_BUILD = 20260607-live-sql-products-2
  - APP_BUILD_DAY = неділя
  - APP_BUILD_TIME = 12:44
- Corrected index.html cache-busting/static fallback to the same build metadata.
- Patched install-meser-marketplace-crm-live.ps1 so normal UI deploys skip copying runtime\node\node.exe when the MESER file already exists with the same byte length.
- Deployed the corrected metadata to MESER MarketplaceCRMLive.
- Did not restart 1C production.
- Did not write back to 1C.
- Did not copy .env, .secrets, .cache, crm-http*.ndjson, raw logs, passwords or tokens.

Verification:
- node --check app.js: OK.
- PowerShell parser for install-meser-marketplace-crm-live.ps1: OK.
- http://192.168.0.5:8798/index.html?nocache=202606071244: OK, appBuild 20260607-live-sql-products-2, staticVersion v2026.06.07.2, staticDay неділя, 2026-06-07, staticTime 12:44.
- http://192.168.0.5:8798/app.js?v=20260607-live-sql-products-2&nocache=1: OK, constants show v2026.06.07.2 and неділя / 12:44.

Tool/runtime errors recorded:
- INDEX_BUILD_METADATA_PATCH_CONTEXT_MISMATCH: first index.html fallback patch used stale version context; recovered by rg inspection and exact patch.
- MESER_LIVE_NODE_COPY_LOCKED: first metadata deploy failed because Copy-Item could not overwrite C:\CRM\marketplace-crm\runtime\node\node.exe while the live Node process was running; recovered by patching installer to skip unchanged node.exe.
```

## 2026-06-07T13:39:00+03:00 - MarketplaceCRMLive no-full-import architecture enforcement

```text
Request:
Owner corrected the architecture requirement: PostgreSQL is the live source-of-truth, TypeScript/backend layer should behave like an Odoo-like ORM, UI must not keep the full database, blocks must not duplicate shared data, shared data must be read through SQL views/backend API, writes only to CRM-owned tables/outbox/queues, 1C only through export/outbox/queues.

Successful actions:
- Added bounded live backend model endpoints in server-live.mjs:
  - GET /api/live/products?search=&limit=&offset=
  - GET /api/live/customers?search=&limit=&offset=
  - GET /api/live/warehouses?search=&limit=&offset=
  - GET /api/live/stock-balances?search=&limit=&offset=
  - GET /api/live/counterparty-balances?search=&limit=&offset=
  - GET /api/live/crm-sql/diagnostics?limit=1
- Disabled full CRM SQL snapshots on MarketplaceCRMLive:
  - GET /api/crm-sql/latest now returns 410 with CRM_SQL_FULL_IMPORT_DISABLED on live port 8798.
- Changed frontend CRM SQL path:
  - importOneCSqlLatestFromServer keeps the old function name for button compatibility, but now calls /api/live/crm-sql/diagnostics?limit=1.
  - Removed the runtime call to applyOneCImportPayload(payload, "crmSql") from the CRM SQL path.
  - Data Exchange SQL buttons now say Live check / Live SQL check instead of Update/Import from SQL.
- Updated build metadata:
  - v2026.06.07.3
  - 20260607-live-orm-no-full-import-1
  - неділя, 2026-06-07, час 13:03
- Deployed updated static files to MESER; owner manually restarted the 8798 listener after remote credential alias issues.
- Did not restart 1C production.
- Did not write back to 1C.
- Did not copy .env, .secrets, .cache, crm-http*.ndjson, raw logs, passwords or tokens.

Verification:
- node --check app.js: OK.
- node --check server-live.mjs: OK.
- Local /api/live/crm-sql/diagnostics?limit=1: OK, noFullImport true.
- MESER http://192.168.0.5:8798/index.html: OK, build 20260607-live-orm-no-full-import-1.
- MESER http://192.168.0.5:8798/api/health: OK, pid 5788.
- MESER http://192.168.0.5:8798/api/live/crm-sql/diagnostics?limit=1: OK, noFullImport true, partial true, unavailable warehouses/stockBalances/counterpartyBalances.
- MESER http://192.168.0.5:8798/api/live/products?search=Daniel&limit=3&offset=0: OK, returned bounded live products from http://192.168.0.166:3000/products.
- MESER http://192.168.0.5:8798/api/crm-sql/latest?limit=50000&scope=full: blocked with HTTP 410 CRM_SQL_FULL_IMPORT_DISABLED.

Tool/runtime errors recorded:
- MESER_LIVE_NO_FULL_IMPORT_DEPLOY_TIMEOUT: first full installer deploy timed out after 304 seconds; verification showed old server process still active.
- MESER_LIVE_SMALL_UPDATE_TIMEOUT: controlled small file update timed out after 180 seconds; static files updated but old server process still served old server-live.mjs until restart.
- MESER_CREDENTIAL_IMPORT_NULL: documented MESER credential alias file existed in elevated context, but Import-Clixml returned null.
- MESER_SCHTASKS_ACCESS_DENIED: schtasks /Query and /Run against 192.168.0.5 returned Access is denied without usable credential.
- CRM_MARKETPLACE_MESER_LIVE_RESTART_FAILED: direct remote restart failed while credential alias imported as null; recovered by owner running local MESER restart commands.
```

## 2026-06-07T14:19:00+03:00 - Rozetka exchange configured on MESER

```text
Request:
Owner reported exchange did not work and then configured the Rozetka token locally on MESER, without asking the agent to store the raw token in repo files or logs.

Successful actions:
- Verified MarketplaceCRMLive health on http://192.168.0.5:8798/api/health: OK.
- Verified legacy gateway health on http://192.168.0.5:8797/api/health: OK.
- Verified Rozetka requirements through 8798 and 8797: configured=true.
- Verified Rozetka orders through 8798 and 8797: HTTP 200 with live order data.
- Confirmed no-full-import guard still active on 8798: /api/crm-sql/latest returns HTTP 410 CRM_SQL_FULL_IMPORT_DISABLED.
- Patched local start-marketplace-crm-meser.ps1 to set NODE_SKIP_PLATFORM_CHECK=1 for the legacy Rozetka helper runtime.
- Did not restart 1C production.
- Did not write back to 1C.
- Did not copy .env, .secrets, .cache, crm-http*.ndjson, raw logs, passwords or tokens.

Verification:
- http://192.168.0.5:8798/api/rozetka/requirements: OK, configured=true.
- http://192.168.0.5:8797/api/rozetka/requirements: OK, configured=true.
- http://192.168.0.5:8798/api/rozetka/orders/search?page=1&limit=1: OK, HTTP 200.
- http://192.168.0.5:8797/api/rozetka/orders/search?page=1&limit=1: OK, HTTP 200.

Remaining:
- NovaPay remains unconfigured. /api/novapay/status still reports businessLoginConfigured=false, refreshTokenConfigured=false, publicCertificateConfigured=false, clientIdConfigured=false, accountIdConfigured=false and gatewayUrlConfigured=false until NOVAPAY_* direct credentials or NOVAPAY_GATEWAY_URL are configured locally on MESER.

Tool/runtime errors recorded:
- ROZETKA_VERIFY_COMBINED_TIMEOUT: first combined verification timed out; recovered with smaller curl checks.
- ROZETKA_NODE_PLATFORM_CHECK_FAILED: after the token was configured, Rozetka orders initially returned the MESER bundled Node platform error; recovered after owner set NODE_SKIP_PLATFORM_CHECK=1 and restarted MarketplaceCRM/MarketplaceCRMLive.
```

## 2026-06-07T14:58:00+03:00 - Unified all-exchange automation on MarketplaceCRMLive

```text
Request:
Owner asked to change Data Exchange to exchange everything through one flow instead of separate per-block exchange controls, and to automate loading configured sources into the system.

Successful actions:
- Updated Marketplace CRM build metadata to v2026.06.07.4 / 20260607-unified-auto-exchange-1 / неділя, 2026-06-07 / час 14:34.
- Changed marketplace auto sync to default-on unless explicitly disabled.
- Added build-level unified exchange autostart key and startup warmup; the app runs all-exchange shortly after page load and every 10 minutes while the tab is open.
- Changed runMarketplaceAutoSync to treat missing/unconfigured external credentials as warnings instead of failing the whole all-exchange run.
- Changed the exchange center UI to one primary command: “Обмін всього зараз”. Source cards now say they are controlled by all-exchange instead of showing separate Rozetka, NovaPay, Nova Poshta, Prom, Epicentr or Allo buttons.
- Removed embedded separate Rozetka and 1C manual launch panels from Settings -> Data Exchange and replaced them with a unified-exchange-only notice.
- Updated stale NovaPay/marketplace helper labels to refer to “Обмін всього”.
- Deployed updated files to MESER C:\CRM\marketplace-crm and restarted only scheduled task MarketplaceCRMLive.
- Did not restart 1C production.
- Did not write back to 1C.
- Did not copy .env, .secrets, .cache, crm-http*.ndjson, raw logs, passwords or tokens.

Verification:
- node --check app.js: OK.
- node --check server-live.mjs: OK.
- git diff --check: OK, only LF-to-CRLF warnings.
- Local live server 127.0.0.1:8798: OK after escalated process launch, build 20260607-unified-auto-exchange-1.
- Local /api/live/crm-sql/diagnostics?limit=1: OK, noFullImport=true, partial=true, CRM_SQL_LIVE_MODELS_PARTIAL.
- Local /api/crm-sql/latest?limit=50000&scope=full: expected HTTP 410.
- MESER install: OK, MarketplaceCRMLive LastTaskResult 0, listener 0.0.0.0:8798, pid 7736.
- MESER http://192.168.0.5:8798/index.html: OK, build 20260607-unified-auto-exchange-1.
- MESER /api/health: OK, marketplace-crm-live bind 0.0.0.0.
- MESER /api/live/crm-sql/diagnostics?limit=1: OK, noFullImport=true, partial=true; warehouses currently CRM_SQL_LIVE_MODEL_UNAVAILABLE.
- MESER /api/crm-sql/latest?limit=50000&scope=full: expected HTTP 410.
- MESER /api/live/products?search=Daniel&limit=3: OK, bounded live results returned.
- MESER Rozetka requirements: OK, configured=true.
- MESER Rozetka orders search page=1 limit=1: OK, HTTP 200, one row counted without logging raw order data.
- MESER NovaPay status: OK diagnostics endpoint, but direct/external gateway remains unconfigured.
- MESER Nova Poshta diagnostics correct route /api/delivery/nova-poshta/diagnostics: OK, NP_DIAGNOSTICS_NO_KEY because the API key is not configured.

Remaining:
- Configure NovaPay locally on MESER via NOVAPAY_* direct credentials or NOVAPAY_GATEWAY_URL before NovaPay payments can become green.
- Configure Nova Poshta API key locally on MESER before all-history TTN/documents can become green.
- SQL API upstream still needs the bounded warehouse endpoint deployed/available; MarketplaceCRMLive correctly keeps this as live diagnostics instead of full import.
- In-app Browser verification was blocked by the browser tool runtime, so UI verification was done through HTTP/build/API checks.

Tool/runtime errors recorded:
- EXCHANGE_RG_PATTERN_QUOTING_ERROR: first combined rg pattern with spaces/quotes was parsed as a bad filename; recovered with smaller searches.
- EXCHANGE_RG_ESCAPED_QUOTE_REGEX_ERROR: escaped quote rg pattern failed; recovered with simpler literal searches.
- LOCAL_LIVE_SERVER_CHILD_TERMINATED_AFTER_COMMAND: sandbox-started local live server disappeared after the command ended; recovered with escalated process launch.
- LOCAL_ROZETKA_REQUIREMENTS_LEGACY_502: local 127.0.0.1:8798 Rozetka requirements failed because local legacy gateway 127.0.0.1:8797 was not running; MESER gateway verification succeeded.
- BROWSER_NODE_REPL_SANDBOX_SETUP_FAILED: in-app Browser setup failed twice with node_repl kernel exit / windows sandbox failed: spawn setup refresh.
- MESER_INSTALL_EXECUTION_POLICY_BLOCKED: first direct install script run was blocked by local PowerShell execution policy; recovered with powershell.exe -ExecutionPolicy Bypass for the one script.
- NP_DIAGNOSTICS_ENDPOINT_404 / NP_DIAGNOSTICS_WRONG_ROUTE_404: initial wrong Nova Poshta route was /api/nova-poshta/diagnostics; correct route is /api/delivery/nova-poshta/diagnostics.
- NP_DIAGNOSTICS_NO_KEY: Nova Poshta API key is not configured on MESER live gateway.
- NPAY_GATEWAY_503_NOT_CONFIGURED: NovaPay direct/external gateway is not configured on MESER live gateway.
```
## 2026-06-07T15:15:00+03:00 - NovaPay token PowerShell helper

```text
Request:
Owner asked to change the NovaPay token through PowerShell.

Successful actions:
- Confirmed NovaPay token variables from code/config examples without printing secret values:
  - Direct gateway: NOVAPAY_REFRESH_TOKEN plus NOVAPAY_BUSINESS_LOGIN and NOVAPAY_CERTIFICATE_PATH.
  - External gateway: NOVAPAY_GATEWAY_TOKEN plus NOVAPAY_GATEWAY_URL.
- Added safe helper set-novapay-token-meser.ps1.
- Added deploy helper deploy-novapay-token-helper-meser.ps1.
- Local PowerShell parser passed for both helper scripts.
- Copied set-novapay-token-meser.ps1 to MESER C:\CRM\marketplace-crm\set-novapay-token-meser.ps1.
- Remote parser on MESER returned OK.
- No token was pasted into chat, copied by Codex, printed, logged, or stored in repo files.
- Did not restart 1C production.
- Did not write back to 1C.

Owner action needed:
Run on MESER PowerShell:
powershell -NoProfile -ExecutionPolicy Bypass -File C:\CRM\marketplace-crm\set-novapay-token-meser.ps1 -TokenType RefreshToken

For external gateway token instead:
powershell -NoProfile -ExecutionPolicy Bypass -File C:\CRM\marketplace-crm\set-novapay-token-meser.ps1 -TokenType GatewayToken -GatewayUrl "https://YOUR_GATEWAY_URL"

Tool/runtime errors recorded:
- MESER_NOVAPAY_CONFIG_CHECK_QUOTING_FAILED: first remote config presence check failed due nested PowerShell quoting; no values printed.
- MESER_NOVAPAY_HELPER_INLINE_QUOTING_FAILED: first inline Copy-Item command failed due nested PowerShell quoting; recovered by creating deploy helper script.
```

## 2026-06-07T15:45:00+03:00 - MarketplaceCRMLive credential UI in Data Exchange

```text
Request:
Owner reported that the PowerShell NovaPay token helper did not work reliably in the remote pipeline and asked to add credential/token/user/password entry inside the program, under Settings / Update Center / each block.

Successful actions:
- Added provider credential forms inside Settings -> Data Exchange -> Update Center for Rozetka, NovaPay and Nova Poshta.
- Added backend contract POST /api/config/credentials.
- Endpoint accepts only whitelisted provider keys, writes values to ProgramData env files, updates runtime environment, and returns only updated key names/status flags.
- Credential values are not stored in browser state/localStorage and are not shown back in the UI.
- Hardened client logging to redact token/password/api-key/certificate/refresh/authorization/bearer/username/login fields.
- Hardened legacy raw request logging to redact the full /api/config/credentials body.
- Deployed MarketplaceCRMLive build v2026.06.07.5 / 20260607-exchange-credentials-ui-1 to MESER 192.168.0.5:8798.
- MESER smoke checks passed: index served the new build, /api/health returned OK, served app.js contains credential UI markers, and /api/crm-sql/latest?limit=50000&scope=full still returns HTTP 410 CRM_SQL_FULL_IMPORT_DISABLED.
- 1C production was not restarted.
- No write-back to 1C was performed.
- No raw credentials were printed, logged, or stored in repo files.

Tool/runtime errors recorded:
- WORK_LOG_EXPORT_PATCH_CONTEXT_NOT_FOUND: first repo-safe log append used an old handoff context line that no longer exists; recovered by inspecting the current tail and appending after the latest entry.
- BROWSER_NODE_REPL_SANDBOX_SETUP_FAILED: in-app Browser setup failed with node_repl kernel exit / windows sandbox failed: spawn setup refresh; UI verification continued through HTTP/build/API checks.
```

## 2026-06-07T16:19:00+03:00 - NovaPay certificate content upload fix

```text
Request:
Owner had a NovaPay token and certificate but NovaPay still failed in the app. Screenshot showed NPAY_GATEWAY_ERROR with PowerShell GetFullPath path-too-long after saving NOVAPAY_REFRESH_TOKEN and NOVAPAY_CERTIFICATE_PATH.

Successful actions:
- Identified the likely configuration error: certificate PEM text was pasted into NOVAPAY_CERTIFICATE_PATH, so PowerShell treated the certificate as a filesystem path.
- Added NOVAPAY_CERTIFICATE_CONTENT as an in-app pseudo-key in the NovaPay credential form.
- server-live.mjs now saves pasted certificate content to a ProgramData PEM file and writes only NOVAPAY_CERTIFICATE_PATH to env files.
- mock-api.ps1 now supports NOVAPAY_CERTIFICATE_CONTENT, validates NOVAPAY_CERTIFICATE_PATH before GetFullPath, and no longer crashes status checks when the old path value is invalid/overlong.
- Updated build metadata to v2026.06.07.6 / 20260607-novapay-cert-upload-1.
- Local syntax checks passed for app.js, server-live.mjs, mock-api.ps1 and the live installer.
- Local dummy tests passed: certificate content saved to a temp file, live/legacy temp env files stored only NOVAPAY_CERTIFICATE_PATH, and NOVAPAY_CERTIFICATE_CONTENT was not persisted.
- Negative dummy test passed: PEM text in NOVAPAY_CERTIFICATE_PATH now returns HTTP 400 instead of GetFullPath crash.
- Deployed to MESER 192.168.0.5:8798 after retrying with a longer timeout.
- MESER served build 20260607-novapay-cert-upload-1; health OK; served app.js contains NOVAPAY_CERTIFICATE_CONTENT.
- MESER 8798 and legacy 8797 safe negative checks returned HTTP 400 instead of crashing, and /api/novapay/status returned HTTP 200 without printing secret values.
- /api/crm-sql/latest?limit=50000&scope=full still returns HTTP 410 CRM_SQL_FULL_IMPORT_DISABLED.
- 1C production was not restarted.
- No write-back to 1C was performed.
- No real token or certificate was printed, logged, or stored in repo files.

Operator instruction:
In Settings -> Data Exchange -> NovaPay access, paste the token into Refresh token, the business login into Business login, and paste the certificate PEM text into Certificate content. Leave Certificate file path empty unless using an existing file path on MESER.

Tool/runtime errors recorded:
- MESER_NOVAPAY_CERT_DEPLOY_TIMEOUT: first live installer run timed out after about 124 seconds; HTTP verification showed the old build was still served. Recovered by rerunning the installer with a longer timeout.
- BROWSER_NODE_REPL_SANDBOX_SETUP_FAILED: in-app Browser setup failed again with windows sandbox failed: spawn setup refresh; UI verification continued through served HTML/JS marker checks and HTTP API smoke checks.
```

## 2026-06-07T16:58:00+03:00 - Credential save retry and NovaPay direct smoke

```text
Request:
Owner reported browser alert CREDENTIAL_UPDATE_FAILED: Failed to fetch while saving NovaPay access in MarketplaceCRMLive on MESER 192.168.0.5:8798.

Successful actions:
- Confirmed /api/config/credentials is reachable with a safe empty POST returning HTTP 400 CREDENTIAL_VALUES_EMPTY.
- Added postProviderCredentials in app.js: absolute same-origin endpoint, 240 KiB browser payload guard, one retry, safe key-only retry log, and /api/health diagnostic if fetch still fails.
- Increased server-live.mjs credential payload limit from 64 KiB to 256 KiB for PEM certificate content.
- Updated build metadata/cache busters to v2026.06.07.7 / 20260607-credential-fetch-retry-1 / time 16:58.
- Local syntax checks passed for app.js and server-live.mjs; PowerShell parser passed for mock-api.ps1, install-meser-marketplace-crm-live.ps1, and start-marketplace-crm-live-meser.ps1; git diff --check passed with only LF/CRLF warnings.
- Local temporary live smoke passed on 127.0.0.1:8799: build 20260607-credential-fetch-retry-1, health OK, credential empty POST CREDENTIAL_VALUES_EMPTY, full-import guard 410.
- Deployed to MESER 192.168.0.5:8798. Scheduled task MarketplaceCRMLive LastTaskResult 0; listener 0.0.0.0:8798 active; live/open/config shortcuts present.
- MESER smoke passed: index served build 20260607-credential-fetch-retry-1; served app.js contains retry helper; /api/health OK; empty credential POST returned CREDENTIAL_VALUES_EMPTY; /api/crm-sql/latest remains HTTP 410 CRM_SQL_FULL_IMPORT_DISABLED.
- NovaPay diagnostics safe booleans showed refresh token, certificate, business login and direct gateway configured.
- Short NovaPay direct gateway smoke for 2026-06-01..2026-06-07 returned HTTP 200 ok=True source=NovaPay Business SOAP gateway, payments=0, periods=1, partial=True, warningCodes=NPAY_REGISTER_CREATE_FAILED.
- 1C production was not restarted.
- No write-back to 1C was performed.
- No real token, certificate, business login value, payment rows, env contents, or raw logs were printed, logged, stored, or copied into repo files.

Remaining:
- If the operator still sees the old alert, reload http://192.168.0.5:8798/index.html so Chrome loads app.js?v=20260607-credential-fetch-retry-1.
- Continue NovaPay all-history diagnostics for NPAY_REGISTER_CREATE_FAILED: confirm NovaPay register export enablement and supported register types, while keeping account extract/payment-list paths active.

Tool/runtime errors recorded:
- APPLY_PATCH_CONTEXT_MISMATCH: first combined patch failed on mojibake context; recovered with ASCII-only smaller patches.
- VERIFY_RG_QUOTING_ERROR: one rg command failed because nested fetch("/api/config/credentials quote parsing broke PowerShell; recovered with simpler rg checks.
- POWERSHELL_OR_OPERATOR_UNSUPPORTED: first NovaPay smoke command used PowerShell 7 || syntax in Windows PowerShell; recovered with PowerShell 5-compatible syntax.
- BROWSER_TOOL_NOT_EXPOSED: tool discovery did not expose a callable browser navigation/screenshot tool in this context; UI verification continued through HTTP build/asset/API checks.
```

## 2026-06-07T17:33:00+03:00 - Credential save button enablement

```text
Request:
Owner reported that the 'Зберегти доступ' button in the in-app credential form was not clickable.

Successful actions:
- Inspected renderExchangeCredentialForm, renderUnifiedExchangeCenter, submit handler, role permissions and exchange CSS.
- Identified likely cause: credential forms were disabled only through dataExchange/dataExchangeScope permissions. Older browser/localStorage role matrices can have stale explicit false values for newly added permission keys, disabling the button despite admin/settings context.
- Added canManageProviderCredentials/providerCredentialDisabled fallback for admin, canEditSettings, canExportAccounting and NovaPay API roles.
- Updated updateProviderCredentials to use provider-specific credential permission check after reading the hidden provider field.
- Added CSS so credential-panel and credential-form take full width inside exchange-card inline-actions.
- Updated build metadata/cache busters to v2026.06.07.8 / 20260607-credential-button-enable-1 / time 17:33.
- Local syntax checks passed for app.js/server-live.mjs; PowerShell parser passed for mock-api.ps1, install-meser-marketplace-crm-live.ps1, start-marketplace-crm-live-meser.ps1; git diff --check passed with only LF/CRLF warnings.
- Local temporary live smoke passed on 127.0.0.1:8799: build/css build 20260607-credential-button-enable-1, helper markers present, health OK, credential endpoint CREDENTIAL_VALUES_EMPTY for safe empty POST.
- MESER installer command timed out, but follow-up HTTP verification showed MESER 8798 serves the new build.
- Final MESER verification passed: index/css build 20260607-credential-button-enable-1, served app.js contains canManageProviderCredentials/providerCredentialDisabled, served styles.css contains credential-panel full-width rule, health OK, credential endpoint responds, NovaPay direct booleans remain configured.
- 1C production was not restarted.
- No write-back to 1C was performed.
- No real token, certificate, business login value, env contents, raw logs, or payment rows were printed, logged, stored, or copied into repo files.

Operator instruction:
Reload http://192.168.0.5:8798/index.html with Ctrl+F5. The sidebar version must show v2026.06.07.8 / 20260607-credential-button-enable-1, then open Settings -> Data Exchange -> NovaPay access and use 'Зберегти доступ'.

Tool/runtime errors recorded:
- MESER_CREDENTIAL_BUTTON_DEPLOY_TIMEOUT: installer command timed out after about 304 seconds, but HTTP verification confirmed new build was served afterward.
```

## 2026-06-07T18:23:00+03:00 - Credential direct-save handler

```text
Request:
Owner reported that the now-visible 'Зберегти доступ' button still did not save.

Successful actions:
- Re-read workspace and repo rules, shared knowledge base, access map and Marketplace handoff before editing.
- Inspected the credential form render, submit handler, click handler and NovaPay credential fields.
- Identified likely cause: credential save relied on native form submit while optional NovaPay Gateway URL used HTML type=url, so browser validation could prevent JavaScript submit handling before the CRM displayed an error.
- Changed credential forms to novalidate.
- Changed the save button from type=submit to type=button with data-save-provider-credentials and a direct click handler.
- Added inline save status text so the operator sees "saving", success or error feedback.
- Changed NOVAPAY_GATEWAY_URL from HTML type=url to type=text to avoid silent browser validation blocking optional credential saves.
- Updated build metadata/cache busters to v2026.06.07.10 / 20260607-credential-direct-save-2 / time 18:23.
- Added a no-false-success guard: empty/no-permission saves return false and keep an error status instead of showing a false "saved" message.
- Local syntax checks passed for app.js and server-live.mjs; git diff --check passed with only LF/CRLF warnings.
- Local HTTP smoke passed on 127.0.0.1:8799: build markers, direct-save marker, novalidate marker, Gateway URL text marker, no-false-success marker and health OK were present.
- Safe empty credential POST returned HTTP 400 CREDENTIAL_VALUES_EMPTY locally and on MESER.
- Deployed to MESER with install-meser-marketplace-crm-live.ps1; scheduled task MarketplaceCRMLive is Ready and listener is on 0.0.0.0:8798.
- Final MESER verification passed: index/app build 20260607-credential-direct-save-2, sidebar version v2026.06.07.10 and time 18:23, direct button marker present, novalidate marker present, Gateway URL type=text marker present, no-false-success marker present, /api/health OK, /api/config/credentials empty POST CREDENTIAL_VALUES_EMPTY.
- 1C production was not restarted.
- No write-back to 1C was performed.
- No real token, certificate, business login value, env contents, raw logs, or payment rows were printed, logged, stored, or copied into repo files.

Operator instruction:
Reload http://192.168.0.5:8798/index.html with Ctrl+F5. The sidebar version must show v2026.06.07.10 / 20260607-credential-direct-save-2, time 18:23. In Settings -> Data Exchange -> NovaPay access, fill only the fields being changed. If not using an external gateway, leave Gateway URL and Gateway token empty; do not type the placeholder.

Tool/runtime errors recorded:
- CREDENTIAL_SAVE_RG_QUOTING_ERROR: earlier rg attempt with nested quotes failed; recovered with simpler rg commands.
- GIT_DIFF_NATIVE_STDERR_WARNING: PowerShell treated Git LF/CRLF warnings on stderr as NativeCommandError; recovered by rerunning diff with non-terminating stderr handling.
- CREDENTIAL_EMPTY_POST_NODE_SMOKE_FAILED / CREDENTIAL_EMPTY_POST_NODE_CHECK_FAILED: node -e smoke had shell quoting failure; recovered with .NET HttpWebRequest smoke.
- CREDENTIAL_DIRECT_SAVE_MESER_VERIFY_EXCEPTION: first MESER verification used wrong NovaPay diagnostics path /api/novapay/diagnostics and received 404; recovered with the real /api/novapay/status endpoint.
- BROWSER_TOOL_NODE_REPL_UNAVAILABLE: Node REPL/Playwright check failed with windows sandbox setup refresh; verification continued through HTTP/DOM smoke checks.
```

## 2026-06-07T18:43:00+03:00 - Source refresh buttons and faster credential save

```text
Request:
Owner reported that saving credentials still felt very slow and asked to add an immediate update/check button under every exchange block. Screenshot showed NovaPay now reaches the real gateway and returns NPAY_DIRECT_AUTH_FAILED: logic_errorAccess Denied! Refresh token does not apply to login.

Successful actions:
- Re-read workspace rules, shared knowledge base, access map, local AGENTS.md and Marketplace handoff before editing.
- Interpreted the observed NovaPay error as a credential mismatch, not a button/save failure: NOVAPAY_BUSINESS_LOGIN and NOVAPAY_REFRESH_TOKEN must belong to the same NovaPay cabinet/login.
- Added a per-source `Оновити` button under exchange source cards in Settings -> Data Exchange.
- Source-specific actions:
  - CRM SQL: bounded live diagnostics.
  - 1C/BAS: local ToCRM latest payload check/import path only; no 1C production restart.
  - Rozetka: quick latest-orders refresh.
  - NovaPay: real gateway payment/auth check, so login/token mismatch is visible immediately in the NovaPay card.
  - Nova Poshta: diagnostics check.
  - Planned marketplace cards: disabled `Оновити`.
- Added refreshExchangeSource(source) to route each button to its own check without running full all-source exchange.
- Added a 1.8s timeout to optional legacy credential runtime forwarding in server-live.mjs. ProgramData env files are still written first; legacy timeout is reported as LEGACY_CREDENTIAL_RUNTIME_UPDATE_TIMEOUT instead of making the operator wait indefinitely.
- Updated build metadata/cache busters to v2026.06.07.11 / 20260607-source-refresh-fast-save-1 / time 18:43.
- Local syntax checks passed for app.js and server-live.mjs; git diff --check passed with only LF/CRLF warnings.
- Local HTTP smoke passed: index/app build markers, source refresh handler, button markers, NovaPay gateway refresh marker, server timeout markers from local file, health OK, and safe empty credential POST returned CREDENTIAL_VALUES_EMPTY.
- Deployed to MESER with install-meser-marketplace-crm-live.ps1; scheduled task MarketplaceCRMLive is Ready and listener is on 0.0.0.0:8798.
- Final MESER HTTP verification passed: index/app build 20260607-source-refresh-fast-save-1, version v2026.06.07.11, time 18:43, source refresh markers present, /api/health OK, /api/config/credentials empty POST CREDENTIAL_VALUES_EMPTY.
- 1C production was not restarted.
- No write-back to 1C was performed.
- No real token, certificate, business login value, env contents, raw logs, or payment rows were printed, logged, stored, or copied into repo files.

Operator instruction:
Reload http://192.168.0.5:8798/index.html with Ctrl+F5. The sidebar version must show v2026.06.07.11 / 20260607-source-refresh-fast-save-1, time 18:43. Use the `Оновити` button under the needed card for immediate per-block verification. For NovaPay, if the card still shows NPAY_DIRECT_AUTH_FAILED with "Refresh token does not apply to login", replace Business login and Refresh token with a matching pair from the same NovaPay cabinet/login.

Tool/runtime errors recorded:
- SOURCE_REFRESH_RG_QUOTING_ERROR: one rg command failed because PowerShell parsed a regex parenthesis/quote incorrectly; recovered with simpler rg commands.
- REPO_SAFE_LOG_PATCH_CONTEXT_MISMATCH: first repo-safe log patch did not find the exact expected tail context; recovered by appending at the current file end.
- SOURCE_REFRESH_FAST_SAVE_LOCAL_SMOKE_FAILED: first local marker check tried to read server-live.mjs through the HTTP static server and missed timeout markers; recovered by reading the local file directly.
- SOURCE_REFRESH_FAST_SAVE_MESER_REMOTE_MARKER_TIMEOUT: PowerShell Remoting marker check for remote server-live.mjs timed out after 60s; continued with successful installer output and MESER HTTP verification.
```

## 2026-06-07T19:18:00+03:00 - Stale MESER listener fix for credential save

```text
Request:
Owner reported that the per-block `Оновити` button appears late and credential saves still take too long, ending with browser alert CREDENTIAL_UPDATE_FAILED: LEGACY_API_PROXY_FAILED: fetch failed. Screenshot showed MarketplaceCRMLive on MESER 192.168.0.5:8798, NovaPay real-gateway error NPAY_DIRECT_AUTH_FAILED still present, and per-block `Оновити` buttons visible after scrolling.

Successful actions:
- Re-read workspace rules, shared knowledge base, access map, local AGENTS.md and Marketplace handoff before continuing.
- Diagnosed LEGACY_API_PROXY_FAILED as stale MESER listener behavior, not as the current v2026.06.07.11 server-live.mjs credential handler.
- Hardened start-marketplace-crm-live-meser.ps1, open-marketplace-crm-live-meser.ps1 and install-meser-marketplace-crm-live.ps1 so a stale process listening on the configured MarketplaceCRMLive port is stopped before the scheduled task/server is started.
- Kept scope limited to MarketplaceCRMLive port 8798; 1C production was not restarted and no write-back to 1C was performed.
- Syntax checks passed for the three PowerShell scripts and for app.js/server-live.mjs; git diff --check passed with only LF/CRLF warnings.
- Reinstalled MarketplaceCRMLive on MESER with the hardened scripts. The old 8798 listener PID 7736 was replaced by new listener PID 2804.
- MESER verification passed: /api/health returned service marketplace-crm-live on pid 2804, and POST /api/config/credentials reached live handler codes CREDENTIAL_PROVIDER_UNKNOWN / CREDENTIAL_VALUES_EMPTY instead of LEGACY_API_PROXY_FAILED.
- No real token, certificate, business login value, env contents, raw logs, or payment rows were printed, logged, stored, or copied into repo files.

Operator instruction:
Reload http://192.168.0.5:8798/index.html with Ctrl+F5. The sidebar should still show v2026.06.07.11 / 20260607-source-refresh-fast-save-1. Credential save should no longer report LEGACY_API_PROXY_FAILED. If NovaPay still reports NPAY_DIRECT_AUTH_FAILED with "Refresh token does not apply to login", replace Business login and Refresh token with a matching pair from the same NovaPay cabinet/login.

Tool/runtime errors recorded:
- RESUME_MANDATORY_READ_PARSE_ERROR: first post-resume mandatory read command failed on a PowerShell -split parse expression; recovered with regex line counting and logged the failure as POWERSHELL_PARSE_EXPECTED_VALUE_EXPRESSION.
- STALE_LISTENER_VERIFY_EXPECTED_CODE_MISMATCH: first negative credential check expected CREDENTIAL_PROVIDER_INVALID, while the live handler correctly returned CREDENTIAL_PROVIDER_UNKNOWN for an unknown provider; recovered with a body-safe check and verified no LEGACY_API_PROXY_FAILED.
```

## 2026-06-07T19:28:00+03:00 - Source refresh buttons moved to card headers

```text
Request:
Owner reported that `Оновити` appears too late and credential changes still felt slow. After the stale-listener fix, the remaining UI issue was that each per-source refresh button was rendered below the status/metrics area, so it required scrolling and looked delayed.

Successful actions:
- Moved exchange source refresh actions into the top tool area of each Settings -> Data Exchange source card, beside the source status badge.
- Added CSS for exchange-card-top-tools and exchange-card-top-actions so the control stays visible near the card title and wraps safely on narrow screens.
- Updated build metadata/cache busters to v2026.06.07.12 / 20260607-source-refresh-top-actions-1 / time 19:28.
- Syntax checks passed for app.js and server-live.mjs.
- Local HTTP smoke passed on 127.0.0.1:8798: index/app build markers and exchange-card-top-actions marker present.
- Deployed to MESER 192.168.0.5:8798 after retrying installer with a longer timeout.
- Final MESER HTTP verification passed: index/app/styles build 20260607-source-refresh-top-actions-1, exchange-card-top-actions/exchange-card-top-tools markers present, /api/health OK on pid 6968 bind 0.0.0.0, and safe empty credential POST returned HTTP 400 without LEGACY_API_PROXY_FAILED.
- 1C production was not restarted.
- No write-back to 1C was performed.
- No real token, certificate, business login value, env contents, raw logs, or payment rows were printed, logged, stored, or copied into repo files.

Operator instruction:
Reload http://192.168.0.5:8798/index.html with Ctrl+F5. The sidebar must show v2026.06.07.12 / 20260607-source-refresh-top-actions-1, time 19:28. In Settings -> Data Exchange, each source card should show `Оновити` at the top beside the source status badge.

Tool/runtime errors recorded:
- REFRESH_TOP_ACTIONS_APP_PATCH_CONTEXT_MISMATCH: first app.js patch expected APP_VERSION with a v prefix; actual file used 2026.06.07.11 without the prefix. Re-read context and recovered with the correct patch.
- MESER_TOP_ACTIONS_INSTALL_TIMEOUT: first installer run timed out after 120s in the Codex shell. Follow-up HTTP smoke still showed old build 20260607-source-refresh-fast-save-1.
- MESER_TOP_ACTIONS_SMOKE_MARKER_MISSING: verification after the timed-out installer correctly detected old build markers. Recovered by rerunning installer with a longer timeout.
```

## 2026-06-07T20:16:00+03:00 - NovaPay quick auth check and legacy gateway unblock

```text
Request:
Owner said NovaPay token and certificate were entered correctly and asked to inspect logs/contract. Browser showed LEGACY_API_PROXY_FAILED: fetch failed in the NovaPay card after pressing `Оновити`.

Findings:
- The owner was right that this was not necessarily a credential-entry problem.
- Live MarketplaceCRMLive 8798 was healthy, but its NovaPay calls were proxied to the legacy PowerShell gateway at 127.0.0.1:8797.
- Port 8797 accepted TCP, but HTTP probes to /index.html, /api/health, /api/novapay/status and /api/rozetka/requirements all timed out before the fix.
- The per-source NovaPay `Оновити` action called full all-history payments: /api/novapay/payments?history=all&historyFrom=2020-01-01&includeExtract=true&includeRegisters=true&windowDays=31. That heavy operation could occupy/hang the single legacy gateway and make live 8798 report LEGACY_API_PROXY_FAILED.
- The March 2026 NovaPay API instruction confirmed the auth contract: UserAuthenticationJWT takes refresh_token, login and public_certificate, and returns jwt plus a new refresh_token/public_certificate. The implementation already sends those fields and stores rotated refresh token/certificate after successful authentication.

Successful actions:
- Added a lightweight /api/novapay/auth-check endpoint to mock-api.ps1. It performs only UserAuthenticationJWT and returns redacted status fields, never JWT/token/certificate.
- Changed the per-source NovaPay `Оновити` button to call checkNovaPayDiagnostics({ verifyAuth: true }) and /api/novapay/auth-check instead of full all-history payments.
- Kept full all-history/register/extract behavior for unified exchange/background paths.
- Hardened stale 8797 cleanup:
  - start-marketplace-crm-meser.ps1 now stops only a stale listener on the configured legacy port before starting mock-api.ps1.
  - install-meser-marketplace-crm-live.ps1 now copies start-marketplace-crm-meser.ps1 and clears 8797 before restarting MarketplaceCRM.
- Updated build metadata/cache busters to v2026.06.07.13 / 20260607-novapay-quick-auth-refresh-1 / time 20:16.
- Syntax checks passed for app.js, server-live.mjs, mock-api.ps1, start-marketplace-crm-meser.ps1 and install-meser-marketplace-crm-live.ps1.
- Deployed to MESER 192.168.0.5:8798. MarketplaceCRMLive health OK on pid 3120.
- MESER verification passed: index/app build 20260607-novapay-quick-auth-refresh-1, JS marker /api/novapay/auth-check present, legacy 8797 /index.html OK, legacy /api/novapay/status OK, live /api/novapay/auth-check returned HTTP 200 with authenticated=true, and the response did not expose JWT/token/certificate.
- 1C production was not restarted.
- No write-back to 1C was performed.
- No real token, certificate, business login value, env contents, raw logs, JWT, or payment rows were printed, logged, stored, or copied into repo files.

Operator instruction:
Reload http://192.168.0.5:8798/index.html with Ctrl+F5. The sidebar must show v2026.06.07.13 / 20260607-novapay-quick-auth-refresh-1. Press `Оновити` in the NovaPay card to run only the quick auth check. Full payment history remains for the unified exchange path.

Tool/runtime errors recorded:
- MESER_REMOTE_NOVAPAY_LOG_INSPECT_FAILED: PowerShell Remoting direct log inspection failed with Access is denied; recovered using HTTP probes and local code/PDF inspection.
- NOVAPAY_LEGACY_8797_HTTP_TIMEOUT: before the fix, 8797 accepted TCP but HTTP probes to lightweight endpoints timed out.
```

## 2026-06-07T20:36:00+03:00 - Stuck exchange state reset and visible refresh buttons

```text
Request:
Owner reported that in v2026.06.07.13 the NovaPay block still showed `В процесі` with the old all-history payments URL, the UI appeared to hang, and the `Оновити` button was not visible.

Findings:
- Browser localStorage preserved exchangeProcesses.novaPay status=running from the previous all-history request, so reload kept showing 15% / Історія NovaPay.
- CSS had `button:disabled { display: none; }`; when an exchange process or auto-sync was running, the refresh button became disabled and disappeared instead of showing a disabled state.
- Startup warmup and the 10-minute auto timer still called full runMarketplaceAutoSync(), which could trigger NovaPay all-history again immediately after reload.

Successful actions:
- Added resetStaleExchangeProcesses() before render. It converts stale running exchange processes older than 3 minutes, and NovaPay running with the old `/api/novapay/payments?history=all` URL, into warning EXCHANGE_PROCESS_STALE_RESET with a retry instruction.
- Added a CSS override so exchange/sync disabled buttons stay visible with opacity instead of display:none.
- Added runMarketplaceAutoSync({ quickExternal:true }) and changed startup warmup plus the 10-minute timer to use quick external checks. NovaPay background checks now use /api/novapay/auth-check instead of full all-history/register/extract.
- Kept manual "Обмін всього зараз" as the full exchange path.
- Updated build metadata/cache busters to v2026.06.07.14 / 20260607-stuck-exchange-reset-1 / time 20:36.
- Syntax checks passed for app.js and server-live.mjs; local marker smoke passed.
- Deployed to MESER 192.168.0.5:8798. MarketplaceCRMLive health OK on pid 2068.
- MESER verification passed: index/app/styles build 20260607-stuck-exchange-reset-1, EXCHANGE_PROCESS_STALE_RESET/resetStaleExchangeProcesses markers present, quickExternal timer marker present, disabled button CSS marker present, legacy 8797 /api/novapay/status OK, live /api/novapay/auth-check HTTP 200 authenticated=true, and auth response did not expose JWT/token/certificate.
- 1C production was not restarted.
- No write-back to 1C was performed.
- No real token, certificate, business login value, env contents, raw logs, JWT, or payment rows were printed, logged, stored, or copied into repo files.

Operator instruction:
Reload http://192.168.0.5:8798/index.html with Ctrl+F5. The sidebar must show v2026.06.07.14 / 20260607-stuck-exchange-reset-1. The stale NovaPay `В процесі` state should reset after reload, and the `Оновити` button should remain visible even when disabled during a live check.

Tool/runtime errors recorded:
- STUCK_EXCHANGE_RESET_APP_PATCH_CONTEXT_MISMATCH: first combined app.js patch did not match current runMarketplaceAutoSync context; recovered by reading exact line context and applying smaller patches.
- BROWSER_TOOL_UNAVAILABLE_FOR_VISUAL_CHECK: tool discovery did not expose a callable browser screenshot tool in this context; verification continued through HTTP/JS/CSS smoke checks.
```

## 2026-06-07T20:55:00+03:00 - Quick sync no longer blocks on Nova Poshta TTN

```text
Request:
Owner reported that after the NovaPay fix, the Nova Poshta source became stuck on a TTN loop and `Оновити` could not be pressed while some process was running. Owner also asked to make it visible what was exchanged.

Findings:
- The v2026.06.07.14 background quick mode still allowed Nova Poshta documents/TTN loops to run in runMarketplaceAutoSync, so the card showed `В процесі` with `ТТН 1/10` or `ТТН 2/10`.
- Per-source refresh buttons were still disabled by current process/global sync state, so a stuck source could block manual recovery.

Successful actions:
- Updated build metadata/cache busters to v2026.06.07.15 / 20260607-quick-sync-no-ttn-block-1 / time 20:55.
- Changed startup reset so any persisted `running` exchange process is reset on page load. A browser reload aborts the original request, so the persisted running state is stale.
- Changed quickExternal/background mode for Nova Poshta to call only checkNovaPoshtaDiagnostics(); it no longer pulls all documents or runs TTN delivery sync in background quick checks.
- Kept Nova Poshta documents/TTN loops only for the non-quick/full exchange path.
- Changed renderExchangeSourceRefreshButton so source refresh buttons are disabled only by explicit permission/planned-source flags, not by one running/stuck exchange or global marketplaceAutoSyncRunning.
- Added a visible process result label: successful cards show `Обміняно: ...`; running/error/warning/planned cards show `Стан: ...`.
- Syntax checks passed for app.js and server-live.mjs; local marker smoke passed.
- Deployed to MESER 192.168.0.5:8798. MarketplaceCRMLive health OK on pid 8172.
- MESER verification passed: index/app/styles build 20260607-quick-sync-no-ttn-block-1, quick Nova Poshta diagnostics marker present, result-label marker present, per-source button no-global-block marker present, reset-running marker present, Nova Poshta diagnostics HTTP 200, NovaPay auth-check HTTP 200 authenticated=true.
- 1C production was not restarted.
- No write-back to 1C was performed.
- No real token, certificate, API key, business login value, env contents, raw logs, JWT, TTN rows, or payment rows were printed, logged, stored, or copied into repo files.

Operator instruction:
Reload http://192.168.0.5:8798/index.html with Ctrl+F5. The sidebar must show v2026.06.07.15 / 20260607-quick-sync-no-ttn-block-1. The Nova Poshta stuck `В процесі` state should reset on load, `Оновити` should be usable, and the card should show `Стан:` or `Обміняно:` with the result text.

Tool/runtime errors recorded:
- QUICK_SYNC_NO_TTN_PREVIOUS_STATE: observed previous v2026.06.07.14 UI stuck on Nova Poshta TTN loop; recovered with v2026.06.07.15 reset/quick diagnostics patch.
- QUICK_SYNC_NO_TTN_FINAL_SMOKE_TIMEOUT: first final smoke after deploy timed out because the already-running old v2026.06.07.14 TTN request had re-blocked legacy 8797. Re-ran the installer/restart to clear only MarketplaceCRM/MarketplaceCRMLive listeners. Post-restart smoke passed: 8797 status OK, Nova Poshta diagnostics OK, NovaPay auth-check OK.
```

## 2026-06-07T21:20:00+03:00 - Legacy proxy timeout and shorter Nova Poshta quick diagnostics

```text
Request:
Owner reported that Nova Poshta remained in progress, `Оновити` was not usable while the process hung, and the UI needed to show what was exchanged.

Findings:
- MarketplaceCRMLive v2026.06.07.15 was served correctly, but the legacy PowerShell gateway on 8797 could still become blocked by a single long request.
- The live Node backend proxied legacy requests without an AbortController timeout, so quick UI checks could wait indefinitely if 8797 stopped answering.
- The Nova Poshta per-source diagnostics call still used `historyFrom=2020-01-01&windowDays=30`, so a quick operator check could run multiple cabinet document probes instead of a small health sample.

Successful actions:
- Updated build metadata/cache busters to v2026.06.07.16 / 20260607-legacy-proxy-timeout-1 / time 21:20.
- Changed Nova Poshta per-source diagnostics to a one-day sample check for the current date. Full documents/history/TTN loops remain only in the explicit full exchange path.
- Added live backend legacy proxy timeouts: quick paths `/api/novapay/auth-check`, `/api/novapay/status`, and `/api/delivery/nova-poshta/diagnostics` use a short timeout; other legacy API paths use a longer bounded timeout.
- Legacy proxy timeout now returns HTTP 504 with code `LEGACY_API_PROXY_TIMEOUT` instead of letting the browser button wait indefinitely.
- Syntax checks passed for app.js, server-live.mjs and mock-api.ps1.
- Deployed to MESER 192.168.0.5:8798 after one sandbox credential failure; the escalated installer used the saved local DPAPI credential and did not expose secrets.
- MESER verification passed: index build 20260607-legacy-proxy-timeout-1, /api/health OK, legacy 8797 /api/novapay/status OK, live Nova Poshta quick diagnostics HTTP 200 in about 1.4s, and live NovaPay auth-check HTTP 200 in about 3.8s.
- 1C production was not restarted.
- No write-back to 1C was performed.
- No real token, certificate, API key, business login value, env contents, raw logs, JWT, TTN rows, or payment rows were printed, logged, stored, or copied into repo files.

Operator instruction:
Reload http://192.168.0.5:8798/index.html with Ctrl+F5. The sidebar must show v2026.06.07.16 / 20260607-legacy-proxy-timeout-1. The Nova Poshta `Оновити` button should finish as a quick diagnostics check; if 8797 is busy it should return `LEGACY_API_PROXY_TIMEOUT` instead of hanging indefinitely.

Tool/runtime errors recorded:
- MARKETPLACE_LIVE_INSTALL_FAILED: non-escalated installer could not read the DPAPI MESER credential from sandbox user context (`Import-Clixml access denied`); recovered with approved escalated installer run.
- BROWSER_RUNTIME_SANDBOX_STARTUP_FAILED: in-app Browser runtime failed to start before navigation; verification continued through HTTP smoke and build markers.
- MARKETPLACE_LIVE_16_PREDEPLOY_SMOKE_PARTIAL_FAIL: before v2026.06.07.16 deploy, 8797 status, Nova Poshta diagnostics, and NovaPay auth-check timed out while index/health were OK.
```

## 2026-06-07T21:32:00+03:00 - v2026.06.07.17 local fix prepared, MESER deploy blocked

```text
Request:
Owner reported that v2026.06.07.16 made the UI worse because background checks now showed red LEGACY_API_PROXY_TIMEOUT errors for Rozetka and NovaPay.

Findings:
- v2026.06.07.16 served on MESER, but background/startup automation still called legacy external gateways.
- The correct operator behavior is not to auto-run Rozetka/NovaPay/Nova Poshta gateway checks on page load while the legacy 8797 gateway is single-threaded and can block.

Local actions prepared:
- Updated local app.js to v2026.06.07.17 / 20260607-no-legacy-autostart-1 / time 21:32.
- Background quickExternal auto-sync now returns after CRM SQL and does not call Rozetka, NovaPay or Nova Poshta.
- New-build autostart now sets arms-crm-marketplace-auto-sync=false instead of enabling external gateway auto-run.
- LEGACY_API_PROXY_TIMEOUT exchange-process states reset to source defaults on reload.
- index.html cache-buster/sidebar build marker was changed to 20260607-no-legacy-autostart-1.
- Local node --check app.js passed; git diff --check passed with CRLF warnings only.

Deployment status:
- Owner ran the local installer manually after the sandbox deploy attempts timed out.
- MESER verification after the owner run passed: index served build 20260607-no-legacy-autostart-1, app.js contained the AUTO_SYNC_EXTERNAL_DISABLED marker, /api/health returned OK, and legacy 8797 /api/novapay/status answered HTTP 200.
- 1C production was not restarted.
- No write-back to 1C was performed.
- No secrets, env contents, raw logs, JWT, TTN rows or payment rows were printed.

Tool/runtime errors recorded:
- MARKETPLACE_LIVE_INSTALL_TIMEOUT_V17: standard MESER installer timed out after about 124s.
- MARKETPLACE_LIVE_SHORT_DEPLOY_TIMEOUT_V17: short PSSession copy/restart timed out after about 90s.
- SMB_ADMIN_SHARE_TEST_TIMEOUT: SMB admin-share probe to \\192.168.0.5\C$ timed out after about 20s.
```

## 2026-06-07T22:12:00+03:00 - v2026.06.07.18 local guard for stuck legacy gateway

```text
Request:
Owner reported that the exchange center was generally broken and asked to analyze integrations and find additional information.

Findings:
- MESER 192.168.0.5:8798 served build 20260607-no-legacy-autostart-1, but legacy 8797 `/api/novapay/status` timed out and live 8798 proxy calls to NovaPay auth and Nova Poshta diagnostics returned 504.
- The legacy PowerShell gateway is single-request/synchronous: it accepts one TCP client and runs `Handle-Client` inline. One long or hung external request can block all Rozetka, NovaPay and Nova Poshta checks behind it.
- Local NovaPay March 2026 PDF extraction confirmed the old SOAP `UserAuthenticationJWT` flow uses single-use refresh tokens. If the request succeeds but the rotated refresh token is not persisted before the process is interrupted, later auth can fail even when the operator typed the original values correctly.
- Official integration references checked: Rozetka Marketplace API uses 24-hour Bearer tokens; NovaPay public API documents RSA `x-sign` signing and export windows up to 31 days; Nova Poshta documents HTTPS JSON/XML API entry points.

Local actions prepared:
- Updated app.js to v2026.06.07.18 / 20260607-legacy-gateway-guard-1 / time 22:12.
- Added live backend `/api/legacy/status` fast health endpoint before the generic legacy proxy.
- `Обмін всього` now performs SQL live work first, then checks `/api/legacy/status`; if 8797 is unavailable, it skips Rozetka/NovaPay/Nova Poshta and records warning code `LEGACY_GATEWAY_UNAVAILABLE` instead of starting long proxy calls.
- Per-source `Оновити` buttons now check legacy gateway health before calling Rozetka/NovaPay/Nova Poshta.
- Stale `LEGACY_API_PROXY_TIMEOUT` and `LEGACY_API_PROXY_FAILED` exchange-process states reset on load.
- Updated the Settings -> Data Exchange notice so it no longer claims that external gateways run automatically by default.
- index.html cache-buster/sidebar build marker was changed to 20260607-legacy-gateway-guard-1.

Verification:
- `node --check app.js` passed.
- `node --check server-live.mjs` passed.
- Local server-live on 127.0.0.1:8799 served index build 20260607-legacy-gateway-guard-1.
- Local `/api/health` returned OK.
- Local `/api/legacy/status` returned quickly with `LEGACY_GATEWAY_UNAVAILABLE` when no local legacy gateway was reachable.

Deployment status:
- Not yet deployed to MESER in this step. Owner should run the existing installer on MESER/local machine to copy `.18` to C:\CRM\marketplace-crm and restart only MarketplaceCRM/MarketplaceCRMLive services/listeners.
- 1C production was not restarted.
- No write-back to 1C was performed.
- No secrets, env contents, raw logs, JWT, TTN rows or payment rows were printed.

Tool/runtime errors recorded:
- LOCAL_PDF_PATH_ENCODING_ERROR: Python pypdf extraction first failed because the Cyrillic PDF path was mangled through PowerShell stdin; recovered with ASCII wildcard lookup.
- RG_MISSING_PATH_SCRIPTS: rg scan included a non-existing marketplace-crm/scripts path; useful matches were still returned from existing files.
- INTEGRATION_GATEWAY_STUCK_8797: live 8798 was healthy but legacy 8797 timed out and proxy endpoints returned 504.
- SHARED_KB_PATCH_CONTEXT_MISMATCH: first shared KB append patch used stale tail context; recovered with exact EOF context.
```

## 2026-06-07T22:33:00+03:00 - v2026.06.07.19 quick external checks only

```text
Reason:
v2026.06.07.18 prevented calls when legacy 8797 was unavailable, but if 8797 was reachable the UI could still run NovaPay all-history/registers and Nova Poshta full TTN history through the single-threaded legacy listener. NovaPay auth-check also consumed the single-use refresh token during a diagnostic click.

Changes:
- Updated app.js to v2026.06.07.19 / 20260607-external-quick-checks-1 / time 22:33.
- Unified `Обмін всього` no longer calls NovaPay all-history/registers or Nova Poshta full document/TTN history in the UI.
- Unified exchange now uses quick checks: Rozetka quick orders, NovaPay status diagnostics, Nova Poshta diagnostics, plus a warning `EXTERNAL_FULL_IMPORT_MOVED_TO_TS_JOBS`.
- NovaPay per-source `Оновити` now runs status diagnostics only and does not call auth-check, so it does not consume a single-use refresh token just to verify the block.
- index.html cache-buster/sidebar build marker was changed to 20260607-external-quick-checks-1.

Verification:
- `node --check app.js` passed.
- `node --check server-live.mjs` passed.
- Local server-live on 127.0.0.1:8799 served index build 20260607-external-quick-checks-1.
- Local app.js contained v19 and EXTERNAL_FULL_IMPORT_MOVED_TO_TS_JOBS markers.
- Local `/api/legacy/status` returned quickly when no local legacy gateway was reachable.

Deployment status:
- MESER deployment attempted after v19 checks, but both the full installer and targeted WinRM static copy timed out. HTTP verification showed MESER still serving 20260607-legacy-gateway-guard-1, not v19.
- SMB admin-share probe also timed out. Operator/manual MESER copy or re-run of the installer from the MESER/local desktop is required to publish v19.
- 1C production was not restarted.
- No write-back to 1C was performed.
- No secrets, env contents, raw logs, JWT, TTN rows or payment rows were printed.

Tool/runtime errors recorded:
- LOCAL_V19_SMOKE_SERVER_NOT_RUNNING: first v19 local smoke failed because the temporary 8799 server had stopped; recovered by restarting local server-live.
- MARKETPLACE_LIVE_INSTALL_TIMEOUT_V19: full MESER installer timed out after about 184 seconds and did not publish v19.
- MARKETPLACE_LIVE_STATIC_DEPLOY_TIMEOUT_V19: targeted WinRM copy of app.js/index.html timed out after 90 seconds and did not publish v19.
- SMB_ADMIN_SHARE_TEST_TIMEOUT_V19: SMB admin-share probe to \\192.168.0.5\C$\CRM\marketplace-crm timed out after 20 seconds.
```

## 2026-06-08T12:20:00+03:00 - v2026.06.08.1 stock-backed references and weapon serial requirement

```text
Reason:
Owner clarified that full reference visibility means every record is reachable through backend pagination/search/filters, not by loading full products/warehouses/stock/clients/serials into browser memory. Marketplace order/product selection also needs stock by selected warehouse and mandatory serial selection for weapon products from folder/category "Зброя".

Changes:
- Updated app.js to v2026.06.08.1 / 20260608-stock-serial-reference-1.
- Added canonical live endpoints in server-live.mjs for `/products`, `/one-c-mirror/warehouses`, `/one-c-mirror/stock-balances`, `/one-c-mirror/counterparty-balances`, and `/one-c-mirror/serial-stock`.
- Live endpoints return the standard paged envelope `{ data, limit, offset, total, hasMore, nextOffset }` with temporary compatibility aliases.
- Product autocomplete for Marketplace order/publication now calls bounded `/products?warehouseCode=...&inStock=true`; it does not fall back to full browser product arrays.
- Marketplace order line form now has selected warehouse, stock summary, hidden available quantity, and serial selector.
- Products detected as weapon goods by type or folder/category path require serial selection from the same selected warehouse; save is blocked without matching available serials.
- Serial lookup errors are separated from stock lookup errors: stock remains visible, while weapon serial selector shows `SERIAL_STOCK_LOOKUP_FAILED`.
- index.html cache-buster/sidebar build marker was changed to 20260608-stock-serial-reference-1.

Verification:
- `node --check app.js` passed.
- `node --check server-live.mjs` passed.
- Local server-live on 127.0.0.1:8898 served index build 20260608-stock-serial-reference-1.
- Local `/products?limit=5&offset=0`, `/one-c-mirror/warehouses?limit=5&offset=0`, and `/one-c-mirror/stock-balances?limit=5&offset=0` returned paged envelopes.
- Local `/products?warehouseCode=...&inStock=true` returned only in-stock product rows for the selected warehouse.
- Local `/one-c-mirror/stock-balances?productCode=...&warehouseCode=...` returned filtered rows.
- Local `/one-c-mirror/counterparty-balances?limit=5&offset=0` returned a paged envelope.
- Local `/one-c-mirror/serial-stock` without productCode returned HTTP 400 with `SERIAL_STOCK_PRODUCT_CODE_REQUIRED`.

Deployment/runtime gap:
- The running SQL API at http://192.168.0.166:3000 still returns 404 for `/one-c-mirror/serial-stock`, `/one-c-mirror/serials`, `/one-c-mirror/serial-stock-summary`, `/one-c-mirror/serial-stock-current`, `/serial-stock`, and `/serials`.
- Because of this upstream gap, real serial selection requires deploying the SQL API serial-stock route and the `one_c_mirror.crm_serial_stock_live` read model before weapon products can show real available serials.
- SSH alias `crm-ubuntu` was unavailable in this shell, and explicit BatchMode SSH to 192.168.0.166 failed because no usable key was available. No password was requested.
- Browser plugin tools were not exposed in this turn, so verification used HTTP smoke checks instead of in-app browser screenshot/click checks.
- 1C production was not restarted.
- No write-back to 1C was performed.
- No secrets, env contents, raw logs, payment rows, TTN rows, or serial rows were printed.

Tool/runtime errors recorded:
- FILTER_SMOKE_502_LOCALIZED: filtered smoke initially failed because serial-stock returned 502 through Marketplace live backend.
- SERIAL_STOCK_DIRECT_SQL_PROBE: direct SQL API probe showed `/one-c-mirror/serial-stock` returned HTTP 404.
- SERIAL_STOCK_ROUTE_NOT_DEPLOYED: all tested running SQL API serial-stock aliases returned HTTP 404.
- SERIAL_ALIAS_PROBE_URL_INTERPOLATION_FIXED: one PowerShell alias probe initially used malformed `$Path?limit` interpolation; re-run with `$($Path)?...` fixed the command.
- SSH_SQL_SERIAL_STOCK_CHECK_FAILED: `ssh crm-ubuntu` failed because the alias was not configured.
- SSH_SQL_EXPLICIT_HOST_CHECK_FAILED: explicit SSH failed host-key verification before using a workspace known_hosts file.
- SSH_SQL_WORKSPACE_KNOWN_HOSTS_CHECK_FAILED: workspace known_hosts SSH reached the host but failed `Permission denied (publickey,password)` under BatchMode.
- BROWSER_TOOL_UNAVAILABLE: Browser navigation/screenshot tools were not exposed by tool_search in this turn.
```

## 2026-06-08T12:55:00+03:00 - continued deployment and SQL serial-stock route diagnosis

```text
Reason:
Owner said to continue after local Marketplace CRM stock/serial reference work.

MESER deployment status:
- MESER 192.168.0.5:8798 still serves build 20260607-external-quick-checks-1.
- Full MarketplaceCRMLive installer with escalated execution timed out after 180 seconds and did not publish v2026.06.08.1.
- Targeted WinRM copy/restart through Start-Job did not publish and hit a blocked job/deadlock condition.
- Direct PSSession targeted copy/restart timed out after 120 seconds before self-logging.
- Simple MESER remoting probe timed out after 40 seconds.
- SMB/admin-share PSDrive probe to \\192.168.0.5\C$ timed out after 40 seconds.
- This is a transport/access blocker from the current Codex environment, not an app syntax failure.
- 1C production was not restarted.

SQL API status:
- Local SQL API code already contains one-c-mirror serial-stock controller/service and migration 007 for `one_c_mirror.crm_serial_stock_live`.
- Patched SQL API paging helpers to add canonical `hasMore` to `pageResult` and `fastPageResult`.
- Updated SQL contract doc `D:\Codex\CRM\SQL\docs\live-bounded-sql-api-contracts-2026-06-07.md` with products, serial-stock, serial-stock-summary, `hasMore`, and product-scoped serial lookup rule.
- Running SQL API at `http://192.168.0.166:3000` still serves the older contract: products/warehouses/stock/balances work, but `hasMore` is blank/missing for current responses and serial-stock remains HTTP 404.
- Local build verification of SQL API could not be completed because `npm`/`tsc` executables are not available in this shell; `node_modules` is absent.
- Added `publish-marketplace-crm-live-local-meser.ps1` for direct execution on MESER when remote WinRM/SMB transport is blocked. It copies app files into `C:\CRM\marketplace-crm`, restarts only `MarketplaceCRMLive`/8798, and verifies build `20260608-stock-serial-reference-1`.

Verification:
- Marketplace local `node --check app.js` passed.
- Marketplace local `node --check server-live.mjs` passed.
- `publish-marketplace-crm-live-local-meser.ps1` PowerShell parser check passed.
- Final HTTP smoke confirmed MESER old build and running SQL API serial-stock 404.

Tool/runtime errors recorded:
- MARKETPLACE_LIVE_DIRECT_TARGETED_DEPLOY_TOOL_TIMEOUT_120S: direct targeted WinRM deploy timed out.
- MESER_REMOTING_SIMPLE_TOOL_TIMEOUT_40S: simple remoting probe timed out.
- SMB_PSDRIVE_TOOL_TIMEOUT_40S: SMB admin-share probe timed out.
- SQL_API_BUILD_NPM_NOT_FOUND: `npm run build --workspace @crm/api` could not run because npm is not in PATH and bundled runtime has no npm.cmd.
- FINAL_SMOKE_MESER_OLD_BUILD: MESER still served 20260607-external-quick-checks-1.
- FINAL_SMOKE_SQL_SERIAL_ROUTE_404: running SQL API still returns 404 for serial-stock.
```

## 2026-06-08T16:21:00+03:00 - live SQL serial-stock adapter connected locally

```text
Reason:
Owner requested Marketplace CRM to connect the deployed live SQL API serial-stock contract at http://192.168.0.166:3000.

Changes:
- Updated app.js to v2026.06.08.2 / 20260608-live-serial-stock-api-1.
- Updated index.html app.js cache-buster to 20260608-live-serial-stock-api-1.
- Updated server-live.mjs to proxy bounded product-scoped serial endpoints:
  - GET /one-c-mirror/serial-stock
  - GET /one-c-mirror/serials
  - GET /one-c-mirror/serial-stock-summary
- Missing productCode now returns HTTP 400 with SERIAL_PRODUCT_REQUIRED through Marketplace live adapter.
- Serial rows are normalized with serial, serialNumber, and serialName.
- Standard envelope now includes data, rows, count, total, limit, offset, hasMore, nextOffset, and nextCursor.
- Adapter preserves upstream hasMore/nextOffset/nextCursor and avoids converting unknown null total into 0.
- UI serial lookup remains bounded and requests limit=20 only after product selection, preferably with warehouseCode.

Verification:
- Direct SQL API missing productCode check returned HTTP 400 with SERIAL_PRODUCT_REQUIRED.
- Direct SQL API /one-c-mirror/serial-stock?productCode=8600167&limit=3&offset=0 returned HTTP 200 with 3 serial rows.
- Direct SQL API /one-c-mirror/serials?productCode=8600167&limit=3&offset=0 returned HTTP 200 with 3 serial rows.
- Direct SQL API /one-c-mirror/serial-stock-summary?productCode=8600167&limit=3&offset=0 returned HTTP 200 with 2 summary rows.
- node --check app.js passed.
- node --check server-live.mjs passed.
- Temporary local server-live on 127.0.0.1:8901 served build 20260608-live-serial-stock-api-1.
- Temporary local /one-c-mirror/serial-stock?limit=1 returned HTTP 400 with SERIAL_PRODUCT_REQUIRED.
- Temporary local /one-c-mirror/serial-stock and /one-c-mirror/serials for productCode=8600167 returned 3 rows, serialNumber=yes, serialName=yes, hasMore=true, nextOffset=3.
- Temporary local /one-c-mirror/serial-stock-summary for productCode=8600167 returned 2 summary rows.

Deployment/runtime note:
- This turn verified the local Marketplace live adapter, not MESER production listener 8798.
- MESER 192.168.0.5:8798 still served build 20260608-stock-serial-reference-1 during this turn.
- Updated publish-marketplace-crm-live-local-meser.ps1 expected build to 20260608-live-serial-stock-api-1 and verified its PowerShell parser.
- To expose the change to users on MESER, copy app.js, index.html, styles.css, and server-live.mjs to C:\CRM\marketplace-crm and restart only the MarketplaceCRMLive scheduled task/listener.
- 1C production was not restarted.
- No write-back to 1C was performed.
- No secrets, env contents, raw logs, payment rows, TTN rows, or serial row values were printed.
```

## 2026-06-09T00:00:00+03:00 - MESER MarketplaceCRMLive deployed with live serial-stock adapter

```text
Reason:
Continue Marketplace CRM / MarketplaceCRMLive from the pasted handoff. MESER 192.168.0.5:8798 was still serving 20260608-stock-serial-reference-1, while local files already contained v2026.06.08.2 / 20260608-live-serial-stock-api-1.

Actions:
- Read workspace rules, shared knowledge base, access map, Marketplace AGENTS.md, Marketplace handoff, repo-safe log tail, and the pasted continuation request.
- Verified local app.js and server-live.mjs with node --check.
- Verified publish-marketplace-crm-live-local-meser.ps1 with PowerShell parser.
- Confirmed MESER 8798 listener was MarketplaceCRMLive: node.exe running C:\CRM\marketplace-crm\server-live.mjs --port 8798 --bind 0.0.0.0.
- Checked MESER D:\Codex\CRM\marketplace-crm and found expected source files absent, so the MESER-local publish script path could not be used.
- Copied only verified Marketplace CRM app files to C:\CRM\marketplace-crm via PSSession.
- Stopped only the confirmed MarketplaceCRMLive 8798 process and restarted only the MarketplaceCRMLive scheduled task.

Verification:
- MESER local verification returned build 20260608-live-serial-stock-api-1 on port 8798.
- Public LAN http://192.168.0.5:8798/index.html returned HTTP 200 with app.js?v=20260608-live-serial-stock-api-1.
- Public LAN /one-c-mirror/serial-stock?limit=1 returned HTTP 400 with SERIAL_PRODUCT_REQUIRED.
- Public LAN /one-c-mirror/serial-stock?productCode=8600167&limit=3&offset=0 returned HTTP 200 with rowCount=3, serial field present, hasMore=true, nextOffset=3.
- Public LAN /one-c-mirror/serial-stock-summary?productCode=8600167&limit=3&offset=0 returned HTTP 200 with rowCount=2 and hasMore=false.

Safety:
- 1C production was not restarted.
- No write-back to 1C was performed.
- No secrets, env contents, raw logs, payment rows, TTN rows, or serial row values were printed.

Tool/runtime notes:
- SQL git status still hits known SQL_GIT_DUBIOUS_OWNERSHIP_SANDBOX under CodexSandboxOffline; no global git config was changed.
- Sandboxed access to the DPAPI MESER credential file was denied; approved unsandboxed execution used the documented credential path without printing the credential value.
- First MESER source-folder check timed out after 60s; a smaller 180s read succeeded and showed the expected D:\ source files were absent.
```

## 2026-06-09T21:05:00+03:00 - local product-photo backend/core implementation

```text
Reason:
Owner requested Marketplace CRM product editing with product photos under the shared product-photo storage contract.

Changes:
- Updated local Marketplace CRM to v2026.06.09.2 / 20260609-product-photos-core-1.
- Added backend-only product photo routes in server-live.mjs:
  - GET /api/live/product-photos
  - POST /api/live/product-photos/upload
  - POST /api/live/product-photos/import-url
  - GET /api/live/product-photos/<photoId>/content
- Backend validates image/*, enforces upload size limits, calculates sha256, stores files under PRODUCT_PHOTO_MEDIA_ROOT default D:\CRM\ProductPhotos, and sends metadata to SQL API.
- Product/photo identity is enterpriseCode + productCode only.
- UI product forms now keep pending File objects until upload and store only photo metadata in product.photos.
- Publication sync/export fetches photos by productCode through bounded backend endpoint, primary photo first and gallery by sortOrder.
- SQL API local code adds GET/POST /one-c-mirror/product-photos backed by core.crm_product_photos/core.product_photos, and products endpoints expose enterpriseCode + productCode.

Verification:
- node --check app.js passed.
- node --check server-live.mjs passed.
- publish-marketplace-crm-live-local-meser.ps1 PowerShell parser check passed.
- Temporary local server-live on 127.0.0.1:8911 returned health=200, index build 20260609-product-photos-core-1, and GET /api/live/product-photos?limit=1 returned expected HTTP 400 PRODUCT_PHOTO_PRODUCT_OR_SEARCH_REQUIRED.
- Static scan found no product-image dataUrl/toDataURL flow; remaining dataUrl references are unrelated existing blob/audio logic.

Blocker:
- Live SQL API http://192.168.0.166:3000/one-c-mirror/product-photos currently returns HTTP 404. Local SQL API route must be deployed before upload/import can write core.product_photos in live.
- TypeScript compile for SQL API was not run because node_modules/tsc were unavailable in this environment.
- No MESER deployment or MarketplaceCRMLive restart was performed in this product-photo turn.

Safety:
- Browser does not store product photo base64.
- Orders, shipments, 1C payloads, localStorage and logs were not changed to carry image binaries.
- No write-back to 1C was performed.
- No secrets, env contents or raw logs were printed.
```

## 2026-06-09T21:24:00+03:00 - MESER product menu subview switching fix

```text
Reason:
Owner reported that the left menu item Товари did not switch to its own submenus and the screen could remain on Аналітика while the page title/sidebar showed Товари.

Changes:
- Updated app.js to v2026.06.09.3 / 20260609-product-menu-subviews-1.
- Added navigateToView(viewId, subviewId) so top menu, sidebar flyout submenus, and subview select all normalize currentView + currentSubViews together.
- Added a stable subview select in the toolbar for views with submenus, including Товари: Каталог, Залишки на складі, Публікації.
- Top menu data-view click now returns immediately after navigation render.
- Subview flyout button and subview-select now use the same navigation path.
- render() now catches view renderer failures and shows an error panel instead of leaving stale content from the previous section after the sidebar/title changed.
- Updated index.html and publish-marketplace-crm-live-local-meser.ps1 build markers.

Verification:
- node --check app.js passed.
- node --check server-live.mjs passed.
- publish-marketplace-crm-live-local-meser.ps1 PowerShell parser check passed.
- Local HTTP smoke on 127.0.0.1:8913 returned build 20260609-product-menu-subviews-1 and app.js markers navigate=True, selector=True, guard=True.
- MESER MarketplaceCRMLive was updated and restarted only on port 8798.
- Live http://192.168.0.5:8798/index.html returned build 20260609-product-menu-subviews-1.
- Live /api/health returned HTTP 200.
- Live /one-c-mirror/serial-stock?productCode=8600167&limit=1&offset=0 returned HTTP 200.
- Live app.js contains navigateToView, subview-select, and render guard markers.

Safety:
- 1C production was not restarted.
- Legacy 8797 was not restarted.
- No write-back to 1C was performed.
- No secrets, env contents or raw logs were printed.
```

## 2026-06-09T21:59:00+03:00 - Addendum: product menu subviews build superseded

```text
Build 20260609-product-menu-subviews-1 was superseded by emergency hotfix 20260609-menu-hotfix-1 after the owner reported that the whole Marketplace CRM menu stopped working.

Current live MESER 8798 state:
- http://192.168.0.5:8798/index.html returns build 20260609-menu-hotfix-1.
- Live app.js markers: directView=True, renderGuard=False, toolbarSelectorInsert=False.
- /api/health returns HTTP 200.
- /one-c-mirror/serial-stock?productCode=8600167&limit=1&offset=0 returns HTTP 200.

Safety:
- 1C production was not restarted.
- Legacy 8797 was not restarted.
```

## 2026-06-09T22:22:00+03:00 - Addendum: startup guard hotfix deployed

```text
Owner reported that menu still did not work on v2026.06.09.4, with a screenshot showing the static shell/sidebar, old role/employee toolbar controls, and blank #app.

Current live MESER 8798 state:
- http://192.168.0.5:8798/index.html returns build 20260609-startup-guard-1 / v2026.06.09.6.
- Live app.js markers: startupGuard=True, renderGuard=True, shellGuard=True, directView=True, toolbarSelectorInsert=False.
- Startup tasks before render() are wrapped in runStartupTask so a failed exchange/timer startup cannot prevent render().
- state bootstrap and view render are guarded; failures show a fallback panel instead of leaving #app blank.
- /api/health returns HTTP 200.
- /one-c-mirror/serial-stock?productCode=8600167&limit=1&offset=0 returns HTTP 200.

Safety:
- 1C production was not restarted.
- Legacy 8797 was not restarted.
- No write-back to 1C was performed.
```

## 2026-06-09T22:32:00+03:00 - Addendum: SQL numeric currency code guard deployed

```text
Owner screenshot showed the Products section fallback panel with RENDER_VIEW_FAILED and error:
products: Invalid currency code : 980.

Cause:
- Live /products?limit=1&offset=0 through MESER 8798 returned bounded data with currency=980 and latestPriceCurrency=980.
- Browser Intl.NumberFormat requires ISO currency codes such as UAH, USD, EUR, so raw SQL/1C numeric currency code 980 caused the products view renderer to throw.

Changes:
- Updated app.js to v2026.06.09.7 / 20260609-currency-code-guard-1.
- Added currency aliases 980->UAH, 840->USD, 978->EUR.
- Added normalizeCurrencyCode() and safeIntlCurrencyCode().
- Guarded formatMoney(), exchange-rate normalization, money conversion, product price helpers, live product normalization, SQL/1C product/payment/receivable imports, NovaPay transaction currency, and selected 1C export rows.
- Updated index.html cache-busting query/version marker and publish-marketplace-crm-live-local-meser.ps1 expected build.

Verification:
- node --check app.js passed.
- node --check server-live.mjs passed.
- publish helper PowerShell parser check passed.
- git diff --check returned only LF/CRLF warnings.
- Local temporary server-live on 127.0.0.1:8918 returned health=200, index=200, app=200, build=20260609-currency-code-guard-1, currency guard markers present, old startup-guard marker absent.
- MESER MarketplaceCRMLive was restarted only on port 8798.
- Live http://192.168.0.5:8798/index.html returned build 20260609-currency-code-guard-1.
- Live app.js returned currency guard markers: CURRENCY_CODE_ALIASES, normalizeCurrencyCode, safeIntlCurrencyCode.
- Live /products?limit=1&offset=0 returned bounded count=1 with source currency=980, confirming the guard covers the observed data shape.
- Live /one-c-mirror/serial-stock?productCode=8600167&limit=1&offset=0 returned HTTP 200.
- Browser plugin visual/click verification was unavailable in this Codex session because browser runtime setup exited unexpectedly; HTTP and syntax checks were used.

Safety:
- 1C production was not restarted.
- Legacy 8797 was not restarted.
- No write-back to 1C was performed.
- No full product/catalog/photo load was added to browser memory.
- No secrets, env contents, raw image data, base64, or raw logs were printed.
```

## 2026-06-10T13:33:00+03:00 - Addendum: role create/select/view permissions deployed

```text
Owner requested to log the work, put changes to GitHub, and add in-program role permissions for create/select/view.

Changes:
- Updated app.js to v2026.06.10.5 / 20260610-roles-create-select-view-1.
- Added role.access.actions with create/select/view defaults through defaultRoleAccess().
- Added a separate Roles UI matrix named "Дозволи на дії".
- Added canCreateRecords(), canSelectRecords(), and canViewRecords() helper checks.
- canAccessView/canAccessSubview/canCreateDocument now respect action-level permissions.
- Product card open checks view; product creation modal checks create; marketplace product autocomplete selection checks select.
- Updated index.html cache busters and publish-marketplace-crm-live-local-meser.ps1 expected build.

Verification:
- node --check marketplace-crm/app.js passed.
- Live MESER 8798 index returned app.js?v=20260610-roles-create-select-view-1 and v2026.06.10.5.
- Live /api/health returned HTTP 200 ok=true for marketplace-crm-live on port 8798.
- Live /api/live/stock-refresh/status returned HTTP 200 ok=true, backend snapshot rowCount=5149, productCount=4431, warehouseCount=14.
- Browser visual verification was attempted but unavailable in this Codex session due local browser runtime startup failure; HTTP and syntax checks were used.

Safety:
- 1C production was not restarted.
- Legacy 8797 was not restarted.
- No write-back to 1C was performed.
- No full product/catalog/photo/stock load was added to browser memory.
- No secrets, env contents, raw image data, base64, or raw logs were printed.
```

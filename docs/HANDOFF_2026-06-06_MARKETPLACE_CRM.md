# Marketplace CRM handoff, 2026-06-06

## Current repo

- Local repo: `D:\Codex\CRM\marketplace-crm`
- GitHub remote: `https://github.com/1973zahar/crm-rozetka-api.git`
- Branch: `main`
- Baseline before this handoff package: `7d1d38e Add safe work log export for handoff`
- Current build: `v2026.06.06.2`, `20260606-publication-product-search-1`
- Local prototype URL: `http://127.0.0.1:8796/index.html`
- LAN prototype URL from the last successful check: `http://192.168.89.204:8797/index.html`
- Repo-safe log: `D:\Codex\CRM\marketplace-crm\docs\WORK_LOG_EXPORT_2026-06-05.md`
- Full local work-log: `D:\Codex\CRM\SQL\docs\crm-sql-work-log-2026-06-01.md`

## Safety rules to keep

- Record successful and failed actions in the work-log.
- Every error must be recorded with a code.
- Do not restart the 1C production server.
- Do not write back to 1C.
- Do not push `.env`, `.secrets`, `.cache`, `crm-http*.ndjson`, raw HTTP logs, raw server logs, or credentials.
- After code changes, check syntax and run/verify the prototype.
- Keep all exchanges in one place: `Налаштування -> Обмін даними`.

## What changed since the 2026-06-05 handoff

### Sales menu and workflow

- In `Продажі`, manager funnel and processing control were removed from all submenus except `Замовлення`.
- `Продажі -> Склад` was converted to order rows for picking, not kanban columns.
- Warehouse rows now support opening an order for picking, marking it as picked, and handing it to logistics.
- `Продажі -> Логістика` is split into three lanes:
  - `Отримано від складу`
  - `Передано перевізнику`
  - `Вручене / доставлено`
- Moving from `Отримано від складу` to `Передано перевізнику` requires entering TTN.
- Moving to `Вручене / доставлено` is driven by downloaded carrier delivery status.
- Role permissions were updated for the new warehouse/logistics actions.

### Product selection in order creation

- The `Створити замовлення` product field no longer uses the browser native `<datalist>`.
- It now uses a custom autocomplete input with product names, brands, models, SKU, barcode, and internal codes.
- This prevents Chrome from showing numeric-only suggestions instead of product names.

### Rozetka publication control

- `Контроль виставлення товарів` now recovers Rozetka publication rows from imported `product.rozetka` data when `marketplacePublications` is absent.
- Existing published Rozetka rows are counted as published even when CRM moderation fields still need completion for the next synchronization.
- Publication identity matching uses marketplace plus external ID, SKU, or product ID to avoid duplicates.

### Product selection in publication creation

- The `Створити публікацію` product field was changed from a fixed select to a hidden `productId` plus visible searchable text input.
- The input searches by product name, brand, model, SKU, barcode, internal code, marketplace SKU, and linked requisites.
- Selecting a product fills linked fields: SKU, publication title, category/group/filter defaults, price, currency, and channel SKU controls.
- Exact typed matches are synced on change.

### Mock prototype listener

- Chrome blank page on the LAN URL was traced to idle/preconnect TCP sockets blocking the single-threaded PowerShell listener.
- `mock-api.ps1` now closes idle sockets if no request bytes arrive quickly.
- POST body reads have a 3-second deadline.
- `TcpClient` now uses shorter receive/send timeouts and `NoDelay`.
- Each client is closed in a `finally` block.

## Files changed in this handoff package

- `.env.example`
- `app.js`
- `index.html`
- `mock-api.ps1`
- `styles.css`
- `docs/WORK_LOG_EXPORT_2026-06-05.md`
- `docs/HANDOFF_2026-06-06_MARKETPLACE_CRM.md`

## Safe configuration change

`.env.example` changed only the NovaPay example register types:

```text
NOVAPAY_REGISTER_TYPES=1,2,3,4
```

No real NovaPay, Nova Poshta, Rozetka, SQL, GitHub, or 1C credentials are included in this handoff package.

## Last successful prototype state

- Build served on `127.0.0.1:8796`: `20260606-publication-product-search-1`
- Build served on `192.168.89.204:8797`: `20260606-publication-product-search-1`
- `8796` is local-only.
- `8797` is LAN-bound on `0.0.0.0`.
- Last verified `8797` listener PID in this session: `37536`.
- Old address `192.168.0.165` was unreachable during this session; current LAN IP was `192.168.89.204`.
- The stable `8797` restart used a temp raw-log path outside the repo: `%TEMP%\marketplace-crm-8797.ndjson`.
- The final stable `8797` restart was run with escalated process-launch permission so the local listener survives after the sandboxed shell command exits.

If LAN access fails in a new chat, first check the current IPv4 address and restart only the local prototype listener. Do not restart 1C production.
Use `-LogPath` outside the repo when restarting manually, so raw HTTP logs are not created in the Git worktree.

## Verification to rerun after pull

```powershell
cd D:\Codex\CRM\marketplace-crm
& 'C:\Users\User\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe' --check app.js
$errors = $null
[System.Management.Automation.PSParser]::Tokenize((Get-Content -Raw -Encoding UTF8 mock-api.ps1), [ref]$errors) | Out-Null
$errors
git diff --check
Invoke-WebRequest -UseBasicParsing -Uri http://127.0.0.1:8796/index.html -TimeoutSec 5
Invoke-WebRequest -UseBasicParsing -Uri http://192.168.89.204:8797/index.html -TimeoutSec 5
```

Expected build in `index.html`: `20260606-publication-product-search-1`.

Recommended local LAN restart command if needed:

```powershell
$tempLog = Join-Path $env:TEMP 'marketplace-crm-8797.ndjson'
Start-Process -FilePath powershell -ArgumentList @('-ExecutionPolicy','Bypass','-File','D:\Codex\CRM\marketplace-crm\mock-api.ps1','-Port','8797','-BindAddress','0.0.0.0','-LogPath',$tempLog) -WorkingDirectory 'D:\Codex\CRM\marketplace-crm' -WindowStyle Hidden
```

## Tool/runtime errors recorded in this handoff pass

- `LAN_8797_HANDOFF_CHECK_TIMEOUT`: first LAN verification for `http://192.168.89.204:8797/index.html` timed out because the old local mock listener on `8797` had stuck Chrome TCP sockets.
- `GET_NET_IPADDRESS_ACCESS_DENIED`: `Get-NetIPAddress` was blocked by Windows permissions in this shell; continued with known working IP and HTTP checks.
- `START_PROCESS_REDIRECT_PATH_DUPLICATE`: diagnostic `Start-Process` with redirected stdout/stderr failed because the environment contains duplicate `Path`/`PATH` keys.
- `CRM_HTTP_LOG_WRITE_ACCESS_DENIED`: a test job showed default raw `crm-http.ndjson` writes can be denied in this environment; the stable restart used a temp `-LogPath` outside the repo.
- `GIT_INDEX_LOCK_PERMISSION_DENIED`: first `git add` was blocked by sandbox write permissions for `.git/index.lock`; recovered with approved `.git` write access.
- `GIT_PUSH_REJECTED_FETCH_FIRST`: first push was rejected because `origin/main` contained two newer handoff/log commits; recovered with `git fetch origin` and clean `git rebase origin/main`.
- `LAN_8797_FINAL_CHECK_FAILED`: after the first push, a separate LAN check showed the sandbox-started local listener had exited.
- `LAN_IDLE_SOCKET_STRESS_ECONNREFUSED_AFTER_ACCEPT_FIX`: a non-escalated listener start disappeared before idle-socket stress could connect; recovered by starting the local listener with escalated process launch.
- `SANDBOX_STARTPROCESS_CHILD_TERMINATED_AFTER_COMMAND`: inferred from the fact that `Start-Job` stress tests passed while non-escalated `Start-Process` listeners disappeared after the tool command completed.

## Known blockers and next engineering tasks

1. Continue NovaPay all-history + TTN.
   - Current known blocker: `NPAY_REGISTER_CREATE_FAILED`.
   - Client API authentication works, but register export returns `logic_errorAPIError` for tested register types.
   - Need NovaPay-side register export enablement or the correct supported register type that includes TTN/payment detail.

2. Continue Nova Poshta all-history diagnostics.
   - Current known blocker: `NP_DOCUMENTS_EMPTY_FROM_CABINET`.
   - API key is accepted, but `InternetDocument/getDocumentList` returns empty history for the tested cabinet/counterparty.
   - Verify the API key/cabinet/counterparty that owns the TTNs.

3. Continue SQL full import.
   - Goal: full import of new/changed products, stock, clients, warehouses, firms, receivables/payables/balances, and shipment/TTN records.
   - Current known blocker from prior diagnostics: `CRM_SQL_ONEC_MIRROR_404` for one-c-mirror endpoints in this prototype environment.
   - Existing fallback imports partial products/customers, but complete stock/balance import needs the mirror endpoints reachable/deployed.

4. Keep UI exchange controls consolidated.
   - Do not scatter NovaPay, Nova Poshta, Rozetka, SQL, or 1C exchange controls into Sales, Finance, Orders, or Product pages.
   - The single entry point remains `Налаштування -> Обмін даними`.

5. Retest product search UI in browser after any restart.
   - `Створити замовлення`: Product field should be empty initially and searchable by name.
   - `Створити публікацію`: Product field should allow typing and show product-name suggestions, not numeric-only browser suggestions.

## New chat starter message

Use this in the next chat, replacing the final commit hash with the one from the previous chat final response if needed:

```text
Продовжуємо Marketplace CRM.

GitHub repo:
https://github.com/1973zahar/crm-rozetka-api

Локальна папка:
D:\Codex\CRM\marketplace-crm

Почни з handoff:
D:\Codex\CRM\marketplace-crm\docs\HANDOFF_2026-06-06_MARKETPLACE_CRM.md

Repo-safe log:
D:\Codex\CRM\marketplace-crm\docs\WORK_LOG_EXPORT_2026-06-05.md

Повний локальний work-log:
D:\Codex\CRM\SQL\docs\crm-sql-work-log-2026-06-01.md

Останній commit:
<вставити hash з фінальної відповіді попереднього чату>

Обов’язково:
- всі успішні й провальні дії писати в work-log;
- кожну помилку фіксувати з кодом;
- 1C production server не перезавантажувати;
- не писати назад у 1C;
- не пушити .env, .secrets, .cache, crm-http*.ndjson, raw logs;
- після змін перевіряти синтаксис і запуск прототипу;
- усі обміни тримати в одному місці: Налаштування -> Обмін даними.

Поточний стан:
- build: 20260606-publication-product-search-1
- локально: http://127.0.0.1:8796/index.html
- LAN: http://192.168.89.204:8797/index.html
- останнє: виправлено білу сторінку Chrome через idle/preconnect sockets у mock-api.ps1; поле Товар у Створити публікацію стало пошуковим input.

Поточна задача:
продовжити NovaPay all-history + TTN, Nova Poshta all-history diagnostics, SQL повний імпорт нових/змінених товарів, залишків, клієнтів, складів і балансів. Після старту перевірити UI після останнього handoff.
```

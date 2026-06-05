# Marketplace CRM handoff, 2026-06-05

## Current repo

- Local repo: `D:\Codex\CRM\marketplace-crm`
- GitHub remote: `https://github.com/1973zahar/crm-rozetka-api.git`
- Current build: `v2026.06.05.2`, `20260605-full-history-np-npay-1`
- Prototype port: `8789`
- LAN URL used in the last verification: `http://192.168.4.14:8789/index.html?build=20260605-full-history-np-npay-1`
- Repo-safe log export: `docs/WORK_LOG_EXPORT_2026-06-05.md`
- Full local work log: `D:\Codex\CRM\SQL\docs\crm-sql-work-log-2026-06-01.md`

## Safety rules to keep

- Do not restart 1C production.
- Do not write back to 1C.
- Keep NovaPay, Nova Poshta, Rozetka credentials only in server-side `.env` or `.secrets/`.
- Do not commit `.env`, `.secrets/`, `.cache/`, raw `*.ndjson`, or raw `*.log`.
- Record successful and failed actions in `D:\Codex\CRM\SQL\docs\crm-sql-work-log-2026-06-01.md`.
- Every error must have a code.

## What is implemented now

### Unified exchange center

Menu path: `Налаштування -> Обмін даними`.

All current and future exchange blocks are in one place:

- `CRM SQL -> CRM`
- `1C / BAS -> CRM`
- `Rozetka -> CRM`
- `NovaPay -> CRM`
- `Нова пошта -> CRM`
- future placeholders: `Prom`, `Epicentr`, `Allo`

Auto exchange remains browser-tab driven, every 10 minutes while the prototype tab is open.

### Rozetka

The upper `Rozetka -> CRM` block now has four labeled action buttons:

- `Товари`
- `Замовлення`
- `Питання клієнтів`
- `Звернення маркетплейсу`

The old detailed Rozetka forms were not deleted. They were moved into a collapsed details drawer below the exchange cards.

### Nova Poshta

Button: `Налаштування -> Обмін даними -> Нова пошта -> CRM -> Отримати всі ТТН`.

Server endpoint:

```text
/api/delivery/nova-poshta/documents?history=all&historyFrom=2020-01-01&limit=500&maxPages=1000&windowDays=30
```

The server now:

- walks history in 30-day windows;
- stores merged history in `.cache/nova-poshta-documents-cache.json`;
- returns only new or changed rows to CRM logic through the existing external-record delta mechanism.

Last real check:

- HTTP `200`
- `periods=79`
- `fetched=0`
- `cache=0`
- `partial=False`
- `warnings=0`

Meaning: the Nova Poshta API key is accepted, but this cabinet/API key returned no `InternetDocument/getDocumentList` rows from `2020-01-01` through `2026-06-05`.

Known Nova Poshta issue:

- `NP_DOCUMENTS_EMPTY_FROM_CABINET`: likely the API key belongs to a cabinet/counterparty that did not create those TTNs, or Nova Poshta document-list access is not enabled for that sender.
- Earlier error `NP_DOCUMENTS_WINDOW_FAILED` happened with 90-day windows because Nova Poshta rejected the interval as more than three months. Fixed by forcing 30-day windows.

### NovaPay

Button: `Налаштування -> Обмін даними -> NovaPay -> CRM -> Отримати платежі`.

The browser calls only the local server gateway. Private key, refresh token, certificate, account id and IBAN are server-side only.

The frontend now forces:

```text
history=all
historyFrom=2020-01-01
includeExtract=true
includeRegisters=true
windowDays=31
```

Server cache:

```text
.cache/novapay-payments-cache.json
```

Last real check:

- HTTP `200`
- cache currently contains `1` payment
- current live fetch returned:
  - `paymentsListFetched=0`
  - `accountExtractFetched=0`
  - `registerRowsFetched=0`
  - `registerFiles=0/76`
  - `warnings=76`

Important NovaPay diagnosis:

- Official WSDL confirms `GetRegisterRequest` fields are `Type`, `ClientId`, `From`, `Into`, `FileExtension`.
- Current gateway XML matches those names.
- Tested register `Type` values `1`, `2`, `3`, `4` for `2026-06-01..2026-06-05`.
- All returned `NPAY_REGISTER_CREATE_FAILED: logic_errorAPIError`.

Meaning: current NovaPay Client API credentials work for authentication, but register export appears unavailable/not enabled or needs a different NovaPay-side setting. Ask NovaPay support/cabinet admin to enable Client API register export or provide the correct supported `GetRegister` type for payment registers with TTN.

Known NovaPay issue:

- `NPAY_REGISTER_CREATE_FAILED`: register files are not available with current API access.
- `NPAY_EMPTY_TTN`: the cached NovaPay payment has no TTN in purpose/payload, so CRM cannot auto-create a payment against an order by TTN yet.

### Finance reconciliation

NovaPay payment reconciliation logic exists:

- match by TTN;
- compare NovaPay amount against full `order.lines` total;
- create CRM payment automatically only when TTN and amount match.

Current blocker: the only real NovaPay row in cache has no TTN, so it remains pending and cannot be auto-linked.

### Marketplace-only scope

The user explicitly requested Marketplace CRM only. Do not reintroduce B2B/B2C as main blocks in the UI for this thread unless the user starts a separate task for them.

## Files changed in this handoff period

- `app.js`
- `mock-api.ps1`
- `index.html`
- `styles.css`
- `.env.example`
- `.gitignore`
- `README.md`
- `start-crm.bat`
- `start-crm-lan.bat`
- `src/rozetka-http.mjs`
- `docs/HANDOFF_2026-06-05_MARKETPLACE_CRM.md`
- `docs/NEXT_CHAT_PROMPT_2026-06-05.md`

Raw local files intentionally not committed:

- `.env`
- `.secrets/`
- `.cache/`
- `crm-http*.ndjson`
- `server-start*.log`

## Verification already run

```text
node --check D:\Codex\CRM\marketplace-crm\app.js
mock-api.ps1 PowerShell parser check
GET http://127.0.0.1:8789/index.html?build=20260605-full-history-np-npay-1
GET http://192.168.4.14:8789/index.html?build=20260605-full-history-np-npay-1
GET /api/delivery/nova-poshta/documents?history=all&historyFrom=2020-01-01&limit=500&maxPages=1000&windowDays=30
GET /api/novapay/payments?history=all&historyFrom=2020-01-01&includeExtract=true&includeRegisters=true&windowDays=31
```

Last prototype PID at handoff time: `21476`, listening on `0.0.0.0:8789`.

## Next engineering tasks

1. NovaPay: resolve `NPAY_REGISTER_CREATE_FAILED` with NovaPay support/cabinet settings. Need register export that includes TTN-level payment details.
2. NovaPay: after register rows include TTN, rerun `Отримати платежі`, then verify automatic CRM payment creation by TTN and full order amount.
3. Nova Poshta: verify the API key/cabinet/counterparty that owns the TTNs. Current key returns empty document history even though API access works.
4. SQL import: full import still needs stocks, clients, warehouses, balances, not only the limited product subset.
5. UI QA: continue keeping all exchange actions in `Налаштування -> Обмін даними`, not scattered through Finance or Orders.
6. Git hygiene: raw logs/cache must stay local; only summarized logs/handoff docs go to GitHub.

## Exact current start command

```powershell
cd D:\Codex\CRM\marketplace-crm
powershell -NoProfile -ExecutionPolicy Bypass -File .\mock-api.ps1 -Port 8789 -BindAddress 0.0.0.0
```

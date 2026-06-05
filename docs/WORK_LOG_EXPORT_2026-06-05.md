# Marketplace CRM safe work-log export, 2026-06-05

This is the GitHub-safe continuation log for `1973zahar/crm-rozetka-api`.

Full local work log:

```text
D:\Codex\CRM\SQL\docs\crm-sql-work-log-2026-06-01.md
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

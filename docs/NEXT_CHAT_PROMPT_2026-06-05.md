# Prompt for the next chat

Продовжуємо Marketplace CRM з GitHub repo:
https://github.com/1973zahar/crm-rozetka-api

Локальна папка:
D:\Codex\CRM\marketplace-crm

Підсумковий handoff:
D:\Codex\CRM\marketplace-crm\docs\HANDOFF_2026-06-05_MARKETPLACE_CRM.md

Work log:
D:\Codex\CRM\SQL\docs\crm-sql-work-log-2026-06-01.md

Repo-safe log export:
D:\Codex\CRM\marketplace-crm\docs\WORK_LOG_EXPORT_2026-06-05.md

Обов'язково:
- всі вдалі та провальні дії писати в work log;
- кожну помилку фіксувати з кодом;
- 1C production server не перезавантажувати;
- не писати назад у 1C;
- не пушити `.env`, `.secrets`, `.cache`, `crm-http*.ndjson`, raw logs;
- після змін перевіряти `node --check app.js`, PowerShell parser для `mock-api.ps1`, запуск прототипу.

Поточний build:
v2026.06.05.2 / 20260605-full-history-np-npay-1

Поточний LAN URL:
http://192.168.4.14:8789/index.html?build=20260605-full-history-np-npay-1

Де працювати в CRM:
`Налаштування -> Обмін даними`.

Поточний стан:
- Rozetka має 4 кнопки в верхньому блоці: товари, замовлення, питання клієнтів, звернення маркетплейсу.
- Nova Poshta full-history gateway працює технічно, але реальний API повернув 0 документів за 2020-01-01..2026-06-05. Код ситуації: `NP_DOCUMENTS_EMPTY_FROM_CABINET`.
- NovaPay full-history gateway працює технічно і cache має 1 платіж, але register export падає з `NPAY_REGISTER_CREATE_FAILED: logic_errorAPIError`, а cached-платіж не має TTN, тому автоматична оплата не створюється. Код ситуації: `NPAY_EMPTY_TTN`.
- Треба продовжити з NovaPay register access або знайти інший NovaPay endpoint/export, який дає TTN у платежах, потім перевірити автоматичне створення оплат у CRM.

Почни з:
1. Прочитай `docs/HANDOFF_2026-06-05_MARKETPLACE_CRM.md`.
2. Перевір `git status`, `.gitignore`, і що raw logs/cache не йдуть у commit.
3. Запусти/перевір прототип на `8789`.
4. Продовжуй задачу: NovaPay register/TTN, Nova Poshta cabinet documents, SQL full import.

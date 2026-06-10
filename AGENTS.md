# Marketplace CRM Repo Agent Rules

Read the workspace rules first:

```text
D:\Codex\CRM\AGENTS.md
D:\Codex\CRM\docs\PROJECT_SHARED_RULES.md
D:\Codex\CRM\docs\PROJECT_SHARED_KNOWLEDGE_BASE.md
D:\Codex\CRM\docs\PROJECT_ACCESS_MAP.md
```

Every chat created for this Marketplace CRM repo must obey the workspace rules, this local AGENTS.md, and the repo handoff before making changes.
Every Marketplace CRM repo chat must reread the shared knowledge base before marketplace workflow, API, contract, SQL data, import/export, or cross-block changes.
Every Marketplace CRM repo chat must use documented credential aliases/paths from PROJECT_ACCESS_MAP.md before asking the owner for access context. Never ask for raw passwords in chat.
Every Marketplace CRM repo chat must use live backend/PostgreSQL access for shared data. Product, stock, clients, marketplace orders and payments must use paginated/searchable backend endpoints, not full browser arrays.

Then read this repo handoff:

```text
D:\Codex\CRM\marketplace-crm\docs\HANDOFF_2026-06-06_MARKETPLACE_CRM.md
D:\Codex\CRM\marketplace-crm\docs\WORK_LOG_SAFE_2026-06-06_MARKETPLACE_CRM.md
```

Always log project actions to:

```text
D:\Codex\CRM\SQL\docs\crm-sql-work-log-2026-06-01.md
```

Update shared durable facts in:

```text
D:\Codex\CRM\docs\PROJECT_SHARED_KNOWLEDGE_BASE.md
```

This repo owns marketplace orders, publications, logistics, exchange UI, and marketplace operational workflows. Do not share `.env`, `.secrets`, `.cache`, `crm-http*.ndjson`, or raw logs.

Architecture principle: this repo is one autonomous block in an Odoo-like modular CRM. It should interact with the main PostgreSQL/SQL core instead of owning duplicated master data.

# Domain Docs

How the engineering skills should consume this project's domain documentation when exploring the codebase.

## Before exploring, read these

- **`CONTEXT.md`** at the project root — the glossary. It names each domain concept, gives the canonical value set, and lists the terms to avoid with the document each stale term came from. Where a numbered doc and `CONTEXT.md` disagree, `CONTEXT.md` wins — that is what its `_Avoid_` entries record.
- **`Docs/`** at the project root — the authoritative spec set behind the glossary:
  - `01-Needle_Management_System_PRD_v2.0.md` — product requirements
  - `02-Business-Process.md`, `03-Use-Case.md`, `04-Functional-Requirements.md`
  - `05-System-Architecture.md`, `06-Application-Architecture.md` — architecture, incl. the exchange state machine (§10) and stock ledger rules (§11-14)
  - `07-SRS-Mobile-Android.md`, `08-SRS-WebApps.md` — per-client SRS
  - `09-API-Specification.md`, `12-OpenAPI-Swagger-Specification.md` — API contract (source of truth for endpoints)
  - `10-Database-Design.md`, `11-Database-ERD-Physical-Schema.md`
  - `13-RFID-Integration-Specification.md`, `14-WhatsApp-Integration-Specification.md`, `15-Mobile-Offline-Sync-Specification.md`
  - `17-Mobile-UI-UX-Specification.md`, `18-WebApps-UI-UX-Specification.md`
  - `19-Backend-Folder-Structure.md`, `20-Claude-Code-Backend-Setup-Prompting-Guide.md`
  - `design.md` — the WebApps stack and design system
  - `Flutter_rules/rules.md` — Flutter/mobile coding rules
  - There is no 16 — the set runs 01–15 and 17–20.
  - When in doubt about a requirement, read the relevant numbered doc before assuming.
- **`Docs/adr/`** — architectural decisions taken from this point on, one file each. It currently holds `0001-dashboard-v1-scoped-to-existing-contract.md`. The first six decisions (ADR-001…006: modular monolith, PostgreSQL, trolley-as-location, backend-as-stock-authority, offline-first Android, WhatsApp-as-notification-only) live as prose in `Backend/CLAUDE.md` §2 rather than as separate files — treat that section as authoritative for those six until they are migrated here.

## File structure

```
/
├── CLAUDE.md                ← root rules + routing
├── CONTEXT.md               ← glossary (tiebreaker over Docs/)
├── Docs/                    ← domain reference (PRD, architecture, specs — see above)
│   ├── agents/              ← this config
│   └── adr/                 ← ADRs from 0001 on (ADR-001..006 are prose in Backend/CLAUDE.md §2)
├── Backend/                 ← NestJS API
│   ├── CLAUDE.md            ← backend rules, ADRs, module boundary
│   ├── ARCHITECTURE.md      ← how the backend is built and why
│   └── README.md            ← setup, commands, endpoint reference
├── WebApps/                 ← Next.js management app (see .claude/agents/webapps-dev.md)
└── .scratch/                ← specs and issues (see issue-tracker.md)
```

Note the casing: the directory is `Docs/`, capital D. There is no lowercase `docs/` at the root.

Single-context project — no `CONTEXT-MAP.md` / no monorepo split. Active build focus is `WebApps/`; the backend is complete and stable as the API foundation.

## Use the domain's vocabulary

When your output names a domain concept (in an issue title, a refactor proposal, a hypothesis, a test name), use the term `CONTEXT.md` gives it — "exchange", "trolley", "fragment status", "stock ledger" — and check its `_Avoid_` line, which lists the stale synonyms still circulating in the older specs.

## Flag ADR conflicts

If your output contradicts an existing ADR (the six in `Backend/CLAUDE.md` §2, or any later ones in `Docs/adr/`), surface it explicitly rather than silently overriding:

> _Contradicts ADR-004 (Backend as Stock Authority) — but worth reopening because…_

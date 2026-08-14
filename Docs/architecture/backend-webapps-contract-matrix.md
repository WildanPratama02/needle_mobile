# Backend ↔ WebApps Contract Matrix

**Date:** 2026-08-13 · **Companion to:** [`backend-webapps-gap-analysis.md`](./backend-webapps-gap-analysis.md)

Every row is verified against source. A cell reading `READY` means the capability was found in running code, not in a document.

## Value legend

| Value | Meaning |
|---|---|
| `READY` | Verified present and correct in source |
| `PARTIAL` | Exists but incomplete against the screen's need |
| `MISSING` | Not implemented |
| `DRIFT` | Implementation and `Docs/` disagree |
| `BLOCKED` | Cannot proceed until a dependency lands |
| `DECISION_REQUIRED` | Not resolvable from code or docs |
| `N/A` | Not applicable to this row |

**Owner** is `BE` (Backend), `FE` (WebApps), `DOC` (documentation), or `PRODUCT`.

---

## Matrix

| WebApp Module | Screen | API | Backend Status | Contract Status | RBAC | Scope | Pagination | Sorting | Filters | Response Ready | WebApp Status | Owner | Priority |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| auth | Login | `POST /auth/login` | READY | READY | N/A (`@Public`) | N/A | N/A | N/A | N/A | READY | READY | — | — |
| auth | Session refresh | `POST /auth/refresh` | READY | READY | N/A (`@Public`) | N/A | N/A | N/A | N/A | READY | READY | — | — |
| auth | Logout | `POST /auth/logout` | READY | READY | N/A (`@Public`) | N/A | N/A | N/A | N/A | READY (204) | READY | — | — |
| auth | Current user | `GET /auth/me` | READY | READY | READY (authenticated) | READY (returns both dims) | N/A | N/A | N/A | READY | READY | — | — |
| dashboard | KPI row | `GET /dashboard/overview` | MISSING | DRIFT (doc-only, `Docs/12` §1023) | MISSING | MISSING | N/A | N/A | MISSING | MISSING | READY (fixture, ADR-0001) | BE | P2 |
| dashboard | Exchange trend chart | `GET /dashboard/exchange-trend` | MISSING | DRIFT (doc-only, §1048) | MISSING | MISSING | N/A | N/A | MISSING | MISSING | READY (fixture) | BE | P2 |
| dashboard | Top needle types | `GET /dashboard/needle-consumption` | MISSING | DECISION_REQUIRED (no payload in §1075) | MISSING | MISSING | N/A | N/A | MISSING | MISSING | READY (invented shape) | PRODUCT → BE | P2 |
| dashboard | Stock alert panel | `GET /dashboard/stock-summary` | MISSING | DECISION_REQUIRED (no payload in §1088) | MISSING | MISSING | N/A | N/A | MISSING | MISSING | READY (invented shape) | PRODUCT → BE | P2 |
| dashboard | Pending confirmations | `GET /confirmations?status=PENDING` | READY | READY | READY | READY | READY | PARTIAL (no tiebreaker) | READY | READY | READY (fixture — real endpoint available) | FE | P2 |
| transactions | Exchange list | `GET /exchanges` | READY | DRIFT (5 of 13 documented filters) | READY (`EXCHANGE_VIEW`) | READY (query-level) | READY | MISSING (fixed `createdAt desc`, no tiebreaker) | PARTIAL | PARTIAL (ids, no names) | READY | BE | P1 |
| transactions | — status filter | `GET /exchanges?status=` | PARTIAL | DRIFT (unvalidated `@IsString`, 500 on bad value) | READY | READY | N/A | N/A | PARTIAL | N/A | READY | BE | **P0** |
| transactions | — trolley filter | `GET /exchanges?trolleyId=` | READY (`@IsUUID`) | DRIFT (UI sends free text → 400) | READY | READY | N/A | N/A | BLOCKED | N/A | BLOCKED | FE + BE | P1 |
| transactions | — date range filter | `GET /exchanges?dateFrom/dateTo` | MISSING | DRIFT (documented §608, shown in Docs/18 §12) | N/A | N/A | N/A | N/A | MISSING | N/A | MISSING (correctly not built) | BE | P2 |
| transactions | Exchange detail | `GET /exchanges/:id` | READY | READY | READY (`EXCHANGE_VIEW`) | READY (`assertFactoryScope` → 403) | N/A | N/A | N/A | PARTIAL (identical to list DTO, ids only) | READY | BE | P2 |
| transactions | Evidence gallery | `GET /exchanges/:id/evidence` | READY | READY | READY (`EXCHANGE_VIEW`) | READY | N/A | N/A | N/A | READY (presigned `url`) | READY | — | — |
| transactions | Audit timeline | `GET /audit-logs?entityType=Exchange&entityId=` | READY | READY | READY (`AUDIT_VIEW`, narrower than page) | READY | READY | READY (`timestamp desc, id desc`) | READY | PARTIAL (raw `actorUserId`) | READY | BE | P2 |
| transactions | Confirmation panel | `GET /confirmations/:id` + approve/reject | READY | READY | READY (3 distinct codes) | READY | N/A | N/A | N/A | PARTIAL (raw `requestedToUserId`, `decidedBy`) | READY | BE | P2 |
| transactions | Cancel exchange | `POST /exchanges/:id/cancel` | READY | READY | READY (`EXCHANGE_CANCEL`) | READY | N/A | N/A | N/A | READY | MISSING | PRODUCT | DECISION_REQUIRED |
| confirmation | Monitoring list | `GET /confirmations` | READY | READY | READY (`CONFIRMATION_VIEW`) | READY (query-level) | READY | PARTIAL (`requestedAt desc`, no tiebreaker) | READY (all 4 params) | PARTIAL (raw user ids) | READY | BE | P2 |
| confirmation | Status tabs | `GET /confirmations?status=` | READY (`@IsEnum`) | READY | READY | READY | N/A | N/A | READY | READY | READY | — | — |
| confirmation | Detail | `GET /confirmations/:id` | READY | READY | READY | READY | N/A | N/A | N/A | PARTIAL (raw user ids) | READY | BE | P2 |
| confirmation | Approve | `POST /confirmations/:id/approve` | READY | READY | READY (`CONFIRMATION_APPROVE`) | READY | N/A | N/A | N/A | READY | READY | — | — |
| confirmation | Reject | `POST /confirmations/:id/reject` | READY | READY | READY (`CONFIRMATION_REJECT`) | READY | N/A | N/A | N/A | READY | READY | — | — |
| audit | Audit log page | `GET /audit-logs` | READY | READY (doc/code/client agree) | READY (`AUDIT_VIEW`) | READY (query-level intersect) | READY (capped 100) | READY (only endpoint with tiebreaker) | READY (all 9) | PARTIAL (raw `actorUserId`, `factoryId`) | READY | BE | P2 |
| administration | Users | `GET/POST/PATCH/DELETE /users` | MISSING | DRIFT (documented §1106-1118) | MISSING | MISSING | MISSING | MISSING | MISSING | MISSING | MISSING (stub) | BE | P2 |
| administration | Roles & permissions | `/users/:id/roles`, role catalogue | MISSING | DRIFT (documented §1114-1115) | MISSING | MISSING | MISSING | MISSING | MISSING | MISSING | MISSING (stub) | BE | P3 |
| administration | Devices | `/devices` (5 routes) | MISSING | DRIFT (documented §299) | MISSING | MISSING | MISSING | MISSING | MISSING | MISSING | MISSING (stub) | BE | P3 |
| master-data | Needle Type | `/needle-types` (6 routes) | MISSING | DRIFT (documented §352) | MISSING | MISSING | MISSING | MISSING | MISSING | MISSING | MISSING (stub) | BE | P1 |
| master-data | Exchange Type | `GET /exchange-types` | MISSING | DRIFT (documented §377) | MISSING | MISSING | MISSING | MISSING | MISSING | MISSING | MISSING (stub) | BE | P1 |
| master-data | Factory | `/factories` (6 routes) | MISSING | DRIFT (documented §222) | MISSING | MISSING | MISSING | MISSING | MISSING | MISSING | MISSING (stub) | BE | P1 |
| master-data | Trolley | `/trolleys` (4 routes) | MISSING | DRIFT (documented §276) | MISSING | MISSING | MISSING | MISSING | MISSING | MISSING | MISSING (stub) | BE | P1 |
| master-data | Storage / Needle Hole | `/locations` | MISSING | DRIFT (documented §245) | MISSING | MISSING | MISSING | MISSING | MISSING | MISSING | MISSING (stub) | BE | P2 |
| master-data | Employee | `/employees` | MISSING | DRIFT (documented §320) | MISSING | MISSING | MISSING | MISSING | MISSING | MISSING | MISSING (stub) | BE | P1 |
| master-data | RFID Card | `/rfid/cards/:id` | MISSING | DRIFT (documented §320) | MISSING | MISSING | MISSING | MISSING | MISSING | MISSING | MISSING (stub) | BE | P3 |
| inventory | Stock Overview | `GET /inventory/balances` | MISSING | DRIFT (documented §823) | MISSING | MISSING | MISSING | MISSING | MISSING | MISSING | MISSING (stub) | BE | P3 |
| inventory | Stock Movement | `GET /inventory/movements` | MISSING | DRIFT (documented §873) | MISSING | MISSING | MISSING | MISSING | MISSING | MISSING | MISSING (stub) | BE | P3 |
| inventory | Receiving | `POST /inventory/receivings` | MISSING | DRIFT (documented §905) | MISSING | MISSING | N/A | N/A | N/A | MISSING | MISSING (stub) | BE | P3 |
| inventory | Transfer | `POST /inventory/transfers` | MISSING | DRIFT (documented §929) | MISSING | MISSING | N/A | N/A | N/A | MISSING | MISSING (stub) | BE | P3 |
| inventory | Adjustment | `POST /inventory/adjustments` | MISSING | DRIFT (documented §968) | MISSING | MISSING | N/A | N/A | N/A | MISSING | MISSING (stub) | BE | P3 |
| analytics | Analytics | `/dashboard/*` + reporting | MISSING | DRIFT | MISSING | MISSING | MISSING | MISSING | MISSING | MISSING | MISSING (stub) | BE | P3 |
| _cross-cutting_ | Sidebar visibility | `GET /auth/me` → `permissions` | READY | READY | READY (data present) | READY | N/A | N/A | N/A | READY | MISSING (20 items, unfiltered) | FE | P1 |
| _cross-cutting_ | Permission guard helper | `core/permissions/index.ts` | READY (data present) | N/A | N/A | N/A | N/A | N/A | N/A | READY | MISSING (`export {}`, 4 inline dupes) | FE | P1 |
| _cross-cutting_ | Factory name resolution | `GET /factories` | MISSING | DRIFT | MISSING | MISSING | N/A | N/A | N/A | MISSING | BLOCKED (`code`/`name` echo the id) | BE | P1 |
| _cross-cutting_ | Location scope usage | `GET /auth/me` → `locationIds` | READY | READY | READY | READY | N/A | N/A | N/A | READY | MISSING (fetched, unused) | PRODUCT | DECISION_REQUIRED |
| _cross-cutting_ | Health / readiness probe | `GET /health`, `GET /ready` | MISSING | DRIFT (documented) | N/A | N/A | N/A | N/A | N/A | MISSING | N/A | BE | P2 |

---

## Rollup by module

| WebApps module | Screens | READY | BLOCKED | MISSING | Verdict |
|---|---|---|---|---|---|
| auth | 4 | 4 | 0 | 0 | **READY** |
| confirmation | 5 | 5 | 0 | 0 | **READY** (name resolution is cosmetic) |
| audit | 1 | 1 | 0 | 0 | **READY** (name resolution is cosmetic) |
| transactions | 8 | 5 | 2 | 1 | **PARTIAL** — usable, trolley filter broken |
| dashboard | 5 | 0 | 0 | 5 | **PARTIAL** — renders on sanctioned fixtures |
| master-data | 7 | 0 | 7 | 7 | **BLOCKED** |
| administration | 3 | 0 | 3 | 3 | **BLOCKED** |
| inventory | 5 | 0 | 5 | 5 | **BLOCKED** |
| analytics | 1 | 0 | 1 | 1 | **BLOCKED** |

## Rollup by backend module

| Backend module | Registered | Routes | Status |
|---|---|---|---|
| identity | Yes | 4 | READY (auth only — no user administration) |
| exchange | Yes | 13 | READY (2 filter defects) |
| approval | Yes | 4 | READY |
| audit | Yes | 1 | READY |
| notification | Yes | 0 (queue only) | READY |
| device | **No** | 0 | MISSING |
| employee | **No** | 0 | MISSING |
| master-data | **No** | 0 | MISSING |
| inventory | **No** | 0 | MISSING |
| reporting | **No** | 0 | MISSING |
| synchronization | **No** | 0 | MISSING |
| rfid | **No** | 0 | MISSING |

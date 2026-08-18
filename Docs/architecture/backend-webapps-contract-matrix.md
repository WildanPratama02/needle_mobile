# Backend ↔ WebApps Contract Matrix

**First written:** 2026-08-13 · **Refreshed:** 2026-08-14 · **Companion to:** [`backend-webapps-gap-analysis.md`](./backend-webapps-gap-analysis.md)

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
| auth | Current user | `GET /auth/me` | READY | READY | READY (authenticated) | READY (both dims) | N/A | N/A | N/A | READY | READY | — | — |
| dashboard | KPI row | `GET /dashboard/overview` | MISSING | DRIFT (doc-only, §1023) | MISSING | MISSING | N/A | N/A | MISSING | MISSING | READY (fixture, ADR-0001) | BE | P2 |
| dashboard | Exchange trend chart | `GET /dashboard/exchange-trend` | MISSING | DRIFT (doc-only, §1048) | MISSING | MISSING | N/A | N/A | MISSING | MISSING | READY (fixture) | BE | P2 |
| dashboard | Top needle types | `GET /dashboard/needle-consumption` | MISSING | DECISION_REQUIRED (no payload, §1075) | MISSING | MISSING | N/A | N/A | MISSING | MISSING | READY (invented shape) | PRODUCT → BE | P2 |
| dashboard | Stock alert panel | `GET /dashboard/stock-summary` | MISSING | DECISION_REQUIRED (no payload, §1088) | MISSING | MISSING | N/A | N/A | MISSING | MISSING | READY (invented shape) | PRODUCT → BE | P2 |
| dashboard | Pending confirmations | `GET /confirmations?status=PENDING` | READY | READY | READY | READY | READY | READY | READY | READY | READY (fixture — real endpoint available) | FE | P2 |
| transactions | Exchange list | `GET /exchanges` | READY | DRIFT (5 of 13 documented filters) | READY (`EXCHANGE_VIEW`) | READY (query-level) | READY | READY (`createdAt desc, id desc`) | PARTIAL | READY (names resolved) | READY | BE | P2 |
| transactions | — status filter | `GET /exchanges?status=` | READY | READY (`@IsEnum`, 12 values published) | READY | READY | N/A | N/A | READY | N/A | READY | — | — |
| transactions | — trolley filter | `GET /exchanges?trolleyId=` | READY (`@IsUUID`) | READY (UI sends real ids) | READY | READY | N/A | N/A | READY | N/A | READY (select) | — | — |
| transactions | — date range filter | `GET /exchanges?dateFrom/dateTo` | MISSING | DRIFT (documented §608, shown in Docs/18 §12) | N/A | N/A | N/A | N/A | MISSING | N/A | MISSING (correctly not built) | BE | P2 |
| transactions | Exchange detail | `GET /exchanges/:id` | READY | READY | READY (`EXCHANGE_VIEW`) | READY (403 out of scope) | N/A | N/A | N/A | PARTIAL (same DTO as list; device id raw) | READY | BE | P3 |
| transactions | Evidence gallery | `GET /exchanges/:id/evidence` | READY | READY | READY | READY | N/A | N/A | N/A | READY (presigned `url`) | READY | — | — |
| transactions | Audit timeline | `GET /audit-logs?entityType=Exchange&entityId=` | READY | READY | READY (`AUDIT_VIEW`, gated) | READY | READY | READY | READY | PARTIAL (raw `actorUserId`) | READY | BE | P2 |
| transactions | Confirmation panel | `GET /confirmations/:id` + approve/reject | READY | READY | READY (3 codes, per-action gated) | READY | N/A | N/A | N/A | PARTIAL (raw user ids) | READY | BE | P2 |
| transactions | Cancel exchange | `POST /exchanges/:id/cancel` | READY | READY | READY (`EXCHANGE_CANCEL`) | READY | N/A | N/A | N/A | READY | MISSING | PRODUCT | DECISION_REQUIRED |
| confirmation | Monitoring list | `GET /confirmations` | READY | READY | READY (`CONFIRMATION_VIEW`) | READY (query-level) | READY | READY (`requestedAt desc, id desc`) | READY | PARTIAL (raw user ids) | READY | BE | P2 |
| confirmation | Status tabs | `GET /confirmations?status=` | READY (`@IsEnum`) | READY | READY | READY | N/A | N/A | READY | READY | READY | — | — |
| confirmation | Detail | `GET /confirmations/:id` | READY | READY | READY | READY | N/A | N/A | N/A | PARTIAL (raw user ids) | READY | BE | P2 |
| confirmation | Approve / Reject | `POST /confirmations/:id/{approve,reject}` | READY | READY | READY (separate codes) | READY | N/A | N/A | N/A | READY | READY | — | — |
| audit | Audit log page | `GET /audit-logs` | READY | READY (doc/code/client agree) | READY (`AUDIT_VIEW`) | READY (query-level intersect) | READY (capped 100) | READY | READY (all 9) | PARTIAL (raw `actorUserId`) | READY | BE | P2 |
| master-data | Needle Type | `GET /needle-types` | READY | READY | READY (`MASTER_VIEW`) | N/A (global catalogue) | READY | READY (`code asc, id asc`) | READY (`status`) | READY | READY | — | — |
| master-data | Exchange Type | `GET /exchange-types` | READY | READY | READY (`MASTER_VIEW`) | N/A (global catalogue) | READY | READY | READY | READY | READY | — | — |
| master-data | Factory | `GET /factories` | READY | READY | READY (`MASTER_VIEW`) | READY (own id) | READY | READY | READY | READY | READY | — | — |
| master-data | Trolley | `GET /trolleys` | READY | READY | READY (`MASTER_VIEW`) | READY (query-level) | READY | READY | READY | READY | READY | — | — |
| master-data | Employee | `GET /employees` | READY | READY | READY (`MASTER_VIEW`) | READY (query-level) | READY | READY | READY | READY | READY | — | — |
| master-data | Storage / Needle Hole | `GET /locations` | READY | READY | READY (`MASTER_VIEW`) | READY (query-level) | READY | READY | READY | READY | MISSING (screen unbuilt) | FE | P3 |
| master-data | RFID Card | `/rfid/cards/:id` | MISSING | DRIFT (documented §320) | MISSING | MISSING | MISSING | MISSING | MISSING | MISSING | MISSING (nav disabled) | BE | P3 |
| master-data | *writes* | `POST`/`PATCH`/activate/deactivate | MISSING | DRIFT (documented) | MISSING | MISSING | N/A | N/A | N/A | MISSING | MISSING | BE | P3 |
| administration | Users | `/users` (8 routes) | MISSING | DRIFT (documented §1106-1118) | MISSING | MISSING | MISSING | MISSING | MISSING | MISSING | MISSING (nav disabled) | BE | P2 |
| administration | Roles & permissions | `/users/:id/roles` | MISSING | DRIFT (documented §1114-1115) | MISSING | MISSING | MISSING | MISSING | MISSING | MISSING | MISSING (nav disabled) | BE | P3 |
| administration | Devices | `/devices` (5 routes) | MISSING | DRIFT (documented §299) | MISSING | MISSING | MISSING | MISSING | MISSING | MISSING | MISSING (nav disabled) | BE | P3 |
| inventory | Stock Overview / Movement | `GET /inventory/{balances,movements}` | MISSING | DRIFT (§823, §873) | MISSING | MISSING | MISSING | MISSING | MISSING | MISSING | MISSING (nav disabled) | BE | P3 |
| inventory | Receiving / Transfer / Adjustment | `POST /inventory/*` | MISSING | DRIFT (§905, §929, §968) | MISSING | MISSING | N/A | N/A | N/A | MISSING | MISSING (nav disabled) | BE | P3 |
| analytics | Analytics | `/dashboard/*` + reporting | MISSING | DRIFT | MISSING | MISSING | MISSING | MISSING | MISSING | MISSING | MISSING (nav disabled) | BE | P3 |
| _operational_ | Liveness | `GET /health` | READY | READY (`Docs/12` §29) | N/A (`@Public`) | N/A | N/A | N/A | N/A | READY | N/A | — | — |
| _operational_ | Readiness | `GET /ready` | READY (probes Postgres + Redis) | READY | N/A (`@Public`) | N/A | N/A | N/A | N/A | READY (503 when down) | N/A | — | — |
| _operational_ | Rate limiting on `/auth/*` | — | MISSING | N/A | N/A | N/A | N/A | N/A | N/A | MISSING | N/A | BE | **P0** |
| _operational_ | Idempotency stale-reservation policy | — | MISSING | N/A | N/A | N/A | N/A | N/A | N/A | MISSING | N/A | BE | P1 |
| _operational_ | Audit / notification delivery guarantee | — | MISSING | N/A | N/A | N/A | N/A | N/A | N/A | MISSING | N/A | BE + PRODUCT | P1 |
| _cross-cutting_ | Sidebar visibility | `GET /auth/me` → `permissions` | READY | READY | READY | READY | N/A | N/A | N/A | READY | READY (filtered; unbuilt disabled) | — | — |
| _cross-cutting_ | Permission guard helper | `core/permissions` | READY | N/A | N/A | N/A | N/A | N/A | N/A | READY | READY (predicate + hooks) | — | — |
| _cross-cutting_ | Name resolution | master-data lookup | READY | READY | READY | READY | N/A | N/A | N/A | READY | READY (cached, per collection) | — | — |
| _cross-cutting_ | **User**-name resolution | `GET /users` | MISSING | DRIFT | MISSING | MISSING | N/A | N/A | N/A | MISSING | BLOCKED (3 fields raw) | BE | P2 |
| _cross-cutting_ | Device-name resolution | `GET /devices` | MISSING | DRIFT | MISSING | MISSING | N/A | N/A | N/A | MISSING | BLOCKED (1 field raw) | BE | P3 |
| _cross-cutting_ | Location scope usage | `GET /auth/me` → `locationIds` | READY | READY | READY | READY | N/A | N/A | N/A | READY | MISSING (fetched, unused) | PRODUCT | DECISION_REQUIRED |

---

## Rollup by WebApps module

| Module | Screens | READY | BLOCKED / MISSING | Verdict |
|---|---|---|---|---|
| auth | 4 | 4 | 0 | **READY** |
| master-data | 7 | 5 | 2 (Storage, RFID Card) | **READY** for what shipped |
| confirmation | 5 | 5 | 0 | **READY** (user ids cosmetic) |
| audit | 1 | 1 | 0 | **READY** (actor ids cosmetic) |
| transactions | 8 | 7 | 1 (cancel — decision) | **READY** |
| dashboard | 5 | 1 | 4 | **PARTIAL** — renders on sanctioned fixtures |
| administration | 3 | 0 | 3 | **BLOCKED** |
| inventory | 5 | 0 | 5 | **BLOCKED** |
| analytics | 1 | 0 | 1 | **BLOCKED** |

## Rollup by backend module

| Backend module | Registered | Routes | Status |
|---|---|---|---|
| identity | Yes | 4 | READY (auth only — no user administration) |
| master-data | Yes | 12 | READY (read-only; writes deferred) |
| exchange | Yes | 13 | READY |
| approval | Yes | 4 | READY |
| audit | Yes | 1 | READY |
| notification | Yes | 0 (queue only) | READY |
| health *(not a domain module)* | Yes | 2 | READY |
| device | **No** | 0 | MISSING |
| employee | **No** | 0 | MISSING — covered for reads by master-data |
| inventory | **No** | 0 | MISSING |
| reporting | **No** | 0 | MISSING |
| synchronization | **No** | 0 | MISSING |
| rfid | **No** | 0 | MISSING |

**36 HTTP routes**, 6 of 12 domain modules implemented, plus 2 operational probes outside the API prefix.

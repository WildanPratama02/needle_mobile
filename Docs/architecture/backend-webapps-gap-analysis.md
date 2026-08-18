# Backend ↔ WebApps Gap Analysis

**First written:** 2026-08-13 · **Refreshed:** 2026-08-14
**Method:** source inspection only. Every claim below is verified against running source — controllers, DTOs, services, repositories, Prisma schema, WebApps data-sources and components. Where `Docs/` and code disagree, code is treated as the source of truth and the disagreement is recorded rather than silently resolved.

> **Refresh note.** Four specs have shipped since the first writing — `master-data`, `client-authorization`, `backend-correctness`, on top of exchange tickets 01–17. Nine of the fourteen action-plan items are closed. Sections below carry the current numbers; the closed items are listed in §18 with what shipped, so the original findings stay traceable rather than being quietly deleted.

> **Location note.** The original request named `docs/architecture/`. This repository's root documentation directory is `Docs/` (capital D) and there is no lowercase `docs/`. These artifacts therefore live in `Docs/architecture/`.

---

## 1. Executive summary

The two halves of this system are now joined by a real seam rather than a thin one.

**The backend implements 36 routes across 6 of its 12 planned domain modules**, plus two operational probes outside the API surface. Auth, exchange, approval, audit and master-data are complete, transactional, scope-enforced and audited. Six modules — `device`, `employee`, `inventory`, `reporting`, `synchronization`, `rfid` — remain empty folders whose Prisma schema is seeded but whose HTTP surface does not exist.

**The WebApps app has 9 reachable screens against 20 declared navigation entries**, and the other 11 entries are now visibly disabled rather than 404s. Six feature modules call real endpoints (auth, transactions, confirmation, audit, master-data, and dashboard's confirmation widget); dashboard's four KPI sources still run on fixtures behind an explicit ADR; three (administration, analytics, inventory) remain one-line `index.ts` stubs.

**The finding that dominated the first writing — name resolution — is largely closed.** Factories, trolleys, needle types, exchange types and employees all resolve to names through one cached lookup layer in `core/master-data`, and the exchange type arrives projected on the row itself. What remains is **user** ids: `requestedToUserId`, `decidedBy` and `actorUserId` still render raw, because no `/users` endpoint exists. That is now the single largest remaining client-visible gap, and it is one endpoint away.

**What has replaced it as the top concern is operational, not functional.** The API contract is in good shape; the three findings blocking production exposure — no rate limiting, an idempotency key that can wedge, and at-most-once audit delivery — are untouched and are what stand between "correct" and "deployable".

**Counts by classification.** Two registers, counted separately: the 14 items in [`backend-webapps-action-plan.md`](./backend-webapps-action-plan.md), and the 7 drift items in §13.

| Classification | Action-plan items | Of which closed | Drift register (§13) |
|---|---|---|---|
| REAL_API_GAP | 8 | 5 | 1 (DD-5, closed) |
| WEBAPP_GAP | 3 | 3 | — |
| CONTRACT_DRIFT | 1 | 0 | 4 (DD-1…DD-4) |
| FRONTEND_ASSUMPTION | 1 | 1 | — |
| DOCUMENTATION_GAP | 1 | 0 | 2 (DD-6, DD-7) |
| PRODUCT_DECISION | 4 | 0 | — |
| NOT_APPLICABLE | 1 | — | — |

---

## 2. Backend module / API inventory

Registered in `app.module.ts`: `PrismaModule`, `HealthModule`, `IdentityModule`, `MasterDataModule`, `ExchangeModule`, `ApprovalModule`, `AuditModule`, `NotificationModule`, `RetentionModule`. Notification and Retention expose no HTTP surface.

All routes are prefixed `/api/v1` — **except the two health probes**, which are deliberately excluded from both the prefix and versioning so an orchestrator's probe URL survives a version bump.

### Identity — 4 routes

| Method | Path | Guard |
|---|---|---|
| POST | `/auth/login` | `@Public()` |
| POST | `/auth/refresh` | `@Public()` — rotates the refresh token |
| POST | `/auth/logout` | `@Public()` — 204 |
| GET | `/auth/me` | authenticated, no permission |

### Exchange — 11 routes

`POST /exchanges`, then `/operator`, `/type`, `/fragment`, `/new-needle`, `/issue`, `/store-used-needle`, `/complete`, `/cancel` on `:id`; plus `GET /exchanges/:id` and `GET /exchanges`. Permissions run `EXCHANGE_CREATE` / `EXCHANGE_ISSUE` / `EXCHANGE_COMPLETE` / `EXCHANGE_CANCEL` / `EXCHANGE_VIEW`; `CREATE_EXCHANGE`, `ISSUE_NEEDLE` and `CANCEL_EXCHANGE` are audited.

### Evidence — 2 routes

`POST /exchanges/:id/evidence` (`EXCHANGE_CREATE`), `GET /exchanges/:id/evidence` (`EXCHANGE_VIEW`).

### Approval — 4 routes

`GET /confirmations`, `GET /confirmations/:id`, `POST /confirmations/:id/approve`, `POST /confirmations/:id/reject`. Three distinct permission codes; approve and reject are audited.

### Audit — 1 route

`GET /audit-logs` (`AUDIT_VIEW`).

### Master data — 12 routes *(new since first writing)*

List and by-id for each of six collections: `/factories`, `/locations`, `/trolleys`, `/needle-types`, `/exchange-types`, `/employees`. All `MASTER_VIEW`, all read-only, none audited.

**Two scope classes, because the schema has two.** `Factory` (filtered on its own id), `Location`, `Trolley` and `Employee` carry a factory and intersect the caller's scope at the query level. `NeedleType` and `ExchangeType` have no `factoryId` column — they are business-wide catalogues and a `factoryId` filter on them is refused with 400 rather than accepted and ignored.

### Health — 2 routes *(new since first writing)*

`GET /health` (liveness, touches no dependency) and `GET /ready` (probes Postgres and Redis, 503 when either is unreachable). Both public, both `VERSION_NEUTRAL`, both returning `{ status, timestamp }` and nothing more. They live in `common/health/` rather than `src/modules/`, because a probe owns no business concept and a thirteenth domain module would misrepresent it.

### Not implemented

`device`, `employee`, `inventory`, `reporting`, `synchronization`, `rfid` — directories exist under `src/modules/` and are empty.

---

## 3. WebApps module inventory

Routes that exist: `/`, `/login`, `/dashboard`, `/transactions/exchange[/:id]`, `/transactions/confirmation[/:id]`, `/administration/audit`, and `/master-data/{needle-type,exchange-type,factory,trolley,employee}`.

| Feature module | Data source | State |
|---|---|---|
| `auth` | `core/auth/data-source.ts` — real | Working |
| `dashboard` | `api/data-source.ts` — **fixtures** | Fixture-first per `Docs/adr/0001` |
| `transactions` | real | Working; user ids still raw |
| `confirmation` | real | Working; user ids still raw |
| `audit` | real | Working; actor ids still raw |
| `master-data` | `core/master-data` — real | **Working** (5 screens) |
| `administration` | — | Stub (Audit Log lives under `audit`) |
| `analytics` | — | Stub |
| `inventory` | — | Stub |

Shared infrastructure now also carries `core/permissions` (predicate + hooks), `core/master-data` (cached lookup layer), `RequirePermission` and `MasterDataName`.

---

## 4. Backend ↔ WebApps mapping matrix

| WebApps module | Backend module | Backend status |
|---|---|---|
| auth | identity | Complete |
| dashboard (KPIs, trend, consumption, stock) | reporting | **Missing entirely** |
| dashboard (pending confirmations) | approval | Complete — widget still on a fixture |
| transactions | exchange + audit + approval | Complete |
| confirmation | approval | Complete |
| audit | audit | Complete |
| master-data (5 screens) | master-data | **Complete** |
| master-data (Storage, RFID Card) | master-data | API exists (`/locations`); screens unbuilt |
| administration → users | identity (user CRUD) | **Missing** |
| administration → roles | identity (RBAC admin) | **Missing** |
| administration → devices | device | **Missing** |
| inventory (5 screens) | inventory | **Missing** |
| analytics | reporting | **Missing** |

---

## 5. Endpoint contract comparison

### `GET /exchanges`

**Implemented:** `factoryId`, `trolleyId`, `status`, `page`, `pageSize`. Five parameters.
**Documented** (`Docs/12` §608): thirteen. Eight remain unimplemented: `deviceId`, `operatorId`, `exchangeTypeId`, `oldNeedleTypeId`, `newNeedleTypeId`, `dateFrom`, `dateTo`, `search`.

WebApps sends only the five real ones. **The frontend is correct; the document is aspirational.** Still CONTRACT_DRIFT, and still partly REAL_API_GAP for the date range that `Docs/18` §12's mockup shows.

**Both validation defects inside the five are now closed.** `status` is validated against the twelve-value enum and its published annotation matches; `trolleyId` is still `@IsUUID()` and the UI now supplies real ids from a select, so no input can produce a 400.

### `GET /confirmations`, `GET /audit-logs`, master-data lists

No drift. Each accepts exactly the parameters its DTO declares, and the client sends exactly those.

### Documented endpoints that still do not exist

| Documented | Blocks |
|---|---|
| `/devices` (5 routes) | Administration → Devices |
| `/rfid/cards/{id}` | Master Data → RFID Card |
| `/inventory/*` (11 routes) | Inventory (5 screens) |
| `/dashboard/*` (4 routes) | Dashboard real data, Analytics |
| `/users/*` (8 routes) | Administration → Users, **all user-name resolution** |
| `/mobile/bootstrap`, `/mobile/sync` | mobile client only |

Master-data writes (`POST`/`PATCH`/activate/deactivate) are documented and deliberately deferred; the read half shipped first because it needs no `CHANGE_MASTER` audit wiring.

### Implemented endpoints not represented in WebApps

The nine exchange write transitions and `POST /exchanges/:id/evidence`. Eight are trolley-floor PIC operations and their absence from a supervisor app is correct. **`POST /exchanges/:id/cancel` remains the exception** — plausibly a supervisor action, unanswerable from code. Still PD-1.

---

## 6. RBAC and scope comparison

**Backend is the authority and behaves correctly.** Guards run authenticate → permission → scope; factory scope is applied at the query level on every list endpoint and never widens, including the six new master-data lists.

**The client-side duplication is closed.** `core/permissions` now owns a pure predicate with exact-match, no-implication semantics mirroring the server, plus hooks over it. No component outside that module compares a permission string.

**The sidebar is permission-filtered.** Each navigation entry declares the permission its screen requires; entries the user lacks are hidden entirely, and a section whose entries all disappear takes its heading with it. Entries whose screens are unbuilt stay visible and disabled — a different statement from "not for you", and deliberately kept distinct.

**Location scope is still fetched and unused.** `MeResponseDto.locationIds` is delivered and no screen reads it. Not a defect while no shipped screen is location-scoped, but Inventory will force the question (PD-4).

---

## 7. DTO / response comparison

The envelope is correct and mirrored exactly on both sides. Field-level comparison:

| Backend DTO | WebApps type | Match |
|---|---|---|
| `ExchangeResponseDto` (18 fields) | `ExchangeListItem` (18 fields) | Exact — now includes `exchangeTypeCode`/`Name` |
| `ConfirmationResponseDto` + decisions | `Confirmation` + `ConfirmationDecision` | Exact |
| `AuditLogResponseDto` (11) | `AuditLogEntry` (11) | Exact |
| `MeResponseDto` (7) | `CurrentUser` (7) | Exact |
| `EvidenceListItemDto` | `EvidenceItem` (11) | Exact |
| Master-data DTOs (6) | `core/master-data/types.ts` | Exact |
| — | `DashboardOverview`, `ExchangeTrendPoint` | From `Docs/12` §15 example JSON, unverified |
| — | `NeedleConsumptionItem`, `StockSummary` | **Invented** — no documented payload |

`GET /exchanges/:id` still returns the identical DTO as the list. Any detail screen wanting more must get the backend to project more first.

---

## 8. Pagination, sorting and filtering

Pagination is consistent everywhere: 1-based `page`, `pageSize` capped at 100, `$transaction([findMany, count])` so page and total are read consistently.

**Sorting still does not exist as a contract** — no list endpoint accepts a sort parameter. But **every list now has a deterministic tiebreaker**:

| Endpoint | Order |
|---|---|
| `GET /exchanges` | `createdAt desc, id desc` |
| `GET /confirmations` | `requestedAt desc, id desc` |
| `GET /audit-logs` | `timestamp desc, id desc` |
| master-data lists | `code asc, id asc` |

The latent defect from the first writing — rows sharing a timestamp swapping between pages — is closed. WebApps still adds no client-side sorting, and columns still disable sorting explicitly rather than implying a parameter that does not exist.

---

## 9. Name resolution and relationship gaps

**Mostly closed.** One cached lookup layer fetches each reference collection whole — never per id — and resolves ids to labels across every screen. An id that cannot be resolved falls back to the id itself, visibly; nothing fabricates a name.

| Field | Resolves today? |
|---|---|
| `exchange.factoryId` | Yes — `/factories` |
| `exchange.trolleyId` | Yes — `/trolleys` |
| `exchange.operatorId` | Yes — `/employees` |
| `exchange.oldNeedleTypeId` / `newNeedleTypeId` | Yes — `/needle-types` |
| `exchange.exchangeTypeId` | Yes — **projected on the row**, no lookup |
| `exchange.deviceId` | **No** — no `/devices` |
| `confirmation.requestedToUserId` | **No** — no `/users` |
| `confirmation.decisions[].decidedBy` | **No** — no `/users` |
| `auditLog.actorUserId` | **No** — no `/users` |
| `auditLog.factoryId` | Yes — `/factories` |

The factory switcher in the TopBar shows real names. **`/users` is the one endpoint that closes three of the four remaining rows.**

---

## 10. Fixture and mock usage

Still exactly one production fixture source: `features/dashboard/api/fixtures.ts`, consumed only through `dashboard/api/data-source.ts`, sanctioned by `Docs/adr/0001` because `reporting` does not exist. The seam is enforced — no component imports `fixtures` — and the replacement body is written out in the file header.

No other fixture, mock, fake id or hardcoded permission exists in production code.

---

## 11. Frontend assumptions

**FA-1 — trolley filter — CLOSED.** It is a select over the real trolley list, scoped to the selected factory and cleared when the factory changes.

**FA-2 — two Dashboard shapes are invented — OPEN.** `NeedleConsumptionItem` and `StockSummary`/`StockAlertItem` are labelled in-file as best guesses. `StockAlertItem.factoryName`/`locationName` additionally assume a name-resolution capability on the server that exists nowhere else. Blocked on PD-2.

**FA-3 — sidebar assumed routes that do not exist — CLOSED.** Every entry now declares whether its screen is built; unbuilt entries render disabled rather than linking to a 404.

---

## 12. Shared infrastructure assessment

| Concern | State |
|---|---|
| API client, envelope typing, pagination, error/loading/empty | Ready |
| Factory scope store | Ready |
| Query layer, forms, notifications, charts | Ready |
| **Permission guard** | **Ready** — predicate + hooks in `core/permissions` |
| **Name resolution** | **Ready** — cached per-collection lookup in `core/master-data` |
| **Screen gating** | **Ready** — one `RequirePermission` wrapper |
| Sorting | No shared contract, correctly blocked on the backend |

Both gaps named in the first writing are closed. No module-specific hacks were needed to build Master Data on the existing infrastructure.

---

## 13. Documentation drift

Recorded, not resolved. `Docs/` is a historical specification set; the authoritative source for each row is named.

| ID | Drift | Authoritative | State |
|---|---|---|---|
| DD-1 | `Docs/12` §608 lists 13 filters on `GET /exchanges`; 5 implemented | Code | Open |
| DD-2 | `Docs/05` §24 defines an `/approvals` group; `/confirmations` exists | Code | Open |
| DD-3 | `Docs/09` §53's envelope differs from the implemented one | Code | Open |
| DD-4 | `Docs/12` documents `/mobile/bootstrap` and `/mobile/sync` | Neither | Open |
| DD-5 | `Docs/12` §29 documents `GET /health` and `GET /ready` | Doc | **Closed** — both implemented |
| DD-6 | `Docs/12` §1075/§1088 define two dashboard endpoints with no example payload | Neither | Open (PD-2) |
| DD-7 | `Backend/CLAUDE.md` §4 mandates audit rows for 11 events; 5 are wired | Rule | Open — the other 6 belong to unbuilt modules |

One drift was introduced deliberately and is worth stating: `Docs/12` §29's example shows a bare `{ status, timestamp }`, while the implementation wraps it in the standard envelope from §7. The envelope is the project-wide contract and wins; a probe reads the status code regardless.

---

## 14. The remaining dependency chain

The first writing named read-only master data as the smallest chain unlocking the most modules. **That shipped, and it delivered what was predicted**: four existing modules improved and Master Data unblocked, from one module with no transactional complexity.

**Next link: read-only `/users`.** It resolves `requestedToUserId`, `decidedBy` and `actorUserId` — the last three unresolved reference fields on shipped screens — and unblocks Administration → Users as a read screen. The WebApps half is nearly free, because the lookup layer it needs already exists and would gain one collection.

**Then `reporting`**, which unblocks the Dashboard fixture swap and Analytics. Half of it is blocked on PD-2.

**Inventory stays last** among feature modules: 5 screens, 11 endpoints, and the only remaining work carrying real transactional risk — stock mutations that must respect ledger discipline and the non-negative invariant.

---

## 15. Product decisions required

| ID | Question |
|---|---|
| PD-1 | Can a web supervisor cancel a stuck exchange? The endpoint and `EXCHANGE_CANCEL` both exist; no spec says whether a web role ever holds that permission. |
| PD-2 | Exact payloads for `/dashboard/needle-consumption` and `/dashboard/stock-summary`. Blocks half of reporting. |
| PD-3 | Add the eight missing `GET /exchanges` filters, or narrow `Docs/12` §608 to five? `Docs/18` §12 shows a date range. |
| PD-4 | Does any WebApps screen need location scope? `locationIds` is delivered and unused. |

None has moved since the first writing.

---

## 16. Recommended implementation order

1. **Production readiness — rate limiting, the idempotency wedge, audit delivery.** The only items gating deployment, and the reason the production verdict is still NO-GO. Rate limiting is a live security gap: `/auth/login` is unthrottled.
2. **Read-only `/users`**, then user-name resolution in Confirmation and Audit.
3. **Resolve PD-2**, then build `reporting` and swap the Dashboard data-source.
4. **Resolve PD-3**, then the `GET /exchanges` filters that survive it.
5. **Administration** (users, roles, devices) and **Inventory**, backend then frontend.
6. **Fold the §13 drift back into `Docs/`**, without rewriting the historical specifications.

---

## 17. Verification performed for this refresh

- `app.module.ts` module registration read directly — 9 modules registered.
- All 7 controllers enumerated; 36 HTTP route decorators counted.
- `@IsEnum(ExchangeState)` confirmed on the exchange status filter.
- Tiebreakers confirmed on the exchange repository and the confirmation service.
- `exchangeTypeName` confirmed on the exchange response DTO.
- `core/permissions/` and `core/master-data/` contents listed; `require-permission.tsx` and `master-data-name.tsx` confirmed present.
- WebApps route tree enumerated — 13 page files.
- `nav-config.ts` counted — 20 entries, 11 marked unavailable.
- **No production code modified by this refresh.**

---

## 18. Closed since the first writing

Traceability for the nine action-plan items that shipped. Full detail in [`backend-webapps-action-plan.md`](./backend-webapps-action-plan.md).

| ID | Was | Shipped as |
|---|---|---|
| GAP-01 | `status` unvalidated → 500; enum advertised 3 of 12 values | `@IsEnum(ExchangeState)`, annotation corrected, cast removed |
| GAP-02 | Trolley filter sent free text to a `@IsUUID()` parameter | Select over the real trolley list, scoped and reset on factory change |
| GAP-03 | No master-data read API | 6 collections, 12 read-only routes, two scope classes |
| GAP-04 | Raw UUIDs wherever a name belonged | Cached per-collection lookup layer, visible id fallback |
| GAP-05 | `core/permissions` empty; 5 duplicated inline checks | Pure predicate + hooks; no string comparison outside the module |
| GAP-07 | Exchange type loaded on every read and discarded | `exchangeTypeCode`/`Name` projected at no extra query |
| GAP-08 | Two lists could drop or repeat a row across pages | `id` tiebreaker on both |
| GAP-10 | 16 navigation entries led to 404 | `available` flag; unbuilt entries disabled, unpermitted hidden |
| GAP-12 | No health or readiness probe, no graceful shutdown | `/health`, `/ready`, `enableShutdownHooks()` |

Still open: **GAP-06** (`/users`), **GAP-09** (reporting), **GAP-11** (exchange filters), **GAP-13** (administration + inventory), **GAP-14** (drift register) — plus the three production-readiness findings in §16.

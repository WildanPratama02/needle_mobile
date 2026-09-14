# Admin-panel CRUD audit: five contract-ready write gaps close next, three stay blocked on undecided policy, three are recorded but not queued

**Numbering note:** the requesting task named this file `0002-admin-panel-crud-completeness.md`, but `0002` (password-reset email) and `0003` (Roles & Permissions read-only-first) already exist in this directory. This file is `0004` — the next free number — so it does not overwrite either. Flagging this rather than silently picking a number, per the same restraint `Docs/agents/domain.md` asks for on domain-vocabulary conflicts.

## What was audited

Every screen under `WebApps/src/app/{administration,master-data,inventory,transactions,dashboard}/` (21 routes across 5 modules), cross-checked against three sources per screen: the FR-WEB requirement in `Docs/08-SRS-WebApps.md`, the endpoint contract in `Docs/12-OpenAPI-Swagger-Specification.md`, and the actual controller/screen code. `Docs/architecture/backend-webapps-action-plan.md` (GAP-01 through GAP-14) already tracks the backend↔WebApps contract gaps this project has been closing in order; this audit is that same lens applied specifically to Create/Update/Delete completeness, now that GAP-13's Administration phase (Users read, Devices, Roles read) has shipped (commits `b83f170`, `4fee900`, `3d53f71`, `feb84e1`).

The headline finding: **most of what looks like a missing write screen already has a full CRUD contract sitting unbuilt in `Docs/12` §9** (Factory, Location, Trolley, Needle Type all document `GET/POST/PATCH/activate/deactivate`, dated well before this audit). That reframes most of the gap list from "invent an endpoint" to "build what the contract already specifies" — the cheaper, lower-risk kind of gap.

## Audit findings — status per module

| Module / screen | FR-WEB | Backend contract (Docs/12) | Frontend today | Status |
|---|---|---|---|---|
| dashboard | FR-WEB-003 | 4 GET endpoints, 2 blocked on PD-2 | Read-only, fixture-backed | N/A — reporting screen, no CRUD object (ADR-0001) |
| transactions/exchange | FR-WEB-004/005 | Full state machine (`POST /exchanges` + 8 transitions), web-side is read + `cancel` only | Read-only list/detail | **By design** — exchanges are created and driven by the mobile trolley app; web never creates or transitions one. `cancel` is real but unwired, blocked on PD-1 (may a web role ever hold `EXCHANGE_CANCEL`?) — already tracked in the action plan, not re-opened here |
| transactions/confirmation | FR-WEB-006 to 009 | GET + approve/reject | Read + approve/reject | **Full** — approve/reject *is* the domain's only valid "update"; no create or delete belongs here |
| administration/users | FR-WEB-025 | `GET/POST/PATCH /users`, role & factory-scope assign/revoke documented (§16); **no** location-scope or admin-reset-access route documented anywhere | `GET /users`, `GET /users/:id` only (GAP-06, deliberately read-only) | **Read-only, missing C/U** — mostly contract-ready; "Assign Location Scope" and "Reset Access" are genuine contract gaps (see below) |
| administration/roles | FR-WEB-025 | `GET /roles`, `GET /permissions` only — no mutation route documented | Read-only | **Read-only by design** — ADR-0003 deferred mutation pending "who may grant `USER_MANAGE`," not re-opened here |
| administration/devices | FR-WEB-019 | `GET/POST/activate/revoke/heartbeat` documented; `reassign` shipped but undocumented | Full lifecycle: register / activate / reassign / revoke | **Full CRUD-equivalent** — shipped (GAP-13 Phase 1). Doc drift only (see ticket 11) |
| administration/audit | FR-WEB (audit, unnumbered) | `GET /audit-logs` only | Read-only | **By design** — an audit trail that can be edited stops being one |
| master-data/factory | FR-WEB-017 (explicit: Create/View/Edit/Activate/Deactivate) | Full CRUD documented (§9) | Read-only | **Read-only, missing C/U/D** — contract-ready |
| master-data/trolley | FR-WEB-018 (fields only, no action list) | Full CRUD documented (§9) | Read-only | **Read-only, missing C/U/D** — contract-ready, weaker FR/UI wording than Factory |
| master-data/needle-type | FR-WEB-022 + Docs/18 §26 (explicit: View/Create/Edit/Activate/Deactivate) | Full CRUD documented (§9) | Read-only | **Read-only, missing C/U/D** — strongest FR + UI + contract alignment of any gap in this audit |
| master-data/exchange-type | FR-WEB-023, Docs/18 §28 ("should not allow arbitrary exchange types") | `GET` only, no write route documented | Read-only | **Matches contract** — not a gap |
| master-data/employee | FR-WEB-020 | Not documented in Docs/12 §9 (still shows the old `GET`-only shape) | Full create + edit (status field covers deactivate) | **Full**, shipped ahead of `Docs/12` — doc drift (ticket 11) |
| master-data/rfid | FR-WEB-021 (Assign/Unassign/Deactivate/Replace), Docs/18 §34 | Not documented in Docs/12 §9 | Enroll (create) + terminal revoke | **Functionally adequate** — enroll/revoke covers Assign/Deactivate/Replace; "Unassign" as a distinct, non-terminal action has no code and no contract (ticket 10, deferred) |
| master-data/storage | FR-WEB-024, Docs/18 §32 (trolley → needle-hole mapping) | `StorageMapping` create+update not documented in §9; raw `Location` CRUD is documented in §9 but names no screen | Create + destination-only update for `StorageMapping` | **Full for the mapping** (shipped, doc drift); raw `Location` CRUD is contract-ready but has no FR-WEB item or Docs/18 section naming it as its own screen (ticket 09, deferred) |
| inventory/receiving | FR-WEB-011 | `POST /inventory/receivings` | Create-only | **Full for its shape** — ledger write, no update/delete belongs here (ADR-004) |
| inventory/transfer | FR-WEB-012 | `POST /inventory/transfers` | Create-only | **Full for its shape** — same reasoning |
| inventory/adjustment | FR-WEB-014 ("mengikuti approval policy bila diwajibkan") | `POST /inventory/adjustments`; Docs/12 §13 also defers to "the approved business policy" | Create-only, applies immediately, no approval step | **Full as shipped** (spec decision #3), but the conditional-approval half of FR-WEB-014 was never resolved by either document — same open question in both, restated not solved (ticket 08, blocked) |
| inventory/stock | FR-WEB-010 | `GET /inventory/balances`, `GET /inventory/trolleys/:id` | Read-only | **By design** — balance is derived from the movement ledger, backend stock authority (ADR-004); a client-editable balance would contradict it |
| inventory/movement | FR-WEB-016 | `GET /inventory/movements` | Read-only | **By design** — immutable ledger |
| inventory — Stock Return | FR-WEB-013 | `POST /inventory/returns` documented (§13) | **Not built** — no backend route, no frontend screen, no nav entry | **Contract-ready, unbuilt** (ticket 04) |
| inventory — Physical Count | FR-WEB-015 | `POST/GET /inventory/count-sessions*` documented (§14) | **Not built** | **Contract-ready, unbuilt** — and `Docs/18` has no ASCII layout for it either (ticket 05, flagged) |

## Decision

Close five gaps next, in this order, because each already has a `Docs/12` contract and an unambiguous FR-WEB requirement — no product decision stands between "ticket" and "implementation":

1. **Needle Type CRUD** (ticket 01) — the strongest case: FR-WEB-022, Docs/18 §26's explicit action list, and a complete `Docs/12` §9 contract all agree.
2. **Factory CRUD** (ticket 02) — FR-WEB-017 is explicit; contract exists.
3. **Trolley CRUD** (ticket 03) — contract exists; FR/UI wording is thinner, sequenced after Factory since a trolley belongs to one.
4. **Stock Return** (ticket 04) — FR-WEB-013 plus a documented `POST /inventory/returns`; the only inventory-ledger write not yet built.
5. **Physical Count** (ticket 05) — FR-WEB-015 plus a documented count-session contract; flagged because `Docs/18` never got an ASCII layout for it, so this ticket also asks for that layout (modeled on §19/§24) before or during implementation.

Close the buildable majority of **Users write access** next as well (ticket 06) — Create/Edit/Activate/Deactivate/Assign Role/Assign Factory Scope all have a `Docs/12` §16 contract. Two sub-items inside that same FR-WEB-025 — **Assign Location Scope** and **Reset Access** — have no contract anywhere in `Docs/12` and are carved out of ticket 06 explicitly rather than answered by inventing a shape.

Three items stay **blocked on a decision this audit cannot make**, and are recorded as tickets so they are not silently lost, not so they can be picked up blind:

- **Roles & Permissions mutation** (ticket 07) — ADR-0003 already named the blocker (who may grant `USER_MANAGE`, and transitively every other permission). Unchanged by this audit.
- **Adjustment approval policy** (ticket 08) — FR-WEB-014 and `Docs/12` §13 both defer to "the approved business policy" without ever stating what it is. The shipped no-approval-step behavior (spec decision #3) is a reasonable interim default, not a resolution.
- Two Users sub-items above, folded into ticket 06's "out of scope" note rather than a separate ticket each, since both need the same thing: a `Docs/12` §16 extension the user has to approve before any shape is invented.

Two items are **recorded, not queued** — real but low enough value or ambiguity that building them now would be speculative:

- **Raw `Location` CRUD as its own screen** (ticket 09) — the contract exists, but no FR-WEB item or Docs/18 section names a standalone "Location Master" screen; §32 Storage/Needle Hole Master is about `StorageMapping`, a different resource. Needs product/UX scoping before it is a ticket someone can implement against a layout.
- **RFID "Unassign" as a distinct action** (ticket 10) — FR-WEB-021 and Docs/18 §34 name four verbs; the shipped two (enroll, revoke) cover three of them. Building a fifth endpoint to satisfy a fourth verb that already behaves identically to revoke would be inventing a distinction the domain hasn't asked for yet.

One item is **documentation-only** (ticket 11): `Docs/12` §9's Employee/RFID/Device sections are stale — the shipped code (Employee create/edit, RFID enroll/revoke, Device `reassign`) exceeds what's documented there. Per `Backend/CLAUDE.md` §4, the contract gets corrected with the user's knowledge, not left to drift further or silently patched around. This mirrors GAP-14's drift-register precedent rather than duplicating it.

## What this does not change

`transactions/exchange`, `transactions/confirmation`, `inventory/{receiving,transfer,stock,movement}` and `administration/{roles,audit}` are correctly shaped as-is. Widening any of them into free CRUD would contradict ADR-004 (backend is the stock authority — a client-editable balance is not a smaller version of that rule, it's a violation of it) or the exchange state-machine rule in `Backend/CLAUDE.md` §4. This audit's job was to find missing writes, not to add writes where the domain deliberately has none.

## Consequences

Tickets 01–06 give `webapps-dev` runs a queue with no open product question blocking any of them — each cites its exact `Docs/12` contract section and FR-WEB item, so an implementation run does not need to re-derive the shape. Tickets 07, 08 and the two Users sub-items stay visibly blocked rather than getting quietly built with an invented policy. Tickets 09 and 10 stay visibly deferred rather than disappearing. Ticket 11 keeps `Docs/12` from drifting further behind what has already shipped, so the next audit does not have to re-discover the same three sections are stale.

**Follow-up (2026-09-14):** tickets 01–06 are built on both sides. The decisions their implementation forced — never-widen grants, required factory scope and admin-set first password on user create, count sessions refusing to overwrite stock that moved after counting, the inactive-factory guard — are recorded in ADR-0005.

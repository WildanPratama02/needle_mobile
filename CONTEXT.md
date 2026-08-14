# Needle Mobile System

Needle inventory management system for factory floors. Tracks needle exchange, stock across multiple locations (warehouse + trolleys), broken-needle approval, and RFID-based operator identification. Three clients (mobile Android, web, backend); backend is sole source of truth for state.

## Language

**Exchange Type**:
Business classification chosen at exchange creation: `BROKEN`, `BENT`, or `CHANGEOVER`. Top-level branch of the exchange flow — determines which sub-rules apply (fragment check only applies to `BROKEN`).
_Avoid_: Condition, Exchange Category

**Fragment Status**:
Data field on an exchange, applies only within a `BROKEN` exchange: whether the operator recovered the broken needle fragment (`FOUND` / `NOT_FOUND`). `NOT_FOUND` is what triggers a Confirmation. Distinct from `FRAGMENT_CHECK`, which is the Exchange State (workflow step) name where this field gets set.
_Avoid_: NORMAL/EXCEPTION (found in Docs/05-System-Architecture.md §25 — contradicts the DB schema and Backend/CLAUDE.md; treat as stale, not canonical), `BROKEN_FRAGMENT_FOUND` (Docs/02-Business-Process.md §6 — narrative label only, not a real status; no DB enum value for it, Fragment Status `FOUND` case just proceeds with no distinct marker)

**Exchange State**:
The exchange's workflow position, one linear machine with a detour for `BROKEN` + fragment-not-found. Canonical values (Docs/10-Database-Design.md §8.2, explicitly marked authoritative): `CREATED → OPERATOR_IDENTIFIED → NEEDLE_SELECTED → EXCHANGE_TYPE_SELECTED → FRAGMENT_CHECK → [CONFIRMATION_PENDING →] EVIDENCE_CAPTURED → NEW_NEEDLE_SELECTED → NEEDLE_ISSUED → USED_NEEDLE_STORED → COMPLETED`, or terminal `CANCELLED`. `FRAGMENT_CHECK` and `CONFIRMATION_PENDING` only apply to `BROKEN` exchanges; `CONFIRMATION_PENDING` only when Fragment Status is `NOT_FOUND`.

"Blocked" (Confirmation `REJECTED`, or insufficient trolley stock at the `NEEDLE_ISSUED` transition) is not a distinct Exchange State — the exchange simply stops advancing and stays at its current state (`CONFIRMATION_PENDING` or `NEW_NEEDLE_SELECTED`). No forward transition happens; a PIC/admin must separately move it to `CANCELLED`. "Blocked" is a narrative/UI description of this stuck condition, not a persisted value.
_Avoid_: `DRAFT` (System-Architecture §10 — DB says `CREATED`), `EXCHANGE_SELECTED` (DB says `EXCHANGE_TYPE_SELECTED`), `FRAGMENT_STATUS`-as-state (DB says `FRAGMENT_CHECK` — `FRAGMENT_STATUS` is the field, see above), `WAITING_CONFIRMATION` (DB says `CONFIRMATION_PENDING`), `PHOTO`/`PHOTO_CAPTURED` (DB says `EVIDENCE_CAPTURED`, see Evidence below), `STOCK_VALIDATION`/`STOCK_VALIDATED` (no such state in DB enum — stock check happens as part of the `NEEDLE_ISSUED` transition, not its own state), `ISSUE` (DB says `NEEDLE_ISSUED`), `BLOCKED` (not in DB enum at all — narrative label for "stuck, no forward transition", not a persisted state)

**Evidence**:
A captured photo attached to an exchange (`exchange_evidence` table), typed `OLD_NEEDLE` / `BROKEN_FRAGMENT` / `OTHER`. The Exchange State `EVIDENCE_CAPTURED` is reached once required evidence is uploaded.
_Avoid_: Photo (used throughout Docs/02-Business-Process.md and SRS docs — DB schema says Evidence; treat Photo as the narrative/UI word, Evidence as the persisted domain term)

**Confirmation**:
The request record created when a `BROKEN` exchange has Fragment Status `NOT_FOUND` (`confirmations` table). Has its own status: `PENDING → APPROVED / REJECTED / EXPIRED`. One Confirmation belongs to one Exchange.
_Avoid_: Approval (see below — related but distinct)

**Approval**:
The act an Authorized Approver performs against a Confirmation, recorded as a `confirmation_decisions` row (`decision`, `decided_by`, `reason` — reason mandatory on rejection). Not a standalone entity with its own lifecycle; it's the decision event that resolves a Confirmation.
_Avoid_: Confirmation (the record being decided on, not the act of deciding)

### Actors

**PIC**:
The trolley operator who runs the exchange flow (creates the exchange, scans RFID, captures Evidence, stores the used needle). Maps to `pic_user_id` on the `exchanges` table.
_Avoid_: PIC Troli (business-doc/UI phrasing — DB column is just `pic_user_id`, no "Troli" qualifier)

**Operator**:
The factory-floor worker (sewing machine operator) who brings the needle to exchange. Never logs in; identified via RFID tap, driving Exchange State to `OPERATOR_IDENTIFIED`.
_Avoid_: Operator Sewing

**Authorized Approver**:
The role that decides a Confirmation (`confirmations.requested_to_user_id`) — approves or rejects a `BROKEN` exchange with a missing fragment. Distinct role from Management.
_Avoid_: Management (different role, see below — do not conflate)

**Management**:
Read-only monitoring role — dashboard, analytics, consumption/exception review across factories. Does not decide Confirmations; distinct from Authorized Approver even though both sit above PIC/Operator in authority.

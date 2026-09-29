# Mobile sync executes queued commands through the exchange service, one transaction each, and remembers outcomes in the idempotency table

The tablet works offline and queues exchange steps (`Docs/15`). `POST /mobile/sync` has to turn that queue into server state without weakening ADR-004 (backend is the stock authority) or ADR-005 (every critical command idempotent). `Docs/12` §19 named the endpoint but not its semantics; these are the decisions (`.scratch/mobile-backend/spec.md`).

**Every exchange step may be queued, including issuing the needle.** A queued `ISSUE_NEEDLE` is only a request: the backend checks and decrements trolley stock when the command arrives, exactly as `POST /exchanges/{id}/issue` does, so stock is never finalized on the tablet (`Docs/15` §7). If the shelf is empty by then, the command is `REJECTED INVENTORY_INSUFFICIENT_STOCK` and the exchange stays at `NEW_NEEDLE_SELECTED` — the ordinary "blocked" condition. Evidence is the exception: photos are multipart uploads and keep their own endpoint.

**A command is a thin adapter onto `ExchangeService`.** The state machine, the ledger, scope checks and notifications are therefore identical for HTTP and sync. The permission each command needs is the permission of its HTTP route. Audit rows come from the same writer the audit interceptor uses, so there is still one audit implementation.

**One transaction per command, halting per exchange.** A batch is not atomic: a rejected command stops the rest of *its* exchange (`SKIPPED`), other exchanges continue. All-or-nothing would let one empty shelf block an entire shift's queue.

**Outcomes live in `idempotency_keys`.** Key = `commandId`, endpoint = `SYNC <deviceId> <commandType>`, with the body hash check and retention sweep already there. Only successes are stored; a rejection is re-evaluated on resend, because the world (stock, a confirmation) may have changed. No new table.

**The cursor is a change-time watermark**, `(changed_at, id)` over the device's exchanges, where `changed_at` is the later of the exchange's and its confirmation's `updated_at` — so a supervisor's decision reaches the tablet without the approval module touching the exchange row. Master-data "versions" are a hash of each collection's row count and latest `updated_at`; no version column.

**Tablet surfaces use a new permission, `MOBILE_OPERATE`,** granted to `PIC_TROLI`, rather than `MASTER_VIEW` — giving the PIC the whole master-data catalogue to serve a bootstrap would widen access (ADR 0005's spirit). RFID lookup by UID moved to `/rfid/cards/uid/{rfidUid}` because `/rfid/cards/{id}` was already the card-id route.

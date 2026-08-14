# 15 — Mobile Offline Sync Specification
# Needle Management System

**Version:** 1.0  
**Status:** Draft / Mobile Integration Baseline  
**Client:** Flutter Android Tablet  
**Backend:** Central Backend API

---

## 1. Purpose

Dokumen ini mendefinisikan perilaku aplikasi Tablet ketika koneksi ke backend tidak stabil atau terputus.

Target:

```text
Online-first
+
Safe offline capability
+
Deterministic reconciliation
+
No duplicate stock transaction
```

---

## 2. Important Principle

Offline mode tidak boleh menyebabkan:

```text
Duplicate Exchange
Duplicate Stock Issue
Negative Stock
Lost Transaction
Invalid State
```

Backend tetap menjadi final source of truth.

---

## 3. Mobile Data Layers

```text
Flutter UI
   |
   v
Application / Use Case Layer
   |
   v
Local Repository
   |
   +---- Local DB
   |
   +---- Sync Queue
   |
   v
API Client
   |
   v
Central Backend
```

---

## 4. Local Storage

Local database may store:

### Master/cache

```text
Factory
Trolley
Device
Employee reference
Needle Type
Exchange Type
Storage Mapping
```

### Transaction

```text
Exchange Draft
Exchange Commands
Evidence Metadata
Sync Queue
Sync Result
```

Sensitive data retention must follow security policy.

---

## 5. Online / Offline State

```text
ONLINE
   |
connection lost
   v
OFFLINE
   |
connection restored
   v
SYNCING
   |
success
   v
ONLINE
```

---

## 6. What Can Be Done Offline

The exact offline capability must be approved.

Recommended:

```text
Create Exchange Draft
Capture RFID UID
Capture Exchange Type
Capture Needle Type
Capture Photo
Store transaction locally
Queue commands
```

Critical stock-changing operations should preferably be confirmed by backend before final issue.

---

## 7. Stock Safety Rule

Do not allow local-only stock deduction to become final inventory.

Recommended:

```text
Tablet requests Issue
        |
        v
Backend validates stock
        |
        v
Backend creates ISSUE movement
        |
        v
Tablet receives authoritative result
```

If business requires full offline issue, a separate stock reservation/offline allocation mechanism is required.

---

## 8. Local Exchange State

Local states:

```text
LOCAL_DRAFT
QUEUED
SYNCING
SERVER_ACCEPTED
SERVER_REJECTED
COMPLETED
```

Server states remain authoritative.

---

## 9. Command Queue

Each queued command:

```json
{
  "clientTransactionId": "uuid",
  "commandId": "uuid",
  "commandType": "CREATE_EXCHANGE",
  "payload": {},
  "createdAt": "2026-08-05T08:00:00Z",
  "retryCount": 0,
  "status": "QUEUED"
}
```

---

## 10. Idempotency

Every mutation command must have:

```text
clientTransactionId
+
Idempotency-Key
```

Retry behavior:

```text
Timeout
  |
  v
Retry same command
  |
  v
Same idempotency key
  |
  v
Backend returns original result
```

Never generate a new business transaction key simply because the network timed out.

---

## 11. Sync API

```http
POST /mobile/sync
```

Request:

```json
{
  "deviceId": "uuid",
  "cursor": "cursor-value",
  "commands": [
    {
      "clientTransactionId": "uuid",
      "commandType": "CREATE_EXCHANGE",
      "payload": {}
    }
  ]
}
```

Response:

```json
{
  "success": true,
  "data": {
    "results": [
      {
        "clientTransactionId": "uuid",
        "status": "SUCCESS",
        "referenceId": "uuid"
      }
    ],
    "nextCursor": "cursor-value"
  }
}
```

---

## 12. Command Ordering

Commands belonging to one exchange must respect dependency order.

Example:

```text
CREATE_EXCHANGE
      |
      v
ASSIGN_OPERATOR
      |
      v
SELECT_EXCHANGE_TYPE
      |
      v
FRAGMENT_VALIDATION
      |
      v
UPLOAD_EVIDENCE
      |
      v
SELECT_NEW_NEEDLE
      |
      v
ISSUE_NEEDLE
      |
      v
STORE_USED_NEEDLE
      |
      v
COMPLETE_EXCHANGE
```

The sync engine must not execute dependent commands out of order.

---

## 13. Conflict Handling

### Case: Exchange already exists

Return:

```text
IDEMPOTENT_SUCCESS
```

if request matches original.

### Case: State changed on server

Return:

```text
EXCHANGE_INVALID_STATE
```

Tablet refreshes authoritative exchange state.

### Case: Needle type deactivated

Return:

```text
NEEDLE_TYPE_NOT_FOUND
```

or an appropriate inactive-master-data error.

### Case: Insufficient stock

Return:

```text
INVENTORY_INSUFFICIENT_STOCK
```

The exchange must not be marked as successfully issued.

---

## 14. Sync Retry Policy

Recommended:

```text
Immediate retry
       |
      5s
       |
     15s
       |
     30s
       |
      1m
       |
      5m
```

Maximum attempts are configurable.

Business rejection is not a technical retry condition.

---

## 15. Evidence Upload

Photo handling:

```text
Capture Photo
     |
     v
Compress / Validate
     |
     v
Store Local File
     |
     v
Queue Upload
     |
     v
Backend/Object Storage
     |
     v
Store Server Reference
```

Local photo must not be deleted until successful upload is confirmed.

---

## 16. Bootstrap

On startup:

```http
GET /mobile/bootstrap
```

Tablet receives:

```text
Device
Factory
Trolley
Exchange Types
Needle Types
Storage Mappings
Server Time
Sync Cursor
```

---

## 17. Master Data Refresh

Master data should have version/cursor information.

Example:

```json
{
  "needleTypesVersion": 12,
  "exchangeTypesVersion": 3,
  "storageMappingsVersion": 7
}
```

Tablet refreshes only changed data where supported.

---

## 18. Clock Handling

Server time is authoritative.

Tablet may keep:

```text
deviceTime
serverTime
offset
```

Transactions should use server timestamp where possible.

---

## 19. Sync Monitoring

Tablet should display:

```text
Online
Offline
Syncing
Pending: N
Failed: N
Last Sync: HH:mm
```

PIC should be able to retry failed synchronization.

---

## 20. Data Retention

Local completed transactions should be retained only as long as required for:

```text
Retry
Audit reference
Operational troubleshooting
```

After confirmed synchronization and approved retention period, local transaction data may be purged.

---

## 21. Acceptance Criteria

- [ ] App works safely during temporary network loss.
- [ ] Transactions are not duplicated.
- [ ] Commands retain idempotency keys.
- [ ] Dependent commands execute in order.
- [ ] Server state overrides stale local state.
- [ ] Stock is never finalized solely from local cache.
- [ ] Photos survive temporary offline state.
- [ ] Failed commands can be retried.
- [ ] Business rejection is not blindly retried.
- [ ] Sync status is visible to PIC.
- [ ] Local data is encrypted according to Security Architecture.

---

## 22. Open Decisions

- [ ] Exact offline transaction scope
- [ ] Local database technology
- [ ] Encryption implementation
- [ ] Maximum offline duration
- [ ] Offline stock allocation policy
- [ ] Photo maximum size
- [ ] Retry limits
- [ ] Local retention period

**End of Mobile Offline Sync Specification**

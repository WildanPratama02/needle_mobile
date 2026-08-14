# 09 — API Specification
# Needle Management System — Central Backend API Contract

**Version:** 1.0  
**Status:** Draft / Development Baseline  
**API Style:** REST over HTTPS  
**Consumers:** Flutter Android Tablet, WebApps  
**Authority:** Central Backend  
**References:** PRD, Business Process, Use Case, Functional Requirements, System Architecture, Application Architecture, SRS Mobile Android, SRS WebApps

---

# 1. Purpose

Dokumen ini mendefinisikan contract API antara:

```text
Flutter Android Tablet
        |
        | HTTPS / REST API
        v
+---------------------------+
|      CENTRAL BACKEND      |
+---------------------------+
        ^
        |
        | HTTPS / REST API
        |
WebApps
```

Central Backend merupakan **authoritative source** untuk:

- Authentication
- Authorization
- Factory & Trolley
- Device
- Employee & RFID
- Needle Type
- Exchange Type
- Needle Exchange
- Broken Needle Confirmation
- Inventory
- Stock Movement
- Notification
- Reporting
- Analytics
- Audit
- Synchronization

Mobile dan WebApps tidak boleh melakukan direct database access.

---

# 2. API Design Principles

## 2.1 Backend Is Authoritative

Client boleh melakukan validation untuk UX, tetapi keputusan final harus dilakukan backend.

```text
Client Validation
      +
Backend Validation
      =
Accepted Transaction
```

Backend harus selalu melakukan:

- permission validation;
- scope validation;
- state validation;
- stock validation;
- master-data validation;
- idempotency validation.

---

# 3. Base URL

Environment:

```text
Development
https://<dev-api-host>/api/v1

Staging
https://<staging-api-host>/api/v1

Production
https://<production-api-host>/api/v1
```

Actual host/domain merupakan deployment decision dan belum ditentukan pada dokumen sebelumnya.

---

# 4. Versioning

API menggunakan URI versioning:

```text
/api/v1/...
```

Breaking change harus menggunakan major API version baru.

Contoh:

```text
/api/v2/...
```

---

# 5. HTTP Methods

| Method | Usage |
|---|---|
| GET | Retrieve data |
| POST | Create / command |
| PUT | Full replacement where applicable |
| PATCH | Partial update |
| DELETE | Only where business policy permits |

Untuk entity yang memiliki historical reference, backend sebaiknya menggunakan:

```text
ACTIVE / INACTIVE
```

daripada hard delete.

---

# 6. Standard Headers

Request:

```http
Authorization: Bearer <access_token>
Content-Type: application/json
Accept: application/json
X-Request-ID: <uuid>
X-Device-ID: <device-id>
X-App-Version: <version>
X-Client-Type: MOBILE | WEB
```

Untuk transaction command yang harus idempotent:

```http
Idempotency-Key: <uuid>
```

---

# 7. Authentication

## POST /auth/login

Request:

```json
{
  "username": "pic001",
  "password": "********",
  "device_id": "DEVICE-001"
}
```

Response:

```json
{
  "data": {
    "access_token": "<token>",
    "refresh_token": "<token>",
    "expires_in": 3600,
    "user": {
      "id": "USR-001",
      "name": "PIC Needle",
      "roles": ["PIC_TROLI"],
      "factory_scope": ["FAC-001"],
      "location_scope": ["TRL-001"]
    }
  }
}
```

---

# 8. Refresh Token

## POST /auth/refresh

Request:

```json
{
  "refresh_token": "<refresh-token>"
}
```

Response:

```json
{
  "data": {
    "access_token": "<new-token>",
    "expires_in": 3600
  }
}
```

---

# 9. Logout

## POST /auth/logout

Invalidates the current session/token according to backend authentication strategy.

---

# 10. Current User

## GET /auth/me

Response:

```json
{
  "data": {
    "id": "USR-001",
    "name": "PIC Needle",
    "roles": ["PIC_TROLI"],
    "permissions": [
      "EXCHANGE_CREATE",
      "EXCHANGE_VIEW"
    ],
    "factory_scope": ["FAC-001"],
    "location_scope": ["TRL-001"]
  }
}
```

---

# 11. Device Registration & Validation

## POST /devices/register

Used by authorized WebApp administration.

Request:

```json
{
  "device_name": "Tablet Trolley 01",
  "serial_number": "SN-001",
  "factory_id": "FAC-001",
  "trolley_id": "TRL-001"
}
```

## POST /devices/{device_id}/bind

Binds a device to a trolley.

## POST /devices/{device_id}/revoke

Revokes device access.

## GET /devices/{device_id}

Returns device status:

```text
ACTIVE
INACTIVE
REVOKED
```

---

# 12. Device Context

## GET /devices/{device_id}/context

Returns operational context required by Tablet:

```json
{
  "data": {
    "device_id": "DEV-001",
    "factory": {
      "id": "FAC-001",
      "name": "Factory A"
    },
    "trolley": {
      "id": "TRL-001",
      "code": "TROLLEY-A-01",
      "status": "ACTIVE"
    }
  }
}
```

---

# 13. Master Data APIs

## GET /factories

Returns factories available within authorization scope.

## GET /factories/{factory_id}

Returns factory detail.

## GET /trolleys

Filters:

```text
factory_id
status
```

## GET /trolleys/{trolley_id}

Returns trolley detail and context.

## GET /employees

Filters:

```text
factory_id
employee_id
name
status
```

## GET /employees/{employee_id}

Returns employee information.

## GET /rfid/{rfid_id}/employee

RFID lookup for Tablet.

Example:

```json
{
  "data": {
    "employee_id": "EMP-001",
    "name": "Operator A",
    "factory_id": "FAC-001",
    "department": "Sewing",
    "status": "ACTIVE"
  }
}
```

---

# 14. Needle Type API

## GET /needle-types

Filters:

```text
status
category
```

Response:

```json
{
  "data": [
    {
      "id": "NEEDLE-001",
      "code": "N-A",
      "name": "Needle Type A",
      "unit": "PCS",
      "minimum_stock": 100,
      "status": "ACTIVE"
    }
  ]
}
```

---

# 15. Exchange Type API

## GET /exchange-types

Initial types:

```text
BROKEN
BENT
CHANGEOVER
```

Response:

```json
{
  "data": [
    {
      "code": "BROKEN",
      "name": "Jarum Patah",
      "requires_fragment_validation": true
    },
    {
      "code": "BENT",
      "name": "Jarum Bengkok",
      "requires_fragment_validation": false
    },
    {
      "code": "CHANGEOVER",
      "name": "Changeover",
      "requires_fragment_validation": false
    }
  ]
}
```

---

# 16. Storage Mapping API

## GET /trolleys/{trolley_id}/storage-mappings

Returns used-needle storage mapping.

Example:

```json
{
  "data": [
    {
      "exchange_type": "BROKEN",
      "storage_location_id": "HOLE-01"
    },
    {
      "exchange_type": "BENT",
      "storage_location_id": "HOLE-02"
    },
    {
      "exchange_type": "CHANGEOVER",
      "storage_location_id": "HOLE-03"
    }
  ]
}
```

---

# 17. Needle Exchange API

## POST /exchanges

Creates a new exchange transaction.

Request:

```json
{
  "client_transaction_id": "8b7e...",
  "factory_id": "FAC-001",
  "trolley_id": "TRL-001",
  "operator_id": "EMP-001",
  "old_needle_type_id": "NEEDLE-001",
  "exchange_type": "BROKEN"
}
```

Required validation:

```text
User authorized
Factory active
Trolley active
Device authorized
Operator active
Needle Type active
Exchange Type active
```

Response:

```json
{
  "data": {
    "exchange_id": "EXC-000001",
    "status": "CREATED",
    "current_step": "FRAGMENT_CHECK"
  }
}
```

---

# 18. Exchange Detail

## GET /exchanges/{exchange_id}

Returns complete transaction state.

Example:

```json
{
  "data": {
    "exchange_id": "EXC-000001",
    "factory_id": "FAC-001",
    "trolley_id": "TRL-001",
    "operator_id": "EMP-001",
    "old_needle_type_id": "NEEDLE-001",
    "exchange_type": "BROKEN",
    "new_needle_type_id": null,
    "fragment_status": "PENDING",
    "confirmation_status": null,
    "status": "FRAGMENT_CHECK"
  }
}
```

---

# 19. Exchange List

## GET /exchanges

Filters:

```text
date_from
date_to
factory_id
trolley_id
operator_id
pic_id
old_needle_type_id
new_needle_type_id
exchange_type
fragment_status
confirmation_status
status
```

Pagination:

```text
page
page_size
sort
```

---

# 20. Fragment Check

## POST /exchanges/{exchange_id}/fragment-check

Request:

```json
{
  "fragment_status": "FOUND",
  "note": "Broken piece received"
}
```

Allowed:

```text
FOUND
NOT_FOUND
NOT_APPLICABLE
```

For:

```text
BROKEN
```

the backend must enforce the configured fragment policy.

---

# 21. Missing Fragment

If fragment is not found:

```json
{
  "fragment_status": "NOT_FOUND",
  "note": "Broken piece not found"
}
```

Backend creates confirmation:

```text
Exchange
   |
   v
Confirmation = PENDING
```

Transaction state must follow the backend state machine and must not be bypassed by the client.

---

# 22. Photo Upload

## POST /exchanges/{exchange_id}/evidence

Multipart upload.

Metadata:

```text
file
evidence_type
captured_at
```

Example evidence type:

```text
OLD_NEEDLE
BROKEN_FRAGMENT
OTHER
```

Response:

```json
{
  "data": {
    "evidence_id": "EVD-001",
    "exchange_id": "EXC-000001",
    "status": "STORED"
  }
}
```

---

# 23. New Needle Availability

## GET /trolleys/{trolley_id}/stock

Filters:

```text
needle_type_id
```

Returns:

```json
{
  "data": {
    "trolley_id": "TRL-001",
    "items": [
      {
        "needle_type_id": "NEEDLE-001",
        "available_quantity": 25,
        "status": "NORMAL"
      }
    ]
  }
}
```

Backend remains authoritative for availability.

---

# 24. New Needle Selection

## POST /exchanges/{exchange_id}/new-needle

Request:

```json
{
  "needle_type_id": "NEEDLE-001"
}
```

Backend validates:

```text
Exchange state
Needle Type active
Trolley scope
Stock availability
Business rule for new needle type
```

The system must prevent an invalid or unavailable issue.

---

# 25. Needle Issue

## POST /exchanges/{exchange_id}/issue

This is a critical command.

Request:

```json
{
  "needle_type_id": "NEEDLE-001",
  "quantity": 1
}
```

Required header:

```http
Idempotency-Key: <uuid>
```

Backend must atomically:

```text
Validate Exchange State
       |
Validate Stock
       |
Create Stock Movement
       |
Decrease Trolley Stock
       |
Record Issue
       |
Update Exchange
       |
Write Audit
```

If any step fails, the operation must not produce a partial stock update.

---

# 26. Used Needle Storage

## POST /exchanges/{exchange_id}/used-needle

Request:

```json
{
  "storage_location_id": "HOLE-01"
}
```

Backend validates mapping:

```text
Exchange Type
        |
        v
Allowed Storage Location
```

Invalid mapping must be rejected.

---

# 27. Complete Exchange

## POST /exchanges/{exchange_id}/complete

Backend validates all required steps:

```text
Operator identified
Old Needle Type selected
Exchange Type selected
Fragment condition handled
Required confirmation approved
Required evidence available
New Needle selected
New Needle issued
Used Needle stored
```

Response:

```json
{
  "data": {
    "exchange_id": "EXC-000001",
    "status": "COMPLETED",
    "completed_at": "2026-08-05T10:10:00Z"
  }
}
```

---

# 28. Cancel Exchange

## POST /exchanges/{exchange_id}/cancel

Allowed only for states defined by business policy.

Request:

```json
{
  "reason": "Operator cancelled exchange"
}
```

Backend must prevent cancellation of completed transaction unless an explicit reversal process exists.

---

# 29. Confirmation APIs

## GET /confirmations

Filters:

```text
status
factory_id
trolley_id
exchange_id
operator_id
date_from
date_to
```

## GET /confirmations/{confirmation_id}

Returns:

```text
Confirmation
Exchange
Operator
Factory
Trolley
Needle
Evidence
Timeline
```

---

# 30. Approve Confirmation

## POST /confirmations/{confirmation_id}/approve

Request:

```json
{
  "note": "Confirmed by supervisor"
}
```

Backend validates:

```text
Approver Permission
Current State = PENDING
Exchange State
Confirmation State
```

Response:

```json
{
  "data": {
    "confirmation_id": "CONF-001",
    "status": "APPROVED",
    "approved_by": "USR-APPROVER",
    "approved_at": "2026-08-05T10:15:00Z"
  }
}
```

---

# 31. Reject Confirmation

## POST /confirmations/{confirmation_id}/reject

Request:

```json
{
  "reason": "Supervisor did not approve"
}
```

Reason is mandatory.

---

# 32. Notification API

## GET /notifications

Filters:

```text
exchange_id
type
status
date_from
date_to
```

## POST /notifications/{notification_id}/retry

Allowed for failed notification according to policy.

Notification status:

```text
NOT_SENT
SENT
DELIVERED
FAILED
```

---

# 33. WhatsApp Notification

When missing broken fragment requires confirmation:

```text
Backend
   |
   +--> Create Confirmation
   |
   +--> Create Notification
   |
   +--> WhatsApp Provider
```

The API must not expose provider credentials to Mobile or WebApps.

---

# 34. Inventory APIs

## GET /inventory/stock

Filters:

```text
factory_id
location_id
trolley_id
needle_type_id
status
```

## GET /inventory/stock/{location_id}

Returns stock by location.

---

# 35. Receiving

## POST /inventory/receipts

Request:

```json
{
  "factory_id": "FAC-001",
  "destination_location_id": "WH-001",
  "needle_type_id": "NEEDLE-001",
  "quantity": 1000,
  "reference_document": "PO-001",
  "note": "Initial receiving"
}
```

Creates stock movement:

```text
RECEIVING
```

---

# 36. Transfer

## POST /inventory/transfers

Request:

```json
{
  "source_location_id": "WH-001",
  "destination_location_id": "TRL-001",
  "needle_type_id": "NEEDLE-001",
  "quantity": 100
}
```

Backend atomically validates and performs:

```text
TRANSFER_OUT
TRANSFER_IN
```

---

# 37. Return

## POST /inventory/returns

Request:

```json
{
  "source_location_id": "TRL-001",
  "destination_location_id": "WH-001",
  "needle_type_id": "NEEDLE-001",
  "quantity": 20,
  "reason": "Unused stock returned"
}
```

---

# 38. Adjustment

## POST /inventory/adjustments

Request:

```json
{
  "location_id": "TRL-001",
  "needle_type_id": "NEEDLE-001",
  "actual_quantity": 95,
  "reason": "Physical count variance",
  "evidence_ids": ["EVD-100"]
}
```

Backend calculates:

```text
Variance = Actual Quantity - System Quantity
```

Direct balance mutation from client is prohibited.

---

# 39. Physical Count

## POST /inventory/count-sessions

Creates count session.

## POST /inventory/count-sessions/{id}/items

Records physical quantity.

Example:

```json
{
  "location_id": "TRL-001",
  "needle_type_id": "NEEDLE-001",
  "physical_quantity": 95
}
```

## POST /inventory/count-sessions/{id}/complete

Completes counting session and triggers reconciliation workflow.

---

# 40. Stock Movement

## GET /inventory/movements

Filters:

```text
factory_id
location_id
trolley_id
needle_type_id
movement_type
date_from
date_to
reference_id
```

Returns immutable movement records.

---

# 41. Master Data Administration

Administrative endpoints:

```text
GET/POST/PATCH /factories
GET/POST/PATCH /trolleys
GET/POST/PATCH /devices
GET/POST/PATCH /employees
GET/POST/PATCH /rfid
GET/POST/PATCH /needle-types
GET/POST/PATCH /exchange-types
GET/POST/PATCH /locations
```

Hard delete should not be allowed where historical references exist.

---

# 42. User & Role APIs

```text
GET    /users
POST   /users
GET    /users/{id}
PATCH  /users/{id}
POST   /users/{id}/activate
POST   /users/{id}/deactivate
```

Role:

```text
GET    /roles
POST   /roles
PATCH  /roles/{id}
```

User scope:

```text
factory_scope
location_scope
permissions
```

---

# 43. Dashboard APIs

## GET /dashboard/summary

Filters:

```text
date_from
date_to
factory_id
trolley_id
```

Response:

```json
{
  "data": {
    "total_exchange": 1200,
    "broken": 320,
    "bent": 250,
    "changeover": 630,
    "total_consumption": 1200,
    "pending_confirmation": 8,
    "low_stock": 12
  }
}
```

---

# 44. Analytics APIs

Examples:

```text
GET /analytics/consumption-trend
GET /analytics/consumption-by-factory
GET /analytics/consumption-by-trolley
GET /analytics/consumption-by-needle-type
GET /analytics/exchange-by-type
GET /analytics/stock-variance
```

All analytics endpoints must apply user scope.

---

# 45. Reporting APIs

Examples:

```text
GET /reports/exchanges
GET /reports/inventory
GET /reports/consumption
GET /reports/variance
```

For large export:

```text
POST /reports/export
GET  /reports/export/{job_id}
```

Recommended async state:

```text
QUEUED
PROCESSING
COMPLETED
FAILED
```

---

# 46. Audit APIs

## GET /audit-logs

Filters:

```text
date_from
date_to
actor_id
factory_id
entity
entity_id
action
```

Audit response:

```json
{
  "data": {
    "timestamp": "2026-08-05T10:15:00Z",
    "actor_id": "USR-001",
    "action": "CONFIRMATION_APPROVED",
    "entity": "CONFIRMATION",
    "entity_id": "CONF-001",
    "before": {
      "status": "PENDING"
    },
    "after": {
      "status": "APPROVED"
    }
  }
}
```

---

# 47. Synchronization APIs

Mobile menggunakan offline-first approach.

## GET /sync/bootstrap

Returns required master/context data for the device.

Scope:

```text
Factory
Trolley
Device
User
Needle Type
Exchange Type
Storage Mapping
Relevant Configuration
```

## POST /sync/push

Used to submit queued offline commands.

Request:

```json
{
  "device_id": "DEV-001",
  "items": [
    {
      "client_transaction_id": "TX-001",
      "command": "CREATE_EXCHANGE",
      "payload": {}
    }
  ]
}
```

## GET /sync/pull

Returns changes after a synchronization cursor.

```json
{
  "data": {
    "cursor": "CURSOR-001",
    "changes": []
  }
}
```

---

# 48. Idempotency

Critical commands must support:

```http
Idempotency-Key: <uuid>
```

Minimum:

```text
Create Exchange
Issue Needle
Complete Exchange
Approval
Receiving
Transfer
Return
Adjustment
```

Same idempotency key must not create duplicate business effects.

---

# 49. Client Transaction ID

Mobile transaction creation must support:

```text
client_transaction_id
```

Purpose:

- offline queue;
- retry;
- duplicate detection;
- reconciliation.

Example:

```json
{
  "client_transaction_id": "MOBILE-DEV001-20260805-000001"
}
```

---

# 50. Pagination

Standard:

```http
GET /exchanges?page=1&page_size=20
```

Response:

```json
{
  "data": [],
  "meta": {
    "page": 1,
    "page_size": 20,
    "total": 500,
    "total_pages": 25
  }
}
```

---

# 51. Sorting

Example:

```http
GET /exchanges?sort=-created_at
```

Default sorting should be documented per resource.

---

# 52. Standard Success Response

```json
{
  "data": {},
  "meta": {}
}
```

---

# 53. Standard Error Response

```json
{
  "error": {
    "code": "STOCK_NOT_AVAILABLE",
    "message": "Insufficient stock for selected needle type.",
    "details": {},
    "request_id": "REQ-001"
  }
}
```

---

# 54. HTTP Status Mapping

| HTTP | Usage |
|---|---|
| 200 | Successful GET / command |
| 201 | Resource created |
| 202 | Async operation accepted |
| 204 | Successful operation without body |
| 400 | Invalid request |
| 401 | Authentication required/invalid |
| 403 | Permission/scope denied |
| 404 | Resource not found |
| 409 | State/conflict/idempotency conflict |
| 422 | Business validation failure |
| 429 | Rate limited |
| 500 | Internal server error |
| 503 | Service unavailable |

---

# 55. Business Error Codes

Minimum:

```text
AUTH_INVALID
AUTH_EXPIRED
ACCESS_DENIED
FACTORY_INACTIVE
TROLLEY_INACTIVE
DEVICE_REVOKED
EMPLOYEE_NOT_FOUND
EMPLOYEE_INACTIVE
NEEDLE_TYPE_INACTIVE
EXCHANGE_TYPE_INVALID
EXCHANGE_NOT_FOUND
INVALID_EXCHANGE_STATE
FRAGMENT_CONFIRMATION_REQUIRED
CONFIRMATION_NOT_FOUND
CONFIRMATION_ALREADY_DECIDED
CONFIRMATION_NOT_APPROVED
STOCK_NOT_AVAILABLE
NEGATIVE_STOCK_NOT_ALLOWED
INVALID_STORAGE_MAPPING
TRANSFER_NOT_ALLOWED
ADJUSTMENT_NOT_ALLOWED
INVALID_COUNT_SESSION
DUPLICATE_REQUEST
IDEMPOTENCY_CONFLICT
MASTER_DATA_IN_USE
```

---

# 56. Exchange State Model

State machine yang harus dipusatkan di backend:

```text
CREATED
   |
   v
OPERATOR_IDENTIFIED
   |
   v
NEEDLE_SELECTED
   |
   v
EXCHANGE_TYPE_SELECTED
   |
   v
FRAGMENT_CHECK
   |
   +---- FOUND / NOT_REQUIRED ----+
   |                              |
   |                              v
   |                         EVIDENCE
   |                              |
   |                              v
   |                         NEW_NEEDLE_SELECTED
   |                              |
   |                              v
   |                         NEEDLE_ISSUED
   |                              |
   |                              v
   |                         USED_NEEDLE_STORED
   |                              |
   |                              v
   |                           COMPLETED
   |
   +---- NOT_FOUND
              |
              v
        CONFIRMATION_PENDING
              |
        +-----+-----+
        |           |
     APPROVED     REJECTED
        |           |
        v           v
    CONTINUE      POLICY
```

Exact transition policy must be finalized with business owner.

---

# 57. Inventory Consistency

For exchange issue:

```text
Exchange
   |
   +--> Stock Movement
   |
   +--> Stock Balance
   |
   +--> Audit
```

These changes must be transactionally consistent.

The client must never:

```text
1. Update local stock as authoritative
2. Call a separate API later to decrease backend stock
```

Backend command is authoritative.

---

# 58. API Security

Backend must enforce:

```text
Authentication
Authorization
Factory Scope
Location Scope
Device Scope
State Validation
Input Validation
Rate Limiting where appropriate
Audit
```

Sensitive credentials for:

```text
WhatsApp Provider
Database
Internal Services
```

must never be returned to Mobile or WebApps.

---

# 59. API Observability

Every request should have:

```text
request_id
timestamp
actor_id
device_id if applicable
client_type
endpoint
HTTP status
duration
```

Critical commands additionally require business reference:

```text
exchange_id
movement_id
confirmation_id
```

---

# 60. API Acceptance Criteria

## Exchange

Given valid operator, trolley, needle type, and exchange type:

```text
POST /exchanges
```

must create exactly one exchange for one idempotency key.

## Broken Needle

Given:

```text
exchange_type = BROKEN
fragment_status = NOT_FOUND
```

backend must create/require confirmation before allowing the transaction to complete.

## New Needle

Given selected new needle type has insufficient trolley stock:

```text
POST /exchanges/{id}/issue
```

must fail with:

```text
STOCK_NOT_AVAILABLE
```

and must not reduce stock.

## Approval

Given confirmation is already APPROVED:

```text
POST /confirmations/{id}/approve
```

must return an invalid-state/conflict response and must not create another approval.

## Inventory

Given source quantity is 50 and transfer quantity is 60:

```text
POST /inventory/transfers
```

must fail and source balance must remain 50.

## Scope

Given user scope is Factory A:

Any request targeting Factory B must be rejected with:

```text
ACCESS_DENIED
```

---

# 61. Mobile Integration Priority

Phase 1 API priority:

```text
1. Authentication
2. Device Context
3. Master Data
4. RFID Employee Lookup
5. Create Exchange
6. Fragment Check
7. Evidence Upload
8. Confirmation Status
9. New Needle Selection
10. Stock Availability
11. Needle Issue
12. Used Needle Storage
13. Complete Exchange
14. Sync Bootstrap
15. Sync Push/Pull
```

---

# 62. WebApp Integration Priority

Phase 1 API priority:

```text
1. Authentication
2. Dashboard
3. Exchange List
4. Exchange Detail
5. Confirmation List
6. Confirmation Detail
7. Approval
8. Stock Overview
9. Stock Movement
10. Master Data
11. Device/Trolley
12. Reporting
13. Analytics
14. Audit
```

---

# 63. Open API Decisions

The following are intentionally not finalized because the previous documents do not specify them:

1. Exact API host/domain.
2. OAuth2/OIDC vs another authentication mechanism.
3. JWT structure and signing strategy.
4. Exact pagination maximum.
5. Exact rate limits.
6. Exact file storage provider.
7. WhatsApp Business provider.
8. Exact notification webhook contract.
9. Exact offline conflict resolution strategy.
10. Exact exchange state transition policy after rejection.
11. Approval hierarchy.
12. Adjustment approval requirement.
13. Transfer approval requirement.
14. Exact analytics formulas.
15. Exact report generation technology.
16. API gateway requirement.
17. Service-to-service authentication.
18. Data retention period.

These should be resolved before API implementation is considered production-ready.

---

# 64. Definition of Done

API Specification is implementation-ready when:

- [ ] Authentication contract finalized.
- [ ] Authorization contract finalized.
- [ ] Factory scope finalized.
- [ ] Location scope finalized.
- [ ] Device scope finalized.
- [ ] Master data endpoints finalized.
- [ ] Exchange endpoints finalized.
- [ ] Confirmation endpoints finalized.
- [ ] Notification integration finalized.
- [ ] Inventory endpoints finalized.
- [ ] Stock movement contract finalized.
- [ ] Reporting endpoints finalized.
- [ ] Analytics endpoints finalized.
- [ ] Audit endpoints finalized.
- [ ] Sync contract finalized.
- [ ] Idempotency rules finalized.
- [ ] Error codes finalized.
- [ ] Exchange state machine finalized.
- [ ] Open business decisions resolved.
- [ ] OpenAPI/Swagger contract generated.
- [ ] Backend integration tests created.
- [ ] Mobile integration tests created.
- [ ] WebApp integration tests created.

---

# 65. Recommended Next Artifact

Setelah API Specification, dokumen berikutnya sebaiknya:

```text
10 — Database Design
```

Database Design harus diturunkan dari API + SRS, khususnya:

```text
Factory
Trolley
Device
Employee
RFID
Needle Type
Exchange
Exchange Evidence
Confirmation
Inventory Balance
Stock Movement
Storage Location
User
Role
Permission
Notification
Audit Log
Sync / Idempotency
```

**End of API Specification**

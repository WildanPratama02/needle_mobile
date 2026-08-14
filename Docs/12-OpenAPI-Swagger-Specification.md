# 12 — OpenAPI / Swagger Specification

**Version:** 1.0  
**Status:** Draft / API Contract Baseline  
**Clients:** Flutter Android Tablet, WebApps  
**Backend:** Central Backend API  
**References:** PRD, Use Case, Functional Requirements, Architecture, SRS Mobile, SRS WebApps, Database Design, Database ERD & Physical Schema

---

## 1. Purpose

Dokumen ini mendefinisikan kontrak API antara:

```text
Flutter Android Tablet
        |
        | HTTPS / JSON
        v
Central Backend API
        |
        v
Database
        ^
        |
        | HTTPS / JSON
        |
WebApps
```

Client tidak melakukan direct database access.

---

## 2. API Principles

Backend merupakan **single source of truth** untuk:

- authentication
- authorization
- validation
- exchange state
- inventory balance
- stock movement
- confirmation
- audit
- transaction result

Client hanya mengirim request/command.

---

## 3. Base URL

```text
Development:
https://api-dev.<domain>/api/v1

UAT:
https://api-uat.<domain>/api/v1

Production:
https://api.<domain>/api/v1
```

Domain aktual mengikuti keputusan infrastructure.

---

## 4. Versioning

Current:

```text
/api/v1
```

Breaking changes menggunakan:

```text
/api/v2
```

---

## 5. Common Headers

```http
Authorization: Bearer <access-token>
Content-Type: application/json
Accept: application/json
X-Request-ID: <uuid>
X-Device-ID: <device-id>
Idempotency-Key: <unique-key>
```

`X-Device-ID` digunakan untuk request Mobile yang membutuhkan device identification.

`Idempotency-Key` wajib untuk command yang menghasilkan perubahan business state.

---

## 6. Authentication

### POST `/auth/login`

Request:

```json
{
  "username": "admin",
  "password": "********"
}
```

Response:

```json
{
  "success": true,
  "data": {
    "accessToken": "jwt",
    "refreshToken": "token",
    "expiresIn": 3600,
    "user": {
      "id": "uuid",
      "username": "admin",
      "name": "System Admin",
      "roles": ["SYSTEM_ADMIN"]
    }
  },
  "meta": {
    "requestId": "uuid"
  }
}
```

### GET `/auth/me`

Returns:

```text
User
Role
Permission
Factory Scope
Location Scope
```

---

## 7. Standard Response

### Success

```json
{
  "success": true,
  "data": {},
  "meta": {
    "requestId": "uuid"
  }
}
```

### Pagination

```json
{
  "success": true,
  "data": [],
  "meta": {
    "requestId": "uuid",
    "page": 1,
    "pageSize": 20,
    "total": 100,
    "totalPages": 5
  }
}
```

### Error

```json
{
  "success": false,
  "error": {
    "code": "EXCHANGE_NOT_FOUND",
    "message": "Exchange transaction was not found.",
    "details": []
  },
  "meta": {
    "requestId": "uuid"
  }
}
```

---

## 8. HTTP Status Codes

| Status | Meaning |
|---|---|
| 200 | Success |
| 201 | Created |
| 202 | Accepted / asynchronous |
| 204 | Success without body |
| 400 | Invalid request |
| 401 | Authentication failure |
| 403 | Forbidden |
| 404 | Resource not found |
| 409 | Business conflict / idempotency conflict |
| 422 | Validation/business rule error |
| 429 | Rate limit |
| 500 | Internal error |
| 503 | Dependency unavailable |

---

# 9. Master Data APIs

## Factory

```http
GET    /factories
POST   /factories
GET    /factories/{factoryId}
PATCH  /factories/{factoryId}
POST   /factories/{factoryId}/activate
POST   /factories/{factoryId}/deactivate
```

Create:

```json
{
  "code": "FACTORY-01",
  "name": "Factory 01",
  "timezone": "Asia/Jakarta"
}
```

---

## Location

```http
GET    /locations
POST   /locations
GET    /locations/{locationId}
PATCH  /locations/{locationId}
```

Create:

```json
{
  "factoryId": "uuid",
  "parentLocationId": null,
  "code": "WH-01",
  "name": "Needle Warehouse",
  "locationType": "WAREHOUSE"
}
```

Location types:

```text
WAREHOUSE
TROLLEY
USED_NEEDLE_STORAGE
```

---

## Trolley

```http
GET    /trolleys
POST   /trolleys
GET    /trolleys/{trolleyId}
PATCH  /trolleys/{trolleyId}
```

Create:

```json
{
  "factoryId": "uuid",
  "code": "TR-01",
  "name": "Trolley 01"
}
```

Trolley number tidak di-hard-code. Satu factory dapat mempunyai N trolley.

---

## Device

```http
GET    /devices
POST   /devices
POST   /devices/{deviceId}/activate
POST   /devices/{deviceId}/revoke
POST   /devices/{deviceId}/heartbeat
```

Heartbeat:

```json
{
  "appVersion": "1.0.0",
  "deviceTime": "2026-08-05T08:00:00Z"
}
```

---

## Employee / RFID

```http
GET /employees
GET /employees/{employeeId}
GET /rfid/cards/{rfidUid}
```

RFID response:

```json
{
  "success": true,
  "data": {
    "employee": {
      "id": "uuid",
      "employeeNumber": "EMP001",
      "name": "Operator Name",
      "factoryId": "uuid",
      "status": "ACTIVE"
    },
    "rfidCard": {
      "id": "uuid",
      "uid": "RFID001",
      "status": "ACTIVE"
    }
  }
}
```

---

## Needle Type

```http
GET    /needle-types
POST   /needle-types
GET    /needle-types/{needleTypeId}
PATCH  /needle-types/{needleTypeId}
POST   /needle-types/{needleTypeId}/activate
POST   /needle-types/{needleTypeId}/deactivate
```

Create:

```json
{
  "code": "DBX1",
  "name": "Needle Type Example",
  "category": "Sewing",
  "unit": "PCS",
  "minimumStock": 50
}
```

---

## Exchange Type

```http
GET /exchange-types
```

Initial values:

```text
BROKEN
BENT
CHANGEOVER
```

`BROKEN` mempunyai:

```text
requiresFragmentValidation = true
```

---

# 10. Exchange API

Core flow:

```text
Create Exchange
      |
      v
Identify Operator
      |
      v
Select Exchange Type + Old Needle Type
      |
      v
Validate Fragment
      |
      +---- NOT_FOUND ---> Confirmation
      |                       |
      |                       v
      |                    Approved
      |
      v
Capture Evidence
      |
      v
Select New Needle Type
      |
      v
Issue New Needle
      |
      v
Store Used Needle
      |
      v
Complete Exchange
```

---

## POST `/exchanges`

Request:

```json
{
  "clientTransactionId": "mobile-device-uuid-000001",
  "factoryId": "uuid",
  "trolleyId": "uuid",
  "deviceId": "uuid"
}
```

Response:

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "exchangeNumber": "EXC-20260805-000001",
    "status": "CREATED"
  },
  "meta": {
    "requestId": "uuid"
  }
}
```

---

## POST `/exchanges/{exchangeId}/operator`

Request:

```json
{
  "employeeId": "uuid",
  "rfidUid": "RFID001"
}
```

Backend validates RFID, employee, factory scope, and active status.

Transition:

```text
CREATED -> OPERATOR_IDENTIFIED
```

---

## POST `/exchanges/{exchangeId}/type`

Request:

```json
{
  "exchangeTypeId": "uuid",
  "oldNeedleTypeId": "uuid"
}
```

Transition:

```text
OPERATOR_IDENTIFIED -> EXCHANGE_TYPE_SELECTED
```

---

## POST `/exchanges/{exchangeId}/fragment`

Request:

```json
{
  "fragmentStatus": "FOUND"
}
```

Allowed:

```text
FOUND
NOT_FOUND
```

Catatan (dikoreksi 2026-08-10): `NOT_REQUIRED` dihapus dari daftar ini. Endpoint
`/fragment` hanya berlaku untuk `exchangeType = BROKEN`; `BENT` dan `CHANGEOVER`
melewati state `FRAGMENT_CHECK` sepenuhnya dan langsung memanggil `/evidence`,
jadi tidak ada panggilan placeholder yang perlu nilai `NOT_REQUIRED`. Sejalan
dengan `CONTEXT.md` (Fragment Status hanya `FOUND`/`NOT_FOUND`) dan enum
`FragmentStatus` di database. Request dengan `NOT_REQUIRED` ditolak `400`.

Jika:

```text
exchangeType = BROKEN
fragmentStatus = NOT_FOUND
```

maka confirmation workflow wajib dibuat.

---

## POST `/exchanges/{exchangeId}/evidence`

Recommended:

```http
Content-Type: multipart/form-data
```

Fields:

```text
file
evidenceType
capturedAt
```

Evidence type:

```text
OLD_NEEDLE
BROKEN_FRAGMENT
OTHER
```

Response:

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "exchangeId": "uuid",
    "evidenceType": "OLD_NEEDLE",
    "storageKey": "exchange/2026/08/uuid.jpg"
  }
}
```

Binary image sebaiknya disimpan di object storage. Database menyimpan metadata/reference.

---

## GET `/exchanges/{exchangeId}`

Returns:

```text
Exchange
Factory
Trolley
Device
Operator
PIC
Exchange Type
Old Needle Type
New Needle Type
Fragment Status
Evidence
Confirmation
Status
```

---

## GET `/exchanges`

Filters:

```text
factoryId
trolleyId
deviceId
operatorId
exchangeTypeId
oldNeedleTypeId
newNeedleTypeId
status
dateFrom
dateTo
search
page
pageSize
```

---

## POST `/exchanges/{exchangeId}/new-needle`

Request:

```json
{
  "needleTypeId": "uuid"
}
```

Backend validates active needle type and available stock.

Transition:

```text
EVIDENCE_CAPTURED -> NEW_NEEDLE_SELECTED
```

---

## POST `/exchanges/{exchangeId}/issue`

Request:

```json
{
  "quantity": 1
}
```

Atomic backend transaction:

```text
Validate Exchange
Validate Stock
Create ISSUE movement
Decrease inventory balance
Update Exchange
Create Audit
Commit
```

Transition:

```text
NEW_NEEDLE_SELECTED -> NEEDLE_ISSUED
```

Negative stock is prohibited.

---

## POST `/exchanges/{exchangeId}/store-used-needle`

Backend resolves:

```text
Trolley
+
Exchange Type
+
Storage Mapping
```

Transition:

```text
NEEDLE_ISSUED -> USED_NEEDLE_STORED
```

---

## POST `/exchanges/{exchangeId}/complete`

Required preconditions:

```text
Operator identified
Exchange Type selected
Old Needle Type selected
Fragment rule satisfied
Required confirmation approved
Required evidence captured
New Needle Type selected
New Needle issued
Used Needle stored
```

Transition:

```text
USED_NEEDLE_STORED -> COMPLETED
```

---

## POST `/exchanges/{exchangeId}/cancel`

Request:

```json
{
  "reason": "Operator cancelled transaction"
}
```

Allowed cancellation states must follow the final business policy.

---

# 11. Confirmation API

```http
GET  /confirmations
GET  /confirmations/{confirmationId}
POST /confirmations/{confirmationId}/approve
POST /confirmations/{confirmationId}/reject
```

Approve:

```json
{
  "reason": "Supervisor confirmed broken fragment is unavailable."
}
```

Reject:

```json
{
  "reason": "Fragment must be located before exchange can continue."
}
```

Status:

```text
PENDING
APPROVED
REJECTED
EXPIRED
```

---

# 12. WhatsApp Notification

Application clients do not directly access WhatsApp credentials.

Flow:

```text
Confirmation
     |
     v
Notification Service
     |
     v
WhatsApp Provider
```

Internal backend operation:

```http
POST /internal/notifications/whatsapp
```

Payload:

```json
{
  "confirmationId": "uuid",
  "recipientUserId": "uuid",
  "templateCode": "BROKEN_NEEDLE_CONFIRMATION"
}
```

Notification status:

```text
NOT_SENT
SENT
DELIVERED
FAILED
```

Provider credentials remain in secret management.

---

# 13. Inventory API

## GET `/inventory/balances`

Filters:

```text
factoryId
locationId
trolleyId
needleTypeId
lowStock
page
pageSize
```

Response:

```json
{
  "locationId": "uuid",
  "needleTypeId": "uuid",
  "quantity": 100,
  "reservedQuantity": 0,
  "availableQuantity": 100
}
```

---

## GET `/inventory/trolleys/{trolleyId}`

Returns stock per needle type:

```json
{
  "trolleyId": "uuid",
  "factoryId": "uuid",
  "items": [
    {
      "needleTypeId": "uuid",
      "needleTypeCode": "DBX1",
      "quantity": 100,
      "minimumStock": 20,
      "stockStatus": "NORMAL"
    }
  ]
}
```

---

## GET `/inventory/movements`

Filters:

```text
factoryId
locationId
trolleyId
needleTypeId
movementType
referenceType
referenceId
dateFrom
dateTo
page
pageSize
```

Movement types:

```text
RECEIVING
ISSUE
TRANSFER_OUT
TRANSFER_IN
RETURN
ADJUSTMENT
REVERSAL
```

---

## POST `/inventory/receivings`

```json
{
  "factoryId": "uuid",
  "destinationLocationId": "uuid",
  "needleTypeId": "uuid",
  "quantity": 500,
  "referenceDocument": "GR-00001",
  "note": "Initial stock"
}
```

Atomic operation:

```text
Create Receiving
Create RECEIVING Movement
Increase Balance
Audit
```

---

## POST `/inventory/transfers`

```json
{
  "factoryId": "uuid",
  "sourceLocationId": "uuid",
  "destinationLocationId": "uuid",
  "needleTypeId": "uuid",
  "quantity": 100,
  "note": "Replenishment trolley"
}
```

Atomic:

```text
TRANSFER_OUT
TRANSFER_IN
Update source
Update destination
```

---

## POST `/inventory/returns`

```json
{
  "factoryId": "uuid",
  "sourceLocationId": "uuid",
  "destinationLocationId": "uuid",
  "needleTypeId": "uuid",
  "quantity": 20,
  "reason": "Excess stock"
}
```

---

## POST `/inventory/adjustments`

```json
{
  "factoryId": "uuid",
  "locationId": "uuid",
  "needleTypeId": "uuid",
  "actualQuantity": 95,
  "reason": "Physical count variance"
}
```

Backend calculates:

```text
systemQuantity
actualQuantity
varianceQuantity
```

Approval workflow follows the approved business policy.

---

# 14. Physical Count API

```http
POST /inventory/count-sessions
GET  /inventory/count-sessions/{countSessionId}
POST /inventory/count-sessions/{countSessionId}/items
POST /inventory/count-sessions/{countSessionId}/complete
```

Create:

```json
{
  "factoryId": "uuid",
  "locationId": "uuid"
}
```

Count item:

```json
{
  "needleTypeId": "uuid",
  "physicalQuantity": 95
}
```

---

# 15. Dashboard API

## GET `/dashboard/overview`

Filters:

```text
factoryId
dateFrom
dateTo
```

Example:

```json
{
  "totalExchanges": 1200,
  "brokenNeedles": 450,
  "bentNeedles": 300,
  "changeovers": 450,
  "pendingConfirmations": 8,
  "lowStockItems": 12
}
```

---

## GET `/dashboard/exchange-trend`

Query:

```text
factoryId
dateFrom
dateTo
groupBy=day
```

Example:

```json
[
  {
    "date": "2026-08-01",
    "total": 120,
    "broken": 40,
    "bent": 30,
    "changeover": 50
  }
]
```

---

## GET `/dashboard/needle-consumption`

Returns consumption/issue statistics by:

```text
Factory
Trolley
Needle Type
Date
```

---

## GET `/dashboard/stock-summary`

Returns:

```text
Total Stock
Low Stock
Out of Stock
Stock by Factory
Stock by Trolley
Stock by Needle Type
```

---

# 16. User / RBAC API

```http
GET    /users
POST   /users
GET    /users/{userId}
PATCH  /users/{userId}

GET    /roles
GET    /permissions

POST   /users/{userId}/roles
DELETE /users/{userId}/roles/{roleId}

POST   /users/{userId}/factory-scopes
DELETE /users/{userId}/factory-scopes/{factoryId}
```

Authorization is based on:

```text
Role
+
Permission
+
Factory Scope
+
Location Scope
```

---

# 17. Audit API

## GET `/audit-logs`

Filters:

```text
factoryId
actorUserId
entityType
entityId
action
dateFrom
dateTo
page
pageSize
```

Required permission:

```text
AUDIT_VIEW
```

---

# 18. Mobile Bootstrap

## GET `/mobile/bootstrap`

Purpose:

```text
Prepare Android Tablet for operation.
```

Response:

```json
{
  "device": {},
  "factory": {},
  "trolley": {},
  "exchangeTypes": [],
  "needleTypes": [],
  "storageMappings": [],
  "serverTime": "2026-08-05T08:00:00Z",
  "syncCursor": "cursor-value"
}
```

This allows the tablet to cache required master data.

---

# 19. Mobile Sync

## POST `/mobile/sync`

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
    "nextCursor": "next-cursor"
  }
}
```

Server harus menangani:

```text
Duplicate
Retry
Out-of-order
Partial failure
Network timeout
Invalid state
```

---

# 20. Exchange State Contract

Backend authoritative state machine:

```text
CREATED
   |
   v
OPERATOR_IDENTIFIED
   |
   v
EXCHANGE_TYPE_SELECTED
   |
   v
FRAGMENT_CHECK
   |
   +---- NOT_FOUND ---> CONFIRMATION_PENDING
   |                          |
   |                          v
   |                       APPROVED
   |                          |
   +--------------------------+
   |
   v
EVIDENCE_CAPTURED
   |
   v
NEW_NEEDLE_SELECTED
   |
   v
NEEDLE_ISSUED
   |
   v
USED_NEEDLE_STORED
   |
   v
COMPLETED
```

Invalid transition:

```text
422 EXCHANGE_INVALID_STATE
```

---

# 21. Authorization Baseline

| Domain | PIC Troli | PIC Inventory | Management | System Admin |
|---|---:|---:|---:|---:|
| Exchange Create | ✓ | - | - | ✓ |
| Exchange View | Scope | ✓ | ✓ | ✓ |
| Confirmation Approve | - | Optional | ✓ | ✓ |
| Stock View | Trolley | ✓ | ✓ | ✓ |
| Stock Receive | - | ✓ | ✓ | ✓ |
| Stock Transfer | - | ✓ | ✓ | ✓ |
| Stock Adjustment | - | ✓ | ✓ | ✓ |
| Master Data | - | Limited | View | ✓ |
| User Management | - | - | - | ✓ |
| Dashboard | Limited | ✓ | ✓ | ✓ |
| Audit | - | Limited | ✓ | ✓ |

Final authorization matrix must be approved before implementation.

---

# 22. Factory Scope Enforcement

Every factory-sensitive request must validate:

```text
Authenticated User
       |
       v
Permission
       |
       v
Factory Scope
       |
       v
Requested Resource
```

Example:

```text
PIC Inventory Factory A
```

must not modify:

```text
Factory B
```

unless the user has Factory B scope.

---

# 23. Standard Error Codes

Authentication:

```text
AUTH_INVALID_TOKEN
AUTH_FORBIDDEN
```

Master:

```text
FACTORY_NOT_FOUND
TROLLEY_NOT_FOUND
DEVICE_NOT_FOUND
EMPLOYEE_NOT_FOUND
RFID_NOT_FOUND
NEEDLE_TYPE_NOT_FOUND
EXCHANGE_TYPE_NOT_FOUND
```

Exchange:

```text
EXCHANGE_NOT_FOUND
EXCHANGE_DUPLICATE
EXCHANGE_INVALID_STATE
EXCHANGE_FRAGMENT_CONFIRMATION_REQUIRED
```

Confirmation:

```text
CONFIRMATION_NOT_FOUND
CONFIRMATION_ALREADY_DECIDED
```

Inventory:

```text
INVENTORY_NOT_FOUND
INVENTORY_INSUFFICIENT_STOCK
INVENTORY_NEGATIVE_STOCK_NOT_ALLOWED
```

Technical:

```text
IDEMPOTENCY_KEY_REUSED
VALIDATION_ERROR
INTERNAL_ERROR
```

---

# 24. Important Error Examples

## Insufficient Stock

```http
409 Conflict
```

```json
{
  "success": false,
  "error": {
    "code": "INVENTORY_INSUFFICIENT_STOCK",
    "message": "Insufficient stock for the selected needle type.",
    "details": {
      "needleTypeId": "uuid",
      "availableQuantity": 0,
      "requestedQuantity": 1
    }
  },
  "meta": {
    "requestId": "uuid"
  }
}
```

## Missing Broken Fragment

```http
422 Unprocessable Entity
```

```json
{
  "success": false,
  "error": {
    "code": "EXCHANGE_FRAGMENT_CONFIRMATION_REQUIRED",
    "message": "Supervisor confirmation is required because the broken needle fragment was not found."
  },
  "meta": {
    "requestId": "uuid"
  }
}
```

## Invalid State

```json
{
  "success": false,
  "error": {
    "code": "EXCHANGE_INVALID_STATE",
    "message": "The requested operation is not allowed in the current exchange state.",
    "details": {
      "currentState": "CREATED",
      "requiredState": "EVIDENCE_CAPTURED"
    }
  },
  "meta": {
    "requestId": "uuid"
  }
}
```

---

# 25. Idempotency Rules

Commands requiring idempotency:

```text
Create Exchange
Upload Evidence
Fragment Validation
Create Confirmation
Approve Confirmation
Reject Confirmation
Issue Needle
Complete Exchange
Receiving
Transfer
Return
Adjustment
```

Rule:

```text
Same Idempotency-Key
+
Same Request Hash
=
Return Previous Result
```

Same key + different request:

```text
409 IDEMPOTENCY_KEY_REUSED
```

---

# 26. API Observability

Every request should produce:

```text
requestId
userId
deviceId
endpoint
HTTP status
latency
error code
```

Never log:

```text
Password
Access Token
Refresh Token
WhatsApp Credentials
API Secrets
```

---

# 27. OpenAPI Repository Structure

Recommended:

```text
docs/
└── api/
    ├── openapi.yaml
    ├── paths/
    │   ├── auth.yaml
    │   ├── factories.yaml
    │   ├── locations.yaml
    │   ├── trolleys.yaml
    │   ├── devices.yaml
    │   ├── employees.yaml
    │   ├── needle-types.yaml
    │   ├── exchanges.yaml
    │   ├── confirmations.yaml
    │   ├── inventory.yaml
    │   ├── notifications.yaml
    │   ├── dashboard.yaml
    │   └── audit.yaml
    └── schemas/
        ├── common.yaml
        ├── exchange.yaml
        ├── inventory.yaml
        ├── confirmation.yaml
        ├── user.yaml
        └── dashboard.yaml
```

---

# 28. OpenAPI Metadata Baseline

```yaml
openapi: 3.0.3

info:
  title: Needle Management System API
  version: 1.0.0
  description: Central API for Needle Trolley and Needle Management WebApps.

servers:
  - url: https://api-dev.<domain>/api/v1
    description: Development
  - url: https://api-uat.<domain>/api/v1
    description: UAT
  - url: https://api.<domain>/api/v1
    description: Production
```

Security:

```yaml
components:
  securitySchemes:
    bearerAuth:
      type: http
      scheme: bearer
      bearerFormat: JWT
```

---

# 29. Health API

```http
GET /health
GET /ready
```

Example:

```json
{
  "status": "UP",
  "timestamp": "2026-08-05T08:00:00Z"
}
```

`/health` checks process availability.

`/ready` checks application dependency readiness.

---

# 30. API Acceptance Criteria

## Exchange

- [ ] PIC can create exchange.
- [ ] RFID resolves operator.
- [ ] Operator is validated.
- [ ] Exchange Type is validated.
- [ ] Old Needle Type is validated.
- [ ] Broken fragment rule is enforced.
- [ ] Missing fragment creates confirmation workflow.
- [ ] Evidence can be uploaded.
- [ ] New Needle Type is validated.
- [ ] Stock is validated before issue.
- [ ] Issue creates stock movement.
- [ ] Used needle storage mapping is resolved.
- [ ] Exchange cannot complete before required steps.

## Inventory

- [ ] Negative stock is impossible.
- [ ] Every stock change creates movement.
- [ ] Transfer is atomic.
- [ ] Adjustment is auditable.
- [ ] Factory scope is enforced.

## Mobile

- [ ] Device is registered.
- [ ] Device belongs to trolley.
- [ ] Bootstrap works.
- [ ] Retry is idempotent.
- [ ] Duplicate commands are handled.
- [ ] Offline reconciliation is deterministic.

## WebApp

- [ ] Master data APIs available.
- [ ] Inventory APIs available.
- [ ] Confirmation APIs available.
- [ ] Dashboard APIs available.
- [ ] Audit APIs available.

---

# 31. Definition of Done

- [ ] Endpoint list approved.
- [ ] Request schemas approved.
- [ ] Response schemas approved.
- [ ] Error codes approved.
- [ ] Authentication approved.
- [ ] Authorization matrix approved.
- [ ] Exchange state transitions approved.
- [ ] Idempotency behavior approved.
- [ ] Pagination standard approved.
- [ ] Evidence upload strategy approved.
- [ ] Mobile sync contract approved.
- [ ] WhatsApp integration contract approved.
- [ ] OpenAPI YAML generated.
- [ ] Swagger UI validated.
- [ ] Contract tests prepared.
- [ ] Backend implementation can begin.

---

# 32. Next Documents

Recommended sequence:

```text
12 OpenAPI / Swagger
        |
        v
13 RFID Integration Specification
        |
        v
14 WhatsApp Integration Specification
        |
        v
15 Mobile Offline Sync Specification
        |
        v
16 Security Architecture
        |
        v
17 Mobile UI/UX Specification
        |
        v
18 WebApp UI/UX Specification
        |
        v
19 Test Strategy & UAT
        |
        v
20 Deployment & DevOps Architecture
```

**End of OpenAPI / Swagger Specification**

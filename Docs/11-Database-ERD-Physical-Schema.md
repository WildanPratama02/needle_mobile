# 11 — Database ERD & Physical Schema
# Needle Management System

**Version:** 1.0  
**Status:** Draft / Technical Design Baseline  
**Role:** Senior Lead Architect & System Analyst  
**Depends On:** `10-Database-Design.md`

> **Important:** Dokumen ini menurunkan logical database design menjadi physical schema baseline. DBMS belum dikunci pada dokumen sebelumnya, sehingga SQL/DDL di bawah harus diperlakukan sebagai implementation baseline yang dapat disesuaikan setelah DBMS dipilih.

---

# 1. Purpose

Dokumen ini mendefinisikan:

- Physical ERD.
- Table structure.
- Primary Key.
- Foreign Key.
- Unique constraints.
- Check constraints.
- Index strategy.
- Reference values.
- Transaction boundaries.
- Trigger requirements.
- Migration order.
- Seed/reference data.
- Data integrity rules.

Dokumen ini tetap mengikuti prinsip dari Database Design:

```text
Factory
   |
   +-- Warehouse
   |
   +-- Trolley 01
   +-- Trolley 02
   +-- Trolley 03
          |
          v
      Inventory
          |
          v
    Needle Exchange
          |
          v
     Stock Ledger
```

Trolley tetap dimodelkan sebagai dynamic stock location, bukan hard-coded entity.

---

# 2. Source of Truth

Database adalah central transactional source of truth.

```text
Flutter Android Tablet
        |
        | HTTPS API
        v
Central Backend
        |
        v
Database
        ^
        |
        | HTTPS API
        |
WebApp
```

Tidak diperbolehkan:

```text
Flutter -> Database
WebApp  -> Database
```

---

# 3. Physical Database Domains

```text
01_identity
  users
  roles
  permissions
  user_roles
  role_permissions
  user_factory_scopes
  user_location_scopes

02_organization
  factories
  locations
  trolleys
  devices

03_employee
  employees
  rfid_cards

04_needle_master
  needle_types
  exchange_types
  storage_mappings

05_exchange
  exchanges
  exchange_evidence
  confirmations
  confirmation_decisions

06_inventory
  inventory_balances
  stock_movements
  receiving_transactions
  transfer_transactions
  return_transactions
  adjustment_transactions
  count_sessions
  count_items

07_notification
  notifications

08_audit_integration
  audit_logs
  idempotency_keys
  sync_cursors
  sync_commands
```

---

# 4. Key Design Decision

## 4.1 Trolley Is a Stock Location

Trolley tidak dibuat sebagai isolated inventory table.

Model:

```text
Factory
   |
   +-- Location: Warehouse
   |
   +-- Location: Trolley A-01
   |
   +-- Location: Trolley A-02
   |
   +-- Location: Trolley A-03
```

`trolleys.location_id` menunjuk ke location yang merepresentasikan trolley tersebut.

Stock:

```text
inventory_balances.location_id
```

Dengan demikian:

```text
Factory A
  |
  +-- Warehouse Stock
  +-- Trolley A-01 Stock
  +-- Trolley A-02 Stock
  +-- Trolley A-03 Stock
```

---

# 5. Primary Key Strategy

Semua business entity menggunakan:

```text
UUID
```

sebagai primary key.

Human-readable number tetap disediakan untuk transactional documents:

```text
exchange_number
confirmation_number
movement_number
receiving_number
transfer_number
return_number
adjustment_number
count_number
```

Contoh:

```text
UUID:
550e8400-e29b-41d4-a716-446655440000

Business Number:
EXC-20260805-000001
```

Format final number generation mengikuti backend implementation decision.

---

# 6. Physical Table — factories

```text
factories
```

| Column | Type | Null | Key |
|---|---|---:|---|
| id | UUID | NO | PK |
| code | VARCHAR(50) | NO | UK |
| name | VARCHAR(150) | NO | |
| description | TEXT | YES | |
| timezone | VARCHAR(100) | NO | |
| status | VARCHAR(20) | NO | |
| created_at | TIMESTAMP | NO | |
| updated_at | TIMESTAMP | NO | |

Constraints:

```text
PK(id)
UNIQUE(code)
CHECK(status IN ('ACTIVE','INACTIVE'))
```

---

# 7. Physical Table — locations

```text
locations
```

| Column | Type | Null | Key |
|---|---|---:|---|
| id | UUID | NO | PK |
| factory_id | UUID | NO | FK |
| parent_location_id | UUID | YES | FK |
| code | VARCHAR(50) | NO | |
| name | VARCHAR(150) | NO | |
| location_type | VARCHAR(30) | NO | |
| status | VARCHAR(20) | NO | |
| created_at | TIMESTAMP | NO | |
| updated_at | TIMESTAMP | NO | |

Constraints:

```text
PK(id)

FK(factory_id)
 -> factories.id

FK(parent_location_id)
 -> locations.id

CHECK(location_type IN (
  'WAREHOUSE',
  'TROLLEY',
  'USED_NEEDLE_STORAGE'
))

CHECK(status IN ('ACTIVE','INACTIVE'))
```

Recommended unique scope:

```text
UNIQUE(factory_id, code)
```

---

# 8. Physical Table — trolleys

```text
trolleys
```

| Column | Type | Null | Key |
|---|---|---:|---|
| id | UUID | NO | PK |
| factory_id | UUID | NO | FK |
| location_id | UUID | NO | FK |
| code | VARCHAR(50) | NO | UK |
| name | VARCHAR(150) | NO | |
| status | VARCHAR(20) | NO | |
| created_at | TIMESTAMP | NO | |
| updated_at | TIMESTAMP | NO | |

Constraints:

```text
FK(factory_id) -> factories.id
FK(location_id) -> locations.id

UNIQUE(code)
UNIQUE(location_id)

CHECK(status IN (
  'ACTIVE',
  'INACTIVE'
))
```

Business invariant:

```text
trolleys.location_id
must reference a location where
location_type = TROLLEY
```

This cross-row rule should be validated by backend and/or database trigger depending on DBMS capability.

---

# 9. Physical Table — devices

```text
devices
```

| Column | Type | Null | Key |
|---|---|---:|---|
| id | UUID | NO | PK |
| device_code | VARCHAR(100) | NO | UK |
| device_name | VARCHAR(150) | NO | |
| serial_number | VARCHAR(150) | NO | UK |
| factory_id | UUID | NO | FK |
| trolley_id | UUID | NO | FK |
| status | VARCHAR(20) | NO | |
| app_version | VARCHAR(50) | YES | |
| last_seen_at | TIMESTAMP | YES | |
| created_at | TIMESTAMP | NO | |
| updated_at | TIMESTAMP | NO | |

Constraints:

```text
FK(factory_id) -> factories.id
FK(trolley_id) -> trolleys.id

UNIQUE(device_code)
UNIQUE(serial_number)

CHECK(status IN (
  'ACTIVE',
  'INACTIVE',
  'REVOKED'
))
```

---

# 10. Physical Table — employees

```text
employees
```

| Column | Type | Null | Key |
|---|---|---:|---|
| id | UUID | NO | PK |
| employee_number | VARCHAR(50) | NO | UK |
| name | VARCHAR(150) | NO | |
| department | VARCHAR(100) | YES | |
| factory_id | UUID | NO | FK |
| status | VARCHAR(20) | NO | |
| created_at | TIMESTAMP | NO | |
| updated_at | TIMESTAMP | NO | |

Constraints:

```text
FK(factory_id) -> factories.id
UNIQUE(employee_number)

CHECK(status IN ('ACTIVE','INACTIVE'))
```

---

# 11. Physical Table — rfid_cards

```text
rfid_cards
```

| Column | Type | Null | Key |
|---|---|---:|---|
| id | UUID | NO | PK |
| rfid_uid | VARCHAR(150) | NO | UK |
| employee_id | UUID | NO | FK |
| status | VARCHAR(20) | NO | |
| issued_at | TIMESTAMP | NO | |
| revoked_at | TIMESTAMP | YES | |
| created_at | TIMESTAMP | NO | |
| updated_at | TIMESTAMP | NO | |

Constraints:

```text
FK(employee_id) -> employees.id
UNIQUE(rfid_uid)

CHECK(status IN ('ACTIVE','INACTIVE'))
```

---

# 12. Physical Table — needle_types

```text
needle_types
```

| Column | Type | Null | Key |
|---|---|---:|---|
| id | UUID | NO | PK |
| code | VARCHAR(50) | NO | UK |
| name | VARCHAR(150) | NO | |
| category | VARCHAR(100) | YES | |
| unit | VARCHAR(20) | NO | |
| minimum_stock | DECIMAL(18,3) | NO | |
| description | TEXT | YES | |
| status | VARCHAR(20) | NO | |
| created_at | TIMESTAMP | NO | |
| updated_at | TIMESTAMP | NO | |

Constraints:

```text
UNIQUE(code)
CHECK(minimum_stock >= 0)
CHECK(status IN ('ACTIVE','INACTIVE'))
```

---

# 13. Physical Table — exchange_types

```text
exchange_types
```

| Column | Type | Null | Key |
|---|---|---:|---|
| id | UUID | NO | PK |
| code | VARCHAR(30) | NO | UK |
| name | VARCHAR(100) | NO | |
| description | TEXT | YES | |
| requires_fragment_validation | BOOLEAN | NO | |
| status | VARCHAR(20) | NO | |
| created_at | TIMESTAMP | NO | |
| updated_at | TIMESTAMP | NO | |

Reference:

```text
BROKEN
BENT
CHANGEOVER
```

---

# 14. Physical Table — storage_mappings

```text
storage_mappings
```

| Column | Type | Null | Key |
|---|---|---:|---|
| id | UUID | NO | PK |
| trolley_id | UUID | NO | FK |
| exchange_type_id | UUID | NO | FK |
| storage_location_id | UUID | NO | FK |
| status | VARCHAR(20) | NO | |
| created_at | TIMESTAMP | NO | |
| updated_at | TIMESTAMP | NO | |

Constraints:

```text
FK(trolley_id) -> trolleys.id
FK(exchange_type_id) -> exchange_types.id
FK(storage_location_id) -> locations.id

UNIQUE(trolley_id, exchange_type_id)

CHECK(status IN ('ACTIVE','INACTIVE'))
```

Business invariant:

```text
storage_location.location_type
must be USED_NEEDLE_STORAGE
```

---

# 15. Physical Table — exchanges

```text
exchanges
```

| Column | Type | Null | Key |
|---|---|---:|---|
| id | UUID | NO | PK |
| exchange_number | VARCHAR(50) | NO | UK |
| client_transaction_id | VARCHAR(100) | NO | |
| factory_id | UUID | NO | FK |
| trolley_id | UUID | NO | FK |
| device_id | UUID | NO | FK |
| operator_id | UUID | NO | FK |
| pic_user_id | UUID | NO | FK |
| old_needle_type_id | UUID | NO | FK |
| exchange_type_id | UUID | NO | FK |
| new_needle_type_id | UUID | YES | FK |
| fragment_status | VARCHAR(30) | YES | |
| confirmation_id | UUID | YES | FK |
| status | VARCHAR(40) | NO | |
| created_at | TIMESTAMP | NO | |
| updated_at | TIMESTAMP | NO | |
| completed_at | TIMESTAMP | YES | |
| cancelled_at | TIMESTAMP | YES | |

Constraints:

```text
UNIQUE(exchange_number)

FK(factory_id) -> factories.id
FK(trolley_id) -> trolleys.id
FK(device_id) -> devices.id
FK(operator_id) -> employees.id
FK(pic_user_id) -> users.id
FK(old_needle_type_id) -> needle_types.id
FK(exchange_type_id) -> exchange_types.id
FK(new_needle_type_id) -> needle_types.id
FK(confirmation_id) -> confirmations.id
```

Recommended status values:

```text
CREATED
OPERATOR_IDENTIFIED
NEEDLE_SELECTED
EXCHANGE_TYPE_SELECTED
FRAGMENT_CHECK
CONFIRMATION_PENDING
EVIDENCE_CAPTURED
NEW_NEEDLE_SELECTED
NEEDLE_ISSUED
USED_NEEDLE_STORED
COMPLETED
CANCELLED
```

Recommended fragment status:

```text
NOT_REQUIRED
FOUND
NOT_FOUND
PENDING
```

---

# 16. Exchange Idempotency

Recommended unique key:

```text
UNIQUE(device_id, client_transaction_id)
```

Purpose:

```text
same mobile command
        |
        v
multiple retries
        |
        v
one business transaction
```

---

# 17. Physical Table — exchange_evidence

```text
exchange_evidence
```

| Column | Type | Null | Key |
|---|---|---:|---|
| id | UUID | NO | PK |
| exchange_id | UUID | NO | FK |
| evidence_type | VARCHAR(40) | NO | |
| storage_key | VARCHAR(500) | NO | |
| file_name | VARCHAR(255) | YES | |
| mime_type | VARCHAR(100) | NO | |
| file_size | BIGINT | YES | |
| checksum | VARCHAR(128) | YES | |
| captured_at | TIMESTAMP | NO | |
| uploaded_at | TIMESTAMP | YES | |
| uploaded_by | UUID | NO | FK |
| status | VARCHAR(20) | NO | |
| created_at | TIMESTAMP | NO | |

Constraints:

```text
FK(exchange_id) -> exchanges.id
FK(uploaded_by) -> users.id
```

Evidence binary remains outside the relational DB when object storage is used.

---

# 18. Physical Table — confirmations

```text
confirmations
```

| Column | Type | Null | Key |
|---|---|---:|---|
| id | UUID | NO | PK |
| confirmation_number | VARCHAR(50) | NO | UK |
| exchange_id | UUID | NO | FK |
| requested_to_user_id | UUID | NO | FK |
| status | VARCHAR(20) | NO | |
| requested_at | TIMESTAMP | NO | |
| due_at | TIMESTAMP | YES | |
| decided_at | TIMESTAMP | YES | |
| created_at | TIMESTAMP | NO | |
| updated_at | TIMESTAMP | NO | |

Constraints:

```text
UNIQUE(confirmation_number)
FK(exchange_id) -> exchanges.id
FK(requested_to_user_id) -> users.id
```

Recommended:

```text
UNIQUE(exchange_id)
```

if the business rule remains one confirmation record per exchange.

---

# 19. Physical Table — confirmation_decisions

```text
confirmation_decisions
```

| Column | Type | Null | Key |
|---|---|---:|---|
| id | UUID | NO | PK |
| confirmation_id | UUID | NO | FK |
| decision | VARCHAR(20) | NO | |
| decided_by | UUID | NO | FK |
| reason | TEXT | YES | |
| decided_at | TIMESTAMP | NO | |
| created_at | TIMESTAMP | NO | |

Constraints:

```text
FK(confirmation_id) -> confirmations.id
FK(decided_by) -> users.id

CHECK(decision IN ('APPROVED','REJECTED'))
```

Backend must require `reason` when rejected.

---

# 20. Physical Table — inventory_balances

```text
inventory_balances
```

| Column | Type | Null | Key |
|---|---|---:|---|
| id | UUID | NO | PK |
| factory_id | UUID | NO | FK |
| location_id | UUID | NO | FK |
| needle_type_id | UUID | NO | FK |
| quantity | DECIMAL(18,3) | NO | |
| reserved_quantity | DECIMAL(18,3) | NO | |
| updated_at | TIMESTAMP | NO | |

Constraint:

```text
UNIQUE(location_id, needle_type_id)

CHECK(quantity >= 0)
CHECK(reserved_quantity >= 0)
CHECK(reserved_quantity <= quantity)
```

This table is the current balance snapshot.

---

# 21. Physical Table — stock_movements

```text
stock_movements
```

| Column | Type | Null | Key |
|---|---|---:|---|
| id | UUID | NO | PK |
| movement_number | VARCHAR(50) | NO | UK |
| movement_type | VARCHAR(30) | NO | |
| factory_id | UUID | NO | FK |
| source_location_id | UUID | YES | FK |
| destination_location_id | UUID | YES | FK |
| needle_type_id | UUID | NO | FK |
| quantity | DECIMAL(18,3) | NO | |
| reference_type | VARCHAR(40) | NO | |
| reference_id | UUID | NO | |
| reason | TEXT | YES | |
| created_by | UUID | NO | FK |
| created_at | TIMESTAMP | NO | |

Constraints:

```text
UNIQUE(movement_number)

CHECK(quantity > 0)

CHECK(movement_type IN (
  'RECEIVING',
  'ISSUE',
  'TRANSFER_OUT',
  'TRANSFER_IN',
  'RETURN',
  'ADJUSTMENT',
  'REVERSAL'
))
```

Important:

`quantity` menyimpan magnitude positif. Arah movement ditentukan oleh movement type dan source/destination location.

---

# 22. Stock Movement Reference

Examples:

```text
reference_type = EXCHANGE
reference_id   = exchanges.id
```

```text
reference_type = RECEIVING
reference_id   = receiving_transactions.id
```

```text
reference_type = TRANSFER
reference_id   = transfer_transactions.id
```

```text
reference_type = ADJUSTMENT
reference_id   = adjustment_transactions.id
```

Backend wajib memastikan reference valid.

---

# 23. Receiving / Transfer / Return / Adjustment

## receiving_transactions

```text
id
receiving_number
factory_id
destination_location_id
needle_type_id
quantity
reference_document
note
created_by
created_at
```

## transfer_transactions

```text
id
transfer_number
factory_id
source_location_id
destination_location_id
needle_type_id
quantity
status
note
created_by
created_at
completed_at
```

## return_transactions

```text
id
return_number
factory_id
source_location_id
destination_location_id
needle_type_id
quantity
reason
created_by
created_at
```

## adjustment_transactions

```text
id
adjustment_number
factory_id
location_id
needle_type_id
system_quantity
actual_quantity
variance_quantity
reason
status
created_by
approved_by
approved_at
created_at
```

Constraints:

```text
quantity > 0
system_quantity >= 0
actual_quantity >= 0
```

Adjustment formula:

```text
variance_quantity =
actual_quantity - system_quantity
```

---

# 24. Physical Count

## count_sessions

```text
id
count_number
factory_id
location_id
status
counted_by
started_at
completed_at
created_at
```

## count_items

```text
id
count_session_id
needle_type_id
system_quantity
physical_quantity
variance_quantity
created_at
```

Constraint:

```text
UNIQUE(count_session_id, needle_type_id)
```

---

# 25. Identity & Access Tables

## users

```text
id
username
name
email
password_hash
status
last_login_at
created_at
updated_at
```

## roles

```text
id
code
name
description
status
created_at
updated_at
```

## permissions

```text
id
code
name
description
created_at
updated_at
```

## user_roles

```text
user_id
role_id
created_at
```

Constraint:

```text
UNIQUE(user_id, role_id)
```

## role_permissions

```text
role_id
permission_id
created_at
```

Constraint:

```text
UNIQUE(role_id, permission_id)
```

## user_factory_scopes

```text
user_id
factory_id
created_at
```

Constraint:

```text
UNIQUE(user_id, factory_id)
```

## user_location_scopes

```text
user_id
location_id
created_at
```

Constraint:

```text
UNIQUE(user_id, location_id)
```

---

# 26. Notification

## notifications

```text
id
notification_type
channel
recipient_user_id
recipient_reference
exchange_id
confirmation_id
status
provider_message_id
failure_reason
sent_at
delivered_at
created_at
updated_at
```

Recommended channel:

```text
WHATSAPP
```

Recommended status:

```text
NOT_SENT
SENT
DELIVERED
FAILED
```

WhatsApp provider credentials must remain in secret management, not database rows.

---

# 27. Audit

## audit_logs

```text
id
timestamp
actor_user_id
actor_device_id
action
entity_type
entity_id
factory_id
request_id
before_data
after_data
metadata
```

Recommended indexes:

```text
(entity_type, entity_id)
(actor_user_id, timestamp)
(factory_id, timestamp)
```

Audit records should be append-oriented.

---

# 28. Idempotency

## idempotency_keys

```text
id
idempotency_key
actor_user_id
device_id
endpoint
request_hash
response_status
response_body
created_at
expires_at
```

Constraint:

```text
UNIQUE(idempotency_key)
```

The backend must reject the same key with a different request hash.

---

# 29. Mobile Synchronization

## sync_cursors

```text
id
device_id
cursor
last_synced_at
created_at
updated_at
```

## sync_commands

```text
id
device_id
client_transaction_id
command_type
payload
status
result_reference
error_code
created_at
processed_at
```

Status:

```text
QUEUED
PROCESSING
SUCCESS
FAILED
RETRY
```

---

# 30. Physical ERD — Core

```text
┌──────────────┐
│   FACTORIES  │
└──────┬───────┘
       │ 1
       │
       ├──────────────< LOCATIONS
       │                   │
       │                   └──────< INVENTORY_BALANCES
       │
       ├──────────────< TROLLEYS
       │                   │
       │                   ├────< DEVICES
       │                   ├────< STORAGE_MAPPINGS
       │                   │
       │                   └────< EXCHANGES
       │
       └──────────────< EMPLOYEES
                           │
                           └────< RFID_CARDS


NEEDLE_TYPES
     │
     ├────< INVENTORY_BALANCES
     ├────< STOCK_MOVEMENTS
     ├────< EXCHANGES
     └────< COUNT_ITEMS


EXCHANGES
     │
     ├────< EXCHANGE_EVIDENCE
     │
     ├────  CONFIRMATIONS
     │          │
     │          └────< CONFIRMATION_DECISIONS
     │
     ├────< STOCK_MOVEMENTS
     └────< NOTIFICATIONS
```

---

# 31. Physical ERD — Identity

```text
USERS
  |
  +────< USER_ROLES >──── ROLES
  |                         |
  |                         +────< ROLE_PERMISSIONS >──── PERMISSIONS
  |
  +────< USER_FACTORY_SCOPES >──── FACTORIES
  |
  +────< USER_LOCATION_SCOPES >─── LOCATIONS
  |
  +────< AUDIT_LOGS
```

---

# 32. Physical ERD — Inventory

```text
FACTORY
   |
   +-- LOCATION
          |
          +-- INVENTORY_BALANCE
          |
          +-- STOCK_MOVEMENT
          |
          +-- TRANSFER
          |
          +-- RETURN
          |
          +-- ADJUSTMENT

NEEDLE_TYPE
   |
   +-- INVENTORY_BALANCE
   |
   +-- STOCK_MOVEMENT
   |
   +-- EXCHANGE
```

---

# 33. Exchange-to-Inventory Flow

```text
EXCHANGE
   |
   | new_needle_type_id
   v
Validate Inventory
   |
   v
Create ISSUE movement
   |
   v
Decrease inventory_balances
   |
   v
Store used needle
   |
   v
USED_NEEDLE_STORAGE
   |
   v
EXCHANGE = COMPLETED
```

All critical steps must execute in the appropriate transaction boundary.

---

# 34. Broken Needle Confirmation Flow

```text
EXCHANGE
   |
   v
exchange_type = BROKEN
   |
   v
fragment_status = NOT_FOUND
   |
   v
CONFIRMATIONS
   |
   +---- NOTIFICATIONS / WHATSAPP
   |
   v
Supervisor Decision
   |
   +------------+
   |            |
 APPROVED     REJECTED
   |            |
   v            v
Continue      Business
Exchange      Policy
```

The exact rejection behavior remains a business decision from the previous design.

---

# 35. Transaction Boundaries

## 35.1 Create Exchange

```text
BEGIN

Validate user
Validate factory
Validate trolley
Validate device
Validate operator
Validate old needle type
Validate exchange type

INSERT exchange
INSERT audit

COMMIT
```

## 35.2 Issue New Needle

```text
BEGIN

Lock / atomically validate stock
Validate exchange state
Validate new needle type
Validate quantity

INSERT stock movement
UPDATE inventory balance
UPDATE exchange state
INSERT audit

COMMIT
```

## 35.3 Supervisor Approval

```text
BEGIN

Validate confirmation
Validate approver
Validate confirmation state

INSERT confirmation decision
UPDATE confirmation
UPDATE exchange
INSERT audit

COMMIT
```

## 35.4 Transfer

```text
BEGIN

Validate source
Validate destination
Validate stock
Validate same factory/business rule

Create TRANSFER_OUT
Create TRANSFER_IN
Update source balance
Update destination balance
Update transfer state
Audit

COMMIT
```

---

# 36. Stock Consistency Invariants

The following must always hold:

```text
quantity >= 0
reserved_quantity >= 0
reserved_quantity <= quantity
```

For every completed stock operation:

```text
Balance change
=
Corresponding ledger movement
```

No business endpoint may directly edit the balance without ledger creation.

---

# 37. Concurrency Strategy

For stock-affecting commands:

```text
API request
    |
    v
Begin DB transaction
    |
    v
Lock / atomic stock validation
    |
    v
Create movement
    |
    v
Update balance
    |
    v
Commit
```

Example:

```text
Balance = 1

Request A -> issue 1
Request B -> issue 1

Result:
A = SUCCESS
B = REJECTED_INSUFFICIENT_STOCK
```

Negative stock must never be committed.

---

# 38. Index Matrix

| Table | Index |
|---|---|
| factories | code |
| locations | factory_id, code |
| locations | parent_location_id |
| trolleys | factory_id, code |
| devices | device_code |
| devices | serial_number |
| devices | trolley_id |
| employees | employee_number |
| employees | factory_id |
| rfid_cards | rfid_uid |
| needle_types | code |
| exchange_types | code |
| storage_mappings | trolley_id, exchange_type_id |
| exchanges | exchange_number |
| exchanges | device_id, client_transaction_id |
| exchanges | factory_id, created_at |
| exchanges | trolley_id, created_at |
| exchanges | operator_id, created_at |
| exchanges | status |
| exchange_evidence | exchange_id |
| confirmations | exchange_id |
| confirmations | requested_to_user_id, status |
| inventory_balances | location_id, needle_type_id |
| stock_movements | factory_id, created_at |
| stock_movements | needle_type_id, created_at |
| stock_movements | reference_type, reference_id |
| notifications | exchange_id |
| notifications | confirmation_id |
| notifications | status |
| audit_logs | entity_type, entity_id |
| audit_logs | actor_user_id, timestamp |
| audit_logs | factory_id, timestamp |
| idempotency_keys | idempotency_key |
| sync_commands | device_id, status |

Actual index definitions must be validated against production query plans.

---

# 39. Reference Data

Initial:

```text
EXCHANGE_TYPE
--------------
BROKEN
BENT
CHANGEOVER


ROLE
--------------
SYSTEM_ADMIN
PIC_TROLI
PIC_INVENTORY
MANAGEMENT
APPROVER


LOCATION_TYPE
--------------
WAREHOUSE
TROLLEY
USED_NEEDLE_STORAGE


MOVEMENT_TYPE
--------------
RECEIVING
ISSUE
TRANSFER_OUT
TRANSFER_IN
RETURN
ADJUSTMENT
REVERSAL
```

Operational master data:

```text
Factory
Trolley
Employee
RFID
Needle Type
```

should be maintained through WebApp, not hard-coded into application logic.

---

# 40. Recommended Migration Order

```text
V001 factories
V002 locations
V003 trolleys
V004 users
V005 roles
V006 permissions
V007 user_roles
V008 role_permissions
V009 user_factory_scopes
V010 user_location_scopes
V011 devices
V012 employees
V013 rfid_cards
V014 needle_types
V015 exchange_types
V016 storage_mappings
V017 exchanges
V018 exchange_evidence
V019 confirmations
V020 confirmation_decisions
V021 inventory_balances
V022 stock_movements
V023 receiving_transactions
V024 transfer_transactions
V025 return_transactions
V026 adjustment_transactions
V027 count_sessions
V028 count_items
V029 notifications
V030 audit_logs
V031 idempotency_keys
V032 sync_cursors
V033 sync_commands
```

Migration names may be adapted to the selected migration framework.

---

# 41. Trigger Requirements

Triggers are not mandatory for every table.

Potential database-level triggers:

```text
1. Prevent negative inventory.
2. Prevent invalid balance transitions.
3. Protect immutable finalized transactions.
4. Maintain updated_at where appropriate.
5. Prevent deletion of referenced historical master data.
```

Business workflow should remain primarily in the backend service layer.

Do not place the entire business workflow inside database triggers.

---

# 42. Immutable Transaction Policy

Once:

```text
exchange.status = COMPLETED
```

the exchange should not be edited directly.

Correction should use:

```text
Correction
Void
Reversal
Audited Adjustment
```

depending on approved business policy.

Likewise, stock movement ledger records should be append-oriented.

---

# 43. Deletion Policy

## Hard Delete Allowed

Potentially only for:

```text
Temporary sync records
Expired idempotency records
Non-referenced technical records
```

and only according to retention policy.

## Hard Delete Prohibited

For historical:

```text
Exchange
Stock Movement
Confirmation
Confirmation Decision
Audit Log
Receiving
Transfer
Return
Adjustment
```

Master data with historical references should use:

```text
status = INACTIVE
```

---

# 44. Security Controls

Database:

```text
Backend-only access
Least privilege
Encrypted connection
Secret-managed credentials
Backup protection
Audit access
```

Sensitive values such as:

```text
password
WhatsApp provider credentials
API tokens
integration secrets
```

must not be stored as plaintext.

---

# 45. Backup & Recovery

Physical implementation must support:

```text
Automated Backup
Point-in-Time Recovery
Backup Verification
Restore Test
Disaster Recovery
```

Exact:

```text
RPO
RTO
Retention
Backup frequency
```

remain open decisions.

---

# 46. Reporting Read Model

Initial:

```text
Database
   |
   v
Backend Reporting API
```

Future scale:

```text
Transactional Database
        |
        v
Read Replica / Reporting Database
        |
        v
Analytics
```

The architecture must not assume analytics queries are allowed to freely scan large transactional tables in production.

---

# 47. DDL Baseline

The following is a structural example. Exact syntax must be adapted to the selected DBMS.

```sql
CREATE TABLE factories (
    id UUID PRIMARY KEY,
    code VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(150) NOT NULL,
    description TEXT,
    timezone VARCHAR(100) NOT NULL,
    status VARCHAR(20) NOT NULL,
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP NOT NULL
);

CREATE TABLE locations (
    id UUID PRIMARY KEY,
    factory_id UUID NOT NULL,
    parent_location_id UUID,
    code VARCHAR(50) NOT NULL,
    name VARCHAR(150) NOT NULL,
    location_type VARCHAR(30) NOT NULL,
    status VARCHAR(20) NOT NULL,
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP NOT NULL,

    CONSTRAINT fk_locations_factory
        FOREIGN KEY (factory_id) REFERENCES factories(id),

    CONSTRAINT fk_locations_parent
        FOREIGN KEY (parent_location_id) REFERENCES locations(id),

    CONSTRAINT uq_locations_factory_code
        UNIQUE (factory_id, code)
);

CREATE TABLE trolleys (
    id UUID PRIMARY KEY,
    factory_id UUID NOT NULL,
    location_id UUID NOT NULL,
    code VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(150) NOT NULL,
    status VARCHAR(20) NOT NULL,
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP NOT NULL,

    CONSTRAINT fk_trolleys_factory
        FOREIGN KEY (factory_id) REFERENCES factories(id),

    CONSTRAINT fk_trolleys_location
        FOREIGN KEY (location_id) REFERENCES locations(id),

    CONSTRAINT uq_trolleys_location
        UNIQUE (location_id)
);

CREATE TABLE needle_types (
    id UUID PRIMARY KEY,
    code VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(150) NOT NULL,
    category VARCHAR(100),
    unit VARCHAR(20) NOT NULL,
    minimum_stock DECIMAL(18,3) NOT NULL,
    description TEXT,
    status VARCHAR(20) NOT NULL,
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP NOT NULL
);

CREATE TABLE inventory_balances (
    id UUID PRIMARY KEY,
    factory_id UUID NOT NULL,
    location_id UUID NOT NULL,
    needle_type_id UUID NOT NULL,
    quantity DECIMAL(18,3) NOT NULL,
    reserved_quantity DECIMAL(18,3) NOT NULL DEFAULT 0,
    updated_at TIMESTAMP NOT NULL,

    CONSTRAINT fk_inventory_factory
        FOREIGN KEY (factory_id) REFERENCES factories(id),

    CONSTRAINT fk_inventory_location
        FOREIGN KEY (location_id) REFERENCES locations(id),

    CONSTRAINT fk_inventory_needle
        FOREIGN KEY (needle_type_id) REFERENCES needle_types(id),

    CONSTRAINT uq_inventory_location_needle
        UNIQUE (location_id, needle_type_id),

    CONSTRAINT chk_inventory_quantity
        CHECK (quantity >= 0),

    CONSTRAINT chk_inventory_reserved
        CHECK (reserved_quantity >= 0),

    CONSTRAINT chk_inventory_reserved_limit
        CHECK (reserved_quantity <= quantity)
);
```

The complete DDL should be generated only after the DBMS is formally selected.

---

# 48. Database Acceptance Criteria

## Factory / Trolley

Given:

```text
Factory A
Trolley A-01
Trolley A-02
Trolley A-03
```

all three trolley locations must have independent stock balances.

## Exchange

An exchange must have:

```text
Factory
Trolley
Device
Operator
PIC
Old Needle Type
Exchange Type
Status
```

before completion.

## Broken

If:

```text
Exchange Type = BROKEN
Fragment = NOT_FOUND
```

then:

```text
Confirmation = PENDING
```

must exist before the exchange can continue to the approved flow.

## Stock Issue

Given:

```text
Trolley Stock = 10
```

and issue:

```text
1
```

then:

```text
Balance = 9
Movement = ISSUE 1
```

must be committed consistently.

## Idempotency

Same:

```text
device_id
client_transaction_id
```

must not create duplicate business effects.

---

# 49. Open Decisions Before Physical Implementation

The following are intentionally not silently decided:

1. Exact DBMS.
2. Exact DB version.
3. UUID implementation.
4. Migration framework.
5. ORM/query framework.
6. JSON column support.
7. Enum strategy.
8. Partitioning.
9. Read replica.
10. Backup/RPO/RTO.
11. Data retention.
12. Object storage provider.
13. Database encryption implementation.
14. HA topology.
15. Final adjustment approval workflow.
16. Final transfer approval workflow.
17. Missing-fragment rejection behavior.
18. Final storage-compartment model.

---

# 50. Definition of Done

This document is ready for implementation when:

- [ ] DBMS selected.
- [ ] Physical ERD approved.
- [ ] All PK/FK reviewed.
- [ ] Unique constraints approved.
- [ ] Check constraints approved.
- [ ] Index strategy reviewed.
- [ ] Stock transaction boundaries approved.
- [ ] Concurrency strategy approved.
- [ ] Migration strategy approved.
- [ ] Retention policy approved.
- [ ] Backup/RPO/RTO approved.
- [ ] Object storage strategy approved.
- [ ] DDL generated for selected DBMS.
- [ ] Migration scripts tested.
- [ ] Seed/reference data prepared.
- [ ] Database integration tests prepared.
- [ ] Performance test plan prepared.

---

# 51. Next Artifact

After this physical schema baseline:

```text
12 — UI/UX Specification / Wireframe
```

or, if the team wants to finish backend contracts first:

```text
12 — OpenAPI / Swagger Specification
```

Recommended technical sequence:

```text
10 Database Design
        ↓
11 Database ERD & Physical Schema
        ↓
12 OpenAPI / Swagger
        ↓
13 RFID Integration
        ↓
14 WhatsApp Integration
        ↓
15 Offline Sync Design
        ↓
16 Security Design
        ↓
17 Mobile UI/UX
        ↓
18 WebApp UI/UX
        ↓
19 Test Strategy & UAT
        ↓
20 Deployment Architecture
```

**End of Database ERD & Physical Schema**

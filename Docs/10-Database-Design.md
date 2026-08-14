# 10 — Database Design
# Needle Management System

**Version:** 1.0  
**Status:** Draft / Development Baseline  
**Database Role:** Central transactional data store  
**References:** PRD, Business Process, Use Case, Functional Requirements, System Architecture, Application Architecture, SRS Mobile Android, SRS WebApps, API Specification

---

# 1. Purpose

Dokumen ini mendefinisikan rancangan database untuk **Needle Management System**.

Database harus mendukung dua application module:

```text
Flutter Android Tablet
        |
        v
   Central Backend
        |
        v
WebApps
```

Database menjadi **central source of truth** untuk transactional data dan master data. Mobile dan WebApps tidak melakukan direct database access.

---

# 2. Database Design Principles

## 2.1 Centralized Transactional Database

Data utama:

```text
Exchange
Inventory
Confirmation
Approval
Notification
Audit
Master Data
User Access
Synchronization
```

## 2.2 Stock Is Ledger-Based

Model:

```text
Stock Balance
      +
Stock Movement Ledger
      =
Inventory State
```

Setiap perubahan stock harus mempunyai stock movement.

## 2.3 Historical Data Must Be Preserved

Master data yang sudah direferensikan oleh transaksi tidak boleh hard delete. Gunakan:

```text
ACTIVE
INACTIVE
```

## 2.4 Factory and Trolley Are Dynamic

Database harus mendukung:

```text
Factory 1 -> N Trolley
```

Jumlah trolley tidak boleh hard-code menjadi 3.

---

# 3. Logical Domains

```text
Database
|
+-- Identity & Access
|   +-- users
|   +-- roles
|   +-- permissions
|   +-- user_roles
|   +-- role_permissions
|   +-- user_factory_scopes
|   +-- user_location_scopes
|
+-- Organization & Device
|   +-- factories
|   +-- locations
|   +-- trolleys
|   +-- devices
|
+-- Employee & RFID
|   +-- employees
|   +-- rfid_cards
|
+-- Needle Master
|   +-- needle_types
|   +-- exchange_types
|   +-- storage_mappings
|
+-- Exchange
|   +-- exchanges
|   +-- exchange_evidence
|   +-- confirmations
|   +-- confirmation_decisions
|
+-- Inventory
|   +-- inventory_balances
|   +-- stock_movements
|   +-- receiving_transactions
|   +-- transfer_transactions
|   +-- return_transactions
|   +-- adjustment_transactions
|   +-- count_sessions
|   +-- count_items
|
+-- Notification
|   +-- notifications
|
+-- Audit & Integration
    +-- audit_logs
    +-- idempotency_keys
    +-- sync_cursors
    +-- sync_commands
```

---

# 4. Naming Convention

Tables menggunakan:

```text
snake_case
plural
```

Primary key:

```text
id
```

Foreign key:

```text
<entity>_id
```

Timestamp:

```text
created_at
updated_at
deleted_at
```

Recommended backend timestamp: UTC.

---

# 5. Organization

## 5.1 factories

| Column | Type | Notes |
|---|---|---|
| id | UUID | PK |
| code | VARCHAR | Unique |
| name | VARCHAR | |
| description | TEXT | Optional |
| timezone | VARCHAR | |
| status | VARCHAR | ACTIVE/INACTIVE |
| created_at | TIMESTAMP | |
| updated_at | TIMESTAMP | |

Constraint:

```text
UNIQUE(code)
```

## 5.2 locations

Location types:

```text
WAREHOUSE
TROLLEY
USED_NEEDLE_STORAGE
```

Fields:

```text
id
factory_id
parent_location_id
code
name
location_type
status
created_at
updated_at
```

Relationship:

```text
Factory 1 --- N Location
Location 1 --- N Child Location
```

## 5.3 trolleys

Fields:

```text
id
factory_id
location_id
code
name
status
created_at
updated_at
```

Relationship:

```text
Factory 1 --- N Trolley
```

## 5.4 devices

Android Tablet:

```text
id
device_code
device_name
serial_number
factory_id
trolley_id
status
app_version
last_seen_at
created_at
updated_at
```

Status:

```text
ACTIVE
INACTIVE
REVOKED
```

---

# 6. Employee & RFID

## 6.1 employees

```text
id
employee_number
name
department
factory_id
status
created_at
updated_at
```

`employee_number` harus unique.

## 6.2 rfid_cards

```text
id
rfid_uid
employee_id
status
issued_at
revoked_at
created_at
updated_at
```

Relationship:

```text
Employee 1 --- N RFID Card
```

---

# 7. Needle Master

## 7.1 needle_types

```text
id
code
name
category
unit
minimum_stock
description
status
created_at
updated_at
```

Needle Type digunakan pada:

```text
Exchange
Inventory
Receiving
Transfer
Return
Adjustment
Reporting
Analytics
```

## 7.2 exchange_types

Initial values:

```text
BROKEN
BENT
CHANGEOVER
```

Fields:

```text
id
code
name
description
requires_fragment_validation
status
created_at
updated_at
```

## 7.3 storage_mappings

Mapping type penukaran dengan lubang/storage jarum bekas.

```text
id
trolley_id
exchange_type_id
storage_location_id
status
created_at
updated_at
```

Constraint:

```text
UNIQUE(trolley_id, exchange_type_id)
```

---

# 8. Exchange Transaction

## 8.1 exchanges

Core transaction:

```text
id
exchange_number
client_transaction_id
factory_id
trolley_id
device_id
operator_id
pic_user_id
old_needle_type_id
exchange_type_id
new_needle_type_id
fragment_status
confirmation_id
status
created_at
updated_at
completed_at
cancelled_at
```

Constraints:

```text
UNIQUE(exchange_number)
```

Recommended:

```text
UNIQUE(device_id, client_transaction_id)
```

## 8.2 Exchange State

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

Backend state machine adalah authoritative.

---

# 9. Exchange Evidence

## exchange_evidence

```text
id
exchange_id
evidence_type
storage_key
file_name
mime_type
file_size
checksum
captured_at
uploaded_at
uploaded_by
status
created_at
```

Actual image sebaiknya berada di object storage. Database menyimpan metadata/reference.

Evidence types:

```text
OLD_NEEDLE
BROKEN_FRAGMENT
OTHER
```

---

# 10. Broken Needle Confirmation

## confirmations

```text
id
confirmation_number
exchange_id
requested_to_user_id
status
requested_at
due_at
decided_at
created_at
updated_at
```

Status:

```text
PENDING
APPROVED
REJECTED
EXPIRED
```

## confirmation_decisions

```text
id
confirmation_id
decision
decided_by
reason
decided_at
created_at
```

Rejection reason wajib diisi.

---

# 11. Inventory

## 11.1 inventory_balances

Current stock snapshot:

```text
id
factory_id
location_id
needle_type_id
quantity
reserved_quantity
updated_at
```

Constraint:

```text
UNIQUE(location_id, needle_type_id)
```

Available:

```text
available_quantity =
quantity - reserved_quantity
```

Jika reservation belum diterapkan, `reserved_quantity = 0`.

## 11.2 stock_movements

Ledger utama:

```text
id
movement_number
movement_type
factory_id
source_location_id
destination_location_id
needle_type_id
quantity
reference_type
reference_id
reason
created_by
created_at
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

Stock balance tidak boleh berubah tanpa movement.

---

# 12. Inventory Transactions

## 12.1 receiving_transactions

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

## 12.2 transfer_transactions

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

Transfer:

```text
TRANSFER_OUT
TRANSFER_IN
```

## 12.3 return_transactions

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

## 12.4 adjustment_transactions

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

Formula:

```text
variance_quantity =
actual_quantity - system_quantity
```

---

# 13. Physical Count

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

# 14. Notification

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

Channel:

```text
WHATSAPP
```

Status:

```text
NOT_SENT
SENT
DELIVERED
FAILED
```

Provider credentials tidak disimpan di table.

---

# 15. Identity & Access

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

Jika SSO/OIDC digunakan, authentication fields dapat disesuaikan.

## roles

Initial:

```text
SYSTEM_ADMIN
PIC_TROLI
PIC_INVENTORY
MANAGEMENT
APPROVER
```

## permissions

Contoh:

```text
DASHBOARD_VIEW
EXCHANGE_VIEW
EXCHANGE_CREATE
CONFIRMATION_VIEW
CONFIRMATION_APPROVE
CONFIRMATION_REJECT
STOCK_VIEW
STOCK_RECEIVE
STOCK_TRANSFER
STOCK_RETURN
STOCK_ADJUST
STOCK_COUNT
MASTER_VIEW
MASTER_EDIT
USER_MANAGE
DEVICE_MANAGE
REPORT_VIEW
REPORT_EXPORT
AUDIT_VIEW
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

---

# 16. Authorization Scope

## user_factory_scopes

```text
user_id
factory_id
created_at
```

## user_location_scopes

```text
user_id
location_id
created_at
```

Authorization model:

```text
Role
+
Permission
+
Factory Scope
+
Location Scope
```

User yang hanya mempunyai Factory A scope tidak boleh mengakses Factory B.

---

# 17. Audit

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

Critical actions:

```text
EXCHANGE_CREATED
NEEDLE_ISSUED
CONFIRMATION_APPROVED
CONFIRMATION_REJECTED
STOCK_TRANSFERRED
STOCK_ADJUSTED
MASTER_DATA_UPDATED
DEVICE_REVOKED
USER_PERMISSION_CHANGED
```

---

# 18. Idempotency & Synchronization

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

Critical commands:

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

# 19. Core Relationships

```text
FACTORY
 ├──< TROLLEY
 │     ├──< DEVICE
 │     └──< STORAGE_MAPPING >── EXCHANGE_TYPE
 │
 ├──< LOCATION
 └──< EMPLOYEE
       └──< RFID_CARD


NEEDLE_TYPE
 ├──< EXCHANGE
 ├──< INVENTORY_BALANCE >── LOCATION
 ├──< STOCK_MOVEMENT
 └──< COUNT_ITEM


EXCHANGE
 ├──< EXCHANGE_EVIDENCE
 ├──── CONFIRMATION
 │       └──< CONFIRMATION_DECISION
 ├──< STOCK_MOVEMENT
 ├──< NOTIFICATION
 └──< AUDIT_LOG


USER
 ├──< USER_ROLE >── ROLE >──< ROLE_PERMISSION >── PERMISSION
 ├──< USER_FACTORY_SCOPE >── FACTORY
 ├──< USER_LOCATION_SCOPE >── LOCATION
 └──< AUDIT_LOG
```

---

# 20. End-to-End Exchange Data Flow

```text
RFID
 |
 v
employees
 |
 v
exchanges
 |
 +--> exchange_evidence
 |
 +--> confirmations
 |       |
 |       +--> confirmation_decisions
 |
 +--> stock_movements
 |       |
 |       v
 |   inventory_balances
 |
 +--> notifications
 |
 +--> audit_logs
```

---

# 21. Broken Needle Case

Normal:

```text
BROKEN
   |
Fragment FOUND
   |
Evidence
   |
New Needle Issue
   |
Used Needle Storage
   |
COMPLETED
```

Missing fragment:

```text
BROKEN
   |
Fragment NOT_FOUND
   |
Confirmation PENDING
   |
WhatsApp Notification
   |
Supervisor
   |
APPROVED
   |
Continue
```

Jika REJECTED, behavior final mengikuti business policy yang masih menjadi open decision.

---

# 22. Transaction Integrity

Critical operation menggunakan database transaction.

Contoh issue:

```text
BEGIN TRANSACTION

Validate exchange
Validate stock
Validate permission
Validate state

Create stock movement
Update inventory balance
Update exchange
Create audit log

COMMIT
```

Failure:

```text
ROLLBACK
```

Tidak boleh terjadi:

```text
Stock berkurang tetapi Exchange gagal
```

atau:

```text
Exchange completed tetapi Stock Movement tidak ada
```

---

# 23. Concurrency Control

Stock issue dan transfer harus aman terhadap concurrent requests.

Recommended:

```text
Database transaction
+
Row-level locking / atomic update
+
Idempotency
```

Contoh:

```text
Stock = 1

Request A -> Issue 1
Request B -> Issue 1
```

Hanya satu request boleh berhasil.

Negative stock selalu dilarang.

---

# 24. Index Strategy

Minimum:

```text
factories(code)

trolleys(factory_id, code)

devices(device_code)
devices(serial_number)
devices(trolley_id)

employees(employee_number)
employees(factory_id)

rfid_cards(rfid_uid)

needle_types(code)

exchanges(exchange_number)
exchanges(client_transaction_id)
exchanges(factory_id, created_at)
exchanges(trolley_id, created_at)
exchanges(operator_id, created_at)
exchanges(status)

exchange_evidence(exchange_id)

confirmations(exchange_id)
confirmations(status)
confirmations(requested_to_user_id)

inventory_balances(location_id, needle_type_id)

stock_movements(factory_id, created_at)
stock_movements(needle_type_id, created_at)
stock_movements(reference_type, reference_id)

notifications(exchange_id)
notifications(confirmation_id)
notifications(status)

audit_logs(actor_user_id, timestamp)
audit_logs(entity_type, entity_id)
audit_logs(factory_id, timestamp)

idempotency_keys(idempotency_key)
sync_commands(device_id, status)
```

Index final harus divalidasi menggunakan actual query plan setelah implementation.

---

# 25. Critical Business Constraints

```text
1. No negative stock.
2. Active factory required for transaction.
3. Active trolley required for mobile transaction.
4. Active needle type required.
5. Active operator required.
6. Valid exchange type required.
7. Broken needle missing fragment requires confirmation.
8. New needle issue requires sufficient stock.
9. Used needle storage must match exchange mapping.
10. Completed exchange cannot be modified directly.
11. Critical stock operations require idempotency.
12. Historical master data cannot be hard deleted.
13. Unauthorized factory/location access is rejected.
14. Stock balance change requires stock movement.
15. Critical business actions require audit log.
```

---

# 26. Database Migration

Schema harus dikelola melalui versioned migration.

Contoh:

```text
V001__create_factories
V002__create_locations
V003__create_trolleys
V004__create_users_roles_permissions
V005__create_employees_rfid
V006__create_needle_master
V007__create_exchange
V008__create_inventory
V009__create_confirmation
V010__create_notification
V011__create_audit
V012__create_sync
```

Migration production harus tercatat dan versioned.

---

# 27. Seed Data

Initial reference data:

```text
Exchange Types:
BROKEN
BENT
CHANGEOVER

Roles:
SYSTEM_ADMIN
PIC_TROLI
PIC_INVENTORY
MANAGEMENT
APPROVER

Location Types:
WAREHOUSE
TROLLEY
USED_NEEDLE_STORAGE

Movement Types:
RECEIVING
ISSUE
TRANSFER_OUT
TRANSFER_IN
RETURN
ADJUSTMENT
REVERSAL
```

Factory, trolley, employee, RFID, dan needle type merupakan operational master data.

---

# 28. Security

Database hanya dapat diakses oleh backend.

```text
Flutter -> HTTPS API -> Backend -> Database
WebApp  -> HTTPS API -> Backend -> Database
```

Database credentials berada pada server environment dan menggunakan least privilege.

---

# 29. Reporting & Analytics

Phase awal:

```text
Transactional DB
       |
       v
Backend Reporting API
```

Jika volume meningkat:

```text
Transactional DB
       |
       v
Read Model / Reporting DB / Data Warehouse
       |
       v
Analytics
```

Heavy analytics query tidak boleh membebani primary transactional database tanpa evaluasi performance.

---

# 30. Recommended Logical ERD

```text
FACTORY
 ├──< TROLLEY
 │     ├──< DEVICE
 │     └──< STORAGE_MAPPING >── EXCHANGE_TYPE
 │
 ├──< LOCATION
 └──< EMPLOYEE
       └──< RFID_CARD

NEEDLE_TYPE
 ├──< EXCHANGE
 ├──< INVENTORY_BALANCE >── LOCATION
 ├──< STOCK_MOVEMENT
 └──< COUNT_ITEM

EXCHANGE
 ├──< EXCHANGE_EVIDENCE
 ├──── CONFIRMATION
 │       └──< CONFIRMATION_DECISION
 ├──< STOCK_MOVEMENT
 ├──< NOTIFICATION
 └──< AUDIT_LOG

USER
 ├──< USER_ROLE >── ROLE >──< ROLE_PERMISSION >── PERMISSION
 ├──< USER_FACTORY_SCOPE >── FACTORY
 ├──< USER_LOCATION_SCOPE >── LOCATION
 └──< AUDIT_LOG
```

---

# 31. Example Stock Ledger

```text
Receiving
---------
RECEIVING +1000
Balance = 1000

Exchange
--------
ISSUE -1
Balance = 999

Transfer
--------
TRANSFER_OUT -100
TRANSFER_IN  +100
```

Setiap movement harus dapat ditelusuri ke source transaction.

---

# 32. Open Database Decisions

Hal yang belum ditentukan oleh dokumen sebelumnya:

1. Exact DBMS.
2. ORM/query technology.
3. UUID generation strategy.
4. Enum implementation.
5. RPO/RTO.
6. Data retention.
7. Object storage provider.
8. Image compression/thumbnail strategy.
9. Inventory balance materialization strategy.
10. Reserved stock requirement.
11. Adjustment approval workflow.
12. Transfer approval workflow.
13. Missing-fragment rejection behavior.
14. Reporting read replica/data warehouse.
15. Partitioning strategy.
16. Encryption-at-rest implementation.
17. Database HA topology.

Tidak mengunci keputusan tersebut tanpa business/technical decision.

---

# 33. Definition of Done

Database Design ready untuk detailed implementation apabila:

- [ ] Core entities approved.
- [ ] Relationships approved.
- [ ] Exchange state model approved.
- [ ] Inventory ledger approved.
- [ ] Stock consistency rules approved.
- [ ] Factory/Trolley model approved.
- [ ] Confirmation model approved.
- [ ] Notification model approved.
- [ ] User/Role/Permission model approved.
- [ ] Factory/Location scope approved.
- [ ] Audit model approved.
- [ ] Idempotency model approved.
- [ ] Sync model approved.
- [ ] Index strategy reviewed.
- [ ] Migration strategy approved.
- [ ] Retention policy approved.
- [ ] DBMS selected.
- [ ] Physical ERD generated.
- [ ] DDL reviewed.
- [ ] Database integration tests prepared.

---

# 34. Next Artifact

Setelah logical database design:

```text
11 — Database ERD & Physical Schema
```

Dokumen tersebut akan menurunkan design ini menjadi:

```text
Physical ERD
Table DDL
PK / FK
Indexes
Unique Constraints
Check Constraints
Reference / Enum Tables
Trigger Requirements
Transaction Boundaries
Migration Structure
Seed Data
```

**End of Database Design**

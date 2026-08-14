# Functional Requirements Specification (FRS)
# Needle Management System

**Document:** 04 — Functional Requirements  
**Version:** 1.0  
**Status:** Draft / Architecture Baseline  
**Role:** Senior Lead Architect & System Analyst  
**Reference:** `01-PRD.md`, `02-Business-Process.md`, `03-Use-Case.md`, `Needle Management System PRD v2.0`

---

## 1. Purpose

Dokumen ini menerjemahkan PRD, Business Process, dan Use Case menjadi functional requirements sebagai baseline untuk:

- Flutter Android Tablet — Troli System.
- WebApp — Needle Management, Inventory, Admin, Approval, Dashboard.
- Central Backend/API.
- Database dan Object Storage.
- RFID, Camera, Offline Sync, dan WhatsApp Notification.
- QA, SIT, UAT, dan acceptance testing.

Dokumen ini menjadi **single functional baseline** sebelum requirement dipecah menjadi Mobile SRS, WebApp SRS, API Specification, Database Design, UI/UX Specification, dan Test Specification.

---

## 2. Product Scope

Needle Management System mengelola:

```text
Needle Inventory
      |
      v
Main Warehouse
      |
      v
Trolley / Mobile Warehouse
      |
      v
Needle Exchange
      |
      +-- Operator
      +-- PIC Troli
      +-- Old Needle
      +-- Exchange Type
      +-- Photo
      +-- Broken Fragment
      +-- Confirmation
      +-- New Needle
      +-- Used Needle Storage
      |
      v
Stock Movement
      |
      v
Analytics / Reporting / Audit
```

Initial deployment:

```text
Factory
 |
 +-- Main Warehouse
 +-- Trolley 01
 +-- Trolley 02
 +-- Trolley 03
```

Setiap trolley merupakan **Mobile Stock Location / Mobile Warehouse**.

---

## 3. Functional Modules

### 3.1 Troli System Android

Platform: Flutter Android Tablet.

Primary user: PIC Troli.

Functions:
- Login.
- Device/Trolley context.
- RFID operator identification.
- Needle exchange.
- Broken needle validation.
- Confirmation request.
- Photo evidence.
- New needle selection.
- Stock validation.
- Needle issue.
- Used needle storage.
- Exchange history.
- Trolley stock.
- Offline transaction.
- Synchronization.
- Sync status.

### 3.2 Needle Management WebApp

Users:
- System Admin.
- PIC Inventory.
- Management.
- Authorized Approver.

Functions:
- Master data.
- User & role.
- Device management.
- Trolley management.
- Inventory.
- Receiving.
- Transfer.
- Return.
- Adjustment.
- Physical count.
- Replenishment.
- Stock movement.
- Confirmation/approval.
- Dashboard.
- Analytics.
- Reporting.
- Audit trail.

### 3.3 Central Backend

Backend adalah **Single Source of Truth**.

Functions:
- Authentication.
- Authorization.
- Business rules.
- Transaction processing.
- Inventory calculation.
- Stock movement.
- Confirmation workflow.
- Notification orchestration.
- Photo metadata.
- Offline sync validation.
- Audit trail.
- Reporting API.

---

# 4. Requirement Priority

| Priority | Meaning |
|---|---|
| P0 | Mandatory / Core Transaction |
| P1 | Mandatory for MVP |
| P2 | Important / Phase 2 |
| P3 | Future Enhancement |

Requirement ID menggunakan domain:

```text
FR-AUTH
FR-DEVICE
FR-OPR
FR-EXC
FR-BROKEN
FR-APPROVAL
FR-NOTIF
FR-PHOTO
FR-ISSUE
FR-STORAGE
FR-INV
FR-STOCK
FR-MASTER
FR-DASH
FR-REPORT
FR-AUDIT
FR-OFFLINE
FR-SYNC
FR-SEC
FR-INT
```

---

# 5. Authentication & Authorization

## FR-AUTH-001 — User Login
**Priority:** P0

System shall authenticate:
- PIC Troli.
- PIC Inventory.
- System Admin.
- Management.
- Authorized Approver.

Valid credentials allow access; invalid or inactive users are rejected.

## FR-AUTH-002 — Role-Based Access Control
**Priority:** P0

System shall enforce permissions based on role:

```text
SYSTEM_ADMIN
PIC_TROLI
PIC_INVENTORY
MANAGEMENT
APPROVER
```

Authorization must be enforced by backend.

## FR-AUTH-003 — Scope-Based Authorization
**Priority:** P1

Authorization shall support:

```text
Role
+
Factory Scope
+
Location Scope
+
Action Permission
```

Example: PIC Inventory Factory A must not automatically manage Factory B.

---

# 6. Device & Trolley Context

## FR-DEVICE-001 — Device Registration
**Priority:** P0

System Admin shall register Android Tablet with:
- Device ID.
- Device Name.
- Platform.
- App Version.
- Status.

## FR-DEVICE-002 — Device-Trolley Binding
**Priority:** P0

A device shall be assigned to one active Factory/Trolley context.

Example:

```text
Device: NM-TAB-001
Factory: Factory A
Trolley: A-01
```

## FR-DEVICE-003 — Device Validation
**Priority:** P0

Backend shall reject:

```text
DEVICE_NOT_REGISTERED
DEVICE_INACTIVE
CONTEXT_MISMATCH
TROLLEY_INACTIVE
```

## FR-DEVICE-004 — Automatic Context
**Priority:** P0

After PIC login, system automatically determines:

```text
PIC + Device + Factory + Trolley
```

PIC does not select trolley for every exchange.

---

# 7. Operator Identification

## FR-OPR-001 — RFID Scan
**Priority:** P0

Android shall identify Operator Sewing through RFID.

## FR-OPR-002 — Employee Lookup
**Priority:** P0

RFID shall map to Employee Master and display:
- Employee ID.
- Name.
- Department/Section/Line where available.
- Status.

## FR-OPR-003 — Invalid RFID
**Priority:** P0

Unknown or inactive employee blocks transaction.

## FR-OPR-004 — Offline Employee Lookup
**Priority:** P1

Cached Employee Master may be used offline. Backend validates again during sync.

---

# 8. Needle Exchange

## FR-EXC-001 — Create Exchange
**Priority:** P0

PIC Troli shall create an exchange with unique:

```text
Exchange ID
Client Transaction ID
```

Initial state: `DRAFT`.

## FR-EXC-002 — Exchange Context
**Priority:** P0

Every exchange contains:

```text
Factory
Trolley
Device
PIC Troli
Operator
Created At
```

## FR-EXC-003 — Old Needle Type
**Priority:** P0

Old Needle Type must come from active Needle Master.

## FR-EXC-004 — Exchange Type
**Priority:** P0

Supported:

```text
BROKEN
BENT
CHANGEOVER
```

## FR-EXC-005 — New Needle Type
**Priority:** P0

Rules:

```text
BROKEN/BENT:
New Type = Old Type
```

unless authorized override is configured.

```text
CHANGEOVER:
New Type may differ from Old Type
```

## FR-EXC-006 — Mandatory Completion Data
**Priority:** P0

Before completion, system validates:
- Operator.
- Old Needle Type.
- Exchange Type.
- Fragment status when BROKEN.
- Required photo.
- New Needle Type.
- Stock validation.
- Confirmation when required.
- Needle issue.
- Used needle storage.

---

# 9. Broken Needle Management

## FR-BROKEN-001 — Fragment Validation
**Priority:** P0

When Exchange Type = BROKEN, PIC must select:

```text
FRAGMENT_FOUND
FRAGMENT_NOT_FOUND
```

## FR-BROKEN-002 — Fragment Found
**Priority:** P0

Transaction can continue after fragment is found and required evidence is captured.

## FR-BROKEN-003 — Fragment Not Found
**Priority:** P0

System changes transaction to:

```text
WAITING_CONFIRMATION
```

Replacement issuance remains blocked until authorized approval.

## FR-BROKEN-004 — Confirmation Data
System stores:

```text
Confirmation ID
Exchange ID
Factory
Trolley
Operator
Old Needle Type
Exchange Type
Fragment Status
PIC Troli
Created At
Reason
Status
```

---

# 10. Confirmation & Approval

## FR-APPROVAL-001 — Create Confirmation
**Priority:** P0

Broken needle without fragment automatically creates a confirmation request.

## FR-APPROVAL-002 — Authorized Approver
**Priority:** P0

Only authorized approvers may approve/reject.

## FR-APPROVAL-003 — Approval Status
Supported:

```text
WAITING
APPROVED
REJECTED
EXPIRED
CANCELLED
```

## FR-APPROVAL-004 — Secure Approval
**Priority:** P0

Approval must occur through authenticated secure system page.

WhatsApp is notification only.

## FR-APPROVAL-005 — Approval Result
Approved → exchange may continue.

Rejected → exchange remains blocked according to policy.

## FR-APPROVAL-006 — Confirmation Expiry
**Priority:** P1

Pending confirmation shall expire after configured threshold.

---

# 11. WhatsApp Notification

## FR-NOTIF-001 — Notification Trigger
**Priority:** P0

Confirmation creation triggers notification.

## FR-NOTIF-002 — Notification Content
Minimum:

```text
Confirmation ID
Factory
Trolley
Operator
Old Needle
Exchange Type
Fragment Status
PIC Troli
Time
Secure Approval Link
```

## FR-NOTIF-003 — Delivery Tracking
Supported:

```text
QUEUED
SENT
DELIVERED
FAILED
RETRYING
```

## FR-NOTIF-004 — Notification Boundary
WhatsApp shall never directly modify transaction or inventory data.

---

# 12. Photo Evidence

## FR-PHOTO-001 — Capture Photo
**Priority:** P0

PIC shall capture old needle evidence using tablet camera.

## FR-PHOTO-002 — Photo Metadata
Minimum:

```text
Photo ID
Transaction ID
Factory
Trolley
PIC
Device ID
Captured At
Object Key / File Reference
```

## FR-PHOTO-003 — Required Photo
System shall prevent completion if a required photo is missing.

## FR-PHOTO-004 — Offline Photo
Photo shall be stored locally and synchronized later when offline.

---

# 13. New Needle & Issue

## FR-ISSUE-001 — Stock Validation
**Priority:** P0

Before issue:

```text
Available Stock >= Requested Quantity
```

Stock must never become negative.

## FR-ISSUE-002 — New Needle Availability
Selected New Needle Type must be available at the current trolley stock location.

## FR-ISSUE-003 — Physical Issue Confirmation
**Priority:** P0

PIC confirms physical delivery of new needle.

## FR-ISSUE-004 — Automatic Stock Deduction
Issue creates:

```text
Movement Type = ISSUE
Source = TROLLEY
Quantity = -Q
Reference = Exchange ID
```

## FR-ISSUE-005 — Atomic Issue
Issue and stock deduction must succeed or fail together.

---

# 14. Used Needle Storage

## FR-STORAGE-001 — Storage Location
System shall support physical storage compartments per trolley.

Example:

```text
Trolley A-01
 |
 +-- Broken
 +-- Bent
 +-- Changeover
```

## FR-STORAGE-002 — Storage Mapping
Compartment may be mapped to Exchange Type according to configuration.

## FR-STORAGE-003 — Storage Confirmation
PIC shall confirm old needle has been physically stored.

---

# 15. Exchange Completion

## FR-EXC-007 — Completion Validation
System completes only when all mandatory states are satisfied.

## FR-EXC-008 — Transaction States

```text
DRAFT
OPERATOR_IDENTIFIED
NEEDLE_SELECTED
EXCHANGE_SELECTED
WAITING_CONFIRMATION
CONFIRMED
PHOTO_CAPTURED
NEW_NEEDLE_SELECTED
NEEDLE_ISSUED
USED_NEEDLE_STORED
COMPLETED
BLOCKED
CANCELLED
SYNC_PENDING
SYNC_FAILED
SYNC_CONFLICT
```

## FR-EXC-009 — No Hard Delete
Completed transactions cannot be hard deleted.

Corrections use audited:

```text
VOID
REVERSAL
CORRECTION
ADJUSTMENT
```

---

# 16. Inventory Model

## FR-INV-001 — Location-Based Inventory
Inventory is maintained by:

```text
Factory
Location
Needle Type
Quantity
```

Locations include:

```text
Main Warehouse
Trolley A-01
Trolley A-02
Trolley A-03
```

## FR-INV-002 — Trolley as Mobile Warehouse
Each trolley maintains independent stock.

## FR-INV-003 — Stock Balance
System maintains current quantity for every Location + Needle Type combination.

---

# 17. Stock Receiving

## FR-INV-004 — Receiving
**Priority:** P1

PIC Inventory can receive stock into Main Warehouse.

Required:
- Receiving ID.
- Source.
- Needle Type.
- Quantity.
- Destination.
- Requested By.
- Created At.

## FR-INV-005 — Receiving Movement
Receiving creates:

```text
RECEIVING
Destination = WAREHOUSE
Quantity = +Q
```

---

# 18. Stock Transfer

## FR-INV-006 — Warehouse to Trolley
**Priority:** P1

PIC Inventory can transfer:

```text
Warehouse -> Trolley
```

## FR-INV-007 — Transfer Data

```text
Transfer ID
From Location
To Location
Needle Type
Quantity
Requested By
Approved By if required
Created At
Status
```

## FR-INV-008 — Transfer Status

```text
DRAFT
REQUESTED
APPROVED
IN_TRANSIT
COMPLETED
CANCELLED
```

## FR-INV-009 — Atomic Transfer

```text
Warehouse -Q
Trolley +Q
```

Both updates must be atomic.

---

# 19. Stock Return

## FR-INV-010 — Trolley to Warehouse
PIC Inventory can return:

```text
Trolley -> Warehouse
```

## FR-INV-011 — Return Validation
System validates trolley quantity before return.

---

# 20. Stock Adjustment

## FR-INV-012 — Adjustment
PIC Inventory can create adjustment.

## FR-INV-013 — Mandatory Reason
Examples:

```text
PHYSICAL_COUNT
DAMAGED
LOST
DATA_CORRECTION
OTHER
```

## FR-INV-014 — Approval
Approval shall follow configured policy.

## FR-INV-015 — Adjustment Audit
Record:

```text
Reason
User
Timestamp
Before
After
Approval
Audit Trail
```

---

# 21. Physical Count

## FR-INV-016 — Physical Count
System compares:

```text
System Quantity
vs
Physical Quantity
```

## FR-INV-017 — Variance

```text
Variance = Physical Qty - System Qty
```

Variance triggers adjustment workflow.

---

# 22. Replenishment & Par Stock

## FR-INV-018 — Minimum Stock
Minimum stock is configurable per Trolley + Needle Type.

## FR-INV-019 — Maximum Stock
Maximum stock is configurable per Trolley + Needle Type.

## FR-INV-020 — Low Stock

```text
Current Qty <= Minimum Qty
```

→ `LOW`.

## FR-INV-021 — Critical Stock
System supports configurable critical threshold → `CRITICAL`.

## FR-INV-022 — Recommended Refill

```text
Refill Qty = Maximum Qty - Current Qty
```

---

# 23. Trolley Reconciliation

## FR-INV-023 — Reconciliation
PIC Inventory can reconcile physical trolley stock against system stock.

## FR-INV-024 — Result

```text
MATCH
VARIANCE
```

Variance triggers adjustment.

---

# 24. Stock Movement Ledger

## FR-STOCK-001 — Movement Requirement
Every quantity change must create a stock movement.

## FR-STOCK-002 — Movement Types

```text
RECEIVING
TRANSFER
ISSUE
RETURN
ADJUSTMENT
REVERSAL
```

## FR-STOCK-003 — Movement Data

```text
Movement ID
Movement Type
Reference ID
Factory
Source Location
Destination Location
Needle Type
Quantity
Balance Before
Balance After
Actor
Timestamp
```

## FR-STOCK-004 — Source Traceability
Every movement must trace to its source transaction.

---

# 25. Stock Reversal

## FR-STOCK-005 — Reversal
Authorized users can reverse an incorrect movement.

## FR-STOCK-006 — Preserve Original
Original movement is never deleted. Reversal creates a new movement.

---

# 26. Master Data

## FR-MASTER-001 — Factory
Manage:
- Factory Code.
- Factory Name.
- Location.
- Status.

## FR-MASTER-002 — Trolley
Manage:
- Trolley ID.
- Trolley Name.
- Factory.
- Status.
- Assigned Device.
- Assigned PIC.

## FR-MASTER-003 — Needle
Manage:
- Needle Code.
- Needle Name.
- Needle Type.
- Brand.
- Size.
- Specification.
- Unit.
- Status.

Needle Code must be unique.

## FR-MASTER-004 — Employee
Manage:
- Employee ID.
- Name.
- Department.
- Section.
- Line.
- Status.
- RFID Identifier.

RFID Identifier must be unique.

## FR-MASTER-005 — Exchange Type
Manage:
- Exchange Type.
- Description.
- Active Status.
- Photo Requirement.
- Approval Requirement.
- Same-Type Rule.
- Storage Rule.

Default:

```text
BROKEN
BENT
CHANGEOVER
```

## FR-MASTER-006 — Storage
Manage:
- Storage Location.
- Compartment.
- Trolley.
- Exchange Type Mapping.
- Status.

## FR-MASTER-007 — User & Role
System Admin manages users and roles.

## FR-MASTER-008 — System Configuration
Configurable:

```text
Minimum Stock
Maximum Stock
Critical Threshold
Confirmation Expiry
Photo Requirement
Approval Policy
Offline Policy
```

Configuration changes require audit.

---

# 27. Dashboard & Analytics

## FR-DASH-001 — Dashboard Overview
Display:
- Total Needle Exchange.
- Broken.
- Bent.
- Changeover.
- Total Needle Consumption.
- Current Inventory.
- Low Stock.
- Critical Stock.
- Missing Fragment.
- Pending Confirmation.

## FR-DASH-002 — Factory Analysis
Filter by Factory.

## FR-DASH-003 — Trolley Analysis
Filter by Trolley.

## FR-DASH-004 — Needle Type Analysis
Analyze exchange and consumption by Needle Type.

## FR-DASH-005 — Exchange Type Analysis
Analyze Broken/Bent/Changeover.

## FR-DASH-006 — Operator Analysis
Analyze exchange count by Operator, including top operators.

## FR-DASH-007 — Line Analysis
Analyze by sewing Line where data exists.

## FR-DASH-008 — Time Analysis
Support:

```text
Daily
Weekly
Monthly
Custom Period
```

## FR-DASH-009 — Inventory Dashboard
Display stock by:

```text
Factory
Location
Trolley
Needle Type
Stock Status
```

---

# 28. Reporting

## FR-REPORT-001 — Exchange Report
Filters:
- Date.
- Factory.
- Trolley.
- Operator.
- Needle Type.
- Exchange Type.
- PIC.

## FR-REPORT-002 — Inventory Report
Filters:
- Factory.
- Location.
- Needle Type.
- Stock Status.

## FR-REPORT-003 — Stock Movement Report
Filters:
- Date.
- Movement Type.
- Location.
- Needle Type.
- Actor.

## FR-REPORT-004 — Exception Report
Includes:
- Missing Fragment.
- Pending Confirmation.
- Rejected Confirmation.
- Expired Confirmation.
- Sync Failure.
- Stock Variance.
- Manual Adjustment.

## FR-REPORT-005 — Export
Authorized users can export supported reports.

---

# 29. Audit Trail

## FR-AUDIT-001 — Audit Event
Critical actions shall be recorded.

## FR-AUDIT-002 — Audit Data

```text
Audit ID
Actor
Role
Action
Entity
Entity ID
Before
After
Timestamp
Device / Session
Factory
Location
```

## FR-AUDIT-003 — Immutable History
Audit records cannot be edited through normal application functions.

---

# 30. Offline-First Mobile

## FR-OFFLINE-001 — Offline Detection
Android detects network availability.

## FR-OFFLINE-002 — Local Master Data
Cache required:

```text
Employee
Needle Type
Exchange Type
Trolley
Storage
Business Rules
```

## FR-OFFLINE-003 — Local Transaction
Supported transaction data shall be stored locally while offline.

## FR-OFFLINE-004 — Local Photo
Required photo is stored locally until synchronization.

## FR-OFFLINE-005 — Sync Queue
Offline transactions enter:

```text
SYNC_PENDING
```

---

# 31. Synchronization

## FR-SYNC-001 — Background Sync
Pending transactions synchronize when connectivity returns.

## FR-SYNC-002 — Idempotency
Client Transaction ID/idempotency mechanism prevents duplicate transactions.

## FR-SYNC-003 — Server Validation
Every offline transaction receives final backend validation.

## FR-SYNC-004 — Sync States

```text
LOCAL_ONLY
SYNC_PENDING
SYNCING
SYNCED
SYNC_FAILED
SYNC_CONFLICT
```

## FR-SYNC-005 — Conflict Handling
Potential conflicts:
- Stock changed.
- Master data changed.
- Employee inactive.
- Trolley inactive.
- Device revoked.
- Duplicate transaction.
- Business rule changed.

System shall not silently overwrite conflicts.

---

# 32. Security

## FR-SEC-001 — Secure Authentication
Credentials/tokens shall be handled securely.

## FR-SEC-002 — Secure Mobile Storage
Sensitive session data shall use secure storage.

## FR-SEC-003 — Server-Side Authorization
Protected actions shall be authorized by backend.

## FR-SEC-004 — Secure Approval
Approval links/pages require authentication and authorization.

## FR-SEC-005 — Data Isolation
Factory and location scope shall be enforced server-side.

---

# 33. External Integration

## FR-INT-001 — RFID
Android shall integrate with selected RFID reader/SDK.

## FR-INT-002 — Camera
Android shall integrate with tablet camera.

## FR-INT-003 — Object Storage
Photo binaries are stored in object/file storage; database stores metadata/reference.

## FR-INT-004 — WhatsApp
Backend integrates with configured WhatsApp Business/provider service.

Provider-specific implementation belongs in the Integration Specification.

---

# 34. Transaction Integrity

## FR-TRANS-001 — Atomic Operations
These operations must be atomic:
- Needle Issue + stock deduction.
- Warehouse Transfer + trolley receipt.
- Stock Reversal.

## FR-TRANS-002 — No Negative Stock
Backend rejects operations causing negative stock.

## FR-TRANS-003 — Complete Traceability
Completed exchange must trace:

```text
Factory
Trolley
Device
PIC
Operator
RFID
Exchange ID
Old Needle
Exchange Type
Fragment Status
Photo
Confirmation
New Needle
Stock Movement
Storage
Completion
Audit
```

---

# 35. Exception Handling

| Exception | Expected Action |
|---|---|
| RFID unreadable | Retry |
| RFID unknown | Block |
| Employee inactive | Block |
| Needle type inactive | Block |
| Insufficient stock | Block |
| Missing fragment | Confirmation |
| Photo failure | Retry |
| Camera permission denied | Request permission |
| Backend unavailable | Offline mode |
| Sync failure | Queue retry |
| Sync conflict | Review/resolution |
| Device unauthorized | Block |
| User unauthorized | Block |
| Trolley inactive | Block |

---

# 36. Mobile Functional Menu

```text
NEEDLE MOBILE
|
+-- Dashboard
+-- New Exchange
+-- Exchange History
+-- Trolley Stock
+-- Pending Sync
+-- Settings / Device Info
```

Primary action:

```text
NEW EXCHANGE
```

---

# 37. WebApp Functional Menu

```text
DASHBOARD
|
+-- Overview
+-- Exchange Analytics
+-- Inventory Analytics

EXCHANGE
|
+-- Exchange History
+-- Confirmation
+-- Exception

INVENTORY
|
+-- Stock Overview
+-- Receiving
+-- Transfer
+-- Return
+-- Adjustment
+-- Physical Count
+-- Reconciliation
+-- Stock Movement
+-- Low Stock

MASTER DATA
|
+-- Factory
+-- Trolley
+-- Needle
+-- Employee
+-- Exchange Type
+-- Storage
+-- Device
+-- User & Role

REPORT
|
+-- Exchange
+-- Inventory
+-- Movement
+-- Exception

SYSTEM
|
+-- Audit Trail
+-- Configuration
```

---

# 38. Functional Traceability Matrix

| Business Process | Use Case | Functional Requirement Domain |
|---|---|---|
| PIC Login | UC-MOB-001 | AUTH / DEVICE |
| RFID Operator | UC-MOB-002 | OPERATOR |
| Create Exchange | UC-MOB-003 | EXCHANGE |
| Old Needle Type | UC-MOB-004 | EXCHANGE |
| Exchange Type | UC-MOB-005 | EXCHANGE |
| Broken Validation | UC-MOB-006 | BROKEN |
| Confirmation | UC-MOB-007 | APPROVAL |
| WhatsApp | UC-SYS-001 | NOTIFICATION |
| Approval | UC-MGT-001 | APPROVAL |
| Photo | UC-MOB-008 | PHOTO |
| New Needle | UC-MOB-009 | ISSUE |
| Stock Validation | UC-MOB-010 | ISSUE / STOCK |
| Issue | UC-MOB-011 | STOCK |
| Used Needle Storage | UC-MOB-012 | STORAGE |
| Complete Exchange | UC-MOB-013 | EXCHANGE |
| Cancel Exchange | UC-MOB-014 | EXCHANGE |
| Offline Transaction | UC-MOB-015 | OFFLINE |
| Synchronization | UC-SYS-002 | SYNC |
| Receiving | UC-INV-001 | INVENTORY |
| Warehouse → Trolley | UC-INV-002 | INVENTORY |
| Trolley → Warehouse | UC-INV-003 | INVENTORY |
| Adjustment | UC-INV-004 | INVENTORY |
| Physical Count | UC-INV-005 | INVENTORY |
| Replenishment | UC-INV-006 | INVENTORY |
| Reconciliation | UC-INV-007 | INVENTORY |
| Needle Master | UC-ADM-001 | MASTER |
| Factory Master | UC-ADM-002 | MASTER |
| Trolley Master | UC-ADM-003 | MASTER |
| Employee Master | UC-ADM-004 | MASTER |
| User/Role | UC-ADM-005 | AUTH / MASTER |
| Device | UC-ADM-006 | DEVICE |
| Exchange Config | UC-ADM-007 | MASTER |
| System Config | UC-ADM-008 | MASTER |
| Dashboard | UC-MGT-002 | DASHBOARD |
| Exchange Analytics | UC-MGT-003 | DASHBOARD |
| Inventory Analytics | UC-MGT-004 | DASHBOARD |
| Exception Dashboard | UC-MGT-005 | DASHBOARD |
| Audit Viewer | UC-MGT-006 | AUDIT |
| Stock Ledger | UC-SYS-003 | STOCK |
| Reversal | UC-SYS-004 | STOCK |
| Audit Event | UC-SYS-005 | AUDIT |
| Sync Conflict | UC-SYS-006 | SYNC |
| Device Validation | UC-SYS-007 | DEVICE |
| Authorization | UC-SYS-008 | AUTH |
| Notification Tracking | UC-SYS-009 | NOTIFICATION |
| Confirmation Expiry | UC-SYS-010 | APPROVAL |

---

# 39. End-to-End Exchange Functional Flow

```text
PIC LOGIN
    |
    v
DEVICE VALIDATION
    |
    v
TROLLEY CONTEXT
    |
    v
NEW EXCHANGE
    |
    v
RFID OPERATOR
    |
    v
OLD NEEDLE TYPE
    |
    v
EXCHANGE TYPE
    |
    +-----------------------------+
    |                             |
    v                             v
BROKEN                        BENT / CHANGEOVER
    |
    v
FRAGMENT STATUS
    |
    +--------------------+
    |                    |
   FOUND               NOT FOUND
    |                    |
    |               CONFIRMATION
    |                    |
    |              WHATSAPP NOTIFY
    |                    |
    |                 APPROVAL
    |                    |
    +----------+---------+
               |
               v
             PHOTO
               |
               v
       NEW NEEDLE TYPE
               |
               v
        STOCK VALIDATION
               |
          +----+----+
          |         |
       AVAILABLE  NO STOCK
          |         |
          v         v
        ISSUE     BLOCK
          |
          v
   STORE USED NEEDLE
          |
          v
       COMPLETE
          |
          v
     STOCK MOVEMENT
          |
          v
      AUDIT TRAIL
```

---

# 40. Inventory Functional Flow

```text
SUPPLIER
   |
   v
RECEIVING
   |
   v
MAIN WAREHOUSE
   |
   +----------------+
   |                |
   v                v
TRANSFER          RETURN
   |                ^
   v                |
TROLLEY ------------+
   |
   v
NEEDLE ISSUE
   |
   v
OPERATOR
```

Adjustment:

```text
PHYSICAL COUNT
      |
      v
VARIANCE
      |
      v
ADJUSTMENT
      |
      v
APPROVAL
      |
      v
STOCK MOVEMENT
```

---

# 41. Android MVP Acceptance Criteria

- [ ] PIC Troli can login.
- [ ] Device is bound to trolley.
- [ ] Factory and trolley are automatically identified.
- [ ] RFID operator scan works.
- [ ] Operator information is displayed.
- [ ] Old Needle Type can be selected.
- [ ] Exchange Type can be selected.
- [ ] Broken fragment validation works.
- [ ] Missing fragment creates confirmation.
- [ ] WhatsApp notification event is generated.
- [ ] Photo can be captured.
- [ ] New Needle Type can be selected.
- [ ] Trolley stock is validated.
- [ ] Issue reduces stock.
- [ ] Used needle storage can be confirmed.
- [ ] Exchange can be completed.
- [ ] Exchange can operate offline.
- [ ] Pending transactions can synchronize.
- [ ] Duplicate sync does not create duplicate transaction.
- [ ] Sync failures are visible.

---

# 42. WebApp MVP Acceptance Criteria

- [ ] Admin can manage Factory.
- [ ] Admin can manage Trolley.
- [ ] Admin can manage Device.
- [ ] Admin can manage Employee.
- [ ] Admin can manage RFID.
- [ ] Admin can manage Needle Type.
- [ ] Admin can manage Exchange Type.
- [ ] Admin can manage Storage.
- [ ] Admin can manage User and Role.
- [ ] PIC Inventory can see stock.
- [ ] PIC Inventory can receive stock.
- [ ] PIC Inventory can transfer stock.
- [ ] PIC Inventory can return stock.
- [ ] PIC Inventory can adjust stock.
- [ ] PIC Inventory can perform physical count.
- [ ] Low stock can be monitored.
- [ ] Stock movement can be viewed.
- [ ] Management can view dashboard.
- [ ] Management can view analytics.
- [ ] Approver can process confirmation.
- [ ] Reports can be filtered.
- [ ] Reports can be exported.
- [ ] Audit trail is available.

---

# 43. Backend MVP Acceptance Criteria

- [ ] Authentication is enforced.
- [ ] Authorization is enforced server-side.
- [ ] Factory/location scope is enforced.
- [ ] Device context is validated.
- [ ] Stock cannot become negative.
- [ ] Stock movements are atomic.
- [ ] Exchange and issue are traceable.
- [ ] Duplicate transactions are prevented.
- [ ] Offline transactions are validated at server.
- [ ] Sync conflict is detectable.
- [ ] Audit events are recorded.
- [ ] Confirmation workflow is persisted.
- [ ] Notification status is persisted.
- [ ] Photo metadata is persisted.
- [ ] Completed transactions cannot be hard deleted.

---

# 44. Requirement-to-Platform Matrix

| Area | Android | WebApp | Backend |
|---|:---:|:---:|:---:|
| Login | ✓ | ✓ | ✓ |
| RFID | ✓ | | ✓ |
| Exchange | ✓ | View | ✓ |
| Broken Validation | ✓ | View | ✓ |
| Confirmation | Request/View | ✓ | ✓ |
| WhatsApp | | | ✓ |
| Camera | ✓ | | ✓ |
| New Needle | ✓ | View | ✓ |
| Stock Validation | ✓ | View | ✓ |
| Needle Issue | ✓ | View | ✓ |
| Storage | ✓ | Manage | ✓ |
| Receiving | | ✓ | ✓ |
| Transfer | | ✓ | ✓ |
| Return | | ✓ | ✓ |
| Adjustment | | ✓ | ✓ |
| Physical Count | | ✓ | ✓ |
| Replenishment | View | ✓ | ✓ |
| Master Data | | ✓ | ✓ |
| Dashboard | Basic | ✓ | ✓ |
| Analytics | | ✓ | ✓ |
| Reporting | | ✓ | ✓ |
| Audit | | ✓ | ✓ |
| Offline | ✓ | | ✓ |
| Sync | ✓ | | ✓ |
| Device Binding | | ✓ | ✓ |

---

# 45. Non-Functional Boundary

NFR will be specified separately, but functional design shall support:

```text
Security
Performance
Availability
Offline Capability
Scalability
Auditability
Data Integrity
Observability
```

Initial targets from PRD:

- RFID identification target: < 2 seconds.
- Local transaction save target: < 2 seconds.
- Local photo save target: < 5 seconds.
- Standard Web CRUD response target: < 2 seconds.
- Dashboard initial load target: < 3 seconds under normal conditions.
- Backend availability target: >= 99%.

---

# 46. Open Business Decisions

The following decisions remain business-owned and should be resolved before final SRS:

1. Apakah Old Needle Type dan New Needle Type untuk Broken/Bent selalu wajib sama?
2. Jika berbeda, siapa yang memiliki hak override?
3. Apakah supervisor dapat approve melalui smartphone?
4. Apakah semua approver memiliki nomor WhatsApp terdaftar?
5. Apakah perusahaan menyediakan WhatsApp Business API/provider?
6. Apakah foto wajib untuk semua exchange type?
7. Apakah satu exchange boleh memiliki multiple photos?
8. Apakah storage compartment memiliki unique ID?
9. Apakah storage mapping berdasarkan Exchange Type, Needle Type, atau keduanya?
10. Bagaimana proses jika approval ditolak?
11. Apakah operator boleh melakukan exchange baru saat exchange sebelumnya masih pending?
12. Apakah mesin sewing harus dicatat?
13. Apakah shift harus dicatat?
14. Apakah quantity exchange selalu 1?
15. Apakah RFID perusahaan sudah terintegrasi dengan Employee Master?
16. Apakah ada fallback jika RFID tidak terbaca?
17. Apakah stock transfer membutuhkan approval?
18. Apakah stock adjustment selalu membutuhkan approval?
19. Apakah par stock dapat berbeda untuk setiap trolley?
20. Apakah par stock dapat berbeda berdasarkan Factory?
21. Apakah initial deployment selalu 3 trolley per factory atau jumlah trolley configurable?
22. Apakah PIC Inventory dapat mengelola lebih dari satu factory?
23. Berapa lama foto dan audit trail harus disimpan?

---

# 47. Definition of Done

Functional Requirements siap menjadi baseline SRS apabila:

- [ ] Semua PRD scope tercakup.
- [ ] Semua business process tercakup.
- [ ] Semua use case tercakup.
- [ ] Mobile requirement teridentifikasi.
- [ ] WebApp requirement teridentifikasi.
- [ ] Backend requirement teridentifikasi.
- [ ] Inventory requirement teridentifikasi.
- [ ] Broken needle requirement teridentifikasi.
- [ ] Approval requirement teridentifikasi.
- [ ] WhatsApp requirement teridentifikasi.
- [ ] RFID requirement teridentifikasi.
- [ ] Camera requirement teridentifikasi.
- [ ] Offline requirement teridentifikasi.
- [ ] Sync requirement teridentifikasi.
- [ ] Master data requirement teridentifikasi.
- [ ] Stock movement requirement teridentifikasi.
- [ ] Dashboard/analytics requirement teridentifikasi.
- [ ] Audit requirement teridentifikasi.
- [ ] Acceptance criteria tersedia.
- [ ] Open business decisions terdaftar.

---

# 48. Next Documents

Setelah FRS disetujui:

```text
01-PRD.md
     |
02-Business-Process.md
     |
03-Use-Case.md
     |
04-Functional-Requirements.md
     |
     +-----------------------------+
     |                             |
     v                             v
05-System-Architecture.md   06-SRS-Mobile-Android.md
                                   |
                                   v
                           07-SRS-WebApp.md
                                   |
                     +-------------+-------------+
                     |             |             |
                     v             v             v
                 API Spec     Database       UI/UX Spec
                     |
                     v
              Security / Integration
                     |
                     v
                 Test & UAT
```

**End of Functional Requirements Specification**

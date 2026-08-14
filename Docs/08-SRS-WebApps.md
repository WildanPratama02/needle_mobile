# 08 — SRS WebApps
# Needle Management System — Needle Management & Administration

**Version:** 1.0  
**Status:** Draft / Development Baseline  
**Platform:** Web Application  
**Primary Users:** System Admin, PIC Inventory, Management, Approver  
**Reference:** PRD, Business Process, Use Case, Functional Requirements, System Architecture, Application Architecture, SRS Mobile Android

---

# 1. Document Purpose

Dokumen ini mendefinisikan Software Requirements Specification (SRS) untuk **WebApps Needle Management System**.

WebApps digunakan untuk:
- System Administration
- Master Data Management
- Factory & Trolley Management
- Needle Inventory Management
- Stock Receiving
- Stock Transfer
- Stock Return
- Stock Adjustment
- Physical Count & Reconciliation
- Broken Needle Confirmation / Approval
- Needle Exchange Monitoring
- Dashboard
- Analytics
- Reporting
- Audit Monitoring

Transaksi operasional di production floor tetap dilakukan melalui Android Tablet oleh PIC Troli.

---

# 2. Application Boundary

```text
+------------------------------------------------------+
|                     WEB APPLICATION                  |
|------------------------------------------------------|
| Dashboard | Exchange | Approval | Inventory          |
| Master    | Device   | Reports  | Audit              |
+--------------------------+---------------------------+
                           |
                           | HTTPS / REST API
                           v
                 +----------------------+
                 |   CENTRAL BACKEND    |
                 +----------------------+
```

WebApps tidak melakukan direct database access. Backend menjadi authority untuk authentication, authorization, exchange, approval, stock, stock movement, master data, audit, dan synchronization.

---

# 3. WebApp Users

## 3.1 System Admin

- Manage users, roles, permissions.
- Manage factory, trolley, device.
- Manage master data.
- Manage system configuration.

## 3.2 PIC Inventory

- Monitor stock.
- Receiving.
- Transfer.
- Return.
- Adjustment.
- Physical count.
- Reconciliation.
- Stock movement.
- Low-stock monitoring.
- Inventory reporting.

## 3.3 Management

- Dashboard.
- Analytics.
- Consumption trend.
- Factory comparison.
- Trolley performance.
- Needle consumption.
- Stock overview.
- Operational monitoring.
- Reporting.

## 3.4 Approver / Supervisor

- Review missing broken-needle fragment confirmation.
- Approve/reject confirmation.
- Review evidence and transaction context.

---

# 4. Functional Domains

```text
WebApps
|
+-- Authentication
+-- Dashboard
+-- Needle Exchange Monitoring
+-- Confirmation & Approval
+-- Inventory
|    +-- Stock Overview
|    +-- Receiving
|    +-- Transfer
|    +-- Return
|    +-- Adjustment
|    +-- Physical Count
|    +-- Reconciliation
|    +-- Stock Movement
+-- Master Data
|    +-- Factory
|    +-- Trolley
|    +-- Device
|    +-- Employee
|    +-- RFID
|    +-- Needle Type
|    +-- Exchange Type
|    +-- Location
+-- User & Access
+-- Reporting
+-- Analytics
+-- Audit
+-- System Configuration
```

---

# 5. Authentication & Authorization

## FR-WEB-001 Login

After successful authentication, backend provides:

```text
User
Role
Permissions
Factory Scope
Location Scope
Session
```

## FR-WEB-002 Authorization

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

A user must not access data outside the assigned scope.

---

# 6. Dashboard

## FR-WEB-003 Management Dashboard

Minimum KPI:

```text
Total Exchange
Broken Needle
Bent Needle
Changeover
Total Needle Consumption
Current Stock
Low Stock
Pending Confirmation
Pending Approval
Stock Variance
```

Filters:

```text
Date
Factory
Trolley
Needle Type
Exchange Type
```

Dashboard drill-down:

```text
Company
  -> Factory
      -> Trolley
          -> Needle Type
              -> Transactions
```

---

# 7. Factory & Trolley Overview

Per factory:

```text
Factory
|
+-- Warehouse
+-- Trolley 01
+-- Trolley 02
+-- Trolley 03
```

Initial deployment menggunakan 3 trolley per factory, tetapi application **tidak boleh hard-code angka 3**.

Per trolley tampilkan:

```text
Status
Current Stock
Exchange Count
Consumption
Low Stock
Last Transaction
Last Sync
```

---

# 8. Needle Exchange Monitoring

## FR-WEB-004 Exchange List

Columns:

```text
Exchange ID
Date
Time
Factory
Trolley
Operator
PIC
Old Needle Type
Exchange Type
New Needle Type
Fragment Status
Confirmation Status
Transaction Status
Sync Status
```

Filters:

```text
Date Range
Factory
Trolley
Operator
PIC
Old Needle Type
New Needle Type
Exchange Type
Fragment Status
Confirmation Status
Transaction Status
```

Search:

```text
Exchange ID
Employee ID
Employee Name
```

---

# 9. Exchange Detail

## FR-WEB-005

Detail harus menampilkan:

```text
Transaction Information
Operator Information
PIC Information
Factory / Trolley
Old Needle
Exchange Type
Fragment Status
Confirmation
Photo Evidence
New Needle
Stock Issue
Used Needle Storage
Audit Timeline
```

Timeline contoh:

```text
10:01 Exchange Created
10:02 RFID Operator Identified
10:03 Needle Selected
10:04 Exchange Type Selected
10:05 Fragment Checked
10:06 Photo Captured
10:07 New Needle Issued
10:07 Used Needle Stored
10:08 Completed
```

---

# 10. Broken Needle Confirmation

## FR-WEB-006 Confirmation Inbox

Status:

```text
PENDING
APPROVED
REJECTED
EXPIRED
```

Pending list:

```text
Confirmation ID
Exchange ID
Factory
Trolley
Operator
PIC
Needle Type
Created At
Age
Status
```

## FR-WEB-007 Confirmation Detail

Evidence:

```text
Operator
Factory
Trolley
PIC
Old Needle Type
Exchange Type
Fragment Status
Photo Evidence
Transaction Timeline
Additional Note
```

---

# 11. Approval

## FR-WEB-008 Approve

Flow:

```text
Validate Permission
      |
      v
Validate Current State
      |
      v
Record Approval
      |
      v
Update Confirmation
      |
      v
Audit
```

## FR-WEB-009 Reject

Reject wajib meminta:

```text
Rejection Reason
```

Record:

```text
Decision
Decided By
Decision At
Reason
```

Approval harus atomic dan tidak boleh dilakukan dua kali untuk state yang sama.

---

# 12. WhatsApp Notification Monitoring

Status:

```text
NOT_SENT
SENT
DELIVERED
FAILED
```

WhatsApp merupakan notification channel, bukan approval authority.

```text
Notification Sent
       !=
System Approval
```

WebApp menampilkan failure reason jika tersedia.

---

# 13. Inventory Architecture

```text
Company
|
+-- Factory A
|    +-- Warehouse
|    +-- Trolley A-01
|    +-- Trolley A-02
|    +-- Trolley A-03
|
+-- Factory B
     +-- Warehouse
     +-- Trolley B-01
     +-- Trolley B-02
     +-- Trolley B-03
```

System harus mendukung penambahan trolley tanpa perubahan application logic.

---

# 14. Stock Overview

## FR-WEB-010

PIC Inventory dapat melihat:

```text
Factory
Location
Trolley
Needle Type
System Quantity
Reserved Quantity
Available Quantity
Minimum Stock
Stock Status
Last Movement
```

Status:

```text
NORMAL
LOW
OUT_OF_STOCK
```

Stock balance berasal dari backend sebagai authoritative source.

---

# 15. Receiving

## FR-WEB-011

Input:

```text
Factory
Destination Location
Needle Type
Quantity
Reference Document
Supplier / Source
Received Date
Note
```

Process:

```text
Receive
  |
  v
Validate
  |
  v
Create Stock Movement
  |
  v
Increase Balance
```

---

# 16. Stock Transfer

## FR-WEB-012

Supported:

```text
Warehouse -> Trolley
Trolley -> Warehouse
Trolley -> Trolley
Warehouse -> Warehouse
```

Input:

```text
Source
Destination
Needle Type
Quantity
Reference
Reason / Note
```

Validation:

```text
Source Active
Destination Active
Needle Type Active
Quantity Available
Permission Valid
```

Transfer menghasilkan movement source dan destination.

---

# 17. Stock Return

## FR-WEB-013

Return digunakan untuk mengembalikan stock.

Input:

```text
Source
Destination
Needle Type
Quantity
Reason
Reference
```

Movement harus tercatat.

---

# 18. Stock Adjustment

## FR-WEB-014

Adjustment hanya untuk discrepancy yang valid.

Input:

```text
Location
Needle Type
System Quantity
Actual Quantity
Variance
Reason
Evidence
```

Direct quantity edit tidak diperbolehkan.

Adjustment menghasilkan stock movement dan mengikuti approval policy bila diwajibkan.

---

# 19. Physical Count

## FR-WEB-015

Counting session:

```text
Factory
Location
Trolley
Needle Type
Count Date
Counter
```

Flow:

```text
Create Count
    |
    v
Physical Quantity
    |
    v
Compare System Quantity
    |
    v
Variance
    |
    v
Reconciliation
```

---

# 20. Reconciliation

Example:

```text
System   = 100
Physical = 95
Variance = -5
```

System meminta:

```text
Reason
Evidence
Approval (policy)
```

Jika disetujui:

```text
Create Adjustment Movement
```

---

# 21. Stock Movement Ledger

## FR-WEB-016

Columns:

```text
Movement ID
Date
Type
Factory
Source
Destination
Needle Type
Quantity
Reference
Actor
Status
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

Stock balance harus dapat direkonstruksi dari movement history.

---

# 22. Master Data

## FR-WEB-017 Factory

Fields:

```text
Factory Code
Factory Name
Description
Status
Timezone
```

Actions:

```text
Create
View
Edit
Activate
Deactivate
```

Factory inactive tidak boleh digunakan untuk transaction baru.

## FR-WEB-018 Trolley

Fields:

```text
Trolley Code
Trolley Name
Factory
Status
Location
```

Relationship:

```text
Factory 1 --- N Trolley
```

## FR-WEB-019 Device

Fields:

```text
Device ID
Device Name
Serial Number
Factory
Trolley
Status
App Version
Last Seen
```

Actions:

```text
Register
Bind
Unbind
Activate
Deactivate
Revoke
```

## FR-WEB-020 Employee

Fields:

```text
Employee ID
Name
Department
Factory
Status
RFID ID
```

## FR-WEB-021 RFID

Fields:

```text
RFID ID
Employee ID
Status
Issued Date
```

Actions:

```text
Assign
Unassign
Deactivate
Replace
```

## FR-WEB-022 Needle Type

Fields:

```text
Needle Type Code
Needle Type Name
Description
Category
Unit
Minimum Stock
Status
```

Needle Type digunakan pada old needle, new needle, stock, transfer, receiving, reporting, dan analytics.

## FR-WEB-023 Exchange Type

Initial values:

```text
BROKEN
BENT
CHANGEOVER
```

Fields:

```text
Code
Name
Description
Used Needle Storage
Requires Fragment Validation
Status
```

## FR-WEB-024 Storage Location

Types:

```text
WAREHOUSE
TROLLEY
USED_NEEDLE_STORAGE
```

Trolley dapat memiliki mapping:

```text
Broken Hole
Bent Hole
Changeover Hole
```

---

# 23. User & Role Management

## FR-WEB-025 Users

Actions:

```text
Create
Edit
Activate
Deactivate
Reset Access
Assign Role
Assign Factory Scope
Assign Location Scope
```

Minimum roles:

```text
SYSTEM_ADMIN
PIC_INVENTORY
MANAGEMENT
APPROVER
PIC_TROLI
```

PIC Troli adalah mobile role, tetapi identity dan authorization dikelola central backend.

---

# 24. Permission Model

Contoh permission:

```text
DASHBOARD_VIEW
EXCHANGE_VIEW
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

Final permission matrix dikonfirmasi pada authorization design.

---

# 25. Reporting

## FR-WEB-026 Exchange Report

Filter:

```text
Date
Factory
Trolley
Operator
Needle Type
Exchange Type
Status
```

Output:

```text
Exchange ID
Date
Factory
Trolley
Operator
Old Needle
Exchange Type
New Needle
PIC
Status
```

## FR-WEB-027 Inventory Report

```text
Stock Balance
Stock Movement
Receiving
Transfer
Return
Adjustment
Physical Count
Stock Variance
```

## FR-WEB-028 Consumption Report

Dimensions:

```text
Factory
Trolley
Needle Type
Date
Exchange Type
```

Basic consumption:

```text
Consumption = Total Needle Issued
```

Final formula harus mempertimbangkan reversal/return policy bila diterapkan.

---

# 26. Analytics

## FR-WEB-029

Minimum analytics:

```text
Consumption Trend
Consumption by Factory
Consumption by Trolley
Consumption by Needle Type
Broken Trend
Bent Trend
Changeover Trend
Operator Exchange Frequency
Stock Turnover
Stock Variance
```

Recommended visualization:

```text
Line Chart
Bar Chart
Stacked Chart
KPI Card
Table
```

---

# 27. Audit

## FR-WEB-030

Audit dapat difilter:

```text
Date
User
Role
Factory
Entity
Action
```

Entity:

```text
Exchange
Confirmation
Stock
Stock Movement
Master Data
User
Device
```

Detail:

```text
Timestamp
Actor
Action
Entity
Entity ID
Before
After
Reason
Session Reference
```

Critical changes tidak boleh dihapus melalui WebApp.

---

# 28. System Configuration

Configuration yang dapat dikelola sesuai permission:

```text
Minimum Stock
Confirmation SLA
Session Timeout
Photo Retention
Offline Policy
Exchange Configuration
Storage Mapping
```

Configuration yang mempengaruhi business rule wajib memiliki audit trail.

---

# 29. Search, Pagination & Export

List besar wajib mendukung:

```text
Server-side Pagination
Server-side Filtering
Server-side Sorting
Search
Date Range
```

Export:

```text
CSV
Excel
PDF
```

Export mengikuti permission dan filter aktif.

Dataset besar sebaiknya diproses asynchronously.

---

# 30. Security Requirements

WebApp harus:

- menggunakan HTTPS;
- authenticated session/token;
- RBAC;
- factory scope;
- location scope;
- session expiration;
- audit critical actions;
- tidak menyimpan password plaintext;
- tidak direct database access;
- menolak unauthorized actions di backend.

---

# 31. Performance Requirements

Target awal untuk validasi:

```text
Login                   <= 3 seconds
Dashboard initial load  <= 5 seconds
List API                <= 3 seconds
Search                  <= 3 seconds
Detail                  <= 3 seconds
Normal export           <= 30 seconds
```

Target final ditentukan melalui performance test.

---

# 32. WebApp Navigation

```text
Dashboard

Operations
  ├── Exchange
  └── Confirmation

Inventory
  ├── Stock Overview
  ├── Receiving
  ├── Transfer
  ├── Return
  ├── Adjustment
  ├── Physical Count
  └── Stock Movement

Master Data
  ├── Factory
  ├── Trolley
  ├── Device
  ├── Employee
  ├── RFID
  ├── Needle Type
  ├── Exchange Type
  └── Location

Administration
  ├── Users
  ├── Roles
  └── Configuration

Reports
  ├── Exchange
  ├── Consumption
  ├── Inventory
  └── Variance

Analytics

Audit
```

---

# 33. Responsibility Matrix

| Capability | System Admin | PIC Inventory | Management | Approver |
|---|:---:|:---:|:---:|:---:|
| Dashboard | ✓ | ✓ | ✓ | Optional |
| Exchange View | ✓ | ✓ | ✓ | ✓ |
| Confirmation View | ✓ | ✓ | ✓ | ✓ |
| Confirmation Approve | - | - | Policy | ✓ |
| Stock View | ✓ | ✓ | ✓ | ✓ |
| Receiving | Policy | ✓ | - | - |
| Transfer | Policy | ✓ | - | - |
| Return | Policy | ✓ | - | - |
| Adjustment | Policy | ✓ | - | - |
| Physical Count | - | ✓ | View | - |
| Master Data | ✓ | Limited | - | - |
| User Management | ✓ | - | - | - |
| Device Management | ✓ | Limited | View | - |
| Reports | ✓ | ✓ | ✓ | ✓ |
| Analytics | ✓ | ✓ | ✓ | ✓ |
| Audit | ✓ | Limited | View | View |

Final matrix harus dikunci pada authorization design.

---

# 34. Mobile-Web Integration

Critical E2E:

```text
ANDROID TABLET
      |
      | Create Exchange
      v
CENTRAL BACKEND
      |
      +--> Exchange
      +--> Stock
      +--> Confirmation
      +--> Audit
      |
      v
WEBAPP
```

Scenario:

1. PIC membuat exchange dari Tablet.
2. Exchange muncul di WebApp.
3. Missing fragment menghasilkan pending confirmation.
4. Approver melihat confirmation.
5. Approver approve/reject.
6. Backend mengubah state.
7. Mobile menerima state terbaru melalui sync.
8. Stock issue tercatat.
9. WebApp menampilkan updated stock.
10. Audit trail lengkap.

---

# 35. Acceptance Criteria — Dashboard

**Given** user memiliki dashboard permission  
**When** dashboard dibuka  
**Then** KPI sesuai scope user ditampilkan.

**Given** user hanya memiliki Factory A scope  
**Then** data Factory B tidak boleh muncul.

---

# 36. Acceptance Criteria — Inventory

**Given** source stock cukup  
**When** PIC Inventory melakukan transfer  
**Then** source berkurang, destination bertambah, dan movement tercatat.

**Given** source stock tidak cukup  
**When** transfer dilakukan  
**Then** transfer ditolak tanpa negative stock.

---

# 37. Acceptance Criteria — Adjustment

**Given** physical count berbeda dari system  
**When** PIC membuat adjustment  
**Then** system meminta reason dan menghasilkan movement.

Direct quantity edit tidak diperbolehkan.

---

# 38. Acceptance Criteria — Approval

**Given** confirmation PENDING  
**When** Approver approve  
**Then** confirmation menjadi APPROVED dan audit tercatat.

**Given** confirmation sudah APPROVED  
**When** user mencoba approve lagi  
**Then** action ditolak karena invalid state.

---

# 39. Acceptance Criteria — Master Data

**Given** Needle Type masih digunakan transaction  
**When** Admin mencoba delete  
**Then** system menolak hard delete.

Gunakan:

```text
ACTIVE / INACTIVE
```

untuk master data yang sudah memiliki historical reference.

---

# 40. Acceptance Criteria — Scope

**Given** user hanya memiliki Factory A scope  
**When** user membuka Stock Overview  
**Then** hanya stock Factory A yang dapat dilihat.

**Given** user tidak memiliki permission adjustment  
**When** user membuka inventory  
**Then** adjustment action tidak tersedia.

---

# 41. QA Test Scope

## Functional

```text
Login
Dashboard
Exchange Monitoring
Confirmation
Approval
Inventory
Receiving
Transfer
Return
Adjustment
Physical Count
Master Data
User Management
Device Management
Reporting
Analytics
Audit
```

## Authorization

```text
Role
Permission
Factory Scope
Location Scope
Unauthorized Action
```

## Data Integrity

```text
Stock Movement
Balance
Transfer
Issue
Adjustment
Approval
Audit
```

## Performance

```text
Dashboard
Search
Pagination
Large Dataset
Export
```

---

# 42. Development Breakdown

```text
EPIC 01 — Web Foundation
EPIC 02 — Authentication & Authorization
EPIC 03 — Dashboard
EPIC 04 — Exchange Monitoring
EPIC 05 — Confirmation & Approval
EPIC 06 — Inventory
EPIC 07 — Master Data
EPIC 08 — User & Access
EPIC 09 — Device & Trolley
EPIC 10 — Reporting
EPIC 11 — Analytics
EPIC 12 — Audit
EPIC 13 — Notification Monitoring
EPIC 14 — Integration Testing
EPIC 15 — UAT
```

---

# 43. Dependencies

WebApp membutuhkan backend services:

```text
Identity
Factory
Trolley
Device
Employee
RFID
Needle
Exchange
Confirmation
Inventory
Stock Movement
Notification
Audit
Reporting
Analytics
```

Backend API contract harus tersedia sebelum integration phase.

---

# 44. Open Decisions

1. Web framework.
2. Authentication/SSO.
3. Exact approval hierarchy.
4. Whether adjustment requires approval.
5. Whether transfer requires approval.
6. Physical count approval policy.
7. WhatsApp Business provider.
8. Dashboard KPI final definition.
9. Analytics calculation formula.
10. Report format.
11. Export limits.
12. Data retention.
13. Audit retention.
14. Notification SLA.
15. Factory/location authorization model.
16. Exact initial trolley deployment.
17. Warehouse/location model.
18. Backend reporting strategy.

---

# 45. Definition of Done

SRS WebApps dianggap implementation-ready apabila:

- [ ] User roles defined.
- [ ] Authentication defined.
- [ ] Authorization defined.
- [ ] Factory scope defined.
- [ ] Location scope defined.
- [ ] Dashboard defined.
- [ ] Exchange monitoring defined.
- [ ] Confirmation defined.
- [ ] Approval defined.
- [ ] Inventory defined.
- [ ] Receiving defined.
- [ ] Transfer defined.
- [ ] Return defined.
- [ ] Adjustment defined.
- [ ] Physical count defined.
- [ ] Reconciliation defined.
- [ ] Stock movement defined.
- [ ] Master data defined.
- [ ] User management defined.
- [ ] Device management defined.
- [ ] Reporting defined.
- [ ] Analytics defined.
- [ ] Audit defined.
- [ ] Notification monitoring defined.
- [ ] Security defined.
- [ ] Performance defined.
- [ ] Acceptance criteria defined.
- [ ] Mobile-Web integration scenarios defined.
- [ ] Development breakdown defined.

**End of SRS WebApps Document**

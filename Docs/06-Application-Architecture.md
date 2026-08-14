# 06 — Application Architecture
# Needle Management System

**Version:** 1.0  
**Status:** Draft / Application Architecture Baseline  
**Reference:** `01-PRD.md`, `02-Business-Process.md`, `03-Use-Case.md`, `04-Functional-Requirements.md`, `05-System-Architecture.md`

---

# 1. Purpose

Dokumen ini memecah **System Architecture** menjadi dua application architecture utama:

1. **Mobile Apps — Troli System**
   - Flutter Android Tablet.
   - User utama: PIC Troli.
   - Fokus pada operational transaction di production floor.

2. **WebApps — Needle Management**
   - Web application.
   - User: System Admin, PIC Inventory, Management, dan Approver sesuai authorization.
   - Fokus pada management, inventory, approval, master data, reporting, dashboard, dan analytics.

Kedua aplikasi menggunakan **Central Backend/API** sebagai Single Source of Truth. Hal ini konsisten dengan architecture baseline sebelumnya.

---

# 2. Application Landscape

```text
                           NEEDLE MANAGEMENT SYSTEM
                                      |
                +---------------------+---------------------+
                |                                           |
                v                                           v
      +--------------------+                     +--------------------+
      | MOBILE APPLICATION |                     | WEB APPLICATION    |
      | Troli System       |                     | Needle Management  |
      | Flutter Android    |                     | Browser            |
      +---------+----------+                     +---------+----------+
                |                                          |
                |                  HTTPS/API               |
                +------------------+-----------------------+
                                   |
                                   v
                         +---------------------+
                         | CENTRAL BACKEND/API |
                         +----------+----------+
                                    |
              +---------------------+----------------------+
              |                     |                      |
              v                     v                      v
         PostgreSQL          Object Storage          Notification
                                                       / WhatsApp
```

Backend tetap menjadi authority untuk business rules, stock, authorization, synchronization, dan audit.

---

# 3. Application Boundary

## 3.1 Mobile Application

Mobile bertanggung jawab atas:

- operational transaction;
- RFID interaction;
- camera interaction;
- trolley context;
- local cache;
- offline transaction;
- sync queue;
- mobile UX;
- local validation untuk membantu user.

Mobile **tidak** bertanggung jawab sebagai final authority untuk:

- stock balance;
- approval;
- master data;
- authorization;
- business-rule enforcement.

---

## 3.2 Web Application

WebApp bertanggung jawab atas:

- system administration;
- master data;
- inventory management;
- stock transfer;
- stock adjustment;
- approval;
- dashboard;
- analytics;
- reporting;
- monitoring;
- audit viewing.

WebApp **tidak** mengakses database secara langsung.

---

# 4. Mobile Application Architecture

## 4.1 Technology Baseline

```text
Platform       : Android Tablet
Framework      : Flutter
Language       : Dart
Orientation    : Landscape
Architecture   : Clean Architecture
Pattern        : Feature-oriented
Local Storage  : SQLite-based local database
Network        : HTTPS REST API
Authentication : Token-based
```

PRD menetapkan Android Tablet + Flutter, large touch target, step-by-step transaction, offline-first, RFID, camera, dan background synchronization.

---

# 5. Mobile Layer Architecture

```text
+---------------------------------------------------+
|                 PRESENTATION LAYER                |
|---------------------------------------------------|
| Login | Home | Exchange | Stock | History | Sync |
+---------------------------------------------------+
                       |
                       v
+---------------------------------------------------+
|                 APPLICATION LAYER                 |
|---------------------------------------------------|
| Create Exchange | Issue Needle | Sync | Validate  |
+---------------------------------------------------+
                       |
                       v
+---------------------------------------------------+
|                    DOMAIN LAYER                   |
|---------------------------------------------------|
| Exchange | Operator | Needle | Stock | Approval  |
+---------------------------------------------------+
                       |
                       v
+---------------------------------------------------+
|                     DATA LAYER                    |
|---------------------------------------------------|
| Repository | Remote API | Local DB | File Store  |
+---------------------------------------------------+
              |                    |
              v                    v
       Central Backend       Android Hardware
                           RFID / Camera
```

---

# 6. Mobile Feature Modules

## 6.1 Authentication Module

Responsibilities:

```text
Login
Logout
Session
Token
Device Validation
Role Validation
```

Input:

```text
Username / Employee ID
Password / PIN / SSO
```

Output:

```text
Authenticated Session
Factory
Trolley
Device
Permissions
```

---

## 6.2 Trolley Context Module

Setelah login, application harus mengetahui:

```text
User
+
Factory
+
Trolley
+
Device
```

Contoh:

```text
User       : PIC-001
Factory    : Factory-A
Trolley    : TROL-A-01
Device     : TAB-A-01
```

PIC tidak perlu memilih trolley secara manual setiap transaksi.

Device-to-Trolley binding merupakan bagian dari architecture baseline.

---

# 7. Mobile Exchange Module

Ini adalah **core feature** Mobile Application.

Sub-module:

```text
Exchange
|
+-- Create Exchange
+-- RFID Operator
+-- Old Needle
+-- Exchange Type
+-- Broken Validation
+-- Confirmation
+-- Photo Evidence
+-- New Needle
+-- Stock Validation
+-- Issue Needle
+-- Used Needle Storage
+-- Complete Transaction
```

---

# 8. Mobile Exchange Flow

```text
START
  |
  v
Create Exchange
  |
  v
RFID Scan
  |
  v
Operator Identified
  |
  v
Select Old Needle Type
  |
  v
Select Exchange Type
  |
  +----------------------------+
  |                            |
  v                            v
BROKEN                    BENT / CHANGEOVER
  |                            |
  v                            |
Fragment Validation             |
  |                            |
  +----------+-----------------+
             |
             v
         Photo Evidence
             |
             v
      Select New Needle Type
             |
             v
       Check Trolley Stock
             |
       +-----+------+
       |            |
    Available    Not Available
       |            |
       v            v
     Issue        Block
       |
       v
Used Needle Storage
       |
       v
Complete
```

---

# 9. Broken Needle Submodule

Jika Exchange Type = `BROKEN`:

```text
Broken Needle
      |
      v
Fragment Validation
      |
 +----+----+
 |         |
FOUND    NOT_FOUND
 |         |
 v         v
Continue  Confirmation
            |
            v
        Notification
            |
            v
          Approver
            |
       +----+----+
       |         |
    APPROVED   REJECTED
       |         |
       v         v
   Continue    Block
```

Missing fragment wajib menghasilkan confirmation. WhatsApp hanya notification channel; approval tetap dilakukan secara authenticated system.

---

# 10. Mobile RFID Architecture

```text
+------------------+
| RFID Hardware    |
+--------+---------+
         |
         v
+------------------+
| RFID Adapter     |
| Flutter/Android  |
+--------+---------+
         |
         v
+------------------+
| RFID Service     |
+--------+---------+
         |
         v
+------------------+
| Operator Lookup  |
+--------+---------+
         |
         v
+------------------+
| Exchange Domain  |
+------------------+
```

Hardware SDK tidak boleh tersebar di UI/business logic.

Gunakan interface:

```text
RfidReader
  +-- connect()
  +-- scan()
  +-- disconnect()
```

Dengan demikian RFID hardware dapat diganti tanpa mengubah Exchange Domain.

---

# 11. Mobile Camera Architecture

```text
Camera
  |
  v
Camera Adapter
  |
  v
Image Capture
  |
  +--> Local File
  |
  +--> Photo Metadata
  |
  v
Upload Queue
  |
  v
Object Storage
```

Database hanya menyimpan metadata/reference photo, sedangkan binary photo disimpan pada object storage.

---

# 12. Mobile Inventory Module

Mobile hanya membutuhkan **operational inventory view**.

Features:

```text
My Trolley Stock
Stock by Needle Type
Available Quantity
Low Stock Indicator
Last Sync
```

Mobile tidak menjadi authority stock.

```text
Mobile Stock
     |
     | cached snapshot
     v
Backend Stock
     |
     | authoritative
     v
Stock Ledger
```

---

# 13. Mobile Offline Architecture

```text
                  MOBILE
                     |
        +------------+------------+
        |                         |
   Local Database            Local File Store
        |                         |
        |                         |
   Transaction Queue         Photo Queue
        |                         |
        +------------+------------+
                     |
                 Sync Engine
                     |
                     v
               Central API
                     |
          +----------+----------+
          |                     |
       Accepted              Conflict
          |                     |
          v                     v
       SYNCED             SYNC_CONFLICT
```

Architecture baseline menetapkan local database, sync queue, photo queue, dan server-side validation.

---

# 14. Mobile Sync Module

States:

```text
LOCAL_ONLY
    |
    v
SYNC_PENDING
    |
    v
SYNCING
    |
 +--+---+
 |      |
 v      v
SYNCED CONFLICT
```

Setiap offline transaction wajib memiliki:

```text
client_transaction_id
```

Tujuan:

- idempotency;
- retry safety;
- duplicate prevention.

---

# 15. Mobile Local Data

Minimum local cache:

```text
employees
rfid_cards
needles
exchange_types
trolley_context
stock_snapshot
exchange_drafts
sync_queue
photo_queue
app_configuration
```

Local data harus memiliki expiry/version strategy untuk master data.

---

# 16. Mobile Navigation

Recommended:

```text
+------------------------------------------+
| Factory A | Trolley A-01 | Sync Status  |
+------------------------------------------+
|                                          |
|           [ NEW EXCHANGE ]               |
|                                          |
|           [ STOCK ]                      |
|                                          |
|           [ HISTORY ]                    |
|                                          |
+------------------------------------------+
```

Karena digunakan pada tablet dan production floor, primary action harus besar dan mudah disentuh. PRD menetapkan large touch target dan minimal keyboard input.

---

# 17. Mobile Screen Architecture

Minimum screens:

```text
01 Splash
02 Login
03 Device/Trolley Context
04 Home
05 New Exchange
06 RFID Scan
07 Operator Confirmation
08 Select Old Needle
09 Select Exchange Type
10 Broken Fragment Validation
11 Waiting Confirmation
12 Photo Capture
13 Select New Needle
14 Stock Validation
15 Issue Confirmation
16 Used Needle Storage
17 Transaction Complete
18 Exchange History
19 Trolley Stock
20 Sync Center
21 Settings
```

---

# 18. Web Application Architecture

## 18.1 Technology Boundary

Framework belum difinalisasi pada architecture baseline. Dokumen ini hanya menetapkan logical architecture dan responsibility.

```text
Browser
   |
Web Frontend
   |
API Client
   |
Central Backend
```

Framework WebApp menjadi salah satu open architecture decision. fileciteturn6file2

---

# 19. Web Application Layer Architecture

```text
+------------------------------------------------------+
|                   PRESENTATION                       |
|------------------------------------------------------|
| Dashboard | Inventory | Master | Approval | Reports |
+------------------------------------------------------+
                         |
                         v
+------------------------------------------------------+
|                 APPLICATION / STATE                 |
|------------------------------------------------------|
| Query | Command | Filter | Pagination | Export      |
+------------------------------------------------------+
                         |
                         v
+------------------------------------------------------+
|                    API CLIENT                        |
|------------------------------------------------------|
| Auth | Exchange | Inventory | Master | Dashboard    |
+------------------------------------------------------+
                         |
                         v
                  CENTRAL BACKEND
```

---

# 20. WebApp Feature Domains

```text
WebApp
|
+-- Dashboard
|
+-- Needle Exchange
|
+-- Confirmation / Approval
|
+-- Inventory
|
+-- Master Data
|
+-- User & Access
|
+-- Device & Trolley
|
+-- Reports
|
+-- Analytics
|
+-- Audit
|
+-- System Configuration
```

---

# 21. WebApp Dashboard Module

Dashboard untuk Management/PIC Inventory:

```text
Factory Summary
Trolley Summary
Total Exchange
Broken
Bent
Changeover
Low Stock
Pending Confirmation
Consumption Trend
```

Analytics yang ditetapkan PRD:

- consumption trend;
- consumption per factory;
- consumption per trolley;
- consumption per needle type;
- broken trend;
- bent trend;
- changeover trend;
- operator exchange frequency;
- stock turnover;
- stock variance.

---

# 22. WebApp Exchange Monitoring

Features:

```text
Exchange List
Exchange Detail
Operator
PIC
Factory
Trolley
Old Needle
Exchange Type
New Needle
Photo
Confirmation
Approval
Timestamp
Status
```

Filter:

```text
Date
Factory
Trolley
Operator
Needle Type
Exchange Type
Status
PIC
```

---

# 23. WebApp Approval Module

```text
Approval Inbox
      |
      v
Confirmation Detail
      |
      +-- Exchange Information
      +-- Operator
      +-- Old Needle
      +-- Broken Fragment Status
      +-- Photo
      +-- Trolley
      |
      v
Decision
 +----+----+
 |         |
APPROVE   REJECT
```

Approval harus:

```text
Authenticated
Authorized
Audited
Timestamped
```

---

# 24. WebApp Inventory Module

Inventory domain:

```text
Inventory
|
+-- Overview
+-- Warehouse
+-- Trolley
+-- Receiving
+-- Transfer
+-- Return
+-- Adjustment
+-- Physical Count
+-- Reconciliation
+-- Stock Movement
+-- Low Stock
```

Trolley adalah stock location. Initial deployment menggunakan tiga trolley per factory, tetapi model tetap configurable.

---

# 25. WebApp Inventory Location

```text
Factory
|
+-- Main Warehouse
|      |
|      +-- Needle Type A
|      +-- Needle Type B
|
+-- Trolley 01
|      |
|      +-- Needle Type A
|
+-- Trolley 02
|      |
|      +-- Needle Type A
|
+-- Trolley 03
       |
       +-- Needle Type A
```

WebApp harus dapat melihat:

```text
Stock by Factory
Stock by Location
Stock by Trolley
Stock by Needle Type
```

---

# 26. WebApp Stock Transfer

```text
Source Location
      |
      v
Transfer Request
      |
      v
Validation
      |
      v
Stock Movement
      |
      +---- Source -Q
      |
      +---- Destination +Q
```

Semua movement harus traceable ke source transaction. PRD menetapkan stock movement traceability 100%.

---

# 27. WebApp Stock Adjustment

```text
Physical Count
      |
      v
System Balance
      |
      v
Variance
      |
      v
Adjustment Reason
      |
      v
Approval (jika policy mewajibkan)
      |
      v
Adjustment Movement
```

Tidak diperbolehkan direct-edit quantity tanpa movement/audit.

---

# 28. WebApp Master Data

System Admin mengelola:

```text
Company
Factory
Trolley
Device
Employee
RFID
Needle Type
Exchange Type
Storage Location
User
Role
Permission
Configuration
```

Master Data menjadi sumber data untuk mobile dan WebApp.

---

# 29. WebApp User & Access

Role:

```text
SYSTEM_ADMIN
PIC_TROLI
PIC_INVENTORY
MANAGEMENT
APPROVER
```

Authorization:

```text
Role
+
Permission
+
Factory Scope
+
Location Scope
+
Action
```

Model ini mengikuti authorization architecture pada baseline.

---

# 30. WebApp Device Management

Features:

```text
Device List
Device Registration
Device Binding
Device Status
Device Version
Trolley Assignment
Device Revoke
Last Seen
```

Relationship:

```text
Factory
   |
Trolley
   |
Device
```

---

# 31. WebApp Reporting

Reports:

```text
Exchange Report
Consumption Report
Stock Report
Stock Movement Report
Broken Needle Report
Missing Fragment Report
Approval Report
Trolley Performance
Operator Exchange Report
Needle Type Consumption
Stock Variance
```

Export:

```text
CSV
Excel
PDF
```

Format final dapat ditentukan pada SRS.

---

# 32. WebApp Audit Module

Audit view harus mendukung:

```text
Who
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

Critical events mengikuti architecture baseline seperti login, exchange, approval, stock issue, transfer, adjustment, master changes, device bind/revoke.

---

# 33. Shared Backend Boundary

Mobile dan WebApp menggunakan service yang sama.

```text
                 CENTRAL BACKEND
                        |
     +------------------+------------------+
     |                  |                  |
     v                  v                  v
 Identity           Exchange           Inventory
     |                  |                  |
     v                  v                  v
 Device             Approval          Stock Ledger
     |                  |                  |
     +------------------+------------------+
                        |
              +---------+---------+
              |                   |
              v                   v
        Object Storage       Notification
                              WhatsApp
```

---

# 34. Shared Domain Modules

Backend modules:

```text
Identity
Device
Employee
Master Data
Exchange
Approval
Inventory
Notification
Audit
Reporting
Synchronization
```

---

# 35. Mobile vs Web Responsibility Matrix

| Capability | Mobile | WebApp | Backend |
|---|:---:|:---:|:---:|
| Login | UI | UI | Authority |
| Device Binding | Read | Manage | Authority |
| RFID | ✓ | - | Validate |
| Operator Lookup | ✓ | ✓ | Authority |
| Create Exchange | ✓ | View | Authority |
| Old Needle | Select | View | Validate |
| Exchange Type | Select | View | Validate |
| Broken Validation | ✓ | View | Authority |
| Confirmation Request | ✓ | ✓ | Authority |
| Approval | - | ✓ | Authority |
| WhatsApp | Trigger status | Monitor | Integration |
| Camera | ✓ | View | Metadata |
| New Needle | Select | View | Validate |
| Issue Needle | Trigger | View | Authority |
| Trolley Stock | View | Manage/View | Authority |
| Receiving | - | ✓ | Authority |
| Transfer | - | ✓ | Authority |
| Return | - | ✓ | Authority |
| Adjustment | - | ✓ | Authority |
| Physical Count | - | ✓ | Authority |
| Master Data | - | ✓ | Authority |
| Dashboard | Limited | ✓ | Data Provider |
| Analytics | - | ✓ | Data Provider |
| Audit | Own status | ✓ | Authority |
| Offline | ✓ | - | Validate on Sync |
| Sync | ✓ | - | Authority |

---

# 36. UI Validation vs Business Validation

Prinsip:

```text
Client Validation
        |
        | UX / early feedback
        v
Backend Validation
        |
        | final authority
        v
Transaction
```

Contoh:

Mobile:

```text
Stock = 0
```

Mobile boleh menampilkan:

```text
"Stock tidak tersedia"
```

Tetapi backend tetap wajib melakukan validation saat issue.

---

# 37. API Contract Boundary

Mobile dan WebApp tidak boleh membuat business logic sendiri dari response yang ambigu.

API contract minimal harus mendefinisikan:

```text
Request
Response
Status Code
Business Error Code
Validation Error
Authentication Error
Authorization Error
Conflict Error
Idempotency
Pagination
Sorting
Filtering
Upload
Sync
```

API version:

```text
/api/v1/...
```

Architecture baseline menetapkan REST + JSON + HTTPS.

---

# 38. Error Handling

Standard error model:

```json
{
  "success": false,
  "error": {
    "code": "STOCK_NOT_AVAILABLE",
    "message": "Stock needle is not available",
    "details": {}
  },
  "traceId": "..."
}
```

Suggested business codes:

```text
AUTH_INVALID
ACCESS_DENIED
DEVICE_NOT_BOUND
TROLLEY_INACTIVE
OPERATOR_NOT_FOUND
NEEDLE_NOT_FOUND
STOCK_NOT_AVAILABLE
FRAGMENT_CONFIRMATION_REQUIRED
CONFIRMATION_PENDING
CONFIRMATION_REJECTED
TRANSACTION_ALREADY_PROCESSED
SYNC_CONFLICT
IDEMPOTENCY_CONFLICT
MASTER_DATA_OUTDATED
```

---

# 39. Data Ownership

| Data | Owner |
|---|---|
| User | Backend / Admin |
| Employee | Master Data |
| RFID | Master Data |
| Factory | Master Data |
| Trolley | Master Data |
| Device | Admin / Backend |
| Needle Type | Master Data |
| Exchange Type | Master Data |
| Exchange Transaction | Backend |
| Approval | Backend |
| Stock Balance | Backend |
| Stock Movement | Backend |
| Photo | Object Storage |
| Notification | Backend |
| Audit | Backend |

---

# 40. Security Boundary

Mobile:

```text
Secure Token Storage
Device Validation
Session Timeout
Minimal Local Sensitive Data
```

Web:

```text
HTTPS
Secure Session
RBAC
Factory Scope
Location Scope
```

Backend:

```text
Authentication
Authorization
Validation
Audit
Rate Limiting
Idempotency
```

Security requirement mengikuti baseline yang menetapkan HTTPS, token authentication, RBAC, factory/location scoping, secure mobile storage, audit trail, session expiration, device validation, dan server-side validation.

---

# 41. Deployment Boundary

```text
                  Production
                       |
          +------------+------------+
          |                         |
     Mobile APK                 WebApp
          |                         |
          +------------+------------+
                       |
                 Backend API
                       |
          +------------+------------+
          |                         |
      PostgreSQL              Object Storage
          |
      Backup / Recovery
```

Environment:

```text
DEV
SIT / TEST
UAT
PRODUCTION
```

Environment harus terpisah.

---

# 42. Team Ownership

## Mobile Apps Development Team

```text
Flutter Application
UI/UX Tablet
RFID Adapter
Camera Adapter
Local Database
Offline Engine
Sync Client
Mobile Security
APK Release
```

## WebApps Development Team

```text
Web Frontend
Dashboard
Inventory UI
Master Data UI
Approval UI
Reporting
Analytics
User Management UI
```

## Backend / Platform Team

```text
REST API
Domain Rules
Inventory
Stock Ledger
Authentication
Authorization
Sync Validation
Notification
Audit
Database
Object Storage
Integration
```

PRD secara eksplisit membagi responsibility Mobile Apps, WebApps, dan Shared Backend/API.

---

# 43. Development Dependency

Walaupun Mobile menjadi prioritas development, ada dependency backend minimum.

```text
                 BACKEND FOUNDATION
                        |
        +---------------+---------------+
        |               |               |
     Identity         Master          Exchange
        |               |               |
        +---------------+---------------+
                        |
                 Mobile Development
```

Mobile tidak sebaiknya membuat fake business API permanen.

Minimum backend yang diperlukan untuk Mobile MVP:

```text
Authentication
Device/Trolley
Employee/RFID
Needle Master
Exchange
Inventory Stock
Photo Upload
Confirmation
Sync
Audit
```

---

# 44. Recommended Development Sequence

## Step 1 — Backend Contract Foundation

```text
Auth
Device
Factory
Trolley
Employee
RFID
Needle
Exchange Type
```

## Step 2 — Mobile Foundation

```text
Flutter Setup
Architecture
Navigation
Authentication
Device Context
Local DB
API Client
```

## Step 3 — Core Exchange

```text
RFID
Old Needle
Exchange Type
Broken Validation
Photo
New Needle
Stock
Issue
Complete
```

## Step 4 — Offline

```text
Local Transaction
Queue
Photo Queue
Sync
Conflict
Retry
```

## Step 5 — Web Inventory

```text
Stock
Receiving
Transfer
Adjustment
Physical Count
```

## Step 6 — Approval & Notification

```text
Confirmation
Approver
WhatsApp
Approval
Audit
```

## Step 7 — Dashboard & Analytics

```text
Dashboard
Consumption
Trend
Reporting
Export
```

---

# 45. Application Architecture Decision Records

## AADR-001 — Two Client Applications

**Decision:** Maintain separate Android and WebApp clients.

**Reason:**

Android optimized for production-floor transaction; WebApp optimized for administration, inventory, monitoring, and analytics.

---

## AADR-002 — Shared Backend

**Decision:** Both clients use one Central Backend.

**Reason:**

Avoid different business rules and different transaction authorities.

---

## AADR-003 — Mobile Offline-First

**Decision:** Mobile supports local transaction and synchronization.

**Reason:**

Production-floor network availability cannot be assumed.

---

## AADR-004 — Hardware Adapter

**Decision:** RFID and Camera use adapter boundaries.

**Reason:**

Hardware can change without modifying domain logic.

---

## AADR-005 — No Direct Database Access

**Decision:** Mobile and WebApp never access PostgreSQL directly.

**Reason:**

Security, authorization, consistency, audit, and centralized business rules.

---

# 46. Application Architecture Traceability

| Existing Requirement | Mobile Component | Web Component | Backend |
|---|---|---|---|
| PIC Troli | Exchange UI | - | Exchange |
| RFID | RFID Adapter | - | Employee/RFID |
| Old Needle | Exchange UI | Monitoring | Exchange |
| Exchange Type | Exchange UI | Monitoring | Master/Exchange |
| Broken Fragment | Validation UI | Approval | Confirmation |
| Photo | Camera | Viewer | Object Storage |
| New Needle | Issue UI | Monitoring | Inventory |
| Trolley Stock | Stock View | Inventory | Stock Ledger |
| 3 Trolley / Factory | Context | Trolley Management | Location |
| Transfer | - | Transfer UI | Inventory |
| Adjustment | - | Adjustment UI | Inventory |
| Master Data | Cache | Master UI | Master |
| Dashboard | - | Dashboard | Analytics API |
| Analytics | - | Analytics | Reporting |
| Offline | Local DB | - | Sync Validation |
| Audit | Sync Status | Audit UI | Audit |

---

# 47. Open Decisions Before SRS

Architecture decomposition is complete at logical level, tetapi detail berikut harus diputuskan sebelum implementation-level SRS:

1. Backend framework.
2. WebApp framework.
3. Exact Android tablet model/specification.
4. RFID hardware model.
5. RFID connection method: USB/Bluetooth/Network.
6. Existing company authentication/SSO.
7. Employee master source.
8. WhatsApp Business API/provider.
9. Object Storage provider.
10. PostgreSQL deployment model.
11. Factory network topology.
12. Offline transaction maximum duration.
13. Exact sync conflict resolution policy.
14. Approval policy for missing fragment.
15. Stock transfer approval policy.
16. Stock adjustment approval policy.
17. Photo retention policy.
18. Audit retention policy.
19. Reporting export requirements.
20. Expected production scale.

---

# 48. Next Document

Setelah application architecture ini, dokumen berikutnya sebaiknya dipecah menjadi dua SRS:

```text
06-Application-Architecture.md
            |
            +----------------------------+
            |                            |
            v                            v
07-SRS-Mobile-Android.md          08-SRS-WebApp.md
            |                            |
            +-------------+--------------+
                          |
                          v
                    09-API-Spec.md
                          |
                          v
                  10-Database-Design.md
```

Karena fokus awal adalah Android Tablet, **`07-SRS-Mobile-Android.md` menjadi prioritas implementasi pertama**.

---

# 49. Definition of Done

Application Architecture dianggap selesai apabila:

- [ ] Mobile boundary defined.
- [ ] WebApp boundary defined.
- [ ] Backend boundary defined.
- [ ] Mobile layers defined.
- [ ] Mobile feature modules defined.
- [ ] Exchange flow defined.
- [ ] RFID adapter boundary defined.
- [ ] Camera adapter boundary defined.
- [ ] Offline architecture defined.
- [ ] Sync architecture defined.
- [ ] WebApp domains defined.
- [ ] Inventory modules defined.
- [ ] Approval modules defined.
- [ ] Master Data modules defined.
- [ ] Dashboard/Analytics modules defined.
- [ ] Role boundary defined.
- [ ] Data ownership defined.
- [ ] API boundary defined.
- [ ] Security boundary defined.
- [ ] Team ownership defined.
- [ ] Development dependency defined.
- [ ] Open technical decisions documented.

**End of Application Architecture Document**

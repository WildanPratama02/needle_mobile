# Product Requirements Document (PRD)

# Needle Management System

**Version:** 2.0  
**Status:** Draft / Architecture Revision  
**Role:** Senior Lead Architect — Mobile Apps & WebApps Development  
**Architecture:** Two Big Modules — Troli System & Needle Management WebApp  
**Mobile Framework:** Flutter  
**Mobile Target:** Android Tablet

---

## 1. Executive Summary

Needle Management System adalah platform digital untuk mengelola proses penukaran, distribusi, inventory, traceability, dan analytics jarum sewing.

Sistem terdiri dari dua big modules:

### 1. Troli System — Android Tablet Application

Digunakan oleh **PIC Troli** dan dibangun menggunakan **Flutter Framework**.

Fokus:

- transaksi penukaran jarum;
- RFID operator identification;
- camera/photo evidence;
- broken needle validation;
- new needle issuance;
- stock validation;
- offline-first transaction;
- synchronization.

### 2. Needle Management WebApp

Digunakan oleh:

- **System Admin**
- **PIC Inventory**
- **Management**

Fokus:

- master data;
- inventory management;
- stock transfer;
- stock adjustment;
- monitoring seluruh troli;
- dashboard;
- analytics;
- reporting;
- authorized confirmation/approval.

Setiap factory memiliki tiga troli pada initial deployment. Setiap troli diperlakukan sebagai **Mobile Stock Location / Mobile Warehouse**.

```text
FACTORY
  |
  +-- MAIN WAREHOUSE
  |
  +-- TROLLEY 01
  +-- TROLLEY 02
  +-- TROLLEY 03
```

---

# 2. Background & Business Problem

Masalah yang ingin diselesaikan:

1. Pencatatan penukaran jarum masih berpotensi manual.
2. Identitas operator yang sering melakukan penukaran jarum harus dapat ditelusuri.
3. PIC Troli membutuhkan proses transaksi yang cepat.
4. Old Needle Type dan New Needle Type harus tercatat.
5. Exchange Type harus tercatat.
6. Broken needle harus memiliki kontrol terhadap patahan.
7. Jika patahan tidak ditemukan, diperlukan confirmation dari pihak yang berwenang.
8. Kondisi jarum perlu didokumentasikan melalui foto.
9. Pemberian jarum baru harus mengurangi stock troli.
10. Setiap factory memiliki beberapa troli dengan stock masing-masing.
11. PIC Inventory membutuhkan kontrol stock antar lokasi.
12. Management membutuhkan dashboard konsumsi dan inventory.
13. Management membutuhkan dashboard analytic terkait top Operator, top needle type yang sering ditukar.
14. Admin membutuhkan master data terpusat.
15. Seluruh aktivitas harus memiliki audit trail.

---

# 3. Product Vision

> Membangun platform Needle Management yang menyediakan end-to-end traceability dari inventory jarum, distribusi ke troli, proses penukaran oleh operator, sampai analisis konsumsi jarum.

```text
Factory
   |
   +-- Warehouse
   |
   +-- Trolley
          |
          +-- Stock
          |
          +-- Needle Exchange
                    |
                    +-- Operator
                    +-- PIC Troli
                    +-- Old Needle
                    +-- Exchange Type
                    +-- Photo
                    +-- New Needle
                    +-- Used Needle Storage
```

---

# 4. Product Goals

Sistem harus mampu:

- Mengidentifikasi operator menggunakan RFID.
- Mengidentifikasi PIC Troli.
- Mengidentifikasi troli dan factory transaksi.
- Mencatat Old Needle Type.
- Mencatat New Needle Type.
- Mencatat Exchange Type.
- Memvalidasi broken needle fragment.
- Menangani missing fragment confirmation.
- Mengirim notification WhatsApp.
- Mengambil foto jarum.
- Mengurangi stock jarum baru pada troli.
- Mencatat used needle.
- Menyediakan histori transaksi.
- Menyediakan audit trail.
- Mengelola inventory per factory dan per troli.
- Menyediakan dashboard dan analytics.

---

# 5. System Boundary

```text
                    NEEDLE MANAGEMENT SYSTEM

        +----------------------+----------------------+
        |                                             |
        v                                             v
+----------------------+                +----------------------+
| 1. TROLI SYSTEM     |                | 2. NEEDLE MANAGEMENT |
| Android Tablet      |                | WebApp               |
| Flutter             |                |                      |
+----------------------+                +----------------------+
| PIC Troli           |                | System Admin         |
| RFID                |                | PIC Inventory        |
| Exchange            |                | Management           |
| Camera              |                | Master Data          |
| Local DB            |                | Inventory            |
| Offline Sync        |                | Dashboard            |
+----------+-----------+                | Analytics            |
           |                            +----------+-----------+
           |                                       |
           +------------------+--------------------+
                              |
                              v
                     +------------------+
                     | CENTRAL BACKEND  |
                     | API / Services   |
                     +--------+---------+
                              |
                    +---------+---------+
                    |         |         |
                    v         v         v
                Database  File Store  Notification
                                      / WhatsApp
```

**Prinsip:** Android dan WebApp menggunakan backend yang sama sebagai **Single Source of Truth**.

---

# 6. Big Module 1 — Troli System Android App

## 6.1 Purpose

Aplikasi Android digunakan oleh **PIC Troli** untuk operasional penukaran jarum di area produksi.

Karakteristik:

- Android Tablet.
- Flutter Framework.
- Landscape orientation.
- Large touch target.
- Minimal keyboard input.
- Step-by-step transaction.
- Offline-first.
- RFID integration.
- Camera integration.
- Background synchronization.

## 6.2 Mobile User — PIC Troli

Hak akses:

- Login.
- Melihat informasi troli.
- Create exchange transaction.
- Scan RFID operator.
- Select Old Needle Type.
- Select Exchange Type.
- Validate broken needle.
- Request confirmation.
- Capture photo.
- Select New Needle Type.
- Issue new needle.
- Complete transaction.
- Melihat histori transaksi troli.
- Melihat stock troli.
- Melihat sync status.

PIC Troli tidak memiliki hak untuk mengubah master data.

---

# 7. Big Module 2 — Needle Management WebApp

## 7.1 System Admin

Hak akses:

- User management.
- Role management.
- Employee master.
- RFID master.
- Factory master.
- Trolley master.
- Needle Type master.
- Exchange Type master.
- Storage location master.
- Device configuration.
- System configuration.
- Audit trail.

## 7.2 PIC Inventory

Hak akses:

- Stock overview.
- Stock receiving.
- Stock transfer.
- Stock adjustment.
- Stock return.
- Physical count.
- Low stock monitoring.
- Stock movement.
- Inventory reporting.

## 7.3 Management

Hak akses:

- Dashboard.
- Analytics.
- Inventory monitoring.
- Needle exchange monitoring.
- Consumption analysis.
- Reporting.
- Export.
- Authorized confirmation/approval sesuai kewenangan.

---

# 8. Factory & Trolley Structure

Initial deployment:

```text
Factory A
 |
 +-- Main Warehouse
 |
 +-- Trolley A-01
 +-- Trolley A-02
 +-- Trolley A-03
```

Trolley adalah **Stock Location**.

Location hierarchy:

```text
Company
  |
  +-- Factory
        |
        +-- Main Warehouse
        |
        +-- Mobile Trolley
              |
              +-- Needle Stock
```

Dengan model ini sistem dapat menjawab:

- stock per factory;
- stock per trolley;
- trolley low stock;
- stock transfer;
- consumption per trolley;
- consumption per factory.

---

# 9. Mobile UI/UX Requirements

Aplikasi Android digunakan di area produksi dan harus dioptimalkan untuk transaksi cepat.

Prinsip:

- Landscape.
- Full screen.
- Tombol besar.
- Pilihan di tengah.
- Minimal input keyboard.
- One primary action per screen.
- Status transaksi sangat jelas.
- Confirmation sebelum final completion.

Target UI:

```text
Button Height      >= 64 dp
Primary Text       >= 20 sp
Orientation        Landscape
Touch Target       Large
```

---

# 10. Mobile Main Menu

```text
+------------------------------------------------+
| NEEDLE MOBILE                 TROLLEY A-01     |
|------------------------------------------------|
|                                                |
|              [ NEW EXCHANGE ]                  |
|                                                |
|------------------------------------------------|
| STOCK              TODAY EXCHANGE              |
|                                                |
| DBx1 #9   50       Broken       12             |
| DBx1 #11  80       Bent           8            |
| DPx5 #14  40       Changeover    10            |
|                                                |
|------------------------------------------------|
| HISTORY              SYNC STATUS               |
+------------------------------------------------+
```

---

# 11. Needle Exchange Flow

```text
PIC Login
   |
   v
Create Exchange
   |
   v
RFID Operator
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
   +--------------------------+
   |                          |
   v                          v
 BROKEN                   BENT / CHANGEOVER
   |
   v
Fragment Validation
   |
   +-------------------+
   |                   |
   v                   v
 FOUND              NOT FOUND
   |                   |
   |                   v
   |          Confirmation Request
   |                   |
   |                   v
   |          Authorized User
   |                   |
   +-------------------+
             |
             v
        Take Photo
             |
             v
    Select New Needle Type
             |
             v
       Validate Stock
             |
             v
       Issue Needle
             |
             v
      Store Used Needle
             |
             v
         Complete
```

---

# 12. RFID Operator Identification

Operator melakukan tap ID Card ke RFID reader.

System mengambil:

- Employee ID.
- Name.
- Department.
- Section.
- Line.
- Position.
- Status.

RFID hanya menjadi identifier. Employee Master tetap menjadi source of truth.

---

# 13. Exchange Type

Exchange Type:

```text
BROKEN
BENT
CHANGEOVER
```

**BROKEN:** jarum patah. Operator wajib membawa patahan.

**BENT:** jarum bengkok.

**CHANGEOVER:** penukaran karena perubahan kebutuhan needle type / production process.

---

# 14. Old Needle Type & New Needle Type

Keduanya wajib dipilih dari Needle Type Master.

Contoh:

```text
Old Needle:
DBx1 #11

New Needle:
DBx1 #11
```

Changeover:

```text
Old Needle:
DBx1 #11

New Needle:
DBx1 #14
```

---

# 15. Needle Compatibility Rules

### Broken

Default:

```text
Old Needle Type = New Needle Type
```

Jika berbeda, membutuhkan authorized override.

### Bent

Default:

```text
Old Needle Type = New Needle Type
```

Jika berbeda, membutuhkan authorized override.

### Changeover

```text
Old Needle Type != New Needle Type
```

diperbolehkan.

---

# 16. Broken Needle Management

Jika Exchange Type = BROKEN:

```text
Is Fragment Found?

[ YES — FOUND ]

[ NO — NOT FOUND ]
```

### Found

Transaksi dapat dilanjutkan.

### Not Found

Status:

```text
WAITING_CONFIRMATION
```

Sistem membuat confirmation request kepada authorized user sesuai konfigurasi.

---

# 17. WhatsApp Confirmation

WhatsApp hanya digunakan sebagai notification channel.

Contoh:

```text
NEEDLE MANAGEMENT SYSTEM

Needle Broken Confirmation Required

Factory       : Factory A
Trolley       : A-01
Operator      : EMP00123
Old Needle    : DBx1 #11
Exchange Type : Broken
Fragment      : NOT FOUND
PIC Troli     : PIC001
Time          : 09:15

Please review and confirm.

[ OPEN APPROVAL ]
```

Approval dilakukan melalui secure web/backend page.

WhatsApp bukan system of record.

---

# 18. Photo Evidence

PIC Troli mengambil foto jarum.

Metadata minimal:

```text
Photo ID
Transaction ID
Factory
Trolley
PIC
Device ID
Captured At
File URL / Object Key
```

---

# 19. Stock Validation During Exchange

Sebelum New Needle Issued:

```text
Check Trolley Stock
        |
        v
Available?
   |
   +---- NO ----> Block Transaction
   |
   YES
   |
   v
Issue Needle
```

Stock tidak boleh menjadi negatif.

Needle Issue dari exchange otomatis menghasilkan Stock Movement.

---

# 20. Inventory Model

Inventory dikelola berdasarkan:

```text
Factory
+
Location
+
Needle Type
+
Quantity
```

Contoh:

| Factory | Location | Needle Type | Qty |
| --- | --- | --- | ---: |
| Factory A | Warehouse | DBx1 #11 | 1,000 |
| Factory A | Trolley A-01 | DBx1 #11 | 80 |
| Factory A | Trolley A-02 | DBx1 #11 | 65 |
| Factory A | Trolley A-03 | DBx1 #11 | 92 |

---

# 21. Inventory Transaction Types

### Stock Receiving

```text
External Supplier
        |
        v
Main Warehouse
```

### Stock Transfer

```text
Main Warehouse
        |
        v
Trolley A-01
```

### Needle Issue

```text
Trolley A-01
        |
        v
Operator
```

Dibuat otomatis dari Needle Exchange.

### Stock Return

```text
Trolley
   |
   v
Warehouse
```

### Stock Adjustment

Untuk koreksi hasil physical count.

Wajib memiliki:

- reason;
- user;
- timestamp;
- approval sesuai konfigurasi;
- audit trail.

---

# 22. Par Stock

Setiap Trolley dapat memiliki minimum dan maximum stock per Needle Type.

| Needle | Min | Max | Current | Status |
| --- | ---: | ---: | ---: | --- |
| DBx1 #9 | 20 | 100 | 75 | Normal |
| DBx1 #11 | 20 | 100 | 15 | Low |
| DPx5 #14 | 10 | 50 | 5 | Critical |

Formula:

```text
Low Stock = Current Qty <= Minimum Qty
Refill Qty = Maximum Qty - Current Qty
```

---

# 23. WebApp — Master Data

### Organization

- Company.
- Factory.
- Department.
- Section.
- Line.

### People

- Employee.
- PIC Troli.
- PIC Inventory.
- Management.
- Role.

### Device

- Android Tablet.
- RFID Reader.
- Device Assignment.

### Trolley

- Trolley ID.
- Trolley Name.
- Factory.
- Status.
- Assigned Device.
- Assigned PIC.

### Needle

- Needle Type.
- Needle Code.
- Needle Name.
- Size.
- Specification.
- Status.

### Exchange

- Exchange Type.
- Description.
- Rules.

### Storage

- Storage Location.
- Compartment.
- Exchange Type mapping.

---

# 24. WebApp — Inventory Management

Menu:

```text
Inventory
 |
 +-- Stock Overview
 +-- Stock Receiving
 +-- Stock Transfer
 +-- Stock Issue
 +-- Stock Return
 +-- Stock Adjustment
 +-- Stock Movement
 +-- Low Stock
 +-- Physical Count
```

---

# 25. Stock Transfer

PIC Inventory dapat memindahkan stock:

```text
Warehouse
     |
     +----> Trolley A-01
     +----> Trolley A-02
     +----> Trolley A-03
```

Transfer memiliki:

```text
Transfer ID
From Location
To Location
Needle Type
Quantity
Requested By
Approved By (if required)
Created At
Status
```

Status:

```text
DRAFT
REQUESTED
APPROVED
IN_TRANSIT
COMPLETED
CANCELLED
```

---

# 26. Stock Movement Ledger

Semua perubahan stock menghasilkan stock movement.

Contoh:

```text
Opening       +100
Receiving     +500
Transfer Out   -50
Needle Issue    -1
Adjustment      -2
```

Current Stock:

```text
547
```

Stock balance adalah current state; Stock Movement menjadi audit ledger.

---

# 27. Dashboard & Analytics

Management Dashboard:

### KPI

- Total Needle Exchange.
- Broken.
- Bent.
- Changeover.
- Total Needle Consumption.
- Current Inventory.
- Low Stock Trolley.
- Critical Stock.
- Missing Fragment.
- Pending Confirmation.

### Breakdown

- By Factory.
- By Trolley.
- By Needle Type.
- By Exchange Type.
- By Operator.
- By Line.
- By Period.

---

# 28. Dashboard Example

```text
NEEDLE MANAGEMENT DASHBOARD

Total Exchange        1,250
Needle Consumption    1,250
Broken                  420
Bent                    350
Changeover              480

-----------------------------------------------

FACTORY A

Warehouse Stock       10,500

Trolley A-01             850
Trolley A-02             720
Trolley A-03             910

Low Stock Trolley          1
Pending Confirmation       2
```

---

# 29. Analytics

Management dapat menganalisis:

- Needle consumption trend.
- Consumption per factory.
- Consumption per trolley.
- Consumption per needle type.
- Broken needle trend.
- Bent needle trend.
- Changeover trend.
- Operator exchange frequency.
- Line consumption.
- Missing fragment frequency.
- Stock turnover.
- Stock variance.

---

# 30. User & Role Matrix

| Feature | PIC Troli | PIC Inventory | Management | System Admin |
| --- | :---: | :---: | :---: | :---: |
| Needle Exchange | ✓ | - | View | - |
| RFID Operator | ✓ | - | View | Configure |
| Photo | ✓ | View | View | View |
| Stock Trolley | View | ✓ | View | ✓ |
| Stock Transfer | - | ✓ | View | ✓ |
| Stock Adjustment | - | ✓ | Approve/View | ✓ |
| Master Data | - | - | View | ✓ |
| Dashboard | Limited | ✓ | ✓ | ✓ |
| Analytics | Limited | ✓ | ✓ | ✓ |
| User Management | - | - | - | ✓ |
| Audit Trail | Own | ✓ | ✓ | ✓ |
| Confirmation Approval | - | - | ✓ | Configure |

---

# 31. Security & Authorization

Backend menggunakan RBAC.

Roles:

```text
SYSTEM_ADMIN
PIC_TROLI
PIC_INVENTORY
MANAGEMENT
```

Authorization berbasis:

```text
Role
+
Factory Scope
+
Location Scope
+
Action Permission
```

Contoh:

PIC Inventory Factory A tidak otomatis dapat mengubah inventory Factory B.

---

# 32. Audit Trail

Audit trail minimal:

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

---

# 33. Android Architecture

Flutter application:

```text
Presentation
     |
Application
     |
Domain
     |
Repository
     |
Datasource
   /       Local       Remote
DB          API
```

Recommended:

- Flutter Stable.
- Riverpod.
- GoRouter.
- Dio.
- Drift/SQLite.
- Camera plugin.
- RFID SDK integration.
- Secure Storage.
- Connectivity monitoring.
- Background Sync.

---

# 34. WebApp Architecture

```text
Web Browser
     |
Web Frontend
     |
API Gateway
     |
Backend Application
     |
+----+----+----+----+----+
|    |    |    |    |    |
Auth Inventory Exchange Master Analytics Audit
     |
     v
PostgreSQL
     |
     +-- Object Storage
     |
     +-- Notification Service
```

---

# 35. Central Backend Principle

Android dan WebApp tidak memiliki database transaksi terpisah.

```text
             Android Flutter
                    |
                    v
              CENTRAL API
                    |
              CENTRAL BACKEND
                    |
       +------------+------------+
       |            |            |
   PostgreSQL   Object Store  Notification
       |
       +----------------+
       |                |
   Android App       WebApp
```

Backend adalah **Single Source of Truth**.

---

# 36. Offline-First Android

Android tetap dapat bekerja saat koneksi tidak tersedia.

```text
Android
 |
 +-- Local Master Data
 +-- Local Transaction
 +-- Local Photo
 +-- Sync Queue
 |
 +------ Internet Available ------+
                                  |
                                  v
                              Backend
```

Sync states:

```text
LOCAL_ONLY
SYNC_PENDING
SYNCING
SYNCED
SYNC_FAILED
```

Conflict handling menggunakan transaction ID dan server-side validation.

---

# 37. Device & Trolley Binding

Setiap Android Tablet terdaftar di WebApp.

```text
Device
  |
  +-- Device ID
  +-- Factory
  +-- Trolley
  +-- Status
```

Contoh:

```text
Device:
NM-TAB-001

Factory:
Factory A

Trolley:
A-01
```

Saat PIC login, sistem mengetahui:

```text
PIC
+
Device
+
Trolley
+
Factory
```

PIC tidak perlu memilih trolley secara manual setiap transaksi.

---

# 38. Photo Storage

Foto disimpan pada object storage.

```text
Android
   |
   v
Object Storage
   |
   v
Object Key / File URL
   |
   v
Transaction Metadata
```

Database menyimpan metadata, bukan binary photo utama.

---

# 39. Non-Functional Requirements

## Mobile Performance

- RFID identification target < 2 detik.
- Local transaction save < 2 detik.
- Local photo save < 5 detik.
- UI tetap responsive saat offline.
- Sync asynchronous.

## Web Performance

- Dashboard initial load target < 3 detik pada kondisi normal.
- Standard CRUD response target < 2 detik.
- Large report/export berjalan asynchronous.

## Availability

```text
Backend >= 99%
```

## Security

- HTTPS.
- Secure token.
- RBAC.
- Audit trail.
- Encrypted local sensitive data.
- Session timeout.
- Device registration.

---

# 40. High-Level Data Model

```text
FACTORY
   |
   +-- LOCATION
          |
          +-- WAREHOUSE
          +-- TROLLEY
                 |
                 +-- STOCK

EMPLOYEE
   |
   +-- RFID_CARD

NEEDLE_TYPE
   |
   +-- STOCK
   +-- EXCHANGE_TRANSACTION

EXCHANGE_TRANSACTION
   |
   +-- OPERATOR
   +-- PIC_TROLI
   +-- FACTORY
   +-- TROLLEY
   +-- OLD_NEEDLE
   +-- NEW_NEEDLE
   +-- EXCHANGE_TYPE
   +-- PHOTO
   +-- CONFIRMATION
   +-- STOCK_MOVEMENT

STOCK_TRANSFER
   |
   +-- FROM_LOCATION
   +-- TO_LOCATION
   +-- NEEDLE_TYPE
```

---

# 41. Core Transaction Entity

```text
transaction_id
factory_id
trolley_id
operator_id
pic_troli_id

old_needle_type_id
new_needle_type_id
exchange_type_id

broken_fragment_status
confirmation_status

photo_status
stock_status

status

created_at
completed_at
```

---

# 42. Stock Entity

```text
stock_id
factory_id
location_id
needle_type_id
quantity
minimum_quantity
maximum_quantity
updated_at
```

Unique:

```text
factory_id
+
location_id
+
needle_type_id
```

---

# 43. Stock Movement Entity

```text
movement_id
movement_type
reference_id
factory_id
from_location_id
to_location_id
needle_type_id
quantity
balance_before
balance_after
created_by
created_at
```

Movement types:

```text
RECEIVING
TRANSFER
ISSUE
RETURN
ADJUSTMENT
```

---

# 44. Transaction State

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
```

---

# 45. Business Rules

1. Setiap transaction memiliki satu operator.
2. Operator harus diidentifikasi.
3. Old Needle Type wajib dipilih.
4. Exchange Type wajib dipilih.
5. New Needle Type wajib dipilih.
6. Broken wajib melakukan fragment validation.
7. Missing fragment wajib mendapatkan confirmation.
8. WhatsApp hanya notification channel.
9. Approval harus tercatat di backend.
10. New Needle Type harus tersedia di stock trolley.
11. Stock tidak boleh menjadi negatif.
12. Needle Issue dari exchange otomatis menghasilkan Stock Movement.
13. Stock Transfer menghasilkan movement dari source ke destination.
14. Stock Adjustment harus memiliki reason.
15. Transaction completed tidak boleh dihapus permanen.
16. Correction menggunakan audited correction/void mechanism.
17. Setiap transaction memiliki Factory dan Trolley.
18. PIC Troli tidak boleh mengubah master data.
19. Master data dikelola System Admin.
20. PIC Inventory bertanggung jawab atas stock movement.
21. Management memiliki akses monitoring dan analytics.
22. Semua stock movement harus dapat ditelusuri sampai source transaction.

---

# 46. Acceptance Criteria — Android Troli

- [ ] PIC Troli dapat login.
- [ ] Device terikat dengan Trolley.
- [ ] Factory dan Trolley otomatis diketahui.
- [ ] RFID operator berhasil di-scan.
- [ ] Data operator tampil.
- [ ] Old Needle Type dapat dipilih.
- [ ] Exchange Type dapat dipilih.
- [ ] Broken validation berjalan.
- [ ] Missing fragment menghasilkan confirmation request.
- [ ] Notification WhatsApp dapat dikirim.
- [ ] Photo dapat diambil.
- [ ] New Needle Type dapat dipilih.
- [ ] Stock tersedia divalidasi.
- [ ] Needle issue mengurangi stock.
- [ ] Used needle dapat dicatat.
- [ ] Transaction dapat completed.
- [ ] Transaction dapat dilakukan offline.
- [ ] Offline transaction dapat disinkronkan.

---

# 47. Acceptance Criteria — WebApp

- [ ] System Admin dapat mengelola master data.
- [ ] Factory dapat dikelola.
- [ ] Trolley dapat dikelola.
- [ ] Device dapat di-bind ke Trolley.
- [ ] Employee dapat dikelola.
- [ ] RFID dapat dikelola.
- [ ] Needle Type dapat dikelola.
- [ ] PIC Inventory dapat melihat stock.
- [ ] PIC Inventory dapat melakukan receiving.
- [ ] PIC Inventory dapat melakukan transfer.
- [ ] PIC Inventory dapat melakukan adjustment.
- [ ] Stock movement dapat dilihat.
- [ ] Low stock dapat dimonitor.
- [ ] Management dapat melihat dashboard.
- [ ] Management dapat melihat analytics.
- [ ] Report dapat difilter.
- [ ] Audit trail tersedia.

---

# 48. Success Metrics

| Metric | Target |
| --- | ---: |
| Digital Transaction Adoption | >= 95% |
| RFID Identification Success | >= 99% |
| Transaction Traceability | 100% |
| Stock Movement Traceability | 100% |
| Missing Photo | 0 |
| Negative Stock | 0 |
| Missing Fragment Confirmation Compliance | 100% |
| Manual Recording Reduction | >= 90% |
| Backend Availability | >= 99% |

---

# 49. Development Team Boundaries

## Mobile Apps Development Team

Responsible:

- Flutter Android App.
- Tablet UI/UX.
- RFID integration.
- Camera integration.
- Local database.
- Offline transaction.
- Sync engine.
- Device binding.
- Mobile security.
- APK release.

## WebApps Development Team

Responsible:

- WebApp UI.
- Master Data.
- Inventory.
- Dashboard.
- Analytics.
- Reporting.
- User management.

## Shared Backend/API Team

Recommended responsibility:

- Authentication.
- Authorization.
- Employee service.
- Needle exchange service.
- Inventory service.
- Stock ledger.
- Master data API.
- File storage.
- Notification service.
- Audit service.
- Synchronization API.

---

# 50. Development Architecture Principle

Mobile dan WebApp tidak boleh memiliki business rule yang berbeda.

Business rule utama berada pada backend/domain layer.

```text
Android
   |
   | local validation for UX
   v
Backend
   |
   | final business validation
   v
Stock Ledger / Transaction
```

Backend adalah final authority.

---

# 51. Recommended Development Phases

## Phase 1 — Foundation

- Backend skeleton.
- Authentication.
- RBAC.
- Factory.
- Trolley.
- Employee.
- RFID.
- Needle Type.
- Exchange Type.

## Phase 2 — Android Troli

- Login.
- Device binding.
- RFID.
- Exchange flow.
- Camera.
- Offline DB.
- Sync.

## Phase 3 — Inventory WebApp

- Warehouse.
- Trolley stock.
- Receiving.
- Transfer.
- Adjustment.
- Stock ledger.

## Phase 4 — Confirmation & Notification

- Broken fragment workflow.
- Confirmation request.
- WhatsApp notification.
- Secure approval.

## Phase 5 — Dashboard

- Exchange dashboard.
- Inventory dashboard.
- Consumption analytics.
- Reporting.

## Phase 6 — Pilot Factory

Pilot:

```text
1 Factory
3 Trolleys
```

Setelah stabil, rollout ke factory lainnya.

---

# 52. Future Expansion

Architecture harus siap untuk:

- More factories.
- More trolleys.
- Barcode / QR.
- Smart storage.
- IoT sensor.
- Sewing machine integration.
- ERP integration.
- AI image recognition.
- Predictive needle consumption.

---

# 53. Key Architectural Decision

> **Two Experience Layers, One System of Record.**

```text
              PIC TROLI
                  |
                  v
           Android Flutter
           Fast Operation
                  |
                  v
            CENTRAL BACKEND
          Single Source of Truth
                  ^
                  |
           Web Management
                  |
       +----------+----------+
       |          |          |
     Admin    Inventory   Management
```

Android dioptimalkan untuk **speed of transaction**.

WebApp dioptimalkan untuk **control, management, inventory, and analytics**.

Keduanya tidak boleh memiliki database transaksi terpisah.

---

# 54. Final Product Definition

Produk final adalah:

> **Needle Management System — platform untuk mengelola needle exchange, needle inventory, stock movement, traceability, dan analytics melalui Android Troli System dan Web Management System.**

```text
+------------------------------------------------------+
|              NEEDLE MANAGEMENT SYSTEM                |
+------------------------------------------------------+
|                                                      |
|  01. TROLI SYSTEM          02. NEEDLE MANAGEMENT     |
|      Android Flutter           WebApp                |
|                                                      |
|      PIC Troli                 System Admin          |
|      RFID                      PIC Inventory         |
|      Exchange                  Management            |
|      Camera                                          |
|      Offline                   Master Data            |
|      Sync                      Inventory              |
|                                Dashboard              |
|                                Analytics              |
|                                                      |
+------------------------------------------------------+
                         |
                         v
                  CENTRAL BACKEND
                         |
             +-----------+-----------+
             |                       |
          DATABASE               FILE STORAGE
             |
          STOCK LEDGER
```

---

# 55. Recommended Next Documents

1. `02-Business-Process.md`
2. `03-Use-Case.md`
3. `04-Mobile-SRS.md`
4. `05-WebApp-SRS.md`
5. `06-System-Architecture.md`
6. `07-Database-ERD.md`
7. `08-API-Specification.md`
8. `09-Mobile-UIUX-Specification.md`
9. `10-WebApp-UIUX-Specification.md`
10. `11-RFID-Integration.md`
11. `12-WhatsApp-Integration.md`
12. `13-Offline-Sync-Design.md`
13. `14-Security-Design.md`
14. `15-Test-Strategy-UAT.md`
15. `16-Deployment-Architecture.md`

---

# 56. Architecture Summary

```text
                         FACTORY
                            |
              +-------------+-------------+
              |                           |
        MAIN WAREHOUSE                3 TROLLEYS
              |                           |
              |                 +---------+---------+
              |                 |         |         |
              |               T-01      T-02      T-03
              |                 |         |         |
              |                 +---------+---------+
              |                           |
              +-------------+-------------+
                            |
                       CENTRAL BACKEND
                            |
          +-----------------+-----------------+
          |                 |                 |
       Exchange          Inventory         Analytics
          |                 |                 |
          +-----------------+-----------------+
                            |
                 +----------+----------+
                 |                     |
          Android Flutter          WebApp
            PIC Troli       Admin/Inventory/Management
```

**End of PRD**

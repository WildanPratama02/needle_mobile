# 07 — SRS Mobile Android
# Needle Management System — Troli Application

**Version:** 1.0  
**Status:** Draft / Development Baseline  
**Platform:** Android Tablet  
**Framework:** Flutter / Dart  
**Primary User:** PIC Troli  
**Reference:** PRD, Business Process, Use Case, Functional Requirements, System Architecture, Application Architecture

---

# 1. Document Purpose

Dokumen ini mendefinisikan Software Requirements Specification (SRS) untuk **Troli System**, yaitu aplikasi Android Tablet yang digunakan oleh **PIC Troli** untuk menjalankan operasional penukaran jarum di production floor.

Dokumen ini merupakan turunan langsung dari architecture sebelumnya dan dimaksudkan sebagai baseline untuk:

- Mobile Apps Development Team;
- UI/UX Designer;
- Backend/API Team;
- QA/Test Team;
- System Analyst;
- Solution/Technical Architect.

Fokus dokumen adalah aplikasi Android Tablet. WebApp dibahas pada dokumen SRS terpisah.

---

# 2. Product Scope

Mobile application digunakan untuk:

1. login PIC Troli;
2. mengenali factory, trolley, dan device;
3. melakukan scan RFID operator;
4. membuat transaksi penukaran jarum;
5. memilih type jarum lama;
6. memilih type penukaran;
7. menangani kasus jarum patah;
8. meminta confirmation ketika patahan jarum tidak ditemukan;
9. mengambil foto jarum;
10. memilih type jarum baru;
11. melakukan validasi stock trolley;
12. mengeluarkan jarum baru;
13. mencatat penyimpanan jarum bekas;
14. menyelesaikan transaksi;
15. menyimpan transaksi secara offline;
16. melakukan synchronization ketika koneksi tersedia;
17. menampilkan stock trolley;
18. menampilkan history transaksi.

---

# 3. User

## 3.1 PIC Troli

PIC Troli adalah user utama Android Tablet.

Hak akses utama:

- login;
- melihat trolley context;
- membuat exchange;
- scan operator;
- memilih needle;
- memilih exchange type;
- mengambil photo;
- melihat stock trolley;
- menyelesaikan transaction;
- melihat history;
- melihat synchronization status.

PIC Troli tidak boleh:

- mengubah master data;
- melakukan stock adjustment;
- melakukan stock transfer;
- melakukan approval confirmation;
- mengubah stock secara manual.

---

# 4. Device Context

Setelah login, aplikasi harus memiliki context:

```text
User
Factory
Trolley
Device
```

Contoh:

```text
User    : PIC-001
Factory : Factory-A
Trolley : TROL-A-01
Device  : TAB-A-01
```

Context harus berasal dari backend/device binding dan tidak boleh dipilih ulang secara bebas oleh PIC pada setiap transaksi.

---

# 5. Functional Scope

```text
Mobile App
|
+-- Authentication
+-- Trolley Context
+-- Home
+-- Needle Exchange
+-- Broken Needle Confirmation
+-- Photo Evidence
+-- Trolley Stock
+-- Transaction History
+-- Offline
+-- Synchronization
+-- Settings
```

---

# 6. Authentication

## FR-MOB-001 Login

PIC harus dapat login ke aplikasi.

### Input

- username / employee ID;
- password/PIN atau authentication mechanism yang disepakati.

### Process

```text
Enter Credential
      |
      v
Authenticate API
      |
 +----+----+
 |         |
Success   Failed
 |         |
 v         v
Load      Error
Context
```

### Success

Aplikasi mendapatkan:

- user;
- role;
- factory;
- trolley;
- device;
- permissions;
- session/token.

### Failure

Aplikasi menampilkan error yang dapat dipahami user.

---

# 7. Device & Trolley Validation

## FR-MOB-002 Device Validation

Saat login atau startup, aplikasi harus memastikan device terdaftar dan aktif.

Possible states:

```text
ACTIVE
INACTIVE
REVOKED
UNKNOWN
```

Jika device tidak valid:

```text
LOGIN BLOCKED
```

PIC tidak boleh menggunakan device tersebut untuk transaction.

---

# 8. Home Screen

Home harus mengutamakan operational transaction.

Recommended layout:

```text
+--------------------------------------------------+
| Factory A        Trolley A-01       ONLINE       |
+--------------------------------------------------+
|                                                  |
|             [ NEW EXCHANGE ]                    |
|                                                  |
|             [ TROLLEY STOCK ]                   |
|                                                  |
|             [ HISTORY ]                         |
|                                                  |
+--------------------------------------------------+
| Sync: All transactions synchronized              |
+--------------------------------------------------+
```

Requirement:

- large touch target;
- minimum keyboard usage;
- primary action berada di area tengah;
- status connection terlihat;
- status synchronization terlihat.

---

# 9. Needle Exchange — Overview

Core flow:

```text
Create Exchange
      |
      v
RFID Operator
      |
      v
Old Needle Type
      |
      v
Exchange Type
      |
      v
Broken Validation
      |
      v
Photo
      |
      v
New Needle Type
      |
      v
Stock Validation
      |
      v
Issue Needle
      |
      v
Used Needle Storage
      |
      v
Complete
```

---

# 10. Create Exchange

## FR-MOB-003 Create Exchange

PIC menekan:

```text
NEW EXCHANGE
```

System membuat draft transaction.

Minimum data:

```text
client_transaction_id
factory_id
trolley_id
device_id
pic_user_id
created_at
status
```

Initial state:

```text
DRAFT
```

---

# 11. RFID Operator

## FR-MOB-004 Scan RFID

PIC melakukan scan ID card operator menggunakan RFID reader.

Flow:

```text
SCAN RFID
    |
    v
RFID Identifier
    |
    v
Employee Lookup
    |
 +--+---+
 |      |
Found  Not Found
 |      |
 v      v
Continue Error
```

Jika operator ditemukan, tampilkan:

- Employee ID;
- Employee Name;
- relevant operator information.

Jika tidak ditemukan:

```text
Operator tidak ditemukan
```

PIC tidak boleh mengarang atau memasukkan operator secara manual tanpa authorization mechanism yang ditetapkan.

---

# 12. Operator Confirmation

Setelah RFID berhasil:

```text
Operator
Employee ID
Employee Name
```

Tampilkan tombol:

```text
[ CONFIRM OPERATOR ]
```

PIC melakukan konfirmasi sebelum melanjutkan.

State:

```text
OPERATOR_IDENTIFIED
```

---

# 13. Old Needle Type

## FR-MOB-005 Select Old Needle Type

PIC harus memilih type jarum yang akan ditukar.

Needle type berasal dari Needle Master.

UI harus mendukung:

- search;
- list;
- category/filter jika diperlukan;
- selected state.

Contoh:

```text
SELECT NEEDLE TYPE

[ Search Needle ]

[ Needle Type A ]
[ Needle Type B ]
[ Needle Type C ]
[ Needle Type D ]
```

Selected needle menjadi bagian dari exchange transaction.

---

# 14. Exchange Type

## FR-MOB-006 Select Exchange Type

PIC memilih salah satu:

```text
JARUM PATAH
JARUM BENGKOK
CHANGEOVER
```

UI menggunakan large buttons.

Example:

```text
+-----------------------+
|     JARUM PATAH       |
+-----------------------+

+-----------------------+
|    JARUM BENGKOK      |
+-----------------------+

+-----------------------+
|      CHANGEOVER       |
+-----------------------+
```

State:

```text
NEEDLE_SELECTED
EXCHANGE_TYPE_SELECTED
```

---

# 15. Broken Needle Flow

Jika:

```text
Exchange Type = JARUM PATAH
```

maka aplikasi wajib menjalankan fragment validation.

---

# 16. Broken Fragment Validation

## FR-MOB-007 Fragment Status

PIC memilih status:

```text
[ PATAHAN DITEMUKAN ]
[ PATAHAN TIDAK DITEMUKAN ]
```

### Patahan ditemukan

Transaction dapat melanjutkan ke photo.

```text
FRAGMENT_FOUND
```

### Patahan tidak ditemukan

System membuat confirmation request.

```text
FRAGMENT_NOT_FOUND
       |
       v
CONFIRMATION_REQUIRED
```

---

# 17. Missing Fragment Confirmation

## FR-MOB-008 Confirmation Request

Ketika patahan tidak ditemukan:

1. transaction tidak langsung selesai;
2. system membuat confirmation record;
3. system mengirim notification ke supervisor melalui WhatsApp integration;
4. transaction menunggu keputusan approver;
5. PIC dapat melihat status confirmation.

Flow:

```text
Missing Fragment
       |
       v
Create Confirmation
       |
       v
Notify Supervisor
       |
       v
WAITING_APPROVAL
       |
   +---+---+
   |       |
APPROVED REJECTED
   |       |
   v       v
Continue  Block
```

WhatsApp hanya digunakan sebagai notification channel.

Approval authority tetap berada pada system.

---

# 18. Confirmation Status

Minimum states:

```text
NOT_REQUIRED
PENDING
APPROVED
REJECTED
```

Jika `PENDING`, PIC tidak boleh melakukan completion transaction.

Jika `REJECTED`, transaction menjadi blocked/cancelled sesuai backend state.

---

# 19. Photo Evidence

## FR-MOB-009 Capture Photo

PIC harus melakukan foto jarum yang ditukar.

UI:

```text
+--------------------------------+
|                                |
|          CAMERA VIEW           |
|                                |
|                                |
|             ( O )              |
|                                |
+--------------------------------+
```

Actions:

```text
[ RETAKE ]
[ USE PHOTO ]
```

Photo harus terkait dengan Exchange ID.

---

# 20. Photo Requirements

Minimum metadata:

```text
photo_id
exchange_id
file_reference
captured_at
device_id
created_by
```

Photo binary disimpan pada object storage.

Mobile menyimpan temporary/local copy jika transaction belum synchronized.

---

# 21. New Needle Type

## FR-MOB-010 Select New Needle

PIC memilih needle baru yang akan diberikan kepada operator.

Default behavior:

```text
New Needle Type = Old Needle Type
```

Tetapi sistem tetap harus menampilkan dan memvalidasi needle type.

Jika business policy mengharuskan exact match:

```text
Old Needle Type
       =
New Needle Type
```

Jika tidak match:

```text
NEW NEEDLE TYPE NOT MATCHED
```

transaction tidak boleh dilanjutkan tanpa rule yang valid dari backend.

---

# 22. Stock Validation

## FR-MOB-011 Validate Trolley Stock

Sebelum issue, system melakukan validation terhadap stock trolley.

Input:

```text
factory_id
trolley_id
needle_type_id
quantity = 1
```

Backend melakukan authoritative validation.

Result:

```text
AVAILABLE
NOT_AVAILABLE
```

---

# 23. Stock Available

Jika stock tersedia:

```text
Stock Available
      |
      v
[ ISSUE NEEDLE ]
```

PIC melakukan confirmation.

---

# 24. Stock Not Available

Jika stock tidak tersedia:

```text
STOCK_NOT_AVAILABLE
```

UI harus menampilkan:

```text
Stock jarum tidak tersedia pada trolley ini.
```

Transaction tidak boleh melakukan negative stock.

PIC tidak boleh mengubah quantity secara manual.

---

# 25. Issue New Needle

## FR-MOB-012 Issue Needle

Saat PIC menekan Issue:

Backend melakukan atomic transaction:

```text
Validate Stock
     |
     v
Create Issue
     |
     v
Create Stock Movement
     |
     v
Update Balance
     |
     v
Commit
```

Jika gagal:

```text
Rollback
```

---

# 26. Used Needle Storage

Setelah jarum baru diberikan:

PIC memasukkan jarum lama ke lubang penyimpanan sesuai exchange type.

System mencatat:

```text
storage_type
exchange_type
exchange_id
stored_at
stored_by
```

Contoh mapping:

```text
JARUM PATAH     -> Broken Needle Hole
JARUM BENGKOK   -> Bent Needle Hole
CHANGEOVER      -> Changeover Hole
```

Mapping final dapat dikelola melalui master/configuration apabila diperlukan.

---

# 27. Complete Exchange

## FR-MOB-013 Complete Transaction

Transaction dapat complete apabila:

- operator valid;
- old needle type valid;
- exchange type valid;
- broken confirmation sudah approved jika diperlukan;
- photo tersedia;
- new needle type valid;
- stock issue berhasil;
- used needle storage dicatat.

State:

```text
COMPLETED
```

---

# 28. Transaction State Machine

```text
DRAFT
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
 +----------------------------+
 |                            |
 | BROKEN                     | BENT / CHANGEOVER
 v                            |
FRAGMENT_VALIDATION            |
 |                            |
 +------------+---------------+
              |
              v
           PHOTO
              |
              v
      NEW_NEEDLE_SELECTED
              |
              v
       STOCK_VALIDATION
              |
        +-----+------+
        |            |
    AVAILABLE    NOT_AVAILABLE
        |            |
        v            v
      ISSUE         BLOCKED
        |
        v
USED_NEEDLE_STORED
        |
        v
COMPLETED
```

Broken branch:

```text
FRAGMENT_NOT_FOUND
       |
       v
CONFIRMATION_REQUIRED
       |
       v
PENDING
   +---+---+
   |       |
APPROVED REJECTED
   |       |
   v       v
PHOTO     BLOCKED
```

---

# 29. Transaction Cancellation

Cancellation policy harus dikontrol backend.

Possible states:

```text
CANCELLED
```

Cancellation harus mencatat:

```text
cancelled_by
cancelled_at
reason
```

Jika stock issue sudah committed, cancellation tidak boleh sekadar menghapus transaction. Reversal harus menggunakan stock movement/reversal policy.

---

# 30. Mobile Transaction History

## FR-MOB-014 History

PIC dapat melihat transaction yang terkait dengan trolley/factory scope.

Minimum columns:

```text
Date
Time
Operator
Old Needle
Exchange Type
New Needle
Status
Sync Status
```

Filter:

```text
Today
Date Range
Status
Needle Type
Exchange Type
```

---

# 31. Trolley Stock

## FR-MOB-015 Stock View

PIC dapat melihat stock trolley.

Example:

```text
TROLLEY A-01

Needle Type A       20
Needle Type B       15
Needle Type C        7
Needle Type D        0
```

Status:

```text
AVAILABLE
LOW STOCK
OUT OF STOCK
```

Threshold berasal dari backend configuration.

---

# 32. Connection Status

Application harus selalu menampilkan:

```text
ONLINE
OFFLINE
SYNCING
SYNC ERROR
```

Example:

```text
ONLINE  ●
```

atau:

```text
OFFLINE ●
Pending: 3
```

---

# 33. Offline Transaction

Jika network unavailable, aplikasi tetap dapat membuat transaction sesuai offline policy.

```text
PIC
 |
 v
Create Exchange
 |
 v
Local DB
 |
 v
SYNC_PENDING
```

Data minimal:

```text
client_transaction_id
user_id
factory_id
trolley_id
device_id
operator_id
old_needle_id
exchange_type_id
fragment_status
photo_reference
new_needle_id
created_at
```

---

# 34. Offline Restriction

Offline mode tidak boleh dianggap sebagai bypass business rule.

Contoh:

```text
Mobile says stock = 5
Server later says stock = 1
```

Server tetap authoritative.

Pada sync:

```text
Server Validation
      |
 +----+----+
 |         |
Valid    Conflict
 |         |
 v         v
Commit   Conflict
```

---

# 35. Synchronization

## FR-MOB-016 Sync

Sync engine berjalan:

- ketika network tersedia;
- saat application resume;
- setelah transaction dibuat;
- melalui manual retry;
- sesuai background sync policy Android.

Queue:

```text
SYNC_PENDING
     |
     v
SYNCING
     |
 +---+---+
 |       |
OK     ERROR
 |       |
 v       v
SYNCED RETRY
```

---

# 36. Idempotency

Setiap transaction wajib memiliki:

```text
client_transaction_id
```

Server harus memastikan retry tidak membuat duplicate exchange atau duplicate stock deduction.

---

# 37. Sync Conflict

Possible conflicts:

```text
STOCK_CHANGED
MASTER_DATA_CHANGED
TRANSACTION_ALREADY_EXISTS
INVALID_STATE
PERMISSION_CHANGED
DEVICE_REVOKED
```

UI:

```text
SYNC CONFLICT

Transaction:
EX-2026-000123

Reason:
Stock changed on server.

[ VIEW DETAIL ]
[ RETRY ]
```

Conflict tidak boleh di-silent overwrite.

---

# 38. Local Database

Recommended conceptual tables:

```text
local_user_session
local_factory
local_trolley
local_device
local_employee
local_rfid
local_needle
local_exchange_type
local_stock_snapshot
local_exchange
local_exchange_photo
local_confirmation
local_sync_queue
local_sync_error
```

---

# 39. API Client

Mobile API layer harus dipisahkan dari UI.

```text
Presentation
    |
Use Case
    |
Repository
    |
Remote Data Source
    |
HTTP Client
    |
REST API
```

Recommended responsibilities:

```text
AuthApi
EmployeeApi
NeedleApi
ExchangeApi
InventoryApi
ConfirmationApi
SyncApi
PhotoApi
DeviceApi
```

---

# 40. Error Handling

Error harus memiliki:

```text
Technical Error
Business Error
Network Error
Authentication Error
Authorization Error
Conflict Error
```

Example:

```text
STOCK_NOT_AVAILABLE
```

UI:

> Stock jarum yang dipilih tidak tersedia pada trolley.

Tidak menampilkan stack trace kepada PIC.

---

# 41. Retry Policy

Retry otomatis hanya untuk error yang safe untuk retry.

Safe examples:

```text
NETWORK_TIMEOUT
TEMPORARY_SERVER_ERROR
```

Tidak otomatis retry:

```text
STOCK_NOT_AVAILABLE
ACCESS_DENIED
DEVICE_REVOKED
CONFIRMATION_REJECTED
INVALID_STATE
```

Idempotency wajib digunakan untuk transaction retry.

---

# 42. UI/UX Requirements

## 42.1 Tablet First

UI harus:

- landscape-first;
- large touch target;
- high readability;
- minimal typing;
- clear status;
- large primary action;
- linear workflow;
- confirmation before critical action.

---

# 43. UI Interaction Principle

Primary transaction:

```text
ONE SCREEN
ONE DECISION
ONE PRIMARY ACTION
```

Contoh:

```text
Apa type penukarannya?

+---------------------------+
|       JARUM PATAH         |
+---------------------------+

+---------------------------+
|      JARUM BENGKOK        |
+---------------------------+

+---------------------------+
|        CHANGEOVER         |
+---------------------------+
```

---

# 44. Accessibility / Production Floor

Minimum:

- text readable from normal tablet distance;
- touch target tidak terlalu kecil;
- critical status tidak hanya dibedakan dengan warna;
- error message singkat;
- destructive action menggunakan confirmation;
- tidak bergantung pada keyboard;
- camera preview cukup besar.

---

# 45. Security Requirements

Mobile harus:

- menggunakan HTTPS;
- menyimpan token secara secure;
- tidak menyimpan credential plaintext;
- melakukan session expiration;
- memvalidasi device;
- menerapkan permission;
- menghapus local sensitive data sesuai policy;
- tidak melakukan direct database access.

---

# 46. Audit Requirements

Mobile harus mengirim informasi actor/context pada transaction.

Minimum:

```text
user_id
factory_id
trolley_id
device_id
client_transaction_id
timestamp
```

Audit authoritative disimpan backend.

---

# 47. Performance Requirements

Target awal yang harus divalidasi pada SIT/UAT:

```text
Home screen        <= 3 seconds
RFID lookup        <= 2 seconds online
Needle lookup      <= 2 seconds
API transaction    <= 3 seconds normal condition
Photo capture      <= 2 seconds device dependent
Sync               background/non-blocking
```

Angka final harus disesuaikan dengan hasil performance test dan kondisi factory network.

---

# 48. Availability

Mobile harus tetap usable untuk operational workflow saat koneksi terputus, sesuai offline policy.

Namun:

```text
Offline != Unlimited
```

Batas offline transaction, retention, dan reconciliation harus ditetapkan pada deployment policy.

---

# 49. Logging

Mobile logging minimum:

```text
Application Error
API Error
RFID Error
Camera Error
Sync Error
Authentication Error
Device Validation Error
```

Log harus menghindari sensitive information seperti password/token.

---

# 50. Analytics Events

Mobile dapat mengirim telemetry/event non-business-critical seperti:

```text
APP_OPENED
LOGIN_SUCCESS
LOGIN_FAILED
RFID_SCAN_SUCCESS
RFID_SCAN_FAILED
EXCHANGE_STARTED
EXCHANGE_COMPLETED
PHOTO_CAPTURED
SYNC_STARTED
SYNC_COMPLETED
SYNC_FAILED
SYNC_CONFLICT
```

Business transaction tetap menggunakan backend transaction model, bukan analytics event.

---

# 51. Acceptance Criteria — Login

**Given** device aktif dan user valid  
**When** user login  
**Then** application menampilkan Home dengan factory/trolley context yang benar.

**Given** device revoked  
**When** user login  
**Then** transaction access ditolak.

---

# 52. Acceptance Criteria — RFID

**Given** RFID operator terdaftar  
**When** PIC melakukan scan  
**Then** operator ditampilkan dan dapat dikonfirmasi.

**Given** RFID tidak ditemukan  
**When** PIC melakukan scan  
**Then** system menampilkan operator not found dan tidak membuat operator palsu.

---

# 53. Acceptance Criteria — Exchange

Transaction tidak dapat complete jika:

- operator belum valid;
- needle belum dipilih;
- exchange type belum dipilih;
- photo belum tersedia;
- new needle belum valid;
- stock issue gagal;
- required confirmation belum approved.

---

# 54. Acceptance Criteria — Broken Needle

**Given** exchange type broken  
**When** fragment ditemukan  
**Then** transaction dapat melanjutkan.

**Given** exchange type broken  
**When** fragment tidak ditemukan  
**Then** confirmation request dibuat dan transaction masuk pending.

**Given** confirmation rejected  
**Then** transaction tidak boleh complete.

---

# 55. Acceptance Criteria — Stock

**Given** stock trolley cukup  
**When** PIC issue needle  
**Then** stock berkurang satu dan stock movement tercatat.

**Given** stock trolley tidak cukup  
**When** PIC issue  
**Then** transaction issue ditolak dan stock tidak menjadi negative.

---

# 56. Acceptance Criteria — Offline

**Given** network offline  
**When** PIC membuat transaction yang diperbolehkan offline  
**Then** transaction tersimpan local dengan `SYNC_PENDING`.

**Given** network kembali  
**When** sync berjalan  
**Then** transaction dikirim menggunakan `client_transaction_id`.

**Given** transaction sudah pernah diproses server  
**When** retry dikirim  
**Then** server tidak membuat duplicate transaction.

---

# 57. Acceptance Criteria — Photo

**Given** photo belum tersedia  
**When** PIC mencoba complete  
**Then** application menolak completion.

**Given** photo tersedia  
**When** transaction sync  
**Then** photo metadata/reference terhubung ke Exchange ID.

---

# 58. Mobile Test Scope

QA minimum harus mencakup:

## Functional

```text
Login
RFID
Needle Selection
Exchange Type
Broken
Bent
Changeover
Photo
New Needle
Stock
Issue
Storage
Completion
History
```

## Offline

```text
Create Offline
Photo Offline
Sync
Retry
Duplicate Retry
Conflict
```

## Hardware

```text
RFID Connect
RFID Disconnect
RFID Read
Camera
Storage
```

## Security

```text
Invalid Login
Expired Session
Revoked Device
Unauthorized Action
```

---

# 59. End-to-End Test Scenario

```text
PIC Login
   |
   v
Validate Device
   |
   v
Home
   |
   v
New Exchange
   |
   v
RFID Operator
   |
   v
Select Old Needle
   |
   v
Select Exchange Type
   |
   v
Broken?
   |
  YES
   |
   v
Check Fragment
   |
   +---- FOUND --------+
   |                   |
   +---- NOT FOUND     |
            |          |
            v          |
       Confirmation    |
            |          |
         Approved      |
            |          |
            +----------+
                   |
                   v
                 Photo
                   |
                   v
            Select New Needle
                   |
                   v
             Stock Validation
                   |
                   v
                  Issue
                   |
                   v
            Store Used Needle
                   |
                   v
                Complete
                   |
                   v
                SYNCED
```

---

# 60. Mobile Architecture Traceability

| Requirement | SRS Module |
|---|---|
| PIC Troli | Authentication / Role |
| Factory/Trolley | Device Context |
| RFID | RFID Module |
| Operator | Employee Module |
| Old Needle | Exchange |
| Exchange Type | Exchange |
| Broken Needle | Fragment Validation |
| Missing Fragment | Confirmation |
| WhatsApp | Backend Notification |
| Photo | Camera / Photo |
| New Needle | Exchange |
| Stock | Inventory |
| Issue | Exchange + Inventory |
| Used Needle | Storage |
| Offline | Local DB |
| Sync | Sync Engine |
| History | History |
| Audit | Backend Audit |

---

# 61. Development Breakdown

SRS ini dapat diturunkan menjadi:

```text
EPIC 01 — Mobile Foundation
EPIC 02 — Authentication
EPIC 03 — Device/Trolley Context
EPIC 04 — RFID Integration
EPIC 05 — Exchange Transaction
EPIC 06 — Broken Needle Confirmation
EPIC 07 — Camera & Photo
EPIC 08 — Inventory / Stock
EPIC 09 — Offline Storage
EPIC 10 — Synchronization
EPIC 11 — Transaction History
EPIC 12 — Security
EPIC 13 — Logging & Monitoring
EPIC 14 — Testing & UAT
```

---

# 62. Definition of Done — Mobile SRS

Mobile SRS dianggap implementation-ready apabila:

- [ ] Authentication defined.
- [ ] Device binding defined.
- [ ] Trolley context defined.
- [ ] RFID flow defined.
- [ ] Operator lookup defined.
- [ ] Old needle selection defined.
- [ ] Exchange types defined.
- [ ] Broken fragment flow defined.
- [ ] Confirmation flow defined.
- [ ] Photo flow defined.
- [ ] New needle selection defined.
- [ ] Stock validation defined.
- [ ] Issue flow defined.
- [ ] Used needle storage defined.
- [ ] Completion criteria defined.
- [ ] Offline behavior defined.
- [ ] Sync behavior defined.
- [ ] Idempotency defined.
- [ ] Conflict handling defined.
- [ ] Local data defined.
- [ ] API boundary defined.
- [ ] UI/UX principles defined.
- [ ] Security defined.
- [ ] Error handling defined.
- [ ] Acceptance criteria defined.
- [ ] QA test scope defined.

**End of SRS Mobile Android Document**

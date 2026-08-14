# Business Process Specification
# Needle Management System

**Document:** 02 — Business Process  
**Version:** 1.0  
**Status:** Draft  
**Reference:** PRD — Needle Management System v2.0  
**Architecture:** Android Troli System + Web Needle Management + Central Backend

---

## 1. Purpose

Dokumen ini mendefinisikan proses bisnis end-to-end Needle Management System sebagai acuan bersama untuk Mobile Apps, WebApps, Backend/API, QA/UAT, Inventory, dan Management.

Fokus utama:
1. Needle Exchange.
2. Broken Needle Control.
3. Needle Inventory.
4. Stock Transfer.
5. Stock Movement.
6. Confirmation / Approval.
7. Offline Transaction.
8. Reporting dan Audit Trail.

---

## 2. Business Process Overview

```text
                        NEEDLE MANAGEMENT

                              FACTORY
                                 |
                 +---------------+---------------+
                 |                               |
          MAIN WAREHOUSE                    TROLLEYS
                 |                               |
                 |                     +---------+---------+
                 |                     |         |         |
                 |                   T-01      T-02      T-03
                 |                     |         |         |
                 +---------------------+---------+---------+
                                       |
                              CENTRAL BACKEND
                                       |
                 +---------------------+---------------------+
                 |                     |                     |
             EXCHANGE              INVENTORY             ANALYTICS
                 |                     |                     |
                 v                     v                     v
           Android App             WebApp                 Dashboard
            PIC Troli        PIC Inventory/Admin        Management
```

---

## 3. Actors

### 3.1 PIC Troli

Primary operational user.

Responsible for:
- menerima operator;
- membuat transaksi exchange;
- scan RFID;
- memilih needle type;
- memilih exchange type;
- memvalidasi broken needle;
- mengambil foto;
- meminta confirmation jika diperlukan;
- memberikan needle baru;
- menyimpan used needle;
- menyelesaikan transaksi.

### 3.2 Operator Sewing

Tidak login ke sistem.

Responsible for:
- datang ke trolley;
- membawa needle yang akan ditukar;
- membawa broken fragment jika needle patah;
- melakukan tap RFID;
- menerima needle baru.

### 3.3 PIC Inventory

Responsible for:
- warehouse stock;
- stock transfer;
- stock receiving;
- stock adjustment;
- physical count;
- monitoring trolley stock.

### 3.4 Management / Authorized Approver

Responsible for:
- confirmation/approval kasus tertentu;
- monitoring;
- analytics;
- review consumption;
- review exceptions.

### 3.5 System Admin

Responsible for:
- master data;
- user;
- role;
- device;
- trolley;
- configuration;
- system parameter.

---

## 4. Core Business Concepts

### 4.1 Trolley

Trolley adalah **mobile stock location**.

```text
Factory A
 |
 +-- Warehouse A
 |
 +-- Trolley A-01
 +-- Trolley A-02
 +-- Trolley A-03
```

Setiap trolley memiliki stock sendiri.

### 4.2 Needle Exchange

Needle Exchange adalah transaksi ketika operator menyerahkan old needle dan menerima new needle.

### 4.3 Stock Movement

Setiap perubahan quantity harus menghasilkan stock movement.

### 4.4 Confirmation

Confirmation digunakan untuk exception yang membutuhkan authorized approval.

### 4.5 Audit Trail

Setiap perubahan penting harus dapat ditelusuri:

```text
Who
What
When
Where
Why
Reference
```

---

## 5. Process A — Normal Needle Exchange

Normal exchange berlaku untuk:
- broken dengan fragment ditemukan;
- bent;
- changeover.

### 5.1 Process Flow

```text
Operator Arrives
      |
      v
PIC Creates Exchange
      |
      v
Operator RFID Scan
      |
      v
System Identifies Operator
      |
      v
Select Old Needle Type
      |
      v
Select Exchange Type
      |
      v
Validate Needle Condition
      |
      v
Take Photo
      |
      v
Select New Needle Type
      |
      v
Validate Trolley Stock
      |
      v
Issue New Needle
      |
      v
Store Used Needle
      |
      v
Create Stock Movement
      |
      v
Complete Transaction
```

### 5.2 Detailed Steps

**Step 1 — Operator Arrives**

Operator datang ke trolley membawa old needle.

**Step 2 — Create Exchange**

PIC menekan `NEW EXCHANGE`.

Status awal:

```text
DRAFT
```

**Step 3 — RFID Scan**

Operator melakukan tap ID Card. System melakukan lookup Employee Master.

Valid:

```text
OPERATOR_IDENTIFIED
```

Invalid:

```text
BLOCK TRANSACTION
```

**Step 4 — Select Old Needle Type**

PIC memilih type needle dari Needle Master.

**Step 5 — Select Exchange Type**

```text
BROKEN
BENT
CHANGEOVER
```

**Step 6 — Validate Condition**

System menjalankan business rule sesuai Exchange Type.

**Step 7 — Photo**

PIC mengambil foto old needle.

**Step 8 — Select New Needle Type**

PIC memilih needle baru.

**Step 9 — Stock Validation**

Backend memvalidasi:

```text
Trolley Stock >= Requested Quantity
```

Jika tidak cukup:

```text
BLOCKED
```

**Step 10 — Issue New Needle**

Jika stock tersedia, system melakukan issue.

**Step 11 — Store Used Needle**

PIC memasukkan old needle ke storage hole sesuai exchange type.

**Step 12 — Complete**

System menyelesaikan transaction dan menghasilkan audit trail.

---

## 6. Process B — Broken Needle With Fragment Found

```text
Exchange Type = BROKEN
       |
       v
Fragment Found?
       |
      YES
       |
       v
Continue Transaction
```

Business rules:
1. Operator wajib membawa patahan.
2. PIC melakukan visual validation.
3. Foto harus diambil.
4. Transaction dapat dilanjutkan.
5. Used needle dan fragment disimpan sesuai storage location.
6. Tidak diperlukan approval.

Status:

```text
BROKEN_FRAGMENT_FOUND
```

---

## 7. Process C — Broken Needle Without Fragment

Exception process:

```text
Exchange Type = BROKEN
       |
       v
Fragment Found?
       |
      NO
       |
       v
Transaction Paused
       |
       v
Create Confirmation Request
       |
       v
Notify Authorized Approver
       |
       v
Waiting Confirmation
       |
       +--------------------+
       |                    |
       v                    v
    APPROVED             REJECTED
       |                    |
       v                    v
 Continue              Block / Resolve
```

### 7.1 Business Rule

Operator tidak boleh langsung mendapatkan replacement needle jika broken fragment tidak ditemukan, kecuali mendapat confirmation dari authorized approver sesuai policy perusahaan.

### 7.2 Confirmation Request

```text
Confirmation ID
Transaction ID
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

Status:

```text
WAITING
APPROVED
REJECTED
EXPIRED
CANCELLED
```

### 7.3 WhatsApp Notification

WhatsApp hanya digunakan sebagai notification channel.

```text
NEEDLE MANAGEMENT SYSTEM

Broken Needle Confirmation Required

Factory       : Factory A
Trolley       : A-01
Operator      : EMP00123
Needle        : DBx1 #11
Condition     : BROKEN
Fragment      : NOT FOUND
PIC Troli     : PIC001

Please review the confirmation request.
```

Notification menyediakan link ke secure approval page.

Approval tidak dilakukan dengan membalas WhatsApp.

---

## 8. Process D — Bent Needle

```text
Operator
   |
   v
RFID
   |
   v
Old Needle Type
   |
   v
Exchange Type = BENT
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
Issue New Needle
   |
   v
Store Bent Needle
   |
   v
Complete
```

Default:

```text
Old Needle Type = New Needle Type
```

Jika berbeda, membutuhkan authorized override.

---

## 9. Process E — Changeover

```text
Operator
   |
   v
RFID
   |
   v
Old Needle Type
   |
   v
CHANGEOVER
   |
   v
New Needle Type
   |
   v
Validate New Stock
   |
   v
Issue
   |
   v
Store Old Needle
   |
   v
Complete
```

Perbedaan:

```text
Old Needle Type != New Needle Type
```

diperbolehkan.

---

## 10. Process F — Stock Receiving

```text
Supplier / Source
        |
        v
PIC Inventory
        |
        v
Create Receiving
        |
        v
Select Needle Type
        |
        v
Input Quantity
        |
        v
Warehouse
        |
        v
Stock + Quantity
        |
        v
Stock Movement
```

Receiving wajib memiliki:
- Receiving ID.
- Source.
- Needle Type.
- Quantity.
- Warehouse.
- PIC Inventory.
- Timestamp.
- Reference document jika ada.

---

## 11. Process G — Warehouse to Trolley Transfer

```text
Warehouse
    |
    v
PIC Inventory
    |
    v
Create Transfer
    |
    v
Select Destination Trolley
    |
    v
Select Needle Type
    |
    v
Input Quantity
    |
    v
Validate Warehouse Stock
    |
    v
Approve / Confirm
    |
    v
Transfer
    |
    +------------------+
    |                  |
    v                  v
Warehouse -Q       Trolley +Q
    |                  |
    +--------+---------+
             |
             v
       Stock Movement
```

Transfer harus atomic. Tidak boleh terjadi partial stock update.

---

## 12. Process H — Trolley to Warehouse Return

Digunakan untuk excess stock, trolley closing, redistribution, atau periodic balancing.

```text
Trolley
   |
   v
PIC Inventory
   |
   v
Create Return
   |
   v
Validate Trolley Stock
   |
   v
Warehouse +Q
   |
   v
Trolley -Q
   |
   v
Stock Movement
```

---

## 13. Process I — Stock Adjustment

Digunakan jika:

```text
System Stock != Physical Stock
```

Flow:

```text
Physical Count
      |
      v
Variance Found
      |
      v
Create Adjustment
      |
      v
Input Reason
      |
      v
Approval (if required)
      |
      v
Update Stock
      |
      v
Stock Movement
      |
      v
Audit Trail
```

Reason wajib tersedia.

Contoh:

```text
PHYSICAL_COUNT
DAMAGED
LOST
DATA_CORRECTION
OTHER
```

---

## 14. Process J — Physical Count

```text
Select Location
      |
      v
Select Needle Type
      |
      v
System Qty
      |
      v
Input Physical Qty
      |
      v
Calculate Variance
      |
      +----------------+
      |                |
    MATCH           VARIANCE
      |                |
      v                v
  Complete        Adjustment
```

Formula:

```text
Variance = Physical Qty - System Qty
```

---

## 15. Process K — Low Stock / Replenishment

System memonitor:

```text
Current Qty <= Minimum Qty
```

Jika true:

```text
LOW STOCK
```

Jika sangat rendah:

```text
CRITICAL
```

Recommended refill:

```text
Maximum Qty - Current Qty
```

Flow:

```text
Low Stock Detected
       |
       v
Dashboard Alert
       |
       v
PIC Inventory
       |
       v
Create Transfer
       |
       v
Warehouse -> Trolley
```

---

## 16. Process L — Trolley Stock Reconciliation

```text
System Stock
     |
     v
Physical Count
     |
     v
Compare
     |
     +-------------+
     |             |
    Match       Variance
     |             |
 Complete       Adjustment
```

Target:

```text
System Stock = Physical Stock
```

---

## 17. Process M — Device & Trolley Assignment

```text
System Admin
      |
      v
Register Device
      |
      v
Select Factory
      |
      v
Select Trolley
      |
      v
Activate Device
```

Contoh:

```text
NM-TAB-001
Factory A
Trolley A-01
ACTIVE
```

---

## 18. Process N — PIC Troli Login

```text
Open App
   |
   v
Device Validation
   |
   v
PIC Login
   |
   v
Validate Role
   |
   v
Load Trolley Context
   |
   v
Load Master Data
   |
   v
Load Current Stock
   |
   v
Dashboard
```

PIC tidak perlu memilih Factory/Trolley setiap transaksi.

---

## 19. Process O — Offline Transaction

Android harus dapat melakukan transaksi ketika internet unavailable.

```text
Internet Available?
       |
    +--+--+
    |     |
   YES    NO
    |     |
    v     v
 Server  Local DB
    |       |
    |       v
    |   Sync Queue
    |       |
    +---+---+
        |
        v
   Internet Back
        |
        v
      Sync
```

Local states:

```text
LOCAL_ONLY
SYNC_PENDING
SYNCING
SYNCED
SYNC_FAILED
```

Backend tetap menjadi final authority.

---

## 20. Offline Business Rules

Offline transaction hanya menggunakan data yang telah tersedia di device.

Minimal cached data:
- Employee Master yang diperlukan.
- Needle Type.
- Exchange Type.
- Trolley stock snapshot.
- Business rules.
- Device configuration.

Saat sync, backend melakukan validation ulang.

Jika terjadi conflict:

```text
SYNC_CONFLICT
```

Transaction tidak boleh diam-diam diubah.

---

## 21. Process P — Synchronization

```text
Local Transaction
       |
       v
Generate Client Transaction ID
       |
       v
Sync Queue
       |
       v
Upload Transaction
       |
       v
Backend Validation
       |
   +---+---+
   |       |
 ACCEPT  REJECT
   |       |
   v       v
 SYNCED  SYNC_FAILED
```

Transaction ID harus idempotent sehingga retry tidak menghasilkan duplicate transaction.

---

## 22. Process Q — Transaction Cancellation

Sebelum stock issue, transaction dapat dibatalkan.

Contoh:

```text
DRAFT
OPERATOR_IDENTIFIED
NEEDLE_SELECTED
```

Setelah:

```text
NEEDLE_ISSUED
```

tidak boleh delete langsung.

Gunakan:

```text
VOID / REVERSAL
```

dengan audit trail dan stock reversal.

---

## 23. Process R — Stock Reversal

```text
Original Issue
      |
      v
Create Reversal
      |
      v
Return Quantity
      |
      v
Stock Movement
```

Contoh:

```text
Issue:
Trolley -1

Reversal:
Trolley +1
```

Original movement tidak dihapus.

---

## 24. Process S — Exception Handling

| Exception | Action |
|---|---|
| RFID invalid | Block |
| Employee inactive | Block |
| Needle type inactive | Block |
| Stock insufficient | Block |
| Broken fragment missing | Confirmation |
| Photo failed | Retry |
| Backend unavailable | Offline queue |
| Sync conflict | Manual review |
| Duplicate transaction | Reject |
| Device unauthorized | Block |
| Unauthorized role | Block |

---

## 25. Business Status Model

### Exchange Transaction

```text
DRAFT
   |
OPERATOR_IDENTIFIED
   |
NEEDLE_SELECTED
   |
EXCHANGE_SELECTED
   |
   +-------------------------+
   |                         |
NORMAL                    EXCEPTION
   |                         |
   |                    WAITING_CONFIRMATION
   |                         |
   |                    +----+----+
   |                    |         |
   |                 APPROVED  REJECTED
   |                    |
   +--------------------+
            |
       PHOTO_CAPTURED
            |
     NEW_NEEDLE_SELECTED
            |
       STOCK_VALIDATED
            |
        NEEDLE_ISSUED
            |
     USED_NEEDLE_STORED
            |
         COMPLETED
```

### Stock

```text
NORMAL
LOW
CRITICAL
OUT_OF_STOCK
BLOCKED
```

### Confirmation

```text
NOT_REQUIRED
WAITING
APPROVED
REJECTED
EXPIRED
CANCELLED
```

---

## 26. Stock Movement Rules

Setiap stock movement wajib memiliki:

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

Tidak boleh ada perubahan stock tanpa movement.

---

## 27. Inventory Consistency Rule

System harus menjaga:

```text
Stock Balance =
Opening Balance
+ Receiving
+ Transfer In
- Transfer Out
- Issue
+ Return
+/- Adjustment
```

Untuk setiap location dan needle type.

---

## 28. Needle Exchange & Inventory Relationship

```text
Needle Exchange
        |
        +-- Operational Record
        |
        +-- Stock Movement
```

Secara operasional:

```text
OLD NEEDLE
    |
    v
USED NEEDLE STORAGE

NEW NEEDLE
    |
    v
TROLLEY STOCK -1
```

Keduanya harus memiliki reference relationship.

---

## 29. Daily Operational Flow — PIC Troli

```text
Start Shift
    |
    v
Login
    |
    v
Check Trolley Stock
    |
    v
Begin Operation
    |
    +---- Operator Exchange
    |
    +---- Operator Exchange
    |
    +---- Operator Exchange
    |
    v
End Shift
    |
    v
Review Transaction
    |
    v
Review Sync Status
    |
    v
Handover
```

---

## 30. Daily Inventory Flow — PIC Inventory

```text
Start Day
   |
   v
Check Warehouse Stock
   |
   v
Check Trolley Stock
   |
   v
Review Low Stock
   |
   v
Replenishment
   |
   v
Stock Transfer
   |
   v
Monitor Exchange
   |
   v
End Day
   |
   v
Stock Reconciliation
```

---

## 31. Management Monitoring Flow

```text
Dashboard
   |
   +-- Factory
   |
   +-- Trolley
   |
   +-- Needle Type
   |
   +-- Exchange Type
   |
   +-- Consumption
   |
   +-- Inventory
   |
   +-- Exceptions
   |
   +-- Pending Confirmation
```

Management tidak melakukan transaksi operasional harian.

---

## 32. WhatsApp Notification Architecture

```text
Broken Fragment Missing
          |
          v
Backend Creates Confirmation
          |
          v
Notification Service
          |
          v
WhatsApp
          |
          v
Authorized Approver
          |
          v
Secure Web Approval
          |
          v
Backend
          |
          v
Transaction Status
```

WhatsApp tidak mengubah database secara langsung.

---

## 33. Audit Trail Requirements

Audit trail wajib untuk:
- Login.
- RFID identification.
- Exchange creation.
- Needle selection.
- Photo capture.
- Confirmation request.
- Approval/rejection.
- Needle issue.
- Stock transfer.
- Receiving.
- Return.
- Adjustment.
- Reversal.
- Master data change.
- Role change.
- Device binding.

---

## 34. Reporting Requirements

### Exchange Report

Filter:
- date;
- factory;
- trolley;
- operator;
- needle type;
- exchange type;
- PIC.

### Inventory Report

Filter:
- factory;
- location;
- needle type;
- stock status.

### Stock Movement Report

Filter:
- movement type;
- location;
- needle type;
- date;
- actor.

### Exception Report

- missing fragment;
- rejected confirmation;
- sync failure;
- stock adjustment;
- stock variance.

---

## 35. Business KPI

### Operational

- Total exchange.
- Exchange per hour.
- Exchange per operator.
- Exchange per trolley.
- Broken ratio.
- Bent ratio.
- Changeover ratio.

### Inventory

- Current stock.
- Stock turnover.
- Low stock.
- Critical stock.
- Stock variance.
- Transfer volume.

### Quality / Control

- Missing fragment count.
- Missing fragment approval rate.
- Unresolved confirmation.
- Transaction without photo.
- Manual adjustment frequency.

---

## 36. UAT Critical Scenarios

### Scenario 1 — Broken + Fragment Found

Expected:

```text
COMPLETED
Stock -1
Photo recorded
Used needle recorded
```

### Scenario 2 — Broken + Fragment Not Found + Approved

Expected:

```text
Confirmation APPROVED
Exchange COMPLETED
Stock -1
Audit trail complete
```

### Scenario 3 — Broken + Fragment Not Found + Rejected

Expected:

```text
Exchange BLOCKED
Stock unchanged
```

### Scenario 4 — Bent Needle

Expected:

```text
Exchange COMPLETED
Stock -1
```

### Scenario 5 — Changeover

Expected:

```text
Old Type != New Type
Exchange COMPLETED
Stock of New Type -1
```

### Scenario 6 — Insufficient Stock

Expected:

```text
Exchange BLOCKED
Stock unchanged
```

### Scenario 7 — Offline Exchange

Expected:

```text
Transaction saved locally
SYNC_PENDING
```

After connection:

```text
SYNCED
```

### Scenario 8 — Warehouse Transfer

Expected:

```text
Warehouse -Q
Trolley +Q
```

### Scenario 9 — Physical Count Variance

Expected:

```text
Adjustment created
Movement created
Audit trail created
```

---

## 37. Business Process Principles

### Principle 1 — No Stock Change Without Movement

```text
NO MOVEMENT = NO STOCK CHANGE
```

### Principle 2 — No Silent Correction

Data tidak boleh diedit diam-diam setelah transaction completed.

Gunakan:
- Correction.
- Void.
- Reversal.
- Adjustment.

### Principle 3 — Backend Is Final Authority

Mobile melakukan validation untuk UX.

Backend melakukan final validation.

### Principle 4 — WhatsApp Is Notification Only

WhatsApp bukan database dan bukan approval engine.

### Principle 5 — Trolley Is Stock Location

Stock trolley harus dapat ditelusuri secara independent.

### Principle 6 — Every Exchange Is Traceable

Setiap exchange harus dapat ditelusuri:

```text
Factory
Trolley
PIC
Operator
Old Needle
New Needle
Exchange Type
Photo
Stock Movement
Timestamp
```

---

## 38. Final End-to-End Business Process

```text
                    OPERATOR
                       |
                       v
                +-------------+
                | PIC TROLI   |
                +------+------+
                       |
                  RFID Scan
                       |
                       v
                Identify Operator
                       |
                       v
                Select Old Needle
                       |
                       v
                Select Exchange
                       |
             +---------+---------+
             |                   |
          NORMAL              BROKEN
             |                   |
             |             Fragment Found?
             |              +----+----+
             |              |         |
             |             YES       NO
             |              |         |
             |              |    Confirmation
             |              |         |
             |              |      Approval
             |              |         |
             +--------------+---------+
                            |
                         Photo
                            |
                     Select New Needle
                            |
                       Stock Validate
                            |
                    +-------+-------+
                    |               |
                 Available       No Stock
                    |               |
                    v               v
                 Issue            BLOCK
                    |
              Store Used Needle
                    |
              Stock Movement
                    |
                 Complete
                    |
                    v
               Dashboard
                    |
             +------+------+
             |             |
          Inventory      Management
```

---

## 39. Definition of Done — Business Process

Business Process siap masuk SRS apabila:

- [ ] Semua actor didefinisikan.
- [ ] Normal exchange flow disepakati.
- [ ] Broken needle flow disepakati.
- [ ] Missing fragment approval flow disepakati.
- [ ] WhatsApp notification role disepakati.
- [ ] Inventory movement flow disepakati.
- [ ] Trolley stock model disepakati.
- [ ] Offline behavior disepakati.
- [ ] Reversal/correction rule disepakati.
- [ ] Audit trail requirement disepakati.
- [ ] UAT scenario tersedia.
- [ ] Business owner menyetujui flow.

---

## 40. Next Document

Dokumen berikutnya:

**`03-Use-Case.md`**

Use Case akan menerjemahkan business process menjadi:

```text
Actor
   |
   v
Use Case
   |
   v
Precondition
   |
   v
Main Flow
   |
   v
Alternative Flow
   |
   v
Exception Flow
   |
   v
Postcondition
```

Use Case utama:
1. UC-001 Login PIC Troli.
2. UC-002 RFID Operator Identification.
3. UC-003 Create Needle Exchange.
4. UC-004 Broken Needle Confirmation.
5. UC-005 Capture Needle Photo.
6. UC-006 Issue New Needle.
7. UC-007 Complete Exchange.
8. UC-008 Stock Receiving.
9. UC-009 Stock Transfer.
10. UC-010 Stock Adjustment.
11. UC-011 Physical Count.
12. UC-012 Manage Master Data.
13. UC-013 Dashboard & Analytics.
14. UC-014 Audit Trail.
15. UC-015 Offline Sync.

**End of Business Process Specification**

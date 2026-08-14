# Use Case Specification
# Needle Management System

**Document:** 03 — Use Case  
**Version:** 1.0  
**Status:** Draft  
**Reference:** PRD v2.0 + 02 Business Process v1.0  
**Architecture:** Flutter Android Tablet + WebApp + Central Backend

---

# 1. Purpose

Dokumen ini menerjemahkan seluruh business process pada `02-Business-Process.md` menjadi use case yang dapat digunakan oleh:

- Mobile Apps Development Team.
- WebApps Development Team.
- Backend/API Development Team.
- QA/UAT.
- Business Analyst.
- Solution Architect.
- Product Owner.

Dokumen ini menjadi jembatan dari **Business Process** menuju:

```text
Use Case
   |
   v
Functional Requirement
   |
   v
UI/UX Requirement
   |
   v
API Requirement
   |
   v
Database Requirement
   |
   v
Test Scenario
```

---

# 2. System Actors

| Actor | Platform | Responsibility |
|---|---|---|
| Operator Sewing | Android Tablet | RFID identification, menyerahkan old needle, menerima new needle |
| PIC Troli | Android Tablet | Operasional needle exchange |
| PIC Inventory | WebApp | Inventory, receiving, transfer, adjustment, physical count |
| Management / Approver | WebApp / Secure Approval Page | Approval exception, monitoring, analytics |
| System Admin | WebApp | Master data, user, role, device, trolley, configuration |
| Notification Service | Backend | WhatsApp notification |
| RFID Reader | Android Device | Membaca ID Card |
| Tablet Camera | Android Device | Capture needle photo |
| Backend | Central System | Business rules, transaction, inventory, audit |
| Database | Backend | Persistent data storage |

---

# 3. Use Case Map

```text
                         NEEDLE MANAGEMENT SYSTEM
                                  |
          +-----------------------+-----------------------+
          |                       |                       |
      MOBILE APP               WEB APP              BACKEND
          |                       |                       |
   +------+-------+        +------+-------+       +-------+-------+
   |              |        |              |       |               |
 Exchange      Device     Inventory     Admin   Transaction     Integration
   |           Context       |             |         |               |
   |             |           |             |         |          WhatsApp
   v             v           v             v         v          RFID/Camera
 UC-003...     UC-001      UC-008...     UC-012   UC-014...
```

---

# 4. Use Case ID Convention

## Mobile

```text
UC-MOB-xxx
```

## Inventory

```text
UC-INV-xxx
```

## Administration

```text
UC-ADM-xxx
```

## Management / Analytics

```text
UC-MGT-xxx
```

## Integration / System

```text
UC-SYS-xxx
```

---

# 5. Global Business Rules

Rules berikut berlaku lintas use case.

### BR-001 — Backend Final Authority

Mobile melakukan local validation untuk UX, tetapi backend melakukan final validation.

### BR-002 — No Stock Change Without Stock Movement

Setiap perubahan quantity wajib menghasilkan stock movement.

### BR-003 — Trolley Is Stock Location

Stock trolley disimpan dan dilacak secara independent berdasarkan Factory + Trolley + Needle Type.

### BR-004 — Needle Type Must Be Master Data

Old Needle Type dan New Needle Type wajib berasal dari Needle Master yang aktif.

### BR-005 — New Needle Must Match Exchange Rule

Untuk normal broken/bent:

```text
New Needle Type = Old Needle Type
```

Untuk changeover:

```text
New Needle Type may differ
```

### BR-006 — Broken Fragment

Jika Exchange Type = BROKEN:

- fragment wajib dibawa jika tersedia;
- jika fragment tidak ditemukan, confirmation wajib dibuat;
- replacement tidak boleh diterbitkan sebelum approval sesuai policy.

### BR-007 — Photo Requirement

Needle exchange membutuhkan foto old needle sesuai business policy.

### BR-008 — No Hard Delete Transaction

Completed transaction tidak boleh dihapus.

Gunakan reversal, void, correction, atau adjustment.

### BR-009 — Audit Trail

Action kritis wajib tercatat.

### BR-010 — Idempotency

Retry transaction/sync tidak boleh membuat duplicate transaction.

---

# 6. UC-MOB-001 — PIC Troli Login

## Objective

PIC Troli masuk ke Android Tablet dan mendapatkan trolley context yang telah dikonfigurasi.

## Actor

PIC Troli.

## Trigger

PIC membuka aplikasi.

## Preconditions

- Device registered.
- Device active.
- Device assigned ke Factory dan Trolley.
- PIC memiliki account aktif.

## Main Flow

1. PIC membuka aplikasi.
2. System membaca Device ID.
3. System melakukan device validation.
4. PIC memasukkan credential.
5. Backend memvalidasi user.
6. System memvalidasi role PIC Troli.
7. System mengambil Factory dan Trolley context.
8. System mengambil master data yang dibutuhkan.
9. System mengambil stock snapshot.
10. System menampilkan dashboard trolley.

## Alternative Flow

### A1 — Device belum terdaftar

System menampilkan:

```text
DEVICE NOT REGISTERED
```

Login diblok.

### A2 — Device inactive

Login diblok.

### A3 — User inactive

Login diblok.

### A4 — Network unavailable

Jika session/token masih valid dan data cache tersedia, system dapat masuk ke offline mode.

## Postconditions

PIC berhasil login dan trolley context aktif.

---

# 7. UC-MOB-002 — RFID Operator Identification

## Objective

Mengidentifikasi operator menggunakan ID Card.

## Actor

Operator Sewing, PIC Troli.

## Trigger

PIC memulai exchange.

## Preconditions

- PIC login.
- Device/trolley valid.
- Exchange draft tersedia.
- RFID reader tersedia.

## Main Flow

1. PIC membuat exchange.
2. System menampilkan instruksi tap ID Card.
3. Operator melakukan tap.
4. RFID reader membaca identifier.
5. Mobile mengirim identifier ke backend/local cache.
6. System mencari Employee Master.
7. System menampilkan operator.
8. PIC melakukan confirmation.
9. Operator ID disimpan pada exchange.

## Alternative Flow

### A1 — RFID gagal dibaca

PIC meminta operator melakukan tap ulang.

### A2 — Employee tidak ditemukan

Transaction diblok.

### A3 — Employee inactive

Transaction diblok.

### A4 — Offline

System menggunakan Employee Master cache.

## Postconditions

Exchange memiliki Operator ID.

---

# 8. UC-MOB-003 — Create Needle Exchange

## Objective

Membuat transaksi penukaran jarum baru.

## Actor

PIC Troli.

## Trigger

Operator datang membawa old needle.

## Preconditions

- PIC login.
- Device valid.
- Trolley active.

## Main Flow

1. PIC memilih `NEW EXCHANGE`.
2. System membuat Exchange ID.
3. System menyimpan Factory.
4. System menyimpan Trolley.
5. System menyimpan PIC.
6. Status menjadi `DRAFT`.
7. System meminta RFID identification.

## Business Rules

Exchange ID harus unique.

## Postconditions

Draft exchange tersedia.

---

# 9. UC-MOB-004 — Select Old Needle Type

## Objective

Mencatat type jarum yang ditukar.

## Actor

PIC Troli.

## Preconditions

- Exchange status valid.
- Needle Master tersedia.

## Main Flow

1. System menampilkan active Needle Type.
2. PIC memilih Old Needle Type.
3. System menyimpan Needle Type.
4. System melakukan validation.

## Alternative Flow

### A1 — Needle type inactive

Type tidak boleh dipilih.

### A2 — Offline

System menggunakan cached Needle Master.

## Postconditions

Old Needle Type tercatat.

---

# 10. UC-MOB-005 — Select Exchange Type

## Objective

Menentukan alasan/type penukaran.

## Actor

PIC Troli.

## Options

```text
BROKEN
BENT
CHANGEOVER
```

## Main Flow

1. System menampilkan exchange type.
2. PIC memilih type.
3. System menjalankan business rule.
4. Jika BROKEN, system meminta fragment status.
5. Jika BENT, system menerapkan same-type rule.
6. Jika CHANGEOVER, system mengizinkan New Needle Type berbeda.

## Postconditions

Exchange Type tercatat.

---

# 11. UC-MOB-006 — Validate Broken Needle

## Objective

Memvalidasi kondisi broken needle.

## Actor

PIC Troli, Operator.

## Preconditions

Exchange Type = BROKEN.

## Main Flow

1. System menanyakan apakah fragment ditemukan.
2. PIC melakukan visual validation.
3. PIC memilih:
   - `FRAGMENT_FOUND`
   - `FRAGMENT_NOT_FOUND`
4. System menyimpan status.

## Alternative Flow

### A1 — Fragment Found

Transaction dapat melanjutkan ke photo.

### A2 — Fragment Not Found

System membuat confirmation requirement.

Status:

```text
WAITING_CONFIRMATION
```

Replacement issuance diblok sampai approval sesuai policy.

---

# 12. UC-MOB-007 — Request Broken Needle Confirmation

## Objective

Membuat confirmation request ketika patahan needle tidak ditemukan.

## Actor

PIC Troli.

## Preconditions

- Exchange Type = BROKEN.
- Fragment status = NOT_FOUND.

## Main Flow

1. System membuat Confirmation ID.
2. System menyimpan Transaction ID.
3. System menyimpan operator.
4. System menyimpan trolley.
5. System menyimpan old needle type.
6. System menyimpan reason.
7. Status menjadi `WAITING`.
8. Backend mengirim notification event.
9. Notification Service mengirim WhatsApp notification.
10. System menunggu approval.

## Postconditions

Confirmation request aktif.

---

# 13. UC-SYS-001 — Send WhatsApp Confirmation Notification

## Objective

Memberitahu authorized approver bahwa confirmation diperlukan.

## Actor

Notification Service.

## Trigger

Confirmation status = WAITING.

## Main Flow

1. Backend publish notification event.
2. Notification Service mengambil recipient.
3. Service membuat notification payload.
4. Service mengirim WhatsApp.
5. System menyimpan delivery status.

## Notification Data

- Confirmation ID.
- Factory.
- Trolley.
- Operator.
- Needle Type.
- Exchange Type.
- Fragment status.
- PIC.
- Created At.
- Secure approval link.

## Business Rule

WhatsApp hanya notification channel.

Approval dilakukan melalui secure system page.

---

# 14. UC-MGT-001 — Review Broken Needle Confirmation

## Objective

Authorized approver memeriksa kasus broken needle tanpa fragment.

## Actor

Management / Authorized Approver.

## Main Flow

1. Approver membuka confirmation link.
2. System melakukan authentication/authorization.
3. System menampilkan detail.
4. Approver melihat transaction.
5. Approver melihat photo jika tersedia.
6. Approver memilih:
   - APPROVE
   - REJECT
7. System menyimpan decision.
8. System membuat audit trail.
9. Backend memperbarui transaction status.

## Alternative Flow

### A1 — Unauthorized

Access denied.

### A2 — Confirmation expired

Decision tidak dapat dilakukan.

## Postconditions

Confirmation memiliki final decision.

---

# 15. UC-MOB-008 — Capture Needle Photo

## Objective

Mengambil foto old needle sebagai evidence.

## Actor

PIC Troli.

## Preconditions

- Exchange valid.
- Camera permission tersedia.

## Main Flow

1. PIC membuka camera.
2. PIC mengambil foto.
3. Mobile melakukan image validation.
4. Image disimpan sementara.
5. Image dikaitkan dengan Exchange ID.
6. Upload/sync dilakukan.
7. Status menjadi `PHOTO_CAPTURED`.

## Alternative Flow

### A1 — Camera permission denied

System meminta permission.

### A2 — Camera failure

PIC dapat retry.

### A3 — Offline

Photo disimpan local dan masuk sync queue.

## Business Rules

Photo harus memiliki reference ke transaction.

---

# 16. UC-MOB-009 — Select New Needle Type

## Objective

Menentukan needle yang akan diberikan kepada operator.

## Actor

PIC Troli.

## Preconditions

- Old Needle Type selected.
- Exchange Type selected.

## Main Flow

1. System menampilkan eligible New Needle Type.
2. PIC memilih type.
3. System melakukan validation.
4. System menampilkan available trolley stock.
5. PIC melakukan confirmation.

## Business Rules

### Broken / Bent

```text
New Type = Old Type
```

kecuali authorized override.

### Changeover

```text
New Type may differ from Old Type
```

## Postconditions

New Needle Type tercatat.

---

# 17. UC-MOB-010 — Validate Trolley Stock

## Objective

Memastikan trolley memiliki stock yang cukup.

## Actor

System.

## Preconditions

- New Needle Type selected.

## Main Flow

1. System mengambil current stock.
2. System membaca requested quantity.
3. System membandingkan stock.
4. Jika cukup, status menjadi `STOCK_VALIDATED`.
5. Jika tidak cukup, transaction diblok.

## Formula

```text
Available Stock >= Requested Quantity
```

## Alternative Flow

### A1 — Insufficient Stock

System menampilkan:

```text
INSUFFICIENT STOCK
```

Tidak boleh issue.

---

# 18. UC-MOB-011 — Issue New Needle

## Objective

Memberikan needle baru kepada operator dan mengurangi stock trolley.

## Actor

PIC Troli.

## Preconditions

- Confirmation approved if required.
- Stock validated.
- New Needle Type selected.

## Main Flow

1. PIC mengambil needle baru.
2. PIC memberikan needle kepada operator.
3. PIC melakukan confirmation di system.
4. Backend membuat stock movement.
5. Trolley stock berkurang.
6. Transaction status menjadi `NEEDLE_ISSUED`.

## Stock Movement

```text
Movement Type = ISSUE
Source = TROLLEY
Quantity = -Q
Reference = Exchange ID
```

## Business Rule

Issue dan stock deduction harus atomic.

---

# 19. UC-MOB-012 — Store Used Needle

## Objective

Menyimpan old needle pada storage hole sesuai type.

## Actor

PIC Troli.

## Preconditions

- Old needle recorded.
- Physical exchange dilakukan.

## Main Flow

1. System menampilkan storage instruction.
2. PIC memasukkan used needle ke hole sesuai exchange type.
3. PIC melakukan confirmation.
4. System menyimpan storage confirmation.

## Postconditions

Used needle storage action tercatat.

---

# 20. UC-MOB-013 — Complete Needle Exchange

## Objective

Menyelesaikan transaction.

## Preconditions

- Operator identified.
- Old Needle Type selected.
- Exchange Type selected.
- Photo captured.
- New Needle Type selected.
- Stock validated.
- Issue completed.
- Used needle stored.
- Confirmation approved if required.

## Main Flow

1. System memeriksa seluruh mandatory state.
2. Backend melakukan final validation.
3. Exchange status menjadi `COMPLETED`.
4. Audit trail dibuat.
5. Transaction masuk reporting.

## Alternative Flow

Jika mandatory step belum lengkap:

```text
CANNOT COMPLETE
```

---

# 21. UC-MOB-014 — Cancel Exchange

## Objective

Membatalkan draft exchange sebelum stock issue.

## Actor

PIC Troli.

## Preconditions

Exchange belum melakukan stock issue.

## Main Flow

1. PIC memilih cancel.
2. System meminta confirmation.
3. PIC memilih reason.
4. System mengubah status menjadi `CANCELLED`.
5. Audit trail dibuat.

## Business Rule

Completed exchange tidak boleh di-cancel secara hard delete.

---

# 22. UC-MOB-015 — Offline Transaction

## Objective

Memungkinkan operasi mobile saat koneksi backend unavailable.

## Actor

PIC Troli.

## Preconditions

- Device memiliki valid session.
- Required master data tersedia dalam cache.

## Main Flow

1. Mobile mendeteksi offline.
2. User tetap melakukan transaction.
3. Transaction disimpan ke local database.
4. Client Transaction ID dibuat.
5. Status `SYNC_PENDING`.
6. Saat koneksi kembali, sync dimulai.

## Postconditions

Transaction aman tersimpan local dan menunggu sync.

---

# 23. UC-SYS-002 — Synchronize Mobile Transaction

## Objective

Mengirim local transaction ke backend.

## Actor

System.

## Main Flow

1. Mobile mendeteksi network available.
2. Sync queue dibaca.
3. Transaction dikirim menggunakan Client Transaction ID.
4. Backend melakukan validation.
5. Backend memeriksa idempotency.
6. Backend menerima atau menolak.
7. Mobile menyimpan response.

## Success

```text
SYNCED
```

## Failure

```text
SYNC_FAILED
```

## Conflict

```text
SYNC_CONFLICT
```

## Business Rule

Retry terhadap transaction yang sama tidak boleh menghasilkan duplicate.

---

# 24. UC-INV-001 — Stock Receiving

## Objective

Menambahkan stock ke warehouse.

## Actor

PIC Inventory.

## Preconditions

- PIC Inventory login.
- Warehouse active.

## Main Flow

1. PIC membuka Receiving.
2. PIC membuat Receiving ID.
3. PIC memilih source.
4. PIC memilih needle type.
5. PIC memasukkan quantity.
6. PIC memilih warehouse.
7. System melakukan validation.
8. PIC submit.
9. Backend menambah stock warehouse.
10. Backend membuat stock movement.
11. Audit trail dibuat.

## Postconditions

Warehouse stock bertambah.

---

# 25. UC-INV-002 — Create Warehouse to Trolley Transfer

## Objective

Memindahkan stock warehouse ke trolley.

## Actor

PIC Inventory.

## Preconditions

- Source warehouse active.
- Destination trolley active.
- Source stock cukup.

## Main Flow

1. PIC membuat transfer.
2. Memilih source warehouse.
3. Memilih destination trolley.
4. Memilih needle type.
5. Input quantity.
6. System validasi source stock.
7. PIC submit.
8. Backend melakukan atomic transfer.
9. Warehouse stock berkurang.
10. Trolley stock bertambah.
11. Stock movement dibuat.
12. Audit trail dibuat.

## Business Rule

Transfer harus atomic.

---

# 26. UC-INV-003 — Return Trolley Stock to Warehouse

## Objective

Mengembalikan stock dari trolley ke warehouse.

## Main Flow

1. PIC memilih trolley.
2. PIC memilih warehouse.
3. PIC memilih needle type.
4. Input quantity.
5. System memvalidasi trolley stock.
6. Transfer diproses.
7. Trolley stock berkurang.
8. Warehouse stock bertambah.
9. Movement dibuat.

---

# 27. UC-INV-004 — Stock Adjustment

## Objective

Menyesuaikan system stock dengan kondisi fisik.

## Preconditions

- Physical count atau variance ditemukan.

## Main Flow

1. PIC membuat adjustment.
2. Memilih location.
3. Memilih needle type.
4. Memasukkan physical quantity.
5. System menghitung variance.
6. PIC memilih reason.
7. Jika membutuhkan approval, system membuat approval.
8. Setelah approved, stock diperbarui.
9. Movement dibuat.
10. Audit trail dibuat.

## Formula

```text
Variance = Physical Qty - System Qty
```

---

# 28. UC-INV-005 — Physical Count

## Objective

Melakukan stock counting.

## Main Flow

1. PIC memilih Factory.
2. PIC memilih Location.
3. PIC memilih Needle Type.
4. System menampilkan System Qty.
5. PIC memasukkan Physical Qty.
6. System menghitung variance.
7. Jika match, count selesai.
8. Jika variance, system menyediakan Adjustment flow.

---

# 29. UC-INV-006 — Replenishment Monitoring

## Objective

Mendeteksi trolley yang membutuhkan replenishment.

## Main Flow

1. Backend membaca stock trolley.
2. Backend membandingkan dengan Min Stock.
3. Jika di bawah minimum, status LOW.
4. Jika mencapai critical threshold, status CRITICAL.
5. Dashboard menampilkan alert.
6. PIC Inventory dapat membuat transfer.

## Formula

```text
Recommended Refill =
Maximum Stock - Current Stock
```

---

# 30. UC-INV-007 — Trolley Stock Reconciliation

## Objective

Memastikan system stock dan physical stock konsisten.

## Main Flow

1. PIC memilih trolley.
2. System menampilkan stock.
3. PIC melakukan physical count.
4. System membandingkan.
5. Jika match, reconciliation complete.
6. Jika variance, adjustment dibuat.

---

# 31. UC-ADM-001 — Manage Needle Master

## Objective

Mengelola master type jarum.

## Actor

System Admin.

## Data

- Needle Code.
- Needle Name.
- Brand.
- Size.
- Specification.
- Unit.
- Min Stock.
- Max Stock.
- Active Status.

## Main Flow

1. Admin membuka Needle Master.
2. Create/Edit/Deactivate.
3. System validasi unique code.
4. Admin submit.
5. Backend menyimpan perubahan.
6. Audit trail dibuat.

## Business Rule

Needle Type yang telah digunakan dalam transaction tidak boleh hard delete.

---

# 32. UC-ADM-002 — Manage Factory Master

## Objective

Mengelola factory.

## Data

- Factory Code.
- Factory Name.
- Location.
- Status.

---

# 33. UC-ADM-003 — Manage Trolley Master

## Objective

Mengelola trolley sebagai stock location.

## Data

- Trolley Code.
- Trolley Name.
- Factory.
- Status.
- Min/Max configuration if applicable.

## Business Rules

Trolley Code unique dalam system.

---

# 34. UC-ADM-004 — Manage Employee Master

## Objective

Mengelola employee/operator.

## Data

- Employee ID.
- Name.
- Department.
- Sewing Line / Section if applicable.
- Status.
- RFID Identifier.

## Business Rule

RFID identifier harus unique.

---

# 35. UC-ADM-005 — Manage User & Role

## Objective

Mengelola system user dan permission.

## Roles

```text
SYSTEM_ADMIN
PIC_TROLI
PIC_INVENTORY
MANAGEMENT
APPROVER
```

## Main Flow

1. Admin membuat user.
2. Assign role.
3. Assign scope jika diperlukan.
4. Activate user.
5. Audit trail dibuat.

---

# 36. UC-ADM-006 — Manage Device

## Objective

Mendaftarkan Android Tablet.

## Data

- Device ID.
- Device Name.
- Platform.
- Factory.
- Trolley.
- Status.
- App Version.
- Last Sync.

## Main Flow

1. Admin register device.
2. Assign Factory.
3. Assign Trolley.
4. Activate.
5. Device dapat login.

## Business Rule

Satu device operational hanya boleh memiliki satu active trolley context.

---

# 37. UC-ADM-007 — Manage Exchange Type

## Objective

Mengelola exchange type.

Default:

```text
BROKEN
BENT
CHANGEOVER
```

Admin dapat mengatur:
- active status;
- photo requirement;
- approval requirement;
- same-type rule;
- storage rule.

---

# 38. UC-ADM-008 — Manage System Configuration

## Objective

Mengelola parameter system.

Contoh:

```text
Minimum Stock
Maximum Stock
Critical Stock Threshold
Confirmation Expiry
Photo Requirement
Offline Transaction Policy
Approval Policy
```

Configuration change wajib audit.

---

# 39. UC-MGT-002 — Dashboard Overview

## Objective

Management melihat kondisi system secara aggregated.

## Main Flow

1. Management login.
2. System menampilkan dashboard.
3. User memilih date range.
4. User memilih factory.
5. User dapat drill down ke trolley.
6. Dashboard menampilkan KPI.

## KPI

- Total exchange.
- Broken.
- Bent.
- Changeover.
- Consumption.
- Current stock.
- Low stock.
- Critical stock.
- Stock variance.
- Pending confirmation.

---

# 40. UC-MGT-003 — Exchange Analytics

## Objective

Menganalisis pola penukaran jarum.

## Dimensions

```text
Factory
Trolley
Date
Operator
Needle Type
Exchange Type
PIC
```

## Metrics

```text
Exchange Count
Exchange Rate
Broken Ratio
Bent Ratio
Changeover Ratio
```

---

# 41. UC-MGT-004 — Inventory Analytics

## Objective

Menganalisis inventory.

## Metrics

- Opening stock.
- Receiving.
- Transfer in.
- Transfer out.
- Issue.
- Return.
- Adjustment.
- Closing stock.
- Variance.
- Stock turnover.

---

# 42. UC-MGT-005 — Exception Dashboard

## Objective

Monitoring exception.

## Data

- Broken fragment missing.
- Waiting approval.
- Rejected confirmation.
- Expired confirmation.
- Sync failure.
- Stock variance.
- Manual adjustment.
- Unauthorized device.

---

# 43. UC-MGT-006 — Audit Trail Viewer

## Objective

Melihat history perubahan system.

## Filter

```text
Date
Actor
Factory
Trolley
Transaction
Action
Entity
```

## Main Flow

1. User membuka audit viewer.
2. User memilih filter.
3. System menampilkan event.
4. User membuka detail event.

---

# 44. UC-SYS-003 — Stock Movement Ledger

## Objective

Menyimpan seluruh pergerakan stock.

## Movement Types

```text
RECEIVING
TRANSFER_IN
TRANSFER_OUT
ISSUE
RETURN
ADJUSTMENT
REVERSAL
```

## Required Data

```text
Movement ID
Reference ID
Movement Type
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

---

# 45. UC-SYS-004 — Stock Reversal

## Objective

Membalik stock movement yang salah tanpa menghapus historical movement.

## Main Flow

1. Authorized user memilih movement.
2. System melakukan validation.
3. User memberikan reason.
4. Backend membuat reversal movement.
5. Balance diperbarui.
6. Original movement tetap tersimpan.
7. Audit trail dibuat.

---

# 46. UC-SYS-005 — Audit Event Recording

## Objective

Mencatat aktivitas penting.

## Event Minimum

```text
LOGIN
RFID_IDENTIFICATION
EXCHANGE_CREATED
NEEDLE_SELECTED
EXCHANGE_TYPE_SELECTED
PHOTO_CAPTURED
CONFIRMATION_CREATED
CONFIRMATION_APPROVED
CONFIRMATION_REJECTED
NEEDLE_ISSUED
EXCHANGE_COMPLETED
STOCK_RECEIVED
STOCK_TRANSFERRED
STOCK_RETURNED
STOCK_ADJUSTED
STOCK_REVERSED
MASTER_CHANGED
USER_CHANGED
ROLE_CHANGED
DEVICE_BOUND
```

---

# 47. UC-SYS-006 — Offline Data Sync Conflict Resolution

## Objective

Menangani transaction mobile yang tidak dapat diterima backend saat sync.

## Trigger

Backend menolak transaction karena conflict.

## Possible Conflict

- stock berubah;
- master data berubah;
- transaction duplicate;
- employee inactive;
- trolley inactive;
- device revoked;
- business rule changed.

## Main Flow

1. Mobile mengirim transaction.
2. Backend melakukan validation.
3. Conflict ditemukan.
4. Backend mengembalikan conflict code.
5. Mobile menyimpan `SYNC_CONFLICT`.
6. User melihat sync issue.
7. Authorized user melakukan review.
8. System melakukan resolution sesuai policy.

## Rule

System tidak boleh overwrite transaction secara silent.

---

# 48. UC-SYS-007 — Device Context Validation

## Objective

Memastikan transaction berasal dari device dan trolley yang valid.

## Main Flow

1. Request masuk ke backend.
2. Backend membaca Device ID.
3. Backend mencari device assignment.
4. Backend memvalidasi status.
5. Backend memvalidasi Factory/Trolley context.
6. Request diterima atau ditolak.

## Rejection

```text
DEVICE_NOT_REGISTERED
DEVICE_INACTIVE
TROLLEY_INACTIVE
CONTEXT_MISMATCH
```

---

# 49. UC-SYS-008 — Authorization Validation

## Objective

Memastikan user memiliki permission.

## Main Flow

1. Backend membaca authenticated user.
2. Backend membaca role.
3. Backend membaca permission.
4. Backend membaca scope.
5. Request diterima atau ditolak.

## Examples

PIC Troli:

```text
CREATE_EXCHANGE
ISSUE_NEEDLE
COMPLETE_EXCHANGE
```

PIC Inventory:

```text
RECEIVE_STOCK
TRANSFER_STOCK
ADJUST_STOCK
PHYSICAL_COUNT
```

System Admin:

```text
MANAGE_MASTER
MANAGE_USER
MANAGE_DEVICE
```

Management:

```text
VIEW_DASHBOARD
VIEW_ANALYTICS
VIEW_REPORT
```

Approver:

```text
APPROVE_CONFIRMATION
REJECT_CONFIRMATION
```

---

# 50. UC-SYS-009 — Notification Delivery Tracking

## Objective

Melacak delivery status notification.

## Status

```text
QUEUED
SENT
DELIVERED
FAILED
RETRYING
```

## Main Flow

1. Backend membuat notification.
2. Service mengirim.
3. Provider mengembalikan status.
4. System menyimpan delivery status.
5. Failed notification dapat retry sesuai policy.

---

# 51. UC-SYS-010 — Scheduled Confirmation Expiry

## Objective

Menangani confirmation yang tidak mendapat response.

## Main Flow

1. Scheduler mencari `WAITING`.
2. System mengecek expiry time.
3. Confirmation expired jika melewati threshold.
4. Status menjadi `EXPIRED`.
5. Transaction tetap blocked.
6. Notification dapat dikirim kembali sesuai policy.

---

# 52. Use Case Relationship

## Needle Exchange

```text
UC-MOB-003 Create Exchange
       |
       v
UC-MOB-002 RFID
       |
       v
UC-MOB-004 Old Needle Type
       |
       v
UC-MOB-005 Exchange Type
       |
       +-----------------------------+
       |                             |
       v                             v
UC-MOB-006 Broken Validation    Bent / Changeover
       |
       v
UC-MOB-007 Confirmation
       |
       v
UC-SYS-001 WhatsApp
       |
       v
UC-MGT-001 Approval
       |
       +-------------+
                     |
                     v
UC-MOB-008 Photo
       |
       v
UC-MOB-009 New Needle
       |
       v
UC-MOB-010 Stock Validation
       |
       v
UC-MOB-011 Issue
       |
       v
UC-MOB-012 Store Used Needle
       |
       v
UC-MOB-013 Complete
       |
       +--------------------+
                            |
                            v
                  UC-SYS-003 Stock Ledger
                            |
                            v
                  UC-SYS-005 Audit
```

---

# 53. Inventory Relationship

```text
UC-INV-001 Receiving
       |
       v
Stock Ledger
       |
       v
Warehouse Stock
       |
       v
UC-INV-002 Transfer
       |
       v
Trolley Stock
       |
       v
UC-MOB-011 Issue
       |
       v
Trolley Stock -
```

Return:

```text
Trolley Stock
       |
       v
UC-INV-003 Return
       |
       v
Warehouse Stock
```

Adjustment:

```text
Physical Count
       |
       v
UC-INV-005
       |
       v
Variance
       |
       v
UC-INV-004 Adjustment
```

---

# 54. Offline Relationship

```text
Mobile Transaction
       |
       v
Local DB
       |
       v
Sync Queue
       |
       v
UC-SYS-002 Synchronization
       |
       +----------------+
       |                |
     ACCEPT          CONFLICT
       |                |
    SYNCED       UC-SYS-006
```

---

# 55. End-to-End Traceability

Setiap completed exchange minimal dapat ditelusuri:

```text
Factory
   |
Trolley
   |
Device
   |
PIC
   |
Operator
   |
RFID
   |
Exchange ID
   |
Old Needle Type
   |
Exchange Type
   |
Fragment Status
   |
Photo
   |
Confirmation (if required)
   |
New Needle Type
   |
Stock Movement
   |
Used Needle Storage
   |
Completion
   |
Audit Trail
```

---

# 56. Functional Acceptance Criteria

## AC-001 — Exchange

Given operator datang ke trolley,

When PIC membuat exchange,

Then system harus dapat mengidentifikasi operator melalui RFID dan membuat exchange transaction.

## AC-002 — Needle Type

Given exchange sedang berlangsung,

When PIC memilih needle,

Then old dan new needle type harus berasal dari active Needle Master.

## AC-003 — Broken Fragment

Given exchange type BROKEN,

When fragment tidak ditemukan,

Then replacement issuance harus blocked sampai confirmation approved.

## AC-004 — WhatsApp

Given confirmation dibuat,

Then authorized approver harus menerima notification melalui configured WhatsApp channel.

## AC-005 — Approval

Given approver approve,

Then transaction dapat melanjutkan ke issuance sesuai business rule.

## AC-006 — Stock

Given trolley memiliki stock cukup,

When needle diterbitkan,

Then stock trolley berkurang sesuai quantity dan stock movement dibuat.

## AC-007 — Insufficient Stock

Given trolley stock tidak cukup,

When PIC mencoba issue,

Then system harus block issuance.

## AC-008 — Changeover

Given exchange type CHANGEOVER,

When new needle dipilih,

Then new needle type boleh berbeda dari old needle type.

## AC-009 — Audit

Given transaction selesai,

Then seluruh event penting harus dapat ditelusuri.

## AC-010 — Offline

Given tablet offline,

When transaction dilakukan dengan cached data yang valid,

Then transaction harus tersimpan local dan masuk sync queue.

## AC-011 — Duplicate Sync

Given transaction pernah berhasil sync,

When device melakukan retry,

Then backend tidak membuat duplicate transaction.

## AC-012 — Transfer

Given warehouse stock cukup,

When transfer dilakukan,

Then warehouse stock berkurang dan trolley stock bertambah secara atomic.

## AC-013 — Adjustment

Given physical stock berbeda dari system stock,

When adjustment approved,

Then stock balance dan movement ledger harus diperbarui.

## AC-014 — Device

Given device tidak terdaftar,

When request transaksi dikirim,

Then backend harus menolak request.

## AC-015 — Authorization

Given user tidak memiliki permission,

When user mengakses protected action,

Then backend harus menolak action.

---

# 57. UAT Coverage Matrix

| Process | Use Case | Mobile | Web | Backend | UAT |
|---|---|---:|---:|---:|---:|
| Login PIC | UC-MOB-001 | ✓ | | ✓ | ✓ |
| RFID | UC-MOB-002 | ✓ | | ✓ | ✓ |
| Create Exchange | UC-MOB-003 | ✓ | | ✓ | ✓ |
| Old Needle Type | UC-MOB-004 | ✓ | | ✓ | ✓ |
| Exchange Type | UC-MOB-005 | ✓ | | ✓ | ✓ |
| Broken Validation | UC-MOB-006 | ✓ | | ✓ | ✓ |
| Confirmation | UC-MOB-007 | ✓ | ✓ | ✓ | ✓ |
| WhatsApp | UC-SYS-001 | | | ✓ | ✓ |
| Approval | UC-MGT-001 | | ✓ | ✓ | ✓ |
| Photo | UC-MOB-008 | ✓ | | ✓ | ✓ |
| New Needle | UC-MOB-009 | ✓ | | ✓ | ✓ |
| Stock Validation | UC-MOB-010 | ✓ | | ✓ | ✓ |
| Issue | UC-MOB-011 | ✓ | | ✓ | ✓ |
| Store Used Needle | UC-MOB-012 | ✓ | | ✓ | ✓ |
| Complete | UC-MOB-013 | ✓ | | ✓ | ✓ |
| Cancel | UC-MOB-014 | ✓ | | ✓ | ✓ |
| Offline | UC-MOB-015 | ✓ | | ✓ | ✓ |
| Sync | UC-SYS-002 | ✓ | | ✓ | ✓ |
| Receiving | UC-INV-001 | | ✓ | ✓ | ✓ |
| Warehouse → Trolley | UC-INV-002 | | ✓ | ✓ | ✓ |
| Trolley → Warehouse | UC-INV-003 | | ✓ | ✓ | ✓ |
| Adjustment | UC-INV-004 | | ✓ | ✓ | ✓ |
| Physical Count | UC-INV-005 | | ✓ | ✓ | ✓ |
| Replenishment | UC-INV-006 | | ✓ | ✓ | ✓ |
| Reconciliation | UC-INV-007 | | ✓ | ✓ | ✓ |
| Needle Master | UC-ADM-001 | | ✓ | ✓ | ✓ |
| Factory Master | UC-ADM-002 | | ✓ | ✓ | ✓ |
| Trolley Master | UC-ADM-003 | | ✓ | ✓ | ✓ |
| Employee Master | UC-ADM-004 | | ✓ | ✓ | ✓ |
| User/Role | UC-ADM-005 | | ✓ | ✓ | ✓ |
| Device | UC-ADM-006 | | ✓ | ✓ | ✓ |
| Exchange Config | UC-ADM-007 | | ✓ | ✓ | ✓ |
| System Config | UC-ADM-008 | | ✓ | ✓ | ✓ |
| Dashboard | UC-MGT-002 | | ✓ | ✓ | ✓ |
| Exchange Analytics | UC-MGT-003 | | ✓ | ✓ | ✓ |
| Inventory Analytics | UC-MGT-004 | | ✓ | ✓ | ✓ |
| Exception Dashboard | UC-MGT-005 | | ✓ | ✓ | ✓ |
| Audit Viewer | UC-MGT-006 | | ✓ | ✓ | ✓ |
| Stock Ledger | UC-SYS-003 | | | ✓ | ✓ |
| Reversal | UC-SYS-004 | | ✓ | ✓ | ✓ |
| Audit Event | UC-SYS-005 | | | ✓ | ✓ |
| Sync Conflict | UC-SYS-006 | ✓ | ✓ | ✓ | ✓ |
| Device Validation | UC-SYS-007 | ✓ | | ✓ | ✓ |
| Authorization | UC-SYS-008 | ✓ | ✓ | ✓ | ✓ |
| Notification Tracking | UC-SYS-009 | | | ✓ | ✓ |
| Confirmation Expiry | UC-SYS-010 | | | ✓ | ✓ |

---

# 58. Development Boundary

## Mobile Team

Primary use cases:

```text
UC-MOB-001
UC-MOB-002
UC-MOB-003
UC-MOB-004
UC-MOB-005
UC-MOB-006
UC-MOB-008
UC-MOB-009
UC-MOB-010
UC-MOB-011
UC-MOB-012
UC-MOB-013
UC-MOB-014
UC-MOB-015
```

## Web Team

Primary use cases:

```text
UC-MGT-001
UC-MGT-002
UC-MGT-003
UC-MGT-004
UC-MGT-005
UC-MGT-006

UC-INV-001
UC-INV-002
UC-INV-003
UC-INV-004
UC-INV-005
UC-INV-006
UC-INV-007

UC-ADM-001
UC-ADM-002
UC-ADM-003
UC-ADM-004
UC-ADM-005
UC-ADM-006
UC-ADM-007
UC-ADM-008
```

## Backend Team

Backend harus mendukung seluruh use case karena backend menjadi final authority.

Primary system use cases:

```text
UC-SYS-001
UC-SYS-002
UC-SYS-003
UC-SYS-004
UC-SYS-005
UC-SYS-006
UC-SYS-007
UC-SYS-008
UC-SYS-009
UC-SYS-010
```

---

# 59. Definition of Done

Use Case Specification dianggap siap menjadi baseline development apabila:

- [ ] Semua process dari Business Process telah memiliki use case.
- [ ] Semua actor telah dipetakan.
- [ ] Mobile boundary jelas.
- [ ] Web boundary jelas.
- [ ] Backend responsibility jelas.
- [ ] Alternative flow tersedia.
- [ ] Exception flow tersedia.
- [ ] Business rules tersedia.
- [ ] Acceptance criteria tersedia.
- [ ] UAT coverage tersedia.
- [ ] Offline process tercakup.
- [ ] Inventory process tercakup.
- [ ] Confirmation process tercakup.
- [ ] WhatsApp notification tercakup.
- [ ] Audit trail tercakup.
- [ ] Stock movement tercakup.
- [ ] Reversal tercakup.
- [ ] Authorization tercakup.
- [ ] Device context tercakup.

---

# 60. Next Document

Setelah Use Case disetujui, urutan dokumen berikutnya:

```text
03-Use-Case.md
      |
      v
04-Functional-Requirements.md
      |
      v
05-System-Architecture.md
      |
      v
06-API-Specification.md
      |
      v
07-Database-Design.md
      |
      v
08-Mobile-UIUX-Specification.md
      |
      v
09-Web-UIUX-Specification.md
      |
      v
10-Non-Functional-Requirements.md
      |
      v
11-Security-Specification.md
      |
      v
12-Test-Strategy.md
```

**End of Use Case Specification**

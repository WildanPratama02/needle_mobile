# System Architecture Document
# Needle Management System

**Document:** 05 — System Architecture  
**Version:** 1.0  
**Status:** Draft / Architecture Baseline  
**Reference:** `01-PRD.md`, `02-Business-Process.md`, `03-Use-Case.md`, `04-Functional-Requirements.md`

---

## 1. Architecture Purpose

Dokumen ini mendefinisikan arsitektur teknis tingkat tinggi untuk Needle Management System berdasarkan PRD, Business Process, Use Case, dan Functional Requirements.

Sistem memiliki dua aplikasi utama:

1. **Troli System — Android Tablet**
   - Flutter.
   - Digunakan oleh PIC Troli.
   - Mendukung transaksi cepat, RFID, camera, stock validation, dan offline-first.

2. **Needle Management WebApp**
   - Digunakan oleh System Admin, PIC Inventory, Management, dan Approver.
   - Digunakan untuk master data, inventory, approval, reporting, dashboard, dan analytics.

Kedua aplikasi terhubung ke **Central Backend/API** sebagai Single Source of Truth.

---

## 2. Architecture Principles

### 2.1 Single Source of Truth

Business transaction dan inventory balance tidak boleh ditentukan hanya berdasarkan data lokal Android.

```text
Android Tablet / WebApp
          |
          v
     Central Backend
          |
          v
       Database
```

Android memiliki local database untuk offline operation, tetapi server menjadi authoritative state setelah synchronization.

### 2.2 Mobile First for Transaction

Android Troli harus memprioritaskan:
- jumlah tap minimum;
- tombol besar;
- informasi jelas;
- workflow linear;
- RFID-first operator identification;
- camera capture cepat;
- offline capability;
- status sync yang terlihat.

### 2.3 Trolley as Mobile Warehouse

Setiap trolley diperlakukan sebagai **inventory location**.

```text
Factory A
 |
 +-- Main Warehouse
 +-- Trolley A-01
 +-- Trolley A-02
 +-- Trolley A-03
```

Stock secara konseptual ditentukan oleh:

```text
Factory + Location + Needle Type
```

### 2.4 Backend Owns Business Rules

Business rule kritis berada di backend:
- stock validation;
- negative stock prevention;
- exchange validation;
- approval state;
- authorization;
- device validation;
- idempotency;
- stock movement;
- synchronization conflict.

### 2.5 Inventory Ledger First

Setiap perubahan quantity menghasilkan stock movement.

```text
Transaction
    |
    v
Stock Movement
    |
    v
Stock Balance
```

### 2.6 Auditability

Critical transaction harus dapat ditelusuri:

```text
Who / What / When / Where / Why / Before / After / Reference
```

### 2.7 Offline by Design

```text
ONLINE
  |
  +--> Server Transaction

OFFLINE
  |
  +--> Local Transaction
  +--> Sync Queue
  +--> Server Validation
```

---

# 3. High-Level Architecture

```text
                    +----------------------+
                    | Management / Admin   |
                    | PIC Inventory        |
                    | Approver             |
                    +----------+-----------+
                               |
                         HTTPS / API
                               |
              +----------------+----------------+
              |                                 |
              v                                 v
     +------------------+              +------------------+
     | Android Tablet   |              | WebApp           |
     | Flutter          |              | Management       |
     | PIC Troli        |              | Admin/Inventory  |
     +--------+---------+              +--------+---------+
              |                                 |
              +---------------+-----------------+
                              |
                              v
                    +-------------------+
                    | Central Backend   |
                    | REST API          |
                    +---------+---------+
                              |
             +----------------+----------------+
             |                |                |
             v                v                v
        Identity/Auth     Exchange         Inventory
             |                |                |
             +----------------+----------------+
                              |
                +-------------+-------------+
                |                           |
                v                           v
          PostgreSQL                  Object Storage
          Transaction DB              Photo Evidence
                |
                v
          Audit / Reporting

                    Backend Integration
                              |
                              v
                    WhatsApp Provider
```

---

# 4. Logical Components

## 4.1 Android Application

Technology:

```text
Flutter
Dart
Android Tablet
```

Responsibilities:
- authentication;
- trolley context;
- RFID scanning;
- operator lookup;
- exchange workflow;
- camera capture;
- new needle selection;
- local stock display;
- offline transaction storage;
- sync queue;
- synchronization;
- transaction status.

Android tidak boleh mengakses production database secara langsung.

---

## 4.2 WebApp

Responsibilities:
- dashboard;
- exchange history;
- confirmation/approval;
- inventory;
- receiving;
- transfer;
- return;
- adjustment;
- physical count;
- reconciliation;
- master data;
- reporting;
- analytics;
- audit.

WebApp hanya mengakses backend API.

---

## 4.3 Backend

Backend menjadi pusat:
- authentication;
- authorization;
- business rules;
- exchange transaction;
- inventory;
- stock ledger;
- approval;
- notification;
- photo metadata;
- offline sync validation;
- audit;
- reporting API.

---

# 5. Android Architecture

Recommended:

```text
Flutter App
|
+-- Presentation
|    +-- Login
|    +-- Dashboard
|    +-- Exchange
|    +-- History
|    +-- Stock
|    +-- Sync
|
+-- Application
|    +-- Exchange Use Cases
|    +-- Stock Use Cases
|    +-- Sync Use Cases
|
+-- Domain
|    +-- Exchange
|    +-- Operator
|    +-- Needle
|    +-- Stock
|    +-- Confirmation
|
+-- Data
     +-- Remote API
     +-- Local Database
     +-- RFID Adapter
     +-- Camera Adapter
     +-- File Storage
```

Recommended style:

```text
Clean Architecture
+
Feature-oriented modules
```

---

# 6. Android Feature Modules

### Authentication
```text
Login
Session
Token
Device Validation
```

### Exchange
```text
Create Exchange
RFID
Needle Type
Exchange Type
Broken Validation
Photo
New Needle
Issue
Storage
Complete
```

### Inventory
```text
Trolley Stock
Stock Availability
Low Stock
```

### Offline
```text
Local Transaction
Local Photo
Sync Queue
Sync Status
Conflict
Retry
```

---

# 7. WebApp Architecture

```text
WebApp
|
+-- Presentation
|    +-- Dashboard
|    +-- Exchange
|    +-- Inventory
|    +-- Master Data
|    +-- Approval
|    +-- Reports
|    +-- Audit
|
+-- Application
|    +-- Dashboard
|    +-- Inventory
|    +-- Approval
|    +-- Master
|
+-- API Client
|
+-- Authentication
|
+-- Authorization
```

---

# 8. Backend Architecture

Untuk tahap awal direkomendasikan **Modular Monolith**.

```text
                    REST API
                       |
        +--------------+--------------+
        |              |              |
     Identity       Exchange       Inventory
        |              |              |
     Device         Approval        Stock
        |              |              |
        +--------------+--------------+
                       |
                 PostgreSQL
```

Modular monolith dipilih karena:
- deployment lebih sederhana;
- transaction boundary lebih mudah;
- inventory consistency lebih mudah;
- koordinasi tim lebih sederhana;
- belum menambah operational complexity microservices.

Module dapat diekstraksi menjadi service terpisah apabila scale aktual membutuhkan.

---

# 9. Backend Modules

## 9.1 Identity & Access
- authentication;
- roles;
- permissions;
- factory scope;
- location scope;
- sessions;
- device authorization.

## 9.2 Device
```text
Device
Device Status
Device Version
Device-Trolley Binding
Device Validation
```

## 9.3 Operator
- Employee Master;
- RFID mapping;
- employee status;
- operator lookup.

## 9.4 Needle Master
- Needle Type;
- Needle Code;
- specification;
- unit;
- active/inactive.

## 9.5 Exchange
- create exchange;
- operator;
- old needle;
- exchange type;
- fragment validation;
- photo;
- new needle;
- issue;
- storage;
- completion;
- cancellation.

---

# 10. Exchange State Machine

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
EXCHANGE_SELECTED
  |
  +-----------------------+
  |                       |
  v                       v
BROKEN                 BENT / CHANGEOVER
  |
  v
FRAGMENT_STATUS
  |
  +--------------------+
  |                    |
FOUND              NOT_FOUND
  |                    |
  |                    v
  |             WAITING_CONFIRMATION
  |                    |
  |                    v
  |                APPROVAL
  |                    |
  |              +-----+-----+
  |              |           |
  |           APPROVED    REJECTED
  |              |           |
  +--------------+           v
               |          BLOCKED
               v
             PHOTO
               |
               v
      NEW_NEEDLE_SELECTED
               |
               v
       STOCK_VALIDATION
               |
         +-----+-----+
         |           |
      AVAILABLE    NO STOCK
         |           |
         v           v
       ISSUE       BLOCKED
         |
         v
USED_NEEDLE_STORED
         |
         v
COMPLETED
```

---

# 11. Inventory Architecture

Inventory berbasis location.

```text
Inventory
|
+-- Factory A
|    |
|    +-- Main Warehouse
|    |     +-- Needle A = 100
|    |     +-- Needle B = 200
|    |
|    +-- Trolley A-01
|    |     +-- Needle A = 20
|    |
|    +-- Trolley A-02
|    |     +-- Needle A = 15
|    |
|    +-- Trolley A-03
|          +-- Needle A = 18
|
+-- Factory B
     |
     +-- Main Warehouse
     +-- Trolley B-01
     +-- Trolley B-02
     +-- Trolley B-03
```

Initial requirement adalah 3 trolley per factory, tetapi model harus configurable agar jumlah trolley dapat berubah.

---

# 12. Inventory Transaction Architecture

## Receiving

```text
Supplier
   |
   v
Warehouse
   |
   v
RECEIVING
   |
   v
+Stock
```

## Transfer

```text
Warehouse
   |
   | -Q
   v
TRANSFER
   |
   | +Q
   v
Trolley
```

## Issue

```text
Trolley
   |
   | -Q
   v
Operator
```

## Return

```text
Trolley
   |
   | -Q
   v
Warehouse
   |
   | +Q
```

## Adjustment

```text
Physical Count
      |
      v
Variance
      |
      v
Approval
      |
      v
Adjustment
```

---

# 13. Stock Ledger

Conceptual model:

```text
Stock Movement
-------------------------------
movement_id
movement_type
reference_type
reference_id
factory_id
source_location_id
destination_location_id
needle_id
quantity
balance_before
balance_after
actor_id
created_at
```

Movement types:

```text
RECEIVING
TRANSFER
ISSUE
RETURN
ADJUSTMENT
REVERSAL
```

---

# 14. Stock Consistency

Konsep:

```text
Current Balance
=
Opening Balance
+
SUM(Stock Movements)
```

Backend harus menjamin:

```text
Current Balance >= 0
```

Stock-changing transaction harus atomic.

Contoh Issue:

```text
Issue Exchange
 |
 +-- Validate stock
 +-- Create issue
 +-- Create stock movement
 +-- Update balance
 +-- Commit
```

Jika critical step gagal, transaction di-rollback.

---

# 15. Database Architecture

Recommended primary transactional database:

```text
PostgreSQL
```

Core domains:

```text
Identity
Master
Exchange
Inventory
Approval
Notification
Audit
Device
```

Conceptual entities:

```text
users
roles
permissions
factories
trolleys
devices
employees
rfid_cards
needles
exchange_types
storage_locations
needle_exchanges
exchange_photos
confirmations
approval_actions
inventory_balances
stock_movements
stock_transfers
stock_adjustments
physical_counts
notifications
audit_logs
system_configurations
```

---

# 16. Object Storage

Photo evidence tidak disimpan sebagai binary utama di relational database.

```text
Android
   |
   v
Upload API
   |
   v
Object Storage
   |
   +-- Photo File
   |
Database
   |
   +-- Metadata / Reference
```

Logical path:

```text
factory/{factoryId}/
trolley/{trolleyId}/
exchange/{exchangeId}/
photo/{photoId}.jpg
```

---

# 17. RFID Integration

```text
RFID Reader
     |
     v
Android RFID Adapter
     |
     v
RFID Identifier
     |
     v
Local Employee Cache
     |
     v
Backend Validation
```

RFID hardware harus diisolasi melalui adapter/interface agar pergantian hardware tidak mengubah business logic exchange.

---

# 18. Camera Integration

```text
Tablet Camera
     |
     v
Camera Adapter
     |
     v
Local Temporary File
     |
     +---- ONLINE ----> Upload
     |
     +---- OFFLINE ---> Local Queue
```

Photo metadata harus terkait dengan Exchange ID.

---

# 19. WhatsApp Notification

WhatsApp hanya menjadi external notification channel.

```text
Confirmation Created
        |
        v
Notification Service
        |
        v
WhatsApp Provider/API
        |
        v
Supervisor
```

WhatsApp **tidak boleh langsung mengubah transaction atau inventory**.

Approval dilakukan melalui authenticated system.

---

# 20. Confirmation Architecture

Ketika broken fragment tidak ditemukan:

```text
Exchange
   |
   v
Confirmation
   |
   +--> Notification
   |
   v
Approver
   |
   +--> APPROVED
   |
   +--> REJECTED
```

Approval state disimpan secara terpusat.

---

# 21. Offline Architecture

Android local storage:

```text
Local Database
|
+-- Employee Cache
+-- Needle Cache
+-- Exchange Type Cache
+-- Trolley Context
+-- Stock Snapshot
+-- Exchange Draft
+-- Sync Queue
+-- Photo Queue
```

Offline transaction:

```text
PIC
 |
 v
Android
 |
 +-- Local DB
 +-- Local Photo
 |
 v
SYNC_PENDING
```

Network kembali:

```text
SYNC_PENDING
      |
      v
SYNCING
      |
      v
Backend Validation
      |
 +----+----+
 |         |
 v         v
SYNCED   CONFLICT
```

---

# 22. Offline Stock

Offline stock adalah **cached operational snapshot**, bukan authoritative final stock.

Contoh:

```text
Tablet:
Needle A = 5

Server:
Needle A = 2
```

Saat synchronization, backend wajib melakukan validation.

Conflict:

```text
SYNC_CONFLICT
```

Tidak boleh ada silent overwrite terhadap server stock.

---

# 23. Synchronization & Idempotency

Setiap transaksi lokal memiliki:

```text
client_transaction_id
```

ID harus unique.

Server:

```text
Receive Transaction
      |
      v
Check client_transaction_id
      |
 +----+----+
 |         |
Exists    New
 |         |
 v         v
Return    Process
Existing
Result
```

Tujuannya mencegah duplicate stock deduction ketika request retry.

---

# 24. API Architecture

Recommended:

```text
REST API
JSON
HTTPS
```

Endpoint groups:

```text
/api/v1/auth
/api/v1/users
/api/v1/devices
/api/v1/factories
/api/v1/trolleys
/api/v1/employees
/api/v1/rfid
/api/v1/needles
/api/v1/exchange-types
/api/v1/exchanges
/api/v1/confirmations
/api/v1/approvals
/api/v1/inventory
/api/v1/stock-movements
/api/v1/transfers
/api/v1/returns
/api/v1/adjustments
/api/v1/physical-counts
/api/v1/notifications
/api/v1/reports
/api/v1/dashboard
/api/v1/audit
/api/v1/sync
```

---

# 25. Authorization Architecture

Authorization menggunakan:

```text
User
+
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

Contoh:

```text
PIC_TROLI
Factory A
Trolley A-01
CREATE_EXCHANGE
```

tidak otomatis memiliki permission:

```text
TRANSFER_STOCK
MANAGE_MASTER_DATA
ADJUST_STOCK
```

---

# 26. Security Architecture

Minimum controls:

```text
HTTPS
Token-based authentication
Role-based authorization
Factory/location scoping
Secure mobile storage
Audit trail
Session expiration
Device validation
Server-side validation
```

Business rules kritis tidak boleh hanya bergantung pada client-side validation.

---

# 27. Audit Architecture

```text
User Action
    |
    v
Business Service
    |
    +--> Business Data
    |
    +--> Audit Event
```

Critical events:

```text
LOGIN
CREATE_EXCHANGE
APPROVE_CONFIRMATION
REJECT_CONFIRMATION
ISSUE_NEEDLE
TRANSFER_STOCK
ADJUST_STOCK
CHANGE_MASTER
CHANGE_CONFIGURATION
DEVICE_BIND
DEVICE_REVOKE
```

---

# 28. Observability

Backend minimal menyediakan:

```text
Application Logs
Error Logs
Audit Logs
API Metrics
Sync Metrics
Notification Metrics
Stock Transaction Metrics
```

Metrics:

```text
Exchange Success Rate
Exchange Failure Rate
Sync Failure Rate
Sync Conflict Rate
WhatsApp Failure Rate
API Latency
Low Stock Count
Pending Confirmation Count
```

---

# 29. Deployment Architecture

Recommended initial topology:

```text
Factory Network / Internet
          |
     Load Balancer
          |
      Backend API
          |
     +----+----+
     |         |
 PostgreSQL  Object Storage
     |
 Backup / Recovery
```

Applications:

```text
Android APK
WebApp
Backend API
Database
Object Storage
Notification Integration
```

---

# 30. Environment Strategy

Minimum:

```text
DEV
SIT / TEST
UAT
PRODUCTION
```

Database dan credentials harus terpisah antar environment.

```text
DEV DB  != SIT DB
SIT DB  != UAT DB
UAT DB  != PROD DB
```

---

# 31. CI/CD

```text
Developer
   |
   v
Git Repository
   |
   v
Pull Request
   |
   v
Code Review
   |
   v
Automated Test
   |
   v
Build
   |
   v
SIT
   |
   v
UAT
   |
   v
Production
```

---

# 32. Repository Structure

Recommended logical structure:

```text
needle-management/
|
+-- mobile-trolley/
|    +-- Flutter Android
|
+-- web-management/
|    +-- WebApp
|
+-- backend/
|    +-- API
|    +-- Business Modules
|
+-- database/
|    +-- Migration
|    +-- Seed
|
+-- infrastructure/
|    +-- Deployment
|    +-- Environment
|
+-- documentation/
|    +-- PRD
|    +-- Use Case
|    +-- SRS
|    +-- Architecture
```

Repository strategy dapat difinalisasi bersama Mobile Apps dan WebApps Development Team.

---

# 33. Team Architecture Boundary

## Mobile Apps Team

Owns:

```text
Flutter
Android UI/UX
RFID Adapter
Camera Adapter
Local DB
Offline Queue
Sync Client
Mobile Security
```

## WebApps Team

Owns:

```text
Web UI
Dashboard
Inventory UI
Master Data
Approval UI
Reporting
Analytics
```

## Backend / Platform

Owns:

```text
API
Business Rules
Inventory
Authentication
Authorization
Sync Validation
Notification
Audit
Database
Object Storage
Integration
```

Lead Architecture mengontrol cross-team contracts.

---

# 34. Cross-Team Contract

Contract-first untuk:

```text
API Contract
Data Model
Error Code
State Machine
Authentication
Authorization
Sync Protocol
Idempotency
Stock Movement Rules
Photo Upload Contract
Notification Contract
```

Business rules tidak boleh didefinisikan ulang secara independen oleh setiap team.

---

# 35. Core Transaction Sequence

```text
Android PIC
   |
   | Login
   v
Backend
   |
   | Validate User + Device + Trolley
   v
Android
   |
   | RFID Scan
   v
Operator
   |
   | Old Needle + Exchange Type
   v
Android
   |
   +---- BROKEN?
          |
          +-- YES --> Fragment Status
          |              |
          |              +-- NOT FOUND
          |                    |
          |                    v
          |              Confirmation
          |                    |
          |                    v
          |              WhatsApp Notify
          |                    |
          |                    v
          |                 Approval
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
        Issue
          |
          v
   Stock Movement
          |
          v
 Used Needle Storage
          |
          v
      Complete
          |
          v
     Audit Trail
```

---

# 36. Architecture Decision Records

## ADR-001 — Modular Monolith

**Decision:** Backend awal menggunakan modular monolith.

**Reason:**
- operational complexity lebih rendah;
- transaction consistency lebih mudah;
- development lebih cepat;
- cocok untuk initial scale.

Service extraction dilakukan hanya jika kebutuhan aktual mengharuskan.

## ADR-002 — PostgreSQL

**Decision:** PostgreSQL sebagai primary transactional database.

**Reason:**
- ACID;
- relational inventory model;
- constraints;
- reporting;
- mature ecosystem.

## ADR-003 — Trolley as Inventory Location

**Decision:** Trolley merupakan stock location.

**Reason:**
- mendukung 3 trolley per factory;
- mendukung jumlah trolley configurable;
- mendukung transfer;
- mendukung monitoring stock per trolley;
- mendukung reconciliation.

## ADR-004 — Backend as Stock Authority

**Decision:** Backend memiliki authoritative inventory state.

**Reason:**
- consistency;
- multiple clients;
- offline synchronization;
- auditability.

## ADR-005 — Offline-First Android

**Decision:** Android mendukung offline transaction.

**Reason:**
- aktivitas terjadi di production floor;
- network tidak selalu dapat diasumsikan tersedia.

## ADR-006 — WhatsApp as Notification Channel

**Decision:** WhatsApp hanya notification channel.

**Reason:**
- approval harus berada dalam authenticated system;
- mencegah perubahan transaction melalui messaging channel.

---

# 37. Architecture Traceability

| Requirement Domain | Architecture Component |
|---|---|
| Authentication | Identity & Access |
| RFID | Android RFID Adapter + Operator |
| Exchange | Exchange Module |
| Broken Fragment | Exchange + Approval |
| WhatsApp | Notification Service |
| Photo | Camera Adapter + Object Storage |
| New Needle | Exchange + Inventory |
| Stock | Inventory + Ledger |
| 3 Trolley / Factory | Location Model |
| Transfer | Inventory |
| Adjustment | Inventory |
| Master Data | Master Module |
| Dashboard | Reporting / Analytics |
| Audit | Audit Module |
| Offline | Mobile Local DB |
| Sync | Sync API + Idempotency |
| Device | Device Module |
| Security | Identity + Authorization |

---

# 38. Architecture Risks

| Risk | Impact | Mitigation |
|---|---|---|
| Network unavailable | High | Offline-first |
| Duplicate sync | High | Idempotency |
| Stock conflict | High | Server validation |
| Wrong trolley context | High | Device binding |
| RFID failure | Medium | Retry / controlled fallback |
| Photo storage growth | Medium | Object storage + retention |
| WhatsApp failure | Medium | Retry |
| Master data mismatch | High | Cache validation/versioning |
| Unauthorized approval | High | Authenticated approval |
| Incorrect adjustment | High | Approval + audit |
| Hardware replacement | Medium | Adapter architecture |

---

# 39. Open Architecture Decisions

1. Backend technology/framework.
2. WebApp framework.
3. PostgreSQL hosting model.
4. Object Storage provider.
5. WhatsApp Business API/provider.
6. RFID hardware model and SDK.
7. Android tablet specification.
8. Factory network architecture.
9. Authentication integration with existing company identity system.
10. Employee Master source.
11. Deployment model: cloud, on-premise, atau hybrid.
12. Backup and disaster recovery target.
13. Photo retention period.
14. Audit retention period.
15. Offline transaction maximum duration.
16. Conflict resolution ownership.
17. Stock transfer approval policy.
18. Stock adjustment approval policy.
19. Approval expiry policy.
20. Expected number of factories, trolleys, users, and daily exchanges.

---

# 40. Next Documents

```text
01-PRD.md
     |
02-Business-Process.md
     |
03-Use-Case.md
     |
04-Functional-Requirements.md
     |
05-System-Architecture.md
     |
     +-------------------------+
     |                         |
     v                         v
06-SRS-Mobile-Android.md   07-SRS-WebApp.md
     |                         |
     +------------+------------+
                  |
                  v
             08-API-Spec.md
                  |
                  v
          09-Database-Design.md
                  |
          +-------+-------+
          |               |
          v               v
    UI/UX Specification  Integration Spec
          |
          v
    Test / UAT Specification
```

---

# 41. Definition of Done

Architecture baseline siap menjadi dasar SRS apabila:

- [ ] Mobile boundary defined.
- [ ] WebApp boundary defined.
- [ ] Backend boundary defined.
- [ ] Inventory architecture defined.
- [ ] Trolley location model defined.
- [ ] Exchange state machine defined.
- [ ] Approval architecture defined.
- [ ] WhatsApp boundary defined.
- [ ] RFID boundary defined.
- [ ] Camera/storage architecture defined.
- [ ] Offline architecture defined.
- [ ] Sync/idempotency defined.
- [ ] Database direction defined.
- [ ] Security boundary defined.
- [ ] Audit boundary defined.
- [ ] Deployment direction defined.
- [ ] Team responsibility defined.
- [ ] Cross-team contracts identified.
- [ ] Architecture risks identified.
- [ ] Open decisions documented.

**End of System Architecture Document**

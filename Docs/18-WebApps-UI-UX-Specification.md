# 18 — WebApps UI/UX Specification
# Needle Management System

**Version:** 1.0  
**Status:** Draft / UI-UX Baseline  
**Platform:** WebApps  
**Primary Users:** System Admin, Management, PIC Inventory  
**Related Documents:** PRD, Use Case, Functional Requirement, SRS WebApps, System Architecture, WebApps Architecture, API Specification, Database Design, OpenAPI/Swagger, RFID Integration, WhatsApp Integration, Mobile Offline Sync, Security Architecture, Mobile UI/UX Specification

---

# 1. Purpose

Dokumen ini mendefinisikan UI/UX WebApps untuk management sistem penukaran jarum secara terpusat.

WebApps bukan merupakan extension dari aplikasi Tablet secara langsung. WebApps memiliki tanggung jawab yang lebih luas:

```text
Master Data
Inventory
Factory
Trolley
Confirmation
Transaction Monitoring
Dashboard Analytics
User / Role
Audit
System Administration
```

Primary users:

```text
System Admin
Management
PIC Inventory
```

Prinsip utama:

> **Operational Control, Visibility, Accuracy, Traceability, and Governance.**

---

# 2. WebApps Responsibility

Pembagian responsibility:

```text
ANDROID TABLET
        |
        | Operational Transaction
        v
PIC TROLI
        |
        v
CENTRAL BACKEND
        |
        +-------------------------+
        |                         |
        v                         v
     WEBAPPS                 DATABASE
        |
        +-- Admin
        +-- PIC Inventory
        +-- Management
```

Tablet fokus pada transaksi penukaran.

WebApps fokus pada:

- management master data
- inventory management
- factory/trolley management
- transaction monitoring
- confirmation monitoring
- dashboard analytics
- user/access management
- audit/troubleshooting

---

# 3. UX Principles

## 3.1 Desktop First

WebApps ditujukan terutama untuk:

```text
Desktop
Laptop
Large Tablet
```

Desktop menjadi baseline karena terdapat tabel, dashboard, filter, dan operational monitoring.

---

## 3.2 Information Density

Berbeda dengan Tablet:

```text
Mobile:
Large controls
Few decisions
Guided flow

WebApps:
More information
Tables
Filters
Charts
Bulk management
```

---

## 3.3 Role-Based Experience

User hanya melihat menu sesuai permission.

Contoh:

```text
PIC Inventory
    ↓
Inventory
    ↓
Stock
    ↓
Movement
```

Management:

```text
Management
    ↓
Dashboard
    ↓
Analytics
    ↓
Monitoring
```

System Admin:

```text
Admin
    ↓
Master
Users
Roles
Devices
Configuration
Audit
```

Frontend hiding menu bukan security boundary. Backend tetap melakukan authorization.

---

# 4. Global Layout

Recommended:

```text
┌───────────────────────────────────────────────────────────────┐
│ Logo | System Name                  User | Notification | ▼  │
├───────────────┬───────────────────────────────────────────────┤
│               │                                               │
│ Dashboard     │ Breadcrumb                                    │
│               │                                               │
│ Transactions  │ Page Title                                    │
│ Inventory     │                                               │
│ Master Data   │ Main Content                                  │
│ Confirmation  │                                               │
│ Analytics     │                                               │
│ Administration│                                               │
│               │                                               │
└───────────────┴───────────────────────────────────────────────┘
```

---

# 5. Global Header

Header contains:

```text
System Logo
Factory Scope
Notification
User
Role
Logout
```

Example:

```text
Needle Management
Factory: All
        🔔 3
        Budi | PIC Inventory ▼
```

---

# 6. Factory Scope Selector

Factory scope sangat penting karena stock dan trolley dikelola berdasarkan factory.

Example:

```text
Factory:
[ All Factories ▼ ]
```

Untuk user yang hanya mempunyai Factory A:

```text
Factory:
[ Factory A ]
```

User tidak dapat memilih factory di luar authorization scope.

---

# 7. Sidebar Navigation

Recommended baseline:

```text
Dashboard

Transactions
  ├─ Exchange Transactions
  └─ Confirmation

Inventory
  ├─ Stock Overview
  ├─ Stock Movement
  ├─ Receiving
  ├─ Transfer
  └─ Adjustment

Master Data
  ├─ Needle Type
  ├─ Exchange Type
  ├─ Factory
  ├─ Trolley
  ├─ Storage / Needle Hole
  ├─ Employee
  └─ RFID Card

Administration
  ├─ Users
  ├─ Roles & Permissions
  ├─ Devices
  └─ Audit Log

Analytics
```

Actual menu is permission-driven.

---

# 8. Dashboard

Dashboard adalah landing page untuk Management dan dapat disesuaikan berdasarkan role.

High-level:

```text
┌───────────────────────────────────────────────────────────────┐
│ Dashboard                                                     │
│ Factory [All]     Period [Today ▼]                           │
├────────────┬────────────┬────────────┬────────────────────────┤
│ Exchanges  │ Broken     │ Bent       │ Changeover             │
│ 1,245      │ 530        │ 312        │ 403                    │
├────────────┴────────────┴────────────┴────────────────────────┤
│                                                               │
│ Exchange Trend                                                │
│ [                     CHART                         ]          │
│                                                               │
├───────────────────────────────┬───────────────────────────────┤
│ Top Needle Types              │ Stock Alert                  │
│ [Table/Chart]                 │ Low Stock / Out of Stock     │
└───────────────────────────────┴───────────────────────────────┘
```

---

# 9. Dashboard KPI

Baseline KPI:

```text
Total Exchange
Broken Needle
Bent Needle
Changeover
Pending Confirmation
Low Stock
Out of Stock
```

Additional KPI may be added after business validation.

---

# 10. Dashboard Filters

Common filters:

```text
Factory
Trolley
Date Range
Exchange Type
Needle Type
Operator
```

Filters should be consistent across reporting screens.

---

# 11. Exchange Transaction List

Purpose:

Monitoring all exchange transactions.

Table:

```text
┌───────────────────────────────────────────────────────────────┐
│ Exchange Transactions                                         │
├───────────────────────────────────────────────────────────────┤
│ Search [____________] Factory [▼] Type [▼] Date [____]       │
├───────┬──────────┬───────────┬────────┬───────────┬───────────┤
│ No    │ Date     │ Operator  │ Type   │ Needle    │ Status    │
├───────┼──────────┼───────────┼────────┼───────────┼───────────┤
│ EX001 │ 08:30    │ EMP001    │ Broken │ DBX1      │ Completed │
│ EX002 │ 08:45    │ EMP002    │ Bent   │ DBX1      │ Completed │
└───────┴──────────┴───────────┴────────┴───────────┴───────────┘
```

---

# 12. Exchange Detail

Detail page:

```text
Exchange Information
--------------------------------
Exchange No
Date/Time
Factory
Trolley
PIC

Operator
Employee Number
RFID

Exchange Type
Old Needle Type
New Needle Type

Fragment Status
Confirmation Status

Evidence
[Photo]

Inventory Movement
[Movement Reference]

Audit
[Timeline]
```

---

# 13. Exchange Detail Timeline

Use timeline:

```text
08:30  Exchange Created
08:30  Operator Identified
08:31  Exchange Type Selected
08:31  Needle Type Selected
08:32  Photo Captured
08:33  Supervisor Confirmation Requested
08:35  Confirmation Approved
08:36  Needle Issued
08:37  Used Needle Stored
08:37  Exchange Completed
```

Timeline is useful for traceability.

---

# 14. Transaction Status

Baseline statuses:

```text
DRAFT
PENDING_CONFIRMATION
PENDING_SYNC
COMPLETED
FAILED
CANCELLED
```

UI should use:

```text
Status badge
+
Icon
+
Text
```

Do not rely on color only.

---

# 15. Confirmation Monitoring

Screen:

```text
┌───────────────────────────────────────────────────────────────┐
│ Supervisor Confirmation                                       │
├───────────────────────────────────────────────────────────────┤
│ Pending | Approved | Rejected | Expired                      │
├──────────┬──────────┬───────────┬────────────┬───────────────┤
│ Exchange │ Operator │ Factory   │ Supervisor │ Status        │
├──────────┼──────────┼───────────┼────────────┼───────────────┤
│ EX001    │ EMP001   │ Factory A │ SPV001     │ Pending       │
└──────────┴──────────┴───────────┴────────────┴───────────────┘
```

---

# 16. Confirmation Detail

Display:

```text
Exchange
Operator
Factory
Trolley
Needle Type
Exchange Type
Fragment Status
Photo Evidence
Supervisor
Requested At
Response At
Decision
Reason
Notification Status
```

---

# 17. WhatsApp Notification Status

Show:

```text
QUEUED
SENT
DELIVERED
READ
FAILED
```

Example:

```text
WhatsApp
✓ Delivered
```

If failed:

```text
⚠ Failed
[Retry]
```

Retry must use backend idempotency.

---

# 18. Inventory Overview

Inventory is managed per:

```text
Factory
Trolley / Location
Needle Type
```

Because each factory can have multiple trolleys, WebApps must provide clear location hierarchy.

Example:

```text
Factory A
 ├── Trolley 01
 ├── Trolley 02
 └── Trolley 03
```

---

# 19. Stock Overview

Screen:

```text
┌───────────────────────────────────────────────────────────────┐
│ Stock Overview                                                │
├───────────────────────────────────────────────────────────────┤
│ Factory [A] Trolley [All] Needle Type [All]                  │
├──────────┬────────────┬───────────┬──────────┬───────────────┤
│ Needle   │ Factory    │ Location  │ Balance  │ Status        │
├──────────┼────────────┼───────────┼──────────┼───────────────┤
│ DBX1     │ Factory A  │ Trolley 1 │ 100      │ Normal        │
│ DBX1     │ Factory A  │ Trolley 2 │ 8        │ Low           │
│ DBX1     │ Factory A  │ Trolley 3 │ 0        │ Out of Stock  │
└──────────┴────────────┴───────────┴──────────┴───────────────┘
```

---

# 20. Stock Detail

Stock detail:

```text
Needle Type
Factory
Location
Opening Balance
Received
Issued
Transferred In
Transferred Out
Adjustment
Current Balance
Minimum Stock
Maximum Stock
```

---

# 21. Stock Movement

All stock-changing operations must be traceable.

Movement types:

```text
RECEIVE
ISSUE
TRANSFER_IN
TRANSFER_OUT
RETURN
ADJUSTMENT
```

Table:

```text
Date
Reference
Movement Type
Needle Type
Qty
From
To
Actor
Balance After
```

---

# 22. Receiving

Receiving flow:

```text
Create Receiving
      ↓
Select Factory
      ↓
Select Needle Type
      ↓
Quantity
      ↓
Reference / Document
      ↓
Confirm
      ↓
Stock Updated
```

Large confirmation dialog should show impact:

```text
Current Balance: 50
Receive: +100
New Balance: 150
```

---

# 23. Transfer

Transfer is used between authorized inventory locations.

Example:

```text
Factory A
Trolley 01
       |
       | 20 pcs
       v
Trolley 02
```

Flow:

```text
Source
 ↓
Destination
 ↓
Needle Type
 ↓
Quantity
 ↓
Validation
 ↓
Confirm
 ↓
Atomic Movement
```

---

# 24. Adjustment

Adjustment is sensitive.

UI must require:

```text
Needle Type
Location
Current Balance
Adjusted Balance
Difference
Reason
Evidence / Reference where required
```

Example:

```text
Current: 100
Adjusted: 97
Difference: -3
Reason: Physical count discrepancy
```

Adjustment should require elevated permission.

---

# 25. Stock Alerts

Alerts:

```text
LOW STOCK
OUT OF STOCK
NEGATIVE STOCK ATTEMPT
UNUSUAL MOVEMENT
```

Negative stock should normally be blocked by backend.

---

# 26. Needle Type Master

Purpose:

Manage needle types used in exchange and inventory.

Table:

```text
Code
Name
Category
Unit
Status
Min Stock
Max Stock
Created
Updated
```

Actions:

```text
View
Create
Edit
Activate
Deactivate
```

Do not hard-delete a needle type already referenced by historical transactions unless the database/business policy explicitly supports it.

---

# 27. Needle Type Detail

Fields:

```text
Needle Code
Needle Name
Description
Category
Unit
Status
Default Min Stock
Default Max Stock
```

Show usage references:

```text
Current Stock
Factories
Trolleys
Recent Exchanges
```

---

# 28. Exchange Type Master

Baseline values:

```text
BROKEN
BENT
CHANGEOVER
```

The UI should not allow arbitrary exchange types without proper business approval.

---

# 29. Factory Master

Fields:

```text
Factory Code
Factory Name
Location
Status
```

Factory detail should show:

```text
Trolley Count
Active Trolleys
Stock Summary
Exchange Summary
```

---

# 30. Trolley Master

Because each factory has multiple trolleys:

```text
Factory
  |
  +-- Trolley 01
  +-- Trolley 02
  +-- Trolley 03
```

Trolley fields:

```text
Trolley Code
Trolley Name
Factory
Status
Assigned Device
Operational Status
```

---

# 31. Trolley Detail

Display:

```text
Trolley Information
Factory
Device
PIC / Assignment
Status

Stock Summary
Exchange Summary
Last Sync
Last Activity
```

---

# 32. Storage / Needle Hole Master

Physical storage location must be mapped to exchange/storage rules.

Example:

```text
Factory A
Trolley 01
 ├── Broken Needle Hole
 ├── Bent Needle Hole
 └── Changeover Needle Hole
```

Fields:

```text
Storage Code
Storage Name
Factory
Trolley
Exchange Type
Physical Position
Status
```

The Tablet uses this mapping to instruct PIC where to place the exchanged needle.

---

# 33. Employee Master

Employee data is used by RFID resolution.

Fields:

```text
Employee Number
Name
Department
Line / Section
Factory
Supervisor
Status
```

The exact organizational fields remain subject to approved master-data structure.

---

# 34. RFID Card Master

Fields:

```text
RFID UID
Employee
Factory
Status
Registered At
```

Actions:

```text
Assign
Unassign
Deactivate
Replace
```

RFID UID is not an authorization credential by itself.

---

# 35. Device Management

WebApps should manage Android Tablet registration.

Table:

```text
Device ID
Device Name
Factory
Trolley
App Version
Status
Last Seen
Last Sync
```

Statuses:

```text
ACTIVE
INACTIVE
REVOKED
```

---

# 36. Device Detail

Display:

```text
Device Information
Trolley Assignment
Factory
Application Version
OS Version
Last Heartbeat
Last Sync
RFID Status
Camera Status
```

Actions:

```text
Reassign
Deactivate
Revoke
```

Sensitive device actions require authorization.

---

# 37. User Management

System Admin manages:

```text
Users
Roles
Permissions
Factory Scope
Status
```

User table:

```text
Username
Name
Role
Factory Scope
Status
Last Login
```

---

# 38. Role & Permission

Baseline roles:

```text
SYSTEM_ADMIN
PIC_TROLI
PIC_INVENTORY
MANAGEMENT
```

Permission model:

```text
Role
  +
Permission
  +
Factory Scope
```

---

# 39. Audit Log

Audit screen:

```text
Timestamp
Actor
Role
Action
Entity
Entity ID
Factory
Device
Result
```

Detail:

```text
Before
After
Request ID
IP where applicable
```

Audit should support filtering by:

```text
Date
User
Factory
Entity
Action
Result
```

---

# 40. Analytics

Analytics should support Management decision making.

Baseline views:

```text
Exchange Trend
Exchange by Type
Exchange by Factory
Exchange by Trolley
Needle Type Consumption
Broken Needle Trend
Bent Needle Trend
Changeover Trend
Stock Trend
Low Stock
Out of Stock
```

---

# 41. Exchange Trend

Example:

```text
Daily Exchange Volume

│       ╭──╮
│   ╭───╯  ╰──╮
│───╯         ╰────
└──────────────────
```

Filters:

```text
Factory
Trolley
Period
```

---

# 42. Exchange by Type

Chart:

```text
BROKEN
BENT
CHANGEOVER
```

Can be represented as:

```text
Bar Chart
```

or

```text
Donut Chart
```

depending on reporting requirement.

---

# 43. Needle Consumption

Display:

```text
Needle Type
Opening
Received
Issued
Transferred
Adjustment
Closing
```

This provides Management/PIC Inventory visibility into consumption.

---

# 44. Factory Comparison

Management may compare authorized factories:

```text
Factory
Exchange
Consumption
Stock
Low Stock
Broken %
```

Do not expose data outside user's authorized scope.

---

# 45. Trolley Comparison

Example:

```text
Factory A

Trolley 01 → 430 exchanges
Trolley 02 → 390 exchanges
Trolley 03 → 425 exchanges
```

Useful for operational monitoring.

---

# 46. Export

Where permitted:

```text
CSV
Excel
PDF
```

Exports must respect:

```text
Role
Permission
Factory Scope
Date Filter
```

Large exports should use asynchronous job processing.

---

# 47. Search and Filter Standard

All operational tables should support appropriate:

```text
Search
Filter
Sort
Pagination
Date Range
Export
```

Filters should persist during navigation where practical.

---

# 48. Table Standard

Table should support:

```text
Column sorting
Pagination
Row action
Status badge
Empty state
Loading state
Error state
```

Avoid excessive columns on the primary list.

Use detail pages/drawers for secondary information.

---

# 49. Detail Drawer vs Detail Page

Use drawer for:

```text
Quick inspection
```

Use full detail page for:

```text
Complex entity
Multiple sections
Audit timeline
Evidence
Stock movement
```

Exchange Detail should use a full detail page.

---

# 50. Form Standard

Forms should have:

```text
Label
Input
Helper text
Validation
Error
Save
Cancel
```

Required field:

```text
*
```

Do not rely only on placeholder text.

---

# 51. Confirmation Dialog

Destructive or stock-impacting actions require confirmation.

Example:

```text
Confirm Stock Adjustment

Needle Type: DBX1
Location: Trolley 02
Current: 100
New: 97
Difference: -3
Reason: Physical discrepancy

[Cancel] [Confirm Adjustment]
```

---

# 52. Empty State

Example:

```text
Belum ada transaksi.

Coba ubah filter atau periode pencarian.
```

For stock:

```text
Belum ada stock pada lokasi ini.
```

---

# 53. Loading State

Use:

```text
Skeleton
Spinner
Progress
```

Avoid blocking entire page for small operations.

For long-running export:

```text
Export sedang diproses.
Anda dapat melanjutkan pekerjaan lainnya.
```

---

# 54. Error State

Technical:

```text
Terjadi kesalahan.
Silakan coba lagi.
```

Business:

```text
Stock tidak mencukupi.
```

Authorization:

```text
Anda tidak memiliki permission untuk tindakan ini.
```

Never display stack traces or internal service details.

---

# 55. Notification Center

Notifications may include:

```text
Pending Confirmation
Low Stock
Out of Stock
Sync Failure
Device Offline
Integration Failure
```

Notifications must be permission-aware.

---

# 56. Factory/Trolley Operational Monitoring

Recommended monitoring page:

```text
Factory A

Trolley 01   ● Online
Trolley 02   ● Online
Trolley 03   ⚠ Offline

Last Sync:
Trolley 01  08:32
Trolley 02  08:31
Trolley 03  07:55
```

This is especially important because one factory can have multiple trolleys.

---

# 57. Inventory Location Visualization

For a factory with three trolleys:

```text
FACTORY A
│
├── TROLLEY 01
│    ├── Needle Stock
│    └── Used Needle Storage
│
├── TROLLEY 02
│    ├── Needle Stock
│    └── Used Needle Storage
│
└── TROLLEY 03
     ├── Needle Stock
     └── Used Needle Storage
```

This hierarchy should be reflected consistently in filters and detail pages.

---

# 58. Responsive Design

Minimum target:

```text
1280px desktop
```

Recommended responsive behavior:

```text
Desktop
  ↓
Sidebar + Content

Tablet
  ↓
Collapsible Sidebar

Small viewport
  ↓
Responsive table / horizontal scroll
```

The WebApps does not need to reproduce the large-button UX of the Android Tablet.

---

# 59. Accessibility

Baseline:

- keyboard navigation
- visible focus
- readable text
- sufficient contrast
- semantic labels
- status not conveyed by color only
- accessible form errors

---

# 60. Security UX

Security-related UI:

```text
Session Timeout
Unauthorized Page
Factory Scope
Device Revoked
Permission Denied
```

Example:

```text
ACCESS DENIED

Anda tidak memiliki akses ke resource ini.
```

Do not reveal whether an unauthorized resource exists when security policy requires resource hiding.

---

# 61. Session Timeout

Warning:

```text
Session akan berakhir dalam 2 menit.

[ Tetap Login ]
```

After expiry:

```text
Session Expired

Silakan login kembali.
```

Unsaved form data should be preserved only where safe and technically supported.

---

# 62. Role-Based Dashboard

## Management

Primary:

```text
Dashboard
Analytics
Monitoring
Exchange Overview
Inventory Overview
```

## PIC Inventory

Primary:

```text
Dashboard
Stock
Movement
Receiving
Transfer
Adjustment
Needle Master
```

## System Admin

Primary:

```text
Dashboard
Master Data
Users
Roles
Devices
Audit
System Configuration
```

---

# 63. WebApps State Model

UI should reflect backend state.

For inventory:

```text
AVAILABLE
LOW
OUT_OF_STOCK
```

For devices:

```text
ACTIVE
INACTIVE
REVOKED
```

For confirmation:

```text
PENDING
APPROVED
REJECTED
EXPIRED
```

For exchange:

```text
DRAFT
PENDING_CONFIRMATION
PENDING_SYNC
COMPLETED
FAILED
CANCELLED
```

---

# 64. API Alignment

UI must consume the API contract defined previously.

Frontend should not:

- directly access database
- calculate authoritative stock
- bypass authorization
- generate final exchange status independently
- approve confirmation locally
- assume cached master data is authoritative

Backend is the source of truth.

---

# 65. Inventory Transaction UX Rule

For stock mutation:

```text
User Input
    ↓
Client Validation
    ↓
Backend Validation
    ↓
Transaction
    ↓
Authoritative Response
    ↓
Refresh UI
```

Do not update displayed balance as final until backend confirms.

---

# 66. Exchange Evidence UX

Exchange detail should show:

```text
Old Needle Photo
Exchange Type
Old Needle Type
New Needle Type
Fragment Status
Confirmation
Inventory Movement
```

Photo should be viewable only to authorized users.

---

# 67. Confirmation UX Rule

Management/Admin may monitor.

Only authorized supervisor/user can perform approval/rejection.

UI must show:

```text
Who requested
Who approved/rejected
When
Reason
Notification status
```

---

# 68. Dashboard Refresh

Dashboard data may be:

```text
Real-time
Near-real-time
Periodic refresh
```

The actual mechanism is defined by backend/infrastructure.

UI should show:

```text
Last Updated: 08:35
```

---

# 69. Performance

WebApps should target:

```text
Fast first render
Paginated tables
Lazy-loaded detail data
Chart aggregation from backend
No massive client-side datasets
```

Analytics should preferably use backend aggregation APIs.

---

# 70. Browser Compatibility

Baseline:

```text
Latest stable Chrome
Latest stable Edge
```

Other browsers may be supported according to corporate browser policy.

---

# 71. Recommended WebApps Frontend Structure

Framework is subject to team standard.

Conceptual structure:

```text
src/
├── app/
│   ├── routing/
│   ├── auth/
│   └── layout/
│
├── features/
│   ├── dashboard/
│   ├── transactions/
│   ├── confirmation/
│   ├── inventory/
│   ├── master-data/
│   ├── administration/
│   ├── analytics/
│   └── audit/
│
├── shared/
│   ├── components/
│   ├── tables/
│   ├── forms/
│   ├── charts/
│   └── notifications/
│
└── core/
    ├── api/
    ├── permissions/
    ├── security/
    └── utilities/
```

---

# 72. Reusable Components

Recommended:

```text
AppShell
Sidebar
TopBar
Breadcrumb
PageHeader
FilterBar
DataTable
Pagination
StatusBadge
KpiCard
ChartCard
ConfirmDialog
FormField
DateRangePicker
FactorySelector
TrolleySelector
NeedleTypeSelector
EvidenceViewer
AuditTimeline
NotificationPanel
EmptyState
ErrorState
LoadingState
```

---

# 73. Design System

Define centralized:

```text
Typography
Spacing
Colors
Border Radius
Elevation
Icons
Form Controls
Tables
Buttons
Status Badges
Charts
```

The design system should be shared across all WebApps screens.

---

# 74. UAT Screen Scenarios

Minimum:

```text
1. Login
2. Dashboard
3. Exchange list
4. Exchange detail
5. Confirmation pending
6. Confirmation approval
7. Confirmation rejection
8. Stock overview
9. Receiving
10. Transfer
11. Adjustment
12. Needle master
13. Factory master
14. Trolley master
15. Storage mapping
16. Employee master
17. RFID master
18. Device management
19. User management
20. Role permission
21. Audit
22. Analytics
23. Export
24. Factory scope restriction
25. Permission restriction
```

---

# 75. UI Acceptance Criteria

## Dashboard

- [ ] KPI displays authoritative backend data.
- [ ] Factory filter respects user scope.
- [ ] Date filter works.
- [ ] Charts show last updated timestamp.
- [ ] Low/out-of-stock alerts are visible.

## Transactions

- [ ] Search/filter works.
- [ ] Detail shows complete exchange context.
- [ ] Evidence can be viewed by authorized users.
- [ ] Confirmation status is visible.
- [ ] Inventory movement reference is visible.

## Inventory

- [ ] Stock can be viewed by factory/trolley/type.
- [ ] Movement history is traceable.
- [ ] Receiving is validated.
- [ ] Transfer validates source and destination.
- [ ] Adjustment requires reason and permission.
- [ ] Negative stock is prevented by backend.

## Master Data

- [ ] Needle Type can be managed.
- [ ] Factory can be managed.
- [ ] Trolley can be managed.
- [ ] Storage mapping can be managed.
- [ ] Employee/RFID mapping can be managed.
- [ ] Historical references are protected from unsafe deletion.

## Administration

- [ ] Users can be managed by authorized admin.
- [ ] Roles and permissions are visible.
- [ ] Factory scope is enforced.
- [ ] Devices can be registered/revoked.
- [ ] Audit is searchable.

## Analytics

- [ ] Exchange trend available.
- [ ] Exchange type analysis available.
- [ ] Needle consumption available.
- [ ] Factory comparison respects scope.
- [ ] Trolley comparison available where authorized.

---

# 76. UX Definition of Done

- [ ] Navigation approved.
- [ ] Role-based menu approved.
- [ ] Dashboard approved.
- [ ] Transaction monitoring approved.
- [ ] Confirmation monitoring approved.
- [ ] Inventory flows approved.
- [ ] Master-data flows approved.
- [ ] Device management approved.
- [ ] Audit approved.
- [ ] Analytics approved.
- [ ] Responsive behavior approved.
- [ ] Accessibility reviewed.
- [ ] Security UX reviewed.
- [ ] API contract alignment verified.
- [ ] UAT scenarios mapped.

---

# 77. Relationship With Mobile UI/UX

The two applications must remain visually and operationally related, but they serve different purposes.

```text
             CENTRAL BACKEND
                    |
          +---------+---------+
          |                   |
          v                   v
     ANDROID TABLET       WEBAPPS
        PIC TROLI       Admin/Management/
                         PIC Inventory
          |                   |
     Transaction          Management
     Execution            & Monitoring
```

Tablet:

```text
Fast
Large
Guided
Operational
```

WebApps:

```text
Information-rich
Analytical
Administrative
Traceable
Controlled
```

---

# 78. Next Step

After WebApps UI/UX:

```text
17 Mobile UI/UX
       ↓
18 WebApps UI/UX       ← CURRENT
       ↓
19 Test Strategy & UAT
       ↓
20 Deployment & DevOps Architecture
```

Document 19 should map:

```text
PRD
 ↓
Use Case
 ↓
Functional Requirement
 ↓
SRS
 ↓
API
 ↓
UI/UX
 ↓
Test Case
 ↓
UAT
```

so every major business flow can be traced from requirement to implementation and acceptance.

**End of WebApps UI/UX Specification**

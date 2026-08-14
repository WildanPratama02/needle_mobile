# 13 — RFID Integration Specification
# Needle Management System

**Version:** 1.0  
**Status:** Draft / Integration Baseline  
**Client:** Flutter Android Tablet  
**Backend:** Central Backend API  
**Hardware:** RFID Reader

---

## 1. Purpose

Dokumen ini mendefinisikan integrasi RFID untuk proses identifikasi operator sewing pada Trolley Tablet.

Primary flow:

```text
Operator
   |
   v
RFID Card
   |
   v
RFID Reader
   |
   v
Flutter Tablet
   |
   v
Central Backend
   |
   v
Employee Validation
```

RFID digunakan sebagai mekanisme identifikasi operator. Backend tetap menjadi source of truth.

---

## 2. Scope

### In Scope

- RFID reader communication
- UID capture
- Tablet device integration
- RFID-to-employee lookup
- Duplicate/read debounce
- Invalid card handling
- Device registration
- Offline consideration
- Audit trail

### Out of Scope

- Manufacturing of RFID hardware
- RFID card procurement
- Vendor-specific firmware development
- Physical security design of RFID hardware

---

## 3. Functional Flow

```text
PIC Create Exchange
       |
       v
Tablet waits for RFID
       |
       v
Operator taps card
       |
       v
Reader captures UID
       |
       v
Flutter receives UID
       |
       v
GET /rfid/cards/{rfidUid}
       |
       +---- Valid ----> Employee Selected
       |
       +---- Invalid --> Error / Retry
```

---

## 4. RFID Data Contract

Minimum reader output:

```text
rfidUid
timestamp
reader/device identifier
```

Example:

```json
{
  "rfidUid": "RFID001",
  "capturedAt": "2026-08-05T08:00:00Z",
  "deviceId": "uuid"
}
```

---

## 5. Reader Integration Modes

The exact hardware protocol is an implementation decision.

Supported architecture options:

### Option A — USB / Serial

```text
RFID Reader
    |
 USB/Serial
    |
Android Device
```

### Option B — Bluetooth

```text
RFID Reader
    |
 Bluetooth
    |
Android Device
```

### Option C — Vendor SDK

```text
RFID Reader
    |
Vendor SDK
    |
Flutter Platform Channel
```

The final option must be selected after hardware/vendor confirmation.

---

## 6. Flutter Integration

Flutter should isolate hardware access:

```text
UI
 |
 v
RFID Service
 |
 v
Platform Adapter
 |
 v
Android RFID Driver / SDK
```

Recommended interface:

```dart
abstract class RfidReader {
  Future<void> initialize();
  Stream<String> cardStream();
  Future<void> dispose();
}
```

Hardware-specific implementation must not leak into transaction UI.

---

## 7. Debounce Rule

The same card may be read repeatedly while remaining close to the reader.

Recommended behavior:

```text
Same UID
+
Short interval
=
Ignore duplicate read
```

Example configurable debounce:

```text
500 ms – 1500 ms
```

Final value is a technical configuration decision.

---

## 8. Employee Resolution

Tablet calls:

```http
GET /api/v1/rfid/cards/{rfidUid}
```

Backend validates:

- RFID exists
- RFID active
- Employee exists
- Employee active
- Employee belongs to permitted factory scope

Response:

```json
{
  "success": true,
  "data": {
    "employee": {
      "id": "uuid",
      "employeeNumber": "EMP001",
      "name": "Operator Name",
      "factoryId": "uuid",
      "status": "ACTIVE"
    },
    "rfidCard": {
      "uid": "RFID001",
      "status": "ACTIVE"
    }
  }
}
```

---

## 9. Invalid RFID

Possible errors:

```text
RFID_NOT_FOUND
RFID_INACTIVE
EMPLOYEE_NOT_FOUND
EMPLOYEE_INACTIVE
FACTORY_SCOPE_DENIED
```

Tablet UX:

```text
RFID tidak dikenali.
Silakan tap ulang kartu atau hubungi PIC.
```

Do not expose internal error details to operator.

---

## 10. RFID During Exchange

RFID may only assign the operator when the exchange is in a state that accepts operator identification.

Invalid state:

```text
422 EXCHANGE_INVALID_STATE
```

---

## 11. Audit

The following should be auditable:

```text
RFID UID
Employee ID
Device ID
Exchange ID
Timestamp
Resolution result
Actor/PIC
```

Raw RFID UID retention follows the approved data-retention policy.

---

## 12. Security

- Reader access is limited to registered device.
- Device identity is validated by backend.
- RFID UID must not be trusted as authorization.
- Employee identity comes from backend master data.
- No password/token is stored in RFID reader.
- Backend validates factory scope.

---

## 13. Failure Handling

### Reader disconnected

```text
Reader unavailable
      |
      v
Tablet displays hardware error
      |
      v
PIC reconnects / retries
```

### Backend unavailable

If employee data is already safely cached and offline operation is approved, the tablet may continue under the Mobile Offline Sync policy.

Otherwise:

```text
RFID captured
   |
   v
Backend unavailable
   |
   v
Transaction waits for connectivity
```

Final offline policy is defined in Document 15.

---

## 14. Acceptance Criteria

- [ ] Tablet initializes RFID reader.
- [ ] UID is captured.
- [ ] Duplicate reads are debounced.
- [ ] UID resolves to employee.
- [ ] Invalid card is handled.
- [ ] Employee factory scope is validated.
- [ ] RFID assignment is linked to exchange.
- [ ] RFID event is auditable.
- [ ] Reader disconnect is handled.
- [ ] Vendor-specific implementation is isolated from business logic.

---

## 15. Open Decisions

- [ ] RFID reader vendor/model
- [ ] USB/Bluetooth/SDK protocol
- [ ] Android SDK requirements
- [ ] UID format
- [ ] Encryption/authentication at reader level
- [ ] Offline RFID policy
- [ ] Data retention period

**End of RFID Integration Specification**

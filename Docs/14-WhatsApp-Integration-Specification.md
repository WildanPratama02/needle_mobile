# 14 — WhatsApp Integration Specification
# Needle Management System

**Version:** 1.0  
**Status:** Draft / Integration Baseline  
**Purpose:** Supervisor confirmation for missing broken-needle fragment

---

## 1. Purpose

WhatsApp digunakan untuk mengirimkan notifikasi kepada pengawas ketika:

```text
Exchange Type = BROKEN
AND
Broken Fragment = NOT_FOUND
```

Flow:

```text
PIC
 |
 v
Broken Fragment = Not Found
 |
 v
Backend creates Confirmation
 |
 v
Notification Service
 |
 v
WhatsApp Provider
 |
 v
Supervisor
 |
 +---- Approve
 |
 +---- Reject
```

---

## 2. Scope

### In Scope

- Confirmation notification
- Supervisor recipient resolution
- WhatsApp template
- Delivery status
- Retry
- Audit
- Security
- Callback/webhook consideration

### Out of Scope

- WhatsApp account provisioning
- Provider commercial contract
- Manual WhatsApp conversation management

---

## 3. Business Trigger

Trigger:

```text
exchangeType = BROKEN
fragmentStatus = NOT_FOUND
```

Backend creates:

```text
Confirmation
status = PENDING
```

Then notification is queued.

---

## 4. Supervisor Resolution

The system should determine supervisor using approved organization mapping.

Possible mapping:

```text
Operator
   |
   v
Line / Section
   |
   v
Supervisor
```

The exact organizational relationship is an open business decision.

The client must not manually trust an arbitrary phone number.

---

## 5. Notification Payload

Internal service:

```http
POST /internal/notifications/whatsapp
```

```json
{
  "confirmationId": "uuid",
  "recipientUserId": "uuid",
  "templateCode": "BROKEN_NEEDLE_CONFIRMATION"
}
```

---

## 6. Message Content

Recommended template:

```text
Needle Exchange Confirmation

Exchange No : {{exchangeNumber}}
Factory     : {{factoryName}}
Trolley     : {{trolleyName}}
Operator    : {{operatorName}}
Needle Type : {{needleType}}
Issue       : Broken needle fragment not found.

Please confirm whether the exchange may proceed.

[Approve]
[Reject]
```

Actual provider template must follow the approved WhatsApp template policy.

---

## 7. Approval Interaction

Preferred architecture:

```text
WhatsApp
    |
    v
Provider Webhook
    |
    v
Backend
    |
    v
Confirmation API
    |
    v
APPROVED / REJECTED
```

If interactive buttons are supported by the selected provider, the button action must contain a signed/validated reference to the confirmation.

Do not trust raw client-supplied confirmation IDs without authorization validation.

---

## 8. Confirmation API

```http
POST /confirmations/{confirmationId}/approve
POST /confirmations/{confirmationId}/reject
```

Approval:

```json
{
  "reason": "Supervisor confirmed fragment is unavailable."
}
```

Rejection:

```json
{
  "reason": "Fragment must be located."
}
```

---

## 9. Notification Status

Statuses:

```text
QUEUED
SENT
DELIVERED
READ
FAILED
```

Provider availability may determine whether `READ` is supported.

---

## 10. Retry

Recommended retry policy:

```text
Attempt 1
   |
failure
   v
Attempt 2
   |
failure
   v
Attempt 3
   |
failure
   v
FAILED / Manual Review
```

Use exponential backoff.

Do not create duplicate confirmations for notification retries.

---

## 11. Idempotency

Notification command requires idempotency:

```text
confirmationId
+
templateCode
+
recipient
```

must produce one logical notification.

---

## 12. Security

- Provider secrets stored in secret manager.
- Secrets never stored in Mobile/WebApp.
- Webhook signature must be validated.
- Supervisor authorization must be checked.
- Confirmation action must be auditable.
- Personal phone numbers should be protected.
- Message content must avoid unnecessary sensitive information.

---

## 13. Audit

Record:

```text
confirmationId
recipient
template
provider message ID
queuedAt
sentAt
deliveredAt
readAt
failedAt
approval/rejection
actor
timestamp
```

---

## 14. Failure Handling

If WhatsApp provider is unavailable:

```text
Confirmation remains PENDING
        |
        v
Notification FAILED
        |
        v
Retry / Manual Escalation
```

The business policy must determine whether exchange is blocked until supervisor confirmation is received.

Recommended:

```text
No approval
   =
Exchange cannot complete
```

---

## 15. Acceptance Criteria

- [ ] Missing broken fragment creates confirmation.
- [ ] Correct supervisor is resolved.
- [ ] WhatsApp notification is queued.
- [ ] Provider response is stored.
- [ ] Retry is idempotent.
- [ ] Webhook signature is validated.
- [ ] Approve/reject action is authorized.
- [ ] Confirmation state is updated.
- [ ] Audit is recorded.
- [ ] Provider failure does not silently approve exchange.

---

## 16. Open Decisions

- [ ] WhatsApp provider
- [ ] Template approval
- [ ] Supervisor mapping
- [ ] Interactive button support
- [ ] Webhook mechanism
- [ ] Retry schedule
- [ ] SLA/escalation
- [ ] Message language

**End of WhatsApp Integration Specification**

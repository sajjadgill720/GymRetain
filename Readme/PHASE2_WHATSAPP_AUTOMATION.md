# Phase 2: WhatsApp Automation, Anti-Spam Safeguards & Compliance

This document details GymRetain's WhatsApp automation system, provider abstraction architecture, webhook security verification, regulatory opt-out handling, anti-spam cooldown mechanisms, and cost monitoring.

---

## 1. Provider Abstraction Architecture

GymRetain decouples business logic from external messaging APIs via the `MessagingProvider` interface:

```typescript
export interface MessagingProvider {
  sendMessage(to: string, message: string, gymId?: string): Promise<{ success: boolean; messageId: string }>;
  sendTemplate(
    to: string,
    templateName: string,
    params: Record<string, string>,
    gymId?: string,
  ): Promise<{ success: boolean; messageId: string }>;
}
```

### Implementations:
1. **`TwilioWhatsAppProvider`** (`src/modules/messaging/twilio-whatsapp.provider.ts`):
   - Production provider utilizing Twilio REST client.
   - Formats outbound destinations as `whatsapp:+<e164_phone>`.
   - Injects delivery status callback URL (`/api/v1/messaging/whatsapp/status`).
2. **`MockWhatsAppProvider`** (`src/modules/messaging/mock-whatsapp.provider.ts`):
   - Local and CI testing provider.
   - Records sent messages in an in-memory queue.
   - Supports automated keyword replies (`STREAK`, `STATUS`, `HELP`, `STOP`, `START`) without incurring external SMS costs.

The provider is selected dynamically in `MessagingModule` based on the `TWILIO_ACCOUNT_SID` and `TWILIO_AUTH_TOKEN` environment variables.

---

## 2. Webhook Security Verification (`TwilioWebhookGuard`)

All inbound webhooks (`/api/v1/messaging/whatsapp/inbound` and `/api/v1/messaging/whatsapp/status`) are guarded by `TwilioWebhookGuard`:
- Evaluates `X-Twilio-Signature` against Twilio Auth Token and request payload using HMAC-SHA1.
- In non-production environments with `ENABLE_DEV_WEBHOOK_BYPASS=true` or in test environments, signatures can be simulated for testing.
- Replays or forged webhooks are rejected with `403 Forbidden`.

---

## 3. Regulatory Opt-Out & Opt-In Compliance

To comply with WhatsApp Business messaging policies and Pakistani consumer protection rules, members can revoke or restore messaging consent at any time:

### Opt-Out Flow (`STOP`, `UNSUBSCRIBE`, `CANCEL`, `QUIT`):
1. Inbound webhook receives `Body: STOP`.
2. The sender's phone number is matched to member records within the tenant gym.
3. The member's profile is updated in PostgreSQL:
   - `isOptedOut = true`
   - `optedOutAt = new Date()`
4. Outbound automated triggers (churn nudges, streak alerts, reward milestones) are **immediately suppressed** for this member.
5. A single, regulatory compliance confirmation message is dispatched:
   > *"You have been successfully unsubscribed from Iron House Gym WhatsApp updates. Text START at any time to resume."*
6. Subsequent attempts by staff or automated cron jobs to dispatch messages to an opted-out member are blocked server-side.

### Opt-In Flow (`START`, `UNSTOP`):
1. Inbound webhook receives `Body: START`.
2. Member status updated to `isOptedOut = false` and `optedOutAt = null`.
3. Confirmation message sent:
   > *"Welcome back! You have opted back in to Iron House Gym WhatsApp updates. Reply STREAK to check your streak."*

---

## 4. Anti-Spam Rate Limiting & Cost Safeguards

To prevent member annoyance and protect gym owners from accidental bill shocks, GymRetain enforces three safety barriers:

### Barrier 1: 24-Hour Deduplication Cooldown
- Before dispatching an automated message (e.g. churn nudge or streak celebration), the system checks `whatsapp_logs`.
- If a message of the same trigger type was dispatched to that member within the last 24 hours, the trigger is skipped:
  ```typescript
  const lastSent = await this.prisma.whatsAppLog.findFirst({
    where: { memberId, triggerType, createdAt: { gte: twentyFourHoursAgo } },
  });
  if (lastSent) return { skipped: true, reason: '24H_COOLDOWN' };
  ```

### Barrier 2: Daily Member Cap
- Maximum **1 automated message per member per day** across all trigger types combined.

### Barrier 3: Daily Gym Safety Cap
- Maximum **200 automated messages per gym per day**.
- If a gym reaches 200 automated messages in a 24-hour window, outbound automation pauses and alerts the gym owner to review campaign volume.

---

## 5. Event-Driven Triggers

1. **Streak Milestone Rewards**:
   - When a member checks in at reception and reaches a streak milestone (e.g. 7, 14, 30, 60 days), `RewardsService` emits a milestone event.
   - An celebratory WhatsApp message is dispatched to congratulate the member and notify them of unlocked rewards.
2. **Silent Churn Risk Alerts**:
   - The retention engine calculates churn risk scores every evening.
   - Members exceeding high-risk thresholds (>7–14 days inactive) are queued for automated WhatsApp nudges.

---

## 6. Delivery Tracking & Cost Reporting

### Status Callback Webhook
- **Endpoint**: `POST /api/v1/messaging/whatsapp/status`
- Receives real-time delivery lifecycle updates from Twilio (`queued` ➔ `sent` ➔ `delivered` ➔ `read` ➔ `failed`).
- Updates `whatsapp_logs.status` and records error codes on failure.

### Cost Summary Endpoint
- **Endpoint**: `GET /api/v1/messaging/cost-summary`
- Returns 30-day messaging volume, delivery rates, and estimated cost in PKR (calculated at ~PKR 2.20 per template message).

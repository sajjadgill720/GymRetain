# Shared design system and member portal

The owner workspace remains at `/`. The member app is at `/portal`, with passwordless login at `/portal/login`. `/portal?preview=1` is an explicit, read-only sample experience; failed authenticated requests never switch to samples. The staff member inbox is at `/member-inbox`.

## Run locally

Use Node 20+ and the existing PostgreSQL database. Start PostgreSQL (for example `docker compose up -d postgres`), then:

```powershell
cd backend
npm ci
npm run prisma:generate
npx prisma migrate deploy
# Optional, non-destructive examples for existing active members and gyms:
npm run prisma:seed:portal
npm run start:dev

# In a second terminal:
cd frontend
npm ci
npm run dev
```

Open `http://localhost:3001` for staff and `http://localhost:3001/portal` for members. The API uses port 4000 and `/api/v1`. The repository's historical migrations start with RLS policies, so a completely empty database must first have the legacy base schema installed; `migrate deploy` assumes that existing baseline. Do not run `db push` against an existing installation to bypass migration history.

Install the new migrations using a database administrator with permission to create roles and security-definer functions. Member queries explicitly `SET LOCAL ROLE gymretain_member_runtime` inside the same transaction that binds `app.current_gym_id` and `app.current_member_id`. That role is `NOLOGIN NOSUPERUSER NOBYPASSRLS`, so member RLS still applies when a local database URL uses a superuser. If the application connects as a separate database login, the migration administrator must grant it membership in `gymretain_member_runtime`. Keep the existing staff database configuration; this change does not migrate the legacy staff authentication model to a new database role.

No database is needed for the read-only preview or the embedded PostgreSQL RLS tests. The production portal requires PostgreSQL and applied migrations; the member app deliberately has no authenticated mock fallback.

## Environment

The backend `.env.example` lists the additions. Set independent `MEMBER_JWT_SECRET`, `MEMBER_OTP_SECRET`, and `MEMBER_PASS_SECRET` values of at least 32 random characters. Generate values with Node's `crypto.randomBytes(32).toString('hex')`. Never reuse the staff JWT secret.

For local development, `MEMBER_DEV_OTP=true` returns a clearly labeled code in the request response. It is disabled in production even if set. For real delivery, configure `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_SMS_NUMBER` and/or `TWILIO_WHATSAPP_NUMBER`. WhatsApp OTP delivery additionally requires an approved authentication template in `TWILIO_OTP_CONTENT_SID`, using content variable `1` for the code. Delivery failures have the same public response as unregistered numbers.

Set `PORTAL_PUBLIC_URL` and `API_PUBLIC_URL` to externally reachable HTTPS origins for deployed QR join links and checkout callbacks. Set frontend `NEXT_PUBLIC_API_URL` to the API base when deploying on a different origin. HTTPS is required for deployed service workers and push; localhost works for development.

Push requires `WEB_PUSH_PUBLIC_KEY`, `WEB_PUSH_PRIVATE_KEY`, and `WEB_PUSH_SUBJECT`. Generate VAPID keys with `require('web-push').generateVAPIDKeys()` and save them privately. Notifications are opt-in. Staff announcement publication writes the in-app announcement first, then attempts delivery to subscribed devices with notifications enabled. Expired subscriptions are removed. The notification itself contains only a generic update; announcement content stays inside the app. Do not commit secrets.

## Authentication and data access

`POST /auth/member/request-otp` accepts `{ gymSlug, phone, channel: "sms" | "whatsapp" }`. Use the gym's actual slug; the staff inbox provides its scan-to-join link. Phone numbers normalize to E.164, including Pakistani `03…` numbers. Requests are limited per phone and source IP in PostgreSQL. Only one outstanding code is valid, codes expire after five minutes, and verification allows at most five attempts. OTPs are stored as keyed digests. `POST /auth/member/verify-otp` accepts `{ gymSlug, requestId, code }` and atomically consumes the code before issuing a 12-hour JWT.

Member tokens have `role: MEMBER`, `sub = memberId`, `gymId`, issuer `gymretain`, and audience `gymretain-member`. A separate Passport strategy validates current database membership. Staff authentication rejects member claims. The two frontend tokens use separate storage keys. `/member/*` handlers derive member and gym IDs exclusively from the verified token; the public join routes and authenticated gateway callback are the documented exceptions. DTO validation rejects client-injected identity fields.

Every member transaction sets the tenant and member context with transaction-local PostgreSQL settings and switches to the restricted member role. Restrictive self policies AND with the existing gym policies. Composite foreign keys bind new member records to the correct gym. Staff-only tables are hidden, gym settings containing owner operations are not selectable by the member role, and a scoped function exposes only the class schedule. Trainer messages can be inserted by a member only for an active assignment and only with `sender=MEMBER`.

The member pass is an HMAC-signed QR valid for the current 30-second interval. Both staff lookup and check-in validate its signature, gym and expiry. Scan it into the existing terminal or Quick Check-In input. The terminal revalidates the token on confirmation, so an expired lookup cannot silently become a manual check-in. The existing check-in capacity, session, membership and streak rules still apply. A screenshot of an active pass remains usable until its short expiry; this is a rotating pass, not a one-use credential.

## Shared workflows

Attendance, streaks, diet plans, rewards, memberships and payments reuse the original tables. Additive tables store profiles, workout logs, personal records, measurements, class bookings, member/trainer messages, requests, push subscriptions, announcements and the event outbox. Existing AI conversations remain separate from trainer/member messages.

Classes reuse the owner's existing `gyms.settings.operations.sessions` schedule. A scoped database function locks the gym row, books or waitlists the verified member, and updates the same attendance list shown in Operations. Duplicate booking is idempotent. Cancellation promotes the oldest waiter and changes the Operations version so stale staff edits receive a conflict. A database trigger preserves confirmed member bookings across staff edits and cancels them when a class is cancelled. Future classes and spots are read again after live events; no polling response exposes other members' booking rows or attendance names.

Reward claims require an existing unlocked redemption and sufficient visit points; writes are serialized per member. Each check-in earns ten points. Streak freezes consume an existing freeze and protect one missed day without creating a visit or awarding points. Membership freezes and plan changes are requests for staff review, not automatic entitlement changes. Buddy invitations and help/feedback also go to the staff inbox. Staff can respond to the assigned trainer conversation and assign a workout displayed on the member's home screen. Trainers are restricted to their own active assignments.

The public `/portal/join/[slug]` page creates an inactive Member and a `PENDING_PAYMENT` membership with “Awaiting plan assignment”. Reception must assign pricing and activate membership. Duplicate requests do not create another member or overwrite an existing profile. No account is authenticated until phone verification.

## Online renewal adapter

This repository does not contain merchant credentials or native JazzCash, EasyPaisa or Stripe settlement integrations. The portal implements a hosted gateway adapter using `MEMBER_PAYMENT_GATEWAY_URL` (HTTPS) and `MEMBER_PAYMENT_GATEWAY_SECRET`. A configured gateway must implement the protocol below and connect to the chosen merchant providers. Without it, the UI explicitly says online renewal is unavailable; no paid state is fabricated.

The backend POSTs the following JSON to the configured gateway, with `Authorization: Bearer <gateway secret>`:

```json
{
  "paymentId": "uuid",
  "gymId": "uuid",
  "amount": 500000,
  "currency": "PKR",
  "provider": "JAZZCASH",
  "reference": "PORTAL-uuid",
  "returnUrl": "https://your-app/portal/membership",
  "callbackUrl": "https://your-api/api/v1/member/payments/callback"
}
```

Amount is always server-derived in minor units. Return `{ "paymentUrl": "https://…" }` for hosted checkout. The provider must POST `{ paymentId, gymId, status: "COMPLETED" | "FAILED", amount, currency, reference, timestamp }` to the callback. `timestamp` is Unix milliseconds. Sign the exact pipe-separated fields in that order with HMAC-SHA256 using the shared gateway secret; send its lowercase hex digest in `x-gateway-signature`. The callback rejects stale timestamps, mismatching amounts/currencies/references, and invalid signatures. A replay cannot renew twice. A verified successful callback settles the existing Payment and extends the existing Membership. A redirect back to the UI does not settle a payment. Member database permissions also prevent marking a payment completed directly.

## Live sync and PWA

Database triggers write minimal invalidation events into `portal_events` in the same transaction as the change. `/member/events` and `/staff/member-portal/events` expose authenticated SSE with one-second outbox reads, reconnect cursors, heartbeat messages, and bounded connection lifetimes. Member streams contain only that member's events and generic gym broadcasts such as capacity. React pages reload their data after invalidation without replacing page state or form drafts. This works across API instances because the outbox is in the shared database.

The installable `/portal/manifest.webmanifest` and `/portal/sw.js` are scoped to `/portal/`. The service worker caches only the public offline shell and icons. It never caches member HTML, API responses, QR images, or payment state and never queues offline writes. Use Me → Profile → Manage push notifications to install or opt in where supported.

Retention maintenance: periodically remove expired `member_otps` and `portal_rate_limits`, and old `portal_events` after an appropriate retention period (for example seven days). Do this as an administrative maintenance job, not as an unscoped member API action. No cleanup job runs automatically in this change.

## Checks

```powershell
cd backend
npm run typecheck
npm run lint
npm test -- --runInBand --no-cache
npm run test:member:rls

cd ../frontend
npm run typecheck
npm run lint
npm test
npm run build
```

The SQL integration tests run the real PostgreSQL engine through PGlite, install the actual schema/policies/functions, and use non-superuser roles. They test cross-member and cross-gym reads/writes, forged ownership, private event visibility, transactional rollback, class capacity/waitlists, and context reset. OTP, signed-pass, member/staff-role, callback and trainer-assignment logic also have unit coverage. Live merchant delivery and device push still require configured providers and deployment testing.

The shared styling lives in `frontend/src/styles/tokens.css`, `system.css`, `workspace.css`, and `portal.css`. Existing palette values are retained; new materials derive from those tokens. Plus Jakarta Sans headings, Inter body text, Phosphor vectors, focus outlines, 44px controls and reduced-motion styles are shared across both apps. Light/dark preferences remain available; new sessions default to the existing dark palette.

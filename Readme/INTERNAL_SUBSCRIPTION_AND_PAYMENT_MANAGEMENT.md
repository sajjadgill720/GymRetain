# Internal Subscription & Payment Management System

## 1. Executive Summary & Requirements Compliance
In accordance with system requirements:
1. **Removed "Live Loops Active" Badge**: The green pulsating badge in the dashboard header ([`frontend/src/app/page.tsx`](file:///e:/GymRetain/frontend/src/app/page.tsx)) was completely removed, leaving a clean, distraction-free "Retention Dashboard" title.
2. **Internal Subscription Management Built**: Implemented an internal system to track member subscriptions, monitor expiry dates, and record cash/bank transfer payments at the front desk.
3. **No External Payment Gateway**: Strictly kept as an internal tracking register (zero Stripe/PayPal/external merchant dependencies).

---

## 2. Backend Architecture (`backend/src/modules/payments/`)

### Module Setup
- **Module**: [`backend/src/modules/payments/payments.module.ts`](file:///e:/GymRetain/backend/src/modules/payments/payments.module.ts)
- **Controller**: [`backend/src/modules/payments/payments.controller.ts`](file:///e:/GymRetain/backend/src/modules/payments/payments.controller.ts)
- **Service**: [`backend/src/modules/payments/payments.service.ts`](file:///e:/GymRetain/backend/src/modules/payments/payments.service.ts)

### Core Endpoints
- `GET /api/v1/payments/subscriptions`: Lists active, pending, expired, and cancelled subscriptions for the authenticated gym tenant (`@CurrentGymId()`).
- `POST /api/v1/payments/subscriptions`: Enrolls a member in a plan (e.g. Monthly Standard, Pro Strength & Cardio, Quarterly Transformation, Annual VIP).
- `POST /api/v1/payments/subscriptions/:id/renew`: Extends a subscription by 1 or more months, with optional automatic payment record creation.
- `PATCH /api/v1/payments/subscriptions/:id/cancel`: Cancels an active subscription.
- `GET /api/v1/payments/records`: Returns the internal payment transaction ledger.
- `POST /api/v1/payments/record`: Records an internal payment (Cash, Bank Transfer Slip, JazzCash/EasyPaisa counter deposit) with receipt reference and automatically marks pending subscriptions as `ACTIVE`.
- `GET /api/v1/payments/metrics`: Returns financial aggregates (Active Subscriptions, Expiring in 7 Days, Month Revenue Recorded, Pending Invoices).

### Strict Tenant Isolation
All queries strictly scope to the authenticated user's `gymId` via `TenantAccessGuard` and `RolesGuard`.

---

## 3. Frontend Architecture (`frontend/src/app/subscriptions/page.tsx`)

### Route & Navigation
- **Route**: `/subscriptions`
- **Component**: [`frontend/src/app/subscriptions/page.tsx`](file:///e:/GymRetain/frontend/src/app/subscriptions/page.tsx)
- **Navigation**: Linked directly in the main [`Sidebar.tsx`](file:///e:/GymRetain/frontend/src/components/Sidebar.tsx) with Phosphor `CreditCard` icon and `Billing` badge.

### Features
1. **Financial & Operational KPI Cards**:
   - *Active Subscriptions*: 138 Members across recurring tiers.
   - *Expiring Within 7 Days*: 8 Renewals queued for retention nudges.
   - *Recorded Revenue (Month)*: ₨485,000 cash, bank slips, and counter deposits.
   - *Pending Invoices*: 6 Unpaid memberships awaiting front-desk collection.
2. **Tab 1: Member Subscriptions Directory**:
   - Filter by status (`ALL`, `ACTIVE`, `PENDING_PAYMENT`, `EXPIRED`, `CANCELLED`).
   - Real-time search by member name, member code (e.g. `GR-1001`), or plan name.
   - Interactive table with validity dates, auto-renew indicator, latest payment details, and 1-click **Collect**, **Renew**, and **Cancel** buttons.
3. **Tab 2: Payment Transactions History**:
   - Audit trail of recorded internal payments.
   - Receipt reference number, member code, plan tier, amount in PKR, payment provider pill (`CASH`, `BANK_TRANSFER`, `JAZZCASH`, `EASYPAISA`), and timestamp.
4. **Tab 3: Plans & Pricing Setup**:
   - Standard membership blueprints (Monthly Standard ₨4,500, Pro Strength ₨6,500, Quarterly Transformation ₨16,500, Annual VIP ₨48,000) with feature checklists and instant 1-click assignment.
5. **Interactive Modals**:
   - **Record Payment Modal**: Records cash/transfer payments with receipt reference, amount, and staff notes.
   - **Assign Subscription Modal**: Enrolls any member in a selected plan with automatic duration and pricing calculation.

---

## 4. UI & Style Guidelines Compliance
- **Button Shadows**: Every interactive button uses `.btn-shadow` or `.btn-shadow-primary`.
- **Icons**: Powered by `@phosphor-icons/react` in `duotone` style.
- **Theme Support**: Seamless contrast across Foxstocks Light mode and Vision Dark mode.
- **Production Build**: Verified clean Next.js build across all 14 routes.

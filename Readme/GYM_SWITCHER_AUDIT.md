# Gym Switcher Audit & Tenant Isolation Architecture

## 1. Audit Summary & Findings
**Verdict: Case A — Hardcoded Mock/Demo Data (Not a live backend data leak)**

### Investigation Details
1. **Frontend Origin**:
   - In [`Sidebar.tsx`](file:///e:/GymRetain/frontend/src/components/Sidebar.tsx) and [`TopNavbar.tsx`](file:///e:/GymRetain/frontend/src/components/TopNavbar.tsx), a static `DEMO_GYMS` array previously rendered a tenant switcher dropdown with Lahore, Karachi, and Islamabad gym mock names.
   - The dropdown did not come from any live database query or open API endpoint.
2. **Backend Security Intact**:
   - No unscoped `GET /gyms` endpoint exists.
   - All tenant-specific routes enforce [`TenantAccessGuard`](file:///e:/GymRetain/backend/src/common/guards/tenant-access.guard.ts), ensuring requests cannot access or inject foreign `gymId` headers, queries, params, or bodies.
3. **Data Model**:
   - In [`schema.prisma`](file:///e:/GymRetain/backend/prisma/schema.prisma), staff accounts exist in `gym_staff`, with each staff record mapped to their specific gym via foreign key `gym_id`.

---

## 2. Multi-Gym Support Architecture (Case C Resolution)
GymRetain generally operates on **one owner/staff per gym**, but natively supports **multi-gym owners** (e.g., chain owners managing multiple branches).

### Server-Side Scoping
1. **Login & Session Verification (`/auth/login` & `/auth/me`)**:
   - When a user logs in, the server queries all active `gym_staff` records matching the verified email.
   - The response returns `gyms: authorizedGyms`, which contains **strictly** the gyms where the user has an explicit active staff record.
   - Single-gym users receive exactly 1 gym in this array.
   - Mid-invite or unassigned accounts (`gymId: null`) receive `gyms: []` and `activeGym: null` gracefully without crashing.
2. **Server-Side Gym Switching (`POST /auth/switch-gym`)**:
   - The client never switches tenant context client-side.
   - To switch gyms, the client sends `POST /auth/switch-gym { gymId: targetGymId }`.
   - The backend checks whether the authenticated user has an active `gym_staff` record at `targetGymId`.
   - If unauthorized: Returns `403 Forbidden` (`Tenant access denied: You do not have staff access to the requested gym`).
   - If authorized: Issues a **new signed JWT token** containing `gymId: targetGymId`.
   - The client updates its token in `localStorage` and `api.setToken()`, flushes state, and reloads the active view.
   - Subsequent requests now carry the new JWT claim, configuring server-side `TenantAccessGuard` and PostgreSQL Row-Level Security (RLS) to `targetGymId`.

---

## 3. UI/UX Default Behavior
1. **Single-Gym Accounts (Common Case, 99%)**:
   - The user logs in and lands directly on their gym's dashboard.
   - **No switcher dropdown is displayed**. The sidebar renders a clean, static, non-clickable gym location badge.
2. **Multi-Gym Accounts**:
   - The dropdown switcher appears in the sidebar, displaying **only** that owner's verified gym branches.
   - Switching triggers the authenticated server-side token rotation, preventing stale data leakage.

---

## 4. Permanent Canary & Tenant Isolation Test Suite
Located in [`backend/test/tenant-isolation.spec.ts`](file:///e:/GymRetain/backend/test/tenant-isolation.spec.ts) (Section 7):

1. **Test 4.1 (Single-Gym User Isolation)**:
   - Verifies an account linked only to Gym A receives only Gym A from `/auth/me` and `/auth/login`. Gym B and Canary Gym are never present.
2. **Test 4.2 (Unassigned Mid-Invite State)**:
   - Verifies an account with no assigned gym (`gymId: null`) receives `gyms: []` and `activeGym: null` without crashing or falling back to unscoped data.
3. **Test 4.3 (Adversarial Gym Switch Rejection)**:
   - Verifies that a Gym A user attempting to call `POST /auth/switch-gym` with Gym B or Canary Gym is rejected with `403 Forbidden` and no token is signed.
4. **Test 4.4 (Legitimate Multi-Gym Rotation & Zero Leakage)**:
   - Verifies that switching gyms rotates the JWT to Gym B, configures `TenantAccessGuard.tenantContext.gymId = Gym B`, and completely blocks reading Gym A member records (returning `404 NotFoundException`).


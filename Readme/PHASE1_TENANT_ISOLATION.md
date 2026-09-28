# Phase 1: Multi-Tenant Isolation Architecture & Adversarial Verification

This document provides a comprehensive technical overview of GymRetain's multi-tenant isolation model, defense-in-depth security architecture, transaction-safe PostgreSQL Row-Level Security (RLS), the permanent Canary Test Gym, and the automated adversarial penetration test suite.

---

## 1. Multi-Tenancy Architecture (Dual-Layer Defense)

GymRetain enforces strict data isolation between gym tenants through two non-bypassable layers:

```
                  Client HTTP Request
                          │
                          ▼
            ┌───────────────────────────┐
            │       JwtAuthGuard        │ (Extracts sub, role, gymId)
            └─────────────┬─────────────┘
                          ▼
            ┌───────────────────────────┐
            │     TenantAccessGuard     │ (Enforces matching gym context)
            └─────────────┬─────────────┘
                          ▼
    ┌───────────────────────────────────────────┐
    │  Layer 1: Application-Level Query Scoping │
    │  (TenantPrismaService.forTenant(gymId))   │
    │  • where: { gymId }                       │
    │  • 403 Forbidden on mismatched route param│
    └─────────────────────┬─────────────────────┘
                          ▼
    ┌───────────────────────────────────────────┐
    │  Layer 2: PostgreSQL Row-Level Security   │
    │  (SET LOCAL app.current_gym_id in TX)     │
    │  • FORCE ROW LEVEL SECURITY on all tables │
    │  • Session variables reset on commit/abort│
    └─────────────────────┬─────────────────────┘
                          ▼
                  PostgreSQL Engine
             (Zero cross-tenant leakage)
```

### Layer 1: Application-Level Request Scoping
- Every tenant table has a `gym_id` foreign key referencing `gyms(id)`.
- All tenant routes are protected by `JwtAuthGuard` and `TenantAccessGuard`.
- The user's verified `gymId` is extracted server-side from the JWT and session context. It is **never** accepted as an untrusted client parameter.
- Prisma queries are scoped via `TenantPrismaService.forTenant(gymId)`.
- Route parameters with mismatching `:gymId` are blocked immediately with `403 Forbidden`.

### Layer 2: PostgreSQL Row-Level Security (RLS)
- Every tenant table (`members`, `check_ins`, `streaks`, `streak_rewards`, `payments`, `whatsapp_logs`, etc.) has Row-Level Security enabled and enforced:
  ```sql
  ALTER TABLE "members" ENABLE ROW LEVEL SECURITY;
  ALTER TABLE "members" FORCE ROW LEVEL SECURITY;
  ```
- RLS policies restrict both read (`USING`) and write (`WITH CHECK`) operations:
  ```sql
  CREATE POLICY member_tenant_isolation_policy ON "members"
    FOR ALL
    USING (
      gym_id = NULLIF(current_setting('app.current_gym_id', true), '')::uuid
      OR NULLIF(current_setting('app.is_super_admin', true), '')::boolean = true
    )
    WITH CHECK (
      gym_id = NULLIF(current_setting('app.current_gym_id', true), '')::uuid
    );
  ```

---

## 2. Connection-Pooling Transaction Safety

In environments with connection pooling (e.g. pgBouncer, pooled `node-postgres`, Prisma connection pools), setting session variables via `SET app.current_gym_id = ...` risks leaking tenant context to subsequent queries executing on the same pooled connection.

GymRetain resolves this by using **transaction-local settings**:
```typescript
await this.prisma.$transaction(async (tx) => {
  await tx.$executeRawUnsafe(
    `SET LOCAL app.current_gym_id = '${gymId}'`
  );
  // Perform queries inside this isolated transaction
  return await tx.member.findMany({ where: { gymId } });
});
// When transaction finishes or aborts, PostgreSQL resets LOCAL settings automatically.
```
- `SET LOCAL` ensures the variable is scoped strictly to the current transaction block.
- Upon `COMMIT` or `ROLLBACK`, the setting is instantly discarded.
- No session state ever bleeds into another tenant's query.

---

## 3. Audited Super Admin Code Path

Platform-wide super administrators (`superadmin@gymretain.pk`) do not use the tenant-scoped pipeline. Instead:
- Cross-tenant queries are executed exclusively via `SuperAdminPrismaService.runAuditedCrossTenantQuery()`.
- Every super admin access creates an immutable record in `audit_logs` before setting `SET LOCAL app.is_super_admin = 'true'`.
- Normal gym owners and staff are strictly prevented from activating super admin privileges.

---

## 4. Permanent Canary Test Gym (`canary-test-gym`)

To ensure tenant isolation is continually verified across test runs, deployments, and security audits without affecting live tenant data, GymRetain maintains a permanent Canary tenant:

| Property | Value |
| :--- | :--- |
| **Gym Name** | Canary Defense Test Gym |
| **Gym Slug** | `canary-test-gym` |
| **Gym UUID** | `99999999-9999-9999-9999-999999999999` |
| **Canary Member** | Canary TargetMember |
| **Member Code** | `CANARY-001` |
| **Member UUID** | `aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa` |
| **Member Phone** | `+923999999999` |

> **CRITICAL DIRECTIVE:** The Canary Defense Test Gym and Canary Member are permanent security benchmarks. They must never be deleted in any staging, testing, or non-production environment.

Seed the canary gym at any time:
```bash
npm run prisma:seed:canary
```

---

## 5. Adversarial Penetration Test Suite

The test file `backend/test/tenant-isolation.e2e-spec.ts` executes 8 real-world adversarial attacks against the running API:

1. **Attack 1 (Cross-Gym Member Fetch)**: Gym A owner attempts to fetch Canary Gym's member (`CANARY-001`) via `GET /members/:id`.
   - **Result**: `404 Not Found` (Zero existence info leaked).
2. **Attack 2 (Cross-Gym Direct List Bypass)**: Gym A owner attempts to pass Canary Gym's `gymId` in query/body to read their member roster.
   - **Result**: `403 Forbidden` / Scoped strictly to Gym A.
3. **Attack 3 (Cross-Gym Front-Desk Check-In Spoofing)**: Gym A staff attempts to check in Canary Gym's member using Canary QR payload.
   - **Result**: `404 Not Found` / Rejected at tenant scoping layer.
4. **Attack 4 (Cross-Gym Malicious Member Update)**: Gym A owner attempts to modify Canary Member's phone number or plan via `PATCH /members/:id`.
   - **Result**: `404 Not Found` / DB write blocked by RLS `WITH CHECK`.
5. **Attack 5 (Cross-Gym Reward Milestone Injection)**: Gym A owner attempts to trigger or redeem rewards belonging to Canary Gym.
   - **Result**: `403 Forbidden` / Blocked.
6. **Attack 6 (Forged Gym ID in Route Params)**: Authenticated Gym A user manipulates route `:gymId` to match Canary Gym.
   - **Result**: `403 Forbidden` (`TenantAccessGuard` enforces matching JWT gymId).
7. **Attack 7 (Direct PostgreSQL RLS Backstop Test)**: Simulates an application code bug by running raw SQL query without `gymId` filter.
   - **Result**: Returns 0 rows for foreign gyms; `WITH CHECK` blocks inserts.
8. **Attack 8 (Audit Log Recording for Cross-Tenant Super Admin Access)**: Super admin executes cross-tenant query.
   - **Result**: Access succeeds and an immutable audit entry is saved with timestamp, admin ID, and target query.

Run the adversarial test suite:
```bash
cd backend
npm run test:e2e
```

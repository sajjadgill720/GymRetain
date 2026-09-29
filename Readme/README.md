# GymRetain — Multi-Tenant SaaS Platform

GymRetain is a B2B SaaS platform for gym owners to stop silent member churn through **automated retention loops, attendance streaks, reward milestones, WhatsApp nudges, and local payment integration**.

---

## 🏛 Multi-Tenancy Architecture (Dual-Layer Isolation)

GymRetain implements a **Defense-in-Depth** multi-tenancy model with two strict isolation layers:

### Layer 1: Application-Level Request Scoping
- Every tenant table has a `gym_id` foreign key referencing `gyms(id)`.
- All gym-scoped incoming requests pass through `JwtAuthGuard` and `TenantAccessGuard`.
- The user's verified `gymId` is extracted from the JWT and request context.
- All Prisma queries are scoped via `where: { gymId }` and the tenant-scoped client (`TenantPrismaService.forTenant(gymId)`).
- Route params with mismatching `:gymId` are blocked immediately with `403 Forbidden`.

### Layer 2: PostgreSQL Row-Level Security (RLS) Hard Backstop
- Every tenant table has PostgreSQL Row-Level Security enabled and enforced (`ALTER TABLE ... FORCE ROW LEVEL SECURITY`).
- Policies check session settings:
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
- **Connection Pooling Safety**: To prevent session variable leakage across pooled connections (pgBouncer / node-postgres pool), session settings are set via `SET LOCAL app.current_gym_id = ...` inside PostgreSQL transaction blocks (`runWithTenantRLS`). Once the transaction completes or rolls back, PostgreSQL automatically resets the setting.
- If an application code defect ever omits `gymId` or raw SQL is executed, PostgreSQL RLS returns 0 rows and rejects cross-tenant writes.

### Super Admin Audited Separate Code Path
- `super_admin` users accessing platform-wide metrics do **not** use the gym-scoped query pipeline.
- Super admin queries execute through `SuperAdminPrismaService.runAuditedCrossTenantQuery()`.
- Every super admin access creates an immutable entry in `audit_logs` before setting `SET LOCAL app.is_super_admin = 'true'`.

---

## 🚀 Quickstart & Setup

### 1. Prerequisites
- Node.js >= 20.x
- PostgreSQL >= 14
- npm or yarn

### 2. Configure Environment
```bash
cd backend
cp .env.example .env
# Edit .env with your local PostgreSQL database credentials
```

### 3. Install Dependencies
```bash
npm install
```

### 4. Run Prisma Migrations & Generate Client
```bash
npx prisma generate
npx prisma migrate dev --name init_rls
```

### 5. Seed Realistic Test Data (3 Pakistani Gyms)
```bash
npm run prisma:seed
```

Demo Accounts (Password for all: `GymRetain2026!`):
| Role | Email | Gym |
| :--- | :--- | :--- |
| **Super Admin** | `superadmin@gymretain.pk` | Platform-wide |
| **Gym Owner** | `bilal.owner@ironhouse.pk` | Iron House Gym (Lahore) |
| **Gym Staff** | `usman.staff@ironhouse.pk` | Iron House Gym (Lahore) |
| **Gym Owner** | `tariq.owner@ktowncrossfit.pk` | K-Town Crossfit (Karachi) |
| **Gym Owner** | `hamza.owner@margallafit.pk` | Margalla Heights (Islamabad) |

### 6. Run the NestJS Server
```bash
npm run start:dev
# API available at: http://localhost:4000/api/v1
```

---

## 🧪 Running Security & Logic Tests

GymRetain includes dedicated test suites for the core domain rules:

```bash
# Run all tests
npm test

# Test 1: Tenant Isolation Security (cross-tenant reads/writes blocked)
npm run test:isolation

# Test 2: Streak calculation logic (consecutive day rules, gap > 1 day break)
npm run test:streak

# Test 3: Churn risk scoring engine (weighted factors, thresholds)
npm run test:risk
```

---

## 📦 Project Structure

```
backend/
├── prisma/
│   ├── schema.prisma              # Data model for gyms, members, checkins, streaks, rewards, payments, whatsapp
│   ├── migrations/                # PostgreSQL RLS policy migrations
│   └── seed.ts                    # Realistic demo seed data for 3 gyms in Pakistan
├── src/
│   ├── common/
│   │   ├── decorators/            # @CurrentUser, @CurrentGymId, @Roles, @Public
│   │   ├── filters/               # HttpExceptionFilter
│   │   ├── guards/                # JwtAuthGuard, RolesGuard, TenantAccessGuard
│   │   ├── interceptors/          # TransformInterceptor
│   │   └── interfaces/            # JwtPayload, TenantContext
│   ├── config/
│   │   ├── app.config.ts          # Port, API prefix, secrets
│   │   ├── jwt.config.ts          # JWT config
│   │   └── risk-score.config.ts   # Churn risk weights & thresholds
│   ├── prisma/
│   │   ├── prisma.service.ts      # Core Prisma connection
│   │   ├── tenant-prisma.service.ts # Dual-layer query scoping + transaction RLS
│   │   └── super-admin-prisma.service.ts # Audited super admin cross-gym queries
│   ├── modules/
│   │   ├── auth/                  # Owner signup, login, staff invitation
│   │   ├── gyms/                  # Gym profile, QR code generator & secret rotation
│   │   ├── members/               # Member CRUD scoped to tenant
│   │   ├── check-ins/             # Front-desk QR code check-in + streak integration
│   │   ├── streaks/               # Consecutive check-in calculation engine
│   │   ├── rewards/               # Configurable streak milestones & redemptions
│   │   ├── retention/             # Rules-based churn risk score engine
│   │   ├── analytics/             # Owner dashboard KPIs & 30-day attendance trends
│   │   ├── messaging/             # MessagingProvider abstraction (Phase 2 WhatsApp)
│   │   └── payments/              # PaymentProvider abstraction (Phase 3 JazzCash/Easypaisa)
│   ├── app.module.ts
│   └── main.ts
└── test/
    ├── tenant-isolation.spec.ts   # Verifies cross-tenant data isolation
    ├── streak-calculation.spec.ts # Verifies streak increment / break rules
    └── risk-scoring.spec.ts       # Verifies weighted churn risk calculations
```

---

## 📚 Documentation Index (`Readme/`)

All system guides, audits, and architectural specifications are housed in the `Readme/` folder:

| Document | Description |
|---|---|
| [`TOP_NAVIGATION_REDESIGN.md`](TOP_NAVIGATION_REDESIGN.md) | Full-width Amazon/Stripe 2-tier sticky top navigation bar architecture |
| [`UI_REBUILD_MYNEXT9TO5.md`](UI_REBUILD_MYNEXT9TO5.md) | Modern SaaS UI redesign, warm charcoal `#111111`, bento surfaces, 30-sec glance |
| [`DESIGN_SYSTEM_V2.md`](DESIGN_SYSTEM_V2.md) | Design tokens, color system, button shadow utilities (`btn-shadow`), typography |
| [`PHASE1_TENANT_ISOLATION.md`](PHASE1_TENANT_ISOLATION.md) | Dual-layer tenant isolation audit & adversarial test suite |
| [`PHASE2_WHATSAPP_AUTOMATION.md`](PHASE2_WHATSAPP_AUTOMATION.md) | WhatsApp automation, inbound keyword simulator, streak notifications |
| [`DOCKER_GUIDE.md`](DOCKER_GUIDE.md) | Complete Docker containerization guide and local orchestration |
| [`CODE_STYLE.md`](CODE_STYLE.md) | Workspace rules on button shadows, industry styling, and markdown organization |
| [`BACKEND_README.md`](BACKEND_README.md) | Backend NestJS quickstart, environment variables, and Prisma commands |
| [`FRONTEND_README.md`](FRONTEND_README.md) | Next.js frontend setup, port configuration, and mock API mode |


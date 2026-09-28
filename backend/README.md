# GymRetain Backend API

NestJS + TypeScript + PostgreSQL + Prisma multi-tenant service for GymRetain.

Please refer to the root [README.md](../README.md) for full architecture, multi-tenancy RLS documentation, and quickstart commands.

### Key Scripts
- `npm run start:dev`: Start development API server with watch mode
- `npm run prisma:migrate`: Run Prisma migrations (including RLS policies)
- `npm run prisma:seed`: Populate database with 3 realistic Pakistani gyms + Canary Defense Gym
- `npm run prisma:seed:canary`: Idempotently seed or update the permanent Canary Defense Test Gym
- `npm run test:e2e`: Run all 8 adversarial tenant-isolation penetration test cases
- `npm run test:isolation`: Run tenant isolation assertions
- `npm run test:streak`: Run consecutive streak calculation tests
- `npm run test:risk`: Run member churn risk scoring tests

### 🔒 Permanent Canary Test Gym (`canary-test-gym`)
> **CRITICAL DIRECTIVE:** The `Canary Defense Test Gym` (`id: 99999999-9999-9999-9999-999999999999`) and its member `Canary TargetMember` (`CANARY-001`) are persistent security benchmarks. **They must NEVER be deleted in any non-production environment.**
>
> The CI test suite (`tenant-isolation.e2e-spec.ts`) and post-deploy smoke checks execute cross-tenant read, update, and QR check-in attacks against these canary records to prove that tenant isolation is active and that no real gym owner's data could ever be accessed across tenant boundaries.

# GymRetain Backend API

NestJS + TypeScript + PostgreSQL + Prisma multi-tenant service for GymRetain.

Please refer to the root [README.md](../README.md) for full architecture, multi-tenancy RLS documentation, and quickstart commands.

### Key Scripts
- `npm run start:dev`: Start development API server with watch mode
- `npm run prisma:migrate`: Run Prisma migrations (including RLS policies)
- `npm run prisma:seed`: Populate database with 3 realistic Pakistani gyms
- `npm run test:isolation`: Run tenant isolation assertions
- `npm run test:streak`: Run consecutive streak calculation tests
- `npm run test:risk`: Run member churn risk scoring tests

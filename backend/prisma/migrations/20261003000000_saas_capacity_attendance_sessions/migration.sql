-- Migration: 20261003000000_saas_capacity_attendance_sessions
-- Prepared for Production Review (Non-destructive, idempotent)

-- 1. ENUMS CREATION
DO $$ BEGIN
  CREATE TYPE "CapacityPolicy" AS ENUM ('WARNING_ONLY', 'BLOCK_ADMISSION');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE "SaaSSubscriptionPlan" AS ENUM ('TRIAL', 'STARTER', 'PRO', 'ENTERPRISE');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE "SaaSSubscriptionStatus" AS ENUM ('TRIALING', 'ACTIVE', 'PAST_DUE', 'CANCELLED', 'UNPAID');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE "AttendanceSessionStatus" AS ENUM ('OPEN', 'COMPLETED', 'AUTO_CLOSED', 'CORRECTED');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE "InvitationStatus" AS ENUM ('PENDING', 'ACCEPTED', 'EXPIRED', 'REVOKED');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE "SaaSBillingStatus" AS ENUM ('PAID', 'PENDING', 'FAILED', 'REFUNDED');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE "SaaSPaymentProvider" AS ENUM ('SANDBOX_SIMULATOR', 'STRIPE', 'JAZZCASH');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- 2. ALTER TABLE: gyms (Capacity & SaaS Subscription fields)
ALTER TABLE "gyms" ADD COLUMN IF NOT EXISTS "capacity" INTEGER NOT NULL DEFAULT 100;
ALTER TABLE "gyms" ADD COLUMN IF NOT EXISTS "capacity_policy" "CapacityPolicy" NOT NULL DEFAULT 'WARNING_ONLY';
ALTER TABLE "gyms" ADD COLUMN IF NOT EXISTS "saas_plan" "SaaSSubscriptionPlan" NOT NULL DEFAULT 'TRIAL';
ALTER TABLE "gyms" ADD COLUMN IF NOT EXISTS "saas_status" "SaaSSubscriptionStatus" NOT NULL DEFAULT 'TRIALING';
ALTER TABLE "gyms" ADD COLUMN IF NOT EXISTS "trial_ends_at" TIMESTAMPTZ(6);
ALTER TABLE "gyms" ADD COLUMN IF NOT EXISTS "current_period_end" TIMESTAMPTZ(6);
ALTER TABLE "gyms" ADD COLUMN IF NOT EXISTS "cancel_at_period_end" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "gyms" ADD COLUMN IF NOT EXISTS "max_members" INTEGER NOT NULL DEFAULT 100;
ALTER TABLE "gyms" ADD COLUMN IF NOT EXISTS "max_staff" INTEGER NOT NULL DEFAULT 5;

-- 3. ALTER TABLE: members (Opaque Member QR credentials)
ALTER TABLE "members" ADD COLUMN IF NOT EXISTS "qr_credential" VARCHAR(100);
ALTER TABLE "members" ADD COLUMN IF NOT EXISTS "qr_credential_issued_at" TIMESTAMPTZ(6);
ALTER TABLE "members" ADD COLUMN IF NOT EXISTS "qr_credential_revoked_at" TIMESTAMPTZ(6);

DO $$ BEGIN
  ALTER TABLE "members" ADD CONSTRAINT "members_qr_credential_unique" UNIQUE ("qr_credential");
EXCEPTION
  WHEN duplicate_table THEN null;
  WHEN duplicate_object THEN null;
END $$;

-- 4. ALTER TABLE: check_ins (Attendance Session Modeling & Idempotency)
ALTER TABLE "check_ins" ADD COLUMN IF NOT EXISTS "check_out_time" TIMESTAMPTZ(6);
ALTER TABLE "check_ins" ADD COLUMN IF NOT EXISTS "check_out_staff_id" UUID;
ALTER TABLE "check_ins" ADD COLUMN IF NOT EXISTS "is_estimated_departure" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "check_ins" ADD COLUMN IF NOT EXISTS "idempotency_key" VARCHAR(100);
ALTER TABLE "check_ins" ADD COLUMN IF NOT EXISTS "session_status" "AttendanceSessionStatus" NOT NULL DEFAULT 'OPEN';
ALTER TABLE "check_ins" ADD COLUMN IF NOT EXISTS "legacy_estimated" BOOLEAN NOT NULL DEFAULT false;

DO $$ BEGIN
  ALTER TABLE "check_ins" ADD CONSTRAINT "check_ins_check_out_staff_id_fkey" 
    FOREIGN KEY ("check_out_staff_id") REFERENCES "gym_staff"("id") ON DELETE SET NULL;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  ALTER TABLE "check_ins" ADD CONSTRAINT "check_ins_idempotency_key_unique" UNIQUE ("idempotency_key");
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

CREATE INDEX IF NOT EXISTS "check_ins_gym_id_session_status_idx" ON "check_ins"("gym_id", "session_status");
CREATE INDEX IF NOT EXISTS "check_ins_gym_id_member_id_session_status_idx" ON "check_ins"("gym_id", "member_id", "session_status");

-- Partial unique index ensuring at most one OPEN attendance session per member per gym
CREATE UNIQUE INDEX IF NOT EXISTS "check_ins_single_open_session_idx" 
  ON "check_ins"("gym_id", "member_id") 
  WHERE session_status = 'OPEN';

-- 5. TABLE: staff_invitations
CREATE TABLE IF NOT EXISTS "staff_invitations" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "gym_id" UUID NOT NULL,
  "email" VARCHAR(255) NOT NULL,
  "role" "StaffRole" NOT NULL DEFAULT 'GYM_STAFF',
  "name" VARCHAR(255),
  "token" VARCHAR(100) NOT NULL,
  "invited_by_id" UUID NOT NULL,
  "status" "InvitationStatus" NOT NULL DEFAULT 'PENDING',
  "expires_at" TIMESTAMPTZ(6) NOT NULL,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "staff_invitations_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "staff_invitations_token_key" UNIQUE ("token"),
  CONSTRAINT "staff_invitations_gym_id_fkey" FOREIGN KEY ("gym_id") REFERENCES "gyms"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "staff_invitations_invited_by_id_fkey" FOREIGN KEY ("invited_by_id") REFERENCES "gym_staff"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "staff_invitations_gym_id_status_idx" ON "staff_invitations"("gym_id", "status");

-- 6. TABLE: saas_billing_records
CREATE TABLE IF NOT EXISTS "saas_billing_records" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "gym_id" UUID NOT NULL,
  "amount" INTEGER NOT NULL,
  "currency" VARCHAR(3) NOT NULL DEFAULT 'USD',
  "plan" "SaaSSubscriptionPlan" NOT NULL DEFAULT 'PRO',
  "status" "SaaSBillingStatus" NOT NULL DEFAULT 'PAID',
  "provider" "SaaSPaymentProvider" NOT NULL DEFAULT 'SANDBOX_SIMULATOR',
  "provider_transaction_id" VARCHAR(255),
  "invoice_number" VARCHAR(100) NOT NULL,
  "period_start" TIMESTAMPTZ(6) NOT NULL,
  "period_end" TIMESTAMPTZ(6) NOT NULL,
  "paid_at" TIMESTAMPTZ(6),
  "description" TEXT,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "saas_billing_records_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "saas_billing_records_invoice_number_key" UNIQUE ("invoice_number"),
  CONSTRAINT "saas_billing_records_gym_id_fkey" FOREIGN KEY ("gym_id") REFERENCES "gyms"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "saas_billing_records_gym_id_status_idx" ON "saas_billing_records"("gym_id", "status");

-- 7. ROW-LEVEL SECURITY POLICIES FOR NEW TABLES

ALTER TABLE "staff_invitations" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "staff_invitations" FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS staff_invitations_tenant_isolation_policy ON "staff_invitations";
CREATE POLICY staff_invitations_tenant_isolation_policy ON "staff_invitations"
  FOR ALL
  USING (
    gym_id = NULLIF(current_setting('app.current_gym_id', true), '')::uuid
    OR NULLIF(current_setting('app.is_super_admin', true), '')::boolean = true
  )
  WITH CHECK (
    gym_id = NULLIF(current_setting('app.current_gym_id', true), '')::uuid
  );

ALTER TABLE "saas_billing_records" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "saas_billing_records" FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS saas_billing_records_tenant_isolation_policy ON "saas_billing_records";
CREATE POLICY saas_billing_records_tenant_isolation_policy ON "saas_billing_records"
  FOR ALL
  USING (
    gym_id = NULLIF(current_setting('app.current_gym_id', true), '')::uuid
    OR NULLIF(current_setting('app.is_super_admin', true), '')::boolean = true
  )
  WITH CHECK (
    gym_id = NULLIF(current_setting('app.current_gym_id', true), '')::uuid
  );

-- 8. RECONCILIATION AUDIT VIEW FOR LEGACY UNCERTAIN CHECK-INS
-- Historical records prior to today without check-out times are flagged for reconciliation.
CREATE OR REPLACE VIEW legacy_unreconciled_attendance AS
SELECT 
  c.id AS check_in_id,
  c.gym_id,
  c.member_id,
  c.check_in_time,
  c.check_in_date,
  c.method,
  c.session_status,
  c.legacy_estimated
FROM check_ins c
WHERE c.check_out_time IS NULL 
  AND c.check_in_date < CURRENT_DATE;

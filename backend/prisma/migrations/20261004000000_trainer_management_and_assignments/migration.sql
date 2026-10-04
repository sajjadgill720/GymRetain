-- Migration: 20261004000000_trainer_management_and_assignments
-- Implements dedicated Trainer model decoupled from GymStaff login accounts,
-- supports trainer profile management (bio, specialties, photo, active, archived),
-- and updates trainer assignments with RLS isolation.

-- 1. Create trainers table
CREATE TABLE IF NOT EXISTS "trainers" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "gym_id" UUID NOT NULL,
  "name" VARCHAR(255) NOT NULL,
  "email" VARCHAR(255),
  "phone" VARCHAR(30),
  "specialties" TEXT[] NOT NULL DEFAULT '{}',
  "photo_url" TEXT,
  "bio" TEXT,
  "is_active" BOOLEAN NOT NULL DEFAULT true,
  "is_archived" BOOLEAN NOT NULL DEFAULT false,
  "staff_id" UUID UNIQUE,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "trainers_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "trainers_gym_id_fkey" FOREIGN KEY ("gym_id") REFERENCES "gyms"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "trainers_staff_id_fkey" FOREIGN KEY ("staff_id") REFERENCES "gym_staff"("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "trainers_gym_id_is_active_is_archived_idx" ON "trainers"("gym_id", "is_active", "is_archived");

-- 2. Populate trainers table from existing GymStaff with role 'TRAINER' if any exist
DO $$
BEGIN
  INSERT INTO "trainers" ("id", "gym_id", "name", "email", "phone", "is_active", "is_archived", "staff_id")
  SELECT gs."id", gs."gym_id", gs."name", gs."email", gs."phone", gs."is_active", false, gs."id"
  FROM "gym_staff" gs
  WHERE gs."role" = 'TRAINER' AND gs."gym_id" IS NOT NULL
  ON CONFLICT ("id") DO NOTHING;
EXCEPTION
  WHEN OTHERS THEN null;
END $$;

-- 3. Update trainer_assignments foreign key to reference trainers table
ALTER TABLE "trainer_assignments" DROP CONSTRAINT IF EXISTS "trainer_assignments_trainer_id_fkey";
ALTER TABLE "trainer_assignments" ADD CONSTRAINT "trainer_assignments_trainer_id_fkey" 
  FOREIGN KEY ("trainer_id") REFERENCES "trainers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- 4. Enable Row Level Security (RLS) on trainers
ALTER TABLE "trainers" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "trainers" FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS trainers_tenant_isolation_policy ON "trainers";
CREATE POLICY trainers_tenant_isolation_policy ON "trainers"
  FOR ALL
  USING (
    gym_id = NULLIF(current_setting('app.current_gym_id', true), '')::uuid
    OR NULLIF(current_setting('app.is_super_admin', true), '')::boolean = true
  )
  WITH CHECK (
    gym_id = NULLIF(current_setting('app.current_gym_id', true), '')::uuid
  );

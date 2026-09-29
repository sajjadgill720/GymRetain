-- Migration: 20260929000000_trainers_and_diet_plans

-- 1. ENUM EXTENSIONS
ALTER TYPE "StaffRole" ADD VALUE IF NOT EXISTS 'GYM_MANAGER';
ALTER TYPE "StaffRole" ADD VALUE IF NOT EXISTS 'TRAINER';

DO $$ BEGIN
  CREATE TYPE "DietGoal" AS ENUM ('WEIGHT_LOSS', 'MUSCLE_GAIN', 'MAINTENANCE', 'CUSTOM');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE "MealType" AS ENUM ('BREAKFAST', 'LUNCH', 'DINNER', 'SNACK');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- 2. TABLE: trainer_assignments
CREATE TABLE IF NOT EXISTS "trainer_assignments" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "gym_id" UUID NOT NULL,
  "member_id" UUID NOT NULL,
  "trainer_id" UUID NOT NULL,
  "assigned_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "is_active" BOOLEAN NOT NULL DEFAULT true,

  CONSTRAINT "trainer_assignments_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "trainer_assignments_gym_id_fkey" FOREIGN KEY ("gym_id") REFERENCES "gyms"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "trainer_assignments_member_id_fkey" FOREIGN KEY ("member_id") REFERENCES "members"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "trainer_assignments_trainer_id_fkey" FOREIGN KEY ("trainer_id") REFERENCES "gym_staff"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "trainer_assignments_gym_id_member_id_is_active_idx" ON "trainer_assignments"("gym_id", "member_id", "is_active");
CREATE INDEX IF NOT EXISTS "trainer_assignments_gym_id_trainer_id_is_active_idx" ON "trainer_assignments"("gym_id", "trainer_id", "is_active");

-- Partial unique index ensuring at most one active trainer assignment per member in a gym
CREATE UNIQUE INDEX IF NOT EXISTS "trainer_assignments_active_member_unique" ON "trainer_assignments"("gym_id", "member_id") WHERE is_active = true;

-- 3. TABLE: diet_plans
CREATE TABLE IF NOT EXISTS "diet_plans" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "gym_id" UUID NOT NULL,
  "member_id" UUID NOT NULL,
  "created_by_id" UUID NOT NULL,
  "title" VARCHAR(255) NOT NULL,
  "goal" "DietGoal" NOT NULL DEFAULT 'MAINTENANCE',
  "custom_goal" VARCHAR(100),
  "notes" TEXT,
  "is_active" BOOLEAN NOT NULL DEFAULT true,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "diet_plans_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "diet_plans_gym_id_fkey" FOREIGN KEY ("gym_id") REFERENCES "gyms"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "diet_plans_member_id_fkey" FOREIGN KEY ("member_id") REFERENCES "members"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "diet_plans_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "gym_staff"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "diet_plans_gym_id_member_id_is_active_idx" ON "diet_plans"("gym_id", "member_id", "is_active");

-- 4. TABLE: diet_plan_meals
CREATE TABLE IF NOT EXISTS "diet_plan_meals" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "diet_plan_id" UUID NOT NULL,
  "meal_type" "MealType" NOT NULL,
  "description" TEXT NOT NULL,
  "calories" INTEGER,
  "protein_g" DOUBLE PRECISION,
  "carbs_g" DOUBLE PRECISION,
  "fat_g" DOUBLE PRECISION,
  "order_index" INTEGER NOT NULL DEFAULT 0,

  CONSTRAINT "diet_plan_meals_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "diet_plan_meals_diet_plan_id_fkey" FOREIGN KEY ("diet_plan_id") REFERENCES "diet_plans"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "diet_plan_meals_diet_plan_id_order_index_idx" ON "diet_plan_meals"("diet_plan_id", "order_index");

-- 5. TABLE: diet_plan_templates
CREATE TABLE IF NOT EXISTS "diet_plan_templates" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "gym_id" UUID,
  "title" VARCHAR(255) NOT NULL,
  "goal" "DietGoal" NOT NULL DEFAULT 'MAINTENANCE',
  "description" TEXT,
  "meals_json" JSONB NOT NULL DEFAULT '[]'::jsonb,
  "is_active" BOOLEAN NOT NULL DEFAULT true,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "diet_plan_templates_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "diet_plan_templates_gym_id_fkey" FOREIGN KEY ("gym_id") REFERENCES "gyms"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "diet_plan_templates_gym_id_is_active_idx" ON "diet_plan_templates"("gym_id", "is_active");

-- 6. ROW-LEVEL SECURITY POLICIES

-- trainer_assignments RLS
ALTER TABLE "trainer_assignments" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "trainer_assignments" FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS trainer_assignments_tenant_isolation_policy ON "trainer_assignments";
CREATE POLICY trainer_assignments_tenant_isolation_policy ON "trainer_assignments"
  FOR ALL
  USING (
    gym_id = NULLIF(current_setting('app.current_gym_id', true), '')::uuid
    OR NULLIF(current_setting('app.is_super_admin', true), '')::boolean = true
  )
  WITH CHECK (
    gym_id = NULLIF(current_setting('app.current_gym_id', true), '')::uuid
  );

-- diet_plans RLS
ALTER TABLE "diet_plans" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "diet_plans" FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS diet_plans_tenant_isolation_policy ON "diet_plans";
CREATE POLICY diet_plans_tenant_isolation_policy ON "diet_plans"
  FOR ALL
  USING (
    gym_id = NULLIF(current_setting('app.current_gym_id', true), '')::uuid
    OR NULLIF(current_setting('app.is_super_admin', true), '')::boolean = true
  )
  WITH CHECK (
    gym_id = NULLIF(current_setting('app.current_gym_id', true), '')::uuid
  );

-- diet_plan_meals RLS (joins with parent diet_plans for gym_id check)
ALTER TABLE "diet_plan_meals" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "diet_plan_meals" FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS diet_plan_meals_tenant_isolation_policy ON "diet_plan_meals";
CREATE POLICY diet_plan_meals_tenant_isolation_policy ON "diet_plan_meals"
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM "diet_plans" dp
      WHERE dp.id = diet_plan_id
        AND (
          dp.gym_id = NULLIF(current_setting('app.current_gym_id', true), '')::uuid
          OR NULLIF(current_setting('app.is_super_admin', true), '')::boolean = true
        )
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM "diet_plans" dp
      WHERE dp.id = diet_plan_id
        AND dp.gym_id = NULLIF(current_setting('app.current_gym_id', true), '')::uuid
    )
  );

-- diet_plan_templates RLS (supports global null gym_id templates + tenant templates)
ALTER TABLE "diet_plan_templates" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "diet_plan_templates" FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS diet_plan_templates_tenant_isolation_policy ON "diet_plan_templates";
CREATE POLICY diet_plan_templates_tenant_isolation_policy ON "diet_plan_templates"
  FOR ALL
  USING (
    gym_id IS NULL
    OR gym_id = NULLIF(current_setting('app.current_gym_id', true), '')::uuid
    OR NULLIF(current_setting('app.is_super_admin', true), '')::boolean = true
  )
  WITH CHECK (
    gym_id = NULLIF(current_setting('app.current_gym_id', true), '')::uuid
  );

-- ==============================================================================
-- GYMRETAIN POSTGRESQL ROW-LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================
-- This migration configures hard-backstop tenant isolation on all tenant-owned tables.
-- Session variables:
--   app.current_gym_id: UUID of the currently authenticated tenant gym
--   app.is_super_admin: 'true' when executing audited cross-tenant super_admin queries
--
-- Note: 'SET LOCAL app.current_gym_id = ...' must be used in transaction blocks
-- to prevent state leakage across pooled connections (pgBouncer / node connection pool).
-- ==============================================================================

-- 1. GYMS TABLE RLS
ALTER TABLE "gyms" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "gyms" FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS gym_tenant_isolation_policy ON "gyms";
CREATE POLICY gym_tenant_isolation_policy ON "gyms"
  FOR ALL
  USING (
    id = NULLIF(current_setting('app.current_gym_id', true), '')::uuid
    OR NULLIF(current_setting('app.is_super_admin', true), '')::boolean = true
  )
  WITH CHECK (
    id = NULLIF(current_setting('app.current_gym_id', true), '')::uuid
    OR NULLIF(current_setting('app.is_super_admin', true), '')::boolean = true
  );

-- 2. GYM_STAFF TABLE RLS
ALTER TABLE "gym_staff" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "gym_staff" FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS gym_staff_tenant_isolation_policy ON "gym_staff";
CREATE POLICY gym_staff_tenant_isolation_policy ON "gym_staff"
  FOR ALL
  USING (
    gym_id = NULLIF(current_setting('app.current_gym_id', true), '')::uuid
    OR NULLIF(current_setting('app.is_super_admin', true), '')::boolean = true
    OR gym_id IS NULL -- Platform super admin records
  )
  WITH CHECK (
    gym_id = NULLIF(current_setting('app.current_gym_id', true), '')::uuid
    OR NULLIF(current_setting('app.is_super_admin', true), '')::boolean = true
  );

-- 3. MEMBERS TABLE RLS
ALTER TABLE "members" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "members" FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS member_tenant_isolation_policy ON "members";
CREATE POLICY member_tenant_isolation_policy ON "members"
  FOR ALL
  USING (
    gym_id = NULLIF(current_setting('app.current_gym_id', true), '')::uuid
    OR NULLIF(current_setting('app.is_super_admin', true), '')::boolean = true
  )
  WITH CHECK (
    gym_id = NULLIF(current_setting('app.current_gym_id', true), '')::uuid
  );

-- 4. MEMBERSHIPS TABLE RLS
ALTER TABLE "memberships" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "memberships" FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS membership_tenant_isolation_policy ON "memberships";
CREATE POLICY membership_tenant_isolation_policy ON "memberships"
  FOR ALL
  USING (
    gym_id = NULLIF(current_setting('app.current_gym_id', true), '')::uuid
    OR NULLIF(current_setting('app.is_super_admin', true), '')::boolean = true
  )
  WITH CHECK (
    gym_id = NULLIF(current_setting('app.current_gym_id', true), '')::uuid
  );

-- 5. CHECK_INS TABLE RLS
ALTER TABLE "check_ins" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "check_ins" FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS checkin_tenant_isolation_policy ON "check_ins";
CREATE POLICY checkin_tenant_isolation_policy ON "check_ins"
  FOR ALL
  USING (
    gym_id = NULLIF(current_setting('app.current_gym_id', true), '')::uuid
    OR NULLIF(current_setting('app.is_super_admin', true), '')::boolean = true
  )
  WITH CHECK (
    gym_id = NULLIF(current_setting('app.current_gym_id', true), '')::uuid
  );

-- 6. STREAKS TABLE RLS
ALTER TABLE "streaks" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "streaks" FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS streak_tenant_isolation_policy ON "streaks";
CREATE POLICY streak_tenant_isolation_policy ON "streaks"
  FOR ALL
  USING (
    gym_id = NULLIF(current_setting('app.current_gym_id', true), '')::uuid
    OR NULLIF(current_setting('app.is_super_admin', true), '')::boolean = true
  )
  WITH CHECK (
    gym_id = NULLIF(current_setting('app.current_gym_id', true), '')::uuid
  );

-- 7. REWARDS TABLE RLS
ALTER TABLE "rewards" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "rewards" FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS reward_tenant_isolation_policy ON "rewards";
CREATE POLICY reward_tenant_isolation_policy ON "rewards"
  FOR ALL
  USING (
    gym_id = NULLIF(current_setting('app.current_gym_id', true), '')::uuid
    OR NULLIF(current_setting('app.is_super_admin', true), '')::boolean = true
  )
  WITH CHECK (
    gym_id = NULLIF(current_setting('app.current_gym_id', true), '')::uuid
  );

-- 8. REWARD_REDEMPTIONS TABLE RLS
ALTER TABLE "reward_redemptions" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "reward_redemptions" FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS reward_redemption_tenant_isolation_policy ON "reward_redemptions";
CREATE POLICY reward_redemption_tenant_isolation_policy ON "reward_redemptions"
  FOR ALL
  USING (
    gym_id = NULLIF(current_setting('app.current_gym_id', true), '')::uuid
    OR NULLIF(current_setting('app.is_super_admin', true), '')::boolean = true
  )
  WITH CHECK (
    gym_id = NULLIF(current_setting('app.current_gym_id', true), '')::uuid
  );

-- 9. PAYMENTS TABLE RLS
ALTER TABLE "payments" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "payments" FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS payment_tenant_isolation_policy ON "payments";
CREATE POLICY payment_tenant_isolation_policy ON "payments"
  FOR ALL
  USING (
    gym_id = NULLIF(current_setting('app.current_gym_id', true), '')::uuid
    OR NULLIF(current_setting('app.is_super_admin', true), '')::boolean = true
  )
  WITH CHECK (
    gym_id = NULLIF(current_setting('app.current_gym_id', true), '')::uuid
  );

-- 10. WHATSAPP_MESSAGES_LOG TABLE RLS
ALTER TABLE "whatsapp_messages_log" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "whatsapp_messages_log" FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS whatsapp_log_tenant_isolation_policy ON "whatsapp_messages_log";
CREATE POLICY whatsapp_log_tenant_isolation_policy ON "whatsapp_messages_log"
  FOR ALL
  USING (
    gym_id = NULLIF(current_setting('app.current_gym_id', true), '')::uuid
    OR NULLIF(current_setting('app.is_super_admin', true), '')::boolean = true
  )
  WITH CHECK (
    gym_id = NULLIF(current_setting('app.current_gym_id', true), '')::uuid
  );

-- 11. AUDIT_LOGS TABLE RLS
ALTER TABLE "audit_logs" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "audit_logs" FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS audit_log_tenant_isolation_policy ON "audit_logs";
CREATE POLICY audit_log_tenant_isolation_policy ON "audit_logs"
  FOR ALL
  USING (
    gym_id = NULLIF(current_setting('app.current_gym_id', true), '')::uuid
    OR NULLIF(current_setting('app.is_super_admin', true), '')::boolean = true
  )
  WITH CHECK (
    gym_id = NULLIF(current_setting('app.current_gym_id', true), '')::uuid
    OR NULLIF(current_setting('app.is_super_admin', true), '')::boolean = true
  );

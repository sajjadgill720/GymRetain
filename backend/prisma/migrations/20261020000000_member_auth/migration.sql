CREATE TABLE "member_otps" (
 "id" UUID PRIMARY KEY, "gym_id" UUID NOT NULL REFERENCES "gyms"("id") ON DELETE CASCADE,
 "member_id" UUID REFERENCES "members"("id") ON DELETE CASCADE,
 "phone_hash" VARCHAR(64) NOT NULL, "code_hash" VARCHAR(64) NOT NULL,
 "attempts" INTEGER NOT NULL DEFAULT 0, "expires_at" TIMESTAMPTZ(6) NOT NULL,
 "consumed_at" TIMESTAMPTZ(6), "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX "member_otps_gym_id_phone_hash_created_at_idx" ON "member_otps"("gym_id","phone_hash","created_at");
CREATE TABLE "portal_rate_limits" (
 "id" VARCHAR(64) PRIMARY KEY, "gym_id" UUID NOT NULL REFERENCES "gyms"("id") ON DELETE CASCADE,
 "count" INTEGER NOT NULL DEFAULT 1, "expires_at" TIMESTAMPTZ(6) NOT NULL
);
CREATE INDEX "portal_rate_limits_expires_at_idx" ON "portal_rate_limits"("expires_at");
ALTER TABLE "member_otps" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "member_otps" FORCE ROW LEVEL SECURITY;
ALTER TABLE "portal_rate_limits" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "portal_rate_limits" FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant ON "member_otps" USING (gym_id = NULLIF(current_setting('app.current_gym_id',true),'')::uuid AND NULLIF(current_setting('app.current_member_id',true),'') IS NULL) WITH CHECK (gym_id = NULLIF(current_setting('app.current_gym_id',true),'')::uuid AND NULLIF(current_setting('app.current_member_id',true),'') IS NULL);
CREATE POLICY tenant ON "portal_rate_limits" USING (gym_id = NULLIF(current_setting('app.current_gym_id',true),'')::uuid AND NULLIF(current_setting('app.current_member_id',true),'') IS NULL) WITH CHECK (gym_id = NULLIF(current_setting('app.current_gym_id',true),'')::uuid AND NULLIF(current_setting('app.current_member_id',true),'') IS NULL);
-- Enables resolving a single public gym slug without granting a cross-tenant query path.
CREATE POLICY portal_public_gym ON "gyms" FOR SELECT USING (slug = NULLIF(current_setting('app.public_gym_slug',true),''));

-- Restrictive policies combine with existing tenant policies (AND, never OR).
CREATE POLICY member_self ON "members" AS RESTRICTIVE FOR ALL USING (NULLIF(current_setting('app.current_member_id',true),'') IS NULL OR id = NULLIF(current_setting('app.current_member_id',true),'')::uuid) WITH CHECK (NULLIF(current_setting('app.current_member_id',true),'') IS NULL OR id = NULLIF(current_setting('app.current_member_id',true),'')::uuid);
DO $$ DECLARE t TEXT; BEGIN
 FOREACH t IN ARRAY ARRAY['memberships','check_ins','streaks','reward_redemptions','payments','diet_plans','trainer_assignments'] LOOP
  EXECUTE format('CREATE POLICY member_self ON %I AS RESTRICTIVE FOR ALL USING (NULLIF(current_setting(''app.current_member_id'',true),'''') IS NULL OR member_id = NULLIF(current_setting(''app.current_member_id'',true),'''')::uuid) WITH CHECK (NULLIF(current_setting(''app.current_member_id'',true),'''') IS NULL OR member_id = NULLIF(current_setting(''app.current_member_id'',true),'''')::uuid)',t);
 END LOOP;
END $$;
CREATE POLICY member_meals ON diet_plan_meals AS RESTRICTIVE FOR ALL USING (NULLIF(current_setting('app.current_member_id',true),'') IS NULL OR EXISTS (SELECT 1 FROM diet_plans p WHERE p.id=diet_plan_id AND p.member_id=NULLIF(current_setting('app.current_member_id',true),'')::uuid)) WITH CHECK (NULLIF(current_setting('app.current_member_id',true),'') IS NULL);
-- Trainer contacts are exposed only for the member's active assignment.
CREATE POLICY member_trainer ON trainers AS RESTRICTIVE FOR SELECT USING (NULLIF(current_setting('app.current_member_id',true),'') IS NULL OR EXISTS (SELECT 1 FROM trainer_assignments a WHERE a.trainer_id=trainers.id AND a.member_id=NULLIF(current_setting('app.current_member_id',true),'')::uuid AND a.is_active));
DO $$ DECLARE t TEXT; BEGIN
 FOREACH t IN ARRAY ARRAY['gym_staff','audit_logs','whatsapp_messages_log','whatsapp_templates','staff_invitations','saas_billing_records','chat_conversations','chat_messages','diet_plan_templates'] LOOP
  EXECUTE format('CREATE POLICY staff_only ON %I AS RESTRICTIVE FOR ALL USING (NULLIF(current_setting(''app.current_member_id'',true),'''') IS NULL) WITH CHECK (NULLIF(current_setting(''app.current_member_id'',true),'''') IS NULL)',t);
 END LOOP;
END $$;

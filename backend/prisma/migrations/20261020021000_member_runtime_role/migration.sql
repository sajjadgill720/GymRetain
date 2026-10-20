DO $$ BEGIN
 IF NOT EXISTS(SELECT 1 FROM pg_roles WHERE rolname='gymretain_member_runtime') THEN
  CREATE ROLE gymretain_member_runtime NOLOGIN NOSUPERUSER NOBYPASSRLS;
 END IF;
 IF EXISTS(SELECT 1 FROM pg_roles WHERE rolname='gymretain_member_runtime' AND (rolsuper OR rolbypassrls OR rolcanlogin)) THEN
  RAISE EXCEPTION 'gymretain_member_runtime must be NOLOGIN NOSUPERUSER NOBYPASSRLS';
 END IF;
END $$;
GRANT USAGE ON SCHEMA public TO gymretain_member_runtime;
GRANT SELECT(id,name,timezone,capacity,status) ON gyms TO gymretain_member_runtime;
GRANT SELECT ON members,memberships,check_ins,streaks,rewards,reward_redemptions,payments,diet_plans,diet_plan_meals,trainers,trainer_assignments,member_profiles,class_bookings,workout_logs,personal_records,measurements,trainer_messages,push_subscriptions,announcements,member_requests,portal_events TO gymretain_member_runtime;
GRANT INSERT,UPDATE,DELETE ON member_profiles,workout_logs,personal_records,measurements,push_subscriptions,member_requests TO gymretain_member_runtime;
GRANT INSERT ON trainer_messages TO gymretain_member_runtime;
GRANT UPDATE(streak_freeze_available,last_check_in_date,updated_at) ON streaks TO gymretain_member_runtime;
GRANT UPDATE(status,redeemed_at,updated_at) ON reward_redemptions TO gymretain_member_runtime;
GRANT INSERT ON payments TO gymretain_member_runtime;
GRANT UPDATE(status,failure_reason,updated_at) ON payments TO gymretain_member_runtime;
GRANT UPDATE(first_name,last_name,updated_at) ON members TO gymretain_member_runtime;
GRANT EXECUTE ON FUNCTION portal_occupancy(UUID),portal_book_class(UUID,UUID,UUID,BOOLEAN) TO gymretain_member_runtime;
CREATE POLICY member_payment_insert ON payments AS RESTRICTIVE FOR INSERT WITH CHECK (NULLIF(current_setting('app.current_member_id',true),'') IS NULL OR status IN ('PENDING','FAILED'));
CREATE POLICY member_payment_update ON payments AS RESTRICTIVE FOR UPDATE WITH CHECK (NULLIF(current_setting('app.current_member_id',true),'') IS NULL OR status IN ('PENDING','FAILED'));
CREATE POLICY member_message_insert ON trainer_messages AS RESTRICTIVE FOR INSERT WITH CHECK (NULLIF(current_setting('app.current_member_id',true),'') IS NULL OR (sender='MEMBER' AND EXISTS(SELECT 1 FROM trainer_assignments a WHERE a.gym_id=trainer_messages.gym_id AND a.member_id=trainer_messages.member_id AND a.trainer_id=trainer_messages.trainer_id AND a.is_active)));
CREATE FUNCTION portal_class_schedule(g UUID) RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public SET row_security=off AS $$
BEGIN
 IF g IS DISTINCT FROM NULLIF(current_setting('app.current_gym_id',true),'')::uuid THEN RAISE EXCEPTION 'Tenant mismatch'; END IF;
 RETURN (SELECT coalesce(jsonb_agg(jsonb_build_object('id',s->>'id','title',s->>'title','coach',s->>'coach','startsAt',s->>'startsAt','duration',(s->>'duration')::int,'capacity',(s->>'capacity')::int,'spotsLeft',greatest(0,(s->>'capacity')::int-jsonb_array_length(coalesce(s->'attendees','[]'))))),'[]') FROM public.gyms x CROSS JOIN LATERAL jsonb_array_elements(coalesce(x.settings#>'{operations,sessions}','[]')) s WHERE x.id=g AND s->>'status'='SCHEDULED');
END $$;
GRANT EXECUTE ON FUNCTION portal_class_schedule(UUID) TO gymretain_member_runtime;
DO $$ BEGIN EXECUTE format('GRANT gymretain_member_runtime TO %I',current_user); END $$;

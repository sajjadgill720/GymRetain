CREATE TABLE portal_events (
 id BIGSERIAL PRIMARY KEY, gym_id UUID NOT NULL REFERENCES gyms(id) ON DELETE CASCADE,
 member_id UUID, kind VARCHAR(100) NOT NULL, created_at TIMESTAMPTZ(6) NOT NULL DEFAULT now(),
 FOREIGN KEY (gym_id,member_id) REFERENCES members(gym_id,id) ON DELETE CASCADE
);
CREATE INDEX portal_events_gym_id_id_idx ON portal_events(gym_id,id);
CREATE INDEX portal_events_created_at_idx ON portal_events(created_at);
ALTER TABLE portal_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE portal_events FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant ON portal_events USING (gym_id=NULLIF(current_setting('app.current_gym_id',true),'')::uuid);
CREATE POLICY member_self ON portal_events AS RESTRICTIVE USING (NULLIF(current_setting('app.current_member_id',true),'') IS NULL OR member_id IS NULL OR member_id=NULLIF(current_setting('app.current_member_id',true),'')::uuid);
CREATE FUNCTION portal_emit_change() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public SET row_security=off AS $$
DECLARE row_data JSONB; g UUID; m UUID;
BEGIN
 row_data:=CASE WHEN TG_OP='DELETE' THEN to_jsonb(OLD) ELSE to_jsonb(NEW) END;
 g:=CASE WHEN TG_TABLE_NAME='gyms' THEN (row_data->>'id')::uuid ELSE (row_data->>'gym_id')::uuid END;
 m:=CASE WHEN TG_TABLE_NAME='members' THEN (row_data->>'id')::uuid ELSE NULLIF(row_data->>'member_id','')::uuid END;
 INSERT INTO public.portal_events(gym_id,member_id,kind) VALUES(g,m,TG_TABLE_NAME);
 IF TG_TABLE_NAME='check_ins' THEN INSERT INTO public.portal_events(gym_id,kind) VALUES(g,'occupancy'); END IF;
 RETURN NULL;
END $$;
DO $$ DECLARE t TEXT; BEGIN
 FOREACH t IN ARRAY ARRAY['gyms','members','check_ins','streaks','rewards','reward_redemptions','memberships','payments','diet_plans','trainer_assignments','member_profiles','class_bookings','workout_logs','personal_records','measurements','trainer_messages','announcements','member_requests'] LOOP
  EXECUTE format('CREATE TRIGGER portal_changes AFTER INSERT OR UPDATE ON %I FOR EACH ROW EXECUTE FUNCTION portal_emit_change()',t);
 END LOOP;
END $$;
-- Meal edits to existing plans also invalidate the assigned member's view.
CREATE FUNCTION portal_emit_meal_change() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public SET row_security=off AS $$
DECLARE plan UUID; BEGIN
 plan:=CASE WHEN TG_OP='DELETE' THEN OLD.diet_plan_id ELSE NEW.diet_plan_id END;
 INSERT INTO public.portal_events(gym_id,member_id,kind) SELECT gym_id,member_id,'diet_plans' FROM public.diet_plans WHERE id=plan;
 RETURN NULL;
END $$;
CREATE TRIGGER portal_meal_changes AFTER INSERT OR UPDATE OR DELETE ON diet_plan_meals FOR EACH ROW EXECUTE FUNCTION portal_emit_meal_change();

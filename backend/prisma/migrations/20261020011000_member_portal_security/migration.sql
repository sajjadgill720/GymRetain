DO $$ DECLARE t TEXT; BEGIN
 FOREACH t IN ARRAY ARRAY['member_profiles','class_bookings','workout_logs','personal_records','measurements','trainer_messages','push_subscriptions','member_requests','announcements'] LOOP
  EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY',t);
  EXECUTE format('ALTER TABLE %I FORCE ROW LEVEL SECURITY',t);
  EXECUTE format('CREATE POLICY tenant ON %I FOR ALL USING (gym_id = NULLIF(current_setting(''app.current_gym_id'',true),'''')::uuid OR NULLIF(current_setting(''app.is_super_admin'',true),'''')::boolean = true) WITH CHECK (gym_id = NULLIF(current_setting(''app.current_gym_id'',true),'''')::uuid)',t);
  IF t <> 'announcements' THEN
   EXECUTE format('CREATE POLICY member_self ON %I AS RESTRICTIVE FOR ALL USING (NULLIF(current_setting(''app.current_member_id'',true),'''') IS NULL OR member_id = NULLIF(current_setting(''app.current_member_id'',true),'''')::uuid) WITH CHECK (NULLIF(current_setting(''app.current_member_id'',true),'''') IS NULL OR member_id = NULLIF(current_setting(''app.current_member_id'',true),'''')::uuid)',t);
  END IF;
 END LOOP;
END $$;
CREATE POLICY staff_write ON announcements AS RESTRICTIVE FOR INSERT WITH CHECK (NULLIF(current_setting('app.current_member_id',true),'') IS NULL);
CREATE POLICY staff_update ON announcements AS RESTRICTIVE FOR UPDATE USING (NULLIF(current_setting('app.current_member_id',true),'') IS NULL) WITH CHECK (NULLIF(current_setting('app.current_member_id',true),'') IS NULL);
CREATE POLICY staff_delete ON announcements AS RESTRICTIVE FOR DELETE USING (NULLIF(current_setting('app.current_member_id',true),'') IS NULL);
ALTER TABLE member_profiles ADD CONSTRAINT weekly_target_range CHECK (weekly_target BETWEEN 1 AND 7);
ALTER TABLE class_bookings ADD CONSTRAINT booking_status CHECK (status IN ('BOOKED','WAITLISTED','CANCELLED'));
ALTER TABLE workout_logs ADD CONSTRAINT workout_minutes_range CHECK (minutes BETWEEN 1 AND 480);
ALTER TABLE trainer_messages ADD CONSTRAINT message_sender CHECK (sender IN ('MEMBER','TRAINER'));

-- These narrowly scoped functions must be installed by the migration/admin role
-- (BYPASSRLS). The runtime role must NOT have BYPASSRLS or own these functions.
-- Every function verifies transaction-local identity before aggregate/cross-row work.
CREATE FUNCTION portal_occupancy(g UUID) RETURNS INTEGER
LANGUAGE plpgsql SECURITY DEFINER SET search_path = pg_catalog, public SET row_security = off AS $$
BEGIN
 IF g IS DISTINCT FROM NULLIF(current_setting('app.current_gym_id',true),'')::uuid THEN RAISE EXCEPTION 'Tenant mismatch'; END IF;
 RETURN (SELECT count(*)::int FROM public.check_ins WHERE gym_id=g AND session_status='OPEN');
END $$;

CREATE FUNCTION portal_book_class(g UUID,m UUID,s UUID,cancel_booking BOOLEAN)
RETURNS TABLE(booking_status TEXT) LANGUAGE plpgsql SECURITY DEFINER SET search_path = pg_catalog, public SET row_security = off AS $$
DECLARE gym_settings JSONB; ops JSONB; sessions JSONB; session JSONB; item JSONB; own_booking public.class_bookings%ROWTYPE;
 next_booking public.class_bookings%ROWTYPE; label TEXT; attendee JSONB; result_status TEXT; idx INTEGER:=0; found_idx INTEGER:=-1;
BEGIN
 IF g IS DISTINCT FROM NULLIF(current_setting('app.current_gym_id',true),'')::uuid OR m IS DISTINCT FROM NULLIF(current_setting('app.current_member_id',true),'')::uuid THEN RAISE EXCEPTION 'Identity mismatch'; END IF;
 SELECT settings INTO gym_settings FROM public.gyms WHERE id=g FOR UPDATE;
 ops:=coalesce(gym_settings->'operations','{"version":0,"sessions":[],"leads":[],"tasks":[],"expenses":[]}'::jsonb);
 sessions:=coalesce(ops->'sessions','[]'::jsonb);
 FOR item IN SELECT value FROM jsonb_array_elements(sessions) LOOP
  IF item->>'id'=s::text THEN session:=item;found_idx:=idx;EXIT; END IF;idx:=idx+1;
 END LOOP;
 IF found_idx<0 THEN RAISE EXCEPTION 'Class not found'; END IF;
 IF session->>'status'<>'SCHEDULED' OR (session->>'startsAt')::timestamptz<=now() THEN RAISE EXCEPTION 'Class is no longer open for booking'; END IF;
 SELECT first_name||' '||last_name||' ('||member_code||')' INTO label FROM public.members WHERE id=m AND gym_id=g AND status='ACTIVE';
 IF label IS NULL THEN RAISE EXCEPTION 'An active member account is required'; END IF;
 SELECT * INTO own_booking FROM public.class_bookings WHERE gym_id=g AND member_id=m AND session_id=s;
 attendee:=coalesce(session->'attendees','[]'::jsonb);
 IF cancel_booking THEN
  IF own_booking.id IS NULL OR own_booking.status='CANCELLED' THEN RETURN QUERY SELECT 'CANCELLED'::text;RETURN; END IF;
  UPDATE public.class_bookings SET status='CANCELLED',updated_at=now() WHERE id=own_booking.id AND gym_id=g AND member_id=m;
  IF own_booking.status='BOOKED' THEN
   SELECT coalesce(jsonb_agg(value),'[]'::jsonb) INTO attendee FROM jsonb_array_elements(attendee) WHERE value<>to_jsonb(own_booking.attendee_label);
   SELECT * INTO next_booking FROM public.class_bookings WHERE gym_id=g AND session_id=s AND status='WAITLISTED' ORDER BY created_at,id LIMIT 1 FOR UPDATE;
   IF next_booking.id IS NOT NULL AND jsonb_array_length(attendee)<(session->>'capacity')::int THEN
    UPDATE public.class_bookings SET status='BOOKED',updated_at=now() WHERE id=next_booking.id AND gym_id=g;
    attendee:=attendee||jsonb_build_array(next_booking.attendee_label);
   END IF;
  END IF;
  result_status:='CANCELLED';
 ELSE
  IF own_booking.status IN ('BOOKED','WAITLISTED') THEN RETURN QUERY SELECT own_booking.status::text;RETURN; END IF;
  result_status:=CASE WHEN jsonb_array_length(attendee)<(session->>'capacity')::int THEN 'BOOKED' ELSE 'WAITLISTED' END;
  INSERT INTO public.class_bookings(id,gym_id,member_id,session_id,status,attendee_label,updated_at) VALUES(gen_random_uuid(),g,m,s,result_status,label,now()) ON CONFLICT(gym_id,member_id,session_id) DO UPDATE SET status=EXCLUDED.status,attendee_label=EXCLUDED.attendee_label,created_at=now(),updated_at=now();
  IF result_status='BOOKED' THEN attendee:=attendee||jsonb_build_array(label); END IF;
 END IF;
 session:=jsonb_set(session,'{attendees}',attendee);
 sessions:=jsonb_set(sessions,ARRAY[found_idx::text],session);
 ops:=jsonb_set(jsonb_set(ops,'{sessions}',sessions),'{version}',to_jsonb(coalesce((ops->>'version')::int,0)+1));
 UPDATE public.gyms SET settings=jsonb_set(coalesce(gym_settings,'{}'),'{operations}',ops),updated_at=now() WHERE id=g;
 RETURN QUERY SELECT result_status;
END $$;

-- Keep staff edits compatible with portal bookings, including class cancellations.
CREATE FUNCTION portal_preserve_bookings() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = pg_catalog, public SET row_security = off AS $$
DECLARE sessions JSONB; session JSONB; output JSONB:='[]'; label TEXT; attendees JSONB;
BEGIN
 IF NEW.settings->'operations'->'sessions' IS NULL THEN RETURN NEW; END IF;
 FOR session IN SELECT value FROM jsonb_array_elements(NEW.settings->'operations'->'sessions') LOOP
  IF session->>'status'='CANCELLED' THEN
   UPDATE public.class_bookings SET status='CANCELLED',updated_at=now() WHERE gym_id=NEW.id AND session_id=(session->>'id')::uuid AND status<>'CANCELLED';
  ELSE
   attendees:=coalesce(session->'attendees','[]');
   FOR label IN SELECT attendee_label FROM public.class_bookings WHERE gym_id=NEW.id AND session_id=(session->>'id')::uuid AND status='BOOKED' LOOP
    IF NOT attendees @> jsonb_build_array(label) THEN attendees:=attendees||jsonb_build_array(label); END IF;
   END LOOP;
   IF jsonb_array_length(attendees)>(session->>'capacity')::int THEN RAISE EXCEPTION 'Capacity is below confirmed bookings'; END IF;
   session:=jsonb_set(session,'{attendees}',attendees);
  END IF;
  output:=output||jsonb_build_array(session);
 END LOOP;
 NEW.settings:=jsonb_set(NEW.settings,'{operations,sessions}',output);RETURN NEW;
END $$;
CREATE TRIGGER preserve_portal_bookings BEFORE UPDATE OF settings ON gyms FOR EACH ROW EXECUTE FUNCTION portal_preserve_bookings();

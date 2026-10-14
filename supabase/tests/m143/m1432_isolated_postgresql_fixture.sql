\set ON_ERROR_STOP on
-- Isolated PostgreSQL contract fixture, NOT a production or full Supabase schema.
-- Tables/columns, edit authority and value rules mirror the source's public.work_board_* contract.
CREATE EXTENSION IF NOT EXISTS pgcrypto;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname='authenticated') THEN CREATE ROLE authenticated NOLOGIN; END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname='anon') THEN CREATE ROLE anon NOLOGIN; END IF;
END $$;
CREATE SCHEMA IF NOT EXISTS auth;
CREATE OR REPLACE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql STABLE AS $$
  SELECT nullif(current_setting('request.jwt.claim.sub',true),'')::uuid
$$;

CREATE TABLE public.work_boards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  status text NOT NULL DEFAULT 'active' CHECK(status IN ('active','archived','trashed')),
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid
);
CREATE TABLE public.work_board_members (
  board_id uuid NOT NULL REFERENCES public.work_boards(id),
  user_id uuid NOT NULL,
  role text NOT NULL CHECK(role IN ('owner','editor','viewer')),
  PRIMARY KEY(board_id,user_id)
);
CREATE TABLE public.work_board_groups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  board_id uuid NOT NULL REFERENCES public.work_boards(id),
  title text NOT NULL CHECK(char_length(btrim(title)) BETWEEN 1 AND 120),
  position integer NOT NULL DEFAULT 0 CHECK(position>=0),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE public.work_board_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  board_id uuid NOT NULL REFERENCES public.work_boards(id),
  group_id uuid NOT NULL REFERENCES public.work_board_groups(id),
  title text NOT NULL CHECK(char_length(btrim(title)) BETWEEN 1 AND 240),
  status text NOT NULL DEFAULT 'not_started',
  position integer NOT NULL DEFAULT 0 CHECK(position>=0),
  archived_at timestamptz,
  created_by uuid NOT NULL,
  updated_by uuid NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE public.work_board_columns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  board_id uuid NOT NULL REFERENCES public.work_boards(id),
  column_key text NOT NULL,
  name text NOT NULL CHECK(char_length(btrim(name)) BETWEEN 1 AND 80),
  data_type text NOT NULL CHECK(data_type IN ('text','long_text','number','status','dropdown','date','people','checkbox','url','email','timeline')),
  system_key text,
  position integer NOT NULL DEFAULT 0 CHECK(position>=0),
  config jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_by uuid NOT NULL,
  updated_by uuid NOT NULL,
  UNIQUE(board_id,column_key)
);
CREATE UNIQUE INDEX work_board_columns_name_ci_idx ON public.work_board_columns(board_id,lower(name));
CREATE TABLE public.work_board_item_values (
  item_id uuid NOT NULL REFERENCES public.work_board_items(id),
  column_id uuid NOT NULL REFERENCES public.work_board_columns(id),
  value jsonb,
  updated_by uuid NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY(item_id,column_id)
);
CREATE TABLE public.work_board_events (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  board_id uuid NOT NULL REFERENCES public.work_boards(id),
  actor_id uuid NOT NULL,
  event_type text NOT NULL,
  message text NOT NULL,
  entity_type text,
  entity_id text,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb
);

ALTER TABLE public.work_boards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.work_board_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.work_board_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.work_board_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.work_board_columns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.work_board_item_values ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.work_board_events ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON ALL TABLES IN SCHEMA public FROM PUBLIC, anon,authenticated;
GRANT USAGE ON SCHEMA public TO anon,authenticated;

CREATE OR REPLACE FUNCTION public.work_board_access(p_board_id uuid,p_required text DEFAULT 'view') RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path=pg_catalog,public AS $$
 SELECT auth.uid() IS NOT NULL AND EXISTS(
   SELECT 1 FROM public.work_boards b JOIN public.work_board_members m ON m.board_id=b.id
   WHERE b.id=p_board_id AND m.user_id=auth.uid()
   AND ( (p_required='view' AND m.role IN ('owner','editor','viewer'))
         OR (p_required='edit' AND m.role IN ('owner','editor'))
         OR (p_required='manage' AND m.role='owner')))
$$;
REVOKE ALL ON FUNCTION public.work_board_access(uuid,text) FROM PUBLIC,anon,authenticated;

CREATE OR REPLACE FUNCTION public.work_board_log(p_board_id uuid,p_type text,p_message text,p_entity_type text DEFAULT NULL,p_entity_id text DEFAULT NULL,p_payload jsonb DEFAULT '{}'::jsonb) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public AS $$
BEGIN
 INSERT INTO public.work_board_events(board_id,actor_id,event_type,message,entity_type,entity_id,payload)
 VALUES(p_board_id,auth.uid(),p_type,left(p_message,500),p_entity_type,p_entity_id,coalesce(p_payload,'{}'::jsonb));
END $$;
REVOKE ALL ON FUNCTION public.work_board_log(uuid,text,text,text,text,jsonb) FROM PUBLIC,anon,authenticated;

CREATE OR REPLACE FUNCTION public.wm_add_board_group(p_board_id uuid,p_title text) RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public AS $$
DECLARE gid uuid;
BEGIN
 IF NOT public.work_board_access(p_board_id,'edit') THEN RAISE EXCEPTION 'Board edit access denied' USING ERRCODE='42501'; END IF;
 INSERT INTO public.work_board_groups(board_id,title,position)
 VALUES(p_board_id,btrim(p_title),(SELECT coalesce(max(position),-1)+1 FROM public.work_board_groups WHERE board_id=p_board_id)) RETURNING id INTO gid;
 UPDATE public.work_boards SET updated_at=clock_timestamp(),updated_by=auth.uid() WHERE id=p_board_id;
 PERFORM public.work_board_log(p_board_id,'group.created','Group added','group',gid::text,'{}'::jsonb);
 RETURN gid;
END $$;
REVOKE ALL ON FUNCTION public.wm_add_board_group(uuid,text) FROM PUBLIC,anon,authenticated;

CREATE OR REPLACE FUNCTION public.wm_add_board_column(p_board_id uuid,p_name text,p_data_type text,p_config jsonb DEFAULT '{}'::jsonb) RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public AS $$
DECLARE cid uuid;
BEGIN
 IF NOT public.work_board_access(p_board_id,'edit') THEN RAISE EXCEPTION 'Board edit access denied' USING ERRCODE='42501'; END IF;
 IF char_length(btrim(p_name)) NOT BETWEEN 1 AND 80 THEN RAISE EXCEPTION 'Column name length invalid'; END IF;
 IF (SELECT count(*) FROM public.work_board_columns WHERE board_id=p_board_id)>=30 THEN RAISE EXCEPTION 'Column limit'; END IF;
 INSERT INTO public.work_board_columns(board_id,column_key,name,data_type,position,config,created_by,updated_by)
 VALUES(p_board_id,'custom_'||replace(gen_random_uuid()::text,'-',''),btrim(p_name),p_data_type,
 (SELECT coalesce(max(position),-1)+1 FROM public.work_board_columns WHERE board_id=p_board_id),p_config,auth.uid(),auth.uid()) RETURNING id INTO cid;
 UPDATE public.work_boards SET updated_at=clock_timestamp(),updated_by=auth.uid() WHERE id=p_board_id;
 PERFORM public.work_board_log(p_board_id,'column.created','Column added','column',cid::text,'{}'::jsonb);
 RETURN cid;
END $$;
REVOKE ALL ON FUNCTION public.wm_add_board_column(uuid,text,text,jsonb) FROM PUBLIC,anon,authenticated;

CREATE OR REPLACE FUNCTION public.work_board_validate_column_value(p_board_id uuid,p_column_id uuid,p_value jsonb) RETURNS jsonb
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path=pg_catalog,public AS $$
DECLARE typ text; val text;
BEGIN
 SELECT data_type INTO typ FROM public.work_board_columns WHERE board_id=p_board_id AND id=p_column_id;
 IF typ IS NULL THEN RAISE EXCEPTION 'Column not on Board'; END IF;
 IF p_value IS NULL OR p_value='null'::jsonb THEN RETURN NULL; END IF;
 IF typ='number' THEN
   IF jsonb_typeof(p_value)<>'number' THEN RAISE EXCEPTION 'Number requires numeric JSON' USING ERRCODE='22023'; END IF;
 ELSIF typ='checkbox' THEN
   IF jsonb_typeof(p_value)<>'boolean' THEN RAISE EXCEPTION 'Checkbox requires boolean JSON' USING ERRCODE='22023'; END IF;
 ELSIF typ IN ('text','long_text','email','url','date','status','dropdown','people') THEN
   IF jsonb_typeof(p_value)<>'string' THEN RAISE EXCEPTION 'Text requires JSON string' USING ERRCODE='22023'; END IF;
   val:=p_value#>>'{}';
   IF typ='text' AND char_length(val)>1000 THEN RAISE EXCEPTION 'Text length invalid' USING ERRCODE='22023'; END IF;
   IF typ='long_text' AND char_length(val)>5000 THEN RAISE EXCEPTION 'Long text length invalid' USING ERRCODE='22023'; END IF;
 ELSIF typ='timeline' THEN
   IF jsonb_typeof(p_value)<>'object' THEN RAISE EXCEPTION 'Timeline requires object' USING ERRCODE='22023'; END IF;
 ELSE RAISE EXCEPTION 'Unsupported column type'; END IF;
 RETURN p_value;
END $$;
REVOKE ALL ON FUNCTION public.work_board_validate_column_value(uuid,uuid,jsonb) FROM PUBLIC,anon,authenticated;

CREATE OR REPLACE FUNCTION public.wm_set_board_cell(p_item_id uuid,p_column_id uuid,p_value jsonb) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public AS $$
DECLARE bid uuid; norm jsonb;
BEGIN
 SELECT i.board_id INTO bid FROM public.work_board_items i WHERE i.id=p_item_id;
 IF bid IS NULL OR NOT public.work_board_access(bid,'edit') THEN RAISE EXCEPTION 'Board edit access denied' USING ERRCODE='42501'; END IF;
 norm:=public.work_board_validate_column_value(bid,p_column_id,p_value);
 INSERT INTO public.work_board_item_values(item_id,column_id,value,updated_by)
 VALUES(p_item_id,p_column_id,norm,auth.uid())
 ON CONFLICT(item_id,column_id) DO UPDATE SET value=excluded.value,updated_by=excluded.updated_by,updated_at=clock_timestamp();
 UPDATE public.work_board_items SET updated_by=auth.uid(),updated_at=clock_timestamp() WHERE id=p_item_id;
 UPDATE public.work_boards SET updated_by=auth.uid(),updated_at=clock_timestamp() WHERE id=bid;
END $$;
REVOKE ALL ON FUNCTION public.wm_set_board_cell(uuid,uuid,jsonb) FROM PUBLIC,anon,authenticated;

-- Exact deterministic Board fixture, with two items using a shared status to test ambiguity.
INSERT INTO public.work_boards(id,updated_at) VALUES
 ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','2026-10-13T00:00:00Z'),
 ('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb','2026-10-13T00:00:00Z');
INSERT INTO public.work_board_members(board_id,user_id,role) VALUES
 ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','11111111-1111-4111-8111-111111111111','editor'),
 ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','22222222-2222-4222-8222-222222222222','viewer'),
 ('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb','33333333-3333-4333-8333-333333333333','editor');
INSERT INTO public.work_board_groups(id,board_id,title) VALUES
 ('aaaaaaaa-0000-4000-8000-000000000001','aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','Existing Group');
INSERT INTO public.work_board_columns(id,board_id,column_key,name,data_type,system_key,position,created_by,updated_by) VALUES
 ('aaaaaaaa-1000-4000-8000-000000000001','aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','title','Item','text','title',0,'11111111-1111-4111-8111-111111111111','11111111-1111-4111-8111-111111111111'),
 ('aaaaaaaa-1000-4000-8000-000000000002','aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','amount','Amount','number',NULL,1,'11111111-1111-4111-8111-111111111111','11111111-1111-4111-8111-111111111111'),
 ('aaaaaaaa-1000-4000-8000-000000000003','aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','status','Status','status','status',2,'11111111-1111-4111-8111-111111111111','11111111-1111-4111-8111-111111111111');
INSERT INTO public.work_board_items(id,board_id,group_id,title,status,position,created_by,updated_by,updated_at) VALUES
 ('aaaaaaaa-2000-4000-8000-000000000001','aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','aaaaaaaa-0000-4000-8000-000000000001','Existing Alpha','not_started',0,'11111111-1111-4111-8111-111111111111','11111111-1111-4111-8111-111111111111','2026-10-13T00:00:00Z'),
 ('aaaaaaaa-2000-4000-8000-000000000002','aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','aaaaaaaa-0000-4000-8000-000000000001','Existing Beta','not_started',1,'11111111-1111-4111-8111-111111111111','11111111-1111-4111-8111-111111111111','2026-10-13T00:00:00Z');
INSERT INTO public.work_board_item_values(item_id,column_id,value,updated_by) VALUES
 ('aaaaaaaa-2000-4000-8000-000000000001','aaaaaaaa-1000-4000-8000-000000000002','10'::jsonb,'11111111-1111-4111-8111-111111111111'),
 ('aaaaaaaa-2000-4000-8000-000000000002','aaaaaaaa-1000-4000-8000-000000000002','20'::jsonb,'11111111-1111-4111-8111-111111111111');

-- Work Management v1.43.2 — Stage F M29 Database/RLS corrective hardening.
-- Corrects defects exposed by the first real Docker-backed pgTAP run.
begin;

-- Supabase may grant function EXECUTE directly to Data API roles. Restrict the entire
-- public function surface from unauthenticated callers, then retain existing explicit
-- authenticated grants defined by the authoritative schema.
revoke execute on all functions in schema public from anon;
revoke execute on all functions in schema public from public;
alter default privileges for role postgres in schema public revoke execute on functions from anon;
alter default privileges for role postgres in schema public revoke execute on functions from public;

-- RLS helper remains callable by authenticated policies/clients but not anon.
grant execute on function public.is_platform_admin(uuid) to authenticated;

-- Keep self-service display-name normalization deterministic under PostgreSQL
-- standard_conforming_strings by using a POSIX whitespace class.
create or replace function public.update_own_profile(p_display_name text)
returns setof public.profiles
language plpgsql
security definer
set search_path=public
as $$
declare
  clean_name text := regexp_replace(trim(coalesce(p_display_name,'')), '[[:space:]]+', ' ', 'g');
begin
  if auth.uid() is null then raise exception 'Authentication required'; end if;
  if char_length(clean_name) < 2 or char_length(clean_name) > 80 then
    raise exception 'Display name must contain between 2 and 80 characters';
  end if;
  return query update public.profiles set display_name=clean_name
    where id=auth.uid() and status='active' returning *;
end;
$$;
revoke all on function public.update_own_profile(text) from anon;
revoke all on function public.update_own_profile(text) from public;
grant execute on function public.update_own_profile(text) to authenticated;

-- Board authorization must be total and fail closed. A missing membership row yields
-- SQL NULL unless normalized, and IF NOT NULL does not enter a denial branch.
create or replace function public.work_board_access(p_board_id uuid, p_required text default 'view') returns boolean
language plpgsql stable security definer set search_path=public as $$
declare caller uuid:=auth.uid(); member_role text; ws uuid; board_ws uuid;
begin
  if caller is null then return false; end if;
  if not exists(select 1 from public.profiles p where p.id=caller and p.status='active') then return false; end if;
  select workspace_id into board_ws from public.work_boards where id=p_board_id;
  if board_ws is null then return false; end if;
  ws:=public.current_workspace_id(caller);
  if ws is null or ws<>board_ws then return false; end if;
  if public.is_platform_admin(caller) then return true; end if;
  select role into member_role from public.work_board_members where board_id=p_board_id and user_id=caller;
  if p_required='manage' then return coalesce(member_role='owner',false); end if;
  if p_required='edit' then return coalesce(member_role in ('owner','editor'),false); end if;
  if p_required='view' then return coalesce(member_role in ('owner','editor','viewer'),false); end if;
  return false;
end $$;
revoke all on function public.work_board_access(uuid,text) from anon;
revoke all on function public.work_board_access(uuid,text) from public;

notify pgrst, 'reload schema';
commit;

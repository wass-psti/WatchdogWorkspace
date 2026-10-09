-- Provenance guard for the applied VIEWER comment-write hardening migration.
do $$
begin
  if not exists(select 1 from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='private' and p.proname='material_tracker_can_write') then
    raise exception 'Material Tracker write guard is missing';
  end if;
end $$;

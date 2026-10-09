-- Provenance guard for the applied private-helper privilege hardening migration.
do $$
begin
  if has_function_privilege('anon','private.material_tracker_current_role(uuid)','EXECUTE') then
    raise exception 'anon must not execute Material Tracker private role helper';
  end if;
end $$;

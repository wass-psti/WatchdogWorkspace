-- WatchdogWorkspace M144.8: READ ONLY metadata, no DDL, DML, or sensitive row dumps.
-- Must be executed only against authorized WatchdogWorkspace Supabase project.
SELECT p.proname AS function_name,
 pg_get_function_identity_arguments(p.oid) AS argument_signature,
 octet_length(p.prosrc) AS body_bytes,
 encode(extensions.digest(p.prosrc, 'sha256'),'hex') AS hosted_body_sha256,
 p.prosecdef AS security_definer,
 p.proconfig AS function_settings,
 pg_get_userbyid(p.proowner) AS owner,
 has_function_privilege('authenticated',p.oid,'EXECUTE') AS authenticated_execute,
 has_function_privilege('anon',p.oid,'EXECUTE') AS anonymous_execute
FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
WHERE n.nspname='public' AND p.proname='wm_import_board_wizard_atomic';

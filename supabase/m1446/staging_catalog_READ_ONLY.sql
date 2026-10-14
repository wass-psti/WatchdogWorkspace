-- M144.6 READ-ONLY HOSTED STAGING CATALOG INSPECTION TEMPLATE.
-- DO NOT RUN ON PRODUCTION. Does not deploy, modify or seed any data.
-- Requires independently approved, explicitly identified nonproduction target.
-- Metadata only: absence of user-level security tests is NOT staging acceptance.
BEGIN TRANSACTION READ ONLY;
SET LOCAL statement_timeout = '10000ms';
SET LOCAL lock_timeout = '1000ms';
WITH required_tables(name) AS (
    VALUES ('work_boards'), ('work_board_groups'), ('work_board_columns'),
           ('work_board_items'), ('work_board_item_values'), ('work_board_members')
),
relation_catalog AS (
    SELECT rt.name, cls.oid,
           jsonb_build_object(
               'exists', cls.oid IS NOT NULL,
               'rls_enabled', coalesce(cls.relrowsecurity, false),
               'rls_forced', coalesce(cls.relforcerowsecurity, false),
               'policy_count', (
                   SELECT count(*) FROM pg_catalog.pg_policy policy
                   WHERE policy.polrelid = cls.oid
               )
           ) AS result
    FROM required_tables rt
    LEFT JOIN pg_catalog.pg_class cls
      ON cls.oid = pg_catalog.to_regclass('public.' || rt.name)
),
required_helpers(name) AS (
    VALUES ('work_board_access'), ('wm_add_board_group'),
           ('wm_add_board_column'), ('wm_set_board_cell'), ('work_board_log')
),
function_catalog AS (
    SELECT h.name,
           jsonb_build_object(
             'exists', EXISTS (
                  SELECT 1 FROM pg_catalog.pg_proc proc
                  JOIN pg_catalog.pg_namespace ns ON ns.oid = proc.pronamespace
                  WHERE ns.nspname = 'public' AND proc.proname = h.name
             ),
             'overload_count', (
                  SELECT count(*) FROM pg_catalog.pg_proc proc
                  JOIN pg_catalog.pg_namespace ns ON ns.oid = proc.pronamespace
                  WHERE ns.nspname = 'public' AND proc.proname = h.name
             )
           ) AS result
    FROM required_helpers h
),
wizard AS (
   SELECT proc.oid, proc.prosecdef, proc.proconfig, proc.proowner
   FROM (SELECT pg_catalog.to_regprocedure(
      'public.wm_import_board_wizard_atomic(uuid,timestamptz,jsonb)'
   ) AS wanted) w
   LEFT JOIN pg_catalog.pg_proc proc ON proc.oid = w.wanted
)
SELECT jsonb_build_object(
    'schema', 'watchdogworkspace.m1446.staging-catalog.v1',
    'server_version_num', current_setting('server_version_num')::integer,
    'read_only_transaction', current_setting('transaction_read_only') = 'on',
    'migration_history_relation_present',
       pg_catalog.to_regclass('supabase_migrations.schema_migrations') IS NOT NULL,
    'relations', (SELECT jsonb_object_agg(name, result) FROM relation_catalog),
    'functions', (SELECT jsonb_object_agg(name, result) FROM function_catalog),
    'wizard_rpc', (
      SELECT jsonb_build_object(
        'exists', wizard.oid IS NOT NULL,
        'security_definer', coalesce(wizard.prosecdef, false),
        'owner', CASE WHEN wizard.oid IS NULL THEN null
                      ELSE pg_catalog.pg_get_userbyid(wizard.proowner) END,
        'settings', to_jsonb(wizard.proconfig),
        'authenticated_execute', CASE
            WHEN wizard.oid IS NULL OR NOT EXISTS (
                 SELECT 1 FROM pg_catalog.pg_roles WHERE rolname = 'authenticated'
            ) THEN false
            ELSE pg_catalog.has_function_privilege('authenticated', wizard.oid, 'EXECUTE') END,
        'anon_execute', CASE
            WHEN wizard.oid IS NULL OR NOT EXISTS (
                 SELECT 1 FROM pg_catalog.pg_roles WHERE rolname = 'anon'
            ) THEN false
            ELSE pg_catalog.has_function_privilege('anon', wizard.oid, 'EXECUTE') END
      ) FROM wizard
    )
)::text AS m1446_catalog_json;
COMMIT;

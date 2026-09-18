begin;
create extension if not exists pgtap with schema extensions;
select plan(14);

select is(public.wm_board_backend_capabilities()->>'schema_version','1.43.2-m46-v1','Board capability schema is M46');
select is(public.wm_board_backend_capabilities()->>'contract_digest','2e5db3073f702cad96be3eb1d4a18b33ea039252ad4d0532dc9b6e1b3ca0da1c','Board capability digest matches governed M46 contract');
select ok((public.wm_board_backend_capabilities()->>'private_board_realtime')::boolean,'Board capability declares recovered private Realtime authority');
select ok((public.wm_board_contract_attestation()->>'compatible')::boolean,'live catalog attestation reports compatible');
select is((public.wm_board_contract_attestation()->>'rpc_count')::integer,40,'all 40 governed Board RPC signatures are exact');
select is((public.wm_board_contract_attestation()->>'table_count')::integer,9,'all nine Board table column contracts are exact independent of physical column order');
select is((public.wm_board_contract_attestation()->>'rls_table_count')::integer,9,'all nine Board tables have RLS enabled');
select ok((public.wm_board_contract_attestation()->>'board_table_policy_count')::integer=0 and (public.wm_board_contract_attestation()->>'board_table_policy_table_count')::integer=9,'Board tables retain RPC-only deny-by-default RLS with no direct table policies');
select is((public.wm_board_contract_attestation()->>'direct_privilege_violations')::integer,0,'anon/authenticated have no direct Board table CRUD privileges');
select ok((public.wm_board_contract_attestation()->>'storage_ok')::boolean and (public.wm_board_contract_attestation()->>'storage_policy_count')::integer=3,'private Board storage bucket and all three storage policy semantics are exact');
select is((public.wm_board_contract_attestation()->>'realtime_function_count')::integer,2,'both private Board Realtime helper functions match signature/security/search_path/execute contracts');
select ok((public.wm_board_contract_attestation()->>'realtime_policy_count')::integer=2 and (public.wm_board_contract_attestation()->>'realtime_trigger_count')::integer=8,'Board Realtime authorization policy semantics and all eight authoritative change triggers are exact');
select ok(has_function_privilege('anon','public.wm_board_contract_attestation()','EXECUTE') and has_function_privilege('authenticated','public.wm_board_contract_attestation()','EXECUTE'),'safe aggregate contract attestation is executable by runtime roles');
select ok(pg_get_functiondef('public.wm_get_board_item_workspace(uuid)'::regprocedure) like '%''author_id''%' and pg_get_functiondef('public.wm_get_board_item_workspace(uuid)'::regprocedure) like '%''actor_id''%','item workspace emits canonical author_id and actor_id fields');

select * from finish();
rollback;

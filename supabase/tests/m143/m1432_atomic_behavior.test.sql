\set ON_ERROR_STOP on
-- Tests all use BEGIN/ROLLBACK: the fixture baseline remains unchanged.
-- Permissions are exercised with SET LOCAL ROLE; no production connection exists.
CREATE OR REPLACE FUNCTION public.qa_m143_expect_error(p_board uuid,p_version timestamptz,p_payload jsonb,p_expected_state text)
RETURNS void LANGUAGE plpgsql SECURITY INVOKER SET search_path=pg_catalog,public AS $$
DECLARE actual text; message text;
BEGIN
 BEGIN
   PERFORM public.wm_import_board_wizard_atomic(p_board,p_version,p_payload);
 EXCEPTION WHEN OTHERS THEN
   GET STACKED DIAGNOSTICS actual=RETURNED_SQLSTATE,message=MESSAGE_TEXT;
   IF actual=p_expected_state THEN RETURN; END IF;
   RAISE EXCEPTION 'Unexpected SQLSTATE % expected %, message %',actual,p_expected_state,message;
 END;
 RAISE EXCEPTION 'Expected SQLSTATE % but import succeeded',p_expected_state;
END $$;
GRANT EXECUTE ON FUNCTION public.qa_m143_expect_error(uuid,timestamptz,jsonb,text) TO authenticated;
DO $$ BEGIN
 IF NOT has_function_privilege('authenticated','public.wm_import_board_wizard_atomic(uuid,timestamptz,jsonb)','EXECUTE') THEN RAISE EXCEPTION 'authenticated must have RPC execution'; END IF;
 IF has_function_privilege('anon','public.wm_import_board_wizard_atomic(uuid,timestamptz,jsonb)','EXECUTE') THEN RAISE EXCEPTION 'anon must not execute RPC'; END IF;
 RAISE NOTICE 'PASS: RPC ACLs';
END $$;

-- 01 Group and column creation, two rows, same-transaction values + audit.
BEGIN;
SET LOCAL ROLE authenticated;
SET LOCAL request.jwt.claim.sub='11111111-1111-4111-8111-111111111111';
DO $test$
DECLARE result jsonb;
BEGIN
 result:=public.wm_import_board_wizard_atomic(
 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','2026-10-13T00:00:00Z',
 $payload${"contract":"m143-v1","group":{"action":"create","name":"Imported Group"},"matches":{"behavior":"add-new"},"mappings":[{"source":"Name","action":"item"},{"source":"Comment","action":"create","name":"Imported Comment","columnType":"text"}],"newColumns":[{"source":"Comment","name":"Imported Comment","type":"text","config":{}}],"rows":[{"source_row":2,"title":"Created Alpha","values":{"Comment":"first"}},{"source_row":3,"title":"Created Beta","values":{"Comment":"second"}}]}$payload$::jsonb);
 IF result->>'created'<>'2' OR result->>'columnsCreated'<>'1' OR result->>'groupsCreated'<>'1' OR result->>'affected'<>'2' THEN RAISE EXCEPTION 'Incorrect create summary: %',result; END IF;
END $test$;
RESET ROLE;
DO $test$ BEGIN
 IF (SELECT count(*) FROM public.work_board_groups WHERE title='Imported Group')<>1 OR
    (SELECT count(*) FROM public.work_board_columns WHERE name='Imported Comment')<>1 OR
    (SELECT count(*) FROM public.work_board_items WHERE title LIKE 'Created %')<>2 OR
    (SELECT count(*) FROM public.work_board_item_values v JOIN public.work_board_columns c ON c.id=v.column_id WHERE c.name='Imported Comment')<>2 OR
    (SELECT count(*) FROM public.work_board_events WHERE event_type='items.imported.wizard')<>1 THEN
   RAISE EXCEPTION 'Atomic Group/column/item/value/event check failed'; END IF;
 RAISE NOTICE 'PASS: atomic creation and activity audit';
END $test$;
ROLLBACK;

-- 02 Add-new permits duplicate Item names (unlike the old M103 import RPC).
BEGIN;
SET LOCAL ROLE authenticated;
SET LOCAL request.jwt.claim.sub='11111111-1111-4111-8111-111111111111';
DO $test$ DECLARE result jsonb; BEGIN
 result:=public.wm_import_board_wizard_atomic('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','2026-10-13T00:00:00Z',
 $payload${"contract":"m143-v1","group":{"action":"existing","groupId":"aaaaaaaa-0000-4000-8000-000000000001"},"matches":{"behavior":"add-new"},"mappings":[{"source":"Name","action":"item"}],"newColumns":[],"rows":[{"source_row":2,"title":"Existing Alpha","values":{}}]}$payload$::jsonb);
 IF result->>'created'<>'1' THEN RAISE EXCEPTION 'Add-new duplicate behavior broken'; END IF;
END $test$;
RESET ROLE;
DO $test$ BEGIN
 IF (SELECT count(*) FROM public.work_board_items WHERE title='Existing Alpha')<>2 THEN RAISE EXCEPTION 'Add-new item was not duplicated'; END IF;
 RAISE NOTICE 'PASS: add-new permits duplicate name';
END $test$;
ROLLBACK;

-- 03 Skip chooses unique target, preserves existing cell and inserts unmatched row.
BEGIN;
SET LOCAL ROLE authenticated;
SET LOCAL request.jwt.claim.sub='11111111-1111-4111-8111-111111111111';
DO $test$ DECLARE result jsonb; BEGIN
 result:=public.wm_import_board_wizard_atomic('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','2026-10-13T00:00:00Z',
 $payload${"contract":"m143-v1","group":{"action":"existing","groupId":"aaaaaaaa-0000-4000-8000-000000000001"},"matches":{"behavior":"skip","matchColumnId":"item"},"mappings":[{"source":"Name","action":"item"},{"source":"AmountSource","action":"existing","columnId":"aaaaaaaa-1000-4000-8000-000000000002"}],"newColumns":[],"rows":[{"source_row":2,"title":"Existing Alpha","values":{"AmountSource":111}},{"source_row":3,"title":"New Charlie","values":{"AmountSource":30}}]}$payload$::jsonb);
 IF result->>'created'<>'1' OR result->>'skipped'<>'1' THEN RAISE EXCEPTION 'Skip summary invalid: %',result; END IF;
END $test$;
RESET ROLE;
DO $test$ BEGIN
 IF (SELECT value FROM public.work_board_item_values WHERE item_id='aaaaaaaa-2000-4000-8000-000000000001' AND column_id='aaaaaaaa-1000-4000-8000-000000000002')<>'10'::jsonb THEN RAISE EXCEPTION 'Skip overwrote cell'; END IF;
 IF (SELECT count(*) FROM public.work_board_items WHERE title='New Charlie')<>1 THEN RAISE EXCEPTION 'Skip lost unmatched row'; END IF;
 RAISE NOTICE 'PASS: skip matching and preservation';
END $test$;
ROLLBACK;

-- 04 Update uses CAS on current item version; unmatched rows are skipped.
BEGIN;
SET LOCAL ROLE authenticated;
SET LOCAL request.jwt.claim.sub='11111111-1111-4111-8111-111111111111';
DO $test$ DECLARE result jsonb; BEGIN
 result:=public.wm_import_board_wizard_atomic('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','2026-10-13T00:00:00Z',
 $payload${"contract":"m143-v1","group":{"action":"existing","groupId":"aaaaaaaa-0000-4000-8000-000000000001"},"matches":{"behavior":"update","matchColumnId":"item"},"mappings":[{"source":"Name","action":"item"},{"source":"AmountSource","action":"existing","columnId":"aaaaaaaa-1000-4000-8000-000000000002"}],"newColumns":[],"rows":[{"source_row":2,"title":"Existing Alpha","expected_item_updated_at":"2026-10-13T00:00:00Z","values":{"AmountSource":99}},{"source_row":3,"title":"Unmatched","values":{"AmountSource":9}}]}$payload$::jsonb);
 IF result->>'updated'<>'1' OR result->>'skipped'<>'1' THEN RAISE EXCEPTION 'Update summary invalid: %',result; END IF;
END $test$;
RESET ROLE;
DO $test$ BEGIN
 IF (SELECT value FROM public.work_board_item_values WHERE item_id='aaaaaaaa-2000-4000-8000-000000000001' AND column_id='aaaaaaaa-1000-4000-8000-000000000002')<>'99'::jsonb THEN RAISE EXCEPTION 'Update did not set cell'; END IF;
 IF (SELECT count(*) FROM public.work_board_items WHERE title='Unmatched')<>0 THEN RAISE EXCEPTION 'Unmatched update was incorrectly inserted'; END IF;
 RAISE NOTICE 'PASS: update with CAS and unmatched skip';
END $test$;
ROLLBACK;

-- 05 Viewer cannot mutate a Board. No changes survive caught exception.
BEGIN;
SET LOCAL ROLE authenticated;
SET LOCAL request.jwt.claim.sub='22222222-2222-4222-8222-222222222222';
SELECT public.qa_m143_expect_error('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','2026-10-13T00:00:00Z',
 $payload${"contract":"m143-v1","group":{"action":"create","name":"Unauthorized"},"matches":{"behavior":"add-new"},"mappings":[{"source":"Name","action":"item"}],"newColumns":[],"rows":[{"source_row":2,"title":"Unauthorized Item","values":{}}]}$payload$::jsonb,'42501');
RESET ROLE;
DO $test$ BEGIN
 IF EXISTS(SELECT 1 FROM public.work_board_groups WHERE title='Unauthorized') THEN RAISE EXCEPTION 'Viewer mutation survived'; END IF;
 RAISE NOTICE 'PASS: viewer denied';
END $test$;
ROLLBACK;

-- 06 Stale board rejected before any new-group creation.
BEGIN;
SET LOCAL ROLE authenticated;
SET LOCAL request.jwt.claim.sub='11111111-1111-4111-8111-111111111111';
SELECT public.qa_m143_expect_error('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','2025-01-01T00:00:00Z',
 $payload${"contract":"m143-v1","group":{"action":"create","name":"Stale Group"},"matches":{"behavior":"add-new"},"mappings":[{"source":"Name","action":"item"}],"newColumns":[],"rows":[{"source_row":2,"title":"Stale Item","values":{}}]}$payload$::jsonb,'PT409');
RESET ROLE;
DO $test$ BEGIN
 IF EXISTS(SELECT 1 FROM public.work_board_groups WHERE title='Stale Group') THEN RAISE EXCEPTION 'Stale Board wrote Group'; END IF;
 RAISE NOTICE 'PASS: stale Board CAS';
END $test$;
ROLLBACK;

-- 07 Invalid JSON number after adding new Group/column must roll back all writes.
BEGIN;
SET LOCAL ROLE authenticated;
SET LOCAL request.jwt.claim.sub='11111111-1111-4111-8111-111111111111';
SELECT public.qa_m143_expect_error('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','2026-10-13T00:00:00Z',
 $payload${"contract":"m143-v1","group":{"action":"create","name":"Should Roll Back"},"matches":{"behavior":"add-new"},"mappings":[{"source":"Name","action":"item"},{"source":"Fresh","action":"create","name":"Transient Column","columnType":"text"},{"source":"Num","action":"existing","columnId":"aaaaaaaa-1000-4000-8000-000000000002"}],"newColumns":[{"source":"Fresh","name":"Transient Column","type":"text","config":{}}],"rows":[{"source_row":2,"title":"Should Roll Back Item","values":{"Fresh":"temp","Num":"not a number"}}]}$payload$::jsonb,'22023');
RESET ROLE;
DO $test$ BEGIN
 IF EXISTS(SELECT 1 FROM public.work_board_groups WHERE title='Should Roll Back') OR
    EXISTS(SELECT 1 FROM public.work_board_columns WHERE name='Transient Column') OR
    EXISTS(SELECT 1 FROM public.work_board_items WHERE title='Should Roll Back Item') OR
    EXISTS(SELECT 1 FROM public.work_board_events WHERE event_type='items.imported.wizard') THEN RAISE EXCEPTION 'Atomic rollback failed'; END IF;
 RAISE NOTICE 'PASS: all-or-nothing rollback';
END $test$;
ROLLBACK;

-- 08 Ambiguous target match rejected; two rows share status 'not_started'.
BEGIN;
SET LOCAL ROLE authenticated;
SET LOCAL request.jwt.claim.sub='11111111-1111-4111-8111-111111111111';
SELECT public.qa_m143_expect_error('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','2026-10-13T00:00:00Z',
 $payload${"contract":"m143-v1","group":{"action":"existing","groupId":"aaaaaaaa-0000-4000-8000-000000000001"},"matches":{"behavior":"skip","matchColumnId":"aaaaaaaa-1000-4000-8000-000000000003"},"mappings":[{"source":"Name","action":"item"},{"source":"State","action":"existing","columnId":"aaaaaaaa-1000-4000-8000-000000000003"}],"newColumns":[],"rows":[{"source_row":2,"title":"Should Not Create","values":{"State":"not_started"}}]}$payload$::jsonb,'PT409');
RESET ROLE;
DO $test$ BEGIN
 IF EXISTS(SELECT 1 FROM public.work_board_items WHERE title='Should Not Create') THEN RAISE EXCEPTION 'Ambiguous match inserted'; END IF;
 RAISE NOTICE 'PASS: ambiguous match rejected';
END $test$;
ROLLBACK;

-- 09 Stale item version must reject an otherwise valid update.
BEGIN;
SET LOCAL ROLE authenticated;
SET LOCAL request.jwt.claim.sub='11111111-1111-4111-8111-111111111111';
SELECT public.qa_m143_expect_error('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','2026-10-13T00:00:00Z',
 $payload${"contract":"m143-v1","group":{"action":"existing","groupId":"aaaaaaaa-0000-4000-8000-000000000001"},"matches":{"behavior":"update","matchColumnId":"item"},"mappings":[{"source":"Name","action":"item"}],"newColumns":[],"rows":[{"source_row":2,"title":"Existing Alpha","expected_item_updated_at":"2020-01-01T00:00:00Z","values":{}}]}$payload$::jsonb,'PT409');
RESET ROLE;
DO $test$ BEGIN RAISE NOTICE 'PASS: stale item CAS'; END $test$;
ROLLBACK;

-- 10 Anon role lacks RPC EXECUTE even with spoofed test JWT claim.
BEGIN;
SET LOCAL ROLE anon;
SET LOCAL request.jwt.claim.sub='11111111-1111-4111-8111-111111111111';
DO $test$ DECLARE state text; blocked boolean := false; BEGIN
 BEGIN
   PERFORM public.wm_import_board_wizard_atomic('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','2026-10-13T00:00:00Z','{}'::jsonb);
 EXCEPTION WHEN OTHERS THEN
   GET STACKED DIAGNOSTICS state=RETURNED_SQLSTATE;
   IF state='42501' THEN blocked:=true; ELSE RAISE EXCEPTION 'Unexpected anon SQLSTATE %',state; END IF;
 END;
 IF NOT blocked THEN RAISE EXCEPTION 'Anon unexpectedly invoked RPC'; END IF;
END $test$;
RESET ROLE;
DO $test$ BEGIN RAISE NOTICE 'PASS: anon forbidden'; END $test$;
ROLLBACK;

-- 11 Unknown group relation rejected without writes.
BEGIN;
SET LOCAL ROLE authenticated;
SET LOCAL request.jwt.claim.sub='11111111-1111-4111-8111-111111111111';
SELECT public.qa_m143_expect_error('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','2026-10-13T00:00:00Z',
 $payload${"contract":"m143-v1","group":{"action":"existing","groupId":"ffffffff-ffff-4fff-8fff-ffffffffffff"},"matches":{"behavior":"add-new"},"mappings":[{"source":"Name","action":"item"}],"newColumns":[],"rows":[{"source_row":2,"title":"Missing Group","values":{}}]}$payload$::jsonb,'23503');
RESET ROLE;
DO $test$ BEGIN RAISE NOTICE 'PASS: cross/missing group rejected'; END $test$;
ROLLBACK;

-- Final fixture invariants after every test transaction was rolled back.
DO $test$ BEGIN
 IF (SELECT count(*) FROM public.work_board_groups)<>1 OR
    (SELECT count(*) FROM public.work_board_items)<>2 OR
    (SELECT count(*) FROM public.work_board_columns)<>3 OR
    (SELECT count(*) FROM public.work_board_events)<>0 THEN
    RAISE EXCEPTION 'Fixture drift: tests left a persistent mutation'; END IF;
 RAISE NOTICE 'PASS: post-suite fixture unchanged';
END $test$;

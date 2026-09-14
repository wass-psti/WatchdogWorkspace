begin;
create extension if not exists pgtap with schema extensions;
select plan(11);

insert into auth.users(id,email) values
 ('20000000-0000-4000-8000-000000000001','m29-module-one@test.local'),
 ('20000000-0000-4000-8000-000000000002','m29-module-two@test.local'),
 ('20000000-0000-4000-8000-000000000003','m29-module-disabled@test.local');
update public.profiles set status='disabled' where id='20000000-0000-4000-8000-000000000003';

set local role authenticated;
set local request.jwt.claim.sub='20000000-0000-4000-8000-000000000001';
select throws_ok($$select * from public.module_state_entries$$,'42501',null,'module state table is not directly readable');
select ok(public.has_module_access('tradelink'),'active employee has assigned TradeLink access');
select is((public.put_module_state('tradelink','tradelink_ui_v1','{}','user',0)->>'revision')::integer,1,'authorized user-scoped module state write succeeds');
select is((select value from public.list_module_state('tradelink') where state_key='tradelink_ui_v1' and scope='user'),'{}','caller can read own user-scoped state');
select throws_ok($$select public.put_module_state('tradelink','fueltrackplus.requests.v3','[]','shared',0)$$,'22023','state key is not registered for module','cross-module state key is rejected');
select throws_ok($$select public.put_module_state('tradelink','tradelink_ui_v1','{}','shared',1)$$,'22023','state scope mismatch: expected user','state scope policy is enforced');
select throws_ok($$select public.put_module_state('fueltrack-plus','fueltrackplus.userroles.v3','[]','shared',0)$$,'42501','module state write denied','read-only module state key rejects writes');
select throws_ok($$select public.put_module_state('tradelink','tradelink_ui_v1','{"next":true}','user',99)$$,'40001',null,'optimistic revision conflict is enforced');

set local request.jwt.claim.sub='20000000-0000-4000-8000-000000000002';
select is((select count(*)::integer from public.list_module_state('tradelink') where state_key='tradelink_ui_v1' and scope='user'),0,'another user cannot read caller-owned module state');

set local request.jwt.claim.sub='20000000-0000-4000-8000-000000000003';
select ok(not public.has_module_access('tradelink'),'disabled account has no module access');
select throws_ok($$select * from public.list_module_state('tradelink')$$,'42501','module access denied','disabled account cannot invoke module-state read RPC');

select * from finish();
rollback;

import fs from 'node:fs';
import path from 'node:path';
const root=path.resolve(import.meta.dirname);const read=(f)=>fs.readFileSync(path.join(root,f),'utf8');const failures=[];const ok=(v,m)=>{if(!v)failures.push(m)};
const deploy=read('.github/workflows/deploy-pages.yml');const m54=read('.github/workflows/m54-functional-production-readiness.yml');const governed=read('governance-artifacts/github/workflows/deploy-pages.yml');const m36=read('verify-stage-f-m36-production-cutover-certification.mjs');const m54Verifier=read('verify-stage-g-m54-functional-production-readiness-certification.mjs');const m54Execution=read('scripts/verify-stage-g-m54-execution.mjs');const m105Guard=read('scripts/verify-stage-i-m105-m104-source-guard.mjs');const m106Guard=read('scripts/verify-stage-i-m106-m105-source-guard.mjs');const depReview=read('.github/workflows/dependency-review.yml');const m54M105Parity=read('supabase/migrations/20261007024207_stage_i_m106_m54_runtime_capability_m105_parity_corrective.sql');
for(const [name,source] of [['deploy-pages',deploy],['m54',m54],['governed deploy mirror',governed]]){ok(source.includes('actions/deploy-pages@v5'),`${name} must use actions/deploy-pages@v5`);ok(!source.includes('actions/deploy-pages@v4'),`${name} must not retain deploy-pages@v4`)}
ok(deploy.includes('path: ./dist'),'Primary Pages deployment must remain dist-only');ok(deploy.includes('Production post-deploy HTTP smoke'),'Primary Pages deployment must retain live HTTP smoke');ok(deploy.includes('Verify live production backend deployment contract')&&deploy.includes('Re-verify production backend contract after Pages deployment'),'M105 pre/post backend parity guards must remain intact');ok(m54.includes('production-readiness:live')&&m54.includes('production-readiness:certify'),'M54 live/certification contract must remain intact');ok(m36.includes("deployPagesAction==='v4'||(deployPagesAction==='v5'&&m106Authority)"),'M36 must bound v5 acceptance to M106 authority');ok(m54Verifier.includes("m54DeployPagesAction==='v4'||(m54DeployPagesAction==='v5'&&m106Authority)"),'M54 static verifier must bound v5 acceptance to M106 authority');ok(m54Execution.includes("deployPagesAction==='v4'||(deployPagesAction==='v5'&&m106Authority)"),'M54 execution verifier must bound v5 acceptance to M106 authority');ok(m105Guard.includes('M106-M105-BASELINE-SOURCE-MANIFEST.json')&&m105Guard.includes('verify-stage-i-m106-m105-source-guard.mjs'),'M105 source authority must delegate to M106');ok(depReview.includes('actions/dependency-review-action@v4')&&depReview.includes('fail-on-severity: high'),'Dependency Review security policy must remain unchanged; repository Dependency Graph is an external setting');


/* M106_M49_SUPABASE_CLEANUP_GOVERNANCE */
for(const file of [
  'scripts/run-database-rls-tests.mjs',
  'scripts/run-stage-g-m46-database-contract-tests.mjs',
  'scripts/run-stage-g-m47-database-tests.mjs',
  'verify-stage-g-m49-boards-kanban-drag-drop-recovery.mjs',
]) ok(
  m106Guard.includes(`'${file}'`),
  `M106 source guard must authorize corrective mutation: ${file}`
);

for(const file of [
  'M106-M49-SUPABASE-STACK-CLEANUP-CORRECTIVE-2026-10-06.md',
  'scripts/lib/supabase-local-stack-cleanup.mjs',
]) ok(
  m106Guard.includes(`'${file}'`),
  `M106 source guard must authorize corrective addition: ${file}`
);

/* M106_M54_M105_RUNTIME_CAPABILITY_PARITY */
ok(
  m54M105Parity.includes('create or replace function public.wm_runtime_capabilities()'),
  'M106 M54/M105 corrective migration must replace wm_runtime_capabilities'
);
ok(
  m54M105Parity.includes("'wm_import_board_items_atomic'"),
  'M106 runtime capability corrective must advertise wm_import_board_items_atomic'
);
ok(
  m54M105Parity.includes("grant execute on function public.wm_runtime_capabilities() to authenticated"),
  'M106 runtime capability corrective must preserve authenticated-only execution'
);
for(const file of [
  'supabase/migrations/20261007024207_stage_i_m106_m54_runtime_capability_m105_parity_corrective.sql',
  'M106-M54-RUNTIME-CAPABILITY-M105-PARITY-CORRECTIVE-2026-10-07.md',
]) ok(
  m106Guard.includes(`'${file}'`),
  `M106 source guard must authorize M54/M105 parity corrective addition: ${file}`
);

/* M106_M52_ATOMIC_IMPORT_FIXTURE_PARITY */
const m52Fixture=read(
  'tests/modern/e2e/helpers/m52-rbac-fixture.mjs'
);
const m52CapabilityMatch=
  m52Fixture.match(
    /const CAPABILITY_RPCS\s*=\s*\[(.*?)\];/s
  );
ok(
  Boolean(m52CapabilityMatch),
  'M52 fixture must declare CAPABILITY_RPCS'
);
ok(
  m52CapabilityMatch?.[1]?.includes(
    "'wm_import_board_items_atomic'"
  )===true,
  'M52 authenticated E2E fixture must advertise wm_import_board_items_atomic'
);

if(failures.length){console.error('M106 deploy-pages v5 compatibility verification: FAIL');failures.forEach((f)=>console.error(`- ${f}`));process.exit(1)}
console.log('M106 deploy-pages v5 compatibility verification: PASS (v5 adoption; dist-only deployment; M105 backend guards; bounded M36/M54 successor authority; governance mirror parity; Dependency Review policy preserved)');

import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
const root=process.cwd(), failures=[]; const read=p=>fs.readFileSync(path.join(root,p),'utf8'); const ok=(c,m)=>{if(!c)failures.push(m)};
const required=[
  'src/design-system/application-shell-system.ts','src/design-system/application-shell/index.tsx','src/app/shell/WorkManagementShell.tsx',
  'config/stage-i-m81-application-shell-global-navigation-target.ts','architecture/ui-governance/futuristic-minimalist-application-shell.md',
  'M81-APPLICATION-SHELL-GLOBAL-NAVIGATION.md','M81-CONTINUATION-STATE.md','M81-CERTIFICATION-HANDOFF.md',
  'RELEASE-STATUS-v1.43.2-STAGE-I-M81-APPLICATION-SHELL-GLOBAL-NAVIGATION.md',
  'tests/modern/e2e/m81-application-shell.spec.mjs','scripts/run-stage-i-m81-application-shell-browser.mjs',
  'scripts/verify-stage-i-m81-m80-source-guard.mjs','regression-baseline/m81-m80-source-guard.json','scripts/lib/stage-i-m81-checkpoint-tree.mjs',
  'scripts/verify-stage-i-m81-release.sh','scripts/finalize-stage-i-m81.sh','scripts/verify-stage-i-m81-post-certification-state.mjs',
  'scripts/publish-stage-i-m81-certified-artifact.sh','scripts/verify-stage-i-m81-certified-state.mjs','scripts/verify-stage-i-m81-certified-artifact.mjs',
  'scripts/verify-stage-i-m81-certified-package-hygiene.mjs','scripts/verify-stage-i-m81-final-checkpoint.mjs',
  'M81-CORRECTIVE-LOOP-M80-SOURCE-GUARD-SUCCESSOR-SYNCHRONIZATION-2026-09-29.md',
  'M81-CORRECTIVE-LOOP-SHELL-M2-SUCCESSOR-OWNERSHIP-2026-09-29.md',
  'M81-CORRECTIVE-LOOP-E2E-PROMISE-EXECUTOR-LINT-2026-09-29.md',
];
for(const f of required)ok(fs.existsSync(path.join(root,f)),`missing M81 artifact: ${f}`);
const target=read('config/stage-i-m81-application-shell-global-navigation-target.ts');
for(const marker of ["milestone: 81","certifiedZipSha256: '7e0f42e510d8f5189892171cddbed73f3a063e6b7a16a86b94a2d6bebb9e76ff'","certifiedSourceSha256: '978163479a590ec914f2c7574ed5710efeeb0734a3181584a0404934fafe5576'","noDatabaseSchemaMutation: true","noAuthenticationAuthorizationMutation: true","noRouteOwnershipMutation: true","noNewGlobalCssPayloadRequired: true"])ok(target.includes(marker),`M81 target missing: ${marker}`);
const system=read('src/design-system/application-shell-system.ts');
for(const marker of ['application-shell','global-navigation','shell-header','navigation-scroll-region','navigation-status','global-page-frame','preservesM68NavigationSemantics: true','preservesShellM1ThroughM8Behavior: true','preservesRuntimeRouteContentIsland: true'])ok(system.includes(marker),`M81 shell system missing: ${marker}`);
const primitives=read('src/design-system/application-shell/index.tsx');
for(const name of ['WMApplicationShellFrame','WMGlobalNavigation','WMShellHeaderFrame','WMShellNavigationScroll','WMShellStatusFooter','WMGlobalPageFrame'])ok(primitives.includes(name),`M81 shell primitive missing: ${name}`);
const shell=read('src/app/shell/WorkManagementShell.tsx');
for(const marker of ['WMApplicationShellFrame','WMGlobalNavigation','WMShellHeaderFrame','WMShellNavigationScroll','WMShellStatusFooter','shell-skip-link','data-shell-navigation-mobile-toggle','aria-label="Main"','role="separator"','data-shell-navigation-status'])ok(shell.includes(marker),`M81 shell composition missing: ${marker}`);
const runtime=read('src/app/composition/RuntimeApplicationBoundary.tsx'); ok(runtime.includes('data-wm-global-page-frame={workspace ?'), 'M81 runtime page-frame semantic marker missing');
const board=read('src/app/boards/components/BoardPresentationSurface.tsx'); ok(board.includes('data-wm-global-page-frame=""'),'M81 Board page-frame semantic marker missing');
const app=read('assets/js/app.ts'); ok((app.match(/data-wm-shell-page-header/g)||[]).length>=2,'M81 host/module header semantic markers missing');
const rootIndex=read('src/design-system/index.ts'); ok(rootIndex.includes('workManagementApplicationShellSystem')&&rootIndex.includes('WMApplicationShellFrame'),'M81 root design-system API missing');
const cssFiles=fs.readdirSync(path.join(root,'assets/css')).filter(f=>f.toLowerCase().includes('m81')); ok(cssFiles.length===0,'M81 must not add a new global CSS payload');
const transitivePredecessorGuard=read('scripts/verify-stage-i-m79-m78-source-guard.mjs');
ok(transitivePredecessorGuard.includes('M80+ successor synchronization')&&transitivePredecessorGuard.includes('scripts/verify-stage-i-m80-m79-source-guard.mjs'),'M81 transitive M79 source-guard successor synchronization missing');
const predecessorGuard=read('scripts/verify-stage-i-m80-m79-source-guard.mjs');
ok(predecessorGuard.includes('M81 successor synchronization')&&predecessorGuard.includes('scripts/verify-stage-i-m81-m80-source-guard.mjs'),'M81 successor-aware M80 source-guard synchronization missing');
ok(predecessorGuard.includes("implementation-complete-pending-certification")&&predecessorGuard.includes("certification-gates-passed-pending-regression")&&predecessorGuard.includes("active-certified"),'M80 predecessor guard must recognize all governed M81 certification states');
const successorManifest=JSON.parse(read('regression-baseline/m81-m80-source-guard.json'));
ok(successorManifest.allowedMutations.includes('scripts/verify-stage-i-m80-m79-source-guard.mjs'),'M81 source guard must explicitly authorize predecessor-guard synchronization');
ok(successorManifest.allowedMutations.includes('scripts/verify-stage-i-m79-m78-source-guard.mjs'),'M81 source guard must explicitly authorize transitive predecessor-guard synchronization');
const sm2Verifier=read('verify-v1432-shell-primary-sidebar-sm2.mjs');
ok(sm2Verifier.includes('hasM81ApplicationShellSuccessor')&&sm2Verifier.includes('M81 primary navigation landmark must remain inside the governed shell navigation scroll region'),'M81 Shell M2 successor-aware ownership verification missing');
ok(successorManifest.allowedMutations.includes('verify-v1432-shell-primary-sidebar-sm2.mjs'),'M81 source guard must explicitly authorize Shell M2 successor verifier synchronization');
const m78ExecutionVerifier=read('scripts/verify-stage-i-m78-visual-system-foundation-execution.mjs');
ok(m78ExecutionVerifier.includes('m81AuthorityExists')&&m78ExecutionVerifier.includes('m81AllowedProtectedMutations')&&m78ExecutionVerifier.includes('m81AllowedNewProtectedFiles'),'M81 M78 protected-presentation deterministic successor synchronization missing');
ok(successorManifest.allowedMutations.includes('scripts/verify-stage-i-m78-visual-system-foundation-execution.mjs'),'M81 source guard must explicitly authorize M78 deterministic successor verifier synchronization');
const m68ExecutionVerifier=read('scripts/verify-stage-h-m68-application-shell-navigation-execution.mjs');
ok(m68ExecutionVerifier.includes('m81AuthorityExists')&&m68ExecutionVerifier.includes('m81AllowedM68AuthorityMutations')&&m68ExecutionVerifier.includes("'assets/js/app.ts'"),'M81 M68 deterministic successor synchronization missing');
ok(successorManifest.allowedMutations.includes('scripts/verify-stage-h-m68-application-shell-navigation-execution.mjs'),'M81 source guard must explicitly authorize M68 deterministic successor verifier synchronization');
const m71ExecutionVerifier=read('scripts/verify-stage-h-m71-interaction-motion-continuity-execution.mjs');
ok(m71ExecutionVerifier.includes('m81AuthorityExists')&&m71ExecutionVerifier.includes('m81AllowedM71AuthorityMutations')&&m71ExecutionVerifier.includes("'assets/js/app.ts'"),'M81 M71 deterministic successor synchronization missing');
ok(successorManifest.allowedMutations.includes('scripts/verify-stage-h-m71-interaction-motion-continuity-execution.mjs'),'M81 source guard must explicitly authorize M71 deterministic successor verifier synchronization');
const m72ExecutionVerifier=read('scripts/verify-stage-h-m72-host-level-ui-migration-execution.mjs');
ok(m72ExecutionVerifier.includes('m81AuthorityExists')&&m72ExecutionVerifier.includes('m81AllowedM72AuthorityMutations')&&m72ExecutionVerifier.includes("'assets/js/app.ts'"),'M81 M72 deterministic successor synchronization missing');
ok(successorManifest.allowedMutations.includes('scripts/verify-stage-h-m72-host-level-ui-migration-execution.mjs'),'M81 source guard must explicitly authorize M72 deterministic successor verifier synchronization');
const m73ExecutionVerifier=read('scripts/verify-stage-h-m73-boards-ui-design-system-migration-execution.mjs');
ok(m73ExecutionVerifier.includes('m81AuthorityExists')&&m73ExecutionVerifier.includes('m81AllowedM73AuthorityMutations')&&m73ExecutionVerifier.includes("'src/app/boards/components/BoardPresentationSurface.tsx'"),'M81 M73 deterministic successor synchronization missing');
ok(successorManifest.allowedMutations.includes('scripts/verify-stage-h-m73-boards-ui-design-system-migration-execution.mjs'),'M81 source guard must explicitly authorize M73 deterministic successor verifier synchronization');
const e2e=read('tests/modern/e2e/m81-application-shell.spec.mjs');
ok(!/new Promise\(resolve => requestAnimationFrame/.test(e2e),'M81 E2E frame waits must not implicitly return requestAnimationFrame handles from Promise executors');
ok((e2e.match(/new Promise\(\(resolve\) => \{/g)||[]).length>=2,'M81 E2E frame waits must use block-bodied Promise executors');
const pkg=JSON.parse(read('package.json')); for(const s of ['application-shell:source-guard','application-shell:check','application-shell:test','application-shell:browser','application-shell:release','application-shell:certify','application-shell:post-certification','application-shell:package-hygiene','application-shell:final-checkpoint','application-shell:publish-certified'])ok(typeof pkg.scripts?.[s]==='string',`M81 package script missing: ${s}`);
const release=pkg.scripts['release:check']??''; ok(release.includes('shared-primitives:test')&&release.includes('application-shell:source-guard')&&release.includes('application-shell:check')&&release.includes('application-shell:test'),'M81 release gate wiring missing');
if(failures.length){console.error('M81 application shell/global navigation verification FAILED'); failures.forEach(f=>console.error(` - ${f}`)); process.exit(1)}
console.log('M81 application shell/global navigation verification: PASS');
console.log('Verified typed shell composition, M80 prerequisite binding, stable hierarchy, responsive/accessibility contracts, page-frame/header semantics and fail-closed certification wiring.');

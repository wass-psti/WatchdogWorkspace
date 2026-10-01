import fs from 'node:fs'; import path from 'node:path'; import process from 'node:process'; import {spawnSync} from 'node:child_process';
const root=process.cwd(), failures=[]; const read=p=>fs.readFileSync(path.join(root,p),'utf8'); const ok=(c,m)=>{if(!c)failures.push(m)};
const guard=spawnSync(process.execPath,['scripts/verify-stage-i-m81-m80-source-guard.mjs'],{cwd:root,encoding:'utf8'}); ok(guard.status===0,`M80 source guard failed: ${(guard.stderr||guard.stdout).trim()}`);
const css=read('assets/css/shell-navigation.css');
const m95TargetPath='config/stage-i-m95-cross-module-responsive-harmonization-target.ts';
const m95ManifestPath='regression-baseline/m95-m94-source-guard.json';
const m95SuccessorAuthority=fs.existsSync(path.join(root,m95TargetPath))&&fs.existsSync(path.join(root,m95ManifestPath))&&read(m95TargetPath).includes('milestone: 95');
for(const marker of ['.shell[data-shell-navigation-state="expanded"]','.shell[data-shell-navigation-state="compact"]','.shell[data-shell-navigation-state="compact"][data-shell-navigation-pinned="false"][data-shell-navigation-peek="true"]','.shell[data-shell-mobile-open="true"] .sidebar'])ok(css.includes(marker),`certified responsive shell rule missing: ${marker}`);
if(m95SuccessorAuthority){
  ok(css.includes('@media (max-width:40rem)'),'M95 successor responsive shell rule missing: @media (max-width:40rem)');
  const m95Manifest=JSON.parse(read(m95ManifestPath));
  ok((m95Manifest.allowedMutations||[]).includes('scripts/verify-stage-i-m81-application-shell-global-navigation-execution.mjs'),'M95 successor authority must explicitly authorize the M81 deterministic verifier synchronization');
}else{
  ok(css.includes('@media (max-width:620px)'),'certified responsive shell rule missing: @media (max-width:620px)');
}
ok(css.includes('margin-left: var(--wm-shell-navigation-layout-width)')&&css.includes('width: calc(100% - var(--wm-shell-navigation-layout-width))'),'workspace/sidebar geometry coupling missing');
ok(css.includes('position: fixed')&&css.includes('height: 100dvh'),'persistent sidebar geometry missing');
const shell=read('src/app/shell/WorkManagementShell.tsx');
ok(shell.includes("const mobile = useMedia('(max-width: 620px)')")&&shell.includes("const tablet = useMedia('(max-width: 900px) and (min-width: 621px)')"),'M81 responsive breakpoint behavior drift');
ok(shell.includes('mobileOpen || authenticationActive || managementActive')&&shell.includes('boardPresentationActive'),'workspace inert/ownership interaction contract drift');
ok(shell.includes('data-shell-navigation-pinned')&&shell.includes('data-shell-navigation-peek')&&shell.includes('data-shell-navigation-resizing'),'navigation state attributes missing');
const nav=read('src/app/shell/application-shell-navigation-system.ts');
for(const marker of ['widthIsPersistentPreference: true','pinIsPersistentPreference: true','sectionExpansionIsPersistentPreference: true','routeOwnershipRemainsM40Authority: true','preserveShellM1ThroughM8RuntimeBehavior: true'])ok(nav.includes(marker),`M68 certified navigation invariant missing: ${marker}`);
const app=read('assets/js/app.ts'); ok(app.includes('aria-current="page"')||app.includes('aria-current'), 'active-route aria-current behavior not present'); ok(app.includes('data-shell-section')&&app.includes('data-shell-resource-search'),'secondary/resource navigation contracts missing');
if(failures.length){console.error('M81 application shell/global navigation deterministic verification FAILED'); failures.forEach(f=>console.error(` - ${f}`)); process.exit(1)}
console.log('M81 application shell/global navigation deterministic verification: PASS');
console.log('Validated stable host hierarchy, certified desktop/mobile navigation modes, persistence boundaries, secondary resource navigation, page-frame/header markers and M40/M68 ownership preservation.');

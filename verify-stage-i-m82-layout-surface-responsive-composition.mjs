import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const root=process.cwd(), failures=[];
const read=(p)=>fs.readFileSync(path.join(root,p),'utf8');
const ok=(condition,message)=>{if(!condition)failures.push(message)};
const target=read('config/stage-i-m82-layout-surface-responsive-composition-target.ts');
ok(target.includes("certifiedZipSha256: '3002a9f0c3c0317bb985a157c76bfa3f42674f4e1023d27faeb5ee92fb26c2cb'"),'M82 lost M81 certified ZIP binding');
ok(target.includes("certifiedSourceSha256: '6e592a683159119860a7b131d06652e9608d8938b4be6067c6a34d23a5bf6f49'"),'M82 lost M81 certified source binding');
const system=read('src/design-system/layout-composition-system.ts');
for(const marker of ['page-layout','content-container','section-layout','surface-section','responsive-grid','responsive-cluster','layout-stack','mobile','tablet','desktop','noNewGlobalCssPayloadRequired: true'])ok(system.includes(marker),`M82 layout-composition system missing: ${marker}`);
for(const owner of ["spatialTokens: 'M61'","breakpointsAndMediaBehavior: 'M62'","semanticThemeTokens: 'M79'","sharedPrimitives: 'M80'","applicationShell: 'M81'"])ok(system.includes(owner),`M82 ownership boundary missing: ${owner}`);
const tokenArchitecture=read('assets/css/foundation/token-architecture.css');
const tokenReferences=read('src/design-system/tokens.ts');
for(const density of ['space-compact','space-default','space-comfortable','control-compact','control-default','control-comfortable']){
  const semantic=`--wm-semantic-density-${density}`;
  ok(tokenArchitecture.includes(`${semantic}: var(--wm-density-${density});`),`M82 semantic density alias missing or misbound: ${semantic}`);
  ok(tokenReferences.includes(`var(${semantic})`),`M82 product token reference missing semantic density alias: ${semantic}`);
}
const responsiveCss=read('assets/css/foundation/responsive-system.css');
for(const breakpoint of ['wide','laptop','tablet','narrow']){
  ok(responsiveCss.includes(`.wm-grid[data-collapse-at=\"${breakpoint}\"] { grid-template-columns:minmax(0,1fr); }`),`M82 adaptive grid cascade authority missing: ${breakpoint}`);
  ok(responsiveCss.includes(`.wm-cluster[data-stack-at=\"${breakpoint}\"] { flex-direction:column; align-items:stretch; }`),`M82 adaptive cluster cascade authority missing: ${breakpoint}`);
  ok(!responsiveCss.includes(`:where(.wm-grid[data-collapse-at=\"${breakpoint}\"])`),`M82 adaptive grid selector regressed to zero specificity: ${breakpoint}`);
  ok(!responsiveCss.includes(`:where(.wm-cluster[data-stack-at=\"${breakpoint}\"])`),`M82 adaptive cluster selector regressed to zero specificity: ${breakpoint}`);
}
const composition=read('src/design-system/layout-composition/index.tsx');
for(const primitive of ['WMPageLayout','WMContentContainer','WMSectionLayout','WMSurfaceSection','WMResponsiveGrid','WMResponsiveCluster','WMLayoutStack'])ok(composition.includes(`function ${primitive}`),`M82 public primitive missing: ${primitive}`);
for(const certified of ['WMPage','WMContainer','WMSection','WMGrid','WMCluster','WMStack','WMSurface'])ok(composition.includes(certified),`M82 does not compose certified primitive: ${certified}`);
for(const profile of ["split: Object.freeze({ columns: 2, collapseAt: 'tablet' })","dashboard: Object.freeze({ columns: 3, collapseAt: 'tablet' })","wideDashboard: Object.freeze({ columns: 3, collapseAt: 'laptop' })","mobileStack: Object.freeze({ stackAt: 'narrow' })","tabletStack: Object.freeze({ stackAt: 'tablet' })"])ok(composition.includes(profile),`M82 responsive profile missing: ${profile}`);
for(const density of ['--wm-density-space-compact','--wm-density-space-comfortable'])ok(composition.includes(density),`M82 density token missing: ${density}`);
ok(!system.includes('collapseAt: undefined')&&!system.includes('stackAt: undefined'),'M82 profile authority must model optional responsive behavior by property absence, not explicit undefined');
ok(composition.includes("const collapseProps = 'collapseAt' in definition ? { collapseAt: definition.collapseAt } : {};"),'M82 responsive grid must omit collapseAt when the selected profile has no collapse breakpoint');
ok(composition.includes("const stackProps = 'stackAt' in definition ? { stackAt: definition.stackAt } : {};"),'M82 responsive cluster must omit stackAt when the selected profile has no stack breakpoint');
ok(composition.includes("if (density === 'inherit') return style"),'M82 inherit density must preserve workspace preference');
const rootIndex=read('src/design-system/index.ts');ok(rootIndex.includes('workManagementLayoutCompositionSystem')&&rootIndex.includes('WMResponsiveGrid')&&rootIndex.includes('WMSurfaceSection'),'M82 root design-system API missing');
const cssFiles=[]; const scan=(d)=>{for(const e of fs.readdirSync(path.join(root,d),{withFileTypes:true})){const rel=path.posix.join(d,e.name);if(e.isDirectory())scan(rel);else if(e.isFile()&&/m82/i.test(e.name)&&e.name.endsWith('.css'))cssFiles.push(rel)}};scan('assets/css');ok(cssFiles.length===0,'M82 must not add a new global CSS payload');
const m81Guard=read('scripts/verify-stage-i-m81-m80-source-guard.mjs');ok(m81Guard.includes('M82 successor synchronization')&&m81Guard.includes('scripts/verify-stage-i-m82-m81-source-guard.mjs'),'M82 successor-aware M81 source-guard synchronization missing');
const m78=read('scripts/verify-stage-i-m78-visual-system-foundation-execution.mjs');ok(m78.includes('m82AuthorityExists')&&m78.includes('m82AllowedNewProtectedFiles')&&m78.includes('src/design-system/layout-composition/index.tsx'),'M82 M78 protected-presentation successor synchronization missing');
const successorResponsiveGuards=[
  ['scripts/verify-stage-h-m63-accessibility-foundation-execution.mjs','M63'],
  ['scripts/verify-stage-h-m64-core-component-system-execution.mjs','M64'],
  ['scripts/verify-stage-h-m69-data-presentation-dense-ui-execution.mjs','M69'],
];
for(const [rel,label] of successorResponsiveGuards){const guard=read(rel);ok(guard.includes('m82AuthorityExists')&&guard.includes('assets/css/foundation/responsive-system.css'),`M82 ${label} historical responsive-authority successor synchronization missing`);}
const manifest=JSON.parse(read('regression-baseline/m82-m81-source-guard.json'));ok(manifest.allowedMutations.includes('scripts/verify-stage-i-m81-m80-source-guard.mjs'),'M82 source guard must authorize M81 predecessor-guard synchronization');ok(manifest.allowedMutations.includes('scripts/verify-stage-i-m78-visual-system-foundation-execution.mjs'),'M82 source guard must authorize M78 successor synchronization');ok(manifest.allowedMutations.includes('assets/css/foundation/token-architecture.css'),'M82 source guard must authorize semantic density contract correction');ok(manifest.allowedMutations.includes('assets/css/foundation/responsive-system.css'),'M82 source guard must authorize responsive cascade correction');for(const [rel,label] of successorResponsiveGuards)ok(manifest.allowedMutations.includes(rel),`M82 source guard must authorize ${label} successor synchronization`);
const continuation=read('M82-CONTINUATION-STATE.md');
ok(continuation.includes('**State:** IMPLEMENTATION COMPLETE — LOCAL VERIFICATION/CERTIFICATION REMAINS')||continuation.includes('**State:** FULLY COMPLETE — IMPLEMENTATION AND REQUIRED VERIFICATION COMPLETE'),'M82 continuation must use the canonical **State:** field');
ok(!/^\*\*Authoritative state:\*\*/m.test(continuation),'M82 continuation must not use the noncanonical **Authoritative state:** field');
const hygieneScript=read('scripts/verify-stage-i-m82-certified-package-hygiene.mjs');
ok(hygieneScript.includes('--prepublish')&&hygieneScript.includes('temporary candidate only'),'M82 package hygiene must support a non-certified prepublication candidate');
const publishScript=read('scripts/publish-stage-i-m82-certified-artifact.sh');
ok(publishScript.includes('npm run layout-composition:final-checkpoint')&&publishScript.indexOf('npm run layout-composition:final-checkpoint')<publishScript.indexOf("activationState: 'active-certified'"),'M82 certified publication must be gated by final checkpoint before active-certified promotion');
const pkg=JSON.parse(read('package.json'));for(const s of ['layout-composition:source-guard','layout-composition:check','layout-composition:test','layout-composition:browser','layout-composition:release','layout-composition:certify','layout-composition:post-certification','layout-composition:package-hygiene','layout-composition:final-checkpoint','layout-composition:publish-certified'])ok(typeof pkg.scripts?.[s]==='string',`M82 package script missing: ${s}`);
const release=pkg.scripts['release:check']??'';ok(release.includes('application-shell:test')&&release.includes('layout-composition:source-guard')&&release.includes('layout-composition:check')&&release.includes('layout-composition:test'),'M82 release gate wiring missing');
if(failures.length){console.error('M82 layout/surface/responsive composition verification FAILED');failures.forEach(f=>console.error(` - ${f}`));process.exit(1)}
console.log('M82 layout/surface/responsive composition verification: PASS');
console.log('Verified M81 prerequisite binding, composition API, M61/M62/M79/M80/M81 ownership, responsive profiles, density behavior, zero-new-CSS policy and fail-closed certification wiring.');

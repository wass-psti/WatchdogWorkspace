import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
const root=process.cwd(), failures=[]; const ok=(c,m)=>{if(!c)failures.push(m)}; const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const required=[
  'src/design-system/shared-primitive-system.ts','src/design-system/shared-primitives/index.ts','src/design-system/shared-primitives/shared.ts',
  'src/design-system/shared-primitives/search.tsx','src/design-system/shared-primitives/selector.tsx','src/design-system/shared-primitives/filter.tsx',
  'src/design-system/shared-primitives/card.tsx','src/design-system/shared-primitives/alert.tsx','src/design-system/shared-primitives/segmented-control.tsx',
  'config/stage-i-m80-shared-primitive-component-layer-target.ts','architecture/ui-governance/futuristic-minimalist-shared-primitive-layer.md',
  'M80-SHARED-PRIMITIVE-COMPONENT-LAYER.md','M80-CONTINUATION-STATE.md','M80-CERTIFICATION-HANDOFF.md','M80-CORRECTIVE-LOOP-SEGMENTED-CONTROL-STRICT-INDEX-SAFETY-2026-09-29.md',
  'RELEASE-STATUS-v1.43.2-STAGE-I-M80-SHARED-PRIMITIVE-COMPONENT-LAYER.md','tests/modern/component/m80-shared-primitives.test.mjs',
  'tests/modern/e2e/m80-shared-primitives.spec.mjs','scripts/run-stage-i-m80-shared-primitives-browser.mjs',
  'scripts/verify-stage-i-m80-m79-source-guard.mjs','regression-baseline/m80-m79-source-guard.json','scripts/lib/stage-i-m80-checkpoint-tree.mjs',
  'scripts/verify-stage-i-m80-release.sh','scripts/finalize-stage-i-m80.sh','scripts/verify-stage-i-m80-post-certification-state.mjs',
  'scripts/publish-stage-i-m80-certified-artifact.sh','scripts/verify-stage-i-m80-certified-state.mjs','scripts/verify-stage-i-m80-certified-artifact.mjs',
  'scripts/verify-stage-i-m80-certified-package-hygiene.mjs','scripts/verify-stage-i-m80-final-checkpoint.mjs',
];
for(const f of required)ok(fs.existsSync(path.join(root,f)),`missing M80 artifact: ${f}`);
const target=read('config/stage-i-m80-shared-primitive-component-layer-target.ts');
for(const marker of ["milestone: 80","certifiedZipSha256: '42f6e572830916fd4a5c00af9030b296c9b2e64176fa7a16bf9b9c520b28ec58'","certifiedSourceSha256: 'ca31475242a58595373ca65a6305c6aa79396cd2b6ea089bb1f5dd8005b56d5c'","noDatabaseSchemaMutation: true","noAuthenticationAuthorizationMutation: true"])ok(target.includes(marker),`M80 target contract missing: ${marker}`);
const registry=read('src/design-system/shared-primitive-system.ts');
for(const marker of ['button','icon-button','input','selector','search-input','filter-bar','filter-chip','badge','icon','alert','checkbox','switch','segmented-control','tooltip','menu','popover','card','noConsumerMigrationRequiredInM80: true'])ok(registry.includes(`'${marker}'`)||registry.includes(marker),`M80 registry missing: ${marker}`);
const pub=read('src/design-system/shared-primitives/index.ts');
for(const name of ['WMButton','WMIconButton','WMInput','WMSelector','WMSearchInput','WMFilterBar','WMFilterChip','WMBadge','WMIcon','WMAlert','WMCheckbox','WMSwitch','WMSegmentedControl','WMTooltip','WMMenu','WMPopover','WMCard'])ok(pub.includes(name),`M80 public API missing: ${name}`);
const search=read('src/design-system/shared-primitives/search.tsx'); ok(search.includes('type="search"')&&search.includes('aria-label={label}'),'M80 search accessible native contract missing');
const selector=read('src/design-system/shared-primitives/selector.tsx'); ok(selector.includes('WMNativeSelect'),'M80 selector must preserve native select semantics');
const filter=read('src/design-system/shared-primitives/filter.tsx'); ok(filter.includes('aria-pressed={selected}')&&filter.includes('role="region"'),'M80 filter semantics missing');
const segmented=read('src/design-system/shared-primitives/segmented-control.tsx'); for(const m of ['aria-pressed','ArrowRight','ArrowLeft','Home','End','role="group"','focusEnabledPosition','targetIndex === undefined'])ok(segmented.includes(m),`M80 segmented-control interaction missing: ${m}`); ok(!segmented.includes('enabledIndexes.at(-1)!'),'M80 segmented-control must not use unsafe non-null indexed navigation');
const rootIndex=read('src/design-system/index.ts'); for(const name of ['WMAlert','WMCard','WMFilterBar','WMFilterChip','WMSearchInput','WMSelector','WMSegmentedControl'])ok(rootIndex.includes(name),`M80 root public API missing: ${name}`); ok(rootIndex.includes('workManagementSharedPrimitiveSystem'),'M80 registry not exported from root index');
const cssBefore=fs.statSync(path.join(root,'assets/css/foundation/components.css')).size+fs.statSync(path.join(root,'assets/css/foundation/interactions.css')).size; ok(cssBefore>0,'M80 certified presentation authorities missing');
const pkg=JSON.parse(read('package.json')); for(const s of ['shared-primitives:check','shared-primitives:test','shared-primitives:browser','shared-primitives:release','shared-primitives:certify','shared-primitives:post-certification','shared-primitives:package-hygiene','shared-primitives:final-checkpoint'])ok(typeof pkg.scripts?.[s]==='string',`M80 package script missing: ${s}`);
const release=pkg.scripts['release:check'] ?? ''; ok(release.indexOf('token-theme:test') < release.indexOf('shared-primitives:source-guard'),'M80 release order must follow M79 token/theme verification'); ok(release.indexOf('shared-primitives:check') < release.indexOf('shared-primitives:test'),'M80 static gate must precede deterministic gate');
if(failures.length){console.error('M80 shared primitive component layer verification FAILED');failures.forEach(f=>console.error(` - ${f}`));process.exit(1)}
console.log('M80 shared primitive component layer verification: PASS');
console.log('Verified canonical primitive inventory, M79 prerequisite binding, public API composition, accessibility contracts, interaction-state ownership and certification wiring.');

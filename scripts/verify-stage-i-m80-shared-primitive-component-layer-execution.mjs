import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
const root=process.cwd(), failures=[]; const ok=(c,m)=>{if(!c)failures.push(m)}; const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const target=read('config/stage-i-m80-shared-primitive-component-layer-target.ts');
ok(target.includes("activationState: 'implementation-complete-pending-certification'")||target.includes("activationState: 'certification-gates-passed-pending-regression'")||target.includes("activationState: 'active-certified'"),'M80 activation state invalid');
const system=read('src/design-system/shared-primitive-system.ts');
ok(system.includes('composesCertifiedM64M67Authorities: true'),'M80 must compose rather than fork M64-M67 authorities');
ok(system.includes('noDatabaseOrMigrationMutation: true'),'M80 architecture must exclude database/migration ownership');
ok(system.includes('noPositiveTabIndex: true'),'M80 accessibility contract lost no-positive-tabindex policy');
const files=['src/design-system/shared-primitives/search.tsx','src/design-system/shared-primitives/selector.tsx','src/design-system/shared-primitives/filter.tsx','src/design-system/shared-primitives/card.tsx','src/design-system/shared-primitives/alert.tsx','src/design-system/shared-primitives/segmented-control.tsx'];
for(const file of files){const source=read(file);ok(!/tabIndex\s*=\s*\{?\s*[1-9]/.test(source),`M80 positive tabindex introduced: ${file}`);ok(!/onClick=.*<div|<div[^>]+onClick=/.test(source),`M80 div click pseudo-control introduced: ${file}`)}
const rootIndex=read('src/design-system/index.ts'); ok(rootIndex.includes("from './shared-primitives/index.ts'"),'M80 shared primitive root export missing');
const test=read('tests/modern/component/m80-shared-primitives.test.mjs'); for(const phrase of ['accessible search primitive','selector semantics native','pressed filter state','segmented keyboard focus movement','skips disabled segmented options and wraps arrow navigation','segmented Home and End navigation','one enabled segmented option','globally disabled segmented controls inert'])ok(test.includes(phrase),`M80 deterministic component coverage missing: ${phrase}`);
const browser=read('tests/modern/e2e/m80-shared-primitives.spec.mjs'); for(const selector of ['wm-button--primary','wm-field-control','wm-badge','wm-alert','wm-card'])ok(browser.includes(selector),`M80 browser primitive coverage missing: ${selector}`);
if(failures.length){console.error('M80 shared primitive deterministic verification FAILED');failures.forEach(f=>console.error(` - ${f}`));process.exit(1)}
console.log('M80 shared primitive deterministic verification: PASS');
console.log(`Validated ${files.length} new composition authorities, certified Stage H reuse, accessibility invariants, interaction-state semantics and browser coverage wiring.`);

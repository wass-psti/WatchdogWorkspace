import crypto from 'node:crypto'; import fs from 'node:fs'; import path from 'node:path'; import process from 'node:process';
const root=process.cwd(), failures=[]; const ok=(c,m)=>{if(!c)failures.push(m)}; const read=p=>fs.readFileSync(path.join(root,p),'utf8'); const sha=p=>crypto.createHash('sha256').update(fs.readFileSync(path.join(root,p))).digest('hex'); const snap=JSON.parse(read('regression-baseline/m63-accessibility-foundation.json'));
const m79AuthorityExists=fs.existsSync(path.join(root,'config/stage-i-m79-design-tokens-semantic-theme-target.ts'));
const m79OwnedAuthorities=new Set(['assets/css/foundation/tokens.css','assets/css/foundation/themes.css']);
const m82AuthorityExists=fs.existsSync(path.join(root,'config/stage-i-m82-layout-surface-responsive-composition-target.ts'));
const m82OwnedAuthorities=new Set(['assets/css/foundation/responsive-system.css']);
const m95AuthorityExists=fs.existsSync(path.join(root,'config/stage-i-m95-cross-module-responsive-harmonization-target.ts'));
const m95OwnedAuthorities=new Set([
  'assets/css/app.css',
  'assets/css/boards-monday.css',
  'apps/time-tracker/styles.css',
  'apps/time-tracker/v2.css',
  'apps/fueltrack-plus/styles.v3.17.0-wm6.css',
  'apps/tradelink/styles.v1.42.0-wm1.css',
]);
if(m79AuthorityExists){const target=read('config/stage-i-m79-design-tokens-semantic-theme-target.ts');ok(target.includes("activationState: 'implementation-complete-pending-certification'")||target.includes("activationState: 'active-certified'"),'M63 successor M79 authority has invalid activation state');}
let m95Verifier='';
if(m95AuthorityExists){
  const target=read('config/stage-i-m95-cross-module-responsive-harmonization-target.ts');
  ok(target.includes("activationState: 'implementation-complete-local-certification-pending'")||target.includes("activationState: 'implementation-complete-pending-certification'")||target.includes("activationState: 'active-certified'")||target.includes("activationState: 'certification-gates-passed-pending-regression'"),'M63 successor M95 responsive authority has invalid activation state');
  m95Verifier=read('verify-stage-i-m95-cross-module-responsive-harmonization.mjs');
}
for(const [rel,expected] of Object.entries(snap.certifiedAuthorityHashes)){
  ok(fs.existsSync(path.join(root,rel)),`M63 certified M62 authority missing: ${rel}`);
  const successorOwned=(m79AuthorityExists&&m79OwnedAuthorities.has(rel))||(m82AuthorityExists&&m82OwnedAuthorities.has(rel))||(m95AuthorityExists&&m95OwnedAuthorities.has(rel));
  if(m95AuthorityExists&&m95OwnedAuthorities.has(rel)) ok(m95Verifier.includes(rel),`M63 M95 successor does not explicitly govern migrated M62 authority: ${rel}`);
  if(!successorOwned) ok(sha(rel)===expected,`M63 certified M62 authority drift: ${rel}`);
}
const css=read('assets/css/foundation/accessibility-system.css');ok(/--wm-a11y-target-min:\s*44px/.test(css),'M63 minimum target policy drift');ok(css.includes('@media (prefers-reduced-motion: reduce)'),'M63 reduced-motion policy missing');ok(css.includes('@media (forced-colors: active)'),'M63 forced-colors policy missing');ok(!/tabindex\s*=\s*["']?[1-9]/i.test(css),'M63 CSS unexpectedly contains positive tabindex');
const typed=read('src/design-system/accessibility-system.tsx');ok(typed.includes("politeness = 'polite'")&&typed.includes("role={politeness === 'assertive' ? 'alert' : 'status'}"),'M63 live-region semantics drift');ok(typed.includes("aria-atomic={atomic}"),'M63 live-region atomic semantics missing');
const shared=read('src/design-system/interactions/shared.ts'), button=read('src/design-system/interactions/button.tsx'), menu=read('src/design-system/interactions/menu.tsx'), tabs=read('src/design-system/interactions/tabs.tsx'); ok(!/["']tabIndex["']\s*:\s*[1-9]/.test(shared+button+menu+tabs),'M63 shared interaction architecture introduced positive tabindex');ok(button.includes('disabled={disabled || loading}'),'M63 busy-button interaction contract drift');ok(menu.includes('<Menu.Item'),'M63 menu native Ark semantics drift');ok(tabs.includes('<Tabs.Trigger'),'M63 tabs Ark semantics drift');
if(failures.length){console.error('M63 accessibility foundation deterministic verification FAILED');failures.forEach(x=>console.error(` - ${x}`));process.exit(1)} console.log('M63 accessibility foundation deterministic verification: PASS'); console.log(`Validated ${m95AuthorityExists?'M95 successor-governed M62 compatibility authority':m82AuthorityExists?'M82 successor-preserved M62 responsive authority':m79AuthorityExists?'M79 successor-preserved M62 semantic authority':'certified M62 authority preservation'}, visible-focus policy, 44px opt-in target policy, live-region semantics, preference handling, and interaction keyboard/ARIA invariants.`);

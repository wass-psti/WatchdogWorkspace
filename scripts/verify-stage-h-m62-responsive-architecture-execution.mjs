import crypto from 'node:crypto'; import fs from 'node:fs'; import path from 'node:path'; import process from 'node:process';
const root=process.cwd(), failures=[]; const ok=(c,m)=>{if(!c)failures.push(m)}; const read=p=>fs.readFileSync(path.join(root,p),'utf8'); const sha=p=>crypto.createHash('sha256').update(fs.readFileSync(path.join(root,p))).digest('hex'); const snap=JSON.parse(read('regression-baseline/m62-responsive-architecture.json'));
const m79AuthorityExists=fs.existsSync(path.join(root,'config/stage-i-m79-design-tokens-semantic-theme-target.ts'));
if(m79AuthorityExists){
  const target=read('config/stage-i-m79-design-tokens-semantic-theme-target.ts');
  ok(target.includes("activationState: 'implementation-complete-pending-certification'")||target.includes("activationState: 'active-certified'"),'M62 successor M79 authority has invalid activation state');
  for(const [rel,key] of [['assets/css/foundation/typography-system.css','typographySystemCss'],['assets/css/foundation/layout-system.css','layoutSystemCss']])ok(sha(rel)===snap.certifiedAuthorities[key].sha256,`M62 immutable M61 authority drift under M79: ${rel}`);
}else{
  for(const [rel,key] of [['assets/css/foundation/tokens.css','tokensCss'],['assets/css/foundation/token-architecture.css','tokenArchitectureCss'],['assets/css/foundation/typography-system.css','typographySystemCss'],['assets/css/foundation/themes.css','themesCss'],['assets/css/foundation/layout-system.css','layoutSystemCss'],['src/design-system/foundation.ts','foundationTs']])ok(sha(rel)===snap.certifiedAuthorities[key].sha256,`M62 certified M61 authority drift: ${rel}`);
}
const token=read('assets/css/foundation/tokens.css'); const typed=read('src/design-system/foundation.ts'); const responsive=read('src/design-system/responsive-system.ts'); const expected={narrow:[640,'40rem'],tablet:[840,'52.5rem'],laptop:[1120,'70rem'],wide:[1440,'90rem']};for(const [name,[px,rem]] of Object.entries(expected)){ok(new RegExp(`--wm-breakpoint-${name}:\\s*${px}px`).test(token),`M62 CSS token drift: ${name}`);ok(new RegExp(`${name}:\\s*'${rem}'`).test(typed),`M62 typed foundation breakpoint drift: ${name}`);ok(new RegExp(`${name}: Object\\.freeze\\(\\{ px: ${px}, rem:`).test(responsive),`M62 responsive typed contract drift: ${name}`)}
const css=read('assets/css/foundation/responsive-system.css');ok(!/@media\s*\([^)]*px\)/.test(css),'M62 shared responsive queries must use rem units');for(const rem of ['40rem','52.5rem','70rem','90rem'])ok(css.includes(`@media (max-width: ${rem})`),`M62 media query missing: ${rem}`);ok(!css.includes('display:none')&&!css.includes('visibility:hidden'),'M62 shared authority hides content implicitly');
const primCss=read('assets/css/foundation/primitives.css');ok(!primCss.includes('@media (max-width: 840px)'),'M61 primitive stylesheet still owns pre-M62 tablet page query');ok(css.includes(':where(.wm-page) { padding-inline:var(--wm-layout-min-inline-gutter); }'),'M62 failed to preserve shared page gutter behavior');
const layout=read('src/design-system/primitives/layout.tsx');ok(layout.includes("gap = 'standard', collapseAt")&&layout.includes('data-collapse-at={collapseAt}'),'M62 WMGrid default or collapse attribute drift');ok(layout.includes("gap = 'compact', stackAt")&&layout.includes('data-stack-at={stackAt}'),'M62 WMCluster default or stack attribute drift');
const m95AuthorityExists=fs.existsSync(path.join(root,'config/stage-i-m95-cross-module-responsive-harmonization-target.ts'));
if(m95AuthorityExists){
  const m95Target=read('config/stage-i-m95-cross-module-responsive-harmonization-target.ts');
  const m95Verifier=read('verify-stage-i-m95-cross-module-responsive-harmonization.mjs');
  ok(["activationState: 'implementation-complete-local-certification-pending'","activationState: 'certification-gates-passed-pending-regression'","activationState: 'active-certified'"].some(state=>m95Target.includes(state)),'M62 successor M95 authority has invalid activation state');
  for(const rel of snap.compatibilityAuthorities){
    ok(fs.existsSync(path.join(root,rel)),`M62 migrated compatibility authority missing under M95: ${rel}`);
    ok(m95Verifier.includes(`'${rel}'`),`M62 compatibility authority is not governed by M95 staged migration: ${rel}`);
  }
}else{
  for(const rel of snap.compatibilityAuthorities){ok(fs.existsSync(path.join(root,rel)),`M62 compatibility authority missing: ${rel}`);ok(sha(rel)===snap.compatibilityAuthorityHashes[rel],`M62 compatibility authority changed before staged migration: ${rel}`);}
}
const pkg=JSON.parse(read('package.json'));ok(pkg.scripts['release:check'].includes('verify:ui'),'M62 release must retain UI regression suite');if(failures.length){console.error('M62 responsive architecture deterministic verification FAILED');failures.forEach(x=>console.error(` - ${x}`));process.exit(1)}console.log('M62 responsive architecture deterministic verification: PASS');console.log(`Validated four certified breakpoints, rem-based shared queries, opt-in grid/cluster adaptation, preserved page-gutter geometry, ${m79AuthorityExists?'M79 successor-preserved M61 semantic authority':'certified M61 authority preservation'}, and ${m95AuthorityExists?'M95-governed staged migration of compatibility authorities':'retained pre-migration compatibility boundaries'}.`);

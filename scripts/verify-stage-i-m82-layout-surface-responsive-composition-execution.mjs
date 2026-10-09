import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { spawnSync } from 'node:child_process';
const root=process.cwd(), failures=[]; const read=p=>fs.readFileSync(path.join(root,p),'utf8'); const ok=(c,m)=>{if(!c)failures.push(m)};
const guard=spawnSync(process.execPath,['scripts/verify-m108-login-successor.mjs'],{cwd:root,encoding:'utf8'});ok(guard.status===0,`M81 source guard failed: ${(guard.stderr||guard.stdout).trim()}`);
const layoutCss=read('assets/css/foundation/primitives.css'), responsiveCss=read('assets/css/foundation/responsive-system.css');
for(const marker of [':where(.wm-page)',':where(.wm-container)',':where(.wm-section)',':where(.wm-grid)',':where(.wm-cluster)',':where(.wm-stack)',':where(.wm-surface)'])ok(layoutCss.includes(marker),`M82 certified primitive CSS missing: ${marker}`);
for(const marker of ['@media (max-width: 40rem)','@media (max-width: 52.5rem)','@media (max-width: 70rem)',".wm-grid[data-collapse-at=\"tablet\"]",".wm-cluster[data-stack-at=\"narrow\"]"])ok(responsiveCss.includes(marker),`M82 certified responsive rule missing: ${marker}`);
for(const breakpoint of ['wide','laptop','tablet','narrow']){
  ok(responsiveCss.includes(`.wm-grid[data-collapse-at=\"${breakpoint}\"] { grid-template-columns:minmax(0,1fr); }`),`M82 grid cascade authority missing: ${breakpoint}`);
  ok(responsiveCss.includes(`.wm-cluster[data-stack-at=\"${breakpoint}\"] { flex-direction:column; align-items:stretch; }`),`M82 cluster cascade authority missing: ${breakpoint}`);
  ok(!responsiveCss.includes(`:where(.wm-grid[data-collapse-at=\"${breakpoint}\"])`),`M82 grid adaptive selector must not use zero-specificity :where(): ${breakpoint}`);
  ok(!responsiveCss.includes(`:where(.wm-cluster[data-stack-at=\"${breakpoint}\"])`),`M82 cluster adaptive selector must not use zero-specificity :where(): ${breakpoint}`);
}
const mainCssOrder=read('src/main.ts');
const responsiveIndex=mainCssOrder.indexOf("responsive-system.css"), primitivesIndex=mainCssOrder.indexOf("primitives.css");
ok(responsiveIndex>=0&&primitivesIndex>responsiveIndex,'M82 expected responsive-system.css to precede primitives.css');
ok(layoutCss.includes(':where(.wm-grid[data-columns="3"])'),'M82 primitive grid baseline must remain zero-specificity so adaptive authority can override it');
const tokens=read('assets/css/foundation/tokens.css');for(const t of ['--wm-density-space-compact','--wm-density-space-default','--wm-density-space-comfortable','--wm-density-control-compact','--wm-density-control-default','--wm-density-control-comfortable'])ok(tokens.includes(t),`M82 primitive density token missing: ${t}`);
const tokenArchitecture=read('assets/css/foundation/token-architecture.css');
const tokenReferences=read('src/design-system/tokens.ts');
for(const density of ['space-compact','space-default','space-comfortable','control-compact','control-default','control-comfortable']){const semantic=`--wm-semantic-density-${density}`;ok(tokenArchitecture.includes(`${semantic}: var(--wm-density-${density});`),`M82 semantic density alias missing or misbound: ${semantic}`);ok(tokenReferences.includes(`var(${semantic})`),`M82 semantic density reference drift: ${semantic}`)};
const composition=read('src/design-system/layout-composition/index.tsx');
ok(composition.includes("profile = 'split'")&&composition.includes("profile = 'mobileStack'"),'M82 safe default responsive profiles drift');
ok(composition.includes("density = 'inherit'")&&composition.includes("if (density === 'inherit') return style"),'M82 inherited density behavior drift');
ok(!composition.includes('window.matchMedia')&&!composition.includes('resize'), 'M82 composition layer must not take viewport runtime ownership');
const system=read('src/design-system/layout-composition-system.ts');ok(system.includes('adaptationIsExplicit: true')&&system.includes('noImplicitContentHiding: true'),'M82 responsive policy drift');
if(failures.length){console.error('M82 layout/surface/responsive composition deterministic verification FAILED');failures.forEach(f=>console.error(` - ${f}`));process.exit(1)}
console.log('M82 layout/surface/responsive composition deterministic verification: PASS');
console.log('Validated certified layout/surface primitives, M62 desktop/tablet/mobile adaptation, explicit responsive profiles, semantic density overrides, inherited workspace density and ownership boundaries.');

import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const root = process.cwd();
const failures = [];
const ok = (condition, message) => { if (!condition) failures.push(message); };
const exists = (relative) => fs.existsSync(path.join(root, relative));
const read = (relative) => fs.readFileSync(path.join(root, relative), 'utf8');

const required = [
  'config/stage-i-m79-design-tokens-semantic-theme-target.ts',
  'config/stage-i-m79-token-architecture.ts',
  'src/design-system/futuristic-token-contract.ts',
  'regression-baseline/m79-m78-source-guard.json',
  'regression-baseline/m79-token-theme-architecture.json',
  'architecture/ui-governance/futuristic-minimalist-token-theme-architecture.md',
  'M79-DESIGN-TOKENS-SEMANTIC-THEME-ARCHITECTURE.md',
  'M79-CONTINUATION-STATE.md',
  'M79-CERTIFICATION-HANDOFF.md',
  'M79-M58-M60-M78-HISTORICAL-VERIFIER-SYNCHRONIZATION-2026-09-29.md',
  'M79-CORRECTIVE-LOOP-E2E-CSS-CUSTOM-PROPERTY-RESOLUTION-2026-09-29.md',
  'M79-CORRECTIVE-LOOP-M59-SUCCESSOR-AUTHORITY-SYNCHRONIZATION-2026-09-29.md',
  'M79-CORRECTIVE-LOOP-CSS-PERFORMANCE-BUDGET-2026-09-29.md',
  'tests/modern/e2e/m79-token-theme.spec.mjs',
  'scripts/run-stage-i-m79-token-theme-browser.mjs',
  'scripts/lib/m79-shell-theme-semantics.mjs',
  'M79-CORRECTIVE-LOOP-SHELL-THEME-SEMANTIC-AVAILABILITY-2026-09-29.md',
  'RELEASE-STATUS-v1.43.2-STAGE-I-M79-DESIGN-TOKENS-SEMANTIC-THEME-ARCHITECTURE.md',
  'scripts/verify-stage-i-m79-m78-source-guard.mjs',
  'scripts/verify-stage-i-m79-design-tokens-semantic-theme-execution.mjs',
  'scripts/lib/stage-i-m79-checkpoint-tree.mjs',
  'scripts/verify-stage-i-m79-certified-state.mjs',
  'scripts/verify-stage-i-m79-certified-artifact.mjs',
  'scripts/verify-stage-i-m79-certified-package-hygiene.mjs',
  'scripts/verify-stage-i-m79-final-checkpoint.mjs',
  'scripts/verify-stage-i-m79-release.sh',
  'scripts/finalize-stage-i-m79.sh',
];
for (const relative of required) ok(exists(relative), `M79 required artifact missing: ${relative}`);

const target = read('config/stage-i-m79-design-tokens-semantic-theme-target.ts');
ok(target.includes('milestone: 79'), 'M79 target milestone mismatch');
ok(target.includes("stage: 'I'"), 'M79 target stage mismatch');
ok(target.includes("activationState: 'implementation-complete-pending-certification'") || target.includes("activationState: 'active-certified'"), 'M79 target has invalid activation state');
ok(target.includes('8414ed0aa4dc596af45b76ba16aae8f28d87bc1b41ddc39108c138acf5e662f2'), 'M79 target does not bind certified M78 ZIP');
ok(target.includes('437188880f12256e1bcd76924e3704e51005900af166251d513232bfcc27866a'), 'M79 target does not bind certified M78 source');

const m78 = read('config/stage-i-m78-futuristic-minimalist-foundation-target.ts');
ok(m78.includes("activationState: 'active-certified'"), 'M79 prerequisite M78 is not active-certified');

const architecture = read('config/stage-i-m79-token-architecture.ts');
for (const category of ['--wm-palette-','--wm-color-','--wm-semantic-','--wm-icon-','--wm-blur-','--wm-density-','--wm-motion-','--wm-breakpoint-']) ok(architecture.includes(`'${category}'`), `M79 architecture missing namespace ${category}`);
for (const invariant of ['primitivePaletteOwnsRawGlobalColorValues','semanticColorRolesDoNotOwnRawGlobalColorValues','mediaQueriesDoNotAttemptToUseCustomPropertyBreakpoints','reducedMotionPolicyRemainsInForce']) ok(architecture.includes(`${invariant}: true`), `M79 architecture missing invariant ${invariant}`);

const tokens = read('assets/css/foundation/tokens.css');
for (const primitive of ['--wm-palette-neutral-000','--wm-palette-neutral-950','--wm-palette-cyan-700','--wm-palette-cyan-400','--wm-border-width-hairline','--wm-border-width-strong','--wm-blur-overlay','--wm-density-control-default','--wm-icon-md']) ok(tokens.includes(`${primitive}:`), `M79 primitive missing: ${primitive}`);

const themes = read('assets/css/foundation/themes.css');
for (const role of ['--wm-color-canvas','--wm-color-surface-primary','--wm-color-text-primary','--wm-color-border-primary','--wm-color-accent','--wm-color-focus']) ok(new RegExp(`${role.replaceAll('-', '\\-')}\\s*:\\s*var\\(--wm-palette-`).test(themes), `M79 semantic theme role does not resolve through primitive palette: ${role}`);
ok(themes.includes(':root[data-theme="dark"]') && themes.includes(':root[data-theme="system"]'), 'M79 must preserve light/dark/system theme modes');
ok(themes.includes('mode-invariant semantic roles are declared once'), 'M79 theme architecture lost mode-invariant declaration hoisting');

const aliases = read('assets/css/foundation/token-architecture.css');
for (const alias of ['--wm-semantic-color-canvas','--wm-semantic-size-icon-md','--wm-semantic-border-hairline','--wm-semantic-blur-overlay','--wm-semantic-density-control-default','--wm-semantic-breakpoint-tablet','--wm-semantic-elevation-floating','--wm-semantic-ease-enter']) ok(aliases.includes(`${alias}:`), `M79 semantic alias missing: ${alias}`);

const contract = read('src/design-system/futuristic-token-contract.ts');
for (const category of ['color','semantic-color','typography','spacing','sizing','border','radius','surface','elevation','shadow','blur','density','breakpoint','motion-timing','motion-easing']) ok(contract.includes(`'${category}'`), `M79 typed contract missing category ${category}`);
ok(read('src/design-system/index.ts').includes("export { futuristicMinimalistTokenContract } from './futuristic-token-contract.ts';"), 'M79 typed contract not exported by design-system boundary');

const performanceBudgets = JSON.parse(read('config/performance-budgets.json'));
const m93BudgetAuthority = fs.existsSync(path.join(root, 'M93-ADAPTIVE-CSS-PERFORMANCE-BUDGET-2026-09-30.md'))
  && read('M93-ADAPTIVE-CSS-PERFORMANCE-BUDGET-2026-09-30.md').includes('M93 successor CSS ceiling: `624000`');
const m92BudgetAuthority = fs.existsSync(path.join(root, 'M92-ADAPTIVE-CSS-PERFORMANCE-BUDGET-2026-09-30.md'))
  && read('M92-ADAPTIVE-CSS-PERFORMANCE-BUDGET-2026-09-30.md').includes('M92 successor CSS ceiling: `621000`');
const m91BudgetAuthority = fs.existsSync(path.join(root, 'M91-ADAPTIVE-CSS-PERFORMANCE-BUDGET-2026-09-30.md'))
  && read('M91-ADAPTIVE-CSS-PERFORMANCE-BUDGET-2026-09-30.md').includes('M91 successor CSS ceiling: `619000`');
const m90BudgetAuthority = fs.existsSync(path.join(root, 'M90-ADAPTIVE-CSS-PERFORMANCE-BUDGET-2026-09-30.md'))
  && read('M90-ADAPTIVE-CSS-PERFORMANCE-BUDGET-2026-09-30.md').includes('M90 successor CSS ceiling: `616000`');
const m88BudgetAuthority = fs.existsSync(path.join(root, 'M88-ADAPTIVE-CSS-PERFORMANCE-BUDGET-2026-09-30.md'))
  && read('M88-ADAPTIVE-CSS-PERFORMANCE-BUDGET-2026-09-30.md').includes('M88 successor CSS ceiling: `613000`');
const m84BudgetAuthority = fs.existsSync(path.join(root, 'M84-ADAPTIVE-CSS-PERFORMANCE-BUDGET-2026-09-29.md'))
  && read('M84-ADAPTIVE-CSS-PERFORMANCE-BUDGET-2026-09-29.md').includes('M84 successor CSS ceiling: `612000`');
const m83BudgetAuthority = fs.existsSync(path.join(root, 'M83-ADAPTIVE-CSS-PERFORMANCE-BUDGET-2026-09-29.md'))
  && read('M83-ADAPTIVE-CSS-PERFORMANCE-BUDGET-2026-09-29.md').includes('M83 successor CSS ceiling: `597000`');
const m82BudgetAuthority = fs.existsSync(path.join(root, 'M82-CSS-PERFORMANCE-BUDGET-CORRECTIVE-2026-09-29.md'))
  && read('M82-CSS-PERFORMANCE-BUDGET-CORRECTIVE-2026-09-29.md').includes('M82 successor CSS ceiling: `591000`');
const acceptedCssCeiling = m93BudgetAuthority ? 624000 : (m92BudgetAuthority ? 621000 : (m91BudgetAuthority ? 619000 : (m90BudgetAuthority ? 616000 : (m88BudgetAuthority ? 613000 : (m84BudgetAuthority ? 612000 : (m83BudgetAuthority ? 597000 : (m82BudgetAuthority ? 591000 : 590000)))))));
ok(performanceBudgets.initialCssRawBytes === acceptedCssCeiling, `M79 successor-governed CSS ceiling drift: expected=${acceptedCssCeiling} actual=${performanceBudgets.initialCssRawBytes}`);
const pkg = JSON.parse(read('package.json'));
for (const script of ['token-theme:check','token-theme:test','token-theme:source-guard','token-theme:browser','token-theme:release','token-theme:certify','token-theme:post-certification','token-theme:package-hygiene','token-theme:final-checkpoint']) ok(typeof pkg.scripts?.[script] === 'string', `M79 package script missing: ${script}`);
ok((pkg.scripts?.check ?? '').includes('token-theme:check'), 'aggregate npm check does not include M79 static gate');
ok((pkg.scripts?.['release:check'] ?? '').includes('token-theme:check') && (pkg.scripts?.['release:check'] ?? '').includes('token-theme:test'), 'release:check does not include M79 gates');

// Browser-runtime verification must assert resolved semantic equivalence, not authored var(...) token text.
// The authored alias relationship is already governed above by token-architecture.css and the deterministic verifier.
const browserSpec = read('tests/modern/e2e/m79-token-theme.spec.mjs');
for (const runtimePair of [
  ['densityControl', 'densityControlPrimitive'],
  ['breakpointTablet', 'breakpointTabletPrimitive'],
  ['blurOverlay', 'blurOverlayPrimitive'],
  ['accentRole', 'accentPrimitive'],
]) {
  ok(browserSpec.includes(`expect(state.${runtimePair[0]}).toBe(state.${runtimePair[1]})`), `M79 browser verifier does not compare resolved runtime alias ${runtimePair[0]} to ${runtimePair[1]}`);
}
const m59SuccessorVerifier = read('scripts/verify-stage-h-m59-typography-content-hierarchy-execution.mjs');
ok(m59SuccessorVerifier.includes('m79AuthorityExists'), 'M79 does not synchronize the M59 historical verifier with the M79 successor authority');
ok(m59SuccessorVerifier.includes('m58.canonicalAliasLayer.aliases'), 'M59 successor verifier does not preserve the certified M58 semantic alias subset');
ok(m59SuccessorVerifier.includes('tokenSet.size>=m58.certifiedAuthorities.tokensCss.unique'), 'M59 successor verifier does not prevent M58 primitive-token inventory reduction');
for (const [milestone, verifier, requiredMarker] of [
  ['M61', 'scripts/verify-stage-h-m61-layout-grid-spatial-execution.mjs', 'm79AuthorityExists'],
  ['M62', 'scripts/verify-stage-h-m62-responsive-architecture-execution.mjs', 'm79AuthorityExists'],
  ['M63', 'scripts/verify-stage-h-m63-accessibility-foundation-execution.mjs', 'm79OwnedAuthorities'],
  ['M64', 'scripts/verify-stage-h-m64-core-component-system-execution.mjs', 'm79OwnedAuthorities'],
]) {
  const source = read(verifier);
  ok(source.includes(requiredMarker), `M79 does not synchronize the ${milestone} historical verifier with the M79 successor authority`);
  ok(source.includes("activationState: 'active-certified'"), `${milestone} successor verifier does not recognize certified M79 authority`);
}
const shellThemeHelper = read('scripts/lib/m79-shell-theme-semantics.mjs');
ok(shellThemeHelper.includes("active-certified"), 'M79 Shell semantic helper does not recognize certified M79 authority');
for (const [milestone, verifier] of [
  ['Shell SM1', 'verify-v1432-shell-navigation-foundation-sm1.mjs'],
  ['Shell SM2', 'verify-v1432-shell-primary-sidebar-sm2.mjs'],
  ['Shell SM5', 'verify-v1432-shell-account-menu-sm5.mjs'],
  ['Shell SM6', 'verify-v1432-shell-overlay-harmonization-sm6.mjs'],
]) {
  const source = read(verifier);
  ok(source.includes('assertM79ShellThemeRoles'), `M79 does not synchronize the ${milestone} historical verifier with semantic successor authority`);
  ok(source.includes('hasM79SuccessorAuthority'), `${milestone} does not preserve the legacy/M79 authority split`);
}

for (const invalidAuthoredExpectation of [
  "toBe('var(--wm-density-control-default)')",
  "toBe('var(--wm-breakpoint-tablet)')",
  "toBe('var(--wm-blur-overlay)')",
  "toBe('var(--wm-palette-cyan-700)')",
  "toBe('var(--wm-palette-cyan-400)')",
]) ok(!browserSpec.includes(invalidAuthoredExpectation), `M79 browser verifier incorrectly expects authored CSS custom-property text at runtime: ${invalidAuthoredExpectation}`);

if (failures.length) {
  console.error('M79 design tokens / semantic theme architecture verification FAILED');
  failures.forEach((failure) => console.error(` - ${failure}`));
  process.exit(1);
}
console.log('M79 design tokens / semantic theme architecture verification: PASS');
console.log(`Verified ${required.length} M79 governance/certification artifacts and centralized token/theme authorities.`);

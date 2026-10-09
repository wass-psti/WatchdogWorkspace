import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { spawnSync } from 'node:child_process';

const root = process.cwd();
const failures = [];
const ok = (condition, message) => { if (!condition) failures.push(message); };
const read = (relative) => fs.readFileSync(path.join(root, relative), 'utf8');

const guard = spawnSync(process.execPath, ['scripts/verify-m108-login-successor.mjs'], { cwd: root, encoding: 'utf8' });
ok(guard.status === 0, `M78 source guard failed: ${(guard.stderr || guard.stdout).trim()}`);

const tokensCss = read('assets/css/foundation/tokens.css');
const themesCss = read('assets/css/foundation/themes.css');
const aliasCss = read('assets/css/foundation/token-architecture.css');
const foundationTs = read('src/design-system/foundation.ts');

const declarations = (source) => {
  const result = new Map();
  for (const match of source.matchAll(/(--wm-[\w-]+)\s*:\s*([^;]+);/g)) result.set(match[1], match[2].trim());
  return result;
};
const primitives = declarations(tokensCss);

const darkMarker = ':root[data-theme="dark"]';
const mediaMarker = '@media (prefers-color-scheme: dark)';
const systemMarker = ':root[data-theme="system"]';
const darkIndex = themesCss.indexOf(darkMarker);
const mediaIndex = themesCss.indexOf(mediaMarker);
const systemIndex = themesCss.indexOf(systemMarker);
ok(darkIndex > 0 && mediaIndex > darkIndex && systemIndex > mediaIndex, 'M79 theme blocks are not in governed light/dark/system order');
const commonTheme = declarations(themesCss.slice(0, themesCss.indexOf(':root,\n:root[data-theme="light"]')));
const mergeDeclarations = (...maps) => new Map(maps.flatMap((map) => [...map.entries()]));
const light = mergeDeclarations(commonTheme, declarations(themesCss.slice(0, darkIndex)));
const dark = mergeDeclarations(commonTheme, declarations(themesCss.slice(darkIndex, mediaIndex)));
const systemDark = mergeDeclarations(commonTheme, declarations(themesCss.slice(systemIndex)));

const globalColorNames = [...new Set([...light.keys(), ...dark.keys()].filter((name) => name.startsWith('--wm-color-')))];
for (const map of [light, dark, systemDark]) {
  for (const name of globalColorNames) {
    const value = map.get(name);
    ok(Boolean(value), `M79 theme role missing: ${name}`);
    if (value) ok(/^var\(--wm-palette-[\w-]+\)$/.test(value), `M79 global semantic color role owns a raw/non-palette value: ${name}=${value}`);
  }
}
for (const name of globalColorNames) ok(dark.get(name) === systemDark.get(name), `M79 system-dark parity drift: ${name}`);

const resolve = (value, map, depth = 0) => {
  if (depth > 8) return null;
  const variable = value?.match(/^var\((--wm-[\w-]+)\)$/)?.[1];
  if (!variable) return value ?? null;
  return resolve(map.get(variable) ?? primitives.get(variable), map, depth + 1);
};
const luminance = (hex) => {
  if (!/^#[0-9a-f]{6}$/i.test(hex ?? '')) return null;
  const rgb = [1,3,5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255).map((c) => c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
  return 0.2126 * rgb[0] + 0.7152 * rgb[1] + 0.0722 * rgb[2];
};
const contrast = (a, b) => {
  const x = luminance(a), y = luminance(b);
  if (x == null || y == null) return null;
  return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05);
};
const pairs = [
  ['--wm-color-text-primary','--wm-color-surface-primary',4.5],
  ['--wm-color-text-secondary','--wm-color-surface-primary',4.5],
  ['--wm-color-text-tertiary','--wm-color-surface-primary',4.5],
  ['--wm-color-accent-contrast','--wm-color-accent',4.5],
  ['--wm-color-positive','--wm-color-surface-primary',4.5],
  ['--wm-color-negative','--wm-color-surface-primary',4.5],
  ['--wm-color-warning','--wm-color-surface-primary',4.5],
  ['--wm-color-info','--wm-color-surface-primary',4.5],
  ['--wm-color-navigation-text','--wm-color-navigation',4.5],
  ['--wm-color-navigation-muted','--wm-color-navigation',4.5],
  ['--wm-color-focus','--wm-color-surface-primary',3],
];
for (const [themeName, map] of [['light', light], ['dark', dark]]) {
  for (const [fg, bg, minimum] of pairs) {
    const fgValue = resolve(map.get(fg), map);
    const bgValue = resolve(map.get(bg), map);
    const ratio = contrast(fgValue, bgValue);
    ok(ratio != null, `M79 ${themeName} contrast pair is not resolvable: ${fg}/${bg}`);
    if (ratio != null) ok(ratio + 1e-9 >= minimum, `M79 ${themeName} contrast ${fg}/${bg}=${ratio.toFixed(2)} below ${minimum}:1`);
  }
}

const aliases = declarations(aliasCss);
const known = new Set([...primitives.keys(), ...light.keys(), ...dark.keys(), ...aliases.keys()]);
for (const [name, value] of aliases) {
  for (const reference of value.matchAll(/var\((--wm-[\w-]+)\)/g)) ok(known.has(reference[1]), `M79 semantic alias references unknown token: ${name} -> ${reference[1]}`);
  if (name.startsWith('--wm-semantic-')) ok(!/var\(--wm-(?:shell|board)-/.test(value), `M79 semantic alias depends on component token: ${name}`);
}
ok(!/--wm-semantic-[\w-]+\s*:\s*#[0-9a-f]{3,8}/i.test(aliasCss), 'M79 semantic alias layer contains raw hex color');

const breakpoints = { narrow: ['--wm-breakpoint-narrow','640px','40rem'], tablet: ['--wm-breakpoint-tablet','840px','52.5rem'], laptop: ['--wm-breakpoint-laptop','1120px','70rem'], wide: ['--wm-breakpoint-wide','1440px','90rem'] };
for (const [name, [cssName, cssValue, tsValue]] of Object.entries(breakpoints)) {
  ok(primitives.get(cssName) === cssValue, `M79 ${name} CSS breakpoint drift`);
  ok(foundationTs.includes(`${name}: '${tsValue}'`), `M79 ${name} typed breakpoint drift`);
}

for (const token of ['--wm-font-family','--wm-text-md','--wm-space-100','--wm-control-md','--wm-radius-100','--wm-shadow-md','--wm-blur-surface','--wm-density-control-default','--wm-motion-duration-standard','--wm-motion-ease-enter']) ok(primitives.has(token), `M79 required primitive family member missing: ${token}`);

const snapshot = JSON.parse(read('regression-baseline/m79-token-theme-architecture.json'));
const performanceBudgets = JSON.parse(read('config/performance-budgets.json'));
const m93BudgetAuthorityPath = path.join(root, 'M93-ADAPTIVE-CSS-PERFORMANCE-BUDGET-2026-09-30.md');
const m93BudgetAuthority = fs.existsSync(m93BudgetAuthorityPath) && fs.readFileSync(m93BudgetAuthorityPath, 'utf8').includes('M93 successor CSS ceiling: `624000`');
const m92BudgetAuthorityPath = path.join(root, 'M92-ADAPTIVE-CSS-PERFORMANCE-BUDGET-2026-09-30.md');
const m92BudgetAuthority = fs.existsSync(m92BudgetAuthorityPath) && fs.readFileSync(m92BudgetAuthorityPath, 'utf8').includes('M92 successor CSS ceiling: `621000`');
const m91BudgetAuthorityPath = path.join(root, 'M91-ADAPTIVE-CSS-PERFORMANCE-BUDGET-2026-09-30.md');
const m91BudgetAuthority = fs.existsSync(m91BudgetAuthorityPath) && fs.readFileSync(m91BudgetAuthorityPath, 'utf8').includes('M91 successor CSS ceiling: `619000`');
const m90BudgetAuthorityPath = path.join(root, 'M90-ADAPTIVE-CSS-PERFORMANCE-BUDGET-2026-09-30.md');
const m90BudgetAuthority = fs.existsSync(m90BudgetAuthorityPath) && fs.readFileSync(m90BudgetAuthorityPath, 'utf8').includes('M90 successor CSS ceiling: `616000`');
const m88BudgetAuthorityPath = path.join(root, 'M88-ADAPTIVE-CSS-PERFORMANCE-BUDGET-2026-09-30.md');
const m88BudgetAuthority = fs.existsSync(m88BudgetAuthorityPath) && fs.readFileSync(m88BudgetAuthorityPath, 'utf8').includes('M88 successor CSS ceiling: `613000`');
const m84BudgetAuthorityPath = path.join(root, 'M84-ADAPTIVE-CSS-PERFORMANCE-BUDGET-2026-09-29.md');
const m84BudgetAuthority = fs.existsSync(m84BudgetAuthorityPath) && fs.readFileSync(m84BudgetAuthorityPath, 'utf8').includes('M84 successor CSS ceiling: `612000`');
const m83BudgetAuthorityPath = path.join(root, 'M83-ADAPTIVE-CSS-PERFORMANCE-BUDGET-2026-09-29.md');
const m83BudgetAuthority = fs.existsSync(m83BudgetAuthorityPath) && fs.readFileSync(m83BudgetAuthorityPath, 'utf8').includes('M83 successor CSS ceiling: `597000`');
const m82BudgetAuthorityPath = path.join(root, 'M82-CSS-PERFORMANCE-BUDGET-CORRECTIVE-2026-09-29.md');
const m82BudgetAuthority = fs.existsSync(m82BudgetAuthorityPath) && fs.readFileSync(m82BudgetAuthorityPath, 'utf8').includes('M82 successor CSS ceiling: `591000`');
const acceptedCssCeiling = m93BudgetAuthority ? 624000 : (m92BudgetAuthority ? 621000 : (m91BudgetAuthority ? 619000 : (m90BudgetAuthority ? 616000 : (m88BudgetAuthority ? 613000 : (m84BudgetAuthority ? 612000 : (m83BudgetAuthority ? 597000 : (m82BudgetAuthority ? 591000 : snapshot.initialCssRawBytesCeiling)))))));
ok(performanceBudgets.initialCssRawBytes === acceptedCssCeiling, `M79 successor-governed CSS ceiling drift: expected=${acceptedCssCeiling} actual=${performanceBudgets.initialCssRawBytes}`);
ok(snapshot.globalSemanticColorRoles === globalColorNames.length, `M79 semantic color role count drift: expected=${snapshot.globalSemanticColorRoles} actual=${globalColorNames.length}`);
const m82GuardPath = path.join(root, 'regression-baseline/m82-m81-source-guard.json');
const m82SemanticDensityAliases = [
  '--wm-semantic-density-space-compact',
  '--wm-semantic-density-space-default',
  '--wm-semantic-density-space-comfortable',
  '--wm-semantic-density-control-compact',
  '--wm-semantic-density-control-default',
  '--wm-semantic-density-control-comfortable',
];
const m82SuccessorAuthority = fs.existsSync(m82GuardPath)
  ? JSON.parse(fs.readFileSync(m82GuardPath, 'utf8')).allowedMutations?.includes('assets/css/foundation/token-architecture.css') === true
  : false;
const m82AddedAliases = m82SemanticDensityAliases.filter((name) => !['--wm-semantic-density-control-default'].includes(name));
const expectedSemanticAliasCount = snapshot.semanticAliasCount + (m82SuccessorAuthority ? m82AddedAliases.length : 0);
ok(expectedSemanticAliasCount === aliases.size, `M79 semantic alias count drift: expected=${expectedSemanticAliasCount} actual=${aliases.size}`);
if (m82SuccessorAuthority) {
  for (const name of m82SemanticDensityAliases) ok(aliases.has(name), `M79 successor-authorized M82 density alias missing: ${name}`);
}
ok(snapshot.primitiveTokenCount === primitives.size, `M79 primitive token count drift: expected=${snapshot.primitiveTokenCount} actual=${primitives.size}`);

if (failures.length) {
  console.error('M79 design tokens / semantic theme deterministic verification FAILED');
  failures.forEach((failure) => console.error(` - ${failure}`));
  process.exit(1);
}
console.log('M79 design tokens / semantic theme deterministic verification: PASS');
console.log(`Primitive tokens=${primitives.size}; semantic aliases=${aliases.size}; global semantic colors=${globalColorNames.length}; contrast and M78 source guard PASS.`);

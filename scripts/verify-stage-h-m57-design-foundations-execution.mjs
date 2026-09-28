import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const root = process.cwd();
const failures = [];
const ok = (condition, message) => { if (!condition) failures.push(message); };
const read = (relative) => fs.readFileSync(path.join(root, relative), 'utf8');

const contract = read('config/semantic-design-language.ts');
const product = read('src/design-system/semantic-language.ts');
const snapshot = JSON.parse(read('regression-baseline/m57-semantic-design-language.json'));

const expected = {
  hierarchy: ['primary','secondary','tertiary','supporting'],
  contentPriority: ['critical','primary','secondary','metadata'],
  interactionPriority: ['primary','secondary','tertiary','destructive','quiet'],
  surfaceRoles: ['canvas','base','raised','overlay','inset'],
  density: ['comfortable','compact','dense'],
  spatialIntent: ['cluster','section','separation','containment'],
  emphasis: ['default','subtle','strong','critical'],
  alignment: ['start','center','end','baseline','numeric-end'],
};
for (const [key, values] of Object.entries(expected)) {
  ok(JSON.stringify(snapshot.vocabulary[key]) === JSON.stringify(values), `M57 snapshot ${key} vocabulary changed`);
  for (const value of values) ok(contract.includes(`'${value}'`) || contract.includes(`\"${value}\"`), `M57 governance contract missing ${key}:${value}`);
}
for (const value of expected.hierarchy) ok(product.includes(`'${value}'`), `M57 product vocabulary missing hierarchy:${value}`);
for (const value of expected.interactionPriority) ok(product.includes(`'${value}'`), `M57 product vocabulary missing interactionPriority:${value}`);

const forbiddenConcretePatterns = [
  /#[0-9a-f]{3,8}/i,
  /\b\d+(?:\.\d+)?(?:px|rem|em|vh|vw)\b/i,
  /--wm-color-[a-z0-9-]+\s*:/i,
  /--wm-space-[a-z0-9-]+\s*:/i,
];
for (const pattern of forbiddenConcretePatterns) {
  ok(!pattern.test(contract), `M57 governance contract contains forbidden concrete visual value: ${pattern}`);
  ok(!pattern.test(product), `M57 product semantic vocabulary contains forbidden concrete visual value: ${pattern}`);
}

const m56Target = read('config/stage-h-m56-ui-architecture-inventory-target.ts');
ok(m56Target.includes("activationState: 'active-certified'"), 'M57 must start from active-certified M56 authority');
const m56Inventory = read('config/ui-architecture-inventory.ts');
for (const authority of ['react-design-system','foundation-css','imperative-ui-runtime','time-tracker-module-ui','fueltrack-module-ui','tradelink-module-ui']) {
  ok(m56Inventory.includes(`id: '${authority}'`), `M57 lost M56 authority ${authority}`);
}

const tokenCss = read('assets/css/foundation/tokens.css');
const themeCss = read('assets/css/foundation/themes.css');
ok(tokenCss.includes('--wm-space-100:'), 'existing token authority unexpectedly missing');
ok(themeCss.includes('--wm-color-canvas:'), 'existing theme authority unexpectedly missing');

const packageJson = JSON.parse(read('package.json'));
const release = packageJson.scripts['release:check'];
ok(release.indexOf('ui-inventory:test') < release.indexOf('design-foundations:check'), 'M57 must follow M56 deterministic inventory governance');
ok(release.indexOf('design-foundations:test') < release.indexOf('design-system:check'), 'M57 deterministic gate must precede downstream design-system gate');
ok(release.includes('verify:ui') && release.includes('verify'), 'M57 release flow must retain historical UI/project regression verification');

if (failures.length) {
  console.error('M57 design foundations deterministic verification FAILED');
  failures.forEach((failure) => console.error(` - ${failure}`));
  process.exit(1);
}
console.log('M57 design foundations deterministic verification: PASS');
console.log('Validated semantic vocabulary parity, no concrete visual values, M56 authority retention, and release-gate sequencing.');

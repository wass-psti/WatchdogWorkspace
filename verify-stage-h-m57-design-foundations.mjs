import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const root = process.cwd();
const failures = [];
const ok = (condition, message) => { if (!condition) failures.push(message); };
const exists = (relative) => fs.existsSync(path.join(root, relative));
const read = (relative) => fs.readFileSync(path.join(root, relative), 'utf8');

const required = [
  'config/semantic-design-language.ts',
  'config/stage-h-m57-design-foundations-target.ts',
  'src/design-system/semantic-language.ts',
  'architecture/ui-governance/semantic-design-language.md',
  'regression-baseline/m57-semantic-design-language.json',
  'M57-DESIGN-FOUNDATIONS-AND-SEMANTIC-DESIGN-LANGUAGE.md',
  'M57-CONTINUATION-STATE.md',
  'M57-CERTIFICATION-HANDOFF.md',
  'RELEASE-STATUS-v1.43.2-STAGE-H-M57-DESIGN-FOUNDATIONS-SEMANTIC-DESIGN-LANGUAGE.md',
  'scripts/verify-stage-h-m57-design-foundations-execution.mjs',
  'scripts/lib/stage-h-m57-certification-tree.mjs',
  'scripts/verify-stage-h-m57-release.sh',
  'scripts/finalize-stage-h-m57.sh',
  'scripts/verify-stage-h-m57-certified-state.mjs',
  'scripts/verify-stage-h-m57-certified-artifact.mjs',
  'scripts/verify-stage-h-m57-certified-package-hygiene.mjs',
  'scripts/verify-stage-h-m57-final-checkpoint.mjs',
];
for (const file of required) ok(exists(file), `M57 required artifact missing: ${file}`);

const contract = read('config/semantic-design-language.ts');
for (const principle of ['clarity-first','hierarchy-by-purpose','consistent-meaning','density-with-intent','progressive-disclosure','accessible-by-default','continuity-over-spectacle','restrained-brand-expression']) {
  ok(contract.includes(`id: '${principle}'`), `M57 semantic principle missing: ${principle}`);
}
for (const vocabulary of ['hierarchy','contentPriority','interactionPriority','surfaceRoles','density','spatialIntent','emphasis','alignment','brandExpression','protectedBoundaries']) {
  ok(contract.includes(`${vocabulary}: Object.freeze(`), `M57 semantic vocabulary missing: ${vocabulary}`);
}

const product = read('src/design-system/semantic-language.ts');
for (const role of ['hierarchy','contentPriority','interactionPriority','surfaceRole','densityIntent','spatialIntent','emphasis','alignmentIntent']) {
  ok(product.includes(`${role}: Object.freeze(`), `M57 product vocabulary missing: ${role}`);
}
const index = read('src/design-system/index.ts');
ok(index.includes("export { workManagementSemanticLanguage } from './semantic-language.ts';"), 'M57 semantic vocabulary is not exported by the product design-system boundary');

const snapshot = JSON.parse(read('regression-baseline/m57-semantic-design-language.json'));
ok(snapshot.schemaVersion === 1, 'M57 snapshot schemaVersion must be 1');
ok(snapshot.milestone === 57, 'M57 snapshot milestone mismatch');
ok(snapshot.sourceBaseline === 'Work-Management-App-v1.43.2-Stage-H-M56-Certified-Baseline.zip', 'M57 snapshot must bind to certified M56 baseline');
ok(snapshot.semanticsVersion === '1.43.2-m57-v1', 'M57 snapshot semantics version mismatch');
ok(snapshot.visualRuntimeMutationAllowed === false, 'M57 snapshot must forbid visual/runtime mutation');
ok(snapshot.protectedSuccessorOwnership?.tokens === 58 && snapshot.protectedSuccessorOwnership?.typography === 59 && snapshot.protectedSuccessorOwnership?.themeContrast === 60 && snapshot.protectedSuccessorOwnership?.layoutSpatial === 61, 'M57 snapshot must preserve successor ownership through M61');

const target = read('config/stage-h-m57-design-foundations-target.ts');
ok(target.includes("semanticsVersion: '1.43.2-m57-v1'"), 'M57 target semantics version missing');
ok(target.includes("concreteTokenMutationAllowed: false"), 'M57 target must forbid concrete token mutation');
ok(target.includes("visualRuntimeMutationAllowed: false"), 'M57 target must forbid visual/runtime mutation');
ok(target.includes("activationState: 'implementation-complete-pending-certification'") || target.includes("activationState: 'active-certified'"), 'M57 target activation state invalid');

const doc = read('architecture/ui-governance/semantic-design-language.md');
for (const phrase of ['Meaning precedes styling', 'M58 — token architecture', 'M59 — typography', 'M60 — color/theme/contrast', 'M61 — layout/grid/spatial', 'does not change concrete token values']) {
  ok(doc.includes(phrase), `M57 governance documentation missing required boundary: ${phrase}`);
}

const pkg = JSON.parse(read('package.json'));
for (const script of ['design-foundations:check','design-foundations:test','design-foundations:browser','design-foundations:release','design-foundations:certify','design-foundations:post-certification','design-foundations:package-hygiene','design-foundations:final-checkpoint']) {
  ok(typeof pkg.scripts?.[script] === 'string', `package script missing: ${script}`);
}
ok(pkg.scripts['design-foundations:check'] === 'node verify-stage-h-m57-design-foundations.mjs', 'design-foundations:check wiring changed');
ok(pkg.scripts['design-foundations:test'] === 'node scripts/verify-stage-h-m57-design-foundations-execution.mjs', 'design-foundations:test wiring changed');
ok(pkg.scripts['release:check'].includes('ui-inventory:check') && pkg.scripts['release:check'].includes('design-foundations:check'), 'release:check must retain M56 and add M57');
ok(pkg.scripts['release:check'].indexOf('ui-inventory:check') < pkg.scripts['release:check'].indexOf('design-foundations:check'), 'M57 must execute after M56 inventory governance');
ok(pkg.scripts['release:check'].indexOf('design-foundations:check') < pkg.scripts['release:check'].indexOf('design-system:check'), 'M57 must execute before downstream design-system verification');

if (failures.length) {
  console.error('M57 design foundations verification FAILED');
  failures.forEach((failure) => console.error(` - ${failure}`));
  process.exit(1);
}
console.log('M57 design foundations verification: PASS');
console.log('Verified semantic principles, vocabulary, successor boundaries, design-system export, and certification wiring.');

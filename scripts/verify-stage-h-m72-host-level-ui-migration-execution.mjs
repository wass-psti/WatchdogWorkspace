import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const root = process.cwd();
const failures = [];
const ok = (condition, message) => { if (!condition) failures.push(message); };
const read = (relative) => fs.readFileSync(path.join(root, relative), 'utf8');
const sha = (relative) => crypto.createHash('sha256').update(fs.readFileSync(path.join(root, relative))).digest('hex');
const snapshot = JSON.parse(read('regression-baseline/m72-host-level-ui-migration.json'));

const m67Baseline = JSON.parse(read('regression-baseline/m67-system-feedback.json'));
const m67Migratable = new Set(m67Baseline.successorMigratableAuthorities || []);
ok(m67Baseline.successorBoundaries?.hostMigration === 72, 'M72 must remain the declared M67 host migration milestone');
ok(m67Migratable.size === 1 && m67Migratable.has('src/app/shared-ui/SharedApplicationUI.tsx'), 'M72 M67 migration allowlist must contain only SharedApplicationUI.tsx');
ok(m67Baseline.successorMigrationPolicy === 'hash-frozen-through-m71-semantic-invariants-from-m72', 'M72 M67 successor migration policy drift');

const m68Baseline = JSON.parse(read('regression-baseline/m68-application-shell-navigation.json'));
const m68Migratable = new Set(m68Baseline.successorMigratableAuthorities || []);
ok(m68Baseline.hostMigrationMilestone === 72, 'M72 must remain the declared M68 host migration milestone');
ok(m68Migratable.size === 2, 'M72 requires exactly two M68 successor-migratable presentation authorities');
ok(m68Migratable.has('src/app/shell/WorkManagementShell.tsx') && m68Migratable.has('src/app/shared-ui/SharedApplicationUI.tsx'), 'M72 M68 migration allowlist must contain only the approved host presentation authorities');
ok(m68Baseline.successorMigrationPolicy === 'hash-frozen-through-m71-semantic-invariants-from-m72', 'M72 M68 successor migration policy drift');

for (const [relative, expected] of Object.entries(snapshot.certifiedAuthorityHashes)) {
  ok(fs.existsSync(path.join(root, relative)), `M72 certified M71 authority missing: ${relative}`);
  ok(sha(relative) === expected, `M72 certified M71 runtime authority drift: ${relative}`);
}

const auth = read('src/app/auth/AuthenticationUI.tsx');
const management = read('src/app/management/AuthenticatedManagementUI.tsx');
const shared = read('src/app/shared-ui/SharedApplicationUI.tsx');
const shell = read('src/app/shell/WorkManagementShell.tsx');
const combined = `${auth}\n${management}\n${shared}`;
for (const consumer of snapshot.requiredSharedConsumers) ok(combined.includes(consumer), `M72 shared primitive consumer missing: ${consumer}`);
for (const surface of snapshot.migratedReactSurfaces) {
  const token = surface.startsWith('management-') ? `data-wm-host-migrated="${surface.replace('management-', '')}"` : `data-wm-host-migrated="${surface}"`;
  ok(`${auth}\n${management}\n${shared}\n${shell}`.includes(token), `M72 migrated surface marker missing: ${surface}`);
}

ok(snapshot.hostRuntimeOwnershipChanged === false, 'M72 host runtime ownership must remain unchanged');
ok(snapshot.businessLogicChanged === false, 'M72 must not classify business logic as changed');
ok(snapshot.embeddedModuleConsumerMigrationRequired === false, 'M72 must not migrate embedded module consumers');
ok(snapshot.boardsMigrationMilestone === 73 && snapshot.tradeLinkMigrationMilestone === 76 && snapshot.finalUiCertificationMilestone === 77, 'M72 successor milestone boundary drift');

const boardMondayVerifier = read('verify-v1432-board-monday-integration.mjs');
const shellM1Verifier = read('verify-v1432-shell-navigation-foundation-sm1.mjs');
ok(boardMondayVerifier.includes('host-ui-migration'), 'M72 must keep the legacy Board Monday integration verifier successor-aware of the host migration cascade');
ok(boardMondayVerifier.includes('motion/application/shared-UI/host-migration cascade'), 'M72 Board cascade verifier message must document the authorized host-migration layer');
ok(shellM1Verifier.includes('host-ui-migration'), 'M72 must keep the Shell M1 foundation verifier successor-aware of the host migration cascade');
ok(shellM1Verifier.includes('M72 host migration layers'), 'M72 Shell M1 cascade verifier message must document the authorized host migration layer');

const cssPath = path.join(root, 'assets/css/foundation/host-ui-migration.css');
const css = read('assets/css/foundation/host-ui-migration.css');
ok(fs.statSync(cssPath).size <= 400, 'M72 host consolidation CSS must remain within the 400-byte source budget');
ok(!css.includes('transition: all') && !css.includes('transition-all'), 'M72 host consolidation must not add broad transition-all behavior');
ok(!css.includes('prefers-reduced-motion') && !css.includes('forced-colors'), 'M72 host bridge must not duplicate reduced-motion or forced-colors rules owned by shared authorities');
ok(read('assets/css/foundation/interactions.css').includes('@media (prefers-reduced-motion:reduce)'), 'M72 reduced-motion behavior must remain owned by the shared interaction authority');
ok(read('assets/css/foundation/feedback-system.css').includes('@media (forced-colors: active)'), 'M72 forced-colors feedback behavior must remain owned by M67');

if (failures.length) {
  console.error('M72 host-level UI migration deterministic verification FAILED');
  failures.forEach((failure) => console.error(` - ${failure}`));
  process.exit(1);
}
console.log('M72 host-level UI migration deterministic verification: PASS');
console.log(`Validated ${snapshot.migratedReactSurfaces.length} migrated React host surfaces, ${snapshot.requiredSharedConsumers.length} shared primitive consumers, certified runtime-authority preservation, explicit M67/M68 successor-migration authorization, accessibility fallbacks, and M73–M77 ownership boundaries.`);

import fs from 'node:fs';
import assert from 'node:assert/strict';

const read = (path) => fs.readFileSync(path, 'utf8');
const app = read('assets/js/app.ts');
const css = read('assets/css/shell-navigation.css');
const test = read('tests/modern/e2e/m99-sidebar-interaction-containment.spec.mjs');
const browserRunner = read('scripts/run-stage-i-m99-sidebar-browser.mjs');
const m98Guard = read('scripts/verify-stage-i-m98-m97-source-guard.mjs');
const m99Guard = read('scripts/verify-stage-i-m99-m98-source-guard.mjs');
const m99Target = read('config/stage-i-m99-sidebar-corrective-successor-target.ts');
const pkg = JSON.parse(read('package.json'));

for (const marker of [
  'function syncReactShellNavigationMarkup(): void {',
  "if (snapshot.mode !== 'shell') return;",
  'reactShellRuntime.update({ navigationMarkup: sidebarNavMarkup(snapshot.activeRoute) });',
  'syncReactShellNavigationMarkup();',
  'writeShellSectionState(sections);',
]) assert.ok(app.includes(marker), `M99 sidebar section synchronization contract missing: ${marker}`);

for (const marker of [
  '.shell-navigation-scroll {',
  'overflow-x: hidden;',
  '.sidebar nav {',
  '.shell-resource-navigation,',
  '.shell-nav-section-body,',
  '.shell-board-resource-list,',
  '.sidebar-foot',
  'max-width: 100%;',
  '.sidebar .brand-copy {',
  'overflow: hidden;',
]) assert.ok(css.includes(marker), `M99 sidebar containment contract missing: ${marker}`);

assert.doesNotMatch(css, /\.shell-navigation-scroll\s*\{[^}]*overflow-x:\s*visible;/s, 'M99 must not allow navigation-scroll horizontal overflow.');
assert.match(css, /\.sidebar nav\s*\{[^}]*overflow-x:\s*hidden;[^}]*overflow-y:\s*visible;/s, 'M99 sidebar nav must clip horizontal overflow while preserving vertical layout.');

for (const marker of [
  '@m99-sidebar sections remain collapsed after React shell synchronization',
  '@m99-sidebar minimum-width resize clips all text-bearing navigation content',
  "await resizer.press('Home')",
  "expect(containment.leaks).toEqual([])",
]) assert.ok(test.includes(marker), `M99 browser regression contract missing: ${marker}`);

assert.match(pkg.scripts['verify:ui'], /verify-v1432-shell-section-resize-corrective\.mjs/, 'M99 corrective verifier must participate in verify:ui.');
assert.equal(pkg.scripts['test:m99:sidebar'], 'node scripts/run-stage-i-m99-sidebar-browser.mjs', 'M99 targeted browser script must use the managed server runner.');
assert.match(browserRunner, /m99-sidebar-interaction-containment\.spec\.mjs/, 'M99 managed browser runner must execute the targeted sidebar specification.');
assert.match(browserRunner, /--strictPort/, 'M99 managed browser runner must claim the certification port fail-closed.');
assert.match(browserRunner, /await waitForReady\(server\)/, 'M99 managed browser runner must wait for application-server readiness.');
assert.match(browserRunner, /VITE_RUNTIME_ENV:\s*'ci'/, 'M99 managed browser runner must use the deterministic CI runtime contract.');
assert.match(browserRunner, /VITE_SUPABASE_URL:\s*'https:\/\/m39-fixture\.supabase\.co'/, 'M99 managed browser runner must bind the canonical M39 fixture Supabase origin.');
assert.match(browserRunner, /VITE_SUPABASE_PUBLISHABLE_KEY:\s*'sb_publishable_m99_sidebar_fixture'/, 'M99 managed browser runner must bind a deterministic public fixture key.');
assert.match(browserRunner, /finally\s*\{[\s\S]*await terminate\(server\)/, 'M99 managed browser runner must always terminate the application server.');


assert.match(m98Guard, /M99 successor authority delegated to M99→M98 source guard/, 'M98 historical guard must delegate explicitly to the M99 successor authority.');
assert.match(m99Guard, /baselineCertifiedZipSha256/, 'M99 successor source guard must bind certified M98 provenance.');
assert.match(m99Guard, /unauthorized M98 baseline mutation/, 'M99 successor source guard must reject unrelated baseline drift.');
assert.match(m99Guard, /unauthorized new M99 file/, 'M99 successor source guard must reject unrelated new files.');
assert.match(m99Target, /milestone:\s*99/, 'M99 successor target milestone contract missing.');
assert.match(m99Target, /unrelatedSourceMutationForbidden:\s*true/, 'M99 successor target must remain fail-closed for unrelated source mutations.');

const m96Verifier = read('verify-stage-i-m96-visual-consistency-legacy-styling-retirement.mjs');
const m99SourceManifest = JSON.parse(read('regression-baseline/m99-m98-source-guard.json'));
assert.ok(m99SourceManifest.allowedMutations.includes('verify-stage-i-m96-visual-consistency-legacy-styling-retirement.mjs'), 'M99 source guard must authorize the M96 successor-verifier synchronization.');
assert.ok(m99SourceManifest.allowedNewFiles.includes('M99-CORRECTIVE-LOOP-M96-ADAPTIVE-CSS-SUCCESSOR-SYNCHRONIZATION-2026-10-01.md'), 'M99 source guard must authorize the M96 adaptive-CSS corrective evidence.');
assert.match(m96Verifier, /m99-m98-source-guard\.json/, 'M96 historical verifier must detect governed M99 successor authority.');
assert.match(m96Verifier, /m96EquivalentTotal===1201822/, 'M96 historical verifier must preserve the certified 1,201,822-byte retirement result under successor normalization.');
assert.match(m96Verifier, /cssMutations\.length===1&&cssMutations\[0\]==='assets\/css\/shell-navigation\.css'/, 'M96 historical verifier must limit M99 CSS successor normalization to shell-navigation.css.');
assert.match(m96Verifier, /cssAdditions\.length===0&&cssRemovals\.length===0/, 'M96 historical verifier must forbid M99 CSS additions/removals in this corrective scope.');

console.log('v1.43.2 M99 sidebar dropdown and resize containment corrective verification: PASS');

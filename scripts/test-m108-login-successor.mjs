import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const repo = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const archive = process.env.M108_BASELINE_ARCHIVE;
if (!archive) throw Error('M108_BASELINE_ARCHIVE is required');
const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'm108-successor-negative-tests-'));
const candidate = path.join(temp, 'candidate');
const guard = path.join(candidate, 'scripts/verify-m108-login-successor.mjs');
const exclude = new Set(['node_modules', '.git', 'dist', 'coverage', 'test-results', 'playwright-report']);
try {
  fs.cpSync(repo, candidate, {recursive:true, filter:(src)=> {
    const rel=path.relative(repo,src);
    if (!rel) return true;
    const parts=rel.split(path.sep);
    return !parts.some(p=>exclude.has(p)) && !(parts[0]==='apps' && parts[1]==='material-tracker');
  }});
  function check(label, expectedPass, alter, overrideArchive) {
    const undo = alter?.();
    const result = spawnSync(process.execPath, [guard], {
      cwd: candidate, env:{...process.env,M108_BASELINE_ARCHIVE:overrideArchive ?? archive},
      encoding:'utf8', maxBuffer:8*1024*1024,
    });
    if (undo) undo();
    const passed = result.status===0;
    if (passed!==expectedPass) {
      throw new Error(`Unexpected guard outcome for ${label}: status=${result.status}\n${result.stdout}\n${result.stderr}`);
    }
    console.log(`PASS: ${label}: ${expectedPass ? 'accepted' : 'rejected'}`);
  }
  function replace(rel, value) {
    const name = path.join(candidate, rel);
    const prior = fs.readFileSync(name);
    fs.writeFileSync(name, value);
    return () => fs.writeFileSync(name, prior);
  }
  const scripts = JSON.parse(fs.readFileSync(path.join(candidate, 'package.json'), 'utf8')).scripts;
  for (const key of ['token-theme:source-guard', 'shared-primitives:source-guard', 'application-shell:source-guard', 'layout-composition:source-guard', 'authentication-account:source-guard', 'material-tracker:source-guard']) {
    if (scripts[key] !== 'node scripts/verify-m108-login-successor.mjs') throw new Error(`Unrouted successor guard: ${key}`);
  }
  console.log('PASS: six successor npm source guards use the pinned verifier');
  function governance(label, expectedPass, alter) {
    const undo = alter?.();
    const result = spawnSync(process.execPath, ['scripts/verify-package-governance.mjs'], {
      cwd: candidate, env:process.env, encoding:'utf8', maxBuffer:8*1024*1024,
    });
    if (undo) undo();
    if ((result.status === 0) !== expectedPass) {
      throw new Error(`Package governance ${label} wrong outcome status=${result.status}\n${result.stdout}\n${result.stderr}`);
    }
    console.log(`PASS: package governance ${label}: ${expectedPass ? 'accepted' : 'rejected'}`);
  }
  governance('approved pinned local composite action', true);
  governance('unversioned remote action', false, () => {
    const file = path.join(candidate, '.github/workflows/ci.yml');
    const prior=fs.readFileSync(file, 'utf8');
    if (!prior.includes('uses: actions/checkout@v6')) throw Error('missing expected checkout action');
    fs.writeFileSync(file, prior.replace('uses: actions/checkout@v6', 'uses: actions/checkout'));
    return () => fs.writeFileSync(file, prior);
  });
  governance('mutable remote action', false, () => {
    const file = path.join(candidate, '.github/workflows/ci.yml');
    const prior=fs.readFileSync(file, 'utf8');
    fs.writeFileSync(file, prior.replace('uses: actions/checkout@v6', 'uses: actions/checkout@main'));
    return () => fs.writeFileSync(file, prior);
  });
  governance('unapproved local action reference', false, () => {
    const file = path.join(candidate, '.github/workflows/ci.yml');
    const prior=fs.readFileSync(file, 'utf8');
    fs.writeFileSync(file, prior.replace('uses: ./.github/actions/prepare-m108-baseline', 'uses: ./.github/actions/unapproved'));
    return () => fs.writeFileSync(file, prior);
  });
  governance('modified pinned action bytes', false, () => replace('.github/actions/prepare-m108-baseline/action.yml', '# modified action\n'));
  governance('missing pinned action', false, () => {
    const file=path.join(candidate,'.github/actions/prepare-m108-baseline/action.yml');
    const prior=fs.readFileSync(file); fs.rmSync(file);
    return () => fs.writeFileSync(file,prior);
  });
  check('approved candidate', true);
  check('CI predecessor provisioning mutation', false, () => replace('.github/workflows/ci.yml', '# tampered\n'));
  check('pinned predecessor workflow tamper boards-backend-data-contract-recovery.yml', false, () => replace('.github/workflows/boards-backend-data-contract-recovery.yml', '# tampered\n'));
  check('pinned predecessor workflow tamper boards-collection-route-recovery.yml', false, () => replace('.github/workflows/boards-collection-route-recovery.yml', '# tampered\n'));
  check('pinned predecessor workflow tamper boards-columns-cells-status-system-recovery.yml', false, () => replace('.github/workflows/boards-columns-cells-status-system-recovery.yml', '# tampered\n'));
  check('pinned predecessor workflow tamper boards-kanban-drag-drop-recovery.yml', false, () => replace('.github/workflows/boards-kanban-drag-drop-recovery.yml', '# tampered\n'));
  check('pinned predecessor workflow tamper boards-table-group-item-recovery.yml', false, () => replace('.github/workflows/boards-table-group-item-recovery.yml', '# tampered\n'));
  check('pinned predecessor workflow tamper management-authority-consolidation.yml', false, () => replace('.github/workflows/management-authority-consolidation.yml', '# tampered\n'));
  check('pinned predecessor workflow tamper rich-item-workspace-file-recovery.yml', false, () => replace('.github/workflows/rich-item-workspace-file-recovery.yml', '# tampered\n'));
  check('pinned predecessor workflow tamper settings-functional-recovery.yml', false, () => replace('.github/workflows/settings-functional-recovery.yml', '# tampered\n'));

  check('Pages predecessor provisioning mutation', false, () => replace('.github/workflows/deploy-pages.yml', '# tampered\n'));
  check('predecessor acquisition composite action mutation', false, () => replace('.github/actions/prepare-m108-baseline/action.yml', '# tampered\n'));
  check('corrective source mutation', false, () => replace('assets/js/core/auth.ts', '// tampered\n'));
  check('unauthorized source mutation', false, () => replace('verify-auth-backend.mjs', '// tampered\n'));
  check('integration source modification', false, () => replace('integrations/material-tracker/package.json', '{}\n'));
  check('pinned Material Tracker token-CSS security guard mutation', false, () => replace('integrations/material-tracker/scripts/check-integration.mjs', '// unapproved security-check change\n'));
  check('pinned successor documentation mutation', false, () => replace('M108-LOGIN-SUCCESSOR-CONTINUATION.md', 'tampered\n'));
  check('pinned successor runner mutation', false, () => replace('scripts/certify-m108-login-successor-local.sh', 'tampered\n'));
  check('successor package guard routing mutation', false, () => replace('package.json', '{}\n'));
  check('M83 successor verifier mutation', false, () => replace('verify-stage-i-m83-authentication-account-surfaces.mjs', '// unauthorized\n'));
  check('M83 successor provenance helper mutation', false, () => replace('scripts/lib/m108-login-successor-auth-provenance.mjs', '// unauthorized\n'));
  check('M49 guard rejects tampering of scripts/lib/stage-g-m49-certification-tree.mjs', false, () => replace('scripts/lib/stage-g-m49-certification-tree.mjs', '// unauthorized M49 modification\n'));
  check('M49 guard rejects tampering of scripts/finalize-stage-g-m49.sh', false, () => replace('scripts/finalize-stage-g-m49.sh', '// unauthorized M49 modification\n'));
  check('M49 guard rejects tampering of tests/modern/e2e/boards-kanban-drag-drop-recovery.spec.mjs', false, () => replace('tests/modern/e2e/boards-kanban-drag-drop-recovery.spec.mjs', '// unauthorized M49 modification\n'));
  check('M49 guard rejects tampering of scripts/verify-stage-g-m49-finalizer-fail-closed.mjs', false, () => replace('scripts/verify-stage-g-m49-finalizer-fail-closed.mjs', '// unauthorized M49 modification\n'));
  check('M52 atomic embedded identity helper rejects tampering', false, () => replace('tests/modern/e2e/helpers/m52-rbac-fixture.mjs', '// unauthorized M52 identity-boundary change\n'));
  check('M109 protected M78 guard rejects modification', false, () => replace('scripts/verify-stage-i-m78-visual-system-foundation-execution.mjs', '// unapproved M109 protected presentation bypass\n'));
  check('M109 protected Board presentation file rejects tampering: assets/js/features/boards/board-schema.ts', false, () => replace('assets/js/features/boards/board-schema.ts', '// unapproved M109 board presentation change\n'));
  check('M109 protected Board presentation file rejects tampering: assets/js/features/boards/controllers/board-menu-controller.ts', false, () => replace('assets/js/features/boards/controllers/board-menu-controller.ts', '// unapproved M109 board presentation change\n'));
  check('M109 protected Board presentation file rejects tampering: assets/js/features/boards/controllers/column-workflows.ts', false, () => replace('assets/js/features/boards/controllers/column-workflows.ts', '// unapproved M109 board presentation change\n'));
  check('M109 protected Board presentation file rejects tampering: assets/js/features/boards/views/table-view.ts', false, () => replace('assets/js/features/boards/views/table-view.ts', '// unapproved M109 board presentation change\n'));

  check('dependency lockfile mutation', false, () => replace('package-lock.json', '{}\n'));
  check('package governance verifier mutation', false, () => replace('scripts/verify-package-governance.mjs', '// tampered governance\n'));
  check('unapproved addition', false, () => {
    const f=path.join(candidate,'scripts','unapproved.mjs'); fs.writeFileSync(f,'x'); return ()=>fs.rmSync(f);
  });
  check('unapproved removal', false, () => {
    const f=path.join(candidate,'verify-auth-backend.mjs'); const b=fs.readFileSync(f); fs.rmSync(f); return ()=>fs.writeFileSync(f,b);
  });
  check('symlink entry', false, () => {
    const f=path.join(candidate,'unexpected-symlink'); fs.symlinkSync('package.json',f);return ()=>fs.rmSync(f);
  });
  check('unapproved predecessor archive', false, undefined, path.join(candidate,'package.json'));
  for (const rel of [
    'scripts/verify-stage-i-m79-design-tokens-semantic-theme-execution.mjs',
    'scripts/verify-stage-i-m81-application-shell-global-navigation-execution.mjs',
    'scripts/verify-stage-i-m82-layout-surface-responsive-composition-execution.mjs',
    'scripts/verify-stage-i-m83-authentication-account-surfaces-execution.mjs',
    'scripts/verify-stage-i-m84-boards-visual-migration-execution.mjs',
    'scripts/verify-stage-i-m88-users-roles-administration-surfaces-execution.mjs',
    'scripts/verify-stage-i-m89-settings-configuration-surfaces-execution.mjs',
    'scripts/verify-stage-i-m98-futuristic-minimalist-production-readiness-certification-execution.mjs',
  ]) {
    check(`deterministic verifier tamper ${rel}`, false, () => replace(rel, '// tampered\n'));
  }
  for (const rel of ['supabase/schema.sql', 'assets/js/core/platform.ts', 'apps/tradelink/app.v1.42.0-wm1.js', 'tests/modern/e2e/settings-functional-recovery.spec.mjs']) {
    check(`inherited protected source tamper ${rel}`, false, () => replace(rel, '// tampered\n'));
  }
  check('restored candidate', true);
  function m83(label, shouldPass, env) {
    const result = spawnSync(process.execPath, ['verify-stage-i-m83-authentication-account-surfaces.mjs'], {
      cwd:candidate, env, encoding:'utf8', maxBuffer:8*1024*1024,
    });
    if ((result.status === 0) !== shouldPass) throw new Error(`M83 ${label} unexpected status=${result.status}\n${result.stdout}\n${result.stderr}`);
    console.log(`PASS: M83 ${label}: ${shouldPass ? 'accepted' : 'rejected'}`);
  }
  m83('approved login provenance', true, process.env);
  const {M108_BASELINE_ARCHIVE: noArchive, ...withoutArchive} = process.env;
  m83('missing predecessor provenance', false, withoutArchive);
  m83('unapproved predecessor provenance', false, {...process.env, M108_BASELINE_ARCHIVE:path.join(candidate, 'package.json')});
  for (const [id, name] of [
    [88, 'users-roles-administration-surfaces'],
    [89, 'settings-configuration-surfaces'],
  ]) {
    const args = [`scripts/verify-stage-i-m${id}-${name}-execution.mjs`];
    const good = spawnSync(process.execPath, args, {cwd:candidate, env:process.env, encoding:'utf8'});
    if (good.status !== 0) throw Error(`M${id} verified M108 inherited authority rejected: ${good.stderr} ${good.stdout}`);
    const {M108_BASELINE_ARCHIVE: unused, ...withoutArchive} = process.env;
    const bad = spawnSync(process.execPath, args, {cwd:candidate, env:withoutArchive, encoding:'utf8'});
    if (bad.status === 0) throw Error(`M${id} accepted missing predecessor archive`);
    const forged = spawnSync(process.execPath, args, {cwd:candidate, env:{...process.env, M108_BASELINE_ARCHIVE:path.join(candidate,'package.json')}, encoding:'utf8'});
    if (forged.status === 0) throw Error(`M${id} accepted substituted predecessor archive`);
    console.log(`PASS: M${id} pinned inherited authority: accepted; missing/substituted archive: rejected`);
  }
  console.log('PASS: M108 successor verifier positive and negative tests (expanded suite)');
} finally { fs.rmSync(temp,{recursive:true,force:true}); }

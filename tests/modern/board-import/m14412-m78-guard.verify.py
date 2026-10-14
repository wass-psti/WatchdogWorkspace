#!/usr/bin/env python3
"""M144.12: independent fail-closed M78 successor tests, in disposable copy only."""
import hashlib
import json
import pathlib
import shutil
import subprocess
import sys
import tempfile

root = pathlib.Path(sys.argv[1]).resolve() if len(sys.argv) > 1 else pathlib.Path(__file__).resolve().parents[3]
verifier = 'scripts/verify-stage-i-m78-visual-system-foundation-execution.mjs'
paths = [
    'assets/css/board-import-wizard.css',
    'assets/js/features/boards/controllers/board-import-wizard-ui.ts',
    'src/features/boards/contracts/import-wizard-commit.ts',
    'src/features/boards/contracts/import-wizard.ts',
    'src/features/boards/import/board-import-wizard-commit.ts',
    'src/features/boards/import/board-import-wizard-plan.ts',
]
sql = 'supabase/m143/board_import_wizard_atomic_DRAFT.sql'
assert (root / verifier).is_file()
for p in paths + [sql]:
    assert (root / p).is_file()

sha = lambda f: hashlib.sha256(f.read_bytes()).hexdigest()
original_hashes = {p: sha(root / p) for p in paths + [sql]}

def check(folder, should_pass, reason):
    proc = subprocess.run(['node', verifier], cwd=folder, capture_output=True, text=True)
    outcome = proc.returncode == 0
    if outcome != should_pass:
        raise AssertionError(f'{reason}: expected pass={should_pass}; got {outcome}: {proc.stderr[-1000:]}')
    return proc.stdout if outcome else proc.stderr

assert 'M143 six exact hash-pinned' in check(root, True, 'canonical successor')
manifest = json.loads((root / 'regression-baseline/m78-m77-protected-presentation.json').read_text())
with tempfile.TemporaryDirectory(prefix='m14412-m78-') as temp:
    test_root = pathlib.Path(temp) / 'root'
    test_root.mkdir()
    # Copy only protected roots and authority inputs; avoid node_modules or generated build trees.
    for protected in manifest['protectedRoots']:
        src = root / protected
        dst = test_root / protected
        if src.is_dir():
            shutil.copytree(src, dst)
        else:
            dst.parent.mkdir(parents=True, exist_ok=True)
            shutil.copy2(src, dst)
    support = ['regression-baseline/m78-m77-protected-presentation.json',
               verifier, sql,
               'spec/M143-TRANSACTION-AND-DEPLOYMENT-BOUNDARIES-NOT-CERTIFIED.md',
               'tests/modern/board-import/m143-contract.verify.mjs']
    for p in support:
        dst = test_root / p
        if not dst.exists():
            dst.parent.mkdir(parents=True, exist_ok=True)
            shutil.copy2(root / p, dst)
    # Authority marker files are not in the protected roots and must be mirrored.
    for marker in (root / 'config').glob('stage-i-m*-*target.ts'):
        dst = test_root / 'config' / marker.name
        dst.parent.mkdir(parents=True, exist_ok=True)
        shutil.copy2(marker, dst)
    for extra in ['M100-M99-BASELINE-SOURCE-MANIFEST.json', 'M101-M100-BASELINE-SOURCE-MANIFEST.json',
                  'M102-M101-BASELINE-SOURCE-MANIFEST.json', 'M103-M102-BASELINE-SOURCE-MANIFEST.json',
                  'scripts/verify-stage-i-m100-m99-source-guard.mjs',
                  'scripts/verify-stage-i-m101-m100-source-guard.mjs',
                  'scripts/verify-stage-i-m102-m101-source-guard.mjs',
                  'scripts/verify-stage-i-m103-m102-source-guard.mjs',
                  'scripts/verify-m109-board-ux.mjs',
                  'M108-MATERIAL-TRACKER-SECURITY-CORRECTIVE.md']:
        source = root / extra
        if source.is_file():
            dst = test_root / extra
            dst.parent.mkdir(parents=True, exist_ok=True)
            shutil.copy2(source, dst)
    check(test_root, True, 'disposable control')
    css = test_root / paths[0]
    css.write_bytes(css.read_bytes() + b'\n/* unauthorized changed style */\n')
    assert 'SHA-256 drift' in check(test_root, False, 'CSS tamper')
    css.write_bytes((root / paths[0]).read_bytes())
    ts = test_root / paths[1]
    ts.write_bytes(ts.read_bytes() + b'\n// unauthorized change\n')
    assert 'SHA-256 drift' in check(test_root, False, 'UI tamper')
    ts.write_bytes((root / paths[1]).read_bytes())
    extra = test_root / 'src/features/boards/import/not-authorized-m14412.ts'
    extra.write_text('export const rogue = true;\n')
    assert 'not successor-authorized' in check(test_root, False, 'unknown protected sibling')
    extra.unlink()
    missing = test_root / paths[5]
    missing.unlink()
    assert 'file missing' in check(test_root, False, 'missing protected wizard file')
    missing.write_bytes((root / paths[5]).read_bytes())
    authority = test_root / sql
    authority.write_bytes(authority.read_bytes() + b'\n-- tampered authority\n')
    assert 'not successor-authorized' in check(test_root, False, 'M143 SQL authority tamper')
    authority.write_bytes((root / sql).read_bytes())
    test_file = test_root / paths[2]
    test_file.chmod(0o755)
    assert 'file mode drift' in check(test_root, False, 'mode tamper')
    test_file.chmod(0o644)
    check(test_root, True, 'disposable restored control')

assert {p: sha(root / p) for p in paths + [sql]} == original_hashes
print('M144.12 M78 successor: PASS (canonical + disposable positive controls, six negative controls, exact source immutability)')

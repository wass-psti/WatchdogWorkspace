#!/usr/bin/env python3
"""Fixture tests for M144.10 strict minimal patch classification, no network."""
import importlib.util,pathlib,subprocess,tempfile,hashlib,json
script=pathlib.Path(__file__).resolve().parents[3]/'scripts/m14410_minimal_patch.py'
spec=importlib.util.spec_from_file_location('patch',script);m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m)
manifest=json.loads((script.parent.parent/'spec/M144_10-PINNED-PATCH.json').read_text())
assert len(manifest['added'])==20 and len(manifest['modified'])==6
assert len({x['path'] for x in manifest['added']+manifest['modified']})==26
assert not any('m1444' in x['path'] or 'm1448' in x['path'] for x in manifest['added']+manifest['modified'])
assert not any(x['path'].startswith('supabase/migrations/') for x in manifest['added']+manifest['modified'])
print('PASS: exact 20 additions + 6 modifications; 19 governance-only files excluded; SQL draft not migrated')
with tempfile.TemporaryDirectory(prefix='m14410-case-') as tmp:
 repo=pathlib.Path(tmp)/'repo';repo.mkdir()
 subprocess.run(['git','init','-q'],cwd=repo,check=True)
 subprocess.run(['git','config','user.email','fixture@example.invalid'],cwd=repo,check=True)
 subprocess.run(['git','config','user.name','Fixture'],cwd=repo,check=True)
 (repo/'base.txt').write_text('old\n')
 subprocess.run(['git','add','.'],cwd=repo,check=True)
 subprocess.run(['git','commit','-qm','fixture'],cwd=repo,check=True)
 assert len(m.tree(repo))==1
 try:m.checkout_preflight(repo);raise AssertionError('unapproved repo was accepted')
 except ValueError:print('PASS: wrong commit/branch refused')
 source=pathlib.Path(tmp)/'source';source.mkdir();(source/'base.txt').write_text('new\n')
 assert m.local(source)['base.txt']!=m.tree(repo)['base.txt']
 (source/'symlink.txt').symlink_to(source/'base.txt')
 try:m.local(source);raise AssertionError('symlink was accepted')
 except ValueError:print('PASS: source symlink rejected')
 (source/'symlink.txt').unlink()
 try:m.expected(repo,source,manifest);raise AssertionError('wrong tree accepted')
 except ValueError:print('PASS: incomplete source tree rejected')
print('M144.10 PATCH GATE SELF-TEST: PASS')

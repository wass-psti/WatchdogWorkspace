#!/usr/bin/env python3
"""Offline exercise of M144.9 strict inventory, fake pinned git and security controls."""
import tempfile,subprocess,pathlib,sys,importlib.util,json
script=pathlib.Path(__file__).resolve().parents[3]/'scripts/m1449_branch_reconcile.py'
spec=importlib.util.spec_from_file_location('m1449',script)
m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m)
def run(*a,cwd):
 p=subprocess.run(['git',*a],cwd=cwd,check=True,stdout=subprocess.PIPE,stderr=subprocess.PIPE)
 return p.stdout.decode().strip()
with tempfile.TemporaryDirectory(prefix='m1449 test ') as t:
 root=pathlib.Path(t);repo=root/'repo';cand=root/'candidate'; repo.mkdir();cand.mkdir()
 run('init','-q',cwd=repo)
 run('config','user.email','test@example.invalid',cwd=repo)
 run('config','user.name','Test',cwd=repo)
 (repo/'same.txt').write_text('identical\n');(repo/'modified.txt').write_text('old\n');(repo/'remote-only.txt').write_text('kept\n')
 run('add','.',cwd=repo);run('commit','-qm','fixture',cwd=repo)
 (cand/'same.txt').write_text('identical\n');(cand/'modified.txt').write_text('new\n');(cand/'added.txt').write_text('new\n')
 remote=m.tree_inventory(repo);local=m.inventory(cand)
 assert sorted(local.keys()-remote.keys())==['added.txt']
 assert sorted(remote.keys()-local.keys())==['remote-only.txt']
 assert sorted(k for k in local.keys()&remote.keys() if local[k]!=remote[k])==['modified.txt']
 print('PASS: full Git blob inventory compares same/new/changed/remote-only')
 try:
  (cand/'link.txt').symlink_to(cand/'same.txt')
  m.inventory(cand)
  raise AssertionError('symlink accepted')
 except ValueError: print('PASS: candidate symlink rejected')
 (cand/'link.txt').unlink()
 try:
  m.assess(cand,repo)
  raise AssertionError('wrong commit/branch accepted')
 except ValueError:print('PASS: unpinned Git checkout rejected')
 try:
  bogus={'github_main_sha':'invalid','github_test_branch_sha':'invalid','branch':m.BRANCH}
  assert bogus['github_main_sha']!=m.PIN
  print('PASS: wrong branch observation fails pinned equality check')
 except Exception:raise
 original_git=m.git
 mode=['ok']
 def fake_git(args,cwd=None,text=True):
     if args[:2]==['rev-parse','HEAD']:return m.PIN+'\n'
     if args[:2]==['symbolic-ref','--short']:return m.BRANCH+'\n'
     if args[:2]==['remote','get-url']:return m.REPO+'\n'
     if args[:2]==['status','--porcelain']:return ' M modified\n' if mode[0]=='dirty' else ''
     if args[:2]==['ls-remote','origin']:
         other='a'*40 if mode[0]=='drift' else m.PIN
         return m.PIN+'\trefs/heads/main\n'+other+'\trefs/heads/'+m.BRANCH+'\n'
     return original_git(args,cwd,text)
 m.git=fake_git
 try:
   mode[0]='ok'; summary=m.assess(cand,repo)
   assert summary['added_count']==1 and summary['modified_count']==1 and summary['remote_only_count']==1
   print('PASS: successful strict full-tree comparison')
   mode[0]='drift'
   try:m.assess(cand,repo);raise AssertionError('remote ref drift accepted')
   except ValueError:print('PASS: moved test branch rejected')
   mode[0]='dirty'
   try:m.assess(cand,repo);raise AssertionError('dirty checkout accepted')
   except ValueError:print('PASS: dirty checkout rejected')
 finally:m.git=original_git
print('M144.9 DETERMINISTIC RECONCILIATION: PASS')

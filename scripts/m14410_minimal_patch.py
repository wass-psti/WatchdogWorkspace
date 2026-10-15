#!/usr/bin/env python3
"""M144.10 pinned, minimal, fail-closed Git test-branch patch preparation; NO pushes."""
import argparse,hashlib,json,os,pathlib,shutil,subprocess,sys
PIN='ed390940b56be6c4495347aae37593e9a34b4446'
REMOTE='https://github.com/wass-psti/WatchdogWorkspace.git'
BRANCH='m1449/board-import-qa'

def git(args,cwd,text=True):
    p=subprocess.run(['git','-C',str(cwd),*args],capture_output=True,check=False)
    if p.returncode:raise ValueError(f'git {args[0]} failed: '+p.stderr.decode(errors='replace')[:300])
    return p.stdout.decode() if text else p.stdout

def blob(data):return hashlib.sha1(b'blob '+str(len(data)).encode()+b'\x00'+data).hexdigest()

def tree(repo):
    found={}
    for entry in git(['ls-tree','-rz','HEAD'],repo,False).split(b'\x00'):
        if not entry:continue
        meta,path=entry.split(b'\t',1);mode,kind,sha=meta.decode().split(' ')
        if kind!='blob' or mode not in ('100644','100755'):raise ValueError('unsupported git object or symbolic link')
        name=path.decode('utf-8');found[name]=sha
    return found

def local(root):
    d={};root=pathlib.Path(root)
    for base,dirs,files in os.walk(root,followlinks=False):
        dirs[:]=sorted(x for x in dirs if x not in ('.git','node_modules'))
        for f in sorted(files):
            p=pathlib.Path(base)/f
            if p.is_symlink() or not p.is_file():raise ValueError('source symlink or non-file forbidden')
            d[p.relative_to(root).as_posix()]=blob(p.read_bytes())
    return d

def expected(repo,source,patch):
    if patch.get('schema')!='watchdogworkspace.m14410.minimal-board-import-patch.v1' or patch.get('commit')!=PIN or patch.get('branch')!=BRANCH:raise ValueError('manifest identity mismatch')
    adds=patch['added'];mods=patch['modified']
    if len(adds)!=20 or len(mods)!=6:raise ValueError('incorrect patch scope')
    if any(not isinstance(e.get('path'),str) or e['path'].startswith('/') or '..' in pathlib.PurePosixPath(e['path']).parts for e in adds+mods):raise ValueError('unsafe patch path')
    paths=[e['path'] for e in adds+mods]
    if len(set(paths))!=26:raise ValueError('duplicate patch paths')
    original=tree(repo)
    source_inv=local(source)
    if len(original)!=2790 or len(source_inv)!=2810:raise ValueError('unexpected main or minimal source inventory')
    addpaths=set(e['path'] for e in adds); modpaths=set(e['path'] for e in mods)
    if source_inv.keys()-original.keys()!=addpaths or original.keys()-source_inv.keys():raise ValueError('unexpected added/remote-only paths')
    changed={p for p in source_inv.keys()&original.keys() if source_inv[p]!=original[p]}
    if changed!=modpaths:raise ValueError('unexpected modified paths')
    for e in adds:
        if source_inv[e['path']]!=e['candidate_git_sha1']:raise ValueError('added SHA mismatch '+e['path'])
    for e in mods:
        path=e['path']
        if source_inv[path]!=e['candidate_git_sha1'] or original[path]!=e['remote_git_sha1']:
            raise ValueError('modified SHA mismatch '+path)
    return source_inv,original

def checkout_preflight(repo):
    if git(['rev-parse','HEAD'],repo).strip()!=PIN:raise ValueError('stale HEAD')
    if git(['symbolic-ref','--short','HEAD'],repo).strip()!=BRANCH:raise ValueError('incorrect Git branch')
    if git(['remote','get-url','origin'],repo).strip() not in (REMOTE,'git@github.com:wass-psti/WatchdogWorkspace.git'):raise ValueError('wrong remote origin')
    if git(['status','--porcelain'],repo).strip():raise ValueError('checkout not clean')
    refs=git(['ls-remote','origin','refs/heads/main','refs/heads/'+BRANCH],repo)
    actual={parts[1]:parts[0] for l in refs.splitlines() if (parts:=l.split())}
    if actual!={'refs/heads/main':PIN,'refs/heads/'+BRANCH:PIN}:raise ValueError('remote moved; stop and reconcile')

def prepare(repo,source,manifest,out):
    patch=json.loads(pathlib.Path(manifest).read_text())
    if pathlib.Path(out).exists() or pathlib.Path(out).is_symlink():raise ValueError('output already exists')
    checkout_preflight(repo)
    original,remote=expected(repo,source,patch)
    for path in [e['path'] for e in patch['added']+patch['modified']]:
        src=pathlib.Path(source)/path;dst=pathlib.Path(repo)/path
        if dst.is_symlink() or (dst.exists() and not dst.is_file()):raise ValueError('unsafe target '+path)
        dst.parent.mkdir(parents=True,exist_ok=True)
        shutil.copyfile(src,dst)
        if blob(dst.read_bytes())!=original[path]:raise ValueError('copy mismatch '+path)
    after=local(repo)
    if after!=original:raise ValueError('resulting checkout differs from the fully verified minimal candidate')
    changes=git(['status','--porcelain','--untracked-files=all'],repo).splitlines()
    observed=set()
    for line in changes:
        if not len(line)>3:continue
        observed.add(line[3:])
    allowed={e['path'] for e in patch['added']+patch['modified']}
    if observed!=allowed:raise ValueError('unexpected Git checkout delta '+repr(sorted(observed^allowed)))
    data={'schema':'watchdogworkspace.m14410.prepared-branch.v1','source_members':2810,'remote_members':2790,'preserved':2784,'additions':20,'modifications':6,'remote_only':0,'patch_files':sorted(allowed),'main_and_branch_pinned':PIN,'ready_for_further_local_ci':True,'git_commit_performed':False,'git_push_performed':False,'hosted_write_performed':False,'main_push_approved':False}
    pathlib.Path(out).write_text(json.dumps(data,sort_keys=True,indent=2)+'\n')
    print('PASS: exact minimal Board Import patch prepared in local Git checkout: 20 adds, 6 modifications, 0 deletions')
    print('NO git commit, push, or hosted database writes performed.')

def main():
    p=argparse.ArgumentParser();p.add_argument('--checkout',required=True);p.add_argument('--source',required=True);p.add_argument('--manifest',required=True);p.add_argument('--output',required=True);a=p.parse_args()
    prepare(pathlib.Path(a.checkout),pathlib.Path(a.source),pathlib.Path(a.manifest),pathlib.Path(a.output))
if __name__=='__main__':
    try:main()
    except Exception as e: print('BLOCKED: M144.10 '+str(e),file=sys.stderr);sys.exit(2)

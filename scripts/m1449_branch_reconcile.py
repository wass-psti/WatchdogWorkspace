#!/usr/bin/env python3
"""M144.9 read-only GitHub test-branch full-tree reconciliation; never pushes."""
import argparse,hashlib,json,pathlib,subprocess,sys,os

PIN='ed390940b56be6c4495347aae37593e9a34b4446'
REPO='https://github.com/wass-psti/WatchdogWorkspace.git'
BRANCH='m1449/board-import-qa'
SNAPSHOT='spec/M144_9-GITHUB-BRANCH-SNAPSHOT.json'

def git(args, cwd=None, text=True):
    proc=subprocess.run(['git',*(['-C',str(cwd)] if cwd else []),*args],check=False,stdout=subprocess.PIPE,stderr=subprocess.PIPE)
    if proc.returncode:raise RuntimeError('git command failed: '+(' '.join(args))+'; '+proc.stderr.decode('utf-8','replace')[:300])
    return proc.stdout.decode() if text else proc.stdout

def blob_id(data):
    return hashlib.sha1(b'blob '+str(len(data)).encode()+b'\0'+data).hexdigest()

def inventory(directory):
    directory=pathlib.Path(directory)
    result={}
    for root,dirs,files in os.walk(directory,followlinks=False):
        dirs[:]=sorted(d for d in dirs if d!='.git')
        for file in sorted(files):
            p=pathlib.Path(root)/file
            if p.is_symlink() or not p.is_file():raise ValueError('untrusted symlink or nonregular source: '+str(p))
            rel=p.relative_to(directory).as_posix()
            if rel.startswith('../') or '\\' in rel:raise ValueError('unsafe source path')
            result[rel]=blob_id(p.read_bytes())
    return result

def tree_inventory(repo):
    raw=git(['ls-tree','-rz','HEAD'],cwd=repo,text=False)
    out={}
    for part in raw.split(b'\x00'):
        if not part:continue
        metadata,path=part.split(b'\t',1)
        mode,kind,sha=metadata.decode().split(' ')
        if kind!='blob' or mode not in ('100644','100755'):
            raise ValueError('Git tree contains unsupported kind or symlink: '+path.decode('utf-8','replace'))
        key=path.decode('utf-8')
        if key in out:raise ValueError('duplicate Git path')
        out[key]=sha
    return out

def assess(candidate, repo, pinned=PIN):
    head=git(['rev-parse','HEAD'],cwd=repo).strip()
    branch=git(['symbolic-ref','--short','HEAD'],cwd=repo).strip()
    if head!=pinned or branch!=BRANCH:raise ValueError('wrong checkout commit or branch; expected pinned test branch')
    remotes=git(['remote','get-url','origin'],cwd=repo).strip()
    if remotes not in (REPO,'git@github.com:wass-psti/WatchdogWorkspace.git'):
        raise ValueError('wrong GitHub origin')
    status=git(['status','--porcelain'],cwd=repo).strip()
    if status:raise ValueError('GitHub checkout is not clean')
    refs=git(['ls-remote','origin','refs/heads/main','refs/heads/'+BRANCH],cwd=repo)
    found={r.split()[1]:r.split()[0] for r in refs.strip().splitlines() if r.strip()}
    expect={'refs/heads/main':pinned,'refs/heads/'+BRANCH:pinned}
    if found!=expect:raise ValueError('remote main/test branch moved; stale baseline; refuse reconciliation')
    original=tree_inventory(repo)
    candidate_inv=inventory(candidate)
    added=sorted(candidate_inv.keys()-original.keys())
    missing=sorted(original.keys()-candidate_inv.keys())
    changed=sorted(k for k in (original.keys()&candidate_inv.keys()) if original[k]!=candidate_inv[k])
    identical=len(candidate_inv)-len(added)-len(changed)
    main_safe=not missing
    return {'schema':'watchdogworkspace.m1449.git-reconcile.v1',
      'github_repository':'wass-psti/WatchdogWorkspace','pinned_commit':pinned,
      'source_members':len(candidate_inv),'git_main_tracked_blobs':len(original),
      'identical':identical,'added_count':len(added),'modified_count':len(changed),'remote_only_count':len(missing),
      'added':[{'path':k,'candidate_git_sha1':candidate_inv[k]} for k in added],
      'modified':[{'path':k,'candidate_git_sha1':candidate_inv[k],'remote_git_sha1':original[k]} for k in changed],
      'remote_only':[{'path':k,'remote_git_sha1':original[k]} for k in missing],
      'auto_deploy_approved':False,'github_push_performed':False,'backend_write_tests_performed':False,
      'direct_main_push_approved':False,'all_remote_files_present_in_candidate':main_safe,
      'decision':'DIFF_READY_FOR_MANUAL_SECURITY_REVIEW; NO AUTO PUSH; NO RELEASE CERTIFICATION'}

def main():
    a=argparse.ArgumentParser()
    a.add_argument('--candidate',required=True)
    a.add_argument('--checkout',required=True)
    a.add_argument('--output',required=True)
    a.add_argument('--snapshot',required=True)
    x=a.parse_args()
    candidate=pathlib.Path(x.candidate)
    snap=json.loads(pathlib.Path(x.snapshot).read_text())
    if snap['github_main_sha']!=PIN or snap['github_test_branch_sha']!=PIN or snap['branch']!=BRANCH:
        raise ValueError('Pinned branch snapshot mismatch')
    result=assess(candidate,x.checkout)
    output=pathlib.Path(x.output)
    if output.exists() or output.is_symlink():raise ValueError('output already exists, refusing overwrite')
    output.write_text(json.dumps(result,indent=2,sort_keys=True)+'\n')
    print(f"PASS: read-only full-tree reconciliation {result['identical']} identical, {result['added_count']} candidate-only, {result['modified_count']} modified, {result['remote_only_count']} remote-only")
    print('SAFE BOUNDARY: no GitHub pushes, no commits, no hosted writes')

if __name__=='__main__':
    try: main()
    except Exception as e:
        print('BLOCKED: M144.9 '+str(e),file=sys.stderr)
        sys.exit(2)

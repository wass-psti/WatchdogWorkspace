#!/usr/bin/env python3
"""M144.5 local QA successor full-archive gate. Python 3.9+, stdlib.

Only three additional files are permitted over the authenticated M144.4 archive.
This program does not access networks, hosted databases, GitHub or production.
"""
import argparse
import hashlib
import json
import os
from pathlib import Path
import sys
import zipfile

import m1444_source_governance as prior

M1444_SHA='40a9047817608408d4fa706ac6fc4145acaf560d9e07cedad006460005203adc'
M1444_MANIFEST_SHA='8357d19b8a2a31f84f9fa7e6978373d0f57582122b29a48818ba7ff5555dc045'
ROOT='WatchdogWorkspace-M144_5-Local-DB-Security-QA-NOT-RELEASE-CERTIFIED'
ALLOW=(
  'M144_5-DISPOSABLE-DB-AND-SECURITY-BOUNDARY.md',
  'scripts/m1445_disposable_pg_qa.sh',
  'scripts/m1445_source_governance.py',
)
SCHEMA='watchdogworkspace.m1445.qa-source-manifest.v1'

def reject(s): raise ValueError(s)

def canonical(data):return (json.dumps(data,sort_keys=True,indent=2,ensure_ascii=True)+'\n').encode()

def contents(predecessor, predecessor_1442, manifest_1444, successor):
    if prior.file_digest(predecessor)!=M1444_SHA:reject('M144.4 predecessor SHA-256 mismatch')
    if prior.file_digest(manifest_1444)!=M1444_MANIFEST_SHA:reject('M144.4 predecessor manifest SHA-256 mismatch')
    prior.verify(argparse.Namespace(archive=predecessor,predecessor=predecessor_1442,manifest=manifest_1444,tree=None))
    old,oldroot=prior.archive_contents(predecessor)
    new,newroot=prior.archive_contents(successor)
    if oldroot!='WatchdogWorkspace-M144_4-Governance-Review-NOT-RELEASE-CERTIFIED' or newroot!=ROOT:
        reject('incorrect source package root')
    earlier={n.partition('/')[2]:v for n,v in old}
    current={n.partition('/')[2]:v for n,v in new}
    additions=set(current)-set(earlier)
    mutations={name for name in set(current)&set(earlier) if current[name]!=earlier[name]}
    deletions=set(earlier)-set(current)
    if additions!=set(ALLOW) or mutations or deletions:
        reject('unauthorized source delta: added=%s modified=%s removed=%s' % (sorted(additions),sorted(mutations),sorted(deletions)))
    if current[prior.RPC_REL]['sha256']!=prior.RPC_SHA256:reject('M143 SQL altered')
    prior.ensure_sql_in_zip(successor,newroot)
    return new,newroot,len(earlier)

def manifest_for(args):
    members,root,predecessor_count=contents(args.predecessor,args.predecessor_1442,args.manifest_1444,args.archive)
    return dict(
      schema=SCHEMA,release_certification='WITHHELD',
      source_archive=args.archive.name,
      source_archive_sha256=prior.file_digest(args.archive),
      source_root=root,
      predecessor_archive=args.predecessor.name,
      predecessor_sha256=M1444_SHA,
      predecessor_manifest_sha256=M1444_MANIFEST_SHA,
      predecessor_count=predecessor_count,
      allowed_additions=list(ALLOW),allowed_mutations=[],allowed_removals=[],
      current_count=len(members),m143_sql_sha256=prior.RPC_SHA256,
      migration_status='DRAFT ONLY; ISOLATED TEST EXECUTION DOES NOT DEPLOY',
      entries=[dict(path=n.partition('/')[2],**v) for n,v in members]
    )

def main():
    p=argparse.ArgumentParser()
    p.add_argument('operation',choices=('create','verify'))
    p.add_argument('--archive',type=Path,required=True)
    p.add_argument('--predecessor',type=Path,required=True)
    p.add_argument('--predecessor-1442',type=Path,required=True)
    p.add_argument('--manifest-1444',type=Path,required=True)
    p.add_argument('--manifest',type=Path)
    p.add_argument('--output',type=Path)
    p.add_argument('--tree',type=Path)
    a=p.parse_args()
    generated=manifest_for(a)
    if a.operation=='create':
        if a.output is None or a.output.exists():reject('output must be a new file')
        a.output.write_bytes(canonical(generated))
        print('M144.5 SOURCE MANIFEST CREATED: %s files, three authorized additions' % generated['current_count'])
    else:
        if a.manifest is None or not a.manifest.is_file():reject('source manifest missing')
        if a.manifest.read_bytes()!=canonical(generated):reject('source manifest differs from authoritative inventory')
        if a.tree:
            tree=a.tree.resolve(strict=True)
            if not tree.is_dir() or tree.name!=ROOT:reject('wrong extracted tree directory')
            observed={}
            for directory,subdirs,files in os.walk(tree,followlinks=False):
                for dn in subdirs:
                    if (Path(directory)/dn).is_symlink():reject('source tree contains symlinked directory')
                for fname in files:
                    f=Path(directory)/fname
                    if f.is_symlink() or not f.is_file():reject('source tree contains nonregular file')
                    rel=f.relative_to(tree).as_posix()
                    prior.normalized_path(rel)
                    observed[rel]={'sha256':prior.file_digest(f),'bytes':f.stat().st_size}
            expected={m['path']:{'sha256':m['sha256'],'bytes':m['bytes']} for m in generated['entries']}
            if observed!=expected:reject('untracked/mutated/missing extracted source file')
        print('PASS: M144.4 pinned, %s M144.5 members authenticated; exactly three additions and zero mutations; no migration enabled' % generated['current_count'])

if __name__=='__main__':
    try:main()
    except (OSError,ValueError,KeyError,zipfile.BadZipFile,RuntimeError) as exc:
        print('M144.5 SOURCE INTEGRITY FAILED: %s'%exc,file=sys.stderr)
        sys.exit(2)

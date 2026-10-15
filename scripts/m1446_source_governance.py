#!/usr/bin/env python3
"""M144.6 fail-closed full-source verification and external SHA manifest."""
import argparse
import hashlib
import json
import os
from pathlib import Path
import sys
import zipfile
import m1445_source_governance as previous

PIN_PREV = '815457a5872ed86ae4280b73f5a2fd098ef95229aee9fdfcc92be3dfc1497a9d'
PIN_PREV_MANIFEST = 'c119c9551c7e13d9353f5591174e0622e80c0ee53a2e37092e4181ee39fb8a09'
ROOT = 'WatchdogWorkspace-M144_6-Staging-Readiness-NOT-RELEASE-CERTIFIED'
ALLOWED = (
    'M144_6-STAGING-READINESS-BOUNDARY.md',
    'scripts/m1446_source_governance.py',
    'scripts/m1446_staging_readiness.py',
    'supabase/m1446/staging_catalog_READ_ONLY.sql',
)
SCHEMA = 'watchdogworkspace.m1446.source-manifest.v1'

def reject(msg):
    raise ValueError(msg)

def canonical(value):
    return (json.dumps(value, sort_keys=True, indent=2, ensure_ascii=True)+'\n').encode()

def generate(args):
    if previous.prior.file_digest(args.predecessor) != PIN_PREV:
        reject('M144.5 predecessor hash mismatch')
    if previous.prior.file_digest(args.manifest_1445) != PIN_PREV_MANIFEST:
        reject('M144.5 predecessor manifest hash mismatch')
    old = argparse.Namespace(
        archive=args.predecessor, predecessor=args.predecessor_1444,
        predecessor_1442=args.predecessor_1442,
        manifest_1444=args.manifest_1444, manifest=args.manifest_1445,
        tree=None,
    )
    # Verify the entire M144.2.5 -> M144.4 -> M144.5 predecessor chain.
    old_manifest = previous.manifest_for(old)
    if args.manifest_1445.read_bytes() != previous.canonical(old_manifest):
        reject('M144.5 manifest contents are inconsistent')
    predecessor, old_root = previous.prior.archive_contents(args.predecessor)
    current, root = previous.prior.archive_contents(args.archive)
    if old_root != previous.ROOT or root != ROOT:
        reject('source archive root identity changed')
    before = {p.partition('/')[2]: meta for p,meta in predecessor}
    after = {p.partition('/')[2]: meta for p,meta in current}
    additions = set(after) - set(before)
    mutations = {p for p in before.keys() & after.keys() if before[p] != after[p]}
    removals = set(before)-set(after)
    if additions != set(ALLOWED) or mutations or removals:
        reject('unauthorized delta: additions=%r modifications=%r deletions=%r' %
               (sorted(additions), sorted(mutations), sorted(removals)))
    rpc = 'supabase/m143/board_import_wizard_atomic_DRAFT.sql'
    if after[rpc]['sha256'] != previous.prior.RPC_SHA256:
        reject('M143 SQL draft was modified')
    previous.prior.ensure_sql_in_zip(args.archive, root)
    sql_check='supabase/m1446/staging_catalog_READ_ONLY.sql'
    with zipfile.ZipFile(args.archive) as z:
        sql=z.read(root+'/'+sql_check).decode('utf-8')
    lowered=sql.lower()
    if not ('begin transaction read only' in lowered and 'commit;' in lowered):
        reject('staging catalog must use explicit read-only transaction')
    if any(x in lowered for x in ('create table','create or replace','drop table','drop function','insert into','update public.', 'delete from')):
        reject('unexpected mutating SQL found in catalog packet')
    return {
        'schema':SCHEMA,'status':'SOURCE-INTEGRITY-VERIFIED; STAGING-UNEXECUTED',
        'release_certification':'WITHHELD',
        'source_archive':args.archive.name,
        'source_sha256':previous.prior.file_digest(args.archive),
        'source_root':root,
        'predecessor_sha256':PIN_PREV,
        'predecessor_manifest_sha256':PIN_PREV_MANIFEST,
        'predecessor_files':len(predecessor),
        'current_files':len(current),
        'allowed_additions':list(ALLOWED),
        'modified_files':[], 'removed_files':[],
        'm143_draft_sql_sha256':previous.prior.RPC_SHA256,
        'm143_deployed_by_this_checkpoint':False,
        'entries':[{'path':p.partition('/')[2],**meta} for p,meta in current],
    }

def check_extracted(args, doc):
    tree=args.tree
    if tree is None:return
    if tree.is_symlink() or not tree.is_dir() or tree.name != ROOT:
        reject('invalid extracted source tree')
    observed={}
    for here, directories, files in os.walk(tree,followlinks=False):
        for name in directories:
            p=Path(here)/name
            if p.is_symlink():reject('symlink directory in extracted tree')
        for name in files:
            p=Path(here)/name
            if p.is_symlink() or not p.is_file():reject('symlink or nonregular extracted file')
            relative=p.relative_to(tree).as_posix()
            previous.prior.normalized_path(relative)
            observed[relative]={'sha256':previous.prior.file_digest(p),'bytes':p.stat().st_size}
    expected={r['path']:{'sha256':r['sha256'],'bytes':r['bytes']} for r in doc['entries']}
    if observed != expected:
        reject('source tree has added/missing/changed files')

def main():
    ap=argparse.ArgumentParser()
    ap.add_argument('command', choices=['create','verify'])
    for arg in ('archive','predecessor','predecessor_1444','predecessor_1442','manifest_1444','manifest_1445'):
        ap.add_argument('--'+arg.replace('_','-'),required=True,type=Path)
    ap.add_argument('--manifest',type=Path)
    ap.add_argument('--output',type=Path)
    ap.add_argument('--tree',type=Path)
    args=ap.parse_args()
    doc=generate(args)
    if args.command=='create':
        if args.output is None or args.output.exists():reject('new manifest output required')
        args.output.write_bytes(canonical(doc))
        print('M144.6 source manifest created:',doc['current_files'],'files')
    else:
        if args.manifest is None or not args.manifest.is_file():reject('M144.6 source manifest missing')
        if args.manifest.read_bytes()!=canonical(doc):reject('M144.6 source manifest mismatch')
        check_extracted(args,doc)
        print('PASS: authenticated M144.5 predecessor and all %s current files; exactly four additions; M143 draft unchanged' % doc['current_files'])

if __name__=='__main__':
    try:main()
    except (OSError,ValueError,KeyError,zipfile.BadZipFile) as exc:
        print('BLOCKED: M144.6 source gate:',exc,file=sys.stderr)
        sys.exit(2)

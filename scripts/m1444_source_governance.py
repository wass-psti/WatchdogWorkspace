#!/usr/bin/env python3
"""WatchdogWorkspace M144.4 non-release source/archive governance. Python 3.9+ stdlib only.

No database, network, application-state writes, migration execution, or deployment APIs.
The historical CHECKSUMS.sha256 remains intact. The current complete inventory is a
sidecar document external to the complete successor source ZIP, avoiding self-reference.
"""
import argparse
import hashlib
import json
import os
from pathlib import Path, PurePosixPath
import re
import sys
import zipfile

SCHEMA = 'watchdogworkspace.m1444.source-manifest.v1'
PREDECESSOR_SHA256 = '78d6c4b35b2fea4a01aa1e0ff1485ee9de77d747db569bf4c61d786b603572e4'
RPC_REL = 'supabase/m143/board_import_wizard_atomic_DRAFT.sql'
RPC_SHA256 = 'b883b3c432ae5ebcadd9fda2f15b5bcdeb0cff9448ace4862c6fb88fd5fd37fc'
AUTHORIZED_ADDITIONS = (
    'M144_4-GOVERNANCE-AND-STAGING-BOUNDARIES.md',
    'scripts/m1444_source_governance.py',
)
MAX_MEMBERS=10000
MAX_UNCOMPRESSED_BYTES=500_000_000


def fail(message):
    raise ValueError(message)


def sha(data):
    return hashlib.sha256(data).hexdigest()


def file_digest(filename):
    h=hashlib.sha256()
    with open(filename,'rb') as f:
        for part in iter(lambda:f.read(1024*1024),b''):
            h.update(part)
    return h.hexdigest()


def normalized_path(path):
    # A ZIP must represent one deterministic portable relative POSIX tree.
    if not isinstance(path,str) or not path or '\\' in path or '\x00' in path:
        fail('invalid archive filename')
    p=PurePosixPath(path)
    if p.is_absolute() or path.startswith('/') or re.match(r'^[A-Za-z]:',path):
        fail('absolute path in archive')
    if any(part in ('','.', '..') for part in path.split('/')) or path.endswith('/'):
        fail('traversal, directory, or noncanonical archive path: '+path)
    if p.as_posix()!=path:
        fail('noncanonical archive path: '+path)
    return path


def archive_contents(archive):
    found={}
    lowered=set()
    total=0
    with zipfile.ZipFile(archive,'r') as z:
        infos=z.infolist()
        if not infos or len(infos)>MAX_MEMBERS:fail('unexpected ZIP member count')
        for i in infos:
            n=normalized_path(i.filename)
            if n in found or n.casefold() in lowered:fail('duplicate or casefold-colliding ZIP member: '+n)
            lowered.add(n.casefold())
            mode=i.external_attr>>16
            if i.is_dir() or (mode and not (mode&0o170000)==0o100000):
                fail('archive contains directory or non-regular file: '+n)
            if i.file_size>MAX_UNCOMPRESSED_BYTES:fail('oversized ZIP member: '+n)
            total+=i.file_size
            if total>MAX_UNCOMPRESSED_BYTES:fail('unexpected ZIP expanded size')
            with z.open(i,'r') as handle:
                h=hashlib.sha256();length=0
                for chunk in iter(lambda:handle.read(1024*1024),b''):
                    length+=len(chunk);h.update(chunk)
            if length!=i.file_size:fail('incorrect ZIP file length: '+n)
            found[n]={'sha256':h.hexdigest(),'bytes':length}
    roots={n.partition('/')[0] for n in found}
    if len(roots)!=1 or any('/' not in n for n in found):fail('ZIP requires exactly one root directory')
    return sorted(found.items()),next(iter(roots))


def check_predecessor(predecessor, archive):
    if file_digest(predecessor)!=PREDECESSOR_SHA256:fail('M144.2.5 predecessor SHA256 differs from pinned authority')
    older,oldroot=archive_contents(predecessor)
    newer,newroot=archive_contents(archive)
    om={n.partition('/')[2]:v for n,v in older}
    nm={n.partition('/')[2]:v for n,v in newer}
    if oldroot!='WatchdogWorkspace-M144_2_5-Review-Candidate-NOT-RELEASE-CERTIFIED':fail('wrong predecessor root')
    if newroot!='WatchdogWorkspace-M144_4-Governance-Review-NOT-RELEASE-CERTIFIED':fail('wrong successor root')
    removed=set(om)-set(nm)
    mutated={k for k in set(om)&set(nm) if om[k]!=nm[k]}
    added=set(nm)-set(om)
    if removed or mutated or added!=set(AUTHORIZED_ADDITIONS):
        fail('unauthorized successor change: removed=%r mutated=%r added=%r' % (sorted(removed)[:12],sorted(mutated)[:12],sorted(added)[:12]))
    if nm[RPC_REL]['sha256']!=RPC_SHA256:fail('RPC SQL changed')
    return newer,newroot,len(older)


def sql_static_guard(sql):
    if sha(sql)!=RPC_SHA256:fail('SQL draft digest mismatch')
    lower=sql.decode('utf-8').lower()
    if len(re.findall(r"errcode\s*=\s*'pt409'",lower))!=9 or re.search(r"errcode\s*=\s*'40001'",lower):
        fail('M143 conflict mapping not exactly 9 PT409 and 0 40001')
    for required in (
        'security definer', 'set search_path = pg_catalog, public',
        'revoke all on function public.wm_import_board_wizard_atomic(uuid,timestamptz,jsonb) from public,anon,authenticated;',
        'grant execute on function public.wm_import_board_wizard_atomic(uuid,timestamptz,jsonb) to authenticated;',
        "public.work_board_access(p_board_id,'edit')", 'actor uuid := auth.uid();',
    ):
        if required not in lower:fail('missing static SQL security declaration: '+required)
    return True


def ensure_sql_in_zip(archive,root):
    with zipfile.ZipFile(archive) as z:
        sql=z.read(root+'/'+RPC_REL)
        names=[n for n in z.namelist() if n.startswith(root+'/supabase/migrations/')]
    with zipfile.ZipFile(archive) as z:
        if any(b'wm_import_board_wizard_atomic' in z.read(n) for n in names):
            fail('M143 has been activated in automatic migration directory')
    return sql_static_guard(sql)


def create_manifest(args):
    newer,root,oldcount=check_predecessor(args.predecessor,args.archive)
    ensure_sql_in_zip(args.archive,root)
    report={
      'schema':SCHEMA,
      'certification':'NOT RELEASE CERTIFIED',
      'source_archive':Path(args.archive).name,
      'source_archive_sha256':file_digest(args.archive),
      'source_root':root,
      'predecessor_archive':Path(args.predecessor).name,
      'predecessor_sha256':PREDECESSOR_SHA256,
      'predecessor_file_count':oldcount,
      'authorized_additions':list(AUTHORIZED_ADDITIONS),
      'authorized_modifications':[],
      'authorized_removals':[],
      'file_count':len(newer),
      'm143_sql_sha256':RPC_SHA256,
      'm143_migration_status':'DRAFT ONLY — not under supabase/migrations',
      'entries':[{'path':n.partition('/')[2],**v} for n,v in newer]
    }
    output=Path(args.output)
    if output.exists():fail('manifest already exists (overwrite prohibited)')
    output.parent.mkdir(parents=True,exist_ok=True)
    output.write_text(json.dumps(report,sort_keys=True,ensure_ascii=True,indent=2)+'\n',encoding='utf-8')
    print('SOURCE MANIFEST GENERATED: %d current source files, %d predecessor files, two additions' %(len(newer),oldcount))
    print('MANIFEST SHA256: '+file_digest(output))


def verify(args):
    manifest_file=Path(args.manifest)
    report=json.loads(manifest_file.read_text(encoding='utf-8'))
    if not isinstance(report,dict) or report.get('schema')!=SCHEMA:fail('unknown manifest schema')
    if report.get('predecessor_sha256')!=PREDECESSOR_SHA256:fail('predecessor manifest identity mismatch')
    if report.get('authorized_additions')!=list(AUTHORIZED_ADDITIONS):fail('allowlist mismatch')
    if report.get('authorized_modifications')!=[] or report.get('authorized_removals')!=[]:fail('unauthorized delta declared')
    if report.get('source_archive')!=Path(args.archive).name:fail('archive filename mismatch')
    if report.get('source_archive_sha256')!=file_digest(args.archive):fail('archive SHA256 mismatch')
    newer,root,oldcount=check_predecessor(args.predecessor,args.archive)
    if root!=report.get('source_root') or oldcount!=report.get('predecessor_file_count'):fail('root or predecessor count differs')
    if report.get('file_count')!=len(newer) or report.get('m143_sql_sha256')!=RPC_SHA256:fail('manifest count/SQL metadata mismatch')
    wanted=[{'path':n.partition('/')[2],**v} for n,v in newer]
    if wanted!=report.get('entries'):fail('manifest file inventory mismatch')
    ensure_sql_in_zip(args.archive,root)
    if getattr(args,'tree',None):
        tree=Path(args.tree).resolve(strict=True)
        if not tree.is_dir() or tree.name!=root:fail('wrong extracted tree root')
        observed={}
        for dirname,subdirs,files in os.walk(tree,followlinks=False):
            for dn in subdirs:
                if (Path(dirname)/dn).is_symlink():fail('symlink directory in tree')
            for name in files:
                p=Path(dirname)/name
                if p.is_symlink() or not p.is_file():fail('nonregular file in tree: '+str(p))
                rel=p.relative_to(tree).as_posix()
                normalized_path(rel)
                observed[rel]={'sha256':file_digest(p),'bytes':p.stat().st_size}
        if observed!={x['path']:{'sha256':x['sha256'],'bytes':x['bytes']} for x in wanted}:
            fail('extracted tree differs from sealed archive (including untracked files)')
    print('PASS: exact pinned predecessor; all %d successor source files SHA256 verified; only %d authorized additions; SQL remains un-deployed draft' %(len(newer),len(AUTHORIZED_ADDITIONS)))
    return report


def stage_review(args):
    report=verify(args)
    destination=Path(args.output).resolve()
    if destination.exists():fail('staging review destination already exists')
    archive=Path(args.archive).resolve(strict=True)
    predecessor=Path(args.predecessor).resolve(strict=True)
    manifest=Path(args.manifest).resolve(strict=True)
    if destination==archive.parent or destination==predecessor.parent or destination==manifest.parent:
        fail('unsafe output destination')
    root=report['source_root']
    with zipfile.ZipFile(archive) as z:
        sql=z.read(root+'/'+RPC_REL)
    sql_static_guard(sql)
    # Data-only review packet; never copy into automatic migration locations.
    destination.mkdir(parents=True,exist_ok=False)
    staged_sql=destination/'board_import_wizard_atomic_STAGING_REVIEW_ONLY.sql'
    staged_sql.write_bytes(sql)
    data={
      'status':'REVIEW ONLY — NOT APPLIED',
      'source_archive':report['source_archive'],
      'source_archive_sha256':report['source_archive_sha256'],
      'source_sql':RPC_REL,
      'source_sql_sha256':RPC_SHA256,
      'staged_sql_sha256':file_digest(staged_sql),
      'controls':{'production_sql_execution':False,'staging_sql_execution':False,'github_push':False,'automatic_migration_enabled':False},
      'review_requirements':[
        'Confirm dedicated nonproduction Supabase project and explicit deployment authorization',
        'Review chronological prerequisite migrations and objects including work_board_access, wm_set_board_cell, work_board_log',
        'Review SECURITY DEFINER owner, search_path, privileges, RLS, current hosted schema and version compatibility',
        'Test migration in disposable database transaction with rollback and no partial writes',
        'Run real GoTrue/PostgREST authenticated editor/viewer/outsider/anonymous/expired/tampered-token cases',
        'Test 409 stale Board/Item conflicts, Add/Skip/Update, audit, schema limits, and transaction rollback',
        'Review rollback strategy: function removal must not break active clients; do not drop function before feature disabled',
        'Record approval and independently observed QA evidence before staging deployment or production release'
      ]
    }
    (destination/'M144_4-STAGING-REVIEW.json').write_text(json.dumps(data,sort_keys=True,indent=2)+'\n',encoding='utf-8')
    (destination/'M144_4-STAGING-REVIEW-SHA256.txt').write_text(
       file_digest(staged_sql)+'  '+staged_sql.name+'\n'+file_digest(destination/'M144_4-STAGING-REVIEW.json')+'  M144_4-STAGING-REVIEW.json\n',encoding='utf-8')
    print('PASS: staging review packet generated; SQL byte-identical; NO database/migration/deployment action')
    print('STAGING REVIEW: '+str(destination))


def main():
    parser=argparse.ArgumentParser(description=__doc__)
    subs=parser.add_subparsers(dest='command',required=True)
    for cmd in ('create','verify','stage'):
        p=subs.add_parser(cmd)
        p.add_argument('--archive',required=True,type=Path)
        p.add_argument('--predecessor',required=True,type=Path)
        p.add_argument('--manifest',type=Path,required=cmd!='create')
        if cmd=='create':p.add_argument('--output',required=True,type=Path)
        if cmd=='verify':p.add_argument('--tree',type=Path)
        if cmd=='stage':p.add_argument('--output',required=True,type=Path)
    args=parser.parse_args()
    if args.command=='create':create_manifest(args)
    if args.command=='verify':verify(args)
    if args.command=='stage':stage_review(args)

if __name__=='__main__':
    try:main()
    except (ValueError,FileNotFoundError,PermissionError,KeyError,zipfile.BadZipFile,json.JSONDecodeError,UnicodeError,OSError) as e:
        print('FAIL CLOSED: '+str(e),file=sys.stderr)
        sys.exit(1)

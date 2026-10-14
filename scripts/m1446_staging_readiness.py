#!/usr/bin/env python3
"""Source-derived, offline staging readiness audit; no network, DB or deploy access."""
import argparse
import hashlib
import json
from pathlib import Path
import re
import sys

RPC_REL='supabase/m143/board_import_wizard_atomic_DRAFT.sql'
RPC_SHA='b883b3c432ae5ebcadd9fda2f15b5bcdeb0cff9448ace4862c6fb88fd5fd37fc'
CATALOG_REL='supabase/m1446/staging_catalog_READ_ONLY.sql'
OBJECTS=(
    'work_boards','work_board_groups','work_board_columns','work_board_items',
    'work_board_item_values','work_board_members',
)
HELPERS=(
    'work_board_access','wm_add_board_group','wm_add_board_column',
    'wm_set_board_cell','work_board_log',
)
SCHEMA='watchdogworkspace.m1446.staging-readiness.v1'
CATALOG_SCHEMA='watchdogworkspace.m1446.staging-catalog.v1'

def sha(data):return hashlib.sha256(data).hexdigest()
def reject(msg):raise ValueError(msg)
def dump(obj):return (json.dumps(obj,sort_keys=True,indent=2)+'\n').encode()

def source_scan(tree):
    if tree.is_symlink() or not tree.is_dir():reject('source tree unavailable')
    source=(tree/RPC_REL)
    if source.is_symlink() or not source.is_file():reject('missing M143 SQL')
    data=source.read_bytes()
    if sha(data)!=RPC_SHA:reject('M143 draft SQL digest changed')
    sql=data.decode('utf-8').lower()
    requirements={
      'security_definer':bool(re.search(r'\bsecurity\s+definer\b',sql)),
      'locked_search_path':bool(re.search(r'set\s+search_path\s*=\s*pg_catalog\s*,\s*public',sql)),
      'auth_uid': 'auth.uid()' in sql,
      'board_edit_access':"work_board_access(p_board_id,'edit')" in sql,
      'revoke_public_anon_authenticated':bool(re.search(r'revoke\s+all\s+on\s+function\s+public\.wm_import_board_wizard_atomic\(uuid,timestamptz,jsonb\)\s+from\s+public,anon,authenticated\s*;',sql)),
      'grant_authenticated_only':bool(re.search(r'grant\s+execute\s+on\s+function\s+public\.wm_import_board_wizard_atomic\(uuid,timestamptz,jsonb\)\s+to\s+authenticated\s*;',sql)),
      'pt409_occurrences':len(re.findall(r"errcode\s*=\s*'pt409'",sql)),
      'sqlstate_40001_occurrences':len(re.findall(r"errcode\s*=\s*'40001'",sql)),
      'named_rpc':bool(re.search(r'create\s+or\s+replace\s+function\s+public\.wm_import_board_wizard_atomic\s*\(',sql)),
    }
    if not all(requirements[k] for k in ('security_definer','locked_search_path','auth_uid','board_edit_access','revoke_public_anon_authenticated','grant_authenticated_only','named_rpc')):
        reject('M143 SQL safety invariants missing')
    if requirements['pt409_occurrences']!=9 or requirements['sqlstate_40001_occurrences']!=0:
        reject('M143 HTTP conflict contract differs')
    migrations=tree/'supabase/migrations'
    if migrations.is_symlink() or not migrations.is_dir():reject('missing migration source')
    mig=[]
    timestamped=[]
    legacy=[]
    for f in sorted(migrations.iterdir(),key=lambda p:p.name):
        if f.is_symlink() or not f.is_file() or f.suffix!='.sql':reject('unexpected migration member')
        raw=f.read_bytes(); low=raw.decode('utf-8').lower()
        if 'wm_import_board_wizard_atomic' in low:
            reject('M143 RPC has entered the automatic migration directory')
        if re.match(r'^\d{14}_[\w-]+\.sql$',f.name): timestamped.append(f.name)
        else: legacy.append(f.name)
        mig.append({'file':f.name,'sha256':sha(raw),'bytes':len(raw)})
    if len(mig)!=57:reject('migration inventory changed without review')
    # Static presence signals are NOT proof of a deployed schema/function.
    source_text='\n'.join((tree/'supabase/schema.sql').read_text().lower().splitlines())+'\n'+''.join((migrations/m['file']).read_text().lower() for m in mig)
    source_signals={name:bool(re.search(r'\b'+re.escape(name)+r'\b',source_text)) for name in OBJECTS+HELPERS}
    if not all(source_signals.values()):reject('one or more source-level DB dependency references are absent')
    cat=tree/CATALOG_REL
    if cat.is_symlink() or not cat.is_file():reject('catalog attestation template missing')
    raw=cat.read_bytes(); l=raw.decode().lower()
    if not ('begin transaction read only;' in l and 'commit;' in l and 'pg_catalog' in l):
        reject('read-only catalog template contract failed')
    return dict(schema=SCHEMA,
        result='SOURCE-READINESS-VERIFIED; HOSTED-STAGING-UNVERIFIED',
        release_eligible=False,source_version='M144.6',
        m143_rpc_draft_sha256=RPC_SHA, m143_rpc_status='UNDEPLOYED IN SOURCE; NOT EXECUTED',
        m143_static_requirements=requirements,
        source_dependency_reference_signals=source_signals,
        migrations=dict(count=len(mig),timestamped_count=len(timestamped),legacy_named_count=len(legacy),entries=mig,
                        ordering_note='Source filename inventory only. Actual hosted migration ledger and execution order unverified.'),
        catalog_template_sha256=sha(raw),
        staging_preflight_requirements=[
            'Dedicated nonproduction project identity and explicit read-only access authorization',
            'Staging migration ledger, including legacy-versus-timestamped migration reconciliation',
            'Existing production/staging schema and dependency fingerprints before any migration',
            'RPC definer ownership, schema search path, function EXECUTE ACL and RLS policy inspection',
            'Written migration deployment and rollback plan approved for nonproduction only',
            'Real staging Auth/PostgREST editor, viewer and outsider acceptance with safe test data',
            'Staging transaction, audit, rollback, concurrent update and historical regression evidence',
            'Production release reviewed separately after staging acceptance',
        ],
        gates={
            'source_migration_inventory':'verified-offline',
            'm143_sql_source_integrity':'verified-offline',
            'staging_catalog_template':'implemented-unverified-on-hosted',
            'staging_migration_ledger_parity':'pending',
            'staging_schema_role_rls_parity':'pending',
            'staging_migration_execution':'pending-explicit-approval',
            'staging_auth_http_browser_security':'pending',
            'production_release':'withheld',
        })

def evaluate_snapshot(path):
    # Strict, non-acceptance sanity check for the read-only SQL's output.
    raw=json.loads(path.read_bytes())
    if not isinstance(raw,dict) or raw.get('schema')!=CATALOG_SCHEMA:
        reject('staging catalog schema mismatch')
    if raw.get('read_only_transaction') is not True:
        reject('catalog was not attested from a read-only transaction')
    if not isinstance(raw.get('server_version_num'),int) or raw['server_version_num']<160000:
        reject('server version below reviewed PostgreSQL 16 baseline')
    objects=raw.get('relations')
    if not isinstance(objects,dict) or set(objects)!=set(OBJECTS):
        reject('staging relation inventory incomplete')
    for name in OBJECTS:
        d=objects[name]
        if not isinstance(d,dict) or d.get('exists') is not True or d.get('rls_enabled') is not True:
            reject('missing relation or disabled RLS: '+name)
    funcs=raw.get('functions')
    if not isinstance(funcs,dict) or not set(HELPERS).issubset(funcs):
        reject('staging helper function inventory incomplete')
    for name in HELPERS:
        if not isinstance(funcs[name],dict) or funcs[name].get('exists') is not True:
            reject('missing backend function: '+name)
    rpc=raw.get('wizard_rpc')
    if not isinstance(rpc,dict) or not isinstance(rpc.get('exists'),bool):
        reject('RPC inventory incomplete')
    # This check is advisory and may reflect a schema subject to change.
    # It does not prove SQL source equivalence, policies, user access, or hosting identity.
    return dict(
        snapshot_format='parsed',role_and_catalog_preflight='STRUCTURAL CHECK ONLY',
        rpc_already_present=rpc['exists'],
        missing_evidence=['DB project identity attestation','trusted migration ledger','SQL procedure definition fingerprint',
                          'server-enforced user-specific authorization cases','hosted rollback / transaction acceptance'],
        staging_acceptance='NOT ESTABLISHED',release_eligible=False)

def main():
    p=argparse.ArgumentParser()
    p.add_argument('--source-root',required=True,type=Path)
    p.add_argument('--output-dir',required=True,type=Path)
    p.add_argument('--catalog-snapshot',type=Path)
    a=p.parse_args()
    if a.output_dir.exists() or a.output_dir.is_symlink():reject('evidence output directory already exists; refusing overwrite')
    result=source_scan(a.source_root)
    if a.catalog_snapshot is not None:
        result['optional_catalog_snapshot_review']=evaluate_snapshot(a.catalog_snapshot)
    a.output_dir.mkdir(parents=True,mode=0o700)
    j=a.output_dir/'M144_6-STAGING-READINESS.json'
    m=a.output_dir/'M144_6-STAGING-READINESS.md'
    j.write_bytes(dump(result))
    summary='''# M144.6 — Staging readiness (not release certified)\n\n**Result:** source-derived readiness verified; hosted staging acceptance pending.\n\n- M143 RPC: SHA-256 `%s` (unchanged draft; outside normal migrations).\n- Migration SQL members: %d (%d timestamped, %d legacy-named).\n- RPC security: SECURITY DEFINER, explicit schema search_path, auth.uid(), edit authorization and authenticated-only EXECUTE static checks passed.\n- HTTP conflict states: nine `PT409`, zero `40001`.\n- Staging catalog inspection template: `%s` (READ ONLY; not executed).\n- Staging migration ledger, schema drift, runtime RLS, ownership, real Auth, browser, and rollback: **NOT VERIFIED**.\n- No staging/production connection or deployment was performed.\n- Unattested catalog JSON, even if structurally valid, is **not** sufficient for acceptance.\n\n**Continuation:** CONTINUE — IMPLEMENTATION REQUIRED.\n''' % (
        RPC_SHA,result['migrations']['count'],result['migrations']['timestamped_count'],
        result['migrations']['legacy_named_count'],result['catalog_template_sha256'])
    m.write_text(summary)
    checks=a.output_dir/'M144_6-EVIDENCE-SHA256.txt'
    checks.write_text(''.join(sha(f.read_bytes())+'  '+f.name+'\n' for f in (j,m)))
    print('PASS: M144.6 offline staging readiness source review; hosted staging acceptance NOT EXECUTED')
    print('Evidence:',a.output_dir)

if __name__=='__main__':
    try:main()
    except (OSError,ValueError,KeyError,UnicodeDecodeError,json.JSONDecodeError) as err:
        print('BLOCKED: M144.6 staging readiness:',err,file=sys.stderr)
        sys.exit(2)

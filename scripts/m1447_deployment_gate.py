#!/usr/bin/env python3
# M144.7 offline GitHub/staging go-no-go gate; never connects or deploys.
import argparse
import hashlib
import json
import re
import sys
from pathlib import Path

DRAFT='supabase/m143/board_import_wizard_atomic_DRAFT.sql'
DRAFT_SHA='b883b3c432ae5ebcadd9fda2f15b5bcdeb0cff9448ace4862c6fb88fd5fd37fc'
WORKFLOW='.github/workflows/deploy-pages.yml'
REPO='assets/js/features/boards/data/board-repository.ts'
SCHEMA='watchdogworkspace.m1447.deployment-decision.v1'

def sha(data): return hashlib.sha256(data).hexdigest()
def die(message): raise ValueError(message)
def require(root,name):
    p=root/name
    if p.is_symlink() or not p.is_file():die('missing or unsafe '+name)
    return p.read_bytes()

def check(root):
    if root.is_symlink() or not root.is_dir():die('invalid source root')
    draft=require(root,DRAFT)
    if sha(draft)!=DRAFT_SHA:die('M143 draft is not pinned')
    migrations=root/'supabase/migrations'
    if migrations.is_symlink() or not migrations.is_dir():die('migration directory missing')
    files=sorted(migrations.glob('*.sql'))
    if len(files)!=57:die('migration inventory differs')
    for p in files:
        if p.is_symlink() or 'wm_import_board_wizard_atomic' in p.read_text().lower():
            die('wizard RPC appears in automatic migrations or symlink')
    repo=require(root,REPO).decode()
    if "rpc('wm_import_board_wizard_atomic'" not in repo:
        die('frontend RPC contract missing')
    workflow=require(root,WORKFLOW).decode()
    if not re.search(r'(?m)^on:\s*\n\s*push:\s*\n\s*branches:\s*\n\s*- main\s*$',workflow):
        die('expected main push deployment trigger missing or changed')
    if 'actions/deploy-pages@' not in workflow:
        die('GitHub Pages deployment action missing')
    if 'wm_deployment_contract_attestation' not in workflow:
        die('production backend attestation check missing')
    # Check the current workflow gates for the older M105 RPC, not the new wizard.
    if 'wm_import_board_items_atomic' not in workflow:
        die('expected existing M105 attestation not found')
    return {
      'schema':SCHEMA,
      'decision':'BLOCKED FOR GITHUB MAIN / LIVE BOARD IMPORT',
      'release_eligible':False,
      'source':'M144.7 governance successor of M144.6',
      'existing_application_source_changed':False,
      'atomic_wizard_frontend_rpc_reference':True,
      'm143_rpc_sha256':DRAFT_SHA,
      'm143_rpc_in_automatic_migrations':False,
      'migration_sql_count':len(files),
      'github_pages_auto_deploys_on_main':True,
      'current_ci_attestation_name':'wm_deployment_contract_attestation',
      'existing_ci_attests':'wm_import_board_items_atomic (M105); not M143 wizard',
      'github_branch_testing':'REVIEW-ONLY BRANCH/PR POSSIBLE AFTER DIFF AND PROVENANCE GATES; NO MERGE',
      'staging_target_identity':'NOT AUTHENTICATED OR AUTHORIZED FOR DB INSPECTION',
      'staging_migration_runtime':'NOT EXECUTED',
      'hosted_browser_auth_rls':'NOT VERIFIED',
      'github_main_reconciliation':'PENDING: do not overwrite later repo changes with archive snapshot',
      'requirements_to_lift_block':[ 
        'Authenticate approved, isolated nonproduction Supabase staging project and read-only inventory',
        'Confirm database migration ledger, real schema, RLS, definer, grants and branch environment',
        'Review/approve staging-only migration with rollback; then execute accepted staged tests',
        'Reconcile full source candidate with current GitHub main without losing intervening commits',
        'Pass PR branch CI, actual staged Board Import browser/Auth/HTTP/audit/security regression',
        'Review production deployment separately before merging or pushing to main'],
      'production_supabase_modified':False,
      'github_modified':False,
    }

def main():
    parser=argparse.ArgumentParser()
    parser.add_argument('--source-root',required=True,type=Path)
    parser.add_argument('--output-dir',required=True,type=Path)
    args=parser.parse_args()
    dest=args.output_dir
    if dest.exists() or dest.is_symlink():die('existing evidence directory; refusing overwrite')
    result=check(args.source_root)
    dest.mkdir(parents=True,mode=0o700)
    json_path=dest/'M144_7-DEPLOYMENT-DECISION.json'
    md_path=dest/'M144_7-DEPLOYMENT-DECISION.md'
    json_path.write_text(json.dumps(result,indent=2,sort_keys=True)+'\n')
    md_path.write_text('''# WatchdogWorkspace M144.7 — GitHub / Staging Deployment Decision

**GitHub main push for live Board Import: BLOCKED.**

The wizard's frontend calls `wm_import_board_wizard_atomic`; the M143 SQL defining it is only an unchanged draft outside automatic migrations. The production Pages workflow deploys on pushes to `main`, and its current backend attestation verifies the existing M105 `wm_import_board_items_atomic` RPC, **not** the new wizard RPC. Passing the M105 attestation therefore does not prove that the new importer is deployable.

- M143 draft SHA-256: `%s`.
- Existing migration source inventory: %d SQL files; draft not promoted.
- Local isolated PostgreSQL/Auth/HTTP/browser tests: separately passed in supplied M144.5.1 Mac log; not hosted evidence.
- Actual hosted staging target/ledger/RLS/Auth/browser: unverified and unapproved.
- The existing main Git history must be reconciled with this ZIP before making a branch/PR. Do not bulk overwrite main or force-push.
- An isolated PR branch can be prepared only after source-diff reconciliation; publishing to main, creating production deploys, or deploying SQL remains blocked.

**Continuation state: CONTINUE — IMPLEMENTATION REQUIRED.**
**Release certificate: WITHHELD.**
'''%(DRAFT_SHA,result['migration_sql_count']))
    manifest=dest/'M144_7-EVIDENCE-SHA256.txt'
    manifest.write_text(''.join(sha(p.read_bytes())+'  '+p.name+'\n' for p in (json_path,md_path)))
    print('PASS: M144.7 offline deployment decision: GITHUB MAIN PUSH BLOCKED; hosted staging unverified')
    print('Evidence:',dest)

if __name__=='__main__':
    try:main()
    except (OSError,ValueError,UnicodeDecodeError) as error:
        print('BLOCKED: M144.7 gate:',error,file=sys.stderr)
        sys.exit(2)

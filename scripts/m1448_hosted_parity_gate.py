#!/usr/bin/env python3
"""M144.8 immutable source/observation reconciliation. NO NETWORK OR WRITES TO HOSTED SERVICES."""
import argparse,hashlib,json,re,sys,pathlib

def sha(b): return hashlib.sha256(b).hexdigest()
def die(m): raise ValueError(m)
def safe_read(root,rel):
 p=root/rel
 if p.is_symlink() or not p.is_file():die('missing/unsafe file: '+rel)
 return p.read_bytes()
def gitblob(b): return hashlib.sha1(b'blob '+str(len(b)).encode()+b'\0'+b).hexdigest()
def assess(root):
 if root.is_symlink() or not root.is_dir():die('unsafe source root')
 obs=json.loads(safe_read(root,'spec/M144_8-HOSTED-OBSERVATION.json'))
 if obs.get('schema')!='watchdogworkspace.m1448.hosted-observation.v1': die('observation schema mismatch')
 if obs.get('supabase_project_id')!='jtlusodorfnyzgyuewkz' or obs.get('github_repository')!='wass-psti/WatchdogWorkspace':die('project identity mismatch')
 if not re.fullmatch(r'[0-9a-f]{40}',obs.get('github_main_commit','')): die('GitHub main SHA invalid')
 source=safe_read(root,'supabase/m143/board_import_wizard_atomic_DRAFT.sql')
 if sha(source)!='b883b3c432ae5ebcadd9fda2f15b5bcdeb0cff9448ace4862c6fb88fd5fd37fc':die('M143 SQL draft changed')
 match=re.search(rb'\bas\s*\$\$(.*?)\$\$',source,re.I|re.S)
 if not match:die('SQL dollar-quoted body missing')
 body=match.group(1)
 if sha(body)!=obs['function_body_sha256'] or len(body)!=obs['function_body_bytes'] or hashlib.md5(body).hexdigest()!=obs['function_body_md5']:
  die('hosted RPC body parity mismatch')
 if obs['function_body_sha256']!='e193008098c5b0aac663dc14cd1276c72d7b0f88980970dc530d385683cc3eed':die('unrecognized deployed RPC checksum')
 for k,expected in [('security_definer',True),('function_owner','postgres'),('conflict_pt409_branches',9),('authenticated_execute',True),('anon_execute',False),('hosted_write_tests_executed',False),('release_certification','WITHHELD')]:
  if obs.get(k)!=expected:die('hosted metadata failed: '+k)
 if obs.get('search_path')!=['pg_catalog','public'] or obs.get('function_args')!='p_board_id uuid, p_expected_updated_at timestamp with time zone, p_payload jsonb':die('deployed function interface mismatch')
 if len(list((root/'supabase/migrations').glob('*.sql')))!=57:die('migration inventory differs')
 if any('wm_import_board_wizard_atomic' in p.read_text().lower() for p in (root/'supabase/migrations').glob('*.sql')):die('new migration detected; re-review required')
 observed={}
 for rel,meta in sorted(obs['git_blob_verification'].items()):
  b=safe_read(root,rel)
  local=gitblob(b)
  if local!=meta.get('candidate_sha'):die('candidate Git blob altered: '+rel)
  status='absent_on_main' if meta['remote'] is None else ('identical' if meta['remote']==local else 'different')
  if status!=meta['status']: die('remote Git snapshot/local status mismatch: '+rel)
  observed[rel]={'candidate_git_blob':local,'observed_main_git_blob':meta['remote'],'status':status}
 if not any(v['status']=='different' for v in observed.values()) or not any(v['status']=='absent_on_main' for v in observed.values()):die('expected GitHub source divergence missing')
 return {'schema':'watchdogworkspace.m1448.readiness.v1','observed_date_utc':obs['observed_date_utc'],
  'source_rpc_draft_sha256':sha(source),'hosted_rpc_body_sha256_snapshot':obs['function_body_sha256'],
  'rpc_body_sha256_parity':'MATCH_AT_OBSERVATION_DATE','hosted_project_id':obs['supabase_project_id'],
  'observed_github_main_commit':obs['github_main_commit'],'observed_git_blob_comparison':observed,
  'hosted_runtime_acceptance':'NOT_EXECUTED','full_git_three_way_reconciliation':'NOT_EXECUTED',
  'safe_test_branch':'NOT CREATED','main_push':'BLOCKED','hosted_project_changes':'NONE',
  'release_certification':'WITHHELD',
  'next_gates':['Fresh Git main fetch & non-destructive 3-way merge/diff','Hosted authenticated real Board Import against expressly authorized disposable test board',
  'Source-and-runtime security/recovery/E2E regression','Branch CI pass, deployment policy review, separate main approval']}
def main():
 p=argparse.ArgumentParser();p.add_argument('--source-root',type=pathlib.Path,required=True);p.add_argument('--output-dir',type=pathlib.Path,required=True);args=p.parse_args()
 dest=args.output_dir
 if dest.exists() or dest.is_symlink():die('output exists, refusing overwrite')
 result=assess(args.source_root)
 dest.mkdir(parents=True,mode=0o700)
 f=dest/'M144_8-HOSTED-GITHUB-PARITY.json';f.write_text(json.dumps(result,indent=2,sort_keys=True)+'\n')
 g=dest/'M144_8-DEPLOYMENT-DECISION.md';g.write_text('# M144.8 Observed hosted RPC and GitHub parity\n\n'+
 '**Verified at observation time:** M143 SQL body SHA256 exactly equals stored WatchdogWorkspace production RPC body SHA256.\n\n'+
 '**GitHub main push: BLOCKED.** New wizard source absent on main; Board repository divergent; do not overwrite main.\n\n'+
 '**Boundaries:** These are pinned, read-only observations and do not prove new hosted transactions or a freshly current GitHub main. No deployment, migration, GitHub write, project deletion or live write test was run.\n\n'+
 'Continuation state: CONTINUE — IMPLEMENTATION REQUIRED.\n')
 (dest/'M144_8-EVIDENCE-SHA256.txt').write_text(''.join(sha(x.read_bytes())+'  '+x.name+'\n' for x in (f,g)))
 print('PASS: M144.8 hosted RPC SHA256 matched at observation; GitHub main push blocked; no writes')
if __name__=='__main__':
 try:main()
 except (ValueError,OSError,KeyError,TypeError) as e:
  print('BLOCKED: M144.8 parity:',e,file=sys.stderr);sys.exit(2)

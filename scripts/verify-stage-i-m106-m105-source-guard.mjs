import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const manifest=JSON.parse(fs.readFileSync(path.join(root,'M106-M105-BASELINE-SOURCE-MANIFEST.json'),'utf8'));
if(manifest.checkpoint!=='M105'||manifest.commit!=='f448782a34d3115cf11b78aa4bc63e223ddc071a'||manifest.artifactSha256!=='7a151622fbdd5fcce8ce238ce67e9f51529bd032ae4a86a770851d0183411374'){
  console.error('M106 M105-certified source guard: FAIL (invalid M105 baseline authority)');process.exit(1);
}
const baseline=new Map(manifest.entries.map((e)=>[e.path,e]));
const allowedMutations=new Set([
  'tests/modern/e2e/helpers/m52-rbac-fixture.mjs',
  '.github/workflows/deploy-pages.yml',
  '.github/workflows/m54-functional-production-readiness.yml',
  'governance-artifacts/github/workflows/deploy-pages.yml',
  'verify-stage-f-m36-production-cutover-certification.mjs',
  'verify-stage-g-m54-functional-production-readiness-certification.mjs',
  'scripts/verify-stage-g-m54-execution.mjs',
  'scripts/verify-stage-i-m105-m104-source-guard.mjs',
  'scripts/run-database-rls-tests.mjs',
  'scripts/run-stage-g-m46-database-contract-tests.mjs',
  'scripts/run-stage-g-m47-database-tests.mjs',
  'verify-stage-g-m49-boards-kanban-drag-drop-recovery.mjs',
]);
const allowedAdditions=new Set([
  'M106-M105-BASELINE-SOURCE-MANIFEST.json',
  'M106-DEPLOY-PAGES-V5-COMPATIBILITY.md',
  'M106-CONTINUATION-STATE.md',
  'verify-v1432-m106-deploy-pages-v5-compatibility.mjs',
  'scripts/verify-stage-i-m106-m105-source-guard.mjs',
  'scripts/certify-stage-i-m106-local.sh',
  'M106-M49-SUPABASE-STACK-CLEANUP-CORRECTIVE-2026-10-06.md',
  'scripts/lib/supabase-local-stack-cleanup.mjs',
]);
const ignoredRoots=new Set(['.git','node_modules','dist','coverage','test-results','playwright-report']);
const ignoredNames=new Set(['.DS_Store','Thumbs.db']);
const gitBlobSha=(file)=>{const payload=fs.readFileSync(file);return crypto.createHash('sha1').update(Buffer.from(`blob ${payload.length}\0`)).update(payload).digest('hex')};
const current=new Map();
const walk=(dir,prefix='')=>{for(const entry of fs.readdirSync(dir,{withFileTypes:true})){if(ignoredNames.has(entry.name))continue;const rel=prefix?`${prefix}/${entry.name}`:entry.name;if(entry.isDirectory()){if(ignoredRoots.has(rel.split('/')[0]))continue;walk(path.join(dir,entry.name),rel)}else{const full=path.join(dir,entry.name);current.set(rel,{gitSha:gitBlobSha(full),size:fs.statSync(full).size})}}};
walk(root);
const unauthorized=[];
for(const [file,original] of baseline){const now=current.get(file);if(!now){unauthorized.push(`REMOVED ${file}`);continue}if(now.gitSha!==original.gitSha&&!allowedMutations.has(file))unauthorized.push(`MUTATED ${file}`)}
for(const file of current.keys())if(!baseline.has(file)&&!allowedAdditions.has(file))unauthorized.push(`ADDED ${file}`);
if(unauthorized.length){console.error('M106 M105-certified source guard: FAIL');unauthorized.slice(0,100).forEach((x)=>console.error(`- ${x}`));process.exit(1)}
console.log(`M106 M105-certified source guard: PASS (baseline files=${baseline.size}; allowed mutations=${allowedMutations.size}; allowed additions=${allowedAdditions.size})`);

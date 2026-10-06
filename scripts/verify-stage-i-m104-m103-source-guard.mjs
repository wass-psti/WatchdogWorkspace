import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');

const m105Manifest=path.join(
  root,
  'M105-M104-BASELINE-GIT-MANIFEST.json',
);
const m105Guard=path.join(
  root,
  'scripts/verify-stage-i-m105-m104-source-guard.mjs',
);

if(
  fs.existsSync(m105Manifest) ||
  fs.existsSync(m105Guard)
){
  if(
    !fs.existsSync(m105Manifest) ||
    !fs.existsSync(m105Guard)
  ){
    console.error(
      'M104 M103-certified source guard: FAIL ' +
      '(incomplete M105 successor authority)'
    );
    process.exit(1);
  }

  const {spawnSync}=await import(
    'node:child_process'
  );

  const delegated=spawnSync(
    process.execPath,
    [m105Guard],
    {
      cwd:root,
      stdio:'inherit',
    },
  );

  if(delegated.status!==0){
    process.exit(
      delegated.status ?? 1
    );
  }

  console.log(
    'M104 M103-certified source guard: PASS ' +
    '(M105 successor authority delegated to M105→M104 source guard)'
  );

  process.exit(0);
}

const manifest=JSON.parse(fs.readFileSync(path.join(root,'M104-M103-BASELINE-SOURCE-MANIFEST.json'),'utf8'));
const baseline=new Map(manifest.entries.map(e=>[e.path,e]));
const allowedMutations=new Set([
  'package-lock.json',
  'verify-stage-f-m30-modern-testing-stack.mjs',
  'tests/modern/e2e/helpers/m37-supabase-fixture.mjs',
  'tests/modern/e2e/helpers/m39-auth-fixture.mjs',
  'scripts/verify-stage-h-m73-boards-ui-design-system-migration-execution.mjs',
  'scripts/verify-stage-i-m103-m102-source-guard.mjs',
]);
const allowedAdditions=new Set([
  'M104-M103-BASELINE-SOURCE-MANIFEST.json',
  'M104-HOSTED-CERTIFICATION-SYNCHRONIZATION.md',
  'M104-CONTINUATION-STATE.md',
  'M104-IMPLEMENTATION-REPORT.md',
  'verify-v1432-m104-hosted-certification-synchronization.mjs',
  'scripts/verify-stage-i-m104-m103-source-guard.mjs',
  'scripts/certify-stage-i-m104-local.sh',
]);
const ignoredRoots=['.git','node_modules','dist','coverage','test-results','playwright-report'];
const ignoredNames=new Set(['.DS_Store','Thumbs.db']);
const sha=f=>crypto.createHash('sha256').update(fs.readFileSync(f)).digest('hex');
const current=new Map();
const walk=(dir,prefix='')=>{for(const e of fs.readdirSync(dir,{withFileTypes:true})){if(ignoredNames.has(e.name))continue;const rel=prefix?`${prefix}/${e.name}`:e.name;if(e.isDirectory()){if(ignoredRoots.includes(rel.split('/')[0]))continue;walk(path.join(dir,e.name),rel)}else current.set(rel,{sha256:sha(path.join(dir,e.name)),size:fs.statSync(path.join(dir,e.name)).size})}};
walk(root);
const unauthorized=[];
for(const [file,original] of baseline){const now=current.get(file);if(!now){unauthorized.push(`REMOVED ${file}`);continue}if(now.sha256!==original.sha256&&!allowedMutations.has(file))unauthorized.push(`MUTATED ${file}`)}
for(const file of current.keys())if(!baseline.has(file)&&!allowedAdditions.has(file))unauthorized.push(`ADDED ${file}`);
if(unauthorized.length){console.error('M104 M103-certified source guard: FAIL');unauthorized.slice(0,100).forEach(x=>console.error(`- ${x}`));process.exit(1)}
console.log(`M104 M103-certified source guard: PASS (baseline files=${baseline.size}; allowed mutations=${allowedMutations.size}; allowed new files=${allowedAdditions.size})`);

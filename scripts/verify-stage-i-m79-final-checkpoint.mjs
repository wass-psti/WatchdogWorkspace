import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
const root=process.cwd(); const requireCertified=process.argv.includes('--require-certified'); const failures=[];
const run=(args,label)=>{const r=spawnSync(process.execPath,args,{cwd:root,encoding:'utf8'});if(r.status!==0)failures.push(`${label} failed: ${(r.stderr||r.stdout).trim()}`)};
run(['verify-stage-i-m79-design-tokens-semantic-theme.mjs'],'M79 static verification');
run(['scripts/verify-stage-i-m79-design-tokens-semantic-theme-execution.mjs'],'M79 deterministic verification');
run(['scripts/verify-stage-i-m79-m78-source-guard.mjs'],'M79 M78 source guard');
const state=fs.readFileSync(path.join(root,'M79-CONTINUATION-STATE.md'),'utf8');
if(requireCertified){run(['scripts/verify-stage-i-m79-certified-state.mjs',root],'M79 certified state');run(['scripts/verify-stage-i-m79-certified-artifact.mjs'],'M79 certified artifact');run(['scripts/verify-stage-i-m79-certified-package-hygiene.mjs'],'M79 package hygiene');}
else if(!state.includes('IMPLEMENTATION COMPLETE — LOCAL VERIFICATION/CERTIFICATION REMAINS')&&!state.includes('FULLY COMPLETE — IMPLEMENTATION AND REQUIRED VERIFICATION COMPLETE'))failures.push('M79 continuation state is invalid');
if(failures.length){console.error('M79 final checkpoint verification FAILED');failures.forEach(x=>console.error(` - ${x}`));process.exit(1)}
console.log(`M79 final checkpoint verification: PASS (${requireCertified?'certified':'implementation checkpoint'})`);

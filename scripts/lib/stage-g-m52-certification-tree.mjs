import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
const root = path.resolve(process.argv[2] || path.resolve(import.meta.dirname, '../..'));
const excluded = new Set(['.git','node_modules','dist','coverage','test-results','playwright-report','m52-certified-artifacts-upload']);
const files=[];
function walk(dir){ for(const entry of fs.readdirSync(dir,{withFileTypes:true})){ if(excluded.has(entry.name)) continue; const full=path.join(dir,entry.name); if(entry.isDirectory()) walk(full); else if(entry.isFile()) files.push(full); } }
walk(root); files.sort((a,b)=>path.relative(root,a).localeCompare(path.relative(root,b)));
const h=crypto.createHash('sha256');
for(const file of files){ const rel=path.relative(root,file).replaceAll(path.sep,'/'); if(rel==='config/stage-g-m52-cross-module-rbac-authenticated-e2e-certification-target.ts'||rel==='RELEASE-STATUS-v1.43.2-STAGE-G-M52-CROSS-MODULE-RBAC-AUTHENTICATED-E2E-CERTIFICATION.md'){ let s=fs.readFileSync(file,'utf8').replace("activationState: 'active-certified'","activationState: 'implementation-complete-pending-certification'").replace('State: active-certified','State: implementation-complete-pending-certification'); h.update(rel+'\0'+s+'\0'); } else h.update(rel+'\0'+fs.readFileSync(file)+'\0'); }
console.log(h.digest('hex'));

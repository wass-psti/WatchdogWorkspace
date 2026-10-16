import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
const root = path.resolve(fileURLToPath(new URL('..', import.meta.url)));
const read = rel => fs.readFileSync(path.join(root,rel),'utf8');
const manifest = JSON.parse(read('M145-REMOVAL-MANIFEST.json'));
const sha = rel => crypto.createHash('sha256').update(fs.readFileSync(path.join(root,rel))).digest('hex');
const skip = new Set(['node_modules','dist','.git','coverage','.vite']);
const allowedNew = new Set(manifest.expectedAddedPaths);
const allowedDeleted = new Set(manifest.proposedDeletedPaths);
const modified = manifest.approvedModifiedSha256;
const original = manifest.baselineSha256;
// M145.3 production-shaped successor: exactly two never-merged HF3 QA
// handoff files existed only in the Issue #21 source ZIP, not in production.
// The predecessor provenance gate independently checks the exact 2,840-file
// production Git inventory and these two digest-pinned QA-only records.
// No other absence, deletion, or source drift is permitted.
const archiveOnlyQaEvidence = new Map([
  ['M14417-HF3-CONTINUATION-NOT-RELEASE-CERTIFIED.md', '0bd2f0f98d46da2e1cf309dd02447de2261c3ead33152b9ba0c2dd2f28633bf3'],
  ['M14417-HF3-SHA256-MANIFEST.json', '2bad1d0a01defa350cdb5fc1c8fd3f319e06911bed38fbb815de9a2bf204b228'],
]);
let checks = 0;
function check(condition,message){if(!condition)throw new Error(`M145 FAIL: ${message}`);checks++;}
check(manifest.cloudMutation===false&&manifest.cloudDataDeleted===false&&manifest.newApplicationAdded===false,'scope must be runtime-only');
check(manifest.scope.length===4&&new Set(manifest.scope).size===4,'module scope must be four known existing applications');
const scan = (dir='',out=new Set())=>{
  for (const entry of fs.readdirSync(path.join(root,dir),{withFileTypes:true})) {
    const rel=dir?dir+'/'+entry.name:entry.name;
    if (skip.has(entry.name) || entry.name==='.DS_Store' || entry.name==='Thumbs.db') continue;
    check(!entry.isSymbolicLink(),`symlink not allowed: ${rel}`);
    if(entry.isDirectory())scan(rel,out);else if(entry.isFile())out.add(rel);else check(false,`unknown entry: ${rel}`);
  }
  return out;
};
const now=scan();
for(const [rel,want] of Object.entries(original)){
  check(!manifest.protectedPrefixes.some(prefix=>rel.startsWith(prefix))||!allowedDeleted.has(rel),'protected file deletion denied: '+rel);
  if(allowedDeleted.has(rel)){check(!now.has(rel),'retired file remains: '+rel);continue;}
  if(archiveOnlyQaEvidence.has(rel)) {
    check(original[rel]===archiveOnlyQaEvidence.get(rel),'QA-only predecessor evidence digest mismatch: '+rel);
    check(!now.has(rel),'never-merged QA-only document unexpectedly present: '+rel);
    continue;
  }
  check(now.has(rel),'baseline file missing: '+rel);
  const expected=Object.hasOwn(modified,rel)?modified[rel]:want;
  check(sha(rel)===expected,'unapproved modification: '+rel);
}
for(const rel of now)check(Object.hasOwn(original,rel)||allowedNew.has(rel),'unexpected added file: '+rel);
for(const rel of allowedNew)check(now.has(rel),'required M145 artifact missing: '+rel);
// M145.8: all additions except the manifest carrying this inventory must be
// SHA256 authenticated, including the verifier itself and workflow pin file.
// The self-referential manifest is instead bound to the signed Git tree and
// final distributed ZIP digest; do not introduce an impossible self hash.
const pinnedAdds=manifest.approvedAddedSha256;
check(pinnedAdds && Object.keys(pinnedAdds).length===allowedNew.size-1, 'new-source digest coverage incomplete');
for(const rel of allowedNew) {
  if(rel==='M145-REMOVAL-MANIFEST.json')continue;
  check(Object.hasOwn(pinnedAdds,rel),'missing digest for newly added source: '+rel);
  check(sha(rel)===pinnedAdds[rel],'newly added source drift: '+rel);
}
for(const rel of Object.keys(pinnedAdds))check(allowedNew.has(rel) && rel!=='M145-REMOVAL-MANIFEST.json','unapproved added-source pin: '+rel);
check(archiveOnlyQaEvidence.size===2 && [...archiveOnlyQaEvidence.keys()].every(rel => Object.hasOwn(original,rel) && !allowedDeleted.has(rel) && !allowedNew.has(rel)), 'QA-only exclusion cannot expand original removal or addition scope');
const c=read('config/modules.ts');
check(c.includes('Object.freeze({});')&&!c.includes("route: './apps/"),'no registered legacy application');
check(c.includes('Object.freeze([] as NormalizedModuleDataDescriptor[])'),'no legacy data registry exposure');
check(manifest.scope.every(id=>!c.includes(`'${id}': {`)),'old module definitions absent');
const vite=read('vite.config.js');
check(!vite.includes("resolve(rootDir, 'apps')")&&!vite.includes("rootDir, 'assets/js/runtime/fueltrack-analytics.ts'")&&!vite.includes('for (const embeddedHtml of'), 'standalone bundles excluded from build');
const pkg=JSON.parse(read('package.json'));
check(!pkg.scripts.build.includes('material-tracker:build')&&!pkg.scripts.predev&&!pkg.scripts.prestart,'no material tracker auto-generation');
const auth=read('assets/js/core/auth.ts');
check(auth.includes('!Object.hasOwn(moduleDefinitionsById, moduleId)'),'old module identity/access denied');
const route=read('assets/js/runtime/services/route-policy.ts');
check(route.includes('!moduleRegistry.has(context.route.moduleId)'),'retired application routes denied');
for(const id of manifest.scope)check(!fs.existsSync(path.join(root,'apps',id)),'retired deployed directory exists: '+id);
check(!fs.existsSync(path.join(root,'integrations/material-tracker')),'material tracker generated source remains');
console.log(`M145 targeted removal and protected-core source accounting: PASS (${checks} fail-closed assertions).`);
console.log('NOT a production/release certificate: npm dependency-backed build and historical-successor release gate remain required.');

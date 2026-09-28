import fs from 'node:fs';import path from 'node:path';import crypto from 'node:crypto';
const root=path.resolve(import.meta.dirname,'..');const fail=(m)=>{throw new Error(m)};
const baseline=JSON.parse(fs.readFileSync(path.join(root,'regression-baseline/m77-final-ui-production-certification.json'),'utf8'));
const sha=(p)=>crypto.createHash('sha256').update(fs.readFileSync(path.join(root,p))).digest('hex');
if(baseline.productSourceChangesAllowed!==false)fail('M77 must freeze product UI source.');
for(const [file,expected] of Object.entries(baseline.protectedAuthorities)){if(!fs.existsSync(path.join(root,file)))fail(`M77 protected authority missing: ${file}`);const actual=sha(file);if(actual!==expected)fail(`M77 protected authority drift: ${file}`)}
if(JSON.stringify(baseline.browserEngines)!==JSON.stringify(['chromium','firefox','webkit']))fail('M77 browser matrix must contain exactly chromium/firefox/webkit.');
if(baseline.viewports.length!==4)fail('M77 must certify four representative viewport classes.');
const finalizer=fs.readFileSync(path.join(root,'scripts/finalize-stage-h-m77.sh'),'utf8');
for(const token of ['npm run final-ui:browser','npm run release:check','npm run verify:historical-all','verify-stage-h-m77-certified-artifact.mjs','verify-stage-h-m77-certified-package-hygiene.mjs']) if(!finalizer.includes(token))fail(`M77 finalizer missing ${token}`);
const tree=fs.readFileSync(path.join(root,'scripts/lib/stage-h-m77-certification-tree.mjs'),'utf8');if(!tree.includes("'CHECKSUMS.sha256'"))fail('M77 source identity must exclude derived CHECKSUMS.sha256.');
const helper=fs.readFileSync(path.join(root,'tests/modern/e2e/helpers/m53-hardening-fixture.mjs'),'utf8');if(!helper.includes('if (!root || !body) return null;'))fail('M77 iframe settlement correction missing root/body transient guard.');if(!helper.includes('Embedded module document remained unavailable for responsive verification after'))fail('M77 iframe settlement correction must remain fail-closed after timeout.');
console.log('M77 final UI production certification deterministic verification: PASS');
console.log(`Validated ${Object.keys(baseline.protectedAuthorities).length} frozen presentation authorities, 3 browser engines, 4 viewport classes, and fail-closed production certification sequencing.`);

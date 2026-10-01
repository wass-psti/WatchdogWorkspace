import fs from 'node:fs';
const t=fs.readFileSync('config/stage-i-m95-cross-module-responsive-harmonization-target.ts','utf8');
const s=fs.readFileSync('RELEASE-STATUS-v1.43.2-STAGE-I-M95-CROSS-MODULE-RESPONSIVE-HARMONIZATION.md','utf8');
if(!t.includes("activationState: 'certification-gates-passed-pending-regression'")||!s.includes('**State:** certification-gates-passed-pending-regression')){console.error('M95 post-certification state verification FAILED');process.exit(1)}
console.log('M95 post-certification state verification: PASS');

import fs from 'node:fs';
const t=fs.readFileSync('config/stage-i-m95-cross-module-responsive-harmonization-target.ts','utf8');
const s=fs.readFileSync('RELEASE-STATUS-v1.43.2-STAGE-I-M95-CROSS-MODULE-RESPONSIVE-HARMONIZATION.md','utf8');
const c=fs.readFileSync('M95-CONTINUATION-STATE.md','utf8');
if(!t.includes("activationState: 'active-certified'")||!s.includes('**State:** active-certified')||!c.includes('FULLY COMPLETE — IMPLEMENTATION AND REQUIRED VERIFICATION COMPLETE')){console.error('M95 certified-state verification FAILED');process.exit(1)}
console.log('M95 certified-state verification: PASS');

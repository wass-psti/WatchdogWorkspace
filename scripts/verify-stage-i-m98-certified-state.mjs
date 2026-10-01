import fs from 'node:fs';
const target=fs.readFileSync('config/stage-i-m98-futuristic-minimalist-production-readiness-certification-target.ts','utf8');
const status=fs.readFileSync('RELEASE-STATUS-v1.43.2-STAGE-I-M98-FUTURISTIC-MINIMALIST-PRODUCTION-READINESS-CERTIFICATION.md','utf8');
const continuation=fs.readFileSync('M98-CONTINUATION-STATE.md','utf8');
if (!target.includes("activationState: 'active-certified'") || !status.includes('**State:** active-certified') || !continuation.includes('FULLY COMPLETE — IMPLEMENTATION AND REQUIRED VERIFICATION COMPLETE')) {
  console.error('M98 certified-state verification FAILED'); process.exit(1);
}
console.log('M98 certified-state verification: PASS');

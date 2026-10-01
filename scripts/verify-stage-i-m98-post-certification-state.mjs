import fs from 'node:fs';
const target=fs.readFileSync('config/stage-i-m98-futuristic-minimalist-production-readiness-certification-target.ts','utf8');
const status=fs.readFileSync('RELEASE-STATUS-v1.43.2-STAGE-I-M98-FUTURISTIC-MINIMALIST-PRODUCTION-READINESS-CERTIFICATION.md','utf8');
if (!target.includes("activationState: 'certification-gates-passed-pending-regression'") || !status.includes('**State:** certification-gates-passed-pending-regression')) {
  console.error('M98 post-certification state verification FAILED'); process.exit(1);
}
console.log('M98 post-certification state verification: PASS');

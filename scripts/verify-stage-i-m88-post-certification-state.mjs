import fs from 'node:fs';
const target=fs.readFileSync('config/stage-i-m88-users-roles-administration-surfaces-target.ts','utf8');
const status=fs.readFileSync('RELEASE-STATUS-v1.43.2-STAGE-I-M88-USERS-ROLES-ADMINISTRATION-SURFACES.md','utf8');
if(!target.includes("activationState:'certification-gates-passed-pending-regression'")||!status.includes('**State:** certification-gates-passed-pending-regression')){console.error('M88 post-certification state verification FAILED');process.exit(1);}
console.log('M88 post-certification state verification: PASS');

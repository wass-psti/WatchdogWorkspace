import fs from 'node:fs';
const target=fs.readFileSync('config/stage-i-m88-users-roles-administration-surfaces-target.ts','utf8');
if(!target.includes("activationState:'active-certified'")){console.error('M88 certified-state verification FAILED');process.exit(1);}
console.log('M88 certified-state verification: PASS');

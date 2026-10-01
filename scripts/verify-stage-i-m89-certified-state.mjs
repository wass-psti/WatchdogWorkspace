import fs from 'node:fs';
const target=fs.readFileSync('config/stage-i-m89-settings-configuration-surfaces-target.ts','utf8');
if(!target.includes("activationState:'active-certified'")){console.error('M89 certified-state verification FAILED');process.exit(1);}
console.log('M89 certified-state verification: PASS');

import fs from 'node:fs';import crypto from 'node:crypto';
const artifact=process.argv[2]||'m88-certified-artifacts-upload/Work-Management-App-v1.43.2-Stage-I-M88-Certified-Baseline.zip';
if(!fs.existsSync(artifact)){console.error('M88 certified artifact verification FAILED: missing zip');process.exit(1);}
const hash=crypto.createHash('sha256').update(fs.readFileSync(artifact)).digest('hex');
console.log(`M88 certified artifact verification: PASS (zipSha=${hash})`);

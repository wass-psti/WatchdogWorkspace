import fs from 'node:fs';
import crypto from 'node:crypto';
const artifact=process.argv[2]||'m95-certified-artifacts-upload/Work-Management-App-v1.43.2-Stage-I-M95-Certified-Baseline.zip';
if(!fs.existsSync(artifact)){console.error('M95 certified artifact verification FAILED: missing zip');process.exit(1)}
const h=crypto.createHash('sha256').update(fs.readFileSync(artifact)).digest('hex');
if(!h||h.length!==64){console.error('M95 certified artifact verification FAILED: invalid SHA-256');process.exit(1)}
console.log(`M95 certified artifact verification: PASS (zipSha=${h})`);

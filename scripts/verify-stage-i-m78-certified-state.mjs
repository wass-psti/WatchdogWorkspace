import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const root = path.resolve(process.argv[2] || process.cwd());
const read = (relative) => fs.readFileSync(path.join(root, relative), 'utf8');
const failures = [];
const ok = (condition, message) => { if (!condition) failures.push(message); };

const target = read('config/stage-i-m78-futuristic-minimalist-foundation-target.ts');
const status = read('RELEASE-STATUS-v1.43.2-STAGE-I-M78-VISUAL-SYSTEM-FOUNDATION-BASELINE-GUARD.md');
const continuation = read('M78-CONTINUATION-STATE.md');
ok(target.includes("activationState: 'active-certified'"), 'M78 target is not active-certified');
ok(status.includes('**State:** active-certified'), 'M78 release status is not active-certified');
ok(continuation.includes('**State:** FULLY COMPLETE — IMPLEMENTATION AND REQUIRED VERIFICATION COMPLETE'), 'M78 continuation state is not FULLY COMPLETE');

if (failures.length) {
  console.error('M78 certified-state verification FAILED');
  failures.forEach((failure) => console.error(` - ${failure}`));
  process.exit(1);
}
console.log('M78 certified-state verification: PASS');

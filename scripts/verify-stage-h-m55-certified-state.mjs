import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const root = path.resolve(process.argv[2] || process.cwd());
const read = (p) => fs.readFileSync(path.join(root, p), 'utf8');
const failures = [];
const ok = (condition, message) => { if (!condition) failures.push(message); };
const target = read('config/stage-h-m55-full-stack-folder-structure-target.ts');
const status = read('RELEASE-STATUS-v1.43.2-STAGE-H-M55-FULL-STACK-FOLDER-STRUCTURE.md');
const continuation = read('M55-CONTINUATION-STATE.md');
ok(target.includes("activationState: 'active-certified'"), 'M55 target is not active-certified');
ok(status.includes('**State:** active-certified'), 'M55 release status is not active-certified');
ok(continuation.includes('**State:** FULLY COMPLETE — IMPLEMENTATION AND REQUIRED VERIFICATION COMPLETE'), 'M55 continuation state is not FULLY COMPLETE');
if (failures.length) {
  console.error('M55 post-certification state verification FAILED');
  failures.forEach((failure) => console.error(` - ${failure}`));
  process.exit(1);
}
console.log('M55 post-certification staged-state verification: PASS');

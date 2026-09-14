import { readFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import { assessRecoveryPackage, verifyRecoveryPackage } from '../assets/js/platform/recovery/backup-disaster-recovery.ts';

const file = process.argv[2];
if (!file) {
  console.error('Usage: npm run backup-dr:verify-package -- /path/to/work-management-recovery-*.json');
  process.exit(2);
}
const absolute = path.resolve(file);
let parsed;
try { parsed = JSON.parse(await readFile(absolute, 'utf8')); }
catch (error) { throw new Error(`Recovery package cannot be parsed: ${error instanceof Error ? error.message : 'invalid JSON'}`); }
const pkg = await verifyRecoveryPackage(parsed);
const expectedOrigin = process.env.WM_RECOVERY_EXPECTED_ORIGIN || undefined;
const preflight = assessRecoveryPackage(pkg, { expectedOrigin });
console.log(`Recovery package: ${absolute}`);
console.log(`Integrity: ${preflight.integrity}`);
console.log(`Digest: ${preflight.digest}`);
console.log(`Entries: ${preflight.entryCount}`);
console.log(`Boards: ${preflight.boardCount}`);
console.log(`Backup age hours: ${preflight.backupAgeHours == null ? 'unknown' : preflight.backupAgeHours.toFixed(2)}`);
console.log(`RPO compliant: ${preflight.rpoCompliant == null ? 'unknown' : preflight.rpoCompliant}`);
console.log(`Origin matches: ${preflight.originMatches == null ? 'not-checked' : preflight.originMatches}`);
console.log(`Preflight: ${preflight.status}`);
for (const warning of preflight.warnings) console.log(`WARNING ${warning.code}: ${warning.message}`);
console.log('M34 recovery-package offline verification: PASS');

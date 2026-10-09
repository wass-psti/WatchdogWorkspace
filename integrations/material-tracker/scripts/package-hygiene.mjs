import fs from 'node:fs';

let failed = 0;

for (const p of ['node_modules', 'dist']) {
  if (fs.existsSync(p)) {
    console.log(`INFO: ${p} exists locally and must be excluded from checkpoint/certified ZIPs.`);
  }
}

for (const p of ['server', 'reference/legacy-local-server', 'reference/legacy-local-server/server/data/db.json.tmp']) {
  if (fs.existsSync(p)) {
    console.error(`FAIL prohibited active/generated artifact present: ${p}`);
    failed++;
  }
}

for (const manifest of ['CHECKSUMS.sha256', 'FINAL_CHECKSUMS.sha256']) {
  if (!fs.existsSync(manifest)) continue;
  const text = fs.readFileSync(manifest, 'utf8');
  if (/(^|[ /])(node_modules|dist)([ /]|$)/m.test(text)) {
    console.error(`FAIL ${manifest} contains generated dependency/build artifacts.`);
    failed++;
  }
}

const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));

const forbiddenDeps = ['xlsx', 'jspdf', 'jspdf-autotable'];
for (const dep of forbiddenDeps) {
  if (pkg.dependencies?.[dep] || pkg.devDependencies?.[dep]) {
    console.error(`FAIL vulnerable/retired export dependency remains declared: ${dep}`);
    failed++;
  }
}
if (!pkg.dependencies?.fflate) {
  console.error('FAIL secure internal export writer dependency fflate is missing');
  failed++;
}
if ((pkg.scripts?.dev || '').includes('0.0.0.0')) {
  console.error('FAIL standalone dev server is exposed beyond loopback');
  failed++;
}

const scripts = JSON.stringify(pkg.scripts || {});
if (/dev:server|reset-data|server\/index\.js/.test(scripts)) {
  console.error('FAIL active package scripts still reference local server');
  failed++;
}

console.log(failed ? 'FAIL: package hygiene' : 'PASS: package hygiene invariants satisfied');
if (failed) process.exit(1);

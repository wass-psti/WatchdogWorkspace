import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');
const workflowDir = path.join(root, '.github/workflows');
const files = fs.readdirSync(workflowDir).filter((name) => name.endsWith('.yml')).sort();
let checked = 0;
for (const name of files) {
  const source = fs.readFileSync(path.join(workflowDir, name), 'utf8');
  const inlinePush = /^on:\s*\[[^\]]*\bpush\b[^\]]*\]/m.test(source);
  assert.equal(inlinePush, false, `${name}: inline push trigger is not branch-governed`);
  const lines = source.split(/\r?\n/);
  for (let index = 0; index < lines.length; index += 1) {
    if (lines[index] !== '  push:') continue;
    let cursor = index + 1;
    const child = [];
    while (cursor < lines.length && (/^    /.test(lines[cursor]) || lines[cursor].trim() === '')) {
      if (lines[cursor].trim()) child.push(lines[cursor]);
      cursor += 1;
    }
    assert.ok(
      child.some((line) => /^    branches:/.test(line)),
      `${name}: push trigger must be restricted to branches so release tags cannot fan out branch certification workflows`,
    );
    checked += 1;
  }
}
assert.ok(checked > 0, 'Expected at least one branch-governed push workflow');
console.log(`Stage G M54 workflow trigger governance: PASS (pushTriggers=${checked}; tagFanout=false)`);

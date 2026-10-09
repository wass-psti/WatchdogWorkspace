import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const src = fs.readFileSync(new URL('./assets/js/core/auth.ts', import.meta.url), 'utf8');
const parser = src.match(/function parseModuleAssignments\(value: unknown\): ModuleAssignmentRecord\[\] \{[\s\S]*?\n\}/)?.[0];
assert.ok(parser, 'assignment parser exists');
const js = parser.replace('value: unknown', 'value').replace(': ModuleAssignmentRecord[]', '').replace('const supported: ModuleAssignmentRecord[]', 'const supported').replace(' as PlatformModuleId', '').replace(' as string', '');
const sandbox = {
  asRecord: x => x && typeof x === 'object' && !Array.isArray(x) ? x : {},
  stringField: (r, k) => typeof r[k] === 'string' ? r[k] : '',
  isPlatformModuleId: id => ['time-tracker','fueltrack-plus','tradelink','material-tracker'].includes(id),
  parseModuleAssignment: x => {if (!['Employee','OJT'].includes(x.role) && x.module_id === 'time-tracker') throw new TypeError('Unsupported role'); if (typeof x.enabled !== 'boolean') throw new TypeError('Missing boolean'); return x;},
};
vm.runInNewContext(js+'\nthis.parse = parseModuleAssignments;', sandbox);
const known = {module_id:'time-tracker',user_id:'user-1',role:'Employee',enabled:true};
const unknown = {module_id:'future-module',user_id:'user-1',role:'Admin',enabled:true};
const parsed = sandbox.parse([known,unknown]);
assert.equal(parsed.length,2, 'identity checks retain unknown assignments until caller validation');
assert.equal(parsed.filter(x=>sandbox.isPlatformModuleId(x.module_id)).map(x=>x.module_id).join(','), 'time-tracker');
assert.throws(()=>sandbox.parse([{...unknown, enabled:'true'}]), /boolean/);
assert.throws(()=>sandbox.parse([{...known,role:'untrusted'}]), /Unsupported role/);
assert.throws(()=>sandbox.parse([{...unknown,user_id:123}]), /invalid user id/);
assert.match(src, /assignment\.user_id !== userId/);
assert.match(src, /assignments\.filter\(\(assignment\) => isPlatformModuleId\(assignment\.module_id\)\)/);
assert.match(src, /return \{ profile, assignments: supportedAssignments, revision:/);
console.log('PASS: unknown module does not block parsing; excluded from authorization; identity and known-role failures preserved');

import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

// M145-only current-core successor. Historical verifiers remain immutable and
// are replayed against their authenticated predecessor by a separate step.
const root = path.resolve(fileURLToPath(new URL('..', import.meta.url)));
const read = rel => fs.readFileSync(path.join(root, rel), 'utf8');
const assert = (condition, message) => { if (!condition) throw new Error(`M145 successor FAIL: ${message}`); };
const manifest = JSON.parse(read('M145-REMOVAL-MANIFEST.json'));
const retired = ['time-tracker','fueltrack-plus','tradelink','material-tracker'];
assert(manifest.baseReleaseCommit === '994e925898fa7de596050cd06ec68a5a94a7c92b', 'unexpected predecessor');
assert(manifest.scope.length === 4 && retired.every(id => manifest.scope.includes(id)), 'unexpected application removal scope');
assert(manifest.cloudMutation === false && manifest.cloudDataDeleted === false && manifest.newApplicationAdded === false, 'unauthorized data or integration work');
assert(manifest.proposedDeletedPaths.length === 209, 'different approved deletion count');
// The original 11 app-retirement modifications stay pinned; M145.6 permits
// exactly one additional existing-file update, the governed CI entry point.
const originalM145 = [
  'assets/js/core/auth.ts', 'assets/js/core/platform.ts',
  'assets/js/features/home/index.ts', 'assets/js/runtime/services/route-policy.ts',
  'config/application-manifest.ts', 'config/modules.ts', 'config/runtime-assets.js',
  'package.json', 'src/runtime-schemas/manifest.ts', 'vite.config.js',
  'scripts/verify-vite-server.mjs',
];
assert(originalM145.every(key => typeof manifest.approvedModifiedSha256[key] === 'string') &&
  Object.keys(manifest.approvedModifiedSha256).length === originalM145.length + 1 &&
  manifest.approvedModifiedSha256['.github/workflows/ci.yml'] ===
    '110ab17a0c88711892054b3c9c2420375e556533f41cfdd706f0ecd0f9bce4cb',
  'original 11 M145 modifications or single governed CI successor digest changed');
const { modules, moduleDefinitionsById, normalizedModuleDataRegistry } = await import('../config/modules.ts');
const { moduleRegistry } = await import('../assets/js/features/modules/index.ts');
const { createRoutePolicyService } = await import('../assets/js/runtime/services/route-policy.ts');
assert(modules.length === 0 && moduleRegistry.all.length === 0 && moduleRegistry.active().length === 0, 'runtime module catalogue must be empty');
assert(Object.keys(moduleDefinitionsById).length === 0 && normalizedModuleDataRegistry.descriptors.length === 0, 'legacy descriptors exposed');
const policy = createRoutePolicyService();
const makeContext = (route, authenticated = true, canManageUsers = true) => ({
  route, initialized:true, authenticated,
  status: authenticated ? 'authenticated' : 'anonymous',
  canManageUsers, canAccessModule: () => true, // Even an unsafe caller cannot revive an unregistered application.
});
for (const id of retired) {
  assert(!moduleRegistry.has(id) && moduleRegistry.get(id) === null, `${id} still registered`);
  assert(policy.decide(makeContext({name:'app', moduleId:id})).kind === 'render-forbidden', `${id} route allowed`);
}
assert(policy.decide(makeContext({name:'app', moduleId:'unregistered-future-module'})).kind === 'render-forbidden', 'unregistered future module allowed');
assert(policy.decide(makeContext({name:'app'})).kind === 'render-forbidden', 'empty module route allowed');
for (const name of ['home','boards','board','settings','account','users']) {
  assert(policy.decide(makeContext({name})).kind === 'allow', `authenticated core ${name} blocked`);
}
assert(policy.decide(makeContext({name:'users'},true,false)).kind === 'render-forbidden', 'users permission bypass');
assert(policy.decide(makeContext({name:'boards'},false)).kind === 'redirect', 'anonymous Boards permission bypass');
assert(policy.decide(makeContext({name:'login'},false)).kind === 'allow', 'public login blocked');
assert(policy.decide(makeContext({name:'login'},true)).kind === 'redirect', 'signed-in login redirect broken');
for (const dir of ['src/app/shell','src/app/auth','src/app/management','src/features/boards']) {
  assert(fs.statSync(path.join(root,dir)).isDirectory(), `missing core directory ${dir}`);
}
if (process.argv.includes('--dist')) {
  const dist = path.join(root,'dist');
  assert(fs.existsSync(path.join(dist,'index.html')), 'missing production index');
  const walk = (dir) => fs.readdirSync(dir, { withFileTypes:true }).flatMap(item => {
    const abs=path.join(dir,item.name);
    assert(!item.isSymbolicLink(), `symlink in dist ${abs}`);
    return item.isDirectory() ? walk(abs) : [abs];
  });
  const files=walk(dist);
  assert(files.length > 0, 'empty production build');
  for (const file of files) {
    const rel=path.relative(dist,file).split(path.sep).join('/');
    assert(!retired.some(id=>rel.startsWith(`apps/${id}/`)||rel.includes(`/apps/${id}/`)), `retired app emitted: ${rel}`);
  }
  const index=fs.readFileSync(path.join(dist,'index.html'),'utf8');
  assert(index.includes('id="app"'), 'no host mount entry');
  assert(!retired.some(id=>index.includes(`apps/${id}/`)), 'retired app in host index');
  // Complete artifact manifest makes a standalone verification report reproducible.
  const digest = crypto.createHash('sha256').update(index).digest('hex');
  console.log(`M145 current-core and retired-route successor PASS; dist files=${files.length}; index SHA256=${digest}`);
} else {
  console.log('M145 current-core and retired-route successor PASS (no database writes; no browser session claimed)');
}

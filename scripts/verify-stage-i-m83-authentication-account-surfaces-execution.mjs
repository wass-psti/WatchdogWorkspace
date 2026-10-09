import fs from 'node:fs'; import path from 'node:path'; import process from 'node:process'; import {spawnSync} from 'node:child_process';
const root=process.cwd(), failures=[]; const read=p=>fs.readFileSync(path.join(root,p),'utf8'); const ok=(c,m)=>{if(!c)failures.push(m)};
const guard=spawnSync(process.execPath,['scripts/verify-m108-login-successor.mjs'],{cwd:root,encoding:'utf8'}); ok(guard.status===0,`M83 source guard failed: ${(guard.stderr||guard.stdout).trim()}`);
const auth=read('src/app/auth/AuthenticationUI.tsx'), account=read('src/app/management/AuthenticatedManagementUI.tsx'), css=read('assets/css/foundation/authentication-account-system.css');
for(const view of ['login','register','recovery','disabled']) ok(auth.includes(`runtime.view === '${view}'`),`M83 auth view lost: ${view}`);
for(const state of ["status === 'processing'","status === 'awaiting-confirmation'","status === 'success'"]) ok(auth.includes(state),`M83 verification state lost: ${state}`);
ok(auth.includes('WMErrorState className="verification-state error"'),'M83 verification error state lost');
for(const invariant of ['minLength={10}','autoComplete="current-password"','autoComplete="new-password"','registrationCooldownRemaining','setRegistrationCooldown']) ok(auth.includes(invariant),`M83 auth invariant lost: ${invariant}`);
for(const invariant of ['describeAccountSession(auth)','auth.platformRoleLabel','auth.moduleRole(module.id)','auth.canAccessModule(module.id)','Current session expiry']) ok(account.includes(invariant),`M83 account identity/session invariant lost: ${invariant}`);
ok(!css.includes('display:none!important')&&!css.includes('pointer-events:none!important'),'M83 visual CSS must not disable functional controls');
ok(!css.includes('transition:all'),'M83 visual CSS must not introduce broad transition-all');
if(failures.length){console.error('M83 authentication/account deterministic verification FAILED'); failures.forEach(f=>console.error(` - ${f}`)); process.exit(1)}
console.log('M83 authentication/account deterministic verification: PASS');
console.log('Validated login/register/recovery/disabled/verification/account surface coverage, responsive/accessibility presentation, and preserved authentication/session semantics.');

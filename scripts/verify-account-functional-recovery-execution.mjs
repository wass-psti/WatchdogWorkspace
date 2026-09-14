import assert from 'node:assert/strict';
import { createAccountService, describeAccountSession } from '../assets/js/features/account/account-service.ts';

const calls = [];
const auth = {
  state: { status:'authenticated', error:null, session:{ expires_at:Date.now()+60_000 } },
  async updateProfile(input){ calls.push(['profile', input]); },
  async revalidateAccessContext(input){ calls.push(['refresh', input]); },
  async updatePassword(input){ calls.push(['password', input]); return true; },
  async signOut(input){ calls.push(['signout', input]); },
};
const service = createAccountService(auth);
await service.saveProfile('  Example User  ');
assert.deepEqual(calls.at(-1), ['profile', { displayName:'Example User' }]);
await service.refreshAccess();
assert.deepEqual(calls.at(-1), ['refresh', { force:true, maxAgeMs:5_000 }]);
await assert.rejects(() => service.changePassword('1234567890','different-password'), /Passwords do not match/);
assert.equal(calls.some(([kind]) => kind === 'password'), false, 'mismatch must not mutate password');
const changed = await service.changePassword('new-password-123','new-password-123');
assert.equal(changed.passwordChanged, true);
assert.equal(changed.signedOutGlobally, true);
assert.deepEqual(calls.slice(-2), [['password',{password:'new-password-123'}],['signout',{scope:'global'}]]);
const failingAuth = { ...auth, async signOut(){ throw new Error('offline'); } };
const recovery = await createAccountService(failingAuth).changePassword('new-password-456','new-password-456');
assert.equal(recovery.passwordChanged, true);
assert.equal(recovery.signedOutGlobally, false);
assert.match(recovery.warning, /Password changed/);
const healthy = describeAccountSession(auth);
assert.equal(healthy.label, 'Authenticated');
const disabled = describeAccountSession({ state:{ status:'disabled', error:'This account has been disabled.', session:auth.state.session } });
assert.equal(disabled.label, 'Disabled');
const accessError = describeAccountSession({ state:{ status:'access-error', error:'Temporary access failure', session:auth.state.session } });
assert.equal(accessError.label, 'Access error');
console.log('Stage G M41 account functional recovery execution verification: PASS (vectors=9; profile=true; accessRefresh=true; passwordSequencing=true; globalRevocationRecovery=true; sessionStates=true)');

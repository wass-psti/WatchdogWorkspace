import assert from 'node:assert/strict';
import { authenticationUiRuntime } from '../src/app/auth/authentication-ui-runtime.ts';

const initial = authenticationUiRuntime.resetForTest();
assert.equal(initial.view, 'boot');
assert.deepEqual(initial.registrationDraft, { displayName: '', email: '' });

let notifications = 0;
const unsubscribe = authenticationUiRuntime.subscribe(() => { notifications += 1; });

authenticationUiRuntime.show('login');
assert.equal(authenticationUiRuntime.getSnapshot().view, 'login');

authenticationUiRuntime.setFeedback('Sign-in recovery guidance', 'warning');
authenticationUiRuntime.setPendingConfirmationEmail('  person@example.com  ');
authenticationUiRuntime.setNeedsConfirmation(true);
assert.equal(authenticationUiRuntime.getSnapshot().pendingConfirmationEmail, 'person@example.com');
assert.equal(authenticationUiRuntime.getSnapshot().needsConfirmation, true);
assert.equal(authenticationUiRuntime.getSnapshot().feedbackTone, 'warning');

authenticationUiRuntime.show('register');
authenticationUiRuntime.setRegistrationDraft({ displayName: 'Example User', email: ' user@example.com ' });
const registerSnapshot = authenticationUiRuntime.getSnapshot();
assert.equal(registerSnapshot.view, 'register');
assert.deepEqual(registerSnapshot.registrationDraft, { displayName: 'Example User', email: 'user@example.com' });
assert.equal('password' in registerSnapshot, false);
assert.equal('confirmPassword' in registerSnapshot, false);
assert.equal('password' in registerSnapshot.registrationDraft, false);
assert.equal('confirmPassword' in registerSnapshot.registrationDraft, false);

authenticationUiRuntime.showCallbackProgress();
assert.equal(authenticationUiRuntime.getSnapshot().view, 'verify');
assert.equal(authenticationUiRuntime.getSnapshot().callbackProcessing, true);
authenticationUiRuntime.completeCallbackProgress();
assert.equal(authenticationUiRuntime.getSnapshot().callbackProcessing, false);

authenticationUiRuntime.show('disabled');
assert.equal(authenticationUiRuntime.getSnapshot().view, 'disabled');
authenticationUiRuntime.deactivate();
assert.equal(authenticationUiRuntime.getSnapshot().view, 'hidden');
assert.ok(notifications >= 7, 'authentication UI runtime should notify subscribers across ownership/state transitions');
unsubscribe();

console.log('Stage C M12 authentication UI ownership execution vectors: PASS');

process.exit(0);

import { useEffect, useLayoutEffect, useState, type FormEvent, type ReactNode } from 'react';
import { auth } from '../../../assets/js/core/auth.ts';
import { navigate } from '../../../assets/js/core/router.ts';
import { authenticationUiRuntime } from './authentication-ui-runtime.ts';
import { useAuthenticationUiRuntime } from './useAuthenticationUiRuntime.ts';
import { presentationReadinessRuntime } from '../composition/presentation-readiness-runtime.ts';
import { WMButton, WMErrorState, WMField, WMIdentityBrand, WMIdentityPanel, WMIdentitySurface, WMInput, WMLoadingState, WMStatusMessage } from '../../design-system/index.ts';

type BusyAction = 'login' | 'register' | 'resend' | 'verify' | 'verify-resend' | 'signout' | 'recover' | null;

const messageOf = (error: unknown, fallback: string): string => error instanceof Error ? error.message : fallback;
const cooldownLabel = (milliseconds: number, fallback: string): string => milliseconds <= 0
  ? fallback
  : `Try again in ${Math.max(1, Math.ceil(milliseconds / 1000))}s`;

function Brand() {
  return (
    <WMIdentityBrand>
      <span className="brand-mark" aria-hidden="true"><i /><i /><i /><i /></span>
      <div><strong>Work Management</strong><small>Cloud identity</small></div>
    </WMIdentityBrand>
  );
}

function AuthenticationShell({ kicker, title, children }: { readonly kicker: string; readonly title: string; readonly children: ReactNode }) {
  return (
    <WMIdentitySurface data-wm-authentication-ui-host="" data-wm-composition-owner="react-authentication-ui" data-wm-host-migrated="authentication" data-wm-m83-surface="authentication">
      <WMIdentityPanel kicker={kicker} title={title} data-wm-authentication-ui-view={authenticationUiRuntime.getSnapshot().view}>
        <Brand />
        {children}
      </WMIdentityPanel>
    </WMIdentitySurface>
  );
}

function Feedback({ message, tone }: { readonly message: string; readonly tone: 'success' | 'warning' }) {
  if (!message) return null;
  return <WMStatusMessage className={`auth-message ${tone}`} tone={tone} title={message} announcement={tone === 'warning' ? 'assertive' : 'polite'} />;
}

function BootView() {
  return (
    <main id="main" className="boot-screen wm-identity-boot" data-wm-authentication-ui-host="" data-wm-m83-surface="boot" data-wm-composition-owner="react-authentication-ui" data-wm-authentication-ui-view="boot" aria-live="polite">
      <span aria-hidden="true" />
      <strong>Starting Work Management</strong>
      <small>Initializing workspace and identity services.</small>
    </main>
  );
}

export function AuthenticationUI() {
  const runtime = useAuthenticationUiRuntime((value) => value);
  const [busy, setBusy] = useState<BusyAction>(null);
  const [, setCooldownTick] = useState(0);

  useEffect(() => {
    setBusy(null);
  }, [runtime.view]);

  useLayoutEffect(() => {
    if (runtime.view === 'hidden') return;
    const root = document.querySelector<HTMLElement>('[data-wm-authentication-ui-host]');
    const main = root?.matches('#main') ? root : root?.querySelector<HTMLElement>('#main');
    if (!main) return;
    presentationReadinessRuntime.acknowledge('auth', main);
    return () => presentationReadinessRuntime.release('auth', main);
  }, [runtime.view, runtime.authRevision]);

  useEffect(() => {
    if (runtime.view !== 'login' && runtime.view !== 'register') return;
    const timer = window.setInterval(() => setCooldownTick((value) => value + 1), 1000);
    return () => window.clearInterval(timer);
  }, [runtime.view]);

  useEffect(() => {
    if ((runtime.view === 'login' || runtime.view === 'register') && !auth.isCloudEnabled) navigate('');
  }, [runtime.view, runtime.authRevision]);

  const resendRemaining = auth.registrationCooldownRemaining('resend', runtime.pendingConfirmationEmail);
  const signupRemaining = auth.registrationCooldownRemaining('signup', runtime.registrationDraft.email);

  if (runtime.view === 'hidden') return null;
  if (runtime.view === 'boot') return <BootView />;

  const go = (route: string): void => { navigate(route); };

  const submitLogin = async (event: FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();
    if (busy) return;
    const values = new FormData(event.currentTarget);
    const email = String(values.get('email') || '').trim();
    const password = String(values.get('password') || '');
    authenticationUiRuntime.setPendingConfirmationEmail(email);
    authenticationUiRuntime.setFeedback('', 'success');
    setBusy('login');
    try {
      await auth.signIn(email, password);
      authenticationUiRuntime.setNeedsConfirmation(false);
      authenticationUiRuntime.setPendingConfirmationEmail('');
      go(authenticationUiRuntime.consumeReturnRoute());
    } catch (error) {
      authenticationUiRuntime.setFeedback(messageOf(error, 'Authentication could not be completed.'), 'warning');
      authenticationUiRuntime.setNeedsConfirmation(auth.isEmailNotConfirmedError(error));
    } finally {
      setBusy(null);
    }
  };

  const submitRegister = async (event: FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();
    if (busy) return;
    const values = new FormData(event.currentTarget);
    const displayName = String(values.get('displayName') || '').trim();
    const email = String(values.get('email') || '').trim();
    const password = String(values.get('password') || '');
    const confirmPassword = String(values.get('confirmPassword') || '');
    authenticationUiRuntime.setRegistrationDraft({ displayName, email });
    authenticationUiRuntime.setFeedback('', 'success');
    setBusy('register');
    try {
      if (password.length < 10) throw new Error('Use a password with at least 10 characters.');
      if (password !== confirmPassword) throw new Error('Passwords do not match.');
      const result = await auth.signUp({ email, password, displayName });
      authenticationUiRuntime.setPendingConfirmationEmail(email);
      if (result.sessionCreated) {
        authenticationUiRuntime.setNeedsConfirmation(false);
        authenticationUiRuntime.setPendingConfirmationEmail('');
        authenticationUiRuntime.setRegistrationDraft({ displayName: '', email: '' });
        go(authenticationUiRuntime.consumeReturnRoute());
      } else {
        authenticationUiRuntime.setNeedsConfirmation(true);
        auth.setRegistrationCooldown('resend', email, 60_000);
        authenticationUiRuntime.setFeedback('Registration submitted. Confirm your email address before signing in.', 'success');
        go('login');
      }
    } catch (error) {
      authenticationUiRuntime.setFeedback(messageOf(error, 'Authentication could not be completed.'), 'warning');
    } finally {
      setBusy(null);
    }
  };

  const resendConfirmation = async (): Promise<void> => {
    if (busy) return;
    setBusy('resend');
    try {
      await auth.resendSignupConfirmation(runtime.pendingConfirmationEmail);
      authenticationUiRuntime.setFeedback('A new confirmation email was sent. Open the newest message and use its confirmation link before signing in.', 'success');
    } catch (error) {
      authenticationUiRuntime.setFeedback(messageOf(error, 'The confirmation email could not be resent.'), 'warning');
    } finally {
      setBusy(null);
    }
  };

  const confirmVerification = async (): Promise<void> => {
    if (busy) return;
    setBusy('verify');
    try {
      const result = await auth.confirmPendingCallback();
      if (result?.verified && result?.sessionCreated) await auth.init({ forceStorage: true });
      authenticationUiRuntime.setFeedback(auth.state.verification?.message || '', result?.verified ? 'success' : 'warning');
    } catch (error) {
      authenticationUiRuntime.setFeedback(messageOf(error, 'Email verification could not be completed.'), 'warning');
    } finally {
      setBusy(null);
    }
  };

  const submitVerificationResend = async (event: FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();
    if (busy) return;
    const values = new FormData(event.currentTarget);
    const email = String(values.get('email') || '').trim();
    authenticationUiRuntime.setPendingConfirmationEmail(email);
    setBusy('verify-resend');
    try {
      await auth.resendSignupConfirmation(email);
      authenticationUiRuntime.setFeedback('A new confirmation email was sent. Use the newest link; older verification links may no longer be valid.', 'success');
      authenticationUiRuntime.setNeedsConfirmation(true);
      go('login');
    } catch (error) {
      const message = messageOf(error, 'The confirmation email could not be resent.');
      auth.state.verification = { status: 'error', code: 'resend_failed', message, sessionCreated: false };
      authenticationUiRuntime.setFeedback(message, 'warning');
    } finally {
      setBusy(null);
    }
  };

  const signOutDisabledAccount = async (): Promise<void> => {
    if (busy) return;
    setBusy('signout');
    try {
      await auth.signOut({ scope: 'local' });
      authenticationUiRuntime.setFeedback('', 'success');
      go('login');
    } catch (error) {
      authenticationUiRuntime.setFeedback(messageOf(error, 'Sign out could not be completed.'), 'warning');
    } finally {
      setBusy(null);
    }
  };

  const retrySessionRecovery = async (): Promise<void> => {
    if (busy) return;
    setBusy('recover');
    try {
      await auth.init({ forceStorage: true });
      if (auth.isAuthenticated) {
        authenticationUiRuntime.setFeedback('Session and access context restored.', 'success');
        go(authenticationUiRuntime.consumeReturnRoute());
      } else if (auth.state.status === 'access-error') {
        authenticationUiRuntime.setFeedback(auth.state.error || 'Access validation is still unavailable.', 'warning');
      } else {
        go('login');
      }
    } catch (error) {
      authenticationUiRuntime.setFeedback(messageOf(error, 'Session recovery could not be completed.'), 'warning');
    } finally {
      setBusy(null);
    }
  };

  if (runtime.view === 'login') {
    const setup = !auth.isConfigured;
    return (
      <AuthenticationShell kicker="SECURE ACCESS" title="Sign in to your workspace">
        {setup ? <WMStatusMessage className="auth-message warning" tone="warning" title="Account backend is not configured." description={<span>Set <code>VITE_SUPABASE_URL</code> and <code>VITE_SUPABASE_PUBLISHABLE_KEY</code> in your Vite environment. Never place a secret or service-role key in client configuration.</span>} announcement="assertive" /> : null}
        <Feedback message={runtime.feedbackMessage} tone={runtime.feedbackTone} />
        {runtime.needsConfirmation ? <div className="auth-confirmation-help"><strong>Email confirmation is still required.</strong><span>Confirm the address from the Supabase email, or request a new message after the cooldown. Repeated requests are intentionally blocked to avoid unnecessary email API calls.</span><button type="button" className="secondary-btn" data-resend-confirmation onClick={() => void resendConfirmation()} disabled={Boolean(busy) || !auth.isConfigured || resendRemaining > 0}>{busy === 'resend' ? 'Requesting…' : cooldownLabel(resendRemaining, 'Resend confirmation email')}</button></div> : null}
        <form className="auth-form" data-auth-form="login" data-wm-authentication-ui-form="login" onSubmit={(event) => void submitLogin(event)}>
          <WMField label="Email" required><WMInput name="email" type="email" autoComplete="email" value={runtime.pendingConfirmationEmail} onChange={(event) => authenticationUiRuntime.setPendingConfirmationEmail(event.currentTarget.value)} required /></WMField>
          <WMField label="Password" required><WMInput name="password" type="password" autoComplete="current-password" minLength={8} required /></WMField>
          <WMButton className="primary-btn" variant="solid" type="submit" disabled={Boolean(busy) || !auth.isConfigured} loading={busy === 'login'}>{busy === 'login' ? 'Signing in…' : 'Sign in'}</WMButton>
        </form>
        {auth.backend.allowRegistration ? <p className="auth-switch">Need an account? <button type="button" data-auth-ui-nav="register" onClick={() => go('register')}>Register</button></p> : null}
        <p className="auth-security">Sessions use Supabase Auth. This client contains only public configuration; privileged keys remain server-side.</p>
      </AuthenticationShell>
    );
  }

  if (runtime.view === 'register') {
    return (
      <AuthenticationShell kicker="ACCOUNT CREATION" title="Register for Work Management">
        <Feedback message={runtime.feedbackMessage} tone={runtime.feedbackTone} />
        <form className="auth-form" data-auth-form="register" data-wm-authentication-ui-form="register" onSubmit={(event) => void submitRegister(event)}>
          <WMField label="Display name" required><WMInput name="displayName" type="text" autoComplete="name" maxLength={80} value={runtime.registrationDraft.displayName} onChange={(event) => authenticationUiRuntime.setRegistrationDraft({ ...runtime.registrationDraft, displayName: event.currentTarget.value })} required /></WMField>
          <WMField label="Email" required><WMInput name="email" type="email" autoComplete="email" value={runtime.registrationDraft.email} onChange={(event) => authenticationUiRuntime.setRegistrationDraft({ ...runtime.registrationDraft, email: event.currentTarget.value })} required /></WMField>
          <WMField label="Password" required><WMInput name="password" type="password" autoComplete="new-password" minLength={10} required /></WMField>
          <WMField label="Confirm password" required><WMInput name="confirmPassword" type="password" autoComplete="new-password" minLength={10} required /></WMField>
          <WMButton className="primary-btn" variant="solid" type="submit" disabled={Boolean(busy) || !auth.isConfigured || signupRemaining > 0} loading={busy === 'register'}>{busy === 'register' ? 'Creating account…' : cooldownLabel(signupRemaining, 'Create account')}</WMButton>
        </form>
        <p className="auth-switch">Already registered? <button type="button" data-auth-ui-nav="login" onClick={() => go('login')}>Sign in</button></p>
        <div className="auth-rate-note"><strong>Email delivery protection</strong><span>Registration is single-submit and cooldown protected. Supabase&apos;s built-in email service is low-volume; production deployments should configure Custom SMTP rather than repeatedly retrying a rate-limited request.</span></div>
        <p className="auth-security">New accounts are assigned the <strong>Employee</strong> role by the database trigger. Elevated roles are assigned by an Admin/General Manager and enforced by PostgreSQL/RLS.</p>
      </AuthenticationShell>
    );
  }

  if (runtime.view === 'recovery') {
    return (
      <AuthenticationShell kicker="SESSION RECOVERY" title="Access validation is temporarily unavailable">
        <Feedback message={runtime.feedbackMessage || auth.state.error || ''} tone="warning" />
        <WMStatusMessage className="auth-message warning" tone="warning" title="Your saved session has been preserved." description="Work Management could not validate the current profile and authorization context. Protected routes remain locked until validation succeeds." announcement="assertive" />
        <button type="button" className="primary-btn auth-full-button" data-wm-authentication-ui-action="retry-session" disabled={busy === 'recover'} aria-busy={busy === 'recover'} onClick={() => void retrySessionRecovery()}>{busy === 'recover' ? 'Retrying…' : 'Retry access validation'}</button>
        <button type="button" className="secondary-btn auth-full-button" data-wm-authentication-ui-action="signout" disabled={Boolean(busy)} onClick={() => void signOutDisabledAccount()}>Sign out this browser</button>
      </AuthenticationShell>
    );
  }

  if (runtime.view === 'disabled') {
    return (
      <AuthenticationShell kicker="ACCOUNT RESTRICTED" title="This account is disabled">
        <Feedback message={runtime.feedbackMessage} tone={runtime.feedbackTone} />
        <WMStatusMessage className="auth-message warning" tone="warning" title="Access has been suspended." description="Contact a platform administrator to restore the account. No application modules can be opened while the account is disabled." announcement="assertive" />
        <button type="button" className="primary-btn auth-full-button" data-wm-authentication-ui-action="signout" disabled={busy === 'signout'} aria-busy={busy === 'signout'} onClick={() => void signOutDisabledAccount()}>{busy === 'signout' ? 'Signing out…' : 'Sign out'}</button>
      </AuthenticationShell>
    );
  }

  const verification = auth.state.verification;
  const status = runtime.callbackProcessing ? 'processing' : (verification?.status || 'idle');
  const message = verification?.message || runtime.feedbackMessage || 'No active email verification request was found.';
  const emailValue = runtime.pendingConfirmationEmail || runtime.registrationDraft.email;

  if (status === 'processing') {
    return (
      <AuthenticationShell kicker="EMAIL VERIFICATION" title="Confirming your account">
        <WMLoadingState className="verification-state processing" title="Verifying email address…" description="Please keep this tab open while Work Management validates the one-time confirmation token with Supabase." announcement="polite" />
      </AuthenticationShell>
    );
  }
  if (status === 'awaiting-confirmation') {
    return (
      <AuthenticationShell kicker="EMAIL VERIFICATION" title="Activate your account">
        <div className="verification-state"><strong>Confirmation is ready</strong><p>{message}</p><button type="button" className="primary-btn" data-confirm-verification disabled={busy === 'verify'} aria-busy={busy === 'verify'} onClick={() => void confirmVerification()}>{busy === 'verify' ? 'Confirming…' : 'Confirm email address'}</button></div>
        <p className="auth-security">The verification token is submitted only after you explicitly confirm, reducing accidental consumption by email link scanners and preview services.</p>
      </AuthenticationShell>
    );
  }
  if (status === 'success') {
    const target = auth.isAuthenticated ? '' : 'login';
    return (
      <AuthenticationShell kicker="EMAIL VERIFIED" title="Your email is confirmed">
        <div className="verification-state success" role="status"><strong>Account verification completed.</strong><p>{message}</p><button type="button" className="primary-btn" data-auth-ui-nav={target || 'home'} onClick={() => go(target)}>{auth.isAuthenticated ? 'Continue to Work Management' : 'Continue to sign in'}</button></div>
        <p className="auth-security">Verification is stored by Supabase Auth and is not based on browser-only state.</p>
      </AuthenticationShell>
    );
  }

  return (
    <AuthenticationShell kicker="VERIFICATION RECOVERY" title="Confirm your email">
      <WMErrorState className="verification-state error" title="Verification could not be completed." description={message} announcement="assertive" />
      <Feedback message={runtime.feedbackMessage && runtime.feedbackMessage !== message ? runtime.feedbackMessage : ''} tone={runtime.feedbackTone} />
      <form className="auth-form compact" data-auth-form="verify-resend" data-wm-authentication-ui-form="verify-resend" onSubmit={(event) => void submitVerificationResend(event)}>
        <WMField label="Email" required><WMInput name="email" type="email" autoComplete="email" value={emailValue} onChange={(event) => authenticationUiRuntime.setPendingConfirmationEmail(event.currentTarget.value)} required /></WMField>
        <button className="secondary-btn" type="submit" disabled={busy === 'verify-resend'} aria-busy={busy === 'verify-resend'}>{busy === 'verify-resend' ? 'Requesting…' : 'Send a new confirmation email'}</button>
      </form>
      <p className="auth-switch">Already confirmed? <button type="button" data-auth-ui-nav="login" onClick={() => go('login')}>Sign in</button></p>
    </AuthenticationShell>
  );
}

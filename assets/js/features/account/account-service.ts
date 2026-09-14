export interface AccountAuthPort {
  readonly state: Readonly<{ status: string; error?: string | null; session?: Readonly<{ expires_at?: number }> | null }>;
  updateProfile(input: Readonly<{ displayName: string }>): Promise<unknown>;
  revalidateAccessContext(input?: Readonly<{ force?: boolean; maxAgeMs?: number }>): Promise<unknown>;
  updatePassword(input: Readonly<{ password: string }>): Promise<boolean>;
  signOut(input?: Readonly<{ scope?: 'local' | 'global'; broadcast?: boolean }>): Promise<void>;
}

export interface PasswordChangeOutcome {
  readonly passwordChanged: boolean;
  readonly signedOutGlobally: boolean;
  readonly warning: string | null;
}

export interface AccountSessionPresentation {
  readonly label: string;
  readonly tone: 'success' | 'warning' | 'muted';
  readonly detail: string;
}

const clean = (value: unknown): string => String(value ?? '').trim();

export function describeAccountSession(auth: Pick<AccountAuthPort, 'state'>, now = Date.now()): AccountSessionPresentation {
  const status = clean(auth.state.status) || 'unknown';
  const expiresAt = Number(auth.state.session?.expires_at || 0);
  const expiry = expiresAt > 0 ? new Date(expiresAt).toLocaleString() : 'unavailable';
  if (status === 'authenticated' && expiresAt > now) return Object.freeze({ label: 'Authenticated', tone: 'success', detail: `Session expires ${expiry}.` });
  if (status === 'restoring' || status === 'initializing') return Object.freeze({ label: 'Restoring', tone: 'muted', detail: 'Authentication and account access are being restored.' });
  if (status === 'disabled') return Object.freeze({ label: 'Disabled', tone: 'warning', detail: auth.state.error || 'This account is disabled.' });
  if (status === 'access-error') return Object.freeze({ label: 'Access error', tone: 'warning', detail: auth.state.error || 'The account access context could not be validated.' });
  if (status === 'expired' || (expiresAt > 0 && expiresAt <= now)) return Object.freeze({ label: 'Expired', tone: 'warning', detail: auth.state.error || 'The session has expired and must be refreshed or signed in again.' });
  if (status === 'invalid' || status === 'terminated') return Object.freeze({ label: 'Invalid', tone: 'warning', detail: auth.state.error || 'The authenticated session is no longer usable.' });
  if (status === 'anonymous') return Object.freeze({ label: 'Signed out', tone: 'muted', detail: 'No authenticated session is active.' });
  return Object.freeze({ label: status || 'Unknown', tone: 'muted', detail: auth.state.error || `Session expiry: ${expiry}.` });
}

export function createAccountService(auth: AccountAuthPort) {
  return Object.freeze({
    async saveProfile(displayName: string): Promise<void> {
      await auth.updateProfile({ displayName: clean(displayName) });
    },
    async refreshAccess(): Promise<void> {
      await auth.revalidateAccessContext({ force: true, maxAgeMs: 5_000 });
    },
    async changePassword(password: string, confirmPassword: string): Promise<PasswordChangeOutcome> {
      if (password !== confirmPassword) throw new Error('Passwords do not match.');
      await auth.updatePassword({ password });
      try {
        await auth.signOut({ scope: 'global' });
        return Object.freeze({ passwordChanged: true, signedOutGlobally: true, warning: null });
      } catch {
        return Object.freeze({
          passwordChanged: true,
          signedOutGlobally: false,
          warning: 'Password changed, but Work Management could not confirm global session revocation. This browser remains signed in so you can retry “Sign out all sessions”.',
        });
      }
    },
    async signOut(scope: 'local' | 'global'): Promise<void> {
      await auth.signOut({ scope });
    },
  });
}

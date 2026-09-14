/**
 * Authentication domain facade.
 *
 * Stage C M12 moves login, registration, verification, disabled-account
 * presentation and transient UI state into the React authentication boundary.
 * Supabase Auth remains authoritative in core/auth.ts. This feature facade is
 * intentionally non-rendering and remains only as the typed runtime gateway for
 * identity/session consumers that have not yet migrated to direct composition.
 */
import { auth, AUTH_EVENT } from '../../core/auth.ts';

export { auth, AUTH_EVENT };

export const AUTH_FEATURE = Object.freeze({
  id: 'auth',
  owns: Object.freeze(['login', 'register', 'verify']),
  persistence: 'supabase-auth',
  presentation: 'react-authentication-ui-v1',
  authority: 'assets/js/core/auth.ts',
});

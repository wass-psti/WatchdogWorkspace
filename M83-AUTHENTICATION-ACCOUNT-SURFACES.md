# M83 — Authentication & Account Surfaces

## Scope
M83 migrates Work Management authentication and account presentation into the Stage I visual system while preserving authentication, session, authorization, identity, profile and account-operation semantics.

### Included surfaces
- Boot/identity initialization.
- Sign in.
- Registration.
- Email confirmation and resend states.
- Verification processing/success/error recovery.
- Session recovery.
- Disabled-account state.
- Authenticated Account page: identity, platform role, profile display name, module role mapping, password update, local/global sign-out.

### Preserved authorities
- M12: authentication operations and UI runtime semantics.
- M13: account/profile/user-management operation semantics.
- M39: session/access-context lifecycle.
- M41: account recovery semantics.
- M44: authenticated management authority.
- Supabase remains the authentication/profile identity backend authority.

M83 is a presentation-only successor for these surfaces. It does not alter token storage, session restoration, refresh behavior, sign-in/sign-up requests, email confirmation behavior, authorization/RBAC decisions, password-revocation behavior, profile persistence or backend contracts.

## Visual architecture
M83 adds `authentication-account-system.css` and typed presentation wrappers (`WMIdentitySurface`, `WMIdentityPanel`, `WMIdentityBrand`, `WMAccountSurface`, `WMAccountSection`). Existing functional data attributes, form names, action handlers and account-operation runtime calls remain intact.

Responsive behavior is governed by the certified M62 breakpoints. Reduced-motion and forced-colors handling are explicit. No functional control may be hidden for visual-budget reasons.

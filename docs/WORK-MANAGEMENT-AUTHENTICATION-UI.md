# Work Management Authentication UI — Stage C Milestone 12

Milestone 12 moves standalone Work Management authentication presentation into React without changing authentication security policy or backend authority.

## Authority model

- `src/app/auth/AuthenticationUI.tsx` owns boot, login, registration, verification, resend/recovery, and disabled-account presentation.
- `src/app/auth/authentication-ui-runtime.ts` owns only safe presentation/transient route state and publishes it through `useSyncExternalStore`.
- `assets/js/core/auth.ts` remains the authoritative Supabase Auth/session/token/profile runtime, including callback parsing, token verification, session refresh/revocation, registration/resend cooldowns, account status, and RBAC/profile hydration.
- `assets/js/app.ts` remains the typed route-policy bridge and activates/deactivates the React authentication UI according to the existing route policy.
- M10 `LegacyApplicationBoundary` remains page-lifetime stable but is hidden and inert whenever the React authentication UI is active.
- M11 `GlobalOverlayHost` remains a page-lifetime sibling on authentication routes.

## Security and state rules

Password and password-confirmation values are read from the submitted React form and passed directly to the existing auth authority. They are not placed in the authentication UI runtime, Zustand, local storage, session storage, query state, or diagnostic state. The runtime may retain only safe display-name/email draft state, feedback, confirmation email, confirmation-needed status, callback-processing status, and an auth revision counter.

Supabase publishable configuration remains the only browser credential. Service-role/secret keys remain prohibited. Database authorization and disabled-account enforcement remain RLS/RPC-backed.

## Preserved flows

M12 preserves:

- password sign-in and session establishment;
- registration with database-default Employee role;
- email-confirmation-required recovery;
- confirmation resend cooldowns and rate-limit guidance;
- `token_hash` and implicit callback handling;
- explicit verification confirmation;
- session refresh and revoked-session recovery;
- disabled-account blocking and local sign-out;
- return-route restoration after successful authentication.

## Accessibility and interaction

The React UI retains labeled fields, native form semantics, focusable controls, live status/alert feedback, `aria-busy` on asynchronous actions, explicit confirmation controls, and established responsive authentication styling. The browser certification contract verifies a single React authentication owner and a hidden stable legacy route-content host on the standalone login route.

## Temporary compatibility boundaries

The following are intentional Stage C continuation boundaries:

- authenticated Account/Profile and User Management screens remain existing typed feature compatibility content;
- Home, Boards, Settings, and other non-authentication route content remain inside the M10 legacy route-content island;
- M11 overlay contents may still be imperative even though their page-level roots are React-owned;
- embedded TimeTracker, FuelTrack+, and TradeLink remain same-origin iframe runtimes and continue consuming host-authenticated identity rather than implementing independent host login flows.

## Database and dependencies

M12 adds no npm dependency and requires no Supabase migration.

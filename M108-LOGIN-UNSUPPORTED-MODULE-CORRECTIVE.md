# M108 — Login access-context compatibility corrective

State: IMPLEMENTATION COMPLETE — LOCAL VERIFICATION/CERTIFICATION REMAINS.

Observed screenshot: `Module assignment payload contains an unsupported module id.`

Root cause evidenced in source: `assets/js/core/auth.ts` rejected any row in `wm_auth_access_context.assignments` whose module ID was not one of the four compiled host module IDs. Because this parser runs during identity hydration, an unrelated/future/retired assignment prevents the session from entering the authenticated state. The exact live unknown module ID and live RPC response are not available.

Corrective: retain strict schema and user-ID validation for every assignment row; only retain recognized module assignments when returning host authorization context. Existing supported-module roles, permission decisions, account status, Supabase session and refresh logic are untouched. No SQL migration is necessary for this client-only compatibility defect. Unknown module assignments grant no permissions to the existing host modules.

Verification: run `node verify-m108-login-unsupported-module-corrective.mjs`, `node verify-stage-g-m39-auth-session-access-context.mjs`, `node verify-auth-backend.mjs`, and `node --experimental-strip-types scripts/verify-auth-session-access-context-execution.mjs`. Full hosted Supabase sign-in, database RLS, runtime browser, and repository-wide historic certification require execution in the user's deployment environment. Do not claim production certification based on the above local checks.

# M42 Identity Publication Browser Corrective

## Trigger

The target Mac browser gate reached 5/6 scenarios, with only `@m42-self-role` timing out in `waitForM39Identity`.

## Verified corrective

The M39 browser helper previously coupled persisted/auth identity readiness to `WorkManagementRuntime.getContext().authenticated`. That runtime client context is a general SDK operation context and is not the authoritative Work Management authentication state. The authoritative browser contract is the `identity.current` runtime service backed by `AuthManager.snapshot()` plus the persisted `wm.platform.identity.v1` identity context.

M42 now waits for both authoritative sources to agree on role/status. The self-role scenario also asserts the RPC mutation, fixture role/status/revision advance, a post-mutation access-context request, and assignment/user identity consistency before waiting on persisted identity publication.

No production authorization guard was weakened. M39 access-context identity validation and M40 shell-owned forbidden-route behavior remain intact.

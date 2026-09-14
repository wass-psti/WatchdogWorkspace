# Stage G M40 — Browser Lifecycle Corrective

This corrective continues M40 without advancing its certification state. It addresses only defects demonstrated by the target-Mac browser run.

## Corrected

- The repeated-navigation browser matrix now performs real hash transitions on every step. The prior matrix opened the command palette while already on `#/` and reassigned the identical hash, which does not dispatch `hashchange`; that no-op was incorrectly treated as a route transition.
- Route focus handoff is now owner-specific and generation-guarded. Authentication, management, Boards, shell/runtime, Home, and embedded-module owners resolve their own active main target rather than accepting a stale main element from another presentation.
- Post-commit focus retries for a bounded number of animation frames so same-URL ownership changes can wait for React external-store presentation updates to mount before focus is applied.
- A new transition cancels any pending focus frame, preventing a superseded route from stealing focus later.
- Same-URL identity-revalidation tests start revalidation without coupling Playwright's `page.evaluate` lifetime to the returned promise, then explicitly verify that revalidation settles successfully. This preserves the M39 authority assertion while producing deterministic M40 lifecycle diagnostics.
- The repeated route-cycle scenario has a larger overall timeout because it performs 21 real transitions and overlay assertions; individual expectation timeouts remain unchanged.

## Not changed

- M39 authentication/session/access-context behavior.
- Account, Users, or Settings feature correctness assigned to M41-M43.
- Boards domain/data behavior assigned to M45+.
- Embedded application business logic.

## Certification

M40 remains `implementation-complete-pending-certification` until the corrected browser matrix, full historical suite, release check, and transactional M40 activation all pass on the target Mac environment.


## Verification in the build environment

- M40 static: 38 checks PASS.
- M40 deterministic: 8/8 vectors PASS.
- M39 compatibility: 48 checks and 10/10 vectors PASS under Architecture 48.
- M38 compatibility: 86 checks and 7/7 vectors PASS under Architecture 48.
- TypeScript: PASS.
- Historical verifier collector: 150/150 PASS.
- Secret scan: PASS after restoring the deployment-neutral checked-in backend fallback.
- Playwright discovery: exactly 3 M40 scenarios.
- Browser execution cannot start in this Linux build environment because the uploaded dependency tree contains the macOS Rolldown native binding and lacks the Linux/WASI binding required for Vite. This is an environment limitation before test execution; target-Mac browser certification remains required.

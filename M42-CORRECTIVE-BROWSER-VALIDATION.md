# M42 Corrective Browser Validation

State: implementation-complete-pending-certification

Corrective changes after the first target-Mac browser run:

1. Forced post-self-mutation access-context revalidation waits for any older in-flight access-context transaction to settle, then performs a new authoritative read. A pre-mutation promise can no longer satisfy the post-mutation forced refresh.
2. The M42 unauthorized/self-demotion Playwright contract now preserves the M40-certified route policy: forbidden `/users` presentation remains shell-owned, the management host is not active, and no user mutation UI is exposed.

Local dependency-independent evidence:
- M42 static verifier: PASS, 39 checks.
- M42 deterministic verifier: PASS, 17 vectors.
- Security baseline: PASS.
- UI verification: PASS.
- Historical collect-all: 136/152 PASS; the remaining 16 failures are dependency-resolution failures caused by an incomplete local npm install, not M42 assertion failures.

Certification remains blocked until the full target-Mac fail-closed gate, including 6/6 Playwright, database/RLS, dependency-backed historical verification, TypeScript, regressions, and final certification, passes.

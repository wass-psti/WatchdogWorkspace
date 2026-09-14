# M42 Browser Validation Candidate

State: implementation-complete-pending-certification.

Locally completed dependency-independent gates:
- M42 static verification: PASS (36 checks)
- M42 deterministic execution: PASS (12 vectors)
- Stage A security baseline: PASS
- UI verification suite: PASS
- RBAC/user-management historical verifier: PASS
- package-lock unchanged from M41 certified baseline: PASS

Not locally certified in the container:
- clean exact npm dependency installation (container registry transport/cache unavailable)
- TypeScript gate requiring the complete dependency tree
- Playwright M42 browser scenarios
- disposable Supabase pgTAP database/RLS suite (no usable Docker daemon)
- complete dependency-backed historical verifier sweep

Fail-closed rule: do not promote to active-certified, create a certified baseline, or record PASS until all target-environment gates succeed.

## Browser corrective synchronization

- Forced post-self-mutation access reconciliation now waits for any older in-flight access-context transaction to settle and then performs a new authoritative read.
- Unauthorized and self-demoted Users routes are verified against the M40-certified shell-owned forbidden presentation rather than the management React denied view.


## Third corrective candidate

Following the 5/6 target-Mac run, the remaining self-role failure was traced to fixture assignment ownership rather than production authorization logic. The fixture now preserves the authenticated user id after role mutation. M42 remains `implementation-complete-pending-certification` until the six-scenario browser gate and all downstream certification gates pass.


## Identity publication corrective

The latest target-Mac run remained at 5/6 because the shared `waitForM39Identity` helper coupled auth readiness to the generic runtime SDK context. M42 now validates persisted `wm.platform.identity.v1` against the authoritative `identity.current` service backed by `AuthManager.snapshot()`. The self-role scenario additionally proves mutation count, role/status transition, revision advancement, post-mutation access-context traffic, and assignment/user identity consistency before checking persisted identity publication.

Current source-level evidence: M42 static verification PASS (44 checks), deterministic verification PASS (29 vectors), security baseline PASS, UI verification PASS. Real-browser 6/6 and downstream certification gates remain required on the target Mac.


## Database corrective candidate

Target-Mac browser verification is now PASS at 6/6 scenarios. The next fail-closed gate exposed two database issues, both corrected in this candidate: `list_user_directory()` now qualifies profile columns through alias `p`, avoiding PL/pgSQL output-variable ambiguity, and `wm_runtime_capabilities()` now pins `search_path=public` in accordance with the existing pgTAP structural policy. The canonical schema, the originating M38/M42 migrations, and a forward M42 database corrective migration are synchronized. Re-run the full fail-closed sequence; certification remains pending until the database/RLS suite and all downstream gates pass.

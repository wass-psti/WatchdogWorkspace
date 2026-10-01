# M95 Corrective Loop — Dependency / Environment

**Execution classification:** CORRECTIVE LOOP  
**Loop origin:** Initial M95 clean dependency installation attempt.  
**Failed gate:** Ordered certification stage 3 — dependency installation and dependency-integrity validation.  
**Exact failure condition:** Network-backed `npm ci` did not complete within the execution transport window; subsequent direct registry resolution confirmed `registry.npmjs.org` could not be resolved. Offline recovery also failed because the local npm cache did not contain `zustand@5.0.15`.  
**Root-cause classification:** environment / dependency availability.  
**Implementation defect established:** no.  

## Corrective delta since prior checkpoint

- Removed the interrupted dependency tree before each clean retry.
- Verified the interrupted tree was not certifiable (`npm ls --depth=0` returned invalid/extraneous dependency state).
- Attempted cache-only recovery; it failed closed on the missing `zustand@5.0.15` tarball.
- Confirmed DNS/registry reachability failure independently using a direct registry request.
- Added the complete M95 fail-closed certification architecture so no downstream certification publication can occur while this gate is unresolved.
- Added M94-certified source provenance guarding and final publication integrity checks.

## Forward-progress evidence

- M95 M94-certified source guard: PASS.
- M95 responsive static verifier: PASS.
- M95 deterministic responsive execution verifier: PASS.
- New shell/Node certification scripts pass syntax validation.
- `package.json` parses successfully with the complete M95 certification command surface.

## Outstanding exit criterion

The loop is exited only when a clean environment can complete `npm ci`, dependency lockfile/integrity validation, and then every subsequent required gate in `scripts/certify-stage-i-m95-local.sh` succeeds without skips.

**Loop status:** ACTIVE — blocked at dependency installation/integrity.

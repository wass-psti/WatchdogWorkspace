# Stage G M40 Final Certification Evidence

## Certified milestone

Stage G M40 — React/Runtime Route Ownership & Lifecycle Recovery

## Source tree identity

The certified runtime/test implementation is the exact tree distributed as:

`Work-Management-App-v1.43.2-Stage-G-M40-Focus-Reconciliation-Browser-Validation-Candidate.zip`

SHA-256:

`fa12ce5aee4a361d9c45b018785601b14060e3c9708e17ec6f9a2f88235759bf`

## Target Mac browser evidence — 2026-09-12

The source tree above was extracted on the target Mac, installed with Node v22.16.0 / npm 10.9.2, and executed with:

- `npm run dependencies:ensure`
- `npm run route-lifecycle:check`
- `npm run route-lifecycle:test`
- `npm run route-lifecycle:browser`

Observed decisive browser result:

```
Running 3 tests using 1 worker
  3 passed (9.0s)
Stage G M40 route ownership/lifecycle browser verification: PASS (scenarios=3; repeatedCycles=3; surfaces=home/boards/users/settings/account/apps; sameUrlRevocation=true; disabledOwnership=true; duplicateHosts=0)
```

Static result: 65 checks PASS.
Deterministic result: 11/11 vectors PASS.
Dependency preflight: 15 exact direct dependencies PASS.

## Final local certification checks

After receipt of the browser-passing evidence, the identical implementation tree passed:

- `npm run dependencies:ensure`
- `npm run route-lifecycle:check`
- `npm run route-lifecycle:test`
- `npm run verify:historical-all` — 150/150 PASS

The final promotion changes certification metadata only:

- M40 activation state: `active-certified`
- release-status certification section
- this certification evidence record
- regenerated package checksums

No runtime, application, route lifecycle, focus reconciliation, presentation ownership, or browser-test implementation was changed after the target Mac `3 passed` result.

## Environment note

A redundant browser rerun in the Linux packaging environment is not treated as evidence because that environment cannot load the Linux Rolldown native binding from the pre-existing dependency tree. The authoritative browser execution is the target Mac run tied to the exact source ZIP SHA-256 above.

## Downstream scope

M40 certification does not certify M41-M54. The M26 same-origin iframe compatibility boundary remains where native retirement criteria have not yet been met.

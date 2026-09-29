# M77 Certification Handoff

Canonical input: the current M77 hosted-CI corrective continuation candidate, derived monotonically from the previously certified M77 baseline and returned to pending-certification state after the M49 CDP portability correction.

Required fail-closed order: environment → artifact/source validation → dependency materialization → M77 static → M77 deterministic → exact Playwright browser provisioning → Chromium/Firefox/WebKit × device matrix → complete release gate → dedicated M77 certification → post-certification artifact verification → historical regression → package hygiene → final checkpoint.

A certified M77 ZIP/PASS record is valid only when every gate succeeds and the terminal sentinel `ALL REQUIRED M77 LOCAL CERTIFICATION GATES PASSED` is reached.

## Corrective v7 canonical handoff

Continue only from the repository-complete Git-restorable source-identity corrective-v7 candidate. It monotonically retains all v6 fixes and adds M77 Git-mode normalization plus deterministic restoration regression coverage. A new certified baseline must be generated before publication.


## Corrective v8 canonical handoff

Run the repository-governed `npm run final-ui:git-roundtrip:test` during deterministic verification. Do not use an external `git update-ref` restoration shortcut. The roundtrip must materialize and verify the commit object before clone/checkout, and all downstream M77 gates remain fail-closed.

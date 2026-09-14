# Release Status — v1.43.2 Stage G M37 Functional Regression Baseline

**Implementation:** complete.

**Activation:** active-certified in the packaged RC; requires the operator/browser certification sequence.

**Scope:** Boards, Users, Settings, Account plus cross-module environment/test-coverage boundaries.

**Result:** regression inventory, deterministic source signatures, two-mode authenticated/unconfigured browser characterization, redacted runtime/network/backend evidence, and certification tooling are implemented. The first local certification attempt exposed fixture-bootstrap and generic-M30-runner coupling defects; this corrective continuation isolates fixture failures, proves authentication before route characterization, writes evidence on failure paths, and prevents M30 smoke from executing M37 tests under the wrong backend environment.

**Not remediated by M37:** all reported module functionality. M38+ owns repair.

**Production readiness:** blocked until Stage G recovery milestones restore and certify real functionality.

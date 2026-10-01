# M95 Local Verification / Certification Commands

Run from a clean extraction of the latest M95 continuation ZIP on **Node v22.16.0 / npm 10.9.2**.

The following single command executes the required fail-closed order:

```bash
set -euo pipefail
bash scripts/certify-stage-i-m95-local.sh
```

The script enforces this exact logical sequence:

1. Environment preparation.
2. Workspace/repository validation.
3. Dependency installation and dependency-integrity validation.
4. Static verification.
5. Deterministic automated tests.
6. Browser/E2E gate.
7. Dedicated M95 certification.
8. Post-certification repository/state validation.
9. Historical regression gate.
10. Checksum and package-hygiene verification.
11. Final checkpoint validation.
12. Certified artifact publication and Downloads handoff.

Because the script uses `set -euo pipefail`, any required failure stops execution immediately. No PASS record or certified M95 ZIP is created until every preceding required gate passes.


## v13 corrective continuation
The v12 release replay exited the M78 successor-authorization loop, then exposed a later historical Stage-I source-guard delegation defect at the M91→M90 boundary. v13 delegates provenance-bound M95 successor trees to the immediate M95→M94 guard while preserving strict pre-M95 behavior. Local fail-closed certification remains required.

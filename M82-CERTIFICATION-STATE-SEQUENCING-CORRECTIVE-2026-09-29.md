# M82 Certification-State Sequencing Corrective — 2026-09-29

## Trigger
A local fail-closed M82 certification run completed dedicated release verification successfully, then failed the immediate post-certification state check because `M82-CONTINUATION-STATE.md` used the noncanonical `**Authoritative state:**` label while M82 certification and publication scripts require `**State:**`.

## Corrective delta
- Restored the canonical `**State:** IMPLEMENTATION COMPLETE — LOCAL VERIFICATION/CERTIFICATION REMAINS` continuation marker.
- Hardened the M82 static verifier to reject the noncanonical marker.
- Changed the package-hygiene gate to verify a temporary prepublication candidate without creating a certified baseline or PASS record.
- Changed the normal final checkpoint to validate pending-regression state plus prepublication checksum/hygiene.
- Gated certified publication on successful final-checkpoint validation before any `active-certified`/FULLY COMPLETE promotion.
- Retained `--require-certified` final-checkpoint mode for post-publication integrity verification only.

## Governance effect
No product/runtime semantics change. No historical certification snapshot is rewritten. Certified artifacts and PASS records are now created only after all required prepublication gates, including the final checkpoint, have passed.

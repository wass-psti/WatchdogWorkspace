# M81 Corrective Loop — M80 Source-Guard Successor Synchronization

Date: 2026-09-29

## Origin
The first M81 local certification attempt failed during workspace/repository validation because `shared-primitives:source-guard` executed the historical M80→M79 guard directly against an M81 successor tree. The guard correctly rejected M81-authorized mutations and new files because those paths are outside the M80 milestone allowlist.

## Root cause
Verification/successor-governance mismatch. The historical M80 guard had no successor-awareness for a repository explicitly bound to the certified M80 baseline. This was not a product/navigation regression and did not indicate M80 provenance loss.

## Corrective delta
- The M80 guard retains strict M80→M79 behavior for pure M80 trees.
- When a valid M81 target is present and exactly bound to the certified M80 ZIP/source identities, the M80 guard delegates current-tree integrity validation to the M81→M80 guard.
- The M81 guard explicitly authorizes the synchronized M80 guard mutation and continues to reject every other unlisted M80 mutation or M81 addition.
- The transitive M79 guard delegates valid M80+ successor trees to the M80 guard, which in turn delegates valid M81 trees to the M81 guard; pure M79 and pure M80 trees retain their original strict behavior.
- M81 static governance verifies this successor path so it cannot silently regress.

## Exit criterion
A clean M81 certification run must pass workspace validation, all subsequent gates, historical regression, package hygiene, and the final certified checkpoint.

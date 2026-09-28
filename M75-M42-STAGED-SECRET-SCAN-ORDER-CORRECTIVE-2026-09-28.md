# M75 corrective — M42 staged secret-scan ordering

## Originating failure
During M75 local certification, the inherited M42 finalizer rollback regression failed in the staged-payload-secret vector. The M42 finalizer itself failed closed, but macOS reached source-tree parity rejection before the staged secret scanner, so the regression correctly rejected the wrong fail-closed reason.

## Root cause
`finalize-stage-g-m42.sh` computed staged source-tree parity before scanning the exact staged payload for high-confidence secrets. The rollback vector intentionally injects a GitHub-token-shaped file into the staged source. On the governed macOS execution path, staged parity could reject that payload before the secret scanner executed.

## Correction
The artifact transaction now:
1. stages the candidate payload;
2. prunes concrete/local environment files already excluded by the M42 certification-tree contract;
3. rejects generated/private entries and symlinks;
4. synchronizes excluded release-status metadata;
5. scans the exact staged payload for secrets;
6. verifies the stable staged source-tree digest against the certified source digest;
7. only then generates checksums and publishes the ZIP.

This preserves both guarantees: staged secrets are rejected by the security boundary intended to detect them, and non-secret staging/source drift remains fail-closed through parity immediately afterward.

## Scope
No FuelTrack+ runtime, RBAC, request, approval, refueling, analytics, persistence, or UI behavior changed in this corrective cycle.

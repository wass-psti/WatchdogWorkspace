# M42 Certification Source-Tree Binding Corrective — 2026-09-14

## Problem

The M42 release transaction executed the required gates sequentially, but did not cryptographically prove that the certifiable source bytes stayed unchanged while those gates ran or between dedicated certification and certified-baseline staging. A source mutation during those windows could therefore create stale evidence: the gates could pass for one tree while activation or packaging committed a different tree.

## Corrective

- Added `scripts/lib/stage-g-m42-certification-tree.mjs`, which computes a deterministic SHA-256 digest over certifiable source inputs.
- Mutable M42 state records and generated/private outputs are deliberately excluded from the digest so legitimate activation transitions and build/test outputs do not invalidate evidence.
- `activate-stage-g-m42.mjs --release` captures one source digest before pre-activation gates and revalidates it after pre-activation gates, after activation transitions, and after post-activation historical/full release verification.
- `finalize-stage-g-m42.sh` captures the source digest before dedicated certification, revalidates it after certification returns, and requires the staged certified baseline to produce the same digest before package-specific status evidence is appended.
- Any mismatch fails closed, restores the exact pre-certification activation target and release-status record, and publishes no certified baseline or PASS record.

## Deterministic regression coverage

- Pre-activation source mutation is injected during the Database/RLS gate and must fail before activation.
- Post-activation source mutation is injected during the historical gate and must roll both authoritative M42 state records back.
- Finalizer certification-source drift is injected by the stubbed certifier and must fail before staging/publication.

This corrective changes certification evidence integrity only. Users/RBAC runtime and database business logic are unchanged.

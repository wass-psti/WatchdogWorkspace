# Stage I M104 — Hosted Certification Synchronization

M104 is a corrective successor to the M103 certified Prompts 1–4 baseline. It does not change production Boards behavior, database schema, RBAC, persistence semantics, or the M103 import/export contract.

It closes three hosted/local certification drifts observed after publishing M103 to `main` and during M104 corrective certification:

1. The shared M39 browser fixture and the M37 Board-contract browser fixture were not both synchronized with the M101/M103 `wm_import_board_items_atomic` RPC. M39-dependent suites were repaired first, but M46 continued to fail because its M37 fixture still omitted the RPC, causing `WM_BACKEND_CAPABILITY_MISMATCH` before the intended contract-attestation scenarios executed.
2. The M73 historical verifier did not recognize the M103-authorized mutations to `board-repository.ts` and `board-domain-service.ts`, causing `release:check`, CI, production cutover, and Pages deployment to fail despite the M103 successor source guards accepting those changes.
3. The mandatory dependency-security gate later detected GHSA-68fv-2mgg-jv7q / CVE-2026-93749 in transitive `source-map-js@1.2.1`. The advisory affects versions through 1.2.1. Because PostCSS already permits `source-map-js@^1.2.1`, the minimum compatible remediation is a lockfile-only transitive update to `source-map-js@1.2.2`; no dependency manifest or application code change is required.

The correction remains intentionally bounded to test/governance synchronization plus the exact transitive security lockfile remediation. Production runtime code is unchanged.
## M104 v4 corrective continuation — M30 historical lockfile authority

The M104 v3 certification run proved the source-map-js 1.2.2 remediation, dependency security gate, M40/M44–M50 browser family, M103 database suites, modern tests, UI verification, M97/M98 readiness, and release progression through M29. It then failed at the M30 historical verifier because M30 still required the original M29 package-lock SHA-256 and did not recognize the bounded M104 security-remediated successor lockfile. M104 v4 synchronizes that historical verifier without weakening its predecessor invariant: the original M29 hash remains accepted, while the M104 successor hash is accepted only when M104 successor authority exists and source-map-js 1.2.2 plus the PostCSS ^1.2.1 compatibility contract are present.


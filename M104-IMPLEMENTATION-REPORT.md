# M104 Implementation Report

## Originating hosted and certification failures

- M40/M44–M50 browser gates: hosted simulated capability fixtures drifted from the M103 Boards contract. The shared M39 fixture initially omitted `wm_import_board_items_atomic`; after that correction, M46 still failed because its separate M37 Board-contract fixture omitted the same RPC.
- CI / Production Cutover / Deploy: M73 deterministic verification rejected the M103-authorized Boards repository/domain-service runtime extensions as M72 authority drift.
- M104 v2 local certification: `npm audit --audit-level=high` failed on transitive `source-map-js@1.2.1` (GHSA-68fv-2mgg-jv7q / CVE-2026-93749). The dependency is introduced through `vite -> postcss -> source-map-js`; PostCSS declares `source-map-js@^1.2.1`, so 1.2.2 is semver-compatible and removes the affected <=1.2.1 range.

## Corrective delta

- Added `wm_import_board_items_atomic` to both hosted capability authorities used by the affected suites: the shared M39 auth/runtime fixture and the M37 Board-contract fixture used by M46.
- Made M73 runtime-authority verification successor-aware for exactly the two M103 Boards runtime files and only when M103 authority artifacts are present.
- Updated `package-lock.json` only to resolve transitive `source-map-js` from 1.2.1 to 1.2.2, preserving `package.json`, Vite 8.2.2, PostCSS 8.5.26, and the existing dependency topology.
- Hardened the M104 deterministic verifier to require the 1.2.2 lockfile resolution and integrity binding in addition to M37/M39 capability parity and M73 successor authority.
- Added M104 successor source guard and updated M103 guard delegation to M104.

No production application logic, database migration, direct dependency manifest, authentication, authorization, or persistence behavior changed.
## M104 v4 corrective continuation — M30 historical lockfile authority

The M104 v3 certification run proved the source-map-js 1.2.2 remediation, dependency security gate, M40/M44–M50 browser family, M103 database suites, modern tests, UI verification, M97/M98 readiness, and release progression through M29. It then failed at the M30 historical verifier because M30 still required the original M29 package-lock SHA-256 and did not recognize the bounded M104 security-remediated successor lockfile. M104 v4 synchronizes that historical verifier without weakening its predecessor invariant: the original M29 hash remains accepted, while the M104 successor hash is accepted only when M104 successor authority exists and source-map-js 1.2.2 plus the PostCSS ^1.2.1 compatibility contract are present.


# Stage G M42 — Hosted npm Arborist Peer-Set Corrective (2026-09-16)

## Hosted evidence

The external-staging corrective was pushed as Git commit `7d88003fdcdcf2ffef5efcc754feac58eb67af4a` (`Fix M42 hosted modern test toolchain staging`). GitHub-hosted `Users RBAC Functional Recovery` run `34966063917`, job `104370673034`, again completed the root application `npm ci --ignore-scripts` successfully under Node `22.16.0` and npm `10.9.2`, then failed at `npm run modern-tests:toolchain:ensure`.

The failure was the same npm internal exception:

`Cannot read properties of null (reading 'edgesOut')`

The modern test bootstrap was already running from an OS-temporary directory outside the application tree in this revision. Therefore the earlier nested-ancestor-tree root-cause attribution is disproved. External staging remains useful for transactional publication/rollback, but physical nesting was not the cause of this hosted npm crash.

## Root cause

The hosted stack shape matches npm CLI issue `#9787`: Arborist's recursive peer-set construction can detach a node during `#loadPeerSet` and then dereference `node.parent.edgesOut`. npm CLI issue `#9911` documents the same detached-node peer-resolution family and identifies explicit peer pinning / bypass of peer auto-install as a working containment for affected dependency shapes.

The M42 staging transaction installed the eight governed test tools but did not explicitly declare all of their required application peers. npm therefore had to construct those peer sets dynamically. In particular, the governed toolchain consumes the application's exact React, ReactDOM, and Vite runtime:

- `react@19.2.8`
- `react-dom@19.2.8`
- `vite@8.2.2`

Those packages are already lockfile-governed by the application. They are now explicit inputs to the isolated test-toolchain staging manifest instead of being left to Arborist peer auto-resolution.

## Corrective design

`scripts/lib/modern-test-toolchain.mjs` now applies one governed topology:

1. The eight exact M42/M30 test tools remain pinned by `MODERN_TEST_TOOLCHAIN`.
2. Required application peers are exact-pinned by `MODERN_TEST_TOOLCHAIN_APPLICATION_PEERS` to React `19.2.8`, ReactDOM `19.2.8`, and Vite `8.2.2`.
3. The temporary staging `package.json` contains the complete exact tool + required-peer dependency set.
4. npm materialization uses `--legacy-peer-deps` so npm does not enter the hosted Arborist peer auto-placement path that produced the null `edgesOut` dereference. This is safe here because every required application peer is explicitly declared and version-verified; the flag is not used to tolerate a missing required peer.
5. The staged workspace is verified for all exact direct tool and required-peer versions before publication.
6. After the verified snapshot is published, staged React/ReactDOM/Vite copies are replaced with managed relative symlinks to the application's lockfile-governed root packages. This preserves singleton framework/runtime identity instead of creating duplicate React or Vite instances inside the test workspace.
7. Root test-tool bridges continue to point into `node_modules/.wm-modern-test-toolchain`, package binaries remain governed, and the application lockfile tree is reverified after publication.
8. `package.json` and `package-lock.json` remain byte-for-byte unchanged by the bootstrap transaction.

## Deterministic regression

`scripts/verify-stage-g-m42-governed-toolchain-preservation.mjs` now deterministically models the hosted defect: its fake npm exits with the `edgesOut` failure if `--legacy-peer-deps` is omitted. It also requires the staging manifest to contain exactly the governed tool + application-peer set and verifies that the published React/ReactDOM/Vite entries resolve to the application's exact root packages.

The regression continues to prove:

- npm resolution is staged outside the application tree;
- the known peer-resolution failure is not entered by the corrected invocation;
- all direct tool and required-peer versions are exact;
- React/ReactDOM/Vite are singleton application-peer bridges after publication;
- application package/lock state and lockfile-governed bytes remain unchanged;
- a failed staging attempt cannot replace the last verified toolchain;
- M42 installed-dependency evidence remains digest-bound and fail closed.

## Scope and certification state

This corrective changes only the shared certification/test-toolchain materialization harness and its deterministic/static verification. It does not change Users/RBAC UI behavior, Supabase RPCs, RLS, migrations, authorization policy, browser scenario semantics, or application business rules.

M42 remains `implementation-complete-pending-certification`. No certified M42 ZIP or PASS record is authorized by this project-side correction alone. The exact corrective candidate must be pushed and the automatic hosted `Users RBAC Functional Recovery` workflow must complete fully green. Only then may `Stage G M42 Certified Baseline` run against that exact commit SHA.

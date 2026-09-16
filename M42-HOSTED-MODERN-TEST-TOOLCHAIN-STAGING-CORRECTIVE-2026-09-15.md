# Stage G M42 — Hosted Modern Test-Toolchain Staging Corrective (2026-09-15)

> **Root-cause attribution superseded — 2026-09-16.** Hosted commit `7d88003fdcdcf2ffef5efcc754feac58eb67af4a` reproduced the same npm `edgesOut` crash after this external-staging design was active, disproving physical nesting under application `node_modules` as the cause. External staging remains the publication/rollback boundary. The corrected root cause and peer-set containment are recorded in `M42-HOSTED-NPM-ARBORIST-PEER-SET-CORRECTIVE-2026-09-16.md`.

## Hosted evidence that triggered this corrective

GitHub-hosted commit `424e68a02bbda0168d7bc12c19811c8d73c7e7d1` (`Fix M42 Supabase CLI temp evidence boundary`) exposed one shared infrastructure failure before the remaining M42 certification gates could execute.

The automatic `Users RBAC Functional Recovery` run `34955334784`, job `104335887776`, completed `npm ci --ignore-scripts` successfully and then failed at `npm run modern-tests:toolchain:ensure`. The shared bootstrap emitted:

`npm error Cannot read properties of null (reading 'edgesOut')`

The same failure reproduced independently in the M39 browser workflow (`34955334730` / job `104335886928`), M40 browser workflow (`34955334831` / job `104335888339`), and the modern test workflow (`34955334741` / job `104335887921`). In those runs the root application `npm ci` completed successfully first; the crash occurred only when the exact governed Vitest/Testing Library/Playwright/jsdom extension was installed from the nested `node_modules/.wm-modern-test-toolchain` working directory.

The hosted evidence therefore localizes the defect to the modern test-toolchain materialization boundary rather than to Users/RBAC runtime logic, the application lockfile graph, M39/M40 functional logic, or the preceding Supabase temporary-evidence correction.

## Root cause and design correction

The previous bootstrap invoked npm with its current working directory physically nested under the application's `node_modules` tree. On npm 10.9.2 in the GitHub runner, that nested layout caused npm's dependency-tree resolver to traverse a package graph whose ancestor is the already-materialized application install and crash internally while processing `edgesOut`.

The corrective removes that ancestor-tree coupling without weakening the existing governance contract:

1. npm now installs the eight exact governed top-level test packages in a disposable OS-temporary staging workspace created with `fs.mkdtempSync(os.tmpdir(), ...)`, outside the application tree.
2. The staging install retains the existing `--no-save --package-lock=false --ignore-scripts --no-audit --no-fund` policy and optional `--offline` mode.
3. The staged direct tool versions and jsdom Node-engine contract are verified before publication.
4. Only a verified staged workspace is copied into a same-filesystem replacement directory under root `node_modules` and then renamed into `node_modules/.wm-modern-test-toolchain`.
5. Existing published tooling remains untouched if staging npm fails. Deterministic regression coverage proves a failed staging install preserves the last verified toolchain workspace and bridges.
6. Root package bridges and tool binaries remain managed symlinks into the isolated published workspace. `package.json` and `package-lock.json` remain byte-for-byte unchanged by bootstrap.
7. The complete lockfile-governed application dependency tree is reverified after publication, and M42 continues to bind certification to the combined installed dependency-content digest.

## Fail-closed properties preserved

This corrective does not add the test tooling to the application lockfile, does not relax exact versions, does not permit root dependency drift, does not bypass browser/Database-RLS/historical/release gates, and does not change M42 activation or artifact publication rules. It changes only where npm resolves the isolated no-save test toolchain before the already-governed workspace is published.

The final M42 state remains `implementation-complete-pending-certification`. A certified M42 baseline/PASS record remains prohibited until the corrected exact revision passes the complete hosted Users/RBAC workflow and the exact-revision `Stage G M42 Certified Baseline` transaction.

## Deterministic verification

The governed test-toolchain regression now proves all of the following without registry dependence:

- npm is invoked from a disposable governed staging directory outside the application tree;
- an attempted invocation from inside the application tree would fail the fixture rather than silently mutate application dependencies;
- exact tool versions, bridge ownership, and jsdom engine requirements are preserved;
- `package.json`, `package-lock.json`, and lockfile-governed application package bytes remain unchanged;
- failed staged npm materialization does not replace the last verified toolchain workspace or published bridges;
- the existing digest-bound certification extension remains valid.

This is a project-side corrective for a concrete, reproducible hosted failure. It requires hosted revalidation before the failure can be considered closed.

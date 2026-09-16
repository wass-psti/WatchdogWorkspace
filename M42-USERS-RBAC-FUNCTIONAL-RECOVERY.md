# M42 — Users / RBAC Functional Recovery

Architecture Version 50 restores administrative user-management behavior around server-authoritative, serialized Supabase RPCs.

## Implemented
- Directory loading, search, refresh, empty/error/retry states.
- Role and status mutations through `admin_set_user_access`.
- Transaction-wide advisory serialization before caller-authority and last-admin checks.
- Backend-provided bootstrap/self/last-admin policy flags consumed by the React Users UI.
- Bootstrap-admin, self-disable, and last-active-admin safeguards.
- Self-role demotion with immediate access-context reconciliation when another active admin exists.
- Mutation-success/directory-refresh-failure outcome separation.
- Unauthorized role denial in both client and server authority.
- pgTAP and Playwright coverage for normal, failure, and recovery paths.

## Boundaries
M26 iframe compatibility remains where certified; M43 Settings recovery and M54 final production-readiness certification remain outside M42.

## Browser corrective synchronization

- Forced post-self-mutation access reconciliation now waits for any older in-flight access-context transaction to settle and then performs a new authoritative read.
- Unauthorized and self-demoted Users routes are verified against the M40-certified shell-owned forbidden presentation rather than the management React denied view.

- Self-role form submission now preserves authoritative values for disabled protected controls because HTML FormData omits disabled inputs; this prevents valid self-demotion from being rejected before the backend mutation RPC.

## Certification environment preflight corrective

- Added a single aggregate M42 certification-environment preflight that validates governed Node/npm, M41/M42 state, exact dependency availability or registry reachability, a Chromium-based browser, a running Docker-compatible runtime, pinned Supabase CLI resolvability, and packaging tools before certification proceeds.
- Direct M42 certification and finalization now invoke this preflight before the disposable database gate or any activation-state mutation, preventing late environment discovery and repeated partial certification attempts.
- The M42 CI workflow executes the same preflight immediately after `npm ci`, keeping local/target-machine and CI prerequisite semantics synchronized.

## Certification dependency-byte integrity corrective — 2026-09-14

The M42 certification path now requires a clean governed `npm ci` and binds all release evidence to the resulting installed-dependency content digest. This closes the gap where modified package files could retain expected package metadata and influence evidence while remaining outside the repository source digest. See `M42-INSTALLED-DEPENDENCY-CONTENT-BINDING-CORRECTIVE.md`.

## Governed modern test-toolchain preservation corrective — 2026-09-14

A certification success-path audit found that the installed-dependency digest was captured after clean application `npm ci` but before the exact no-save Vitest/Testing Library/Playwright/jsdom toolchain required by M42 browser/release gates was installed. That made healthy browser execution mutate the very dependency tree M42 had already certified, while nested ordinary dependency checks could subsequently remove those governed tools as extraneous. The corrected M42 transaction now clean-installs the application graph, materializes and verifies the exact governed modern test-toolchain extension, verifies the application lockfile packages remain exact, and only then captures one full installed-byte digest. Nested dependency checks preserve that extension only while they match the owning certification digest. Preflight and CI now use the same topology. See `M42-GOVERNED-MODERN-TEST-TOOLCHAIN-PRESERVATION-CORRECTIVE.md`.

## Hosted certification provenance boundary

The final hosted certification workflow requires an explicit expected Git commit SHA and rejects any run whose actual `GITHUB_SHA` differs. The certification PASS record binds the certified ZIP, certified source-tree digest, and source commit. This requirement is verified by the M42 static contract and deterministic hosted-workflow verifier.

## 2026-09-15 deterministic dependency materialization corrective

Hosted execution of diagnostic revision `49d29c460015cb86db8ec168079e84a1cc21bc8c` proved the root-level no-save modern-test bootstrap could re-resolve application transitive dependencies after a clean `npm ci`. The M42 dependency verifier correctly rejected that drift. The verifier remains strict; the bootstrap now installs only inside `node_modules/.wm-modern-test-toolchain`, publishes managed bridges for the governed top-level test packages/binaries, and re-verifies the complete application lockfile graph plus bridge isolation before PASS. A deterministic fake-npm regression proves application dependencies would be corrupted by a root invocation and remain unchanged under the corrected isolated invocation. See `M42-DETERMINISTIC-DEPENDENCY-MATERIALIZATION-CORRECTIVE.md`.

## M39 hosted browser runtime-boundary corrective — 2026-09-15

GitHub-hosted revision `49d29c460015cb86db8ec168079e84a1cc21bc8c` exposed a TOCTOU defect in the M39 Playwright helper: runtime/identity readiness was observed in one page evaluation and consumed in a later evaluation, so a hosted main-document replacement could invalidate `WorkManagementRuntime` between those operations. M39 identity reads, backend-preflight reads, and idempotent `identity.revalidate` execution now use one retryable atomic runtime boundary. A deterministic regression is part of `auth-stabilization:test`. Production auth/RBAC behavior is unchanged. Hosted 6/6 M39 browser revalidation remains required before M42 certification.

## Hosted evidence stability corrective — 2026-09-15

GitHub-hosted commit `c4b42ddd594bc05b6e1d3e93c01a1b31f83fcd24` passed M42 static/deterministic/browser, Database/RLS, historical 152/152, TypeScript, security, and UI gates, then failed only at the old final source/dependency digest comparison. That old comparison printed neither recomputed digest nor changed paths, so the finished run cannot support retrospective attribution to a specific tree/path.

A concrete certification-domain defect was nevertheless reproduced: the prior installed-dependency digest treated Vite 8.2.2 generated `node_modules/.vite-temp` config output as installed dependency content. The dependency authority now normalizes `.vite-temp` with the other generated Vite/Vitest caches while continuing to hash all actual installed package bytes, modes, and symlink targets. The focused M42 browser runner also uses Vite `--configLoader native` so it does not generate bundled config tempfiles.

M42 now captures path-level source/dependency evidence outside the source tree and verifies it after every major hosted and release-certification gate. Any future drift identifies the exact gate, aggregate digest change, and added/removed/changed paths before failing closed. A deterministic regression proves generated Vite temporary output is ignored while real package mutation remains visible. See `M42-HOSTED-EVIDENCE-STABILITY-CORRECTIVE-2026-09-15.md`.

## 2026-09-15 hosted corrective — Supabase CLI temporary evidence boundary

GitHub-hosted `Users RBAC Functional Recovery` run `34941635390` on commit `aba7d0462eaf90734034036a6f40f95147cf25a8` passed M42 preflight, static/deterministic verification, all 6 M42 browser scenarios, and all 96 Database/RLS tests. The post-Database/RLS evidence check failed closed on exactly one generated path: `supabase/.temp/cli-latest`.

The M42 source-tree authority now excludes only the exact relative directory `supabase/.temp`, and `.gitignore` prevents this Supabase CLI runtime metadata from being committed. Deterministic regression coverage proves `supabase/.temp/cli-latest` does not alter the source digest while real `supabase/schema.sql` changes and ordinary application-source changes still do. No Users/RBAC production UI, RPC, RLS, migration, authentication, or business-rule behavior was changed by this corrective.

Current local corrective verification is PASS for M42 static **155/155**, Users/RBAC deterministic vectors **31/31**, finalizer/activation/clean-dependency/governed-toolchain/certifier/package-hygiene/evidence-stability/hosted-workflow regressions, Stage A security, and the full UI verifier chain. Local historical remains **136/152** because this sandbox cannot materialize the exact dependency graph; the latest hosted run independently proved all functional M42 gates through Database/RLS before the generated Supabase CLI path was detected. Local aggregate preflight still fails closed only on registry DNS/cache materialization and Docker availability.

M42 remains `implementation-complete-pending-certification`. The next required milestone operation is to push this exact corrective candidate, require the automatic `Users RBAC Functional Recovery` workflow to complete fully green, and only then run `Stage G M42 Certified Baseline` against that exact commit SHA.

## Hosted modern test-toolchain staging corrective — 2026-09-15

GitHub-hosted commit `424e68a02bbda0168d7bc12c19811c8d73c7e7d1` exposed a shared npm 10.9.2 failure before M42 could reach its remaining gates. The root application `npm ci` completed successfully, but the isolated no-save modern test-toolchain bootstrap crashed with `Cannot read properties of null (reading 'edgesOut')` when npm was executed from the nested `node_modules/.wm-modern-test-toolchain` working directory. The same failure reproduced in the M39 browser, M40 browser, modern-test, and M42 workflows, which localizes the problem to the shared toolchain materialization boundary rather than Users/RBAC behavior.

The bootstrap now resolves the exact governed Vitest/Testing Library/Playwright/jsdom packages in a disposable OS-temporary staging workspace outside the application tree, verifies the staged versions and jsdom engine contract, and only then publishes the verified workspace under `node_modules/.wm-modern-test-toolchain`. Publication uses a staged same-filesystem replacement/rename sequence; a failed staging install leaves the last verified published toolchain and bridges intact. Root package bridges remain managed symlinks into the isolated workspace, and `package.json`, `package-lock.json`, application lockfile packages, source evidence, activation authority, and certification gates remain unchanged by this correction.

Deterministic regression coverage proves the npm working directory is outside the application tree, exact versions and isolation remain enforced, application package bytes remain unchanged, and failed staged materialization preserves the prior verified workspace. See `M42-HOSTED-MODERN-TEST-TOOLCHAIN-STAGING-CORRECTIVE-2026-09-15.md`.

M42 remains `implementation-complete-pending-certification`. Hosted revalidation of the corrected exact revision is still required before the exact-revision certified-baseline workflow may run.

## Hosted npm Arborist peer-set corrective — 2026-09-16

Hosted revalidation of commit `7d88003fdcdcf2ffef5efcc754feac58eb67af4a` disproved the prior physical-nesting hypothesis: root `npm ci --ignore-scripts` passed and the externally staged `modern-tests:toolchain:ensure` still failed inside npm 10.9.2 with `Cannot read properties of null (reading 'edgesOut')`. The failure is now isolated to npm Arborist peer-set auto-resolution, consistent with npm CLI `#9787` and the related detached-peer-set analysis in `#9911`.

The governed staging manifest now exact-pins the required application peers React `19.2.8`, ReactDOM `19.2.8`, and Vite `8.2.2` alongside the eight exact test tools. The bootstrap uses `--legacy-peer-deps` only to bypass the known Arborist peer auto-placement defect; it does not permit missing required peers because those peers are explicit and version-verified. After staging verification, React/ReactDOM/Vite are replaced inside the isolated workspace with managed symlinks to the lockfile-governed application packages, preserving singleton runtime identity. Deterministic regression coverage reproduces the hosted `edgesOut` failure whenever the bypass is removed and verifies exact peer ownership, rollback, and application lockfile/package-byte preservation. See `M42-HOSTED-NPM-ARBORIST-PEER-SET-CORRECTIVE-2026-09-16.md`.

No Users/RBAC production logic changed. M42 remains `implementation-complete-pending-certification` until this exact corrective revision passes the complete hosted workflow and the subsequent exact-revision certified-baseline transaction.

### Local verification after npm Arborist peer-set corrective — 2026-09-16

- M42 static contract: **164/164 PASS**.
- Users/RBAC deterministic aggregate: **PASS**, including all **31/31** Users/RBAC execution vectors and finalizer rollback, activation ownership, clean dependency materialization, governed modern-toolchain preservation/rollback, certifier rollback, certified-package hygiene, evidence-stability, and hosted-workflow regressions.
- Governed modern test-toolchain focused regression: **PASS**; the fixture deterministically emits the hosted `edgesOut` failure if the peer-resolution bypass is removed and verifies the exact staging dependency set plus React/ReactDOM/Vite singleton bridges.
- Stage A security baseline: **PASS**.
- Full UI verifier chain: **PASS**.
- Historical collect-all: **152 total / 136 PASS / 16 dependency-execution blocked** in this dependency-less sandbox. The failed executions are the same missing-package class (`zod`, `@tanstack/react-query`, `zustand` and dependent verifier paths), not new assertion regressions introduced by this corrective.
- Aggregate M42 preflight: **FAIL CLOSED on exactly 2 external capabilities** — npm registry/cache materialization (`EAI_AGAIN` / uncached package tarballs) and missing Docker-compatible runtime. Chromium and packaging tools are available.
- Actual finalizer attempt: **FAIL CLOSED** at the same environment preflight boundary. M42 target SHA-256 remained `4f9069656711396db2d91737888da61b12be06594518a22247451fd68cb96dfc`; the release-status record also remained byte-for-byte unchanged; no M42 certified ZIP/PASS record was created.
- JavaScript/shell syntax checks and GitHub workflow YAML parsing: **PASS**.

The project-side corrective for the currently reproduced hosted npm peer-set failure is complete and locally verified to the extent this environment permits. Live npm materialization, browser/Database-RLS/release certification on this exact revision still require GitHub-hosted execution. Do not create or accept a certified M42 baseline until the automatic `Users RBAC Functional Recovery` workflow is fully green and the exact-revision `Stage G M42 Certified Baseline` transaction subsequently passes.

Latest continuation package root after this corrective: `Work-Management-App-v1.43.2-Stage-G-M42-Hosted-Npm-Arborist-Peer-Set-Corrective-Continuation-Candidate-2026-09-16`.

## Exact-revision certified-baseline deterministic-fixture corrective — 2026-09-16

Manual `Stage G M42 Certified Baseline` run `35044563541` reached the real `active-certified` state, passed 6/6 M42 browser scenarios, 96/96 Database/RLS assertions, and 152/152 historical verifiers, then failed when `release:check` reran the activation gate-ownership regression. The regression inherited the now-active live state, so its literal pending-state replacement produced no mismatch.

The regression sandbox now normalizes both state authorities to `implementation-complete-pending-certification` independently of the live lifecycle state and explicitly covers an `active-certified` source snapshot. Production activation/finalization logic is unchanged. See `M42-ACTIVATION-GATE-OWNERSHIP-DETERMINISTIC-FIXTURE-CORRECTIVE-2026-09-16.md`.

M42 remains **implementation-complete-pending-certification** until the corrected exact revision passes the complete automatic hosted workflow and a subsequent exact-revision certified-baseline transaction.


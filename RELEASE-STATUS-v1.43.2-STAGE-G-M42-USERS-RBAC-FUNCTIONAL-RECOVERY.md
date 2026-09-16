# Release Status — Stage G M42 Users / RBAC Functional Recovery

- **State:** implementation-complete-pending-certification
- **Architecture Version:** 50
- **Prerequisite:** M41 active-certified
- **Browser scenarios:** 6
- **Certification rule:** fail closed; no certified baseline or PASS record until all required gates succeed.


## Self-role fixture identity corrective

The second target-Mac browser run reached 5/6 scenarios. The remaining self-demotion timeout was traced to the M39 Playwright fixture returning module assignments owned by `EMPLOYEE_ID` after the authenticated `ADMIN_ID` user was demoted to Supervisor. Production M39 identity validation correctly rejected that inconsistent response. The fixture now parameterizes assignment ownership with the current authenticated user id; M42 static and deterministic verifiers enforce this invariant. Certification remains pending a clean 6/6 browser run and the remaining fail-closed gates.


## Latest corrective status

The 5/6 Mac browser result isolated the remaining failure to the shared identity-wait contract. The helper now uses the authoritative `identity.current` auth snapshot together with persisted identity, and the self-role scenario asserts each post-mutation boundary before waiting for route revocation. Source/static verification is PASS at 44 checks and deterministic verification is PASS at 29 vectors. M42 remains `implementation-complete-pending-certification` until the full six-scenario browser gate and all downstream fail-closed certification gates pass.

Corrective update: self-role mutation submission now falls back to the current authoritative record for disabled protected controls, fixing the verified pre-RPC FormData omission. Target-Mac certification remains required.


## Database/RLS corrective

The target-Mac corrective run verified the complete M42 browser contract at 6/6 scenarios. Certification then stopped at the disposable Supabase pgTAP gate with two verified database defects: `list_user_directory()` used unqualified `platform_role`/`status` references that collide with `RETURNS TABLE` output variables, and `wm_runtime_capabilities()` used `search_path=pg_catalog,public` while the structural SECURITY DEFINER policy requires `search_path=public`. The canonical schema and originating M38/M42 migrations are synchronized, and `v1.43.2-stage-g-m42-database-corrective.sql` provides the forward repair path. M42 remains `implementation-complete-pending-certification` until the corrected database/RLS gate and all downstream fail-closed gates pass.

## M40 composition stability diagnostic corrective

The downstream M40 browser regression is now guarded by a dedicated diagnostic/stability harness. The harness records document navigation/unload, page errors, console errors, and React-shell removal, persists evidence across reloads, and requires both initial shell readiness and committed route ownership to remain stable before assertions. Target-machine browser verification is still required before M42 certification.


## Historical verifier synchronization corrective

The complete historical sweep exposed one stale Architecture Phase 3 assertion requiring the literal `queryClient.invalidateQueries` for Users directory cache ownership. Architecture 50/M42 now uses TanStack Query `setQueryData` for immediate authoritative mutation-cache reconciliation plus `directory.refetch()` for server reconciliation, with a deliberate `!auth.canManageUsers` guard after self-demotion. `verify-v1240-architecture-phase3.mjs` has been synchronized to that current contract while retaining the old assertion for pre-Architecture-50 baselines. M42 static verification now protects this synchronization. Target-machine execution of the full historical sweep and final certification remains required.

## 2026-09-14 continuation verification

A fresh continuation audit preserved the fail-closed state. M42 static verification passed 58 checks, deterministic verification passed 31 vectors, Stage A security passed, the complete UI verification suite passed, and M42 JavaScript/shell syntax plus source-level SQL consistency checks passed. The historical collect-all run reached 136/152 PASS; the remaining 16 executions were blocked by missing dependency modules after `npm ci` could not resolve `registry.npmjs.org` (`EAI_AGAIN`), rather than by project assertion failures. The sandbox also lacks Docker/Supabase/PostgreSQL tooling, so the disposable pgTAP Database/RLS gate cannot execute here. See `M42-CONTINUATION-HANDOFF-2026-09-14.md`. M42 remains `implementation-complete-pending-certification`.

## Certification environment preflight corrective

To eliminate late toolchain discovery during final certification, M42 now has `users-rbac-recovery:preflight`. It checks the governed Node/npm versions, M41 prerequisite and M42 state, exact dependency availability or npm-registry reachability, Chromium availability, Docker daemon availability, Supabase CLI 2.117.0 resolvability, and final packaging tools. Both `scripts/certify-stage-g-m42.sh` and `scripts/finalize-stage-g-m42.sh` fail closed through this preflight before database execution or activation-state mutation. CI runs the same prerequisite contract after `npm ci`.

## Lockfile dependency-integrity corrective

The certification dependency gate now verifies the complete platform-applicable `package-lock.json` tree rather than only direct dependencies. The shared verifier enforces exact installed versions, rejects extraneous packages, preserves legitimate optional/platform-specific omissions, checks `package.json`/lockfile root parity, and retains governed `tsc`/`vite` binary requirements. `dependencies:ensure` revalidates the full tree after `npm ci`, and the M42 preflight uses the same authority before deciding whether registry access is required. Static M42 verification is now PASS at 67 checks and deterministic verification remains PASS at 31 vectors. The first historical sweep exposed one stale Stage-B assertion tied to the former inline binary-check location; that verifier was synchronized to the shared authority and the sweep returned to 136/152 PASS, with the same 16 dependency-resolution blockers only. M42 remains `implementation-complete-pending-certification` because outbound DNS and Docker/Supabase pgTAP execution are unavailable in this sandbox.

## Transactional finalization rollback corrective

The M42 finalizer now treats activation plus all downstream required gates as one fail-closed transaction. It snapshots the exact pre-certification target, restores it on any uncommitted downstream failure, and removes partial certified artifacts. Dedicated certification also signals completed pre-activation gates to release activation so it does not repeat browser/historical/release execution; direct/manual release activation remains self-protecting. Two deterministic orchestration regressions prove both behaviors. M42 remains `implementation-complete-pending-certification` until external dependency and disposable Supabase requirements are available and every final gate passes.

## Tree-bound certification attestation corrective

The certification handoff between dedicated pre-activation gates and release activation no longer trusts the caller-controlled `M42_CERTIFICATION_GATES_COMPLETE` boolean. A short-lived, one-time attestation now binds the exact M42 target and complete project tree that passed the gates to the activation attempt. Direct/manual release without a valid attestation retains its self-protecting gate sequence; the legacy boolean cannot bypass it; post-gate tree tampering fails before target mutation. M42 remains `implementation-complete-pending-certification` pending the external dependency and disposable Supabase certification gates.

## Certified artifact transaction corrective

The M42 finalizer now builds the replacement certified baseline, ZIP, checksums, and PASS record entirely in an isolated staging directory. Existing certified artifacts are left untouched until the staged ZIP passes integrity verification; during the final swap they are recoverably backed up and restored on any uncommitted failure. The deterministic finalizer regression now proves both downstream target rollback and byte-for-byte preservation of a prior certified directory/ZIP/PASS set when staged ZIP integrity is forced to fail. The finalizer also no longer repeats the environment preflight already owned by dedicated certification. See `M42-CERTIFIED-ARTIFACT-TRANSACTION-CORRECTIVE.md`. M42 remains `implementation-complete-pending-certification`.

## Latest continuation verification — tree-bound attestation and artifact transaction

Current dependency-independent verification is clean: M42 static 83/83, RBAC deterministic 31/31, finalizer rollback/artifact-preservation regression PASS, activation attestation/bypass/tamper regression PASS, security PASS, UI PASS, and modified-script syntax PASS. Historical collect-all remains 136/152 with the same 16 missing-dependency executions and no new assertion-only regression. TypeScript remains blocked by the unavailable exact dependency tree. Preflight, direct certification, and full finalization all fail closed on npm registry DNS plus absent Docker runtime while leaving the M42 activation target unchanged at `implementation-complete-pending-certification`. No certified artifact or PASS record has been published.

## Activation state-machine and package-commit corrective — 2026-09-14

A continuation audit found that plain M42 activation could reach `active-certified` without browser/Database-RLS certification, while direct manual release activation did not own the same environment/dependency/Database-RLS pre-activation gates as dedicated certification. The activation state machine now prevents non-release self-certification and makes unattested direct release execute the complete release-grade pre-activation sequence. The package finalizer now extracts and checksum-verifies the staged ZIP, revalidates the published ZIP/directory/PASS digest binding before commit, and treats post-commit cleanup as non-fatal. The static verifier false-positive around a missing published-ZIP integrity command was also corrected. M42 remains `implementation-complete-pending-certification` until the external dependency and disposable Supabase gates can execute successfully.

The M42 GitHub workflow has also been synchronized to execute the disposable Database/RLS gate plus historical and UI regressions after browser verification. This closes the previous CI evidence gap while keeping activation mutations out of CI.

Standalone M42 dedicated certification is now transactional across post-activation historical and full release verification. Any failure after temporary activation restores the exact pre-certification target; only a fully verified certifier run may retain `active-certified`. The finalizer consequently owns only certified artifact publication after dedicated certification succeeds.

Dependency restoration now recognizes and uses a complete offline npm cache. This removes the prior false assumption that missing `node_modules` necessarily requires live registry access; registry reachability is required only when the lockfile graph is not fully cached (or when pinned Supabase CLI resolution still requires it).

The offline dependency capability probe was hardened after npm `--dry-run` produced a false-positive cache result. M42 now proves offline availability by materializing the exact lockfile in an isolated disposable npm project; only a successful real offline install qualifies as a cache-complete path. The current sandbox fails that definitive probe on uncached `zustand`, so registry access remains required for dependency-backed certification here.

## Final continuation verification — certification transaction hardening

The current continuation candidate has completed all M42 corrections that can be verified in the present sandbox without bypassing required evidence. Final results are: static **94/94 PASS**; Users/RBAC deterministic **31/31 PASS**; activation gate-ownership/attestation regression **PASS**; standalone certifier rollback regression **PASS**; finalizer rollback/artifact-preservation/success-path regression **PASS**; Stage A security **PASS**; full UI verification **PASS**; modified certification-script syntax **PASS**; historical collect-all **136/152 PASS**, with the remaining 16 executions blocked solely by the unavailable exact dependency tree and no assertion-only regression remaining.

The exact dependency path is fail closed. A real isolated `npm ci --offline` probe proves the local cache is incomplete (including an uncached `zustand@5.0.15` tarball), while live registry access fails with `EAI_AGAIN`. The disposable Supabase pgTAP Database/RLS gate is also unavailable because this sandbox has no Docker-compatible runtime. Preflight, standalone certification, and full finalization preserve the pending activation target on these blockers. M42 therefore remains `implementation-complete-pending-certification`; no certified baseline or PASS record is authorized yet.


## Certified package hygiene and release-status synchronization corrective — 2026-09-14

The finalization audit identified two additional package-transaction defects: repository/local environment material was not explicitly excluded from the certified baseline, and a successful package could contain a stale M42 release-status document that still declared `implementation-complete-pending-certification` while the activation target was `active-certified`. The finalizer now excludes `.git`, local `.env` overrides, npm debug logs, package/test/build outputs, `.vitest`, and M37 generated evidence; scans the staged tree for forbidden residue; snapshots/restores the release-status record together with the activation target; publishes a staged `active-certified` release-status record; revalidates it after publication; and only then synchronizes the working-tree record and commits. The deterministic finalizer regression covers rollback, prior-artifact preservation, private/generated-file exclusion, and successful release-status synchronization. M42 remains pending external certification gates.

The retained `.npmrc` governance artifact is now included in high-confidence secret scanning. Environment-variable placeholders remain allowed; literal npm access/auth credentials fail closed. A dedicated deterministic M42 package-hygiene regression covers this boundary.

## Latest continuation verification — certified package hygiene/status synchronization

The latest continuation package passes M42 static verification at **100/100 checks**, Users/RBAC deterministic execution at **31/31 vectors**, the finalizer target/release-status rollback and successful-publication regression, activation attestation/gate-ownership regression, standalone certifier rollback regression, `.npmrc` secret-hygiene regression, Stage A security, the complete UI verifier chain, and high-confidence repository secret scanning. The historical collect-all sweep remains **136/152 PASS** with the same 16 dependency-resolution executions only; no new assertion regression was introduced.

Real `users-rbac-recovery:preflight`, standalone certification, and full finalization attempts continue to fail closed on exactly two environment prerequisites: the empty/incomplete npm cache plus `registry.npmjs.org` DNS failure (`EAI_AGAIN`), and absence of a Docker-compatible runtime for the disposable Supabase pgTAP Database/RLS gate. Both the activation target and this release-status record remain byte-for-byte unchanged across those failed attempts. M42 remains `implementation-complete-pending-certification`; no certified ZIP or PASS record is authorized yet.

## Caller-mintable attestation bypass retirement corrective — 2026-09-14

The previous tree-bound attestation was proven insufficient as gate evidence because its standalone issuer could be invoked directly without running certification gates. In an isolated proof, a caller-minted attestation promoted M42 to `active-certified` while bypassing the expensive certification sequence. The issuer/library have been removed. Release activation now always executes the complete pre/post source-certification transaction and restores the exact prior target on any failure; caller-controlled legacy attestation/boolean variables cannot suppress gates. The dedicated certifier delegates to this transaction and verifies final state. M42 remains **implementation-complete-pending-certification** until the external dependency and disposable Supabase/Docker gates can execute successfully.

## Certified payload secret boundary corrective — 2026-09-14

The M42 finalizer now defines the staged certified payload as the final package-security boundary. Secret scanning covers additional shipped text formats, concrete `.env*` files are removed while environment templates remain, and the staged baseline is secret-scanned before checksums, ZIP publication, or PASS-record creation. Deterministic verification proves an injected packaged credential aborts finalization, restores target/status, and publishes no certified artifact. This corrective changes certification/package security only; Users/RBAC runtime behavior is unchanged.

## Latest continuation verification — authority bypass retirement and payload security

M42 static verification is **102/102 PASS** and Users/RBAC deterministic verification is **31/31 PASS**. Activation ownership, dedicated-certifier rollback, transactional finalizer publication/rollback, staged-payload secret rejection, package secret hygiene, Stage A security, UI verification, and modified-script syntax all pass. Historical collect-all remains **136/152** with the same 16 dependency-resolution executions and no new assertion regression. Real preflight/certification/finalization attempts fail closed on exactly two external prerequisites—npm registry DNS (`EAI_AGAIN`) with an incomplete offline package cache, and absence of a Docker-compatible runtime—and leave the M42 target/status unchanged with no certified artifact or PASS record created. State remains **implementation-complete-pending-certification**.

## Activation / release-status dual-authority corrective — 2026-09-14

A continuation audit found that M42 activation transitions were authoritative only in `config/stage-g-m42-users-rbac-functional-recovery-target.ts`, while the M42 release-status record could remain at an older state until final artifact publication. This allowed non-release activation or successful standalone source certification to leave the target and release-status records disagreeing. The dedicated certifier also restored only the target if its wrapper-level final-state verification failed.

The M42 activation transaction now treats both records as one source-state authority. Certification preflight requires their states to agree before any gate runs; non-release and release transitions update both records together; any activation failure restores both exact pre-invocation contents; and the dedicated certifier snapshots/restores both records if delegated certification or final-state verification fails. Deterministic orchestration coverage proves mismatch rejection before npm gates, pending-state synchronization, certified-state synchronization, and dual-record rollback after pre- and post-activation failures. The finalizer regression now also simulates a certifier that mutates both records, so release-status rollback is exercised rather than vacuously asserted.

The certified-package boundary remains fail closed on symbolic links before and after ZIP extraction, with deterministic rollback coverage now enforcing that property in the M42 contract.

Latest locally executable verification after this corrective:
- M42 static verification: **110/110 PASS**.
- Users/RBAC deterministic execution: **31/31 PASS**.
- Activation gate ownership / dual-authority synchronization regression: **PASS**.
- Dedicated certifier dual-record rollback regression: **PASS**.
- Transactional finalizer rollback/publication/secret/symlink regression: **PASS**.
- Stage A security baseline and full UI verification: **PASS**.
- Historical collect-all: **136/152 PASS**; the same 16 executions remain dependency-resolution blocked, with no new assertion regression.
- Aggregate preflight: **FAIL CLOSED with exactly two external blockers** — npm registry DNS `EAI_AGAIN` with an incomplete offline lockfile cache, and no Docker-compatible runtime for the disposable Supabase pgTAP Database/RLS stack.
- Real certification/finalization attempts preserve both M42 source-state records byte-for-byte and create no certified baseline/PASS record while those prerequisites are unavailable.

M42 remains **implementation-complete-pending-certification**.

## Certification source-tree binding corrective — 2026-09-14

M42 certification evidence is now bound to a deterministic SHA-256 of the certifiable source tree. Release activation verifies that digest before and after its pre-activation and post-activation gate phases, and finalization verifies the same digest across dedicated certification and staged-baseline construction. Source drift aborts certification, restores the exact activation target and release-status record, and publishes no certified baseline/PASS record. Mutable M42 state records and generated/private outputs are excluded from the digest by design; certifiable source inputs are not. Runtime Users/RBAC behavior is unchanged.

## Latest continuation verification — source-tree evidence binding

M42 static verification is **116/116 PASS** and Users/RBAC deterministic verification is **31/31 PASS**. The activation transaction rejects injected source drift before activation and after activation, restoring both authoritative M42 state records. The finalizer rejects source drift between dedicated certification and staged baseline creation, and the success-path regression now executes the real certification-tree digest and staged secret scanner. Security, UI, package-secret hygiene, and script syntax checks pass. Historical collect-all remains **136/152 PASS** with the same 16 dependency-resolution executions only. Real preflight/certification/finalization attempts fail closed on exactly two external prerequisites—npm registry DNS `EAI_AGAIN` with an incomplete offline cache and absence of a Docker-compatible runtime—and preserve both M42 source-state records byte-for-byte. State remains **implementation-complete-pending-certification** and no certified baseline/PASS record is authorized yet.

## 2026-09-14 installed dependency content binding corrective

M42 release certification now performs a governed clean lockfile materialization instead of trusting a version-correct preexisting `node_modules` tree, binds browser/Database-RLS/post-release evidence to a deterministic installed-dependency content digest, and fails closed on dependency-byte drift. Aggregate preflight now proves clean materialization capability even when current installed package metadata already matches the lockfile.

The milestone remains **implementation-complete-pending-certification**. The current environment still lacks registry DNS/cache capability to materialize the exact dependency graph and lacks a Docker-compatible runtime for the disposable Supabase pgTAP gate. No certified baseline or PASS record has been created.

## 2026-09-14 final continuation verification — dependency content integrity

The dependency-content and CI evidence-parity corrective is verified locally: M42 static **127/127 PASS**, Users/RBAC deterministic **31/31 PASS**, all certification-orchestration/package regressions PASS, security PASS, UI PASS, and historical **136/152** with only the same dependency-resolution blockers. The milestone remains `implementation-complete-pending-certification`; no certified baseline/PASS record is permitted until clean dependency materialization and the disposable Supabase pgTAP gate are available and the full fail-closed transaction succeeds.

## Governed modern test-toolchain dependency topology corrective — 2026-09-14

M42 certification no longer captures dependency evidence before installing its own browser/test tooling. Clean application `npm ci` is followed by exact governed modern test-toolchain materialization and lockfile/toolchain verification; the combined installed tree is then content-bound for all browser, Database/RLS, historical, and release evidence. Nested dependency checks may preserve the no-save toolchain only when the current installed tree matches the certification transaction's captured SHA-256. CI and offline preflight follow the same dependency topology. Local M42 static/deterministic/security/UI verification remains clean, and historical verification is back to 136/152 with only the same dependency-resolution blockers. State remains **implementation-complete-pending-certification**.

## Hosted fail-closed certification execution path — 2026-09-14

M42 now has a manual GitHub-hosted certification workflow (`.github/workflows/m42-certified-baseline.yml`) that supplies the npm-network and Docker/Supabase capabilities unavailable in the current sandbox while preserving the existing fail-closed finalizer as the sole certification authority. The workflow independently validates the certified ZIP/PASS-record digest binding, active-certified release status, and checksum manifest before artifact upload. Local static verification is **143/143 PASS**, Users/RBAC deterministic execution is **31/31 PASS**, security/UI gates pass, and historical collect-all remains **136/152** with only the existing dependency-resolution executions. State remains **implementation-complete-pending-certification** until one hosted finalizer run succeeds on the exact candidate revision.

## Hosted exact-revision certification provenance corrective — 2026-09-14

Hosted M42 certification now requires the operator-provided `expected_commit_sha` to match `GITHUB_SHA` before certification begins. Successful PASS records are bound to the certified ZIP SHA-256, the M42 certified source-tree SHA-256, and the exact Git source commit. This closes wrong-revision/manual-dispatch ambiguity while preserving the existing fail-closed finalizer authority. Local verification after this corrective is 145/145 M42 static checks, 31/31 Users/RBAC deterministic vectors, security PASS, UI PASS, and historical 136/152 with the same 16 dependency-resolution-only failures. Formal M42 state remains `implementation-complete-pending-certification` until the hosted finalizer succeeds.

## Deterministic dependency materialization corrective — 2026-09-15

GitHub-hosted diagnostic revision `49d29c460015cb86db8ec168079e84a1cc21bc8c` exposed a certification-infrastructure defect: the exact modern-test toolchain was installed with an unlocked second npm operation against the application root, allowing npm to replace lockfile-governed transitive packages. The lockfile verifier correctly failed and has not been weakened.

The modern-test toolchain now materializes in `node_modules/.wm-modern-test-toolchain`. Managed package/binary bridges preserve existing Vitest / Testing Library / Playwright consumers while the tool closure remains physically isolated from the application dependency graph. Bootstrap now requires an exact application lockfile baseline before installation, preserves `package.json` and `package-lock.json` byte-for-byte, re-verifies all lockfile packages afterward, and verifies bridge isolation. The offline M42 certification probe uses the same materialization authority.

Local static, deterministic, security, and UI gates pass. Hosted GitHub revalidation is still required, so M42 remains `implementation-complete-pending-certification` and no certified ZIP/PASS record is authorized yet.

## 2026-09-15 hosted M39 browser-boundary corrective

Corrective Action 2 replaces the split M39 Playwright readiness/value boundary with retryable atomic runtime authority reads and idempotent revalidation execution. The deterministic boundary regression is now mandatory under `auth-stabilization:test`. This is a certification-harness correction only; M42 remains `implementation-complete-pending-certification` until the GitHub-hosted M39 browser suite and subsequent M42 fail-closed certification complete successfully.

## 2026-09-15 hosted evidence-stability corrective

GitHub-hosted integration revision `c4b42ddd594bc05b6e1d3e93c01a1b31f83fcd24` substantially advanced M42 verification: preflight, static verification (148 checks on that revision), deterministic verification (31 vectors plus certification regressions), browser 6/6, Database/RLS 96 tests, historical 152/152, TypeScript, security, and UI all passed. Only the old final `Verify M42 evidence digests remained stable` step failed.

The old shell comparison emitted no recomputed digest or changed-path information, so the exact historical changed tree cannot be proven after the run. A concrete false-positive evidence-domain defect has been reproduced and corrected: Vite 8.2.2 generated bundled-config output under `node_modules/.vite-temp` was previously hashed as installed dependency content. The corrected dependency authority normalizes `.vite-temp` while preserving all actual installed package bytes/modes/symlink targets; the focused M42 browser gate uses native Vite config loading; and new source/dependency manifests are verified after every major hosted and release-certification gate with exact path diagnostics.

Current locally executable corrective verification is PASS: M42 static 153/153, Users/RBAC 31/31, activation/finalizer/clean-dependency/governed-toolchain/certifier/package-hygiene/evidence-stability/hosted-workflow regressions, security, and full UI. Local historical remains 136/152 solely because this sandbox cannot materialize the exact dependency tree; the immediately preceding hosted revision already proved historical 152/152. Current aggregate preflight fails closed on exactly two sandbox capabilities (npm registry DNS/cache materialization and Docker), and an actual finalizer attempt preserves both M42 authority records byte-for-byte and creates no certified output.

M42 remains `implementation-complete-pending-certification`. The next required operation is hosted revalidation of the exact new corrective commit. Only when `Users RBAC Functional Recovery` is fully green may `Stage G M42 Certified Baseline` be dispatched against the same SHA.

### Hosted evidence-stability continuation package

The next hosted candidate is packaged as `Work-Management-App-v1.43.2-Stage-G-M42-Hosted-Evidence-Stability-Corrective-Continuation-Candidate-2026-09-15`. This is a continuation candidate, not a certified M42 baseline. Certification remains fail closed until the automatic Users/RBAC integration workflow and subsequent exact-revision certified-baseline workflow both pass.

## 2026-09-15 Supabase CLI temporary evidence-boundary corrective

Hosted `Users RBAC Functional Recovery` run `34941635390` / job `104291433377` on commit `aba7d0462eaf90734034036a6f40f95147cf25a8` conclusively localized the remaining evidence drift. The run passed preflight, static verification, deterministic verification, all 6 browser scenarios, and all 96 Database/RLS tests. The immediately following source-evidence comparison reported one added path only: `supabase/.temp/cli-latest`.

Corrective scope is restricted to certification evidence/hygiene:

- `scripts/lib/stage-g-m42-certification-tree.mjs` excludes only `supabase/.temp` by exact project-relative directory path.
- `.gitignore` ignores `supabase/.temp/`.
- `scripts/verify-stage-g-m42-evidence-stability.mjs` proves the generated CLI path is normalized while real Supabase and application source mutations remain digest-visible.
- `verify-stage-g-m42-users-rbac-functional-recovery.mjs` protects the narrow exclusion and corrective record.
- `M42-SUPABASE-CLI-TEMP-EVIDENCE-BOUNDARY-CORRECTIVE-2026-09-15.md` records the hosted evidence and fail-closed rationale.

No Users/RBAC production logic was changed.

Latest local evidence after this corrective:

- M42 static: **155/155 PASS**.
- Users/RBAC deterministic aggregate: **PASS**, including 31/31 execution vectors and all M42 certification regressions.
- Supabase temporary evidence fixture and actual-project digest stability check: **PASS**.
- Stage A security baseline: **PASS**.
- Full UI verifier chain: **PASS**.
- Historical collect-all: **136/152 locally**; the 16 failures are dependency-resolution failures in the dependency-less sandbox, not established logic regressions.
- Aggregate M42 preflight: **FAIL CLOSED on exactly 2 sandbox capabilities** — npm registry DNS/offline cache materialization and Docker runtime.
- M42 activation state: `implementation-complete-pending-certification`.
- Certified M42 ZIP/PASS: **not authorized and not created**.

Required continuation: push this exact corrective candidate, wait for the automatic hosted `Users RBAC Functional Recovery` workflow to pass all remaining gates, then run `Stage G M42 Certified Baseline` against the same exact commit SHA. Any further project-side correction is permitted only if that hosted run exposes a new concrete failing gate.

### Fail-closed local finalizer proof for this corrective

An actual `scripts/finalize-stage-g-m42.sh` attempt was executed after the corrective. It stopped at the aggregate preflight because this sandbox still lacks registry resolution/offline cache completeness and Docker. The M42 target hash remained `4f9069656711396db2d91737888da61b12be06594518a22247451fd68cb96dfc` before and after the attempt; the release-status hash used for that attempt also remained byte-for-byte unchanged. The finalizer reported rollback/preservation and produced no M42 certified baseline ZIP or PASS record.

Latest continuation package root: `Work-Management-App-v1.43.2-Stage-G-M42-Supabase-CLI-Temp-Evidence-Boundary-Corrective-Continuation-Candidate-2026-09-15`.

## Hosted modern test-toolchain staging corrective — 2026-09-15

Hosted commit `424e68a02bbda0168d7bc12c19811c8d73c7e7d1` proved a new shared infrastructure blocker: application `npm ci` succeeded, but npm 10.9.2 crashed with `Cannot read properties of null (reading 'edgesOut')` while resolving the exact governed modern test-toolchain from the nested `node_modules/.wm-modern-test-toolchain` working directory. The same crash occurred independently in M39, M40, modern-test, and M42 hosted workflows.

The governed toolchain authority now performs npm resolution in a disposable OS-temporary staging workspace outside the application tree, verifies the staged exact package set, and transactionally publishes the verified snapshot into the existing isolated `node_modules/.wm-modern-test-toolchain` authority. Failed staged installs preserve the last verified published workspace and bridges. The application lockfile graph, exact top-level test-tool versions, bridge isolation, package/lock immutability, dependency-content certification binding, and all fail-closed release gates remain enforced.

Current project-side verification for this corrective: M42 static verification **159/159 PASS**; Users/RBAC deterministic execution and certification regressions **PASS**, including the strengthened governed-toolchain regression that enforces external staging and failed-stage preservation. Hosted closure remains pending because this exact corrective has not yet run on GitHub Actions. No M42 certified ZIP or PASS record is authorized or created.

State remains **implementation-complete-pending-certification**.

### Verification status after staging corrective

- Static M42 contract: **159/159 PASS**.
- Deterministic M42 aggregate: **PASS**; 31/31 Users/RBAC vectors and all certification regressions pass.
- Security baseline: **PASS**.
- UI verification: **PASS**.
- Historical collect-all: **136/152 locally**, with the same 16 dependency-resolution blocked executions caused by the sandbox's unavailable exact dependency tree.
- Certification preflight: **FAIL CLOSED on 2 external capabilities** — npm registry/cache materialization and Docker runtime.
- Hosted verification of this exact staging corrective: **pending**.
- Certified baseline/PASS record: **not created**.

Accordingly, milestone state remains **implementation-complete-pending-certification**.

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


# M42 Deterministic Dependency Materialization Corrective

Date: 2026-09-15  
Milestone: Stage G — M42 Users / RBAC Functional Recovery  
Status: implemented and locally verified; hosted revalidation still required

## Hosted defect reproduced

GitHub-hosted execution of commit `49d29c460015cb86db8ec168079e84a1cc21bc8c` proved that the prior modern-test bootstrap could mutate packages governed by the application `package-lock.json`.

The hosted sequence was:

1. `npm ci --ignore-scripts` materialized the exact application lockfile graph.
2. `modern-tests:toolchain:ensure` ran a second root-level `npm install --no-save --package-lock=false --ignore-scripts` for Vitest / Testing Library / Playwright / jsdom.
3. npm re-resolved compatible transitive packages in the same root `node_modules`.
4. `users-rbac-recovery:dependencies:check` correctly failed because lockfile-governed versions had changed.

Observed hosted drift included:

- `@oxc-project/types` 0.147.0 -> 0.149.0
- `@rolldown/binding-linux-x64-gnu` 1.2.6 -> 1.2.8
- `nanoid` 3.3.18 -> 3.3.19
- `postcss` 8.5.26 -> 8.5.28
- `rolldown` 1.2.6 -> 1.2.8
- `yaml` 2.9.0 -> 2.9.1

The dependency verifier was not weakened. The bootstrap was the defective authority because it performed an unlocked second install against the application dependency root.

## Corrective architecture

The governed modern test toolchain is now materialized inside:

`node_modules/.wm-modern-test-toolchain`

The application root is no longer the working directory of the no-save test-tool install.

`scripts/lib/modern-test-toolchain.mjs` now owns:

- the exact eight top-level testing-tool versions;
- the dedicated toolchain workspace;
- the no-save / package-lock-disabled / ignore-scripts install contract;
- managed package and binary bridges back into the application `node_modules` namespace;
- explicit isolation verification proving each governed top-level package is a symlink into the dedicated workspace.

The bridges preserve existing test imports and CLI paths while Node resolves each tool package from its real isolated location. The isolated toolchain closure therefore cannot overwrite the application lockfile packages during materialization.

## Fail-closed application dependency boundary

`scripts/ensure-modern-test-toolchain.mjs` now:

1. requires the application dependency tree to match `package-lock.json` before bootstrap;
2. refuses to use test-tool bootstrap as a repair mechanism for application dependency drift;
3. runs the test-tool install only inside the isolated workspace;
4. requires `package.json` and `package-lock.json` to remain byte-identical;
5. re-verifies every applicable application lockfile package after bootstrap with governed extras allowed;
6. verifies exact modern-test versions and managed isolation bridges before reporting PASS.

This converts the previous implicit assumption into an enforced invariant: test infrastructure may extend `node_modules`, but it may not re-resolve or replace the application dependency graph.

## Offline certification parity

`scripts/lib/npm-offline-m42-certification-probe.mjs` now uses the same isolated materialization authority after disposable offline `npm ci`. It verifies:

- exact application lockfile packages;
- exact modern test-tool versions;
- isolated bridge ownership.

The preflight therefore tests the same dependency architecture that hosted certification uses.

## Deterministic regression

`scripts/verify-stage-g-m42-governed-toolchain-preservation.mjs` now includes a root-cause fixture. Its fake npm executable intentionally corrupts a lockfile-governed application package if npm is invoked from the application root. The corrected bootstrap executes npm only from `.wm-modern-test-toolchain`, so the corruption path is never reached.

The regression proves:

- the application package remains byte-for-byte unchanged;
- `package.json` and `package-lock.json` remain byte-for-byte unchanged;
- all eight governed test tools verify;
- package bridges point into the isolated workspace;
- strict dependency verification still rejects extraneous tooling by default;
- certification-mode verification allows the governed extension without relaxing exact application package versions;
- digest-bound M42 preservation retains the isolated extension without cleaning or mutating it.

## Local verification

- M42 static verification: PASS — 145/145 before adding this corrective-record assertion.
- M30 historical modern-testing verifier: PASS.
- M42 Users/RBAC deterministic suite: PASS — 31/31 vectors plus all certification regressions.
- Deterministic isolated dependency-materialization regression: PASS.
- Stage A security baseline: PASS.
- Full UI verification: PASS.
- JavaScript syntax verification for all modified executable modules: PASS.

A live registry-backed bootstrap cannot be re-executed in this sandbox because `registry.npmjs.org` remains unavailable. The next hosted GitHub revision must re-run the real npm materialization gate before this corrective is considered hosted-certified.

No certified M42 baseline or PASS record is authorized by this corrective alone.

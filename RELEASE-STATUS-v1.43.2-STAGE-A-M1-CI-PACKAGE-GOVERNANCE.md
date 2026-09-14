# Work Management v1.43.2 — Stage A Milestone 1 CI and Package Governance

## Milestone verdict

**Implementation: COMPLETE at source level.**

**Existing application regression certification: PASS.**

**Online governance execution: PENDING external dependency/network availability.**

This milestone does not change application features, domain behavior, Supabase contracts, Boards behavior, or embedded application authorization. It establishes a reproducible CI/package-governance layer around the latest authoritative v1.43.2 Shell M8 Collapse Structural Hotfix RC.

## Baseline

Authoritative source baseline:

`Work-Management-App-v1.43.2-Shell-M8-Collapse-Structural-Hotfix-RC.zip`

No unrelated feature implementation was introduced.

## Implemented governance

### Governed Node/npm toolchain

- `.nvmrc`: Node `22.16.0`
- `package.json#engines.node`: `>=22.12.0 <23`
- `package.json#engines.npm`: `>=10.9.0 <11`
- `packageManager`: `npm@10.9.2`
- `.npmrc`: strict engines, exact saves, lockfile required, npm audit enabled

The previous Node 20 compatibility claim was removed because the current verifier/runtime architecture depends on the Node 22 native TypeScript stripping path. The Vite architecture verifier was updated to enforce the governed Node/npm contract instead of the obsolete engine range.

### Package integrity policy

`scripts/verify-package-governance.mjs` now enforces:

- package is private,
- governed Node/npm versions,
- npm lockfile v3,
- package/lock root identity and engine alignment,
- exact direct dependency versions,
- no undeclared root lock dependencies,
- npm-registry-only dependency sources,
- no root install-time lifecycle scripts without governance approval,
- required governance/lint/audit/release scripts,
- workflow presence and versioned action references,
- no `pull_request_target`,
- CI and deployment revalidation,
- dist-only GitHub Pages deployment.

`verify-stage-a-m1-ci-package-governance.mjs` protects the milestone-specific CI/package contracts.

### Secret hygiene

`scripts/scan-secrets.mjs` provides a bounded high-confidence source scan for:

- private keys,
- GitHub tokens,
- AWS access keys,
- OpenAI secret keys,
- Slack tokens,
- Stripe live secret keys,
- Supabase service-role credential assignments.

It intentionally does not classify Supabase publishable/browser keys as secrets.

### ESLint baseline

`eslint.config.mjs` establishes the initial ESLint 10 JavaScript/MJS quality contract for:

- Vite configuration,
- root verifier scripts,
- scripts,
- browser harnesses,
- JavaScript configuration.

The CI bootstrap pins `eslint@10.9.1` explicitly. TypeScript source remains authoritative under the strict compiler and Work Management TypeScript verifiers during this transition.

The embedded `apps/` JavaScript compatibility islands remain outside the new host ESLint boundary until their Stage E migrations.

### Package scripts

Added:

- `lint:eslint`
- `lint:typescript`
- `lint`
- `governance:package`
- `governance:secrets`
- `governance:check`
- `audit:ci`
- `ci:check`

`check` and `release:check` now include the package-governance gate.

## Continuous integration

Added `.github/workflows/ci.yml`.

The CI job performs:

1. governed Node setup from `.nvmrc`,
2. exact `npm ci`,
3. package governance and secret scan,
4. ESLint plus strict TypeScript lint gate,
5. npm high/critical vulnerability audit,
6. complete `release:check`,
7. SHA-256 manifest generation for `dist/`,
8. upload of the certified production artifact.

The GitHub Pages deployment workflow now independently repeats governance, lint, vulnerability audit, and the complete release gate before uploading only `./dist`.

## Security/supply-chain automation

Added:

- `.github/workflows/codeql.yml`
  - JavaScript/TypeScript CodeQL on PR, main, weekly schedule, manual dispatch.
- `.github/workflows/dependency-review.yml`
  - blocks dependency changes containing high/critical known vulnerabilities.
- `.github/dependabot.yml`
  - weekly npm dependency review,
  - weekly GitHub Actions review.

Repository-level GitHub secret scanning, push protection, and branch protection remain external repository settings and cannot be enabled by source code alone.

## Documentation

Added `docs/CI-PACKAGE-GOVERNANCE.md` documenting:

- governed toolchain,
- exact install policy,
- required local and release gates,
- CI behavior,
- security automation,
- failure semantics,
- recommended branch-protection requirements,
- ESLint migration boundary.

## Verification performed in this environment

### PASS

- package governance verifier
- Stage A M1 milestone verifier
- high-confidence secret scan
- YAML syntax for CI, deployment, CodeQL, dependency review, and Dependabot
- strict TypeScript `tsc --noEmit`
- TypeScript architecture/runtime verification
- Vite static architecture verification
- production hardening verification
- all Boards M1–M8 verification contracts
- all Shell M1–M8 verification contracts
- Collapse Control / Anchor / Structural hotfix verification
- TimeTracker v2 Pass 1 / Pass 2
- full Work Management project verifier
- complete Chromium regression/responsive/accessibility matrix
- `npm run check`

Final local source/runtime result:

`npm run check` → **PASS**

### Network-backed gates not executable here

The container currently cannot resolve the npm registry:

`npm view eslint@10.9.1 version` → `EAI_AGAIN registry.npmjs.org`

Therefore this environment cannot certify:

- a clean online `npm ci`,
- the new `lint:eslint` npm bootstrap,
- `npm audit`,
- the Vite-backed `verify:dev/build/verify:dist/verify:preview` sequence,
- actual GitHub Actions execution,
- CodeQL upload,
- Dependency Review service execution,
- Dependabot execution.

This is an environment/network limitation rather than an application-source failure.

## Temporary compatibility boundaries

### ESLint dependency boundary

ESLint is pinned as a CI bootstrap tool rather than added as a locked project devDependency because registry access is unavailable in this certification environment and changing `package.json` without a complete lockfile would break `npm ci` reproducibility.

When registry access is available, add exact locked `eslint` and `typescript-eslint` devDependencies and extend `eslint.config.mjs` to type-aware TypeScript rules. Existing TypeScript strictness must remain unchanged.

### Embedded application lint boundary

TimeTracker, FuelTrack+, and TradeLink legacy JavaScript runtimes remain excluded from the new host ESLint boundary until their dedicated modernization stages. Their existing regression and production verifiers remain authoritative meanwhile.

### GitHub repository settings

The source now defines CI/security workflows, but these repository controls require administrator configuration outside the ZIP:

- required status checks,
- branch protection,
- secret scanning,
- push protection,
- CodeQL/security feature enablement where required by plan/repository type.

## Exact source change scope from the Structural Hotfix RC

### Added

- `.github/dependabot.yml`
- `.github/workflows/ci.yml`
- `.github/workflows/codeql.yml`
- `.github/workflows/dependency-review.yml`
- `.npmrc`
- `.nvmrc`
- `docs/CI-PACKAGE-GOVERNANCE.md`
- `eslint.config.mjs`
- `scripts/scan-secrets.mjs`
- `scripts/verify-package-governance.mjs`
- `verify-stage-a-m1-ci-package-governance.mjs`
- `RELEASE-STATUS-v1.43.2-STAGE-A-M1-CI-PACKAGE-GOVERNANCE.md`

### Modified

- `.github/workflows/deploy-pages.yml`
- `package.json`
- `package-lock.json`
- `verify-v1360-vite-migration.mjs`
- `CHECKSUMS.sha256` (regenerated after packaging preparation)

### Removed

None.

No source changes were made inside:

- TimeTracker,
- FuelTrack+,
- TradeLink,
- Supabase schema/migrations/RLS/RPC,
- authentication implementation,
- host/module RBAC,
- Board repository/domain/command services,
- Board UI/business behavior.

## Remaining work before Milestone 1 is externally certified

On a dependency-enabled workstation or GitHub Actions runner:

```bash
npm ci
npm run governance:check
npm run lint
npm run audit:ci
npm run release:check
```

Then verify that the following GitHub checks execute successfully on a pull request:

- Work Management CI
- CodeQL
- Dependency Review

After that, enable the recommended protected-branch checks and GitHub secret scanning/push protection.

## Final Milestone 1 status

**Source implementation: COMPLETE.**

**Existing application regression verification: PASS.**

**Governance static verification: PASS.**

**Online CI/lint/audit/build execution: PENDING due npm-registry/network availability in the current environment.**

No application module requires further M1 implementation. The remaining work is external execution/activation of the source-controlled governance controls.

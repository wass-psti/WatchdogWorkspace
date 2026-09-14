# CI and Package Governance

This document defines the Stage A production governance contract for Work Management v1.43.2.

## Governed toolchain

- Node.js: `22.16.0` (`.nvmrc`)
- Supported Node range: `>=22.12.0 <23`
- npm package manager contract: `npm@10.9.2`
- npm supported range: `>=10.9.0 <11`
- Lockfile: npm lockfile v3
- TypeScript: exact version from `package-lock.json`
- Vite: exact version from `package-lock.json`
- ESLint CI bootstrap: `eslint@10.9.1`

The Node engine is intentionally narrower than earlier releases. The project verifier/runtime toolchain uses the Node 22 native TypeScript stripping path, so advertising Node 20 support would be inaccurate.

## Install policy

Use only:

```bash
npm ci
```

for CI, release verification, and clean production certification. `npm install` is reserved for intentional dependency changes that also update and review `package-lock.json`.

Direct dependency versions must be exact. Git, local-path, and arbitrary URL dependencies are prohibited unless explicitly approved and added to the package-governance verifier.

## Required local gates

Before opening or updating a pull request:

```bash
npm ci
npm run governance:check
npm run security:check
npm run lint
npm run check
```

For a release candidate:

```bash
npm run audit:ci
npm run release:check
```

`release:check` is the authoritative source/dev/build/dist/preview/project regression gate.

## CI checks

`.github/workflows/ci.yml` runs on pull requests, pushes to `main`, and manual dispatch. It performs:

1. governed Node setup,
2. exact `npm ci`,
3. package-governance verification,
4. high-confidence secret scan,
5. Stage A security-baseline verification,
6. ESLint for JavaScript/MJS tooling and strict TypeScript compilation,
7. npm high/critical vulnerability audit,
8. the complete `release:check`,
9. a SHA-256 manifest for the generated `dist/`,
9. upload of the certified `dist/` artifact.

The GitHub Pages deployment repeats governance, lint, audit, and release validation before uploading **only `./dist`**.

## Security automation

- CodeQL analyzes JavaScript/TypeScript on PRs, `main`, weekly schedule, and manual dispatch.
- Dependency Review blocks PR dependency changes introducing high/critical known vulnerabilities.
- Dependabot creates weekly npm and GitHub Actions update PRs.
- `scripts/scan-secrets.mjs` blocks a bounded set of high-confidence credential formats from source control.

GitHub repository-level secret scanning and push protection should also be enabled in repository settings when available. Those settings cannot be enforced from source files alone.

## ESLint transition boundary

Stage A M1 deliberately avoids changing the application dependency graph while registry access is unavailable in the certification environment. ESLint is therefore pinned and executed as a CI tool (`eslint@10.9.1`) for JavaScript/MJS operational code. TypeScript remains governed by the strict compiler and the Work Management TypeScript architecture verifiers.

When registry access is available, the next package-tooling maintenance pass should add `eslint` plus `typescript-eslint` as exact locked devDependencies and extend the flat configuration to type-aware TypeScript rules. That migration must not weaken existing `tsconfig.json` strictness.

## Branch and release expectations

Recommended protected-branch requirements for `main`:

- Work Management CI / Govern, lint, verify, and build
- CodeQL / JavaScript and TypeScript analysis
- Dependency Review / Review dependency changes
- Require pull request review before merge
- Require branch to be up to date before merge
- Block force pushes and branch deletion

Repository branch-protection configuration is an external GitHub setting and must be enabled by a repository administrator.

## Failure semantics

A failed governance, lint, audit, release, CodeQL, or dependency-review check blocks promotion. Do not bypass a failed release check by manually uploading a locally generated `dist/`.


## Stage F specialized workflows

Database/RLS, modern testing, performance, and observability have dedicated CI workflows in addition to the main CI and deploy preflight. The observability workflow runs `observability:check`, `observability:test`, ESLint, and strict TypeScript under the governed Node toolchain.


### Stage F M33 governance

The governed repository now includes `service-worker-updates.yml`. CI and deployment explicitly execute the M33 service-worker/update static and behavioral authorities before release. Production deployment continues to upload `./dist` only.

# Work Management v1.43.2 — M4 Corrective Runbook

This corrective package repairs the governance/extraction and lint defects encountered while certifying Stage B Milestone 4.

## Corrected repository artifacts

The complete package contains and verifies:

- `.nvmrc` — Node `22.16.0`;
- `.npmrc` — `engine-strict=true`, `save-exact=true`, `package-lock=true`, `audit=true`;
- `.github/dependabot.yml`;
- `.github/workflows/ci.yml`;
- `.github/workflows/codeql.yml`;
- `.github/workflows/dependency-review.yml`;
- `.github/workflows/deploy-pages.yml`.

A visible recovery copy also exists under `governance-artifacts/`. If an extraction/copy process strips dotfiles or `.github`, M4 activation detects the loss and restores the missing files automatically before continuing. Manual recovery is also available:

```bash
npm run governance:restore
npm run governance:artifacts
```

## Corrected certification defects

- npm 10 lockfiles may omit the root `packageManager` field. Governance now validates it when present but no longer rejects a canonical npm 10 lockfile when the optional field is absent.
- Deployment explicitly executes governance, security, M3 React, M4 design-system, corrective-integrity, ESLint, dependency audit, and release certification gates.
- The five reported `no-promise-executor-return` ESLint defects were corrected in verifier/browser utility code.
- `design-system:activate` now runs the corrective-integrity and ESLint gates before provider activation.
- `check` and `release:check` include the corrective-integrity gate; release certification also includes ESLint and the high-severity dependency audit.

## Recommended clean certification sequence

From a fresh extraction of this corrective package:

```bash
nvm use
node -v
npm -v
npm run governance:check
npm run security:check
npm run corrective:check
npm run design-system:activate
npm run design-system:status
```

If the status becomes `active-pending-release-certification` with `Provider mounted: YES`, continue:

```bash
npm run design-system:activate:release
npm run design-system:status
```

Milestone 4 is complete only when the final status reports:

```text
Activation state: active-certified
Provider mounted: YES
```

## Current package boundary

The distributable remains dependency-install neutral: `@chakra-ui/react` and `@emotion/react` are not fabricated into the lockfile. `design-system:activate` installs the exact governed targets and certifies them on the machine performing release activation.

## Vendor declaration compatibility correction

When Chakra `3.36.1` and Emotion `11.14.0` are installed under the governed React 19.2 / TypeScript 5.8 baseline, TypeScript can report errors inside `node_modules` from Chakra's transitive Ark/Zag declaration files (for example optional `id` inheritance, generated `cornerShape`, and Zag's `Buffer` declaration). These are vendor `.d.ts` consistency errors rather than Work Management source errors.

The corrective baseline now sets `skipLibCheck: true` while retaining every strict Work Management source flag, including `exactOptionalPropertyTypes: true`. This matches Chakra's own strict build policy. The additional `npm run vendor-types:check` gate verifies that no application type-safety flags were relaxed and that no declaration patches or TypeScript suppression comments were introduced.

After extracting this package, the normal M4 activation sequence is unchanged:

```bash
nvm use
npm run governance:restore
npm run governance:check
npm run security:check
npm run corrective:check
npm run vendor-types:check
npm run design-system:activate
npm run design-system:status
```

If activation reaches `active-pending-release-certification` with `Provider mounted: YES`, continue with `npm run design-system:activate:release`.

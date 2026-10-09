# M108 login successor — uncertified continuation

**State: CONTINUE — IMPLEMENTATION REQUIRED.** This package is a certification candidate, not a production release. Hosted Supabase sign-in, account-access revocation, session refresh, and logout have not been independently tested against the production deployment.

## Immutable predecessor and corrective

- Original certified M108 ZIP SHA-256: `7be24ace31dccca32cdcd806d9e1c6f276b266a34b5d12aad0b4de6deefa5735`.
- Original successor candidate ZIP SHA-256: `34fcc770603fa5310d21250469044773daf52591ba248e342e843cbf465a5038`.
- Corrected `assets/js/core/auth.ts` SHA-256: `b93073bd4b5a37359e5c8d499deb7f63a5e8edf448170ec4bb57aba30c76c511`.
- Corrective regression SHA-256: `f18429eaf876a0355259534fdcfc01db244f96ad0a6b1e97728a8b912b540a22`.
- Corrective note SHA-256: `fff2e806d030458fc89e9c231f74d41f1d442e8eda4a4c260a00bbd2977f6fae`.
- Root lockfile SHA-256: `8a4790f586c86ec1c77d9815df6edc4a0561cc753cf8011bfb28ee78cc5f4667`.

## Latest successor correction — material-tracker source-guard routing

The 2026-10-09 macOS result reached `npm run material-tracker:integration:check` after root and nested locked dependency installations, audits, authentication execution checks, Material Tracker source, data, deterministic, regression, import/export and build checks. The npm script `material-tracker:source-guard` still invoked the M107/M106 historical guard on the successor tree, causing a fail-closed rejection of the approved authentication change and successor files. The successor changes only the package script binding to `node scripts/verify-m108-login-successor.mjs`. The original M108 and M107 guard files are unchanged and are still executed on the SHA-256 pinned predecessor. The lockfile is unchanged. The successor verifier requires exact byte hashes for the changed package.json, authentication correction and added certification files, with negative controls for altered package script routing. No completed release or production-authentication certification is claimed.

## Successor controls

The successor source verifier requires the original ZIP itself; it verifies the pinned archive hash and extracts a fresh comparison baseline. The original routing-only checkpoint permitted two existing-file changes and six additions. The current M79–M98 successor checkpoint instead permits exactly 11 pinned existing-file changes and seven named additions, restricted to the authentication corrective and successor verification/provenance paths. It rejects other changed, missing, or added sources and symlink entries. The successor runner invokes the historical source guards against the unmodified baseline, then runs the successor guard, its negative tests, dependency checks, static analysis, Material Tracker tests, builds, release and historical checks, post-build integrity, and security checks. **The successor does not weaken or execute the historical M108 source guard against modified source.**

Run locally with Node 22.16.0, npm 10.9.2, unzip, shasum, network access for locked `npm ci`, and the original certified M108 ZIP:

```bash
cd /absolute/path/to/extracted/successor
M108_BASELINE_ARCHIVE="$HOME/Downloads/Work-Management-App-v1.43.2-Stage-I-M108-Material-Tracker-Security-Corrective-Certified.zip" bash scripts/certify-m108-login-successor-local.sh
```

`M108_BASELINE_ARCHIVE` must refer to the original 7be24ace... artifact. A different archive fails closed. Successful local script execution **does not establish production authentication**.

## Outstanding production requirement

A release operator must test the exact candidate against the deployed Supabase project using the previously affected account, with recorded environment, artifact checksum, test timestamp, sign-in outcome, module access permissions, unknown-module exclusion, session restoration after refresh, logout/relogin, disabled account denial, and revocation. The verifier has no authenticated access to that environment. No final certified package may be issued until an independently validated live-authentication gate and the full local pipeline pass. The authoritative pre-certification artifact must remain labeled NOT CERTIFIED.

## 2026-10-09 — M83 predecessor-versus-successor verifier separation

The latest macOS release gate completed dependency preparation, audited both roots with zero vulnerabilities, verified TypeScript and ESLint, built Material Tracker and the Work Management App, passed browser tests and production artifact checks, and then failed in aggregate `npm run verify` at `verify-stage-i-m83-authentication-account-surfaces.mjs`. The historical M83 verifier only normalized the M108 Material Tracker RBAC vocabulary extension and rejected the separately approved login correction (`assets/js/core/auth.ts`). This is a historical proof-scope conflict, not a new login failure.

This continuation *does not change the original M108 archive or any historical source-guard file*. It preserves the historical M83 verifier in that archive and runs it on that authenticated predecessor. The successor's M83 verifier also executes all original checks, but permits a narrowly scoped additional attestation only when the original M108 ZIP matches its known SHA-256, the `auth.ts` extracted from it matches its historical SHA-256, and the successor `auth.ts` matches the previously approved corrective SHA-256. It does not allow arbitrary authentication edits. The pinned successor guard now covers the exact M83 successor-aware verifier and its attestation helper. Negative controls test missing and substituted archive provenance, source mutation, and verifier tampering.

**Historical M88/M89 inconsistency — successor-scoped correction:** Earlier M88/M89 snapshots disagree with evolved source bytes in the unchanged certified M108 archive (`supabase/schema.sql`, TradeLink, `assets/js/core/platform.ts`, Settings E2E source). The present successor accepts only the exact bytes from the SHA-256-pinned certified M108 archive, plus the exact login corrective for `auth.ts`. Original milestone source guards are preserved. M88/M89 deterministic tests now pass under this provenance check, with missing/substituted archive cases rejecting; full release and hosted gates remain pending. Existing historical guards must not be relaxed to conceal this discrepancy.

**State remains NOT CERTIFIED.** The complete revised successor candidate requires a new clean macOS run through all mandatory local gates; hosted Supabase authentication and independent production acceptance remain outstanding.

## Inherited M79–M83 npm source-guard routing

On the unchanged M108 predecessor the five `token-theme`, `shared-primitives`, `application-shell`, `layout-composition`, and `authentication-account` historical source guards pass. On an M108 login successor they transitively call the M107/M106 source guard against changed files and reject the expected approved delta. The successor's five npm script bindings now use the pinned successor verifier, as the Material Tracker binding already did. The original five historical guard script files remain byte-for-byte unchanged; the successor runner executes all five against the SHA-256-authenticated original archive before executing the successor's full release gate. The successor verifier checks the exact package.json hash and fails closed on any altered routing. This is a successor-only script routing change, not an edit to historical guard code or a waiver of the original guard checks.

## 2026-10-09 — M79–M98 inherited deterministic certification

The Mac run on the M83 predecessor-aware successor (`713eaf8b...`) passed M83, material-tracker and host builds, TypeScript, lint, browser regression and tests until `token-theme:test`. The M79 deterministic test invoked its original historical M79→M78 guard on the changed successor and failed, although the original guard passed on the unchanged pinned M108 predecessor. Preflight investigation found the same embedded historical-guard invocation in M81, M82, M83, M84 and M98 deterministic tests. M88/M89 deterministic tests also compared protected sources against older milestone manifests despite the same files differing within the unchanged certified M108 archive.

The current successor does not edit historical source-guard scripts or any application/business runtime. It changes only the nested deterministic test calls for M79/M81/M82/M83/M84/M98 to invoke the byte-pinned successor source verifier. It verifies original M79–M84 and M98 source guards on the SHA-256-authenticated M108 predecessor before running current semantic tests. M88 and M89 tests retain every semantic assertion and accept *only* the exact inherited authority bytes from the pinned M108 predecessor, or the approved corrected `auth.ts` hash, for explicitly enumerated previously evolved files. Both tests reject absent or substituted predecessor provenance and fail when protected source bytes change. The successor source verifier pins every changed test/helper/runner file hash and rejects any unapproved source delta or symbolic link.

The full local pipeline has not run against this revised successor candidate. No live production Supabase authentication has been verified. This handoff is NOT CERTIFIED.

## 2026-10-09 — CI / deployment predecessor ZIP provenance

The original M79–M98 candidate passed the full macOS local pipeline, but the connected GitHub main branch remains M106 and does not include the approved M108 corrective. New scoped successor modifications add a SHA-256-verified predecessor acquisition step to the workflows that directly execute successor release/historical guards (CI, Pages, production cutover, M54, Users/RBAC, legacy deletion). A single local composite action downloads the original M108 predecessor archive from the repository's `m108-certified-predecessor-archive` GitHub release asset, checks its exact pinned SHA-256 and ZIP structure, and exposes `M108_BASELINE_ARCHIVE` to later workflow steps. The archive is never accepted by name alone; a missing/mismatched asset stops the workflow. The former historical source guards remain unchanged.

The operator must first publish the *original*, SHA-256 authenticated M108 ZIP as an evidence-only GitHub release asset using the staged Mac command. Creating the release is a public provenance operation, **not** a production deployment or application certification. Stage and review the new successor source on a GitHub branch/PR, do not merge until required CI gates pass and explicit release approval is obtained. The GitHub Pages workflow only deploys on main/explicit workflow dispatch; PR creation alone does not promote production.

**Current status: NOT CERTIFIED.** This CI provisioning change modifies the source candidate, so its entire mandatory local certification sequence must be executed again on macOS. Hosted login, module exclusion, session restoration, logout, disabled-account and revocation acceptance remain unexecuted.


## 2026-10-09 — CI governance local composite-action classification

The mode-restored M108 successor passed protected shell-executable modes, deterministic M98/M78, locked installs and audits, TypeScript, lint, Material Tracker and host builds, but failed `governance:package` because the historical action-reference parser incorrectly classified seven `uses: ./.github/actions/prepare-m108-baseline` references as unversioned third-party remote actions. GitHub's local composite-action syntax has no `@ref`; attaching a version would invalidate the workflows. This successor-scoped correction permits **only** the exact local predecessor-acquisition path, verifies the action's fixed SHA-256, and continues enforcing original remote-action version and mutable-reference rejection. Negative controls cover missing/altered local action, unauthorized local paths, unversioned and mutable remote actions, and tampering of the governance verifier itself. The historical M108 baseline and source guards are not edited. The revised candidate requires complete fresh Mac certification. All hosted acceptance remains NOT CERTIFIED.


## 2026-10-09 — PR #15 CodeQL high-severity CSS-token origin corrective

GitHub CodeQL flagged an inherited Material Tracker integration guard (`integrations/material-tracker/scripts/check-integration.mjs`) for `includes('fonts.googleapis.com')`, because matching an origin as a substring is unsafe. The check is build-time source verification, not a runtime fetch or authorization decision. The successor replaces the brittle banned-domain substring with a stricter static contract: the generated Material Tracker theme-token stylesheet may not contain *any* `@import`, `url(...)`, or `image-set(...)` resource reference. Deterministic cases reject remote Google Fonts URLs, attacker-controlled hosts with the Google Fonts string in host/path, protocol-relative URLs, data URLs, local imports, and image-set references; plain token declarations still pass. This narrowly scoped check does not change CSS, font loading, authentication or the application itself. The M108 pinned source verifier authorizes only the exact replacement checker hash and rejects its tampering. All original guards and the predecessor ZIP are unchanged. This candidate requires full fresh Mac certification, updated PR #15 GitHub CI and hosted acceptance; it remains NOT CERTIFIED.

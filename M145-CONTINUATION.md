# M145 — Standalone integration removal

## Purpose

Remove the **four actual currently registered applications** — TimeTracker, FuelTrack+, TradeLink, and Material Tracker — without replacing any of them. This is an isolated source candidate, not a production deployment.

## Preserved

- Work Management React shell, login/register/session restore, account, Users, Settings, Boards, Board Import, shared design system and future module-host framework.
- All SQL migrations, current production Supabase tables/rows, shared board data, and Storage files. Database/Storage destruction was **not authorized**.
- Earlier standalone app source is recoverable from the predecessor ZIP and Git history.
- Unchanged source files are checked against the predecessor's SHA-256 manifest.

## Changed

- Empty `config/modules.ts` catalogue and normalized module-data descriptors; leave typed generic interfaces.
- Remove the legacy application source directories, Material Tracker generation source, its build lifecycle hook and FuelTrack-only analytics entry.
- Revise Vite copy/entry handling so deleted applications are not emitted.
- Prevent direct URL and identity bridge access to decommissioned modules, including platform administrators, while still recognizing historic Supabase assignment records (preserved, not deleted).
- Empty Applications view and stale favorites/recent references; no new app placeholders with fake functionality.
- Retire the now-inapplicable legacy module stabilization assertions in the manifest; retain generic module host lifecycle guards.

## Verification and blockers

Execute `node scripts/verify-m145-clean-platform.mjs`. This independently enforces exact SHA-256 preservation of every unchanged file, the approved removal set, and the empty module registry.

This is **not certified for production**: clean dependency install and build could not be completed in the ChatGPT container; the 2026 historical M108 archive guard and old standalone E2E contracts still expect the decommissioned files. Do not weaken these gates or merge without a governed M145 successor authorization, revised lifecycle tests, production acceptance and an independent review. Reuse all unaffected prior test evidence.

Current `main` must not be modified by this candidate.

## M145.1 correction and focused provenance gate (2026-10-15)

- Removed the two dangling `material-tracker:integration:check` invocations from
  root `check` and `release:check` (their script was removed in M145).
- Updated `scripts/verify-vite-server.mjs`: the host still checks the real
  unauthenticated shell, but no longer expects deleted standalone entrypoints to
  load. A legacy URL must be 404/403 or resolve only to the generic host SPA
  fallback, never executable old-app HTML.
- Added `scripts/verify-m145-predecessor-provenance.mjs` and
  `scripts/certify-m145-removal-local.sh`. The predecessor verifier requires the
  **pinned original M108 certified archive** (SHA-256
  `7be24ace31dccca32cdcd806d9e1c6f276b266a34b5d12aad0b4de6deefa5735`)
  and either the SHA-256-authenticated source archive of predecessor PR22
  (`d3cd0a7b34811fed58a54e8fa82cb1835c877ddc0d6f96ac83735df2df39bf9c`)
  **or** a clean Git checkout of production predecessor commit
  `994e925898fa7de596050cd06ec68a5a94a7c92b`.
- The entire predecessor file tree is verified against all 2,842 original
  SHA-256 digests; the original M108 successor guard is run **inside that
  authenticated predecessor checkout**, never bypassed or mislabeled as having
  passed against the removed source.
- Original M108 ZIP is published in the repository's GitHub release
  `m108-certified-predecessor-archive`. It must be fetched and SHA-256 checked.
- Post-removal local gates: targeted M145 source accounting; locked install;
  TypeScript; ESLint; Vite production build; no deleted application source
  emitted to `dist`; repeat **only the M145 source accounting after build** to
  detect unintended mutations. No Supabase mutations or broad historical E2E
  reruns are performed.

### Single-run macOS certification command

Run **inside the extracted M145.1 candidate directory**, with authenticated
`gh`, `git`, Node `v22.16.0`, npm `10.9.2`, and network access. Do not run this
against your production working tree. The command downloads only evidence and
checks out predecessor code in a disposable directory.

```bash
/bin/bash <<'BASH'
set -Eeuo pipefail
ROOT="$(pwd)"
TMP="$(mktemp -d "${TMPDIR:-/tmp}/watchdog-m145-proof.XXXXXXXX")"
trap 'rm -rf "$TMP"' EXIT
REPO='wass-psti/WatchdogWorkspace'
ARCHIVE='Work-Management-App-v1.43.2-Stage-I-M108-Material-Tracker-Security-Corrective-Certified.zip'
mkdir -p "$TMP/m108"
gh release download m108-certified-predecessor-archive --repo "$REPO" --pattern "$ARCHIVE" --dir "$TMP/m108"
printf '%s  %s\n' '7be24ace31dccca32cdcd806d9e1c6f276b266a34b5d12aad0b4de6deefa5735' "$TMP/m108/$ARCHIVE" | shasum -a 256 -c -
gh repo clone "$REPO" "$TMP/predecessor" -- --quiet
git -C "$TMP/predecessor" checkout --quiet --detach 994e925898fa7de596050cd06ec68a5a94a7c92b
cd "$ROOT"
M145_PREDECESSOR_DIR="$TMP/predecessor" M108_BASELINE_ARCHIVE="$TMP/m108/$ARCHIVE" bash scripts/certify-m145-removal-local.sh
BASH
```

### Remaining certification boundaries

- This source-only checkpoint has **not** successfully completed the dependency-backed
  build or authenticated the original M108 ZIP inside ChatGPT's working environment.
- Existing historical M108 / app-specific scripts must be reconciled with M145
  through a **reviewed successor authorization** before making the broad
  `release:check` claim. A green targeted M145 verifier does **not** imply
  the full release pipeline passes.
- Production merge requires a protected QA PR, applicable current-core smoke
  evidence, artifact integrity, reviewer approval and post-merge Pages verification.
- Supabase tables, migrations, row data and Storage are expressly out of scope.

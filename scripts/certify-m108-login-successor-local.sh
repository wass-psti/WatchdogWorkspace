#!/usr/bin/env bash
set -Eeuo pipefail
IFS=$'\n\t'
umask 077
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
: "${M108_BASELINE_ARCHIVE:?M108_BASELINE_ARCHIVE must be an absolute path to the certified M108 ZIP}"
[[ "$M108_BASELINE_ARCHIVE" = /* ]] || { echo 'BASELINE ARCHIVE MUST BE ABSOLUTE'; exit 1; }
[[ "$(node --version)" == 'v22.16.0' ]]
[[ "$(npm --version)" == '10.9.2' ]]
command -v unzip >/dev/null
command -v shasum >/dev/null
[[ "$(shasum -a 256 "$M108_BASELINE_ARCHIVE" | awk '{print $1}')" == '7be24ace31dccca32cdcd806d9e1c6f276b266a34b5d12aad0b4de6deefa5735' ]]
BASE_NAME='Work-Management-App-v1.43.2-Stage-I-M108-Material-Tracker-Security-Corrective-Certified'
TMP="$(mktemp -d "${TMPDIR:-/tmp}/m108-certified-baseline.XXXXXXXX")"
trap 'rm -rf "$TMP"' EXIT
unzip -q "$M108_BASELINE_ARCHIVE" -d "$TMP"
BASE="$TMP/$BASE_NAME"
test -f "$BASE/scripts/certify-stage-i-m108-material-tracker-security-local.sh"
run() { printf '\n========== %s ==========\n' "$1"; shift; "$@"; }
# Authenticate the complete predecessor by its original controls, with no alterations.
run 'HISTORICAL BASELINE SOURCE GUARDS' bash -c 'cd "$1" && node scripts/verify-stage-i-m108-m107-source-guard.mjs && node scripts/verify-stage-i-m107-m106-source-guard.mjs' bash "$BASE"
run 'HISTORICAL M83 AUTHENTICATION PROTECTION' bash -c 'cd "$1" && node verify-stage-i-m83-authentication-account-surfaces.mjs' bash "$BASE"
# The five inherited M79–M83 npm source-guard scripts are executed unchanged
# on the immutable predecessor before their successor npm bindings delegate.
for guard in m79-m78 m80-m79 m81-m80 m82-m81 m83-m82 m84-m83 m98-m97; do
  run "HISTORICAL $guard SOURCE GUARD" bash -c 'cd "$1" && node "scripts/verify-stage-i-$2-source-guard.mjs"' bash "$BASE" "$guard"
done
cd "$ROOT"
run 'SUCCESSOR SOURCE GUARD' node scripts/verify-m108-login-successor.mjs
run 'M83 PINNED CORRECTIVE PROVENANCE' node --input-type=module -e 'import {approvedSuccessorAuth} from "./scripts/lib/m108-login-successor-auth-provenance.mjs"; if (!approvedSuccessorAuth(process.cwd())) process.exit(1); console.log("PASS: exact M108 corrective and verified historical archive")'
run 'M83 SUCCESSOR-AWARE SEMANTIC GATE' node verify-stage-i-m83-authentication-account-surfaces.mjs
run 'SUCCESSOR NEGATIVE CONTROLS' node scripts/test-m108-login-successor.mjs
for milestone in 79 80 81 82 83 84 88 89 98; do
  case "$milestone" in
    79) name='design-tokens-semantic-theme' ;;
    80) name='shared-primitive-component-layer' ;;
    81) name='application-shell-global-navigation' ;;
    82) name='layout-surface-responsive-composition' ;;
    83) name='authentication-account-surfaces' ;;
    84) name='boards-visual-migration' ;;
    88) name='users-roles-administration-surfaces' ;;
    89) name='settings-configuration-surfaces' ;;
    98) name='futuristic-minimalist-production-readiness-certification' ;;
  esac
  run "SUCCESSOR DETERMINISTIC M$milestone" node "scripts/verify-stage-i-m${milestone}-${name}-execution.mjs"
done
run 'SUPPLY CHAIN / INTEGRATION SOURCE CHECK' node scripts/verify-material-tracker-integration.mjs
run 'SECRET SCAN' node scripts/scan-secrets.mjs
run 'ROOT LOCKED DEPENDENCIES' npm ci
run 'ROOT AUDIT' npm audit --audit-level=high
run 'CORRECTIVE REGRESSION' node verify-m108-login-unsupported-module-corrective.mjs
run 'HISTORICAL AUTH REGRESSION' node verify-stage-g-m39-auth-session-access-context.mjs
run 'AUTH BACKEND CONTRACT' node verify-auth-backend.mjs
run 'AUTH EXECUTION VECTORS' node --experimental-strip-types --disable-warning=ExperimentalWarning scripts/verify-auth-session-access-context-execution.mjs
# The original M108 certifier also requires all nested Material Tracker gates.
run 'MATERIAL TRACKER LOCKED DEPENDENCIES' npm --prefix integrations/material-tracker ci --ignore-scripts
run 'MATERIAL TRACKER DEPENDENCY RESOLUTION' node --input-type=commonjs -e 'const {execFileSync}=require("node:child_process"); const t=JSON.parse(execFileSync("npm",["--prefix","integrations/material-tracker","ls","source-map-js","--all","--json"],{encoding:"utf8"})); const a=[]; function f(n){for(const [k,v] of Object.entries(n.dependencies||{})){if(k==="source-map-js")a.push(v.version);f(v)}} f(t); if(!a.length||a.some(x=>x!=="1.2.2"))process.exit(1);console.log("PASS source-map-js resolution",a)'
run 'MATERIAL TRACKER AUDIT' npm --prefix integrations/material-tracker audit
for command in check:integration check:static check:data-clean test:deterministic test:regression test:exports test:import-export check:package build; do
  run "MATERIAL TRACKER $command" npm --prefix integrations/material-tracker run "$command"
done
test -f integrations/material-tracker/dist/index.html
run 'ROOT DEPENDENCIES ENSURE' npm run dependencies:ensure
# Successor package.json routes material-tracker:source-guard to the pinned successor guard.
# Historic M108 and M107 guards above run only on the unchanged certified predecessor.
run 'MATERIAL TRACKER INTEGRATION' npm run material-tracker:integration:check
run 'TYPESCRIPT' npm run typecheck
run 'LINT' npm run lint
run 'PRODUCTION BUILD' npm run build
test -f apps/material-tracker/index.html
test -f dist/apps/material-tracker/index.html
run 'VITE VERIFICATION' npm run verify:vite
run 'DISTRIBUTION VERIFICATION' npm run verify:dist
run 'PREVIEW VERIFICATION' npm run verify:preview
run 'EMBEDDED RUNTIME' node verify-v1432-embedded-runtime-production.mjs
run 'ARCHITECTURE RUNTIME' node --experimental-strip-types --disable-warning=ExperimentalWarning verify-v1220-architecture-restructure.mjs
run 'RELEASE GATES' npm run release:check
run 'HISTORICAL REGRESSION GATES' npm run verify:historical-all
# Follow the pre-existing M108 post-build validations without changing their source.
rm -rf integrations/material-tracker/node_modules integrations/material-tracker/dist apps/material-tracker
run 'INTEGRATION SOURCE GUARD' node scripts/verify-material-tracker-integration.mjs
run 'POST-RELEASE SECRET SCAN' node scripts/scan-secrets.mjs
for script in \
 scripts/verify-stage-h-m60-color-theme-contrast-execution.mjs \
 scripts/verify-stage-h-m74-time-tracker-ui-harmonization-execution.mjs \
 scripts/verify-stage-h-m75-fueltrack-plus-ui-harmonization-execution.mjs \
 scripts/verify-stage-h-m76-tradelink-ui-harmonization-execution.mjs \
 verify-stage-e-m26-iframe-retirement.mjs \
 verify-stage-i-m83-authentication-account-surfaces.mjs \
 scripts/verify-stage-i-m78-visual-system-foundation-execution.mjs; do
  run "POST-RELEASE $script" node "$script"
done
run 'RUNTIME POST-RELEASE' node --experimental-strip-types --disable-warning=ExperimentalWarning verify-v1380-typescript-runtime.mjs
run 'ARCHITECTURE POST-RELEASE' node --experimental-strip-types --disable-warning=ExperimentalWarning verify-v1220-architecture-restructure.mjs
run 'FINAL SUCCESSOR SOURCE INTEGRITY' node scripts/verify-m108-login-successor.mjs
printf '\nPASS: M108 login successor LOCAL gates only. NOT CERTIFIED: hosted authentication and independent acceptance remain outstanding.\n'

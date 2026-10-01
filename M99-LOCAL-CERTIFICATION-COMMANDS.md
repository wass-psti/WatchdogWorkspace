# M99 Local Certification Commands — Candidate v6

Run the following from any starting directory after downloading Candidate v6 into `~/Downloads`:

```bash
set -euo pipefail

ZIP="$HOME/Downloads/Work-Management-App-v1.43.2-Stage-I-M99-Sidebar-Corrective-Candidate-v6.zip"
DIR="$HOME/Downloads/Work-Management-App-M99-Certification-v6"

test -f "$ZIP" || { echo "ERROR: Candidate v6 ZIP not found: $ZIP" >&2; exit 1; }
rm -rf "$DIR"
mkdir -p "$DIR"
ditto -x -k "$ZIP" "$DIR"
cd "$DIR"
printf 'Certification directory: %s\n' "$PWD"

test -f package.json
test -f package-lock.json
test -f scripts/certify-stage-i-m99-local.sh
test -f scripts/run-stage-i-m99-sidebar-browser.mjs
test -f scripts/verify-stage-i-m99-m98-source-guard.mjs
test -f regression-baseline/m99-m98-source-guard.json

chmod +x scripts/certify-stage-i-m99-local.sh
./scripts/certify-stage-i-m99-local.sh
```

The certification script remains fail-closed and may produce certified artifacts only after every required Stage 1–11 gate passes.

## Candidate v8 note

Stage 11 now re-materializes the governed isolated modern test toolchain after final lint/dependency restoration and before the final M99 Playwright rerun. Run the certification script only from the extracted Candidate v8 repository root.

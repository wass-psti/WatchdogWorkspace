# M93 Local Certification — Ready-to-Copy Sequence

Run from the extracted M93 continuation repository on macOS:

```bash
set -euo pipefail

nvm install 22.16.0
nvm use 22.16.0
node --version
npm --version

rm -rf node_modules dist coverage test-results playwright-report .wm-modern-test-toolchain
npm ci

npm run interaction-harmonization:source-guard
npm run interaction-harmonization:check
npm run interaction-harmonization:test
npm run interaction-harmonization:browser

npm run interaction-harmonization:certify
npm run interaction-harmonization:final-checkpoint
npm run interaction-harmonization:publish-certified

open "$HOME/Downloads"
```

The dedicated certifier executes the governed inherited accessibility/form/motion/primitive/shell/overlay/state checks, lint, typecheck, production build, performance bundle verification, M93 browser test and aggregate release gate. Publication is fail-closed behind post-certification, historical collect-all regression, package hygiene and final checkpoint verification and copies the certified ZIP/PASS/checksum into `~/Downloads`.

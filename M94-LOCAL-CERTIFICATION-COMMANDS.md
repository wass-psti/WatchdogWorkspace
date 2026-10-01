# M94 Local Certification Commands

```bash
set -euo pipefail
source "$HOME/.nvm/nvm.sh"
nvm install 22.16.0
nvm use 22.16.0
rm -rf node_modules dist coverage test-results playwright-report .wm-modern-test-toolchain
npm ci
npm run motion-architecture:source-guard
npm run motion-architecture:check
npm run motion-architecture:test
npm run motion-architecture:browser
npm run motion-architecture:certify
npm run motion-architecture:post-certification
node scripts/verify-all-historical-verifiers.mjs
npm run governance:secrets
npm run motion-architecture:package-hygiene
npm run motion-architecture:final-checkpoint
npm run motion-architecture:publish-certified
open "$HOME/Downloads"
```

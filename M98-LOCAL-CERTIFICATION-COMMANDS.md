# M98 Local Certification Commands

```bash
set -euo pipefail

ZIP="$HOME/Downloads/Work-Management-App-v1.43.2-Stage-I-M98-Implementation-Complete-Verification-Pending.zip"
WORK="$HOME/Movies/Work-Management-App-M98-Certification"

rm -rf "$WORK"
mkdir -p "$WORK"
ditto -x -k "$ZIP" "$WORK"
cd "$WORK"

npm run futuristic-readiness:local-certify
```

Success requires the terminal to reach:

`ALL REQUIRED M98 IMPLEMENTATION AND CERTIFICATION WORK PASSED`

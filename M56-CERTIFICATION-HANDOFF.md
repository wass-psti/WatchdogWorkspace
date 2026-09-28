# M56 Certification Handoff

M56 certification is fail-closed and must run against the exact continuation candidate.

`npm run ui-inventory:certify` performs clean dependency certification, M56 static/deterministic/browser/release verification, normalized source-tree drift detection, a staged `active-certified` transition, historical regression, secret/environment/symlink/checksum hygiene, certified ZIP/PASS creation, artifact verification, and atomic publication.

The working tree remains `implementation-complete-pending-certification`; only the staged payload becomes `active-certified` after every required gate passes.

Published artifacts:

- `m56-certified-artifacts-upload/Work-Management-App-v1.43.2-Stage-H-M56-Certified-Baseline.zip`
- `m56-certified-artifacts-upload/Work-Management-App-v1.43.2-Stage-H-M56-Certified-Baseline-PASS.txt`

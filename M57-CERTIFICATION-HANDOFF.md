# M57 Certification Handoff

M57 certification is fail-closed and must run against the exact continuation candidate.

`npm run design-foundations:certify` performs clean dependency certification, M57 static/deterministic/browser/release verification, normalized source-tree drift detection, a staged `active-certified` transition, historical regression, secret/environment/symlink/checksum hygiene, certified ZIP/PASS creation, artifact verification, and atomic publication.

The working tree remains `implementation-complete-pending-certification`; only the staged payload becomes `active-certified` after every required gate passes.

Published artifacts:

- `m57-certified-artifacts-upload/Work-Management-App-v1.43.2-Stage-H-M57-Certified-Baseline.zip`
- `m57-certified-artifacts-upload/Work-Management-App-v1.43.2-Stage-H-M57-Certified-Baseline-PASS.txt`

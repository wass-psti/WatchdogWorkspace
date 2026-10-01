# M98 Certification Handoff

Authoritative input: `Work-Management-App-v1.43.2-Stage-I-M97-Certified-Baseline.zip`.

Run `npm run futuristic-readiness:local-certify` only under Node `v22.16.0` and npm `10.9.2`.

The pipeline is fail-closed and ordered:
environment preparation → workspace/repository validation → dependency installation/integrity → static verification → deterministic tests → browser/E2E → dedicated certification → post-certification validation → historical regression + aggregate release gate → checksum/package hygiene → final checkpoint → certified publication and Downloads handoff.

Until that completes successfully, M98 remains `IMPLEMENTATION COMPLETE — LOCAL VERIFICATION/CERTIFICATION REMAINS`.

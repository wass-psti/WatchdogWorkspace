# M23 activation runbook

1. Start from the certified M22 baseline.
2. Run `bash scripts/certify-stage-e-m23.sh --toolchain-check`.
3. Run `bash scripts/certify-stage-e-m23.sh`.
4. Certification must end with M23 `active-certified`, Architecture 31, and Stage E platform certification PASS.
5. Freeze the resulting source tree as the M23 certified baseline before beginning the next Stage E milestone.

No Supabase migration is required for M23.

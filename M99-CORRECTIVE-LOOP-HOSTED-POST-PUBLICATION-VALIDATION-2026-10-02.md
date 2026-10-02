# M99 hosted post-publication validation corrective — 2026-10-02

## Origin
The M99 certified commit `5e7a0c52986a274d6ca0d1e7c125daa1c0ae3d05` published successfully, but hosted validation exposed three independent issues: M43's first browser scenario exhausted the 20-second test budget while waiting for the M39 identity boundary, the Supabase Preview integration reported remote migration versions missing from `supabase/migrations`, and three long-running regression workflows reached their configured job time limits.

## Corrective delta
- M43 Settings E2E now retains the same identity assertions while using a 30-second identity-boundary budget and 60-second per-test budget for hosted cold starts.
- Work Management CI, M48, and M50 hosted time budgets are raised to 75/90/90 minutes respectively; no verification steps are removed or skipped.
- Exact timestamped migration files are restored for Work Management-owned applied versions M46, M47, M50, M39, and M54.
- Shared FuelTrans/FRT migration versions are represented as explicit no-op ledger mirrors. They preserve production history visibility without replaying schema owned by another application.
- A fail-closed M99 hosted corrective verifier protects all of these contracts.

## Exit criterion
The corrective loop exits only after local Stage 1–11 certification passes and the successor commit is published with required GitHub Actions and Supabase Preview checks green (or a separately documented external-provider exception if a provider check remains outside repository control).

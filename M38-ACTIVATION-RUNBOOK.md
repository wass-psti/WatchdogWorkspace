# M38 Activation Runbook

Use Node v22.16.0 / npm 10.9.2. M37 must be active-certified.

Required certification gates: source checksum, npm ci, dependency preflight, backend-preflight config/check/test/browser, historical verifiers, release gate, M38 activation/status.

Production runtime requires explicit `VITE_RUNTIME_ENV=production`, `VITE_SUPABASE_URL`, and `VITE_SUPABASE_PUBLISHABLE_KEY`. Apply `supabase/migrations/v1.43.2-stage-g-m38-runtime-capability-preflight.sql` to the target Supabase project before expecting dependent modules to pass live preflight.

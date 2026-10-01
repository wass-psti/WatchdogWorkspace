# M99 Corrective Loop — Auth Fixture Runtime Binding

State: IMPLEMENTATION COMPLETE — LOCAL VERIFICATION/CERTIFICATION REMAINS

The M99 v4 browser gate reached the managed Vite server but timed out at `waitForM39Identity` with `identity-not-hydrated`. The M99 browser runner started Vite without the deterministic Supabase fixture runtime variables used by the canonical M39/M52/M53 browser harnesses, so the page runtime was not bound to `https://m39-fixture.supabase.co` even though the Playwright route fixture intercepted that origin.

Corrective delta:
- Preserve the managed Vite lifecycle and strict-port/readiness behavior.
- Start Vite with `VITE_RUNTIME_ENV=ci`.
- Start Vite with `VITE_SUPABASE_URL=https://m39-fixture.supabase.co`.
- Start Vite with a deterministic public fixture key `VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_m99_sidebar_fixture`.
- Extend the M99 static verifier to enforce these bindings.

No authentication readiness assertion is weakened or bypassed. `waitForM39Identity` remains the authoritative browser gate.

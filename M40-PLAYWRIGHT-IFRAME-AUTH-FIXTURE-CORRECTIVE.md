# M40 Playwright Iframe Auth-Fixture Corrective

## Observed failure

The M40 real-browser route-cycle scenario reached `#/app/time-tracker` with the lifecycle committed to the authentication owner and runtime context `authenticated=false`, even though the route had already been authenticated earlier in the same test.

## Root cause

`seedM39Session()` uses Playwright `page.addInitScript()`. That script executes again when same-origin embedded application iframes are created. The fixture previously wrote `wm.platform.auth.session.v1` from every frame. Each iframe execution generated a fresh `expires_at` using `Date.now()`, mutating origin-shared `localStorage`. The top-level Work Management document then received the real storage event and correctly invoked `auth.init({ forceStorage:true })`. The certification fixture was therefore forcing its own authenticated application route into the boot/auth presentation while the module iframe was being mounted.

## Correction

- The auth seed init script now returns immediately when `window.top !== window`.
- Platform auth seeding is therefore top-level-only; embedded modules continue to receive identity exclusively through the governed postMessage/module-host bridge.
- The M40 repeated application-route browser scenario snapshots the restored platform session and asserts that TimeTracker and TradeLink navigation cannot rewrite it.
- The M40 static verifier requires both the top-level fixture guard and the embedded-route session-invariance assertion.

This corrective changes test-fixture isolation only. It does not weaken M39 authentication policy, M40 ownership policy, module authorization, or production persistence behavior.

## Cross-fixture hardening

The same top-level-only session-seeding guard is applied to the older M37 Supabase browser fixture. This removes the same iframe/session-reseed failure mechanism from both authenticated browser harnesses instead of leaving a latent duplicate path.

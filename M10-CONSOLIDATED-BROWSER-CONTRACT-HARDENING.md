# Stage C M10 Dev Browser Ownership Verifier Synchronization Hotfix

## Scope

This hotfix corrects the M10 dev/preview browser smoke verifier. It does not change React shell runtime behavior.

## Root cause

`verify-vite-server.mjs` previously counted M10 ownership attributes with raw string matches over Chromium `--dump-dom` output. In Vite development mode, CSS is injected into `<style>` elements. The shell CSS contains repeated attribute selectors such as `[data-wm-legacy-runtime-host]`, so raw text counting reported multiple legacy hosts even though the live document contains one host element.

## Correction

The verifier now counts serialized opening HTML elements that actually carry each ownership attribute:

- `data-wm-react-shell-root`
- `data-wm-legacy-runtime-host`
- `data-wm-react-shell-layout`

CSS selector text and other non-element occurrences are ignored.

The M10 milestone verifier also guards against regression to raw text counting.

## Runtime impact

None. No shell markup, routing, state ownership, authentication, Supabase, TanStack Query, Zustand, Boards, TimeTracker, FuelTrack+, or TradeLink behavior changed.


## Follow-up hardening: standalone-login ownership assertions

The first synchronization corrected element counts for the React shell root, layout boundary, and legacy route-content host. Certification then exposed the same raw-serialized-DOM anti-pattern in the standalone-login assertions. Vite development mode injects CSS/source text into the dumped DOM, so an attribute name appearing in style/source text cannot be treated as proof that a live element owns that attribute.

The verifier now uses one element-aware attribute matcher for the complete M10 ownership contract:

- `data-wm-react-shell-root` — exactly one live element
- `data-wm-legacy-runtime-host` — exactly one live element
- `data-wm-react-shell-layout` — exactly one live element
- `data-workspace-shell` — zero live elements on `/#/login`
- `data-wm-react-shell-mode="standalone"` — exactly one live element
- `data-wm-composition-owner="legacy-runtime-route-content"` — exactly one live element

`verify-stage-c-m10-react-shell.mjs` now rejects regression to raw serialized-DOM scans for any of these M10 ownership assertions. This is verifier synchronization only; no React shell runtime behavior or application feature logic is changed.


## Certification strategy

This candidate deliberately consolidates the complete M10 browser ownership contract before another external certification attempt. The dev and preview smoke tests share `scripts/verify-vite-server.mjs`, so the same element-aware assertions cover both server modes. The candidate must not be promoted to `active-certified` unless the complete Stage C certification workflow reaches the final release gate successfully.

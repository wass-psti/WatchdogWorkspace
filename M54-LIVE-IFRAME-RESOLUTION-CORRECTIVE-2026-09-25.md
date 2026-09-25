# M54 Live Iframe Resolution Corrective — 2026-09-25

## Originating hosted failure

GitHub Actions run `36073960901` passed clean hosted certification, Database/RLS, authenticated pre-deployment E2E, production build, and GitHub Pages deployment. `post-deploy-certify` failed in `functional-production-readiness-live.spec.mjs` because the harness searched `page.frames()` for a child-frame URL containing `/apps/${moduleId}/` and received no match.

## Root cause

The application already exposes one authoritative embedded-module iframe as `#moduleFrame`. URL-text matching is not the ownership contract and can vary with document replacement, relative URL normalization, or runtime wrapper entry points. The live certification harness therefore used a brittle discovery mechanism even though the correct DOM authority was already present and visible.

## Corrective

Candidate 11 resolves the visible `#moduleFrame` locator to its element handle, obtains the associated Playwright `Frame` through `contentFrame()`, and performs the existing `WM_IDENTITY_CONTEXT` / `WM_MODULE_ACCESS` assertions in that exact frame. Static M54 governance rejects future `page.frames().find(...)` discovery and requires the DOM-backed resolution contract.

## Boundary

No production application code, Supabase schema, RLS, authentication, routing, module identity semantics, or embedded application behavior is changed. This is a certification-harness synchronization correction only.

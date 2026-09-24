# M54 Live Embedded Identity Boundary Corrective — 2026-09-24

## Originating failure
GitHub Actions run `36014341214`, job `post-deploy-certify`, failed after successful login, host management traversal, production build, GitHub Pages deployment, and backend parity corrections.

## Exact failed condition
The live Playwright spec asserted `context.identity.module.enabled` on `WorkManagementRuntime.getContext()`. The host runtime context contract only carries host route state such as `route`, `moduleId`, `boardId`, and `authenticated`; embedded module identity is intentionally published across the same-origin iframe boundary as `wm:identity-context`.

## Corrective
The M54 live spec now keeps the host assertion for `moduleId`/`authenticated`, locates the active module iframe, waits for the existing `WM_IDENTITY_CONTEXT` and `WM_MODULE_ACCESS` bridge globals, and validates `accountStatus`, module `enabled`, role, and derived `allowed` at the authoritative embedded-module boundary.

## Governance
`verify-stage-g-m54-functional-production-readiness-certification.mjs` now requires the live spec to consume `WM_IDENTITY_CONTEXT` and `WM_MODULE_ACCESS` and rejects the stale host-context module-identity assertion.

## Classification
Certification harness synchronization defect only. No production application, RBAC, Supabase schema, module authorization, or runtime host behavior was changed.

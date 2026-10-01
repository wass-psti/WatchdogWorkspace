# M97 — Workspace-Wide Visual Regression & Functional Preservation

M97 is a certification/proof milestone over the M96 certified visual system. It does not authorize product, domain, backend, schema, migration, persistence, authentication, authorization, routing, or visual-feature changes.

## Proof model

1. **Source-state preservation** — the M97→M96 guard permits only package-script wiring, M96 predecessor-guard successor delegation, and new M97 governance/test/certification files. Application/runtime source is immutable inside the M97 implementation delta.
2. **Cross-browser matrix** — Chromium, Firefox, and WebKit exercise four viewport classes: 390×844, 768×1024, 1366×768, and 1440×900.
3. **Workspace visual contracts** — Account, Settings, Users, Boards, TimeTracker, FuelTrack+, and TradeLink are checked for authenticated availability, viewport containment, embedded-frame containment, identity continuity, and page-error freedom.
4. **Screenshot evidence** — every browser × viewport × workspace surface combination emits a full-page screenshot. 84 screenshots are hashed into `m97-browser-evidence/M97-SCREENSHOT-MANIFEST.json`.
5. **Functional preservation** — existing functional-regression, cross-module RBAC, and TimeTracker/FuelTrack+/TradeLink stabilization verifiers remain mandatory.
6. **Historical preservation** — all historical verifiers plus the aggregate release gate must pass before publication.

Cross-engine screenshots are evidence, not pixel-identical golden files. Browser rasterization, font hinting, and platform graphics can differ without semantic visual regression. Deterministic contracts therefore assert geometry, containment, route/module identity, accessibility-relevant availability, and application behavior while retaining screenshots for audit and human comparison.

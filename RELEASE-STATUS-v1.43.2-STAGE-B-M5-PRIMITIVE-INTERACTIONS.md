# Work Management App v1.43.2 — Stage B Milestone 5 Primitive Interaction Architecture

## Status

**SOURCE IMPLEMENTATION COMPLETE — DIRECT RUNTIME ACTIVATION REQUIRES M4 `active-certified`.**

This corrective M5 package is rebased on the full M4 corrective/vendor-declaration baseline. It preserves repository-governance recovery, deployment/security/lint gates, strict Work Management TypeScript, and the M4 third-party declaration boundary.

## Implemented workstreams

- Governed M5 target/state contract.
- Work Management-owned Button/IconButton, Dialog, Menu, Popover, Tooltip, Tabs, Checkbox, Switch and Collapsible wrappers.
- Geometry-only Floating UI adapter.
- Work Management-owned Lucide icon-name boundary.
- M4-token-based interaction styling and reduced-motion handling.
- Direct-import leak prevention for Ark/Floating/Lucide.
- Compiler staging before direct dependency installation.
- M4-transitive-Ark-safe dependency ownership detection.
- Transactional activation and truthful post-install certification state.
- CI, GitHub Pages deployment, `check`, `release:check`, and aggregate-verifier integration.
- M5 status and activation runbook.

## Corrected M4 integration

The earlier M5 continuation assumed that no Ark package entry could exist before M5 activation. That assumption is invalid after M4 installs Chakra because Ark can be present transitively. M5 now treats only `package.json` and the root `package-lock.json` dependency map as proof of direct M5 dependency ownership while blocked.

M5 also inherits `skipLibCheck: true` from the M4 vendor-type correction while retaining strict checking for every Work Management source file and every use of public third-party APIs.

## Current compatibility boundary

Until M5 becomes active:

```text
React 19.2
    ↓
M4 WorkManagementDesignSystemProvider (after M4 certification)
    ↓
LegacyApplicationBoundary
    ↓
existing Work Management runtime
```

M5 interaction CSS is loaded but inert while no M5 React primitives are mounted. Existing legacy shell/Boards interaction utilities remain authoritative for legacy screens.

## Remaining certification work

1. M4 must first reach `active-certified`.
2. Install exact direct M5 packages through `npm run interactions:activate`.
3. Type-check Work Management wrappers against the actual Ark/Floating/Lucide public APIs.
4. Resolve any public-API incompatibility found on the real installed graph.
5. Promote the Work Management interaction/icon exports.
6. Run dependency audit and full release gate.
7. Build and verify production `dist`.
8. Run preview/browser interaction and accessibility regression.
9. Promote M5 to `active-certified`.

## Known risks / technical debt

- Direct M5 packages have not been install-certified inside the OpenAI execution container because registry DNS remains unavailable there.
- Real-browser interaction behavior for mounted M5 primitives remains part of post-install release certification.
- Legacy interaction systems coexist temporarily and must be retired screen-by-screen in later React migration milestones.
- React Strict Mode remains deferred while the legacy singleton runtime lacks a complete disposable lifecycle.
- M5 does not migrate existing feature screens; it only establishes the target interaction architecture.

No legacy feature behavior is intentionally changed by the staged M5 package.

## Cross-milestone governance recovery hotfix

The M5 corrective baseline now fixes a cross-milestone recovery defect discovered during M4 release certification. `governance:restore` reconstructs only missing hidden governance artifacts and preserves existing live workflows. The M4 corrective verifier validates its required governance contracts rather than requiring byte-for-byte workflow identity, so later milestones may add gates such as `interactions:check` without invalidating M4. Recovery templates are synchronized to the current M5 workflow set.

## Corrected M4 production-dist prerequisite

M5 now inherits the M4 production CSP serialization compatibility gate (`csp-dist:check`). This is required before M5 interaction activation/certification so a later milestone cannot bypass the corrected M4 production artifact security contract.

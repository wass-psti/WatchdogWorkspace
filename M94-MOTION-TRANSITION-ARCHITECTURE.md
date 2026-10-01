# M94 — Motion & Transition Architecture

## Scope
Controlled motion orchestration; bounded route/state transitions; reduced-motion paths; interaction feedback; cancellation; and persistent-shell stability.

## Architectural rules
- M71 remains the continuity taxonomy authority.
- M81 remains shell/navigation behavior authority.
- M91 remains overlay lifecycle authority.
- M93 remains interaction-state authority.
- Persistent shell transforms and geometry animation are forbidden.
- Route transitions target replaceable content only and use non-spatial opacity choreography.
- Reduced motion disables spatial/decorative motion and minimizes transition latency.
- No backend, schema, RBAC, persistence, or deployment semantic changes are introduced.

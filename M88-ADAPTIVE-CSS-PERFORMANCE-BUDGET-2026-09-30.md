# M88 Adaptive CSS Performance Budget Governance

## Trigger
The complete dependency-backed M88 corrective-v2 production build emitted `initialCssRawBytes = 612320`, exceeding the M84 successor ceiling of `612000` by 320 bytes after M88-specific CSS had already been consolidated from 6892 source bytes to 2887 source bytes.

## Root cause and measured evidence
M84 explicitly defines its `612000` ceiling as historical successor provenance rather than a permanent limit. M88 adds a required Users / global-role / administration presentation authority while preserving M42/M44 authorization semantics and application-scoped role separation. After removal of duplicated predecessor declarations, the measured 612320-byte production CSS is attributable to the retained M88 presentation boundary rather than unexplained CSS expansion.

## Governed successor decision
M88 successor CSS ceiling: `613000`

The 613000-byte ceiling provides 680 bytes of deterministic headroom above the measured 612320-byte M88 corrective-v2 production build. This is a narrow milestone-governed successor threshold, not a permanent global maximum. Historical M31/M79/M82/M83/M84 ceilings remain provenance and are not rewritten. Future milestones must continue the same measured successor-governance model when legitimate required presentation growth is demonstrated.

## Invariants
- The M31 production performance gate remains fail-closed; no bypass is introduced.
- Required M88 Users / roles / administration styling must not be deleted or semantically compromised solely to satisfy the historical M84 ceiling.
- M42/M44 global RBAC behavior, Supabase schema/migrations, protected RPCs, and application-scoped role authorities remain unchanged.
- All non-CSS performance budgets remain unchanged.
- A clean production build remains the authoritative measurement and must pass `performance:bundle` under the M88 successor ceiling.
- This governance update does not certify M88; the complete ordered certification pipeline must pass before publication.

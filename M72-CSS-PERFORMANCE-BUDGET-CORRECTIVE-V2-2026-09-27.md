# M72 CSS Performance Budget Corrective v2 — 2026-09-27

## Originating gate
`npm run performance:bundle` in the corrective-v4 local certification run.

## Failed condition
The v4 production build emitted `initialCssRawBytes=590513`, which exceeded the unchanged M31 limit of `590000` bytes by 513 bytes.

## Root cause
The remaining M72 host bridge still duplicated presentation already owned by certified shared authorities: command-input normalization by the legacy host presentation, toast/forced-colors behavior by M67 feedback primitives, and reduced-motion interaction behavior by the shared interaction/motion system.

## Corrective change
M72 now retains only the non-redundant update-banner grid bridge and its mobile collapse. Accessibility and motion fallbacks are inherited from their certified owners instead of duplicated. The M72 deterministic source-size ceiling is tightened from 1200 to 400 bytes.

## Invariants
- The M31 production CSS ceiling remains 590000 bytes.
- No Board, routing, auth, persistence, RBAC, module, or backend behavior changes.
- Shared primitive ownership is strengthened rather than bypassed.
- Full local certification must restart because repository source changed.

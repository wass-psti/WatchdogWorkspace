# Futuristic Minimalist Migration Boundaries — M78

M78 starts the Workspace-wide Futuristic Minimalist migration from the certified M77 baseline. It establishes ownership and regression boundaries only. It does **not** intentionally change production visual output, runtime behavior, routing, authentication, authorization/RBAC, persistence, Supabase contracts, module workflows, responsive behavior, accessibility semantics, or motion behavior.

## Immutable provenance root

The program is rooted in the M77 certified source identity:

- Certified source SHA-256: `4a07b2a7dbc876159858b208bd366e38115030702434fcde501f35c2bd6cd5b9`
- Published Git commit: `a0fc170a518582acb5ad8a86fe73e2a12174b207`
- Original certified ZIP SHA-256: `128cd1ed483e1839186b2beaa8d7737bcbd7ac788ac9628c71c674fbbf941099`

A repackaged continuation ZIP may have a different container checksum while still restoring the same certified M77 source identity. M78 therefore binds continuation provenance to the certified source digest and published commit, not to ZIP byte identity alone.

## M78 mutation boundary

M78 may add or update only governance, inventory, verification, package-script wiring, continuation-state documentation, and checkpoint metadata required to establish the new migration program. Production presentation/runtime roots are hash-frozen to their M77 contents for this milestone.

Protected presentation roots:

- `src/design-system`
- `src/app`
- `src/features`
- `assets/css`
- `assets/js/features`
- `assets/js/platform/ui`
- `assets/js/runtime`
- `apps/time-tracker`
- `apps/fueltrack-plus`
- `apps/tradelink`

## Successor mutation ownership

M79-M96 may mutate only the presentation domains assigned to them by `config/futuristic-minimalist-presentation-ownership.ts`, while preserving the protected behavior contracts listed there. M97 owns Workspace-wide visual/functional regression. M98 owns final production certification.

A successor milestone must not use its visual scope to modify business logic, route ownership, authentication/session semantics, authorization policy, persistence behavior, database schema, backend contracts, or module-specific workflow rules unless a separately declared non-visual requirement explicitly authorizes that work.

## Compatibility and retirement rule

Existing M56-M77 compatibility paths remain live authorities until a successor milestone proves replacement. No path is safe to delete merely because a newer shared primitive exists. Retirement requires explicit replacement ownership, zero-consumer evidence, browser/E2E coverage, accessibility/responsive validation, historical regression, build/package verification, and checkpoint integrity.

## No-visual-drift rule

M78 itself must produce no intentional visual drift. The M78 deterministic verifier compares every file under the protected presentation roots with the M77 presentation manifest. Added, removed, renamed, mode-changed, or byte-changed protected files fail the milestone.

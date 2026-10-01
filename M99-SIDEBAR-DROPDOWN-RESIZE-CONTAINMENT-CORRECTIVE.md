# M99 — Sidebar Dropdown and Resize Containment Corrective

## Authorized scope

This corrective checkpoint is limited to the Work Management host sidebar/navigation system.

1. Restore reliable Favorites / Applications / Boards section dropdown persistence.
2. Prevent navigation text, empty-state copy, labels, footer copy, or other internal sidebar content from leaking outside the visible sidebar content boundary during resize, compact/expanded transitions, or intermediate presentation states.
3. Preserve existing routing, authentication, RBAC, module runtime, and application/session semantics.

## Implementation

- Added `syncReactShellNavigationMarkup()` so persisted shell-section state is also reflected in the React-owned navigation markup before a later React shell render can replay stale section HTML.
- Section toggles continue to update `aria-expanded`, section classes, the `hidden` state, and local persistence.
- Changed the navigation scroll region and navigation container to clip horizontal overflow.
- Added explicit `min-width: 0`, `max-width: 100%`, and horizontal clipping contracts to text-bearing sidebar content containers while leaving structural edge controls (collapse, pin, resizer) outside the clipping boundary.
- Added explicit brand-copy and footer clipping.
- Added targeted M99 browser regression coverage for dropdown persistence and minimum-width resize containment.
- Added a deterministic static M99 verifier and registered it in `verify:ui`.

## Non-goals

No module feature logic, backend contracts, authentication/session behavior, RBAC policy, database schema, or deployment configuration was changed.

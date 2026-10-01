# M93 — Accessibility & Interaction-State Harmonization

## Scope

M93 is a presentation/interaction successor layer over the M92 certified baseline. It harmonizes focus-visible, hover, active, disabled, validation, keyboard, contrast, forced-colors and reduced-motion states while preserving established component and runtime ownership.

## Root cause

Interaction-state presentation was distributed across the M63 accessibility foundation, M65 form validation, M71 motion continuity, M80 shared primitives, M81 shell navigation, M91 overlays/feedback and M92 lifecycle-state system. Each authority was valid independently, but no Stage I successor explicitly guaranteed cross-surface state parity and no-regression rules after the M83–M92 visual migrations.

## Corrective architecture

M93 introduces a small typed contract and a final-loaded successor stylesheet. The stylesheet has no default resting-state redesign: only state-qualified selectors and semantic aliases are added. Native keyboard semantics are not replaced, positive `tabindex` is not introduced, overlay escape/focus ownership is not modified, and disabled controls cannot receive press transforms.

## Accessibility invariants

- Keyboard focus remains visible through `:focus-visible`.
- Pointer focus does not force a focus ring.
- Hover is limited to hover-capable fine pointers for the M93 opt-in state.
- Disabled state suppresses press transforms.
- Validation retains `aria-invalid` as the semantic authority and adds a non-color-only inset indicator.
- Forced-colors uses system `Highlight`, `Mark`, `GrayText` colors.
- Reduced-motion removes interaction transforms and decorative animation while retaining perceivable state changes.
- No layout, typography, data, backend, persistence, RBAC, authentication, or workflow semantics are changed.

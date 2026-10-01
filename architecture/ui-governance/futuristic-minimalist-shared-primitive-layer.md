# M80 — Futuristic Minimalist Shared Primitive Component Layer

M80 establishes one public component boundary for reusable controls and surfaces without rewriting module consumers. It composes the certified Stage H M64–M67 component, form, overlay and feedback authorities and the certified M79 token/theme system.

## Canonical primitives

- Actions: Button, IconButton.
- Fields: Input, Textarea, native Selector, SearchInput.
- Filtering: FilterBar, FilterChip.
- Identity: Badge, Icon.
- Feedback: Alert.
- Controls: Checkbox, Switch, SegmentedControl.
- Floating surfaces: Tooltip, Menu, Popover.
- Surfaces: Card.

## Accessibility contract

Native elements remain first choice. Icon-only actions require accessible names. Search and filter regions are named. Selector semantics remain native. Filter state and segmented selection use `aria-pressed`. Segmented controls support arrow, Home and End focus movement. Existing M63 focus/reduced-motion rules remain authoritative. M80 introduces no positive `tabindex`, no custom pseudo-control in place of native form semantics, and no live-region behavior unless the caller explicitly requests an announcement through the certified feedback authority.

## Interaction-state contract

The layer preserves the certified states `default`, `hover`, `focus-visible`, `active`, `selected`, `disabled`, `busy`, and `invalid`. Presentation remains token-driven through M79 and existing foundation CSS. M80 deliberately introduces no new global CSS payload; this protects the certified M31 initial-CSS ceiling while M81+ consumer migrations decide where legacy presentation can be retired.

## Ownership boundary

M80 owns the shared primitive API and component composition only. It does not own business rules, data fetching, persistence, RBAC, authentication, routing, database schema, migrations, or module-specific visual migration. Shell and module consumer migration remain successor milestones.

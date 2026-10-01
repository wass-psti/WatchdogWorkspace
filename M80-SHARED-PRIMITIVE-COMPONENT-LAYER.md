# M80 — Shared Primitive Component Layer

M80 consolidates reusable Futuristic Minimalist primitives behind `src/design-system/shared-primitives/index.ts` while preserving certified Stage H semantics and M79 tokens.

Scope: buttons, inputs, selectors, search, filters, badges, icons, alerts, controls, tooltips, menus, popovers and cards, including accessibility and interaction-state contracts.

Implementation is additive. Existing certified primitives are re-exported rather than forked; only missing shared compositions are added. No consumer migration, backend, schema, migration, persistence, route, authentication or authorization behavior is changed by M80.

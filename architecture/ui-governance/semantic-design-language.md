# M57 — Semantic Design Language

M57 defines the product-wide vocabulary used to describe visual and interaction intent. It is a semantic governance layer above the existing M56 UI ownership map and below later token, typography, theme, layout, component, and module-migration milestones.

## Governing principle

**Meaning precedes styling.** A semantic role describes why an element or region needs emphasis, grouping, density, elevation, or interaction priority. It does not prescribe a concrete color, size, spacing value, shadow, breakpoint, or component implementation.

## Core principles

1. **Clarity first** — operational comprehension has priority over decoration.
2. **Hierarchy by purpose** — prominence follows task/content priority, not arbitrary styling.
3. **Consistent meaning** — semantic roles retain meaning across host and module boundaries unless a documented workflow exception requires otherwise.
4. **Density with intent** — comfortable, compact, and dense modes express workflow needs rather than page-local preference.
5. **Progressive disclosure** — secondary detail and infrequent actions remain subordinate to the current task.
6. **Accessible by default** — meaning must not depend on color, motion, pointer precision, or position alone.
7. **Continuity over spectacle** — motion reinforces state but never becomes the only state signal.
8. **Restrained brand expression** — brand supports recognition without reducing legibility or operational efficiency.

## Semantic vocabulary

### Hierarchy
- `primary` — current task, page identity, or dominant decision.
- `secondary` — supporting task group or major subsection.
- `tertiary` — local structure or subordinate action.
- `supporting` — helper, explanatory, contextual, or metadata content.

### Content priority
- `critical` — blocking, destructive, security, authorization, or irreversible information.
- `primary` — information required to understand or complete the current task.
- `secondary` — useful supporting information that does not block the primary task.
- `metadata` — timestamps, identifiers, provenance, and auxiliary context.

### Interaction priority
- `primary`, `secondary`, `tertiary`, `destructive`, `quiet`.

Only one primary action should normally dominate a bounded task region. Destructive semantics are never communicated by color alone.

### Surface roles
- `canvas` — application/module background plane.
- `base` — normal content surface.
- `raised` — elevated content or interaction surface.
- `overlay` — transient surface above the active hierarchy.
- `inset` — subordinate region contained within another surface.

### Density intent
- `comfortable` — general-purpose reading and mixed interaction.
- `compact` — frequent operational work with higher scan efficiency.
- `dense` — high-volume data surfaces only where workflow and input modality justify it.

### Spatial intent
- `cluster`, `section`, `separation`, `containment`.

### Emphasis
- `default`, `subtle`, `strong`, `critical`.

### Alignment intent
- `start`, `center`, `end`, `baseline`, `numeric-end`.

## Brand-expression rules

- Accent is used for recognition, active state, or deliberate emphasis—not decoration.
- Module identity remains legitimate when it does not conflict with shared semantic meaning or accessibility.
- Gradients, translucency, elevation, and motion remain subordinate to content clarity.

## Successor ownership

M57 does **not** concretize the vocabulary into new values. Mapping is assigned as follows:

- M58 — token architecture
- M59 — typography/content hierarchy implementation
- M60 — color/theme/contrast implementation
- M61 — layout/grid/spatial implementation
- M62 — responsive/adaptive implementation
- M63 — accessibility interaction semantics
- M64+ — component and feature adoption

## Protected boundaries

M57 does not change concrete token values, theme palettes, typography scales, breakpoints, layout geometry, component APIs, routing, authentication/session behavior, authorization/RBAC, persistence, backend/API contracts, Supabase schema/migrations, or module business workflows.

M57 does not authorize deletion of any M56 compatibility authority. Retirement remains governed by the M56 migration register and successor verification evidence.

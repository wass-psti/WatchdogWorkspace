# M57 — Design Foundations & Semantic Design Language

## Scope

M57 establishes the product-wide semantic vocabulary for hierarchy, content priority, interaction priority, surface purpose, density intent, spatial intent, emphasis, alignment, and restrained brand expression.

## Implementation

- `config/semantic-design-language.ts` — normative machine-readable governance contract.
- `src/design-system/semantic-language.ts` — product-facing semantic vocabulary and types.
- `architecture/ui-governance/semantic-design-language.md` — human-readable design-language standard.
- `regression-baseline/m57-semantic-design-language.json` — deterministic vocabulary snapshot.
- M57 static/deterministic/release/certification verification assets.

## Architectural boundary

M57 defines **meaning**, not concrete presentation values. It does not modify existing token values, breakpoints, theme palettes, typography scales, layout geometry, component behavior, routing, authentication/session behavior, authorization/RBAC, persistence, backend/API contracts, schema/migrations, or module workflows.

Concrete mapping is intentionally deferred to M58-M64 and subsequent adoption milestones.

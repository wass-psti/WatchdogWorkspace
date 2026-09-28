# M58 Design Token Architecture

M58 consolidates token **architecture**, not visual style. The certified M57 values remain the visual authority while token ownership is made explicit and machine-verifiable.

## Tier model

1. **Primitive** — raw product scales and technical constants from `tokens.css` (spacing, type scales, radii, borders, shadows, motion, breakpoints, z-index).
2. **Semantic** — purpose-based roles. Theme-aware color roles continue in `themes.css`; new non-color aliases live in `token-architecture.css` and resolve only through certified primitives.
3. **Component** — bounded component/product-area namespaces. Existing `--wm-shell-*` and `--wm-board-*` tokens remain component-tier contracts.
4. **Compatibility** — historically stable global aliases retained until deterministic zero-consumer evidence permits retirement.

## Non-destructive migration rule

M58 does not rewrite existing consumers. New semantic aliases are loaded after `themes.css` and before primitives/components, but no existing selector consumes them yet. Therefore M58 introduces no intentional visual-value change. Compatibility tokens remain valid and may not be removed merely because a canonical semantic alias exists.

## Dependency direction

`primitive/theme values → semantic roles → component tokens → component styles`

A component token may reference primitive or semantic roles. A semantic alias must not reference a component namespace. New hard-coded product values must not be introduced in the alias layer.

## Successor ownership

- **M59** owns typography hierarchy/scale normalization.
- **M60** owns color/theme/contrast changes.
- **M61** owns layout/grid/spatial mapping.
- **M62** owns responsive/breakpoint behavior.
- **M63** owns accessibility-system expansion.
- **M64** owns component-system consolidation and component-token adoption.
- **M71** owns motion choreography changes.

M58 provides the governed token model those milestones must consume; it does not pre-empt their visual decisions.

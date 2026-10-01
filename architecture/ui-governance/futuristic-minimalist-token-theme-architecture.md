# M79 Futuristic Minimalist Token & Semantic Theme Architecture

M79 converts the certified M78 visual-system foundation into a centralized Futuristic Minimalist token authority. It changes the shared token/theme layer only; feature workflows and module-specific component migrations remain successor-owned.

## Authority chain

`primitive palette/scales -> semantic theme roles -> semantic aliases -> component tokens -> consumers`

- `tokens.css` owns raw palette values and non-theme primitive scales.
- `themes.css` owns theme-aware product roles and must resolve global `--wm-color-*` roles through primitive palette variables.
- `token-architecture.css` owns purpose-based aliases for color, typography, spacing, sizing, border, radius, surface, elevation, shadow, blur, density, breakpoint references, and motion timing/easing.
- TypeScript exports reference the CSS authorities and do not fork the palette.

## Futuristic Minimalist direction

The palette is deliberately restrained: neutral technical surfaces, cyan system accent/focus roles, controlled elevation, low-amplitude motion, compact enterprise density, and limited optional translucency. Styling effects remain subordinate to legibility, contrast, information hierarchy, and reduced-motion/accessibility requirements.

## Mutation boundary

M79 is allowed to mutate only the token/theme authorities, their typed references, package/certification wiring, and historical verifiers that require explicit successor-awareness. Authentication, authorization/RBAC, routing, persistence, Supabase contracts, domain logic, database schema/migrations, module workflows, and module-specific style migrations are outside M79.

## Ad-hoc constant retirement rule

M79 retires duplicated raw values where they are shared token concerns. It does not mechanically replace every literal in product/module CSS: literals with module-specific semantics remain owned by M84-M96. A later consumer migration may replace them only after its owning milestone establishes equivalence and regression coverage.

## Breakpoint rule

CSS custom properties documenting breakpoints are references only. Media-query grammar cannot consume ordinary custom properties; governed media-query literals remain synchronized with the typed `workManagementBreakpoints` contract.

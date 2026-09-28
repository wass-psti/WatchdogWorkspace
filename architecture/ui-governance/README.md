# Stage H M56 — UI Architecture Inventory & Design-Governance Baseline

M56 is a discovery/governance milestone. It does **not** redesign the Work Management App and does not authorize visual, routing, state, persistence, authorization, backend, schema, or module-workflow changes.

## Purpose

The certified M55 baseline already contains multiple live UI authorities. M56 makes those authorities explicit so later UI Design Principles milestones can evolve them without creating parallel design systems, deleting certified compatibility code, or flattening legitimate module-specific workflows.

The canonical machine-readable ownership manifest is `config/ui-architecture-inventory.ts`. The discovery snapshot is `regression-baseline/m56-ui-architecture-inventory.json`.

## Ownership model

Five governance classifications are permitted:

1. **authoritative-shared** — shared presentation authority intended for cross-feature reuse.
2. **authoritative-host** — host or host-feature presentation authority.
3. **compatibility-authority** — live, certified compatibility boundary. It may look transitional, but it is not deprecated unless a successor milestone proves all consumers migrated.
4. **module-specific-authority** — legitimate UI authority owned by an embedded application with distinct workflows or authorization semantics.
5. **verification-authority** — tests and certification gates that constrain presentation changes.

No classification means "safe to delete". Retirement requires explicit successor-milestone evidence and historical regression verification.

## Current certified UI authorities

- `src/design-system` — product-owned React design-system provider, primitives, icons, and interactions.
- `assets/css/foundation` — cross-runtime token, theme, primitive, interaction, component, migration, and module-unification CSS.
- `src/app` plus host CSS — React host presentation/composition and shell surfaces.
- `assets/js/platform/ui` and certified runtime feature presentation — imperative compatibility authority still used by live paths.
- `assets/css/motion-design.css` plus motion runtimes — shared motion authority.
- `src/app/boards`, `src/features/boards`, `assets/js/features/boards`, `assets/css/boards-monday.css` — Boards presentation boundary.
- `apps/time-tracker`, `apps/fueltrack-plus`, `apps/tradelink` — module-specific UI authorities.
- existing UI/shell/design-system/browser/historical verifiers — verification authority.

## Dependency and mutation rules

- Later milestones should consume or evolve these authorities; they must not introduce a second global design system.
- Chakra is an implementation detail behind the product-owned design-system provider. Feature modules must not establish their own Chakra provider authority.
- Cross-runtime tokens currently bridge through the `--wm-*` CSS custom-property namespace.
- The imperative runtime is a live compatibility authority, not dead legacy. Removal requires zero-consumer proof plus applicable browser/historical regression gates.
- Embedded module differences remain valid where required by workflow, authorization, data density, document-generation, attendance, or analytics behavior.
- M56 itself must not modify visual/runtime behavior. Its source delta is limited to governance, inventory, documentation, verification, package-script wiring, and continuation evidence.

## Successor program

The governed successor program spans **M57-M77**. Each milestone may evolve only the authorities assigned to it and must preserve the certified contracts that remain outside its scope.

## Successor migration map

| Concern | Primary successor milestone(s) |
| --- | --- |
| design philosophy / language | M57 |
| tokens | M58 |
| typography | M59 |
| theme / contrast | M60 |
| layout / spacing | M61 |
| responsive architecture | M62 |
| accessibility semantics | M63 |
| reusable components | M64 |
| forms | M65 |
| overlays / floating surfaces | M66 |
| feedback / status / errors | M67 |
| shell / navigation | M68 |
| dense data | M69 |
| dashboards / analytics | M70 |
| interaction / motion | M71 |
| host migration | M72 |
| Boards migration | M73 |
| TimeTracker | M74 |
| FuelTrack+ | M75 |
| TradeLink | M76 |
| final cross-device/cross-browser production certification | M77 |

## Completion rule

M56 is complete only when the inventory manifest, discovery snapshot, documentation, static verifier, deterministic execution verifier, aggregate release wiring, and applicable historical/regression gates pass. Visual correctness alone is not a completion signal.

## M60 Color, Theme & Contrast Architecture

See `color-theme-contrast-architecture.md` for semantic palette, theme-mode, and contrast governance.

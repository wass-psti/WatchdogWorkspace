# Work Management Primitive Interaction Architecture — Stage B Milestone 5

## Purpose

Milestone 5 establishes the product-owned React interaction layer that sits above the Milestone 4 Work Management React Design System. Feature code consumes Work Management primitives and does not directly depend on Ark UI, Floating UI, or Lucide.

```text
React feature surfaces
        ↓
Work Management interaction + icon APIs
        ↓
┌──────────────────────────────┐
│ Ark UI React                 │ semantic state machines / accessibility
│ Floating UI React            │ exceptional anchored-layer geometry
│ Lucide React                 │ icon implementation
└──────────────────────────────┘
        ↓
M4 Work Management React Design System
        ↓
authoritative --wm-* semantic tokens
```

## Governed dependency targets

`config/stage-b-m5-interaction-target.ts` exact-pins:

- `@ark-ui/react` 5.39.1
- `@floating-ui/react` 0.27.20
- `lucide-react` 1.41.0

M5 requires M4 to be `active-certified` before direct M5 installation is allowed.

### M4 transitive Ark compatibility

Chakra can already place Ark UI in `package-lock.json` transitively before M5 begins. M5 therefore determines dependency ownership from `package.json` and the root lock dependency map, not merely from the existence of `node_modules/@ark-ui/react` in the lockfile. This prevents the M4 Chakra graph from being misclassified as an M5 activation.

After M5 activation, the exact direct root dependency must be `@ark-ui/react@5.39.1` and its top-level lock entry must resolve to that version with npm-registry integrity metadata.

## Vendor declaration policy

M5 inherits the corrective M4 TypeScript policy:

- Work Management source remains `strict: true`.
- `noImplicitAny`, `strictNullChecks`, `noUncheckedIndexedAccess`, and `exactOptionalPropertyTypes` remain enabled.
- `skipLibCheck: true` skips validation of third-party declaration internals only.
- Work Management usage of Ark/Floating/Lucide public APIs remains fully type-checked.
- No local vendor declaration patches, `@ts-ignore`, `@ts-nocheck`, or fabricated module shims are permitted.

The M5 wrappers are written to avoid explicitly forwarding `undefined` into optional third-party props, preserving compatibility with `exactOptionalPropertyTypes`.

## Primitive API

Milestone 5 defines these product-owned APIs:

- `WMButton` / `WMIconButton`
- `WMDialog`
- `WMMenu`
- `WMPopover`
- `WMTooltip`
- `WMTabs`
- `WMCheckbox`
- `WMSwitch`
- `WMCollapsible`
- `useWMFloatingLayer`
- `WMIcon`

## Interaction ownership rules

1. **Ark owns semantic interaction state.** Focus trapping, Escape behavior, outside-interaction dismissal, typeahead, tab roving focus, checkbox/switch form semantics, and composite ARIA roles are not reimplemented manually.
2. **Floating UI owns geometry only.** The Work Management adapter provides offset, flip, shift, sizing, and automatic repositioning for exceptional anchored layers. Focus, dismissal, and ARIA stay with the owning primitive.
3. **Lucide is an implementation detail.** Feature modules select a `WMIconName`; direct Lucide imports are verifier-prohibited.
4. **M4 owns visual semantics.** M5 styles consume existing `--wm-*` tokens for controls, surfaces, focus, z-index, color, and motion.
5. **Legacy interaction utilities remain compatibility infrastructure.** Existing imperative overlays, Board editors, menus, and floating-surface utilities stay authoritative only for legacy screens until those screens are individually migrated.

## Accessibility contracts

- Icon-only controls require an explicit accessible label.
- `WMDialog` supports both `dialog` and `alertdialog`; alert dialogs default to outside-interaction dismissal disabled.
- Dialog/Menu/Popover/Tooltip content is portalled out of clipping contexts.
- Portal content uses Ark `lazyMount` + `unmountOnExit` while the root interaction machine remains mounted.
- Tabs require an accessible list label and support automatic/manual activation plus horizontal/vertical orientation.
- Checkbox and Switch keep Ark hidden-input form participation.
- Composite key handling is delegated to Ark; Work Management wrappers do not install competing `onKeyDown` state machines.
- Focus-visible styles use Work Management focus tokens.
- Motion has an explicit `prefers-reduced-motion` path; `transition: all` is prohibited.

## Staged compiler boundary

Before M5 direct dependencies are installed, these source trees are excluded from the project compiler:

- `src/design-system/interactions/**/*`
- `src/design-system/icons/**/*`

This staging prevents M5 from making M4 certification impossible before the exact M5 packages exist. The source files are still syntax-verified and architecture-verified.

`npm run interactions:activate` removes the excludes after M4 certification and successful direct dependency installation. It then type-checks the real Work Management wrappers against the real package public APIs before exporting them from `src/design-system/index.ts`.

## Activation state machine

```text
blocked-pending-m4-certification
        ↓ M4 active-certified
blocked-pending-registry-access
        ↓ exact direct npm installation
 dependencies-installed-pending-certification
        ↓ governance + security + M3 + corrected M4 + M5 + ESLint + real typecheck
active-pending-release-certification
        ↓ audit + complete release/build/preview regression
active-certified
```

Commands:

```bash
npm run interactions:status
npm run interactions:check
npm run interactions:activate
npm run interactions:activate:release
```

The installation transition is transactional. Registry/install failure restores governed package/source files. Once direct dependencies have been successfully installed, later certification failure deliberately retains `dependencies-installed-pending-certification` so the real installed graph can be corrected and re-tested without falsifying or discarding the dependency state.

## Deferred scope

Milestone 5 does not introduce React Hook Form, Zod, TanStack Query/Table/Virtual, feature-level Zustand stores, dnd-kit, Motion, Lexical, ECharts, or feature UI rewrites. These must build on the M4/M5 product boundaries in later milestones.

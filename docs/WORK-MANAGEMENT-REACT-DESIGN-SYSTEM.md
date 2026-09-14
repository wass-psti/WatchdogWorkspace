# Work Management React Design System — Stage B Milestone 4

## Purpose

Milestone 4 establishes a product-owned React design-system boundary between Work Management feature code and third-party presentation libraries. The authoritative `--wm-*` CSS variables remain the shared token contract while legacy and React surfaces coexist.

## Layering contract

```text
Product feature code
        ↓
Work Management React components
        ↓
Work Management Design System
        ↓
Chakra UI v3 implementation layer
        ↓
Existing --wm-* semantic/foundation CSS variables
```

Feature modules must not import `@chakra-ui/react` directly. Chakra remains an implementation detail under `src/design-system/`.

## Foundations

`src/design-system/foundation.ts` bridges the existing typography, spacing, sizing, radii, elevation, motion and semantic color variables. It intentionally does not create a second light/dark palette. Existing theme controllers update the semantic CSS variables and React surfaces inherit the same values.

The M4 Chakra system is configured with:

- `preflight: false` so the staged provider cannot replace the existing reset/foundation styles;
- `cssVarsRoot: ':where(#app)'` so generated variables stay inside the React composition root;
- `cssVarsPrefix: 'wm-react'` to prevent variable namespace collisions;
- semantic color tokens that point back to the authoritative `--wm-color-*` variables.

## Product-owned primitives

M4 introduces non-interactive React primitives that bridge the already-certified Work Management CSS primitives:

- `WMStack`
- `WMCluster`
- `WMGrid`
- `WMPage`
- `WMSection`
- `WMSurface`
- `WMDivider`
- `WMText`
- `WMHeading`
- `WMKicker`
- `WMVisuallyHidden`

Interactive controls remain deliberately deferred. Button/menu/dialog/popover/combobox interaction primitives belong to Milestone 5 so Ark UI/Zag/Floating UI can be adopted coherently rather than creating temporary competing APIs in M4.

## Governed runtime target

The reviewed M4 runtime target remains exact-pinned:

- `@chakra-ui/react@3.36.1`
- `@emotion/react@11.14.0`

The current execution environment cannot resolve `registry.npmjs.org` (`EAI_AGAIN`), so this continuation package keeps the M3 runtime dependency manifest and lockfile truthful instead of fabricating new package-lock entries.

## Activation state machine

`config/stage-b-m4-design-system-target.ts` records one of four explicit states:

1. `blocked-pending-registry-access`
   - Chakra/Emotion are not declared or locked.
   - The provider is not mounted.
   - This is the state of the present continuation RC.
2. `dependencies-installed-pending-certification`
   - exact runtime packages and lockfile entries exist;
   - provider remains inactive while Work Management source is typechecked against the real package public APIs; third-party declaration internals are skipped with the same `skipLibCheck` policy Chakra uses in its own strict build configuration.
3. `active-pending-release-certification`
   - `WorkManagementDesignSystemProvider` wraps `LegacyApplicationBoundary`;
   - targeted governance/security/React/M4/typecheck gates have passed;
   - full production release verification still remains.
4. `active-certified`
   - audit and complete `release:check` have passed after provider activation.

The M4 verifier validates every state independently and rejects inconsistent package/lock/provider combinations.

## Activation commands

Use the status command at any time:

```bash
npm run design-system:status
```

Once npm registry access is available, perform governed install, real-package TypeScript verification and provider activation with:

```bash
npm run design-system:activate
```

That command first performs a fail-fast preflight against the official npm registry. It makes no source, manifest, lockfile or activation-state changes if the registry cannot be reached. After a successful preflight it:

1. installs the exact Chakra/Emotion targets using npm from `https://registry.npmjs.org/`;
2. validates the generated `package.json` and `package-lock.json` state;
3. transitions to `dependencies-installed-pending-certification`;
4. runs package governance, Stage A security, M3 React boundary, M4 design-system, vendor-declaration compatibility, ESLint and strict Work Management TypeScript gates;
5. mounts `WorkManagementDesignSystemProvider` above `LegacyApplicationBoundary` only after those checks pass;
6. transitions to `active-pending-release-certification` and revalidates the mounted boundary.

Complete the production certification with:

```bash
npm run design-system:activate:release
```

That executes the high-severity npm audit and the complete production `release:check`. Only a successful run promotes the target contract to `active-certified`.

## Third-party declaration compatibility policy

M4 retains the Work Management strict TypeScript contract (`strict`, `noImplicitAny`, `strictNullChecks`, `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`, `noImplicitReturns`, and the existing no-suppression rules) while setting `skipLibCheck: true`. This is intentionally narrow: TypeScript still validates every Work Management use of Chakra/Emotion public types, but it does not re-validate the internal `.d.ts` implementation relationships published by Chakra's transitive Ark/Zag dependencies.

This avoids treating third-party declaration-generation incompatibilities as Work Management source errors. No `@ts-ignore`, `@ts-nocheck`, `@ts-expect-error`, vendored declaration patch, `patch-package`, or global Node ambient-type injection is introduced. `npm run vendor-types:check` enforces these invariants and is mandatory in activation, CI, deployment, `check`, and `release:check`.

## Compatibility guarantees

Until activation succeeds, the M3 runtime path remains unchanged:

```text
React 19.2 #app root
        ↓
ApplicationCompositionRoot
        ↓
LegacyApplicationBoundary
        ↓
existing Work Management runtime
```

No authentication, Supabase/RLS authority, routing, persistence, Boards behavior, shell behavior, embedded application hosting or legacy presentation authority is moved into the staged design system by this continuation package.

After activation, the only composition change is insertion of the product-owned provider around the same M3 legacy boundary. The legacy application remains a singleton imperative island beneath React until later migration milestones.

## Milestone 5+ exclusions

M4 does not directly add Ark UI/Zag, Floating UI, Lucide, React Hook Form, Zod, TanStack Query/Table/Virtual, Zustand feature state, dnd-kit, Motion, Lexical or ECharts. Chakra's own transitive implementation dependencies are allowed only as transitive packages produced by the governed Chakra installation; feature code is not permitted to depend on them directly in M4.

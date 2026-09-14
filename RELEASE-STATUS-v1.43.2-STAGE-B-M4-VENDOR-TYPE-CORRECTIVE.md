# Work Management v1.43.2 — Stage B M4 Vendor Type Corrective RC

## Status

**VENDOR TYPE CORRECTION IMPLEMENTED — dependency-enabled provider/release certification must be rerun.**

## Failure reproduced from certification evidence

The real M4 activation successfully installed and governed `@chakra-ui/react@3.36.1` and `@emotion/react@11.14.0`, passed governance, security, M3, M4, corrective integrity and ESLint, then failed at `tsc --noEmit` with 17 errors originating exclusively from `node_modules` declaration files:

- 15 Ark UI component declaration inheritance errors around optional `id`;
- 1 Chakra generated `cornerShape` declaration error;
- 1 Zag JSON-tree `Buffer` declaration error.

No Work Management `.ts` or `.tsx` file appeared in the failure set.

## Correction

- `tsconfig.json` now sets `skipLibCheck: true`.
- All existing strict Work Management flags remain enabled, including `strict`, `noImplicitAny`, `strictNullChecks`, `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`, `useUnknownInCatchVariables`, `noImplicitReturns`, `noUnusedLocals`, and `noUnusedParameters`.
- The canonical typecheck remains `tsc --noEmit`.
- No Node ambient types were globally injected into browser source.
- No vendor declarations are patched.
- No `@ts-ignore`, `@ts-nocheck`, or `@ts-expect-error` suppression is allowed in authoritative Work Management source.
- Added `verify-stage-b-m4-vendor-type-compatibility.mjs` and `npm run vendor-types:check`.
- The vendor gate is mandatory in `check`, `release:check`, CI, deployment, and M4 activation before typecheck/provider promotion.
- Governance recovery copies of CI/deployment workflows are synchronized with the live corrected workflows, preventing `governance:restore` from reintroducing pre-correction workflow content.

## Type-safety boundary

`skipLibCheck` skips validation of internal relationships inside external `.d.ts` files. It does not skip Work Management source checking and does not make imported Chakra types `any`; Work Management usage of the public declarations remains typechecked.

## Remaining M4 certification

On the governed macOS environment:

```bash
nvm use
npm run governance:restore
npm run governance:check
npm run security:check
npm run corrective:check
npm run vendor-types:check
npm run design-system:activate
npm run design-system:status
```

Target after activation:

```text
Activation state: active-pending-release-certification
Provider mounted: YES
```

Then:

```bash
npm run design-system:activate:release
npm run design-system:status
```

M4 is complete only at:

```text
Activation state: active-certified
Provider mounted: YES
```

## Compatibility boundaries

Until provider activation succeeds, the M3 React composition root continues to host the singleton legacy Work Management runtime. Boards, authentication/RBAC, Supabase/RLS, shell/navigation, TimeTracker, FuelTrack+, and TradeLink remain on their established authorities.

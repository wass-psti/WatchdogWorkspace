# v1.43.2 — Stage B Milestone 6 Runtime Schemas

## Status

Source implementation complete. Package state: `dependencies-installed-pending-certification`.

## Implemented

- Added exact-governed `zod@4.5.4` runtime dependency and lock integrity.
- Added Work Management runtime schema authority under `src/runtime-schemas/`.
- Advanced application architecture metadata to Architecture Version 16.
- Runtime-validated application/module manifests.
- Runtime-validated module data/identity protocol.
- Runtime-validated embedded identity context and host ready/error messages.
- Schema-backed platform/Board role predicates.
- Runtime-validated embedded cloud-store data responses, invalidation messages, module-state rows, directory entries, activity items, and activity-event input.
- Runtime-validated application routes, embedded lifecycle state/events, and dynamic runtime context values.
- Added generic persistence page/envelope schemas for shared platform use.
- Added M6 activation/status/check scripts and runtime execution vectors.
- Added M6 to CI, deployment, governance synchronization, aggregate verification, and Stage B certification.


## Governed toolchain dispatch correction

Public M6 and Stage B certification commands now enter through `scripts/run-governed-toolchain.sh`. A caller that starts from Node 24/npm 11 is automatically switched to the `.nvmrc` / `packageManager` pair (Node 22.16.0 / npm 10.9.2) before dependency or certification work begins. `verify-stage-b-governed-toolchain-dispatch.mjs` reproduces and protects the reported Node 24/npm 11 failure mode.

## Deliberate boundaries

- Board domain schema/integrity logic remains authoritative in the Board domain layer.
- Supabase RLS/RPC authorization remains server-authoritative.
- Embedded applications are not required to import Zod.
- Legacy application rendering remains behind the React compatibility boundary.
- Board DTO/domain validation remains a specialized authority because it performs compatibility migration and relational invariants.
- Supabase provider/session normalization in `assets/js/core/auth.ts` remains a specialized compatibility parser pending a provider-specific schema migration.

## Completion criterion

M6 is complete when `npm run runtime-schemas:activate:release` or `npm run stage-b:certify` finishes with:

- M5 prerequisite: `active-certified`
- M6 state: `active-certified`
- Zod package/lock/resolved version: `4.5.4`
- runtime execution vectors: PASS
- full release gate: PASS

## Cloud module data TypeScript corrective

The M6 RC includes a corrective pass for the module-data ingress bridge. The minimum `wm:data:request` envelope is now parsed through `moduleDataEnvelopeSchema`, and the M6 verifier rejects residual calls to the retired handwritten `recordOf` / `nonEmptyString` helpers. See `M6-CLOUD-MODULE-DATA-TYPESCRIPT-HOTFIX.md`.

## Browser ESM harness corrective continuation

The M6 browser integration gate now executes the real Vite-bundled ES-module graph instead of
stripping imports and evaluating modules as isolated classic scripts. This is required because M6
runtime schemas are executable dependencies at runtime. The dedicated `browser-harness:check`
gate validates a self-contained IIFE and participates in `runtime-schemas:check` before release
certification reaches the full browser integration suite.

## Browser Harness Verifier Hotfix

The final M6 certification path now verifies the dispatcher-backed browser harness contract and validates self-contained IIFE output through Vite/Rollup chunk dependency metadata rather than a broad textual `import`/`export` regex. See `M6-BROWSER-HARNESS-VERIFIER-HOTFIX.md`.

## Final Chromium motion-certification corrective pass

The final M6 release boundary now explicitly exercises both the v1.28 progressive motion runtime and the v1.30 motion orchestrator in the real Chromium CDP release harness. The legacy certification assertions remain enabled; the harness now proves the runtime-ready state, motion preference state, and orchestrator version from inside Chromium rather than relying on source-presence checks alone.

Corrective verification completed in the build workspace:
- `verify-v1280-motion-design.mjs`: PASS
- `verify-v1300-motion-architecture.mjs`: PASS
- downstream Board/item-workspace/shell motion-contract verifiers sampled after the correction: PASS

The release workflow remains authoritative: `npm run stage-b:certify` promotes M6 from `active-pending-release-certification` to `active-certified` only after the complete production release gate succeeds.

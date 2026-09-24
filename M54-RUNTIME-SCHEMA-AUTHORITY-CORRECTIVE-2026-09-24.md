# M54 Runtime Schema Authority Corrective — 2026-09-24

## Failure
The clean-install `release:check` failed in the inherited M6 runtime-schema execution vector because M54 added four `functionalProductionReadiness*` architecture fields to `config/application-manifest.ts` while `src/runtime-schemas/manifest.ts` remained strict and did not declare them.

## Root cause
Architecture version 59 advanced the application manifest without advancing the authoritative TypeScript/Zod architecture contracts. The strict Zod object therefore rejected the otherwise valid M54 manifest as containing unknown keys.

## Correction
- Declare all four M54 production-readiness architecture fields in `ArchitectureDefinition`.
- Declare the same fields in the strict Zod `architectureDefinitionSchema`.
- Require the exact M54 target, policy and workflow authorities when `architectureVersion >= 59`.
- Harden the M54 static verifier to require both runtime-schema and TypeScript authority synchronization.

## Certification boundary
This corrective checkpoint is not M54 certification. The full clean-install release gate and all downstream database, browser, deployment, live workflow, historical, hygiene and freeze gates must still pass fail-closed.

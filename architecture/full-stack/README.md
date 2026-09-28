# Full-Stack Application Folder Structure

This directory defines the **logical full-stack topology** of the Work Management App without replacing the certified physical paths that existing runtime, build, verification, deployment, and historical-certification contracts depend on.

## Rule

The repository already contains production-authoritative frontend, backend, shared-contract, infrastructure, quality, and delivery roots. M55 formalizes those roots as one governed full-stack structure instead of moving them behind cosmetic wrapper directories.

A physical relocation is allowed only in a later milestone when all dependent imports, build entries, static-copy rules, tests, historical verifiers, CI workflows, deployment scripts, and certification evidence are migrated atomically and regression gates pass.

## Logical topology

```text
Work-Management-App/
├── frontend/
│   ├── host-application/      -> src/app, src/features
│   ├── design-system/         -> src/design-system, assets/css/foundation
│   ├── browser-runtime/       -> assets/js
│   ├── embedded-modules/      -> apps
│   └── public-assets/         -> public
├── backend/
│   ├── edge-functions/        -> supabase/functions
│   ├── migrations/            -> supabase/migrations
│   ├── schema/                -> supabase/schema.sql
│   └── database-tests/        -> supabase/tests
├── shared/
│   ├── platform-contracts/    -> src/platform/contracts
│   ├── runtime-schemas/       -> src/runtime-schemas
│   ├── shared-types/          -> src/types
│   └── manifests/             -> config/application-manifest.ts, config/modules.ts
├── infrastructure/
│   ├── build/                 -> vite.config.js, tsconfig.json
│   ├── runtime-config/        -> config
│   ├── service-worker/        -> service-worker.js
│   ├── ci/                    -> .github
│   └── backend-platform/      -> supabase/config.toml
├── quality/
│   ├── tests/                 -> tests
│   ├── database-tests/        -> supabase/tests
│   └── verification/          -> verify-*.mjs, scripts/verify-*.mjs
└── delivery/
    ├── automation/            -> scripts
    ├── governance/            -> governance-artifacts
    ├── release-evidence/      -> release-artifacts
    └── documentation/         -> docs
```

The arrows are ownership mappings, not symlinks. The production paths on the right remain authoritative.

## Dependency direction

1. Presentation and feature code may depend on shared contracts and platform adapters.
2. Shared contracts and schemas must remain feature-neutral and browser/server safe as applicable.
3. Browser code must not import Supabase server implementation, migrations, tests, or server-only secrets.
4. Backend Edge Functions may consume their own server-local implementation and database contracts but must not import browser UI/presentation code.
5. Embedded applications remain isolated compatibility modules behind the existing typed host/module contracts until an explicit native-retirement milestone passes its parity gates.
6. Build, CI, certification, and deployment tooling may inspect application/backend sources, but application runtime code must not import tooling.

See `config/full-stack-folder-structure.ts` for the machine-readable authority enforced by `npm run full-stack-structure:check`.

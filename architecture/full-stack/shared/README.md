# Shared Contracts Boundary

Canonical production paths:

- `src/platform/contracts/` — cross-layer typed platform contracts.
- `src/runtime-schemas/` — runtime validation schemas.
- `src/types/` — shared compile-time types.
- `config/application-manifest.ts` and `config/modules.ts` — application/module topology manifests.

Shared code must not become a dumping ground for feature implementation. A shared artifact belongs here only when it has stable multi-consumer semantics and no feature-specific presentation ownership.

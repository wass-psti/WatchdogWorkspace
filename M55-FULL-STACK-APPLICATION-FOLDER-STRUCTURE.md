# M55 — Full-Stack Application Folder Structure

## Implementation state

This milestone establishes a governed full-stack repository topology while preserving the M54 certified runtime paths and architectural contracts.

## Decision

A wholesale physical move into new cosmetic roots such as `frontend/`, `backend/`, or `packages/` is intentionally not performed. The M54 source tree has extensive path-bound historical verification and build/deployment contracts. Moving those authorities in this milestone would create regression risk without changing runtime capability.

Instead, M55 formalizes the existing production directories as the canonical physical implementation of six full-stack ownership areas:

- Frontend
- Backend
- Shared contracts
- Infrastructure
- Quality
- Delivery/governance

The structure is machine-readable in `config/full-stack-folder-structure.ts`, documented under `architecture/full-stack/`, and enforced by dedicated static and deterministic gates.

## Runtime behavior

No application runtime source, route, persistence contract, Supabase schema/RPC/RLS contract, module entry, service-worker contract, authentication/RBAC boundary, or Vite entry was relocated or rewritten by M55.

## New gates

- `npm run full-stack-structure:check`
- `npm run full-stack-structure:test`

The static structure check is included in `npm run check`; both static and deterministic gates are included in `npm run release:check`.

## Future relocation rule

A future physical relocation may proceed incrementally only when the affected import graph, verifier path graph, build entries, static-copy paths, CI workflows, deployment scripts, documentation, and certification gates are migrated in the same atomic change. Compatibility shims must be explicit and temporary; duplicate source authorities are prohibited.

## Certification status at handoff

Implementation is complete, but the candidate is intentionally **not labeled certified**. Dependency-independent M55/M54 governance checks pass; full local `release:check` remains required because the implementation environment could not fully materialize npm dependencies. See `M55-CONTINUATION-STATE.md`.

## Certification and deterministic handoff

M55 uses a fail-closed staged certification model. The continuation working tree remains `implementation-complete-pending-certification`. `full-stack-structure:certify` performs exact dependency materialization, the M55 static/deterministic/browser/release gates, normalized source-tree drift detection, a staged `active-certified` transition, post-state validation, historical verifier regression, payload secret/environment/symlink/checksum hygiene, ZIP integrity verification, and final checkpoint validation. Only then are the certified ZIP and PASS record atomically published under `m55-certified-artifacts-upload/`.

The certified ZIP is self-contained and includes `CHECKSUMS.sha256`. Its PASS record binds the ZIP SHA-256, normalized certified source-tree SHA-256, milestone number, certification state, timestamp, and M55 semantics version.

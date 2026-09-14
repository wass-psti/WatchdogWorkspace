# M42 Certified Payload Secret Boundary Corrective

Date: 2026-09-14
Milestone: Stage G — M42 Users / RBAC Functional Recovery
State after corrective: `implementation-complete-pending-certification`

## Root cause

M42 already ran the project security gate before packaging, but the high-confidence secret scanner only inspected a limited set of text extensions. The certified baseline is assembled from the project tree, so a credential placed in another shipped text format (for example `.txt` or `.toml`) could evade the working-tree scan and still enter the certified ZIP. Packaging also removed several common local `.env` names but did not define the certified payload itself as the final secret-scan authority.

## Corrective

- Expanded `scripts/scan-secrets.mjs` coverage to shipped text formats including `.txt`, `.toml`, `.svg`, and `.webmanifest`, plus governed extensionless/npm files.
- `scripts/finalize-stage-g-m42.sh` now removes every concrete `.env*` file from the staged certified baseline while retaining `*.example` environment templates.
- The finalizer runs `scripts/scan-secrets.mjs` **inside the exact staged certified payload** after package pruning and release-status synchronization, but before checksums, ZIP creation, publication, or PASS-record creation.
- A staged secret therefore aborts certification and triggers the existing target/status/artifact rollback path.
- The PASS record explicitly records the certified-payload secret scan as a required PASS gate.

## Deterministic proof

The M42 finalizer regression now proves:

1. private/generated/local-environment files are excluded while `.env.example` remains;
2. a runtime-generated GitHub-style token in a staged `.txt` file fails the payload scan;
3. payload-secret failure restores the exact pre-certification target and release-status record;
4. no certified directory, ZIP, or PASS record is published on payload-secret failure;
5. a clean payload publishes successfully and remains internally checksum-consistent.

The package-hygiene regression also proves literal credentials in `.txt`, `.toml`, and `.npmrc` fail scanning while environment-backed npm token placeholders remain allowed.

## Certification consequence

This is certification/package-security hardening only; Users/RBAC production behavior is unchanged. M42 remains `implementation-complete-pending-certification` until the dependency-backed and disposable Supabase Database/RLS gates can execute successfully.

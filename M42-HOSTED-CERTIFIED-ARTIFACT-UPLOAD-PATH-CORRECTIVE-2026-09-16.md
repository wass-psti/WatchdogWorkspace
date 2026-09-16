# M42 Hosted Certified-Artifact Upload-Path Corrective — 2026-09-16

## Hosted evidence

Exact-revision `Stage G M42 Certified Baseline` run `35060842339` on commit `053bc2975813b18e93c5c8f45048a3a6e0ddd7f4` completed the authoritative M42 finalizer successfully. The run reached `active-certified`, passed the complete release certification transaction, created the certified baseline ZIP and PASS record, and then passed the workflow's independent `Verify certified M42 artifacts` step. The generated certified ZIP SHA-256 was `9a1e8ef23e4c855ffc0ca564de30ecb26abd20679cce1499cf90514098dd5e39`.

The workflow failed only in `actions/upload-artifact@v4` because its `path:` input referenced both verified files with `../`. Current upload-artifact path validation rejects parent-directory traversal before upload, even though shell verification can legitimately access those finalizer outputs one directory above the checked-out repository. The exact hosted error was `Invalid pattern '../Work-Management-App-v1.43.2-Stage-G-M42-Certified-Baseline.zip'. Relative pathing '.' and '..' is not allowed.`

## Root cause

The finalizer deliberately publishes its transactional output beside the repository checkout. The workflow correctly verified those files from `../`, but incorrectly passed the same parent-relative paths directly to `actions/upload-artifact@v4`. Artifact publication therefore failed after certification had already succeeded. This was a workflow publication-path defect, not a Users/RBAC, certification, source-binding, checksum, secret-hygiene, browser, Database/RLS, or rollback defect.

## Corrective

`.github/workflows/m42-certified-baseline.yml` now adds a fail-closed staging step after independent artifact verification and before upload. It copies only the already-verified certified ZIP and PASS record into the repository-local `m42-certified-artifacts-upload/` directory, verifies each staged file is byte-identical with `cmp`, and rechecks the certified ZIP SHA-256 across the copy boundary. `actions/upload-artifact@v4` now receives only repository-local paths and no `..` traversal.

`scripts/verify-stage-g-m42-hosted-certification-workflow.mjs` and the M42 static verifier now enforce the staging/copy identity checks, exact repository-local upload paths, and the absence of `..` from the upload action block so this failure class cannot silently regress.

No production Users/RBAC behavior, RPC, RLS, migration, activation semantics, finalizer semantics, source-tree algorithm, or certified payload content was changed.

## Required closure

Push this exact corrective candidate, require the automatic `Users RBAC Functional Recovery` workflow to complete fully green on the new exact SHA, then run `Stage G M42 Certified Baseline` against that same SHA. M42 may be closed only after the hosted workflow itself is green and the uploaded certified ZIP/PASS artifact is independently verified.

# M77 Git Roundtrip Harness Corrective v8 — 2026-09-28

## Origin

Corrective-v7 implemented Git-restorable source-identity mode semantics successfully, but the subsequent local certification attempt failed before browser/E2E execution while trying to write `refs/remotes/origin/main` to a commit object that was not present in the temporary repository object database.

## Root cause

The failing Git-restoration proof existed outside the governed repository and attempted to synthesize a remote-tracking ref before materializing the referenced commit object. Git correctly rejected the ref write. This was a certification-harness defect rather than a production application defect.

## Corrective delta

- Added `scripts/verify-stage-h-m77-git-restorable-roundtrip.mjs` as a repository-governed deterministic restoration proof.
- Added `npm run final-ui:git-roundtrip:test`.
- The verifier creates a temporary Git repository from the certification source tree, commits it, verifies the commit object with `git cat-file -e`, clones from the repository that actually owns that object, verifies the restored commit, and compares the M77 certification-tree SHA-256 before and after the Git roundtrip.
- The verifier never fabricates a ref to an object that has not been materialized.
- M77 deterministic verification now guards the roundtrip harness and rejects reintroduction of `git update-ref` into this proof.
- The M77 finalizer now runs the governed Git-restorable roundtrip before browser/E2E certification.

## Scope boundary

This corrective modifies certification and verification infrastructure only. It does not change production application behavior, database schema, migrations, RLS, RPCs, grants, deployment topology, or product UI.

## Exit criterion

The local corrective loop exits when the governed Git roundtrip and all subsequent fail-closed M77 certification gates pass. Publication/fresh-clone proof of the exact published commit remains an execution-dependent post-publication validation requirement.

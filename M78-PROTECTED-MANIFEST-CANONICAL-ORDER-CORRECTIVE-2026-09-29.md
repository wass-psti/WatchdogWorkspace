# M78 Protected-Manifest Canonical-Order Corrective — 2026-09-29

During M78 deterministic verifier bring-up, individual protected-file hashes matched M77 but the aggregate digest failed. Root cause was verifier/generator ordering inconsistency: manifest generation aggregated entries in protected-root traversal order while verification canonicalized the same entries by repository-relative path before aggregation.

The correction canonicalizes manifest entries by repository-relative path before computing the aggregate digest. No protected presentation/runtime file changed. After correction, all 264 protected files and the aggregate digest pass deterministically.

This was a verification-implementation defect in the newly introduced M78 guard, not a production visual/runtime regression.

# M54 Post-Release CI — M49 Certification Context Corrective

## Origin

Candidate 07 completed the full local fail-closed chain and reduced hosted failures to one. GitHub Actions run `36131111550` failed only inside the M49 certification transaction after M49 static, deterministic, browser, production-boundary, CDP, and finalizer self-tests had passed.

## Failed condition

The staged M49 certified payload executes the current repository-wide verifier with M49 promoted to `active-certified`. Because the transaction is run from a later current source tree where M50 is already legitimately `active-certified`, the M50 verifier incorrectly applied the reconstructed historical-artifact rule that requires M50 to remain pending. This produced: `M49 certified-artifact context must not promote M50 while verifying historical M49 certification.`

## Corrective architecture

The provenance contract now distinguishes two fail-closed contexts:

- `m49-certified-artifact`: reconstructed historical M49-only context; M49 must be active-certified and M50 must remain pending.
- `m49-certified-artifact-current-source`: M49 certification transaction executed from the current later source tree; M49 must be active-certified and the already-certified M50 target and release status must remain active-certified.

Repository-source verification continues to require M49 pending. Unknown provenance contexts fail closed.

The M49 finalizer now uses the explicit current-source context for its post-promotion whole-project verification. The dedicated M50/M49 provenance regression covers both artifact modes and rejects cross-context state mixing. The M49 finalizer fail-closed test also asserts that the explicit context cannot silently regress.

## Boundary

This changes certification/historical harness semantics only. It does not change Boards production runtime behavior, database schema, Supabase migrations, application authorization, or the immutable `v1.43.2-m54` release tag.

# M42 Activation State-Machine and Package-Commit Corrective

Date: 2026-09-14
Milestone: Stage G — M42 Users / RBAC Functional Recovery
State after corrective: `implementation-complete-pending-certification`

## Root causes corrected

1. Plain `users-rbac-recovery:activate` could previously advance M42 to `active-certified` after only static/deterministic validation. That contradicted the fail-closed milestone state model because browser and disposable Database/RLS certification had not necessarily executed.
2. Direct/manual `users-rbac-recovery:activate:release` was weaker than dedicated certification. It omitted aggregate environment/dependency preflight and the disposable pgTAP Database/RLS gate before certification.
3. The M42 static verifier contained an `indexOf()` ordering assertion for a published-ZIP integrity command that was not actually present. A missing string yields `-1`, which could make the ordering comparison pass incorrectly.
4. Final packaging validated the staged ZIP CRC but did not independently extract that ZIP and execute the embedded checksum manifest before publication, nor revalidate the published ZIP/directory/PASS binding after the recoverable swap.
5. Post-commit cleanup still ran under `set -e`; a cleanup-only failure could therefore report certification failure after the certification transaction had already committed successfully.

## Corrective implementation

- Non-release activation now runs M42 static/deterministic gates and can only establish `active-pending-browser-certification`. It cannot self-certify.
- Direct/manual release activation without a valid tree-bound attestation now runs, before activation mutation:
  - certification environment preflight;
  - exact dependency enforcement;
  - M41/account prerequisite status;
  - M42 static verification;
  - M42 deterministic verification;
  - six-scenario M42 browser verification;
  - disposable local Database/RLS pgTAP verification;
  - historical verification;
  - full release verification.
- A valid one-time tree-bound certification attestation still suppresses duplicate execution because dedicated certification already owns those pre-activation gates.
- Final packaging now extracts the staged ZIP into an isolated verification root and validates `CHECKSUMS.sha256` from the extracted artifact before publication.
- After the recoverable artifact swap, the finalizer rechecks the published ZIP, compares its SHA-256 to the staged digest, validates the published directory checksum manifest, and verifies that the PASS record is bound to the same ZIP digest before committing.
- Post-commit cleanup is best-effort and cannot turn a successfully reverified commit into a false-negative certification result.
- Deterministic orchestration coverage now proves:
  - non-release activation cannot certify;
  - direct release owns the full release-grade gate sequence;
  - Database/RLS failure stops before activation and preserves the original target;
  - legacy boolean bypass remains ineffective;
  - tree-bound attestation success/tamper behavior remains fail closed;
  - finalizer failure rollback and prior-artifact preservation still work;
  - a complete stubbed finalization follows the committed publication path successfully.

## Certification consequence

This corrective does not mark M42 certified. The milestone remains fail closed at `implementation-complete-pending-certification` until the governed environment can restore the exact dependency tree, run the disposable Supabase pgTAP suite, execute the browser/release/historical/type/security/UI gates, and complete final package certification without failure.

## CI synchronization

The M42 GitHub workflow is also synchronized to the same non-mutating certification evidence set. After exact dependency installation and environment preflight it now runs M42 static/deterministic/browser verification, the disposable Database/RLS pgTAP suite, the complete historical sweep, TypeScript, security, and UI verification. CI does not activate the milestone; activation remains a dedicated certification/finalization responsibility.

## Dedicated certifier transaction

Standalone `users-rbac-recovery:certify` is now transactional across its own post-activation evidence. After attested activation reaches `active-certified`, it must still pass the complete historical sweep and full `release:check`. If either fails, an EXIT rollback restores the exact pre-certification target. The full finalizer no longer repeats historical/TypeScript/security/UI source gates; those are owned by dedicated certification, while finalization owns the subsequent certified artifact transaction. A deterministic certifier rollback regression covers historical failure, release failure, and the verified success path.

## Superseded attestation exception — 2026-09-14

The prior exception allowing a valid tree-bound attestation to suppress duplicate release gates is no longer valid. The issuer was proven caller-mintable and has been retired. Direct release activation now always executes the complete source-certification gate sequence. See `M42-CALLER-MINTABLE-ATTESTATION-BYPASS-RETIREMENT-CORRECTIVE.md`.

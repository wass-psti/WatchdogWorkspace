# Work Management App v1.43.2 — Stage H M77

**Milestone:** Cross-Device, Cross-Browser & Final UI Production Certification  
**State:** active-certified

The original M77 baseline was certified, but post-publication hosted CI exposed an inherited M49 CDP portability defect. Subsequent fail-closed corrective certification also exposed a mobile iframe settlement race and repository-source mutation caused by historical disposable-Supabase verification runners inheriting repository process working directory state.

The cumulative corrective implementation now includes the M49 CDP portability fix, mobile iframe settlement fix, and comprehensive workspace/process-CWD isolation for retained disposable database runners and Supabase CLI probes. The current repository remains intentionally pending certification until the complete corrective-v6 local pipeline and required hosted workflows pass.

## Corrective v7 status

Git-restorable source identity corrective v7 is implementation-complete and pending full certification. The prior v6 publication reached 23/23 hosted workflow success but failed the final fresh-clone source-identity proof because raw POSIX permission bits were not Git-restorable.

## Corrective v9 status

Corrective v9 closes the post-certification repository-state publication defect exposed by the v8 local run. The M77 finalizer now treats repository-state promotion and certified-artifact publication as one fail-closed transaction: it backs up the pending M77 target/release/continuation state, promotes and verifies the repository as `active-certified` before creating any PASS record or certified ZIP, publishes artifacts atomically, revalidates state/artifact/package/source identity, and rolls back both repository state and artifact publication on any subsequent failure. The final checkpoint and `final-ui:post-certification` command now require repository certified-state verification. This continuation candidate remains `implementation-complete-pending-certification` until the corrected full local pipeline passes.

# Work Management App v1.43.2 — Stage G M44 Management Authority Consolidation

**State:** active-certified
**Architecture Version:** 52
**Prerequisite:** M43 active-certified

## Implemented

Account, Settings, and Users now share one declared `management` feature owner and one `authenticatedManagementUiRuntime` registration. The obsolete imperative Account, Settings, and User Management controllers are removed from the shipped source tree, public runtime gateway, runtime asset manifest, and project structural requirements. Historical M37/M40/M13/architecture verifiers are synchronized to the consolidated ownership model.

## Certification requirement

M44 remains pending until the fail-closed certification sequence passes static verification, deterministic ownership tests, real browser/E2E ownership tests, retained M41/M42/M43 functional regressions, type/security/UI checks, active-certified post-state historical verification, production build, package hygiene/checksums, and independent certified-artifact verification.

## Boundaries

The shell account/profile dropdown remains a shell overlay authority; Account domain service, M42 protected Users/RBAC backend authority, and M43 Settings evidence remain service/domain authorities behind the single management runtime. M26 iframe compatibility remains intentionally retained. M54 remains the final production-readiness milestone.


## Certification state-record integrity

The M44 certification-tree digest excludes the M44 target/release-state records to permit isolated promotion from pending source to an active-certified package. The finalizer therefore separately SHA-256 binds both mutable records before pre-certification gates and requires byte-for-byte identity after pre-gates and again after the staged active-candidate historical/build gate. Any unexpected mutation fails closed before PASS publication.

## Final certified baseline — 2026-09-16T14:55:53Z

The fail-closed M44 certification and artifact-publication transaction passed for source commit `1a4354b1222c665276b768d67ac8c1723807ab89`. The packaged Management Authority Consolidation state is **active-certified**. The certification-tree digest excludes only the M44 target and release-state records so the pending repository source and promoted package can be compared without self-referential state mutation.

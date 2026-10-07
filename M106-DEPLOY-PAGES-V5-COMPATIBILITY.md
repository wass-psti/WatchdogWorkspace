# Stage I M106 — GitHub Pages deploy-pages v5 Compatibility & Certification

## Origin
Dependabot PR #3 upgrades `actions/deploy-pages` from v4 to v5. The PR preserved the dist-only GitHub Pages topology, but historical M36 and M54 certification logic hard-coded `@v4`, producing false-negative successor failures.

## Corrective scope
- Adopt `actions/deploy-pages@v5` in the primary Pages deployment workflow.
- Adopt v5 in the M54 production-readiness workflow.
- Synchronize the governed deploy-pages recovery mirror to v5.
- Preserve dist-only artifact deployment, live HTTP smoke verification, and M105 backend pre/post deployment attestation.
- Make M36 and M54 historical verifiers successor-aware only when bounded M106 authority is present.
- Preserve Dependency Review policy unchanged. GitHub Dependency Graph enablement is an external repository setting and remains a hosted prerequisite.

## Explicit non-goals
- No application runtime, schema, migration, RBAC, or UI behavior changes.
- No weakening or skipping of M36/M54 certification intent.
- No automatic merge of Dependabot PR #3 before current-checkpoint verification is green.

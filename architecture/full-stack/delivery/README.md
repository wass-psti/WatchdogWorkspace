# Delivery and Governance Boundary

Canonical production paths:

- `scripts/` — build, verification, certification, activation, deployment, and release automation.
- `governance-artifacts/` — governance evidence and policy artifacts.
- `release-artifacts/` — release/certification evidence.
- `docs/` — architecture, runbooks, and operational documentation.

Generated release artifacts must remain fail-closed: no certified baseline or PASS evidence may be produced from a failing or unverified candidate.

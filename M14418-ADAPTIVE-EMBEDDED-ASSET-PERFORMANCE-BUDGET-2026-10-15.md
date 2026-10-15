# M144.18 — Embedded asset total-build allowance (15 October 2026)

## Scope
This authority applies solely to the approved M144.18 QA successor that restores already-referenced shared stylesheets to three embedded applications and copies the PWA manifest icon alias. It is not a blanket capacity increase for unrelated revisions.

## Measured CI evidence
- Previous governed Board Import total-build ceiling: `6750000` bytes.
- New grouped-import QA source head: `2f5a10052983b2b91a694246edd46dca81bf09e1`.
- GitHub Performance run: `38682825505` (job `116250958579`).
- Measured repaired QA distribution total: `6757466` bytes.
- Over previous ceiling: `7466` bytes.
- Approved M144.18 successor ceiling: `6780000` bytes.
- Resulting measured headroom: `22534` bytes.
- Inherited initial CSS ceiling remains `628000` bytes, with measured initial CSS `626392` bytes.
- JS and per-chunk limits remain unchanged.

## Activation guard
The increased total-build limit is active only when the existing M144.11 governed Board Import authority is valid, and both `vite.config.js` and `scripts/verify-dist.mjs` match the exact reviewed SHA-256 hashes for the embedded asset packaging successor. If not, historical total-build limits remain enforced. The M108 pinned-source guard also authenticates this exact memo and the revised verifier.

## Release boundary
This memo does not certify CI, authorize a production merge, alter Supabase, or remove any historical, accessibility, security, dependency, or CSS budget gate.

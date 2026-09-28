# M72 Certification Handoff

Baseline: M71 certified baseline.

Certification order: environment → artifact/source identity → clean dependencies → M72 static/deterministic → inherited Stage H gates → browser/E2E → dedicated certifier/release gate → post-certification state → historical regression → package hygiene → final checkpoint.

No PASS record or certified baseline is valid if any required gate fails.

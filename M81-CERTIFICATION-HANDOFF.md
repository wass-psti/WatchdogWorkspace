# M81 Certification Handoff

Prerequisite certified M80 baseline:
- ZIP SHA-256: `7e0f42e510d8f5189892171cddbed73f3a063e6b7a16a86b94a2d6bebb9e76ff`
- Source SHA-256: `978163479a590ec914f2c7574ed5710efeeb0734a3181584a0404934fafe5576`

M81 must be certified fail-closed in this order: environment → repository identity → dependencies → static/type/build → deterministic tests → browser/E2E → dedicated certification → post-certification state → historical regression → checksum/package hygiene/certified artifact → final checkpoint.

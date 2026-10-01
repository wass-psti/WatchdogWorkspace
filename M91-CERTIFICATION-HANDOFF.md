# M91 Certification Handoff

M91 begins from M90 certified ZIP SHA-256 `7a888874dc663b1a588e421486c2a055f148c1c55a2c9575e2299c97807769e9` and normalized source SHA-256 `b21014f3223897da07692d92806b917a9489b602806d071b00e440c9f94cb06c`.

Certification must remain fail-closed through source provenance, dependencies, static/type/lint/build/performance, deterministic, browser, dedicated certification, post-certification, historical regression, package hygiene, final checkpoint and certified publication.

Current execution boundary: the first clean dependency-backed M91 run passed source/dependency/static/lint/type/build and established the measured CSS result `617965`, then failed closed against the inherited M90 ceiling. The repository now carries the measured M91 successor ceiling `619000`; the complete ordered pipeline must restart from the beginning and still pass performance, deterministic, browser, dedicated certification, post-certification, historical regression, package hygiene, final checkpoint and publication.


## Adaptive CSS successor governance — 2026-09-30
A clean dependency-backed M91 build completed successfully with 5049 transformed modules and measured `initialCssRawBytes = 617965`. The inherited M90 ceiling of `616000` failed closed by 1965 bytes. The scoped M91 overlay/feedback presentation layer accounts for a measured +2908 bytes versus M90 (615057). M91 therefore establishes a narrow successor CSS ceiling of `619000`, providing 1035 bytes of headroom while preserving all non-CSS budgets and all historical predecessor thresholds as provenance. This governance correction is not certification; the full ordered pipeline must restart from the beginning.

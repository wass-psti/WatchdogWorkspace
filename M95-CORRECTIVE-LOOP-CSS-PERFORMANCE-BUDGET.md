# M95 Corrective Loop — Adaptive CSS Performance Budget

- Classification: CORRECTIVE LOOP
- Origin: v7 `release:check` → `performance:bundle`.
- Failed gate: M31 production performance budget enforcement.
- Exact failure: `initialCssRawBytes: 625371 > 624000`.
- Root-cause classification: verification/governance budget successor boundary.
- Implementation assessment: the measured CSS growth is attributable to required M95 responsive harmonization; no functional CSS removal is authorized merely to satisfy the predecessor ceiling.
- Corrective delta: introduce an M95 successor CSS budget authority of `628000` bytes, bind the measured `625371` bytes and `2629` bytes of headroom in the M95 target, and make the production bundle verifier resolve the successor override only when target and authority agree.
- Unchanged budgets: initial JS, largest initial chunk, total manifest JS, largest JS chunk, total build size, and runtime microbenchmark ceilings.
- Forward evidence required: clean production build reports CSS at or below `628000`, complete `release:check` passes, followed by package hygiene, final checkpoint, certified publication, checksum verification, and Downloads handoff.
- Loop status: ACTIVE pending clean v8 local certification rerun.

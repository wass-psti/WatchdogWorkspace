# M82 CSS Performance Budget Corrective — 2026-09-29

## Trigger
The M82 semantic-density browser corrective produced a clean Vite build with `initialCssRawBytes=590364`, exceeding the historical M31 ceiling of `590000` by exactly 364 bytes. All preceding environment, repository, dependency, static, lint, typecheck, and production-build gates passed before the fail-closed performance gate stopped the certification run.

## Root cause
The increase is attributable to required semantic-density aliases added to repair the M82 browser/runtime token contract. Removing those aliases would reintroduce the verified Browser/E2E defect where compact and comfortable density values both resolved to `0px`.

## Governed successor decision
M82 successor CSS ceiling: `591000`

The current M82 ceiling is increased by 1000 bytes (0.1695% relative to 590000) to retain the required semantic contract with 636 bytes of remaining headroom against the observed 590364-byte build. Historical M31/M72/M73/M79 records remain unchanged as provenance. All JS, chunk, total-build, and runtime performance budgets remain unchanged.

## Fail-closed rule
This document authorizes only the M82 successor CSS ceiling. It does not certify M82. The entire ordered certification pipeline must restart from environment preparation and pass through Browser/E2E, dedicated certification, post-certification state, historical regression, package hygiene, final checkpoint, certified artifact integrity, and PASS record generation.

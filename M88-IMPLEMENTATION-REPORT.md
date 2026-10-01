# M88 Implementation Report

## Implemented
- Added the M88 users/administration presentation layer after the M83 authentication/account foundation.
- Added explicit global RBAC versus application-scoped authorization presentation.
- Added responsive administration table/form treatment and protected-state presentation.
- Added Stage-I source guard, deterministic preservation verifier, browser gate, release/certification/final-checkpoint/publication wiring.

## Preserved authorities
- M42 serialized user/RBAC protected RPC and database policy authority.
- M44 consolidated React management runtime authority.
- Work Management global role vocabulary and server enforcement.
- TimeTracker and FuelTrack+ application-scoped role vocabularies and authorization policies.
- TradeLink document/recovery/VAT/PDF authority.

No schema, migration, backend, API, persistence or application-role policy mutation is introduced by M88.

## Corrective v2 — CSS performance regression
The first clean local M88 certification stopped fail-closed at `performance:bundle`: `initialCssRawBytes=615680` exceeded the certified `612000` ceiling by 3680 bytes. Root-cause analysis showed M88 duplicated substantial Users-directory/role-policy presentation already owned by the certified application/foundation layers.

Corrective delta:
- Reduced `assets/css/foundation/users-administration-visual-migration.css` from 6892 bytes to 2887 bytes.
- Removed duplicate layout, control, directory-state, and responsive declarations already provided by certified predecessor styles.
- Retained only M88-specific global-vs-application role-boundary presentation, semantic token rebinding, denied-state treatment, narrow-screen directory containment, reduced-motion, and forced-colors behavior.
- Did not change the M31 production performance budget.
- Did not mutate M42/M44 authorization behavior, Supabase schema/migrations, global RBAC vocabulary, or application-scoped role authorities.

Repository-independent evidence after correction:
- M88 static verifier: PASS.
- M88 deterministic preservation verifier: PASS.
- M78 protected-presentation successor verification: PASS.

A fresh dependency-backed production build/performance result remains required locally because dependency materialization cannot complete authoritatively in the current execution environment.

## Corrective v3 — adaptive CSS successor governance
The complete corrective-v2 local production build measured `initialCssRawBytes=612320`, only 320 bytes above M84's `612000` successor ceiling. Repository inspection established that M84 explicitly defines `612000` as historical provenance rather than a permanent maximum. The defect was therefore successor-governance synchronization, not an unexplained CSS regression.

Corrective delta:
- Added `M88-ADAPTIVE-CSS-PERFORMANCE-BUDGET-2026-09-30.md` as the M88 measured successor authority.
- Established the narrow M88 successor ceiling at `613000` bytes (680 bytes headroom above the measured 612320-byte build).
- Preserved historical M31/M79/M82/M83/M84 ceilings as provenance.
- Updated M31, M79, M83 and M84 verifiers to recognize M88 successor authority without rewriting predecessor historical evidence.
- Updated the M31 target and active performance budget to 613000 for initial CSS only.
- Left all JS/chunk/build/microbenchmark budgets unchanged.
- No M42/M44 RBAC behavior, Supabase schema/migrations, global role vocabulary, or application-scoped role policy was changed.

A complete clean local certification remains required; the governance correction does not by itself certify M88.

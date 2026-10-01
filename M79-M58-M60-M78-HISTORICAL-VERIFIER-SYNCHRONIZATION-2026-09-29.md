# M79 Historical Verifier Synchronization — M58 / M59 / M60 / M78

M79 intentionally mutates certified token/theme authorities, so historical verifiers that previously required those authorities to remain byte-identical must recognize the explicitly governed M79 successor boundary.

## Synchronization

- **M58 deterministic verifier:** retains the certified M58 alias set as a required subset and preserves tier/dependency invariants, while permitting M79 to add primitives and semantic aliases.
- **M59 deterministic verifier:** preserves every certified M58 semantic alias as a required subset, prevents primitive-token inventory reduction, preserves all M59 typography-role/content-flow/load-order guarantees, and permits only the M79-authorized successor evolution of the two M58 token authority files.
- **M60 static/deterministic verifiers:** retain theme-mode and persisted preference/runtime invariants, while delegating successor palette/contrast ownership to M79 when the M79 target is present.
- **M78 deterministic verifier:** continues byte/mode protection for the full M77 presentation baseline except the exact M79 token/theme files declared by the M79 successor. One new typed token-contract file is permitted inside `src/design-system`.

No authentication, authorization, persistence, routing, domain, database, or module-workflow verifier is weakened by this synchronization.

## M59 corrective synchronization (2026-09-29)

The first corrective certification passed the corrected M79 real-browser gate, then `release:check` exposed a stale M59 byte-identity assertion for `tokens.css` and `token-architecture.css`. M79 is the authorized successor for those authorities, so byte identity is no longer the correct invariant. The synchronized M59 verifier now enforces semantic subset/inventory preservation while retaining all M59 typography behavior and dependency-order checks. This does not authorize mutation of typography-system.css, typography primitives, application consumers, or domain/runtime behavior.

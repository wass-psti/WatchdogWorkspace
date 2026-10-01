# M79 Corrective Loop — Shell Theme Semantic Availability

## Origin

The M79 v4 local certification passed the unchanged M31 production CSS budget at exactly 590000 initial CSS bytes, then failed in `verify:ui` because the historical Shell SM1 verifier required each Shell semantic role to be physically duplicated in light, dark, and system-dark scopes.

## Root cause

M79 v4 intentionally hoisted mode-invariant Shell roles into the shared `:root` semantic authority to remove redundant runtime CSS without changing effective light/dark/system semantics. Historical Shell SM1/SM2/SM5/SM6 verification counted declarations rather than validating effective semantic availability.

## Corrective contract

The successor-aware Shell verification layer now enforces:

- M79 must be the governed successor authority before shared-root semantics are accepted.
- Every required Shell role must resolve in light, dark, and system-dark modes through either a shared `:root` definition or explicit per-mode definitions.
- Required roles may not be duplicated within any semantic scope.
- A mode override that is byte-identical to a shared value fails as redundant CSS.
- `var(...)` dependencies used by Shell semantic roles must resolve to a declared token/theme custom property.
- When M79 is absent, the historical three-scope physical-declaration contract remains active.

The correction covers the complete known historical Shell declaration-count surface: SM1 navigation, SM2 backdrop, SM5 account menu, and SM6 overlay/tooltip verification.

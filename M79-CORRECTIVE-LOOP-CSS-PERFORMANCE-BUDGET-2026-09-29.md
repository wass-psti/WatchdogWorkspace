# M79 Corrective Loop — CSS Performance Budget

## Failure
The v3 local certification progressed through static, deterministic, browser, historical Stage H, coverage, audit, TypeScript, hardening, UI, dev-server, and production-build gates, then failed closed at the M31 production bundle budget with `initialCssRawBytes=597728` against the unchanged `590000` byte ceiling.

## Root cause
M79 added centralized primitive/semantic token vocabulary while `themes.css` still repeated 37 mode-invariant semantic/shell declarations independently in light, dark, and system blocks. M79 also published successor aliases and palette steps that were not consumed by the current runtime or required for the M80+ migration boundary. The combination added avoidable initial CSS overhead.

## Corrective delta
- Hoist the 37 byte-identical light/dark/system roles into one mode-invariant `:root` authority.
- Preserve every mode-dependent role and all light/dark/system behavior.
- Retain the complete certified M58 alias subset and the M79 representative aliases required for semantic color, sizing, border, blur, density, breakpoint, and elevation ownership; remove unused duplicate successor aliases until their M80+ consumer milestones adopt them.
- Remove six unreferenced M79 palette steps while retaining all palette primitives required by current semantic roles, contrast verification, and browser validation.
- Keep the certified M31 `initialCssRawBytes` ceiling at `590000`; no performance budget increase or bypass is permitted.
- Extend M79 deterministic verification to bind the performance ceiling and merge mode-invariant declarations into light/dark/system semantic verification.

## Exit criterion
A clean production build must report `initialCssRawBytes <= 590000`, after which the entire M79 fail-closed certification pipeline must pass through post-certification state, historical regression, package hygiene, final checkpoint, certified ZIP, and PASS record.

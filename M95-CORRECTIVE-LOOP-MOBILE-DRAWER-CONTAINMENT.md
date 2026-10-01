# M95 Corrective Loop — Mobile Drawer Containment

## Classification
- Execution class: **CORRECTIVE LOOP**
- Origin: v8 `release:check` aggregate browser integration / final presentation viewport audit
- Failed checkpoint: mobile viewport presentation audit
- Exact failure: `Shell M2 mobile drawer stays within the viewport`
- Root-cause classification: **implementation / responsive CSS cascade**

## Root cause
`assets/css/shell-navigation.css` correctly caps the mobile navigation drawer at the semantic `--wm-shell-sidebar-mobile-width` (`304px`). A later-loaded rule in `assets/css/shell-accessibility.css` replaced that width with `calc(100vw - var(--wm-space-150))`. At a 390px mobile viewport this permits approximately 378px, violating the existing Shell M2 contract that the drawer remain at or below 305px.

The issue was not a breakpoint-family violation: both rules were already under the canonical M95 `40rem` narrow breakpoint. The defect was a cascade/geometry regression introduced by a later accessibility layer overriding the semantic drawer-width cap.

## Corrective delta
The accessibility-layer width now uses:

```css
width: min(var(--wm-shell-sidebar-mobile-width), calc(100vw - var(--wm-space-150)));
max-width: calc(100vw - var(--wm-space-150));
```

This preserves both requirements:
1. semantic drawer width never exceeds 304px on ordinary mobile viewports;
2. very narrow screens still shrink the drawer to remain within the viewport.

The M95 verifier now explicitly requires this semantic-width cap so later responsive/accessibility changes cannot silently widen the drawer again. No browser assertion was weakened.

## Forward evidence
- `verify-v1432-shell-primary-sidebar-sm2.mjs`: PASS
- `verify-stage-i-m95-cross-module-responsive-harmonization.mjs`: PASS
- `scripts/verify-stage-i-m95-cross-module-responsive-harmonization-execution.mjs`: PASS
- Canonical breakpoints remain 640/840/1120/1440px.

## Exit criterion
The loop is exited only when a clean local v9 certification run passes the same aggregate mobile presentation audit and every downstream release, package-hygiene, final-checkpoint, publication, checksum, and Downloads-handoff gate.

## Status
**ACTIVE — implementation corrected; local execution/certification remains.**

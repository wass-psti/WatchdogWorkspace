# M99 corrective loop — sidebar resizer minimal affordance — 2026-10-02

## Origin
After the M99 sidebar dropdown/resize corrective and hosted validation were fully certified, user validation identified an unnecessary informational tooltip on the sidebar resize boundary: “Drag to resize. Arrow keys use 8px steps; Shift uses 24px.”

## Corrective delta
- Removed only `data-shell-tooltip` and `data-shell-tooltip-placement` from the sidebar resizer.
- Preserved the resizer separator role, width bounds, ARIA value semantics, keyboard shortcuts, horizontal pointer drag lifecycle, persistence, and all prior M99 section/dropdown behavior.
- Added browser regression coverage proving hover/focus produces no shell tooltip while horizontal drag changes and persists width.
- Added a fail-closed static verifier for the minimal-affordance contract.

## Exit criterion
The loop exits only after the complete fail-closed M99 local Stage 1–11 certification passes against this successor candidate and subsequent hosted validation is green after publication.

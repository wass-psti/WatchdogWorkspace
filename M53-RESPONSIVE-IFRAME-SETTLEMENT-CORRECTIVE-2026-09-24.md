# M53 Responsive Iframe Settlement Corrective — 2026-09-24

## Origin
Candidate 02 passed the initial M53 browser hardening suite 6/6, then the unchanged suite failed when re-executed by the dedicated certification. The failing sample reported embedded viewport width 374 and document scroll width 532.

## Root cause classification
Certification-harness synchronization defect at the embedded iframe viewport transition boundary. The same unchanged browser suite passing and then failing on immediate re-execution demonstrates the previous one-shot measurement was not deterministic enough to distinguish transient post-resize layout propagation from persistent overflow.

## Correction
`assertFrameNoHorizontalOverflow` now:
- waits across double `requestAnimationFrame` layout turns;
- requires three consecutive samples inside the existing overflow tolerance before passing;
- retains fail-closed behavior if overflow persists through the bounded 1.8 second settlement window;
- records the active module id plus root/body scroll widths and the widest observed element in the failure message.

The no-horizontal-overflow threshold was not relaxed. Persistent overflow still fails certification.

## Exit condition
The corrected browser suite must pass both the explicit pre-certification run and the dedicated certification rerun, followed by post-certification state, historical regression, package hygiene and final checksum validation.

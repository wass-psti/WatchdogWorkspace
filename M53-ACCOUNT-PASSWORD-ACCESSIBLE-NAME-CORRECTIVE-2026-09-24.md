# M53 Account Password Accessible-Name Corrective — 2026-09-24

## Origin
M53 Candidate 01 local Playwright execution reached all six M53 hardening scenarios. Five passed. The `@m53-focus-accessibility` scenario failed because the Account password-change form exposed two password inputs without explicit native/ARIA naming under the M53 critical-control accessibility contract.

## Root cause
The Account form relied on placeholder text (`New password`, `Confirm password`) without native `<label>` associations. In addition, the M53 accessibility probe only recognized ARIA attributes, text, title, and alt text; it did not recognize valid native label associations through `HTMLInputElement.labels`.

## Corrective implementation
- Added explicit native labels for the new-password and confirm-password controls.
- Kept the labels visually hidden using the existing `wm-visually-hidden` primitive so the current layout remains stable while screen readers receive deterministic names.
- Added stable `id`/`htmlFor` associations.
- Hardened the M53 browser accessibility probe to recognize native label associations through `element.labels`.
- Hardened the M53 static verifier so both application labels and native-label-aware browser coverage are required.

## Boundary
No password-change behavior, authentication semantics, RBAC policy, backup/restore authority, service-worker policy, or performance budget was changed.

## Verification completed in checkpoint environment
- M53 static verifier: PASS.
- M53 execution vectors: PASS (11/11).
- M34 backup/disaster-recovery static + execution: PASS (41 assertions).
- M33 service-worker/update static + execution: PASS (37 assertions).
- M31 performance static verification: PASS.
- M52 static + execution vectors: PASS (9/9).
- High-confidence secret scan: PASS.

Local Playwright execution remains required for the corrected M53 browser suite and downstream fail-closed certification chain.

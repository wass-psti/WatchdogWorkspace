# M52 Playwright Board Card Locator Corrective — 2026-09-23

## Originating failure
Candidate 02 authenticated Playwright gate advanced beyond the corrected page-level `Boards` heading and then failed all four active host-role scenarios because `getByText('M52 Owner Board')` matched both the board card heading and a separate button label. The same generic-locator class also existed for Editor/Viewer names and the role labels Owner/Editor/Viewer.

## Classification
M52 test-harness implementation defect. No runtime RBAC failure was demonstrated by this condition.

## Corrective change
The host Boards matrix now scopes assertions to the three canonical fixture cards by stable `data-board-id`, then asserts each card's level-3 heading and exact role label within `.board-card-meta`. Menu-template capability checks are also scoped from those same cards.

This preserves and strengthens the intended authorization proof while removing strict-mode ambiguity. No RBAC expectation, route policy, board capability, module role mapping, or backend rule was relaxed.

## Exit condition
The corrected Candidate 03 must achieve 10/10 authenticated Playwright PASS, then complete build/dist/preview, dedicated M52 certification, post-certification state validation, historical 168/168, certified-payload hygiene, and final checkpoint validation.

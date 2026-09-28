# M73 CSS Performance Budget Corrective — 2026-09-27

## Originating gate
`npm run performance:bundle` during the first M73 local certification run.

## Failure
The production bundle reported `initialCssRawBytes: 590269`, exceeding the certified M31 ceiling of `590000` bytes by `269` bytes.

## Root cause
The M73 Board migration reconciliation stylesheet duplicated Board-owned geometry already expressed by the existing `boards-monday.css` selectors. The shared semantic classes still require two narrow resets (`wm-data-region` surface decoration and `wm-panel` padding), but the generic migrated-surface `min-width` reset and Board-card color reset were redundant because the certified Board presentation already owns those values with stronger selectors.

## Correction
The M73 bridge was reduced to the two required shared-primitive reconciliation rules and its deterministic source-size guard was tightened to `<= 400` bytes. The M31 production budget remains unchanged.

## Verification requirement
M73 is not certified until a clean local production build reports `M31 production bundle budgets: PASS` and the remaining fail-closed certification sequence completes.

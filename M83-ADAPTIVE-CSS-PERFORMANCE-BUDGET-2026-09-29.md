# M83 Adaptive CSS Performance Budget Governance

## Trigger
The first complete dependency-backed M83 corrective-v2 production build emitted `initialCssRawBytes = 596211`, exceeding the M82 successor ceiling of `591000` by 5211 bytes.

## Root cause and measured evidence
M83 intentionally adds the authentication/account presentation authority `assets/css/foundation/authentication-account-system.css` (6539 source bytes). The production CSS increase versus the M82-certified 590300-byte build is 5911 bytes, which is consistent with the required new visual-system layer after bundling/minification rather than unexplained CSS expansion.

## Governed successor decision
M83 successor CSS ceiling: `597000`

The 597000-byte ceiling provides 789 bytes of deterministic headroom above the measured 596211-byte M83 build. This is a narrow successor threshold, not a permanent global maximum. Future milestones may evolve it when legitimate styling, component, responsive, animation, accessibility, or design-system requirements justify measured growth.

## Invariants
- Required M83 authentication/account styling must not be deleted, simplified, disabled, or semantically compromised solely to satisfy the historical M82 ceiling.
- Historical M31/M79/M82 budget records remain provenance and are not rewritten.
- All non-CSS bundle budgets remain unchanged.
- Any future ceiling increase remains evidence-based and milestone-governed.
- This authorization does not certify M83; the complete ordered fail-closed certification pipeline must restart from environment preparation and pass all required gates.

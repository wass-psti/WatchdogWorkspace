# M95 Adaptive CSS Performance Budget

M95 extends the certified M94 visual system with cross-module responsive harmonization across the host shell, Boards, TimeTracker, FuelTrack+, and TradeLink. The milestone deliberately consolidates module-specific responsive thresholds into one governed breakpoint family and must retain the CSS required for responsive behavior, accessibility, safe-area handling, dense-region overflow, and module parity.

- Inherited M93 successor CSS ceiling: `624000` bytes.
- M95 measured initial CSS from the v7 clean production build: `625371` bytes.
- M95 successor CSS ceiling: `628000` bytes.
- Headroom after the measured M95 build: `2629` bytes.
- Budget change classification: adaptive governed successor increase for required cross-module responsive harmonization.
- JavaScript, chunk, and total-build budgets: unchanged.
- Historical `config/performance-budgets.json` M93 CSS ceiling remains preserved as provenance; M95 applies an explicit successor override only when this authority and the M95 target agree.

This increase does not authorize removal, compression-by-deletion, or weakening of required responsive CSS solely to satisfy the predecessor M93 ceiling. The M95 production bundle gate must fail closed if this authority, the M95 target values, or the effective successor ceiling disagree.

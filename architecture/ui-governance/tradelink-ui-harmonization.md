# M76 TradeLink UI Harmonization Architecture

M76 harmonizes the active TradeLink v1.42.0 WM1 presentation with the certified Stage H design system without changing commercial-document calculations, workflow assignments, PDF generation, template snapshots, recovery/import/export, authenticated cloud persistence, or module-bootstrap authorities. Shared semantic classes are additive. `styles.v1.42.0-wm1.css` remains the product-style authority; `m76-harmonization.css` is a bounded downstream reconciliation layer.

## Ownership
- Presentation: `apps/tradelink/app.v1.42.0-wm1.js`
- Product styling: `apps/tradelink/styles.v1.42.0-wm1.css`
- Domain policy: `apps/tradelink/domain-config.js`
- Persistence/stability: `apps/tradelink/stability-runtime.js`
- Host identity/bootstrap: Work Management module bootstrap and cloud identity context
- Successor: M77 final UI production certification

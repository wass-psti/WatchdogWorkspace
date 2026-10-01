# M84 Adaptive CSS Performance Budget

M84 adds `assets/css/foundation/boards-visual-migration.css` as a required Board-only presentation authority.

- M83 measured production CSS: `596211` bytes.
- M83 governed ceiling: `597000` bytes.
- M84 new Board visual source CSS: `15181` bytes before Vite production processing.
- M84 successor CSS ceiling: `612000` bytes.

The 612000-byte ceiling is a bounded successor budget that allows the required M84 source addition without deleting functional/responsive/accessibility presentation merely to retain the predecessor ceiling. It is not a claim that the production artifact is exactly 612000 bytes. The clean local production build remains the authoritative measurement and must pass `performance:bundle`. Future milestones must treat this ceiling as historical provenance, not a permanent limit. Unrelated JS/chunk/build budgets remain unchanged.

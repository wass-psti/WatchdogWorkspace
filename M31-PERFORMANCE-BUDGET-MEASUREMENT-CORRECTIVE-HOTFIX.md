# M31 Performance Budget Measurement Corrective Hotfix

The prior M31 production-budget verifier had two defects: it passed a `URL` object to `path.join()`, and it labeled all emitted JavaScript/CSS as `initial` even though Vite already emits a manifest that distinguishes the entry's static import closure from dynamic routes/secondary entries.

This corrective revision:

- converts filesystem URLs before path operations;
- reads `dist/.vite/manifest.json`;
- identifies the `index.html` entry and recursively follows only `imports` for the initial JavaScript/CSS closure;
- excludes `dynamicImports` from initial-route metrics;
- separately measures all manifest JavaScript and the largest emitted JavaScript chunk;
- retains total deploy-output bytes as a separate whole-build budget;
- adds a dependency-free fixture verifier that exercises URL roots, static-vs-dynamic manifest traversal, deduplication, and budget enforcement;
- replaces the full ECharts namespace import with the official tree-shakeable ECharts core/BarChart/Grid/Tooltip/Canvas registration;
- carves ECharts/zrender into an entry-aware analytics vendor group and makes the platform group entry-aware with a 500 kB split target.

Observed pre-corrective Mac build evidence was approximately 2,109,810 bytes of emitted JS, 566,180 bytes of initial CSS, and a 1,246,390-byte `platform` chunk. Those values are recorded only as provenance. The release gate measures the newly built `dist` and must meet the corrective budgets; the thresholds are not raised to the previous 1.246 MB chunk.

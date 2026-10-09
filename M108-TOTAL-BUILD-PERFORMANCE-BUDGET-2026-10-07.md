# M108 Total-Build Performance Budget Successor Authority — 2026-10-07

This authority changes only the aggregate deployable-build byte ceiling needed for the intentional addition of Material Tracker as the fourth Work Management application runtime. It does not relax startup/runtime-sensitive bundle limits.

- Inherited M31 total-build ceiling: `6500000`
- M108 measured total build from the clean four-module production build: `6676860`
- M108 successor total-build ceiling: `6700000`
- Headroom after the measured M108 build: `23140`

Unchanged performance ceilings:
- Initial JS raw bytes: `650000`
- M95 successor initial CSS raw bytes: `628000`
- Largest initial JS chunk raw bytes: `420000`
- Total Vite-manifest JS raw bytes: `1800000`
- Largest any JS chunk raw bytes: `600000`

Measured M108 evidence showed `initialJsRawBytes=15251`, `initialCssRawBytes=625677`, `totalManifestJsRawBytes=1731052`, and `largestAnyJsChunkRawBytes=522420`; all runtime-sensitive ceilings remained within their existing limits. The only exceeded historical limit was aggregate `totalBuildRawBytes`, after adding the separately built same-origin Material Tracker runtime to the deployable `apps/` surface.

The historical `config/performance-budgets.json` value remains unchanged. `scripts/verify-performance-budgets.mjs` may activate this successor ceiling only when this authority, the M108 corrective authority, and the Material Tracker module registry entry are all present. Otherwise it must use the historical `6500000` ceiling.

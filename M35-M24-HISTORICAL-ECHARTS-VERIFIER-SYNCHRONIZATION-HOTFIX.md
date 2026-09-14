# M35 / M24 Historical ECharts Verifier Synchronization Hotfix

## Scope

M35's complete historical `npm run check` exposed a stale Stage E M24 verifier assertion. The assertion still required the original monolithic `from 'echarts'` import even though Stage F M31 Performance Engineering had already converted the production FuelTrack+ analytics runtime to the certified tree-shakeable ECharts 6.1.0 entry points.

## Correction

`verify-stage-e-m24-fueltrack-stabilization.mjs` is architecture-aware:

- Architecture < 39 validates the original M24 monolithic ECharts import authority.
- Architecture >= 39 validates the M31-certified tree-shaken authority: `echarts/core`, `echarts/charts`, `echarts/components`, and `echarts/renderers`, including registration of `BarChart`, `GridComponent`, `TooltipComponent`, and `CanvasRenderer`.
- The exact ECharts 6.1.0 package/lock authority, route-lazy loading marker, reduced-motion behavior, stable same-origin Vite entry, service-worker handling, and third-party notices remain mandatory.

## Non-changes

This synchronization changes no FuelTrack+ production runtime, embedded application source, dependency version, package lock, database schema, migration, or M35 deletion decision. It removes only a stale historical-verifier assumption that contradicted the already-certified M31 performance architecture.

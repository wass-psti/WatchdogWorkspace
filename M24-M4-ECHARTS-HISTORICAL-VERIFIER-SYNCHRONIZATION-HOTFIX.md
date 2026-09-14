# M24 / M4 ECharts historical verifier synchronization hotfix

The authoritative macOS M24 certification passed exact dependency installation, M24 preflight, ESLint, strict TypeScript, FuelTrack+ regressions, CDP, dev/build/dist/preview, and entered the complete release gate. The first failure was the historical Stage B M4 verifier, which still treated `echarts` as an unconditional later-milestone prohibition even though Stage E M24 is the milestone that now governs the exact `echarts@6.1.0` runtime dependency.

This hotfix does not change FuelTrack+ production behavior, Analytics behavior, the dependency graph, Supabase schema, or Architecture 32. It synchronizes the historical M4 verifier with the governance pattern already used for later M6/M8/M9 dependencies: ECharts is permitted only when the M24 target exists, declares the exact dependency, and package/package-lock ownership matches that target. The M24 verifier now protects this synchronization contract.

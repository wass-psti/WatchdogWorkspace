# Release status — Stage E M26 Iframe retirement

- Version: 1.43.2
- Architecture: 34
- State: implementation-complete-pending-certification
- Prerequisite: M25 active-certified
- Host presentation model: hybrid native-host / same-origin-iframe
- Justified iframe retirements: 0
- Retained compatibility islands: TimeTracker, FuelTrack+, TradeLink
- Unsafe full-document DOM injection: prohibited
- Native adapter registry: implemented
- Direct host identity path for future native adapters: implemented
- New external dependency: none
- Supabase migration: none

M26 is complete at the implementation level when the hybrid presentation path and retirement policy are release-gated and every retained module has explicit blockers. It does not claim a retirement where native presentation parity does not exist.


## Final native-host hardening

- Future native adapters receive a module-scoped normalized-data port; they cannot select another module ID through the host service.
- Native mount failures publish the existing `module:error` lifecycle event and release presentation ownership with `module:disposed`.

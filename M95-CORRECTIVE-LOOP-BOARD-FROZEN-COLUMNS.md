# M95 Corrective Loop — Board Main Table Frozen Columns

- **Execution class:** CORRECTIVE LOOP
- **Origin:** v10 `release:check` aggregate browser integration suite.
- **Failed gate:** Main Table Milestone 4 browser audit at the 820×980 compact workspace case.
- **Exact failure:** `Main Table Milestone 4 audit: desktop selection column is frozen at the left edge`.
- **Root-cause classification:** implementation / responsive breakpoint ownership.
- **Root cause:** the M4 narrow fallback that releases selection/drag sticky utility columns had been normalized to the 840px tablet boundary. The retained M4 browser contract intentionally keeps the frozen identity band for widths above the narrow threshold, including 820px.
- **Corrective delta:** move only the M4 frozen-column release fallback in `assets/css/boards-monday.css` from `max-width:52.5rem` to the canonical narrow breakpoint `max-width:40rem`; preserve the distinct 840px tablet composition rules elsewhere.
- **Test policy:** no browser assertion is weakened, skipped, or rewritten to hide the regression.
- **Forward evidence required:** unchanged M4 browser audit must pass at 820px, followed by the remaining aggregate release, package-hygiene, final-checkpoint, publication, checksum, and handoff gates.
- **Loop status:** ACTIVE pending local v11 execution.

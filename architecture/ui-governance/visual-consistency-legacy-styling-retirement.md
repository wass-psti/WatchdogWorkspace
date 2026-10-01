# M96 Visual Consistency & Legacy Styling Retirement

M96 retires presentation-only bridge layers that remained live after their Stage-I successors became authoritative. Retirement is permitted only when each still-effective declaration is transferred to the current owner, dead declarations are dropped, historical semantic verifiers are made successor-aware, and runtime behavior remains unchanged.

## Retired runtime styling paths

- `assets/css/foundation/host-ui-migration.css` → M95 responsive authority.
- `assets/css/foundation/boards-ui-migration.css` → M84 Boards visual authority.
- `apps/time-tracker/m74-harmonization.css` → M85 TimeTracker visual authority.
- `apps/fueltrack-plus/m75-harmonization.css` → M86 FuelTrack+ visual authority; its data-region minimum-width rule is already owned globally by M95 and is not duplicated.
- `apps/tradelink/m76-harmonization.css` → M87 TradeLink visual authority; the old documents-table reset was already superseded by M87 and is deleted rather than copied.

M96 also retires the M74/M75/M76 transitional harmonization attributes and four custom properties with no runtime or verification consumer.

No schema, migrations, backend API, authentication, authorization, persistence, route ownership, domain workflow, or application business logic is changed by this milestone.

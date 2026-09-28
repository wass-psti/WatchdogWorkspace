# M56 UI Migration Register

This register identifies future migration ownership. It does not declare any live path deprecated.

| ID | Current authority | Classification | Planned milestone | M56 disposition |
| --- | --- | --- | --- | --- |
| UI-01 | `src/design-system` | authoritative-shared | M57-M64 | retain; govern |
| UI-02 | `assets/css/foundation` | authoritative-shared | M57-M64 | retain; govern |
| UI-03 | `src/app/auth`, `src/app/management`, `src/app/shared-ui` | authoritative-host | M65/M67/M72 | retain; govern |
| UI-04 | `src/app/shell` + shell CSS | authoritative-host | M62/M63/M68/M71/M72 | retain; govern |
| UI-05 | overlay/floating runtime | compatibility-authority | M63/M66/M72 | retain until consumer migration is proven |
| UI-06 | typed imperative UI/runtime feature paths | compatibility-authority | M64-M73 | retain until consumer migration is proven |
| UI-07 | Boards presentation paths | authoritative-host | M69/M71/M73 | retain; feature-specific migration |
| UI-08 | shared motion runtime/CSS | compatibility-authority | M58/M63/M71 | retain; consolidate later |
| UI-09 | TimeTracker module UI | module-specific-authority | M74 | retain |
| UI-10 | FuelTrack+ module UI | module-specific-authority | M70/M75 | retain |
| UI-11 | TradeLink module UI | module-specific-authority | M76 | retain |
| UI-12 | historical UI/browser/certification gates | verification-authority | M77 | retain throughout program |

## Retirement requirement

A later milestone may remove a compatibility path only after it establishes all of the following:

1. the replacement authority is explicit;
2. production consumers are migrated;
3. no runtime import/reference depends on the path being removed;
4. browser/E2E coverage includes the affected interaction;
5. accessibility and responsive behavior remain valid where applicable;
6. historical regression gates pass;
7. package/build/deployment verification passes.

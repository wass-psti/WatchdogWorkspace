# M108 — Material Tracker dependency-security corrective

Predecessor: M107 Material Tracker integration checkpoint, SHA-256 `df8cfc1b0f77cfa5f6d2350a59418af76815676fafdd472e37bbcc4fae9bf0cb`.

Scope: remove the M107 isolated Material Tracker build-toolchain high-severity dependency findings without changing Material Tracker runtime/domain dependencies, Work Management host dependencies, authentication, Supabase contracts, RBAC, routing, or persistence behavior.

Corrective architecture:
- Tailwind 3 build tooling -> Tailwind 4.3.3 + `@tailwindcss/vite` 4.3.3.
- Vite 5 -> Vite 8.3.3.
- `@vitejs/plugin-react` -> 6.1.2.
- transitive `source-map-js` -> exact patched 1.2.2 through npm `overrides`.
- React remains 18.3.1.
- Runtime dependencies remain unchanged.
- Tailwind preflight remains disabled; legacy theme configuration remains explicitly loaded.
- No audit waiver or vulnerability suppression is used.
- Work Management root ESLint excludes only `integrations/material-tracker/**`; the isolated Material Tracker tree remains governed by its own integration/static/deterministic/regression/import-export gates, avoiding cross-package plugin/dependency coupling.
- M60 historical execution under active M79 successor authority verifies the theme-preference runtime semantically instead of hashing the entire `platform.ts`; exact settings-runtime hashing remains. This permits later certified non-theme platform diagnostics without weakening theme persistence/application invariants.
- M74–M76 historical harmonization execution preserves exact hashes for all product/domain authorities but verifies the shared module bootstrap semantically under the M108 successor, allowing the certified Material Tracker module-id extension without weakening identity/cloud-store/lifecycle/same-origin bootstrap invariants.
- M26 iframe-retirement execution preserves the original three-module historical target artifact while validating explicit retain-iframe metadata for all currently registered iframe modules, including Material Tracker. No module is falsely marked native-host or retired.
- The v1.38 TypeScript runtime verifier treats `moduleDefinitionsById` as a current authoritative registry and therefore validates all four current modules, including Material Tracker, while historical milestone-specific three-module fixtures remain unchanged.
- M83 authentication/session preservation remains fail-closed: every pre-existing authority except the two Material Tracker-touched vocabulary files stays byte-exact; `auth.ts` and `permissions.ts` are normalized only for the certified Material Tracker module-id, app-scoped role vocabulary, and administrator-display-role additions, and the normalized bytes must reproduce the original M82 SHA authorities.
- v1.22 architecture restructuring verification preserves all original runtime-gateway/bootstrap/manifest invariants while validating the exact current four-module registry (`time-tracker`, `fueltrack-plus`, `tradelink`, `material-tracker`) instead of the obsolete pre-integration cardinality of three.
- M78 protected-presentation execution keeps every M77 protected file byte/size exact except the shared `module-bootstrap.ts`; under M108 it normalizes only the certified Material Tracker module-id addition and requires the normalized bytes and size to reproduce the original M77 manifest authority.
- M108 preserves the historical M31 `totalBuildRawBytes` ceiling of `6500000` as provenance but authorizes a successor four-module ceiling of `6700000` after a measured clean production build of `6676860` bytes. All initial-JS, CSS, chunk, and manifest-JS ceilings remain unchanged. M108 successor total-build ceiling: `6700000`.
- Source governance runs only after reproducible nested install/build outputs are removed; generated node_modules/dist/app-runtime files are not repository source.

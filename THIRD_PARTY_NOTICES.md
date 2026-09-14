# Third-Party Source References

Work Management v1.22.0 and subsequent architecture releases were restructured using architectural concepts from source packages supplied by the project owner:

- `monday-sdk-js` — MIT License. The Work Management runtime client adapts the general `listen/get/set/execute` API shape and listener/service-boundary concept. It does not include monday.com API endpoints, OAuth behavior, analytics, or background tracking.
- `monday-ui-style` — MIT License. The Work Management CSS foundation adapts the concept of separating theme-independent core tokens from theme-specific semantic mappings. Work Management retains its own token names, palette, component styles, and visual identity.

No monday.com trademarks, hosted services, credentials, or proprietary backend APIs are required by Work Management.

Work Management v1.35.0 adds no new third-party runtime dependency. The query, repository, capability, diagnostic, error-boundary, and overlay abstractions in this release are project-owned ES modules. Future library candidates documented in the architecture evaluation are recommendations only and are not bundled in v1.35.0.

Work Management v1.36.0 introduces **Vite 8.2.2** as a development/build dependency under the MIT License. Vite is not an application runtime framework; it provides the development server and production bundling pipeline. The production build can emit `.vite/licenses.md` through Vite's `build.license` option for bundled dependency notices. No additional application-runtime framework is introduced by the v1.36.0 migration.
## TypeScript

Work Management v1.37.0 adds **TypeScript 5.8.3** as a development/type-checking dependency under the Apache License 2.0. TypeScript is used incrementally for compile-time contracts and Vite-compatible source migration; it does not add an application runtime framework.

## React 19.2 composition boundary

Work Management Stage B Milestone 3 introduces **React 19.2.8** and **React DOM 19.2.8** as application runtime dependencies under the MIT License. React is intentionally limited in this milestone to the top-level composition boundary that owns the `#app` container; the existing Work Management TypeScript presentation/runtime remains isolated beneath that boundary until later Stage B migrations.

The development type packages **@types/react 19.2.18** and **@types/react-dom 19.2.5** are also included under their published MIT licenses. Their transitive `csstype` type dependency is MIT licensed.

## Stage B Milestone 4 React Design System target

Stage B Milestone 4 targets **@chakra-ui/react 3.36.1** and **@emotion/react 11.14.0**, both under the MIT License, as implementation dependencies beneath the Work Management-owned React Design System boundary. The M4 activation workflow installs them only through npm with exact versions and lockfile integrity, then performs TypeScript and production release verification before the milestone can be marked certified.

## Stage B Milestone 5 governed interaction targets

- Ark UI React (`@ark-ui/react`) — target 5.39.1 — MIT
- Floating UI React (`@floating-ui/react`) — target 0.27.20 — MIT
- Lucide React (`lucide-react`) — target 1.41.0 — ISC

These remain Work Management implementation dependencies behind the product-owned primitive interaction and icon APIs. Feature code must not import them directly. Runtime installation and lockfile entries become authoritative only through the governed M5 activation workflow.

## Stage B Milestone 6 runtime schema authority

Stage B Milestone 6 introduces **Zod 4.5.4** under the MIT License as the runtime-validation implementation beneath the Work Management-owned `src/runtime-schemas/` authority. Application features, embedded modules, and platform code consume Work Management schema exports rather than importing Zod directly. Zod validates untrusted runtime values at external trust boundaries; TypeScript remains the compile-time authority and domain-specific business invariants remain in their existing domain/service/database layers.

## Stage B Milestone 8 TanStack Query

Stage B Milestone 8 introduces **@tanstack/react-query 5.102.8** and its exact transitive runtime dependency **@tanstack/query-core 5.102.8**, both under the MIT License. TanStack Query is used as the Work Management server-state cache and synchronization engine beneath a product-owned compatibility facade. The application does not use TanStack Query to replace Supabase authorization, authentication/session ownership, domain validation, or database policy.


## Stage B Milestone 9 Zustand

Stage B Milestone 9 introduces **zustand 5.0.15** under the MIT License. Work Management uses the framework-neutral `zustand/vanilla` store as a scoped shared client-state engine. It does not replace TanStack Query server state, Supabase authentication/session authority, Supabase domain persistence, feature-local UI state, or form workflow state.

## Stage E Milestone 24 FuelTrack+ Analytics

FuelTrack+ Analytics uses **Apache ECharts 6.1.0** as an exact-pinned, route-lazy visualization dependency. Apache ECharts is licensed under the Apache License 2.0. Its exact runtime dependencies are **ZRender 6.1.0** (BSD-3-Clause) and **tslib 2.3.0** (0BSD). These packages remain behind the Work Management-owned FuelTrack Analytics runtime boundary and are not used as authentication, authorization, persistence, or business-rule authorities. The production build retains bundled third-party license notices through Vite's generated license artifact.

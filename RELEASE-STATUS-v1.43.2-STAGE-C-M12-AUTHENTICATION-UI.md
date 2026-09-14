# v1.43.2 — Stage C Milestone 12 Authentication UI

**State:** implementation-complete-pending-certification  
**Architecture Version:** 22  
**Prerequisite:** Stage C M11 Global Overlays `active-certified`

## Implemented

- Added a React-owned standalone authentication UI for boot, login, registration, email verification/recovery, and disabled-account presentation.
- Added a page-lifetime authentication UI runtime bridge with safe transient state and `useSyncExternalStore` subscription.
- Kept Supabase Auth/session/token/profile behavior in the existing typed core auth authority.
- Removed imperative authentication form/render/event ownership from the legacy auth feature and converted it into a non-rendering compatibility facade.
- Routed authentication views through the React shell while keeping the legacy route-content host mounted but hidden/inert.
- Preserved M11 global overlay roots on standalone authentication routes.
- Advanced manifest/type/runtime-schema enforcement to Architecture Version 22.
- Added M12 execution vectors, historical auth verifier synchronization, Vite login-route ownership checks, Chromium runtime assertions, activation/status scripts, CI/deployment gates, and Stage C certification integration.

## Preserved authorities

- M11 Global Overlays remains `active-certified`.
- M10 React Shell remains `active-certified`.
- M9 Zustand remains scoped shared client-state authority.
- M8 TanStack Query remains server-state authority.
- Supabase Auth remains identity/session/token authority.
- Supabase Postgres/RPC/Storage and RLS remain persistent-domain and authorization authorities.

## Temporary compatibility boundaries

- Authenticated Account/Profile and User Management screens remain existing typed feature compatibility content.
- Non-authentication host features remain inside the M10 legacy route-content island.
- Feature-specific overlay content may remain imperative within the M11 React-owned global roots.
- Embedded TimeTracker, FuelTrack+, and TradeLink remain isolated runtimes consuming host identity.

## Database

No Supabase migration is required for M12.

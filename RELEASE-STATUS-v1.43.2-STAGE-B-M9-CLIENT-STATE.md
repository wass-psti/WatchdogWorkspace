# Release Status — Work Management v1.43.2 — Stage B M9 Client-state Ownership Model

**State:** active-certified  
**Architecture:** Version 19  
**Runtime dependency:** `zustand@5.0.15` (exact)  
**Prerequisite:** M8 TanStack Query Migration `active-certified`

M9 establishes a scoped client-state ownership model and migrates shared shell client state to a page-lifetime Zustand vanilla store. TanStack Query remains server-state authority, Supabase/Auth remain backend/session authorities, and feature-local/form/derived state remain outside the global client store.

## Implemented

- typed ownership contract for eight state classes;
- exact-governed Zustand runtime dependency;
- page-lifetime shell client-state service;
- persistent shell preference hydration without transferring persistence authority to Zustand;
- shell navigation / section / resource-search migration;
- removal of the shell sidebar Board-record mirror so Board rows and query metadata are read from the TanStack Query authority;
- shared Board list query-key contract and read-only query-state metadata access;
- transient client-state reset on authorization-context changes;
- React subscription bridge sharing the same store;
- M9 verifier, execution vectors, status, activation and Stage B certification integration;
- CI and deployment M9 gates;
- Architecture Version 19 manifest/runtime-schema contract.

## Compatibility boundaries

- Board interaction/editor state remains feature-local.
- Home search/favorites filter remains feature-local.
- Existing shell preference localStorage keys remain unchanged.
- Embedded TimeTracker, FuelTrack+, and TradeLink keep their isolated application-scoped state models.
- TanStack Query compatibility facade remains in place for server-state repositories.

No Supabase migration is required.


## Certification carried forward into Stage C M10

The authoritative Mac release-certification run completed M9 as `active-certified` before Stage C began. The M10 package therefore carries the certified M9 target state forward as its prerequisite baseline.

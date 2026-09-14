# Release Status — v1.43.2 Stage C M14 Command Palette and Shared Application UI

- **Milestone:** Stage C M14 — Command Palette and Shared Application UI
- **Architecture Version:** 24
- **Package state:** `implementation-complete-pending-certification`
- **Prerequisite:** M13 `active-certified`
- **Supabase migration:** none

## Implemented

- React-owned command palette mounted inside the M11 page-lifetime overlay root.
- Shared external-store runtime for command-palette state, toast queue, and service-worker update state.
- Existing typed command registry retained as the command-definition/filter/execution authority.
- Imperative command feature reduced to a trigger/registry adapter without DOM rendering authority.
- Global shell toast calls route through the M14 shared UI runtime.
- Service-worker update banner presentation routes through React.
- Browser/runtime/static/release certification coverage added.

## Certification state

Implementation is complete. Production release certification must promote M14 through `active-pending-release-certification` to `active-certified` using the governed M14 certification entrypoint.

## Certification browser-harness syntax hotfix

The governed Mac certification exposed one late parser defect in `tests/browser/run-cdp.mjs`: the M14 command-palette integration vector used a nested template literal inside the outer `String.raw` browser program. The hotfix replaces that nested template literal with equivalent string concatenation and adds a fail-fast `node --check tests/browser/run-cdp.mjs` assertion to the focused M14 verifier. A repository-wide `node --check` audit of shipped `.js`/`.mjs` files found no other syntax failures. M14 remains `implementation-complete-pending-certification` until the complete governed certification succeeds.

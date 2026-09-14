# Work Management App v1.43.2 — Shell Collapse Control Stable-Anchor Hotfix

## Status

**Implementation complete.** The Shell M8 collapse/expand control now keeps one stable desktop header coordinate when the navigation transitions between expanded, compact, pinned, unpinned and hover/focus-preview states.

This hotfix continues from `Work-Management-App-v1.43.2-Shell-M8-Collapse-Control-Hotfix-RC.zip`.

## Root cause

The collapse button was absolutely positioned against the current sidebar panel width. Shell M4 intentionally changes that panel width between the saved expanded width and the 60px compact rail. As a result, the control moved with the transient sidebar edge. Its previous pressed-state margin also changed the button coordinate slightly.

## Correction

- Desktop collapse/expand control is now viewport-stable and anchored to the persisted expanded sidebar width (`224–360px`, user preference).
- Compact, pinned, unpinned and preview state changes no longer change the button's `left/top` coordinate.
- Custom sidebar resizing intentionally moves the anchor because the user has explicitly changed the saved expanded width.
- Compact-state direction change rotates only the chevron/icon; the button element itself is not transformed.
- Pressed feedback is visual only (shadow), with no margin/translation offset.
- Coarse-pointer desktop geometry receives the same stable-anchor treatment while retaining the 44px control target.
- Tablet and mobile navigation behavior remain unchanged.

## Verification

`npm run check` — **PASS**

This includes:

- TypeScript `tsc --noEmit`
- TypeScript architecture/runtime gates
- Vite static architecture gate
- production hardening
- Boards M1–M8
- Shell M1–M8
- prior Collapse Control hotfix verifier
- new stable-anchor hotfix verifier
- complete project verifier
- Chromium interaction/responsive/accessibility suite
- TimeTracker regression gates
- FuelTrack+ regression gates
- TradeLink regression gates

The Chromium presentation audit now measures the collapse control before and after state transitions and verifies that its desktop `left/top` coordinates remain stable through:

1. expanded + pinned,
2. compact + unpinned + preview,
3. compact + unpinned without preview.

## Exact change scope from previous Collapse Control Hotfix RC

### Modified

- `assets/css/shell-navigation.css`
- `tests/browser/run-cdp.mjs`
- `package.json`
- `CHECKSUMS.sha256`

### Added

- `verify-v1432-shell-collapse-anchor-hotfix.mjs`
- `RELEASE-STATUS-v1.43.2-SHELL-COLLAPSE-ANCHOR-HOTFIX.md`

No TimeTracker, FuelTrack+, TradeLink, Supabase schema/migrations/RLS/RPC, authentication-contract, host-RBAC, Board repository/domain-service, or module-authorization source was changed.

## Compatibility boundaries

- The control remains linked to the existing `data-shell-navigation-toggle` command and current expanded/compact/pin/preview state model.
- Sidebar custom width remains authoritative for the fixed desktop anchor. Resizing the sidebar therefore intentionally repositions the control to the newly selected expanded boundary.
- Tablet keeps the 60px compact rail and hides this desktop control as before.
- Mobile keeps the off-canvas drawer behavior and existing mobile close/open controls.
- Monday/Vibe remain design references only; no runtime dependency was introduced.

## Production-artifact boundary

The source/runtime/browser implementation is verified, but this container still cannot run the production Vite artifact gate because the local Vite executable is unavailable:

```text
> vite build
sh: 1: vite: not found
```

On a dependency-enabled workstation run:

```bash
npm ci
npm run release:check
```

If that succeeds, no further collapse-control implementation pass is required.

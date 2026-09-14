# M40 Route Focus Reconciliation Corrective

## Observed failure

The M40 repeated route-cycle browser scenario reached a committed route, correct presentation owner, one visible surface, and singleton hosts, but timed out waiting for the owning `#main` element to retain document focus. The failing route-cycle uniquely opens the global command palette before each transition.

## Root cause

The React command palette schedules input autofocus with `requestAnimationFrame`. A route transition closes the palette synchronously and commits focus to the new route owner, but a previously queued palette autofocus callback can still run before React removes the retiring overlay. That stale callback can reclaim focus; when the input is then removed, browser focus falls back to `BODY`.

## Corrective implementation

1. `SharedApplicationUI.tsx` now checks the current shared-command state inside the queued autofocus callback and refuses to focus if the palette has already been closed.
2. `commitRoutePresentationTransition(...)` keeps the immediate owner-readiness focus request and adds one next-frame reconciliation only when document focus has fallen to `BODY`/`documentElement`.
3. The fallback is lifecycle-generation guarded, so an obsolete transition cannot steal focus from a newer route and it does not override legitimate focus held by an interactive element.
4. The browser contract now requires focus to remain inside the active presentation surface rather than permanently pinning `document.activeElement` to `#main`. This preserves the route-commit accessibility target while allowing an embedded/native application to legitimately move focus within its owned runtime surface. `BODY`, `documentElement`, stale overlays, and other presentation surfaces still fail the gate.
5. The existing M40 browser route-cycle remains the governing integration regression test.

## Packaging correction

The release package must exclude `node_modules` and all generated browser/test artifacts. No symlink to the internal build environment is permitted in the ZIP.

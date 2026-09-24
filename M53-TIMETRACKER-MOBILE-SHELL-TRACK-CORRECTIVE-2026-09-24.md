# M53 TimeTracker Mobile Shell Track Corrective — 2026-09-24

## Originating failure
Candidate 05 local M53 Playwright repeated the TimeTracker mobile overflow at an embedded viewport width of 375px with root/body `scrollWidth=532`. The Clock card was reported as the widest measured surface because its own internal `scrollWidth` was larger, but Candidate 05 did not change the 532px document width.

## Root cause
The document-level 532px width originates one level above Clock. When the TimeTracker v2 shell collapses below 960px, `.app-shell.tt-v2-shell` used a single `1fr` grid track. The horizontal navigation rail contains seven non-shrinking tab buttons. Their min-content width is approximately 532px. CSS Grid's automatic minimum track sizing therefore allowed the single `1fr` track to grow to the navigation rail's min-content width, widening the rail, header, main region, Clock card and document together.

A controlled Chromium geometry reproduction against the actual TimeTracker stylesheet cascade reproduced the terminal value exactly: viewport 390px -> shell/rail/main track 532px -> root/body `scrollWidth=532`. This demonstrates that the Clock card was a downstream symptom rather than the source.

## Corrective change
- responsive TimeTracker shell track now uses `minmax(0, 1fr)` instead of `1fr`;
- shell grid children (header, rail, main and footer) are explicitly `min-width:0` / `max-width:100%`;
- the horizontal `.tt-v2-rail` is explicitly bounded to the viewport;
- the rail `.nav-tabs` is `width/max-width:100%`, `min-width:0`, `flex:1 1 auto` and retains `overflow-x:auto`, so the seven tabs scroll inside the rail rather than widening the document;
- existing Clock containment rules remain in place as defense in depth.

## Verification
A controlled Chromium geometry reproduction after the correction produced viewport/root/body/shell/rail/main width 390px with no document-level horizontal overflow. The Clock card border box remained 358px within the 390px viewport; only its intentionally clipped internal decorative content contributed to the card's own `scrollWidth`, without propagating to the document.

M53 static and deterministic verifiers now guard the zero-minimum shell track and rail/nav containment contract.

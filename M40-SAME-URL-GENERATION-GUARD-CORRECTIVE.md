# M40 Same-URL Generation Guard Corrective

## Defect reproduced from target-Mac browser evidence

M40 could commit a newer protected presentation owner while an older deferred `requestAnimationFrame` shell synchronization callback from backend preflight remained eligible solely because the URL hash was unchanged. The stale callback then hid the newly committed Boards or management surface. The same race could also perturb focus during same-URL RBAC reconciliation.

## Correction

Deferred shell synchronization now captures the route-lifecycle revision and owner in addition to the URL. Before a queued callback may mutate shell presentation, it must still match the current hash, lifecycle revision, and lifecycle owner, and that generation must already be committed.

This applies to generic runtime workspaces, Board workspaces, and authenticated management workspaces. As defense in depth, persistent shell synchronization also derives preservation from the currently committed owner and refuses to mutate shell presentation while authentication owns the route. Same-URL capability promotion, account disablement, and module revocation therefore cannot be overwritten by a callback belonging to an older lifecycle generation.

## Verification

The M40 static verifier explicitly requires the revision/owner guard. The deterministic verifier contains a same-URL stale-generation vector. The existing Playwright matrix remains the release authority for repeated route cycling, same-URL module revocation, and same-URL account disablement.

## Async sidebar resource ownership correction

The shell Board-resource refresh previously performed an asynchronous `list('active')` request and then called `publishReactShell(...)` from its `finally` block. That callback was not a route-presentation owner and could complete after a newer same-URL lifecycle generation had committed, hiding Boards, Account, Settings, Users, or Authentication even though the lifecycle owner was already correct.

The corrective runtime now captures a lifecycle frame token before the request, rejects completion after any route revision/owner change, and **never** republishes the React shell from sidebar resource hydration. Sidebar data refresh is therefore data-only; it cannot become a second presentation authority.


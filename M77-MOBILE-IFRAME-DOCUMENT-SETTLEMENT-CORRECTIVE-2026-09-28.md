# M77 Mobile Iframe Document Settlement Corrective — 2026-09-28

## Origin
During corrective local certification, the M77 three-engine/four-viewport matrix passed 29/30 tests but the Chromium mobile embedded-module case failed in `assertFrameNoHorizontalOverflow`. `contentDocument` existed while `documentElement` was transiently `null`, so the helper attempted to read `clientWidth` from a document that was between iframe document replacements.

## Root cause classification
Browser-verification synchronization defect at the embedded iframe document replacement boundary. The application identity gate had completed, but the responsive measurement helper treated a transient DOM-unavailable sample as a stable document. This is not evidence of product horizontal overflow.

## Correction
`assertFrameNoHorizontalOverflow` now:
- treats missing `documentElement` or `body` as a transient unavailable sample;
- resets the consecutive-stability counter and retries within the existing bounded settlement window;
- preserves the same overflow tolerance and three-consecutive-stable-sample requirement;
- fails closed with an explicit document-unavailable error if no measurable iframe document appears before timeout;
- preserves the persistent-overflow diagnostic when a measurable document remains wider than its viewport.

M77 static and deterministic verifiers now require these synchronization guards so the correction cannot silently regress.

## Exit condition
The corrected candidate must pass the complete browser matrix, dedicated M77 certification, post-certification validation, historical regression, package hygiene, final checkpoint, and hosted CI publication gates.

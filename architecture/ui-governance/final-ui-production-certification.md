# M77 Final UI Production Certification Governance

M77 is a certification-only milestone over the active-certified M76 baseline. It does not authorize a new UI redesign, module workflow change, schema change, backend migration, or authorization change.

## Required browser engines
- Chromium
- Firefox
- WebKit

All engines are provisioned by the exact pinned Playwright toolchain. Missing engine binaries or failed provisioning fail certification.

## Required viewport classes
- Mobile: 390 × 844
- Tablet: 768 × 1024
- Laptop: 1366 × 768
- Desktop: 1440 × 900

## Final evidence
M77 requires static and deterministic authority checks, the cross-browser/device Playwright matrix, the complete release gate, historical regression, secret scanning, certified-package integrity, package hygiene, and the final checkpoint. No PASS artifact may be published if any gate fails.

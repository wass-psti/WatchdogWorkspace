# Work Management v1.43.2 — Stage B M4 CSP Dist Verification Hotfix

## Status

Source corrective complete. Dependency-enabled release rerun required on the governed macOS environment.

## Trigger

M4 reached `active-pending-release-certification`, passed governance, security, React, design-system, corrective, vendor-type, M5 staging, ESLint, audit, TypeScript, architecture/UI regression, dev smoke, and a Vite 8.2.2 production build. `verify:dist` then failed on a raw HTML substring assertion for `script-src 'self'`.

## Root cause

The browser-visible Content-Security-Policy can be serialized with HTML entities inside the meta `content` attribute. Raw HTML quote encoding is not part of the CSP security semantics. The old verifier compared serialization text instead of the decoded policy.

## Correction

- Added `scripts/security/production-csp-policy.mjs`.
- Dist verification now extracts and decodes the CSP meta value and validates parsed directives.
- `script-src` must be exactly `'self'`.
- Script `unsafe-inline` and `unsafe-eval` remain prohibited.
- `object-src` must be exactly `'none'` and `base-uri` exactly `'self'`.
- Added `csp-dist:check` and integrated it into check/release/CI/deploy/M4/M5 activation.
- Stage A M2 and M4 corrective gates now protect this boundary.

## Verification

Static governance/security/M3/M4/M5/Vite/hardening/UI suites pass. The complete dist verifier also passes a synthetic dist fixture using `&#39;self&#39;` CSP serialization.

## Remaining certification

Run M4 activation and M4 release activation on the governed Mac. If the full release gate passes, M4 can transition to `active-certified`; only then activate/certify M5.

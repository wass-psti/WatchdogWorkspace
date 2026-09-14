# Stage B M4 — Production CSP Dist Verification Hotfix

## Failure corrected

The production Vite build emitted a Content-Security-Policy meta element, but the dist verifier searched the serialized HTML for the literal raw substring `script-src 'self'`. HTML serializers may entity-encode quote characters inside attribute values (for example `&#39;self&#39;` or `&#x27;self&#x27;`) without changing the browser-visible CSP value. That produced a false-negative release failure after an otherwise successful production build.

## Corrective architecture

- `scripts/security/production-csp-policy.mjs` parses meta attributes, decodes numeric/named HTML entities, parses CSP directives, and validates the security semantics.
- `scripts/verify-dist.mjs` now validates the decoded CSP rather than raw serialized HTML.
- `script-src` must contain exactly `'self'`; extra executable origins are rejected.
- `'unsafe-inline'` and `'unsafe-eval'` remain rejected for scripts.
- `object-src` must be exactly `'none'`.
- `base-uri` must be exactly `'self'`.
- `verify-stage-b-m4-csp-dist-serialization.mjs` regression-tests raw, `&#39;`, `&#x27;`, and `&apos;` serialization forms plus unsafe/expanded-script rejection.

## Governance

The `csp-dist:check` gate is part of normal checks, release checks, CI, deployment, M4 activation, and M5 activation. The Stage A M2 security verifier and M4 corrective verifier also require the semantic CSP verification boundary.

## Verification evidence

The complete `scripts/verify-dist.mjs` was executed against a production-dist fixture whose CSP meta content encoded quote characters as `&#39;`. The verifier passed the fixture, demonstrating that the semantic parser is integrated into the actual dist gate rather than only unit-tested in isolation. Negative regression cases continue to reject additional script origins and unsafe script directives.

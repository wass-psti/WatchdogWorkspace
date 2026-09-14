# Work Management v1.43.2 — Stage A Milestone 2 Security Baseline

## Milestone verdict

**Source implementation: COMPLETE.**

**Local source/runtime regression certification: PASS.**

**External production security certification: requires provider/hosting checks documented in `docs/SECURITY-BASELINE.md`.**

## Implemented

- production shell CSP and referrer policy emitted by Vite builds;
- per-module least-privilege iframe browser permissions;
- removal of unused `clipboard-read` permission;
- same-origin executable entry enforcement in the embedded module bootstrap;
- fail-closed global Supabase session-revocation workflow with retry-safe UI behavior;
- service-worker bypass for credential-bearing requests and query-bearing navigation cache suppression;
- official SRI hashes for TimeTracker Leaflet 1.9.4 CDN CSS/JavaScript;
- Stage A M2 security verifier;
- security verification wired into local `check`, `release:check`, CI, deployment, and `dist` verification;
- formal security architecture/deployment-boundary documentation.

## Preserved authoritative boundaries

- Supabase Auth remains the credential/session authority.
- PostgreSQL/RLS/RPC remains the authorization authority.
- Work Management remains the authentication/access host for embedded apps.
- TimeTracker, FuelTrack+, and TradeLink retain application-scoped RBAC.
- No service-role or privileged backend secret is introduced into the browser.

## External controls still requiring production verification

- Supabase Auth rate-limit configuration;
- production SMTP;
- CAPTCHA policy/configuration;
- password/provider policy alignment;
- session inactivity/time-box/single-session settings as required by organization policy;
- MFA policy for privileged roles;
- GitHub/hosting response-header capabilities;
- trusted-backend implementation if administrators must revoke another user's Supabase Auth sessions.

## Compatibility boundaries

- static-SPA browser token persistence remains in place;
- CSP still permits inline styles, but not inline/eval script execution;
- Leaflet remains CDN-hosted with SRI rather than self-hosted;
- FuelTrack+ still uses remote Google Fonts;
- embedded JavaScript runtimes remain compatibility islands pending dedicated modernization.

## Verification performed in this environment

### PASS

- `npm run security:check`
- `npm run typecheck`
- package governance verification
- high-confidence secret scan
- TypeScript architecture/runtime verification
- Vite static architecture verification
- production-hardening and Board-compatibility verifiers
- all Boards M1–M8 verification contracts
- all Shell M1–M8 verification contracts and collapse hotfix contracts
- TimeTracker v2 Pass 1 / Pass 2
- full Chromium responsive/accessibility regression matrix
- Work Management project verification
- JavaScript syntax checks for modified compatibility/runtime files

The aggregate `npm run check` execution reached and printed `Work Management project verification: PASS` and all final verifier passes. The container command wrapper subsequently emitted `TERM environment variable not set` during teardown; this is an execution-shell condition, not a failed Work Management verifier.

### Not executable in this environment

A fresh production build cannot be certified here because the uploaded RC contains empty/placeholder package directories rather than an installed Vite executable (`node_modules/vite` exists but contains no package files), while the environment cannot resolve `registry.npmjs.org` (`EAI_AGAIN`). Consequently these network/dependency-backed gates remain pending:

- clean `npm ci`;
- governed ESLint bootstrap (`npm run lint:eslint`);
- `npm run audit:ci`;
- `npm run build`;
- `npm run verify:dist` against a newly emitted M2 production bundle;
- `npm run verify:preview`;
- complete `npm run release:check`;
- actual GitHub Actions / CodeQL / Dependency Review execution.

On a dependency-enabled workstation or GitHub Actions runner, run:

```bash
npm ci
npm run governance:check
npm run security:check
npm run lint
npm run audit:ci
npm run release:check
```

Do not promote M2 to a production-certified release until that sequence passes and the external Supabase/hosting checks in `docs/SECURITY-BASELINE.md` are completed.

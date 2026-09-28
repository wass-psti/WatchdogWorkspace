# Infrastructure Boundary

Canonical production paths/files:

- `config/` — runtime/build policy and milestone target configuration.
- `vite.config.js`, `tsconfig.json`, `eslint.config.mjs`, `vitest.config.mjs`, `playwright.config.mjs` — toolchain configuration.
- `.github/` — CI, security, dependency, and deployment workflows.
- `service-worker.js` — offline/update runtime boundary.
- `supabase/config.toml` — backend platform configuration.

Infrastructure may configure runtime boundaries but must not silently change authenticated behavior, persistence contracts, module IDs, route ownership, or security policy.

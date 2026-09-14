# Stage F M28 — Edge Functions activation runbook

M28 requires the certified M27 baseline and Architecture 36.

Local source/release certification:

```bash
nvm use 22.16.0
npm ci
npm run edge-functions:check
npm run lint:eslint
npm run typecheck
npm run edge-functions:activate:release
```

The activation script is transactional: any failed release gate restores the prior M28 activation state.

## Supabase deployment boundary

After source certification, link the target Supabase project and set server-only values without committing them:

```bash
supabase login
supabase link --project-ref YOUR_PROJECT_REF
supabase secrets set \
  WM_SUPABASE_PUBLISHABLE_KEY='YOUR_PUBLISHABLE_KEY' \
  WM_SUPABASE_SECRET_KEY='YOUR_SECRET_KEY' \
  WM_EDGE_ALLOWED_ORIGINS='https://YOUR_GITHUB_PAGES_ORIGIN'
supabase functions deploy admin-sync-auth-access
```

The function keeps `verify_jwt = true` through `supabase/config.toml`.

Do not cut User Management over to mandatory Edge Function invocation until deployment and live invocation are verified in the target project.

# M28 Supabase Edge Functions provenance

Reference date: 2026-09-10.

The M28 implementation is aligned to the current Supabase platform model:

- authenticated browser calls carry the user JWT in `Authorization: Bearer ...` and the project publishable key in `apikey`;
- function gateway JWT verification remains enabled for the authenticated M28 function;
- privileged secret keys are server-only and must never be sent to the browser;
- modern `sb_secret_*` credentials are opaque API keys and are not bearer JWTs;
- legacy JWT-shaped `service_role` credentials remain compatibility-only;
- Supabase Auth Admin user updates support `ban_duration`; `none` lifts an existing ban;
- Auth access JWTs are stateless and remain valid until expiry even after sign-out/ban-related state changes, so live authorization/RLS remains mandatory for sensitive operations.

M28 therefore keeps `profiles.status` plus RLS as the immediate Work Management authorization authority and uses the Edge Function only to synchronize the Supabase Auth ban state from a trusted server boundary.

# Release status — Stage F M28 Edge Functions

State: **implementation-complete-pending-certification**

Architecture: **36**

Implemented:

- typed allowlisted Edge Function client contract;
- single platform-composed Edge Function invocation authority;
- authenticated `admin-sync-auth-access` production function;
- exact-origin CORS policy;
- live caller Admin/General Manager authorization;
- server-only secret credential isolation;
- Supabase Auth ban/unban synchronization;
- transactional M28 activation workflow;
- M28 CI/deploy/release gates and execution vectors.

Retained compatibility boundary: the existing protected user-management RPC remains authoritative until the Edge Function has been deployed and the browser workflow cutover is separately certified.

No npm dependency change. No package-lock change. No database migration or schema change.

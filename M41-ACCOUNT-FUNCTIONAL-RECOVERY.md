# Stage G M41 — Account Functional Recovery

M41 restores Account self-service on top of the M39 authenticated session/access-context authority and the M40 route lifecycle baseline.

Implemented scope: authenticated profile editing, session-validating access refresh, module-role display, password update, local sign-out, global sign-out, session-state presentation, and explicit failure/retry behavior. Password mutation success is no longer conflated with a later global-revocation failure: if password update succeeds but global logout cannot be confirmed, the current browser remains authenticated and surfaces a retry instruction.

The Account browser matrix covers normal and failure/recovery paths and asserts that the expected authenticated Supabase RPC/Auth endpoints are actually invoked by the UI workflows.

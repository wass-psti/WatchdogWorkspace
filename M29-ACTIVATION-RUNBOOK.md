# Stage F M29 Activation Runbook

Prerequisite: M28 must be `active-certified` and Architecture 37 must be present.

M29 release activation is transactional. It verifies M28, validates the M29 static contract, runs strict lint/types, executes the isolated local Supabase + pgTAP RLS suite, transitions to `active-pending-release-certification`, executes the complete release gate, then records `active-certified`. Any failure restores the prior M29 activation state.

The database runner is local-only. It creates a temporary Supabase workdir with migration and seed replay disabled, starts a disposable stack, loads the authoritative `supabase/schema.sql` directly into that local Postgres container, runs `supabase test db --local`, and removes only the M29 stack. Do not substitute `--linked`, a production database URL, or remote reset/push commands for certification.

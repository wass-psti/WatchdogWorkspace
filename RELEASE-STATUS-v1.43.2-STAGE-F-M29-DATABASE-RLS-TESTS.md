# Release Status — Stage F M29 Database/RLS Test Suite

State: `implementation-complete-pending-certification`

M29 introduces the Work Management pgTAP/Supabase CLI database authorization test authority, Architecture 37 manifest/schema governance, a dedicated CI database test workflow, and a narrow RLS hardening migration that removes direct profile and module-role mutation bypasses. M28 remains the certified prerequisite.

Certification requires Supabase CLI 2.117.0, a Docker-compatible runtime, an isolated local Supabase test stack bootstrapped from `supabase/schema.sql`, the full transactional 87-assertion pgTAP suite, governed lint/types/browser/build/release gates, and final transition to `active-certified`. Historical semantic migration filenames are preserved and are not replayed by the test harness.

Corrective RC note: the first real local run executed 82 assertions and exposed three defects (explicit anon EXECUTE revocation, deterministic display-name normalization, and fail-open Board membership authorization). The corrective source closes all three and expands the complete regression contract to 87 assertions.

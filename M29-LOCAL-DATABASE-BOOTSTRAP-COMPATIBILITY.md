# M29 Local Database Bootstrap Compatibility

The Work Management migration archive predates the current Supabase CLI timestamp naming convention. Existing files such as `v1.13.0-account-architecture.sql` are intentionally preserved because renaming deployed migration history during M29 would create a larger provenance and deployment risk.

For M29 tests, the governed runner therefore creates a separate temporary Supabase project whose local config disables migration and seed replay. After the managed local Auth/Storage/Realtime schemas are available, `supabase/schema.sql` is loaded with `psql` inside the M29 database container and the pgTAP suites run against that disposable database.

This compatibility boundary is test-only. It does not claim that the historical migration directory is directly replayable by modern `supabase db reset`, and it never targets a linked or production project. Future migration-history modernization should be handled as a separate, explicit milestone.

# Standalone application integration slots

M145 removes all four formerly installed applications from the active Work Management host.
This `apps/` directory is intentionally empty apart from this documentation.

New application integrations must be introduced in separate, reviewed tasks; no
legacy module is auto-installed or compiled by the current build. The generic
host, authentication, Boards, Users, Account, and Settings remain in the platform.

Database rows, migrations, and Supabase Storage were not deleted. Former source
files remain recoverable from the signed-off pre-removal source ZIP / Git history.

# M144.12 — M78 Board Import Wizard Successor Authorization (Non-release)

## Cause and boundary

On GitHub pull request #20, Work Management CI #91 failed in `npm run visual-foundation:test` after the other 25 workflows passed. `scripts/verify-stage-i-m78-visual-system-foundation-execution.mjs` correctly rejected six newly introduced protected Board Import wizard files because no explicit post-M78 successor authority existed for them.

This milestone authorizes **only these six specific files at their immutable SHA-256 values**:

- `assets/css/board-import-wizard.css` — `3ee1ab4e968421eb98dbd67f8b543d6120a4d3413d440e2abfc4f07d6a34a0e6`
- `assets/js/features/boards/controllers/board-import-wizard-ui.ts` — `7fd7b09b9cccd4eb0bc36827d54cc845222e15c3dce676ae486669506c1fce81`
- `src/features/boards/contracts/import-wizard-commit.ts` — `8222931e5e97f9f383a7d1ec72c55a43ef28f406efcb5f2434de205f3007f961`
- `src/features/boards/contracts/import-wizard.ts` — `f126606d8a2b26177d4731130562aa17e0c22823e8ad2ad28017c019fa20405d`
- `src/features/boards/import/board-import-wizard-commit.ts` — `877cb6cb3aaeec46006a369a2fadee99371af07dcdbd31c4eab2c5799de237e1`
- `src/features/boards/import/board-import-wizard-plan.ts` — `9abda2153f22868e3685c994cb2dbc0bae91da42b5ee737cbe15a410c4c366b1`

The authority depends on the M143 contract specification and the unmodified SQL draft at SHA-256 `b883b3c432ae5ebcadd9fda2f15b5bcdeb0cff9448ace4862c6fb88fd5fd37fc`. The M77 baseline, approved historical mutations, authentication code, database schema, frontend wizard source, and existing M143 SQL are unchanged. Future changes to these files require separate reviewed successor authorization.

## Negative controls

`tests/modern/board-import/m14412-m78-guard.verify.py` exercises a clean positive control and rejects tampered CSS, tampered wizard TypeScript, unauthorized sibling files, a missing approved file, a changed SQL authority, and changed protected file mode. It restores test changes only in a disposable copy. It must not modify a live checkout.

## Governance decision

The corrective is a **test-branch-only candidate**. Release and `main` deployment remain blocked until all fresh CI workflows pass and authenticated write/RBAC/rollback acceptance is performed with an authorized isolated test board in the shared WatchdogWorkspace Supabase project. The SQL draft must not be auto-deployed. No hosted database writes occur in this verification.

# M144.10 — Minimal Board Import branch patch, full 45-file review

- Predecessor: M144.9, 2,829 files; all retained byte-for-byte.
- Reviewed GitHub difference: 39 candidate-only, 6 modified, 0 remote-only.
- **Deployable minimal subset:** 20 candidate-only files (M141–M144 implementation, tests, contracts, draft SQL, provenance) and exactly 6 modified files (four Boards runtime/contracts plus two historical M108 source guards).
- **Excluded from branch patch:** 19 M144.4–M144.9 governance/QA-only files, preserved in full-source continuation ZIP.
- Complete minimal payload equals the M144.2.5 source candidate: 2,810 files, zero differences against 2,810 corresponding files in M144.9.
- GitHub source base: wass-psti/WatchdogWorkspace, main and `m1449/board-import-qa` both pinned to `ed390940b56be6c4495347aae37593e9a34b4446` at observed comparison.
- The branch patch is preparable in a temporary local clone. No commit or push until dedicated CI, governance, browser and hosted acceptance gates.
- **Security:** `supabase/m143/board_import_wizard_atomic_DRAFT.sql` remains a draft under `supabase/m143/`, not `supabase/migrations/`. It must not be automatically applied. Hosted shared WatchdogWorkspace RPC was body-hash verified on October 14; no live write tests yet.
- Full source handoff is still NOT RELEASE CERTIFIED. Do not deploy to main.

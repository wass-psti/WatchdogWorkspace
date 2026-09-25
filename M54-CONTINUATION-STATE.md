# M54 Continuation State

State: FULLY COMPLETE — IMPLEMENTATION AND REQUIRED VERIFICATION COMPLETE

Canonical prerequisite: M53 active-certified repository state.

Required exit gates: clean install → release check → Database/RLS → authenticated E2E → build/dist/preview → GitHub Pages deployment → live authenticated workflows → rollback freeze → historical regression → package hygiene → active-certified production baseline.

External boundary: GitHub repository/deployment access and production E2E account credentials are required. M54 must remain pending certification if any external gate is unavailable or fails.


## Candidate 02 corrective checkpoint — 2026-09-24

- Corrects the architecture-v59 runtime-schema/type synchronization defect exposed by the clean-install `release:check`.
- Adds deterministic M54 verifier coverage for the Zod and TypeScript architecture authorities.
- Full production certification remains pending external/local execution.


## Candidate 03 corrective
- M40 browser readiness now waits for M38 backend preflight terminal state before capability-gated route cycling.
- Production runtime behavior unchanged.

## Candidate 04 corrective
- Synchronizes the historical M39/M40 fixture RPC inventory with the current M38/M51 Boards contract by adding `wm_set_board_cell_if_current`.
- M40 application readiness now requires `backend-preflight.current.state === ready` and `modules.boards.ready === true` before route cycling begins.
- Production routing, authorization, RLS, backend capability policy, and Boards runtime code remain unchanged.

## Candidate 05 corrective
- Corrects the M50 historical verifier so the M50 target remains exactly architecture 58 while later application manifests are accepted when `architectureVersion >= 58`.
- Adds M54 regression coverage for the monotonic post-M50 architecture rule.
- Production runtime, M50 target semantics, database schema, RLS, and application behavior remain unchanged.

## Candidate 06 corrective
- Synchronizes the historical browser integration rename fixture with the current intrinsic-title CAS command `setItemTitle({ itemId, value, expectedValue })`.
- Preserves explicit verification that Enter performs exactly one persistence call and that the expected-value conflict boundary is carried across subsequent explicit confirmations.
- Adds M54 static regression coverage binding the browser integration fixture to the authoritative intrinsic-title persistence contract.
- Production Board runtime behavior is unchanged; the Candidate 05 failure was fixture drift inside the aggregate historical browser integration suite.


## Candidate 07 — Production M38/M51 capability parity corrective
Live production diagnosis proved `public.wm_runtime_capabilities()` is missing. Before deploying historical M38, repository inspection found that the database capability authority also omitted the M51 CAS RPC while the current client manifest requires it. Candidate 07 adds a forward M54 capability-parity migration, synchronizes canonical schema, and hardens M54 static governance. Production application runtime behavior is unchanged.

## Candidate 08 — Production required-RPC parity corrective (2026-09-24)

- Candidate 07 local certification: PASS.
- Candidate 07 production capability inventory migration: applied.
- Live M38 capability RPC: reachable and schema `1.43.2-m38-v2`.
- Production capability result exposed two missing implementations: `update_own_profile`, `wm_set_board_cell_if_current`.
- Candidate 08 adds a forward-only M54 migration restoring those two certified RPC implementations.
- Historical migrations remain unchanged.
- M54 verifier now fails closed unless the production corrective contains both definitions, authenticated grants, and PostgREST schema reload.
- State: implementation complete pending Candidate 08 local and production verification.


## Candidate 10 — live embedded identity boundary corrective (2026-09-24)

- Hosted run `36014341214` bound to commit `d15b2ff9b1c4a24676a65ad7db15f66506c4b6e9` passed `certify-build` and `deploy`, then failed only in `post-deploy-certify`.
- The failure advanced to embedded module traversal: `WorkManagementRuntime.getContext()` correctly exposed the active `moduleId`, while the live spec incorrectly expected embedded identity under `context.identity.module`.
- Candidate 10 synchronizes the live E2E harness with the established iframe identity bridge (`WM_IDENTITY_CONTEXT` + `WM_MODULE_ACCESS`) and adds a fail-closed verifier guard against regression.
- No production runtime or database semantic change is introduced by this candidate.

## Candidate 11 — deterministic live iframe resolution corrective (2026-09-25)

- Hosted run `36073960901` bound to Candidate 10 commit `a47b2e9c5b60df29e3934f0c1f12e2e8dd508980` passed `certify-build` and GitHub Pages `deploy`, then failed only in `post-deploy-certify`.
- Candidate 10 correctly moved module authorization assertions to `WM_IDENTITY_CONTEXT` / `WM_MODULE_ACCESS`, but the live harness still attempted to discover the child frame by scanning `page.frames()` for a URL substring and received `undefined`.
- Candidate 11 resolves the already-visible authoritative `#moduleFrame` element through `elementHandle().contentFrame()` and runs the existing identity/access assertions inside that exact frame.
- M54 static governance now rejects URL-scanning frame discovery and requires DOM-backed frame resolution.
- No production application, RBAC, Supabase, route, or embedded-module semantic change is introduced.


## Post-release CI / historical harness synchronization corrective — 2026-09-25

Implementation synchronizes release-tag workflow governance and historical M46–M50 verification harnesses with the current M51/M54 CAS and certification state contracts. Production runtime/database artifacts remain unchanged. This checkpoint remains fail-closed until targeted historical gates, complete regression, package hygiene, and hosted main-branch workflow verification pass.

## Post-release CI Candidate 02 — M47 system-cell CAS browser-fixture corrective (2026-09-25)

- Candidate 01 passed artifact, dependency, static, deterministic, and M46 browser gates on macOS.
- M47 browser CRUD failed because its historical fixture compared system Status CAS against custom-cell storage instead of authoritative `item.status`.
- Candidate 02 synchronizes M47 system-field CAS fixture semantics and updates browser/static authority to the current field-scoped edit contract.
- Production runtime/database behavior remains unchanged.
- State remains fail-closed pending complete local and hosted corrective certification.


## Post-release CI Candidate 03 — M50 intrinsic-title CAS browser-fixture corrective (2026-09-25)

- Candidate 02 passed clean install, static/deterministic gates, and M46–M49 browser verification on macOS.
- M50 browser property persistence failed because its historical fixture still handled title edits through retired `wm_update_board_item` semantics while the current controller uses field-scoped CAS.
- Candidate 03 synchronizes the M50 fixture and browser/static authority with `wm_set_board_cell_if_current`, authoritative intrinsic/system-field expected values, and stale-write conflict behavior.
- Production runtime/database behavior and the frozen M54 release remain unchanged.
- State remains fail-closed pending complete Candidate 03 local and hosted corrective certification.

## Post-release CI Candidate 04 — M50 system-column fixture authority corrective (2026-09-25)

- Candidate 03 passed clean install, static/deterministic verification, and the complete M46–M49 browser/CDP chain on macOS, but the M50 Item Workspace title-save scenario still reloaded `Alpha`.
- Root cause: the inherited M49 fixture publishes only Status plus custom columns, while the current Item Workspace controller resolves every core-property save through its matching system column before issuing `wm_set_board_cell_if_current`. The title CAS handler added in Candidate 03 was therefore unreachable because no `system_key='title'` column existed in the M50 fixture.
- Candidate 04 backfills the complete current M50 system-column authority (`title`, `status`, `assignee`, `due_date`, `notes`) without duplicating inherited columns, and hardens M50 static governance against future fixture drift.
- Production runtime/database behavior and the frozen `v1.43.2-m54` release remain unchanged.
- State remains fail-closed pending complete Candidate 04 local and hosted corrective certification.

## Candidate 06 — M53 mobile focus RAF certification-race corrective (2026-09-25)

- Candidate 05 passed artifact, dependency, static, deterministic, browser/E2E, M46-M50 corrective certification, local Database/RLS, and M52 RBAC gates before failing the M53 mobile-keyboard browser scenario.
- Root cause: the M53 test sampled `document.activeElement` immediately after `aria-expanded=true`, while the production shell intentionally transfers focus into the sidebar on the next `requestAnimationFrame`.
- Candidate 06 replaces the synchronous focus sample with a bounded `expect.poll` wait and hardens M53 static/deterministic governance against reintroducing the race.
- Production application behavior is unchanged.
- State: implementation complete pending Candidate 06 full fail-closed local and hosted verification.

## Candidate 07 — hosted CI harness synchronization

Candidate 07 retains the complete Candidate 06 corrective state and synchronizes the M45 duplicate-board, M49 keyboard structure-move, and M50 historical finalizer verification harnesses with their asynchronous/current certification contracts. The original `v1.43.2-m54` tag remains immutable at `c1a3811783ab9f44260171297d2c797d559ec90d`. Candidate 07 must be certified and published on top of Candidate 06 corrective commit `0fd2d74e24e79b72464898fdf6838723be1aa846`.

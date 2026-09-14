# Work Management Modern Testing Stack — Stage F M30

## Purpose

M30 establishes a modern, governed unit/component testing layer for the Work Management host platform. It complements rather than replaces the specialized certification layers already proven in earlier milestones.

## Authority

- **Vitest 5.0.0** is the modern test runner aligned with the existing Vite 8 build pipeline.
- **jsdom 27.4.0** provides deterministic DOM execution for fast unit/component tests. Its published Node engine contract is `^20.19.0 || ^22.12.0 || >=24.0.0`, which includes the governed Node 22.16.0 baseline. The bootstrap verifies this engine contract after installation.
- **React Testing Library 16.3.3** and **DOM Testing Library 10.4.1** provide user-facing React/DOM queries.
- **@testing-library/user-event 14.6.7** drives realistic interaction sequences in component tests.
- **@testing-library/jest-dom 7.0.1** provides declarative accessibility/DOM assertions through its Vitest integration.
- **@vitest/coverage-v8 5.0.0** enforces the V8 coverage gate.
- **Playwright 1.63.0** provides the modern real-browser application smoke layer using the same discovered Chromium-family executable already required by the certified browser harness.

The test root is `tests/modern`; configuration is `vitest.config.mjs`.

## Baseline coverage

The M30 baseline contains five representative files, 23 test cases, and 74 explicit assertion expressions across unit, component, and e2e layers:

- unit tests for route-policy access decisions;
- unit tests for Board row/column virtualization calculations;
- unit tests for Zustand shell client-state behavior and immutability;
- component tests for Work Management button accessibility/loading/interaction semantics;
- a Playwright smoke test for the real `/#/login` composition and React ownership boundaries.

The initial release coverage thresholds are 75% statements, 65% branches, 75% functions, and 75% lines across those representative source authorities. Thresholds are a floor, not a target ceiling.

## Isolated exact test-tool bootstrap

M30 intentionally does **not** rewrite the certified M29 application `package-lock.json`. Testing tools are development-only certification infrastructure, exact-pinned by `scripts/ensure-modern-test-toolchain.mjs`, and installed with `--no-save --package-lock=false --ignore-scripts` when unavailable. `scripts/run-modern-tests.mjs` hashes `package.json` and `package-lock.json` before execution and fails if either changes.

This is a deliberate compatibility boundary: the application lockfile remains the production dependency authority while M30 can be certified without conflating a large testing-only dependency graph with production package governance.

## Existing layers retained

### Real-browser regression

Playwright is introduced as the modern application browser-test layer. The certified bounded-CDP browser harness remains active in `tests/browser` as a parity backstop. M30 does not claim that jsdom replaces real-browser verification, and it does not retire CDP until a later milestone proves equivalent or broader browser coverage. The release certification runs both Playwright and the existing CDP/dev/build/dist/preview contracts.

### Database/RLS authorization

M29 pgTAP remains authoritative for PostgreSQL/RLS behavior. Vitest does not replace transactional tests of database privileges, policies, Realtime topic authorization, or safeguarded RPC behavior.

### Embedded modules

TimeTracker, FuelTrack+, and TradeLink retain their existing stabilization/release verifiers and same-origin module compatibility boundaries. M30 focuses first on representative host-platform seams; converting every embedded module to Vitest is explicitly outside this milestone.

## Commands

- `npm run modern-tests:check` — static architecture/governance verification.
- `npm run modern-tests:test` — exact-tool bootstrap plus unit/component tests.
- `npm run modern-tests:coverage` — same unit/component suite with V8 release thresholds.
- `npm run modern-tests:e2e` — Playwright real-application login composition smoke using the discovered system Chromium-family browser.
- `npm run modern-tests:status` — milestone status.
- `npm run modern-tests:activate:release` — governed activation and release certification.

# Release Status — Stage F Milestone 30 Modern Testing Stack

- Release: Work Management v1.43.2
- Stage: F
- Milestone: 30 — Modern testing stack
- Architecture: **Architecture 38**
- State: **implementation-complete-pending-certification**
- Prerequisite: M29 Database/RLS test suite `active-certified`

## Implemented

- Corrective toolchain compatibility: jsdom is exact-pinned at 27.4.0 because its published Node engine contract (`^20.19.0 || ^22.12.0 || >=24.0.0`) includes governed Node 22.16.0; jsdom 30.0.1 was rejected after its Node 22 minimum advanced beyond the governed baseline.
- Vitest 5 modern test authority aligned with the Vite 8 platform.
- jsdom + React Testing Library + user-event + jest-dom component testing boundary.
- V8 coverage provider and governed release thresholds.
- Playwright 1.63.0 real-browser smoke layer using the existing system Chromium-family browser discovery contract.
- Five representative test files: route policy, Board virtualization, shell client-state, React button primitives, and Playwright application login composition.
- 23 test cases / 74 explicit assertion expressions.
- Exact isolated testing-tool bootstrap that does not modify the application package manifest or lockfile.
- CI, deployment static gate, dedicated modern-test workflow, Stage F activation/certification, and project verifier integration.

## Compatibility boundaries retained

- Bounded-CDP real-browser verification remains a required parity backstop while Playwright becomes the modern application browser-test authority; retirement is deferred until an explicit later equivalence/cutover milestone.
- M29 pgTAP remains authoritative for database/RLS behavior.
- TimeTracker, FuelTrack+, and TradeLink retain existing embedded-module verifiers and current same-origin compatibility boundaries.
- Testing-only packages are exact-pinned but bootstrapped ephemerally rather than becoming application lockfile dependencies.

## Certification requirement

M30 remains pending until the governed Node 22.16.0 environment executes the modern test suite, V8 coverage gate, M29 pgTAP regression, bounded-CDP regression, full build/dist/preview checks, and Stage F release certification without failure.

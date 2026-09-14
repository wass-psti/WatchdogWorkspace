# Release Status — v1.43.2 Stage D M15 React Board Presentation Facade

- **Milestone:** Stage D — Boards modernization / M15 React Board presentation facade
- **State:** implementation-complete-pending-certification
- **Architecture Version:** 25
- **Prerequisite:** M14 active-certified
- **Backend migration:** None

## Implemented
- React-owned Board presentation facade and dedicated host.
- External-store runtime for Boards list/detail route presentation state.
- General legacy route-content host hidden/inert while Boards owns presentation.
- Existing Board engine, services, commands, repositories, overlays, Table/Kanban, Item Workspace, keyboard, drag/drop, selection, history, status lifecycle, and persistence retained.
- M15 verifier, execution vectors, browser/runtime bundle exposure, Stage D activation/certification, CI/deploy gates, documentation, and runbook.

## Certification required
Run `bash scripts/certify-stage-d-m15.sh` on the governed macOS release environment. Promotion to `active-certified` occurs only after the complete release gate succeeds.

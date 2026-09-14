# Release Status — v1.43.2 Stage D M17 TanStack Table Evaluation

- **Milestone:** Stage D — Boards modernization / M17 TanStack Table evaluation
- **State:** implementation-complete-pending-certification
- **Architecture Version:** 26 (runtime architecture unchanged)
- **Prerequisite:** M16 active-certified
- **Candidate evaluated:** `@tanstack/react-table` 9.2.4
- **Adoption decision:** `defer-production-adoption`
- **Production dependency added:** No
- **Backend migration:** None

## Implemented
- Added a typed Board Table requirement catalogue covering current production semantics.
- Added an executable TanStack Table candidate evaluation with native / adapter / external support classification.
- Recorded the evaluated candidate version and a reversible non-adoption decision.
- Preserved the production Board Table renderer and M16 compatibility engine unchanged.
- Added M17 verification, status, activation, certification, Stage D platform integration, CI/deploy gates, documentation, and runbook.

## Evaluation conclusion
TanStack Table remains a viable future headless table-state/model candidate, but production adoption is deferred until a dedicated isolated spike proves parity for Board groups, typed editors, drag/drop, history, persistent sizing/order, sticky geometry, keyboard accessibility, and existing state ownership.

## Certification required
Run `bash scripts/certify-stage-d-m17.sh` on the governed macOS release environment. Promotion to `active-certified` occurs only after the complete release gate succeeds.

# M42 Self-Role Fixture Identity Corrective

## Trigger
The second target-Mac M42 browser run improved to 5/6 scenarios but the self-demotion case still timed out waiting for the authenticated identity to become `supervisor`.

## Root cause verified in the exact candidate
The production M39 access-context validator requires every returned module assignment to belong to the authenticated user. After self-demotion, the Playwright M39 fixture changed the authenticated Admin's platform role but rebuilt non-admin assignments with `employeeAssignments()`, whose rows were hard-coded to `EMPLOYEE_ID`. The resulting access context mixed `profile.id = ADMIN_ID` with `assignments[*].user_id = EMPLOYEE_ID`, so the production identity-integrity check correctly rejected the fixture response and no new identity was published.

## Corrective implementation
- `adminAssignments` and `employeeAssignments` now accept the authoritative user id.
- A self access mutation rebuilds assignments with `adminAssignments(userId())` or `employeeAssignments(userId())`.
- M42 static verification asserts the self-role fixture preserves authenticated assignment identity.
- M42 deterministic verification independently checks both identity-preserving fixture calls.

## Scope
This corrective changes only the test fixture and M42 verification contracts. It does not weaken M39 identity validation, alter M40 route ownership, or bypass the production self-role revalidation path.

## Required target evidence
The complete M42 browser suite must report 6/6 PASS before database/RLS and downstream certification gates may proceed.

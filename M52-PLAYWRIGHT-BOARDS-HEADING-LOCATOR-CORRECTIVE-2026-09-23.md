# M52 Playwright Boards Heading Locator Corrective — 2026-09-23

## Origin
Candidate 01 local authenticated Playwright execution reached all 10 M52 scenarios. Six passed. The four host-route role-matrix scenarios (Admin/GM, HR, Supervisor, Employee) failed at the same assertion before Board authorization checks executed.

## Root cause
`page.getByRole('heading', { name: 'Boards' })` matched both the page-level `<h1>Boards</h1>` and a secondary `<h2>Boards</h2>`. Playwright strict mode correctly rejected the ambiguous locator.

This was a test-harness defect, not evidence of an RBAC/runtime failure.

## Correction
The host-route matrix now targets the page-level heading explicitly:

```js
page.getByRole('heading', { name: 'Boards', level: 1 })
```

No authorization expectation, role mapping, route policy, Board membership rule, backend policy, or application runtime behavior was weakened or changed.

## Verification
- M52 static verifier: PASS after correction.
- M52 deterministic execution vectors: PASS (9/9) after correction.
- Browser rerun remains required in the authoritative local environment before certification.

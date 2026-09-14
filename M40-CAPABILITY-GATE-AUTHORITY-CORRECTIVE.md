# Stage G M40 — Capability Gate Authority Corrective

## Failure evidence

The target-Mac browser matrix committed protected lifecycle ownership for Boards and Account while the runtime/preflight surface remained visible and the corresponding React presentation host remained hidden. Both failures had the same signature: lifecycle ownership and rendered presentation diverged after commit.

## Root cause

Backend capability readiness was checked twice in one route transaction:

1. `resolveBackendCapabilityPresentation()` selected the lifecycle owner before `begin()`/commit.
2. The selected route renderer then called `gateBackendCapability()` and evaluated readiness again.

A readiness change between those checks allowed the owner to be committed as `boards`, `account`, `settings`, `user-management`, or `module-host` while the second gate rendered the shell-owned M38 preflight surface instead. This is a time-of-check/time-of-use ownership race.

## Correction

- `resolveBackendCapabilityPresentation()` is now the sole backend-capability presentation authority.
- Protected renderers execute only after the resolver has selected their owner; they no longer re-check capability state.
- Pending/blocked capability state still renders M38 preflight under shell ownership.
- Once capability readiness changes, the existing preflight completion callback invokes a new route render; the resolver then transitions from shell ownership to the protected owner.
- M39 authentication/RBAC authority, M38 capability definitions, module business rules, Board domain logic, and database migrations are unchanged.

## Regression guard

The M40 static verifier now fails if `gateBackendCapability()` is reintroduced into the application route wiring and confirms that protected renderers are direct after precommit presentation resolution.

## Certification state

M40 remains `implementation-complete-pending-certification`. The target Mac must still pass all three M40 Playwright scenarios, the historical suite, full `release:check`, and transactional M40 activation before `active-certified` is valid.

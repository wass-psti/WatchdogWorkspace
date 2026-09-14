# M39 runtime lifecycle corrective

This corrective addresses the two remaining browser failures from the M39 Browser Authority Certification Corrective RC.

## Disabled-account transition

The authenticated management/workspace render path schedules deferred `requestAnimationFrame` shell synchronization. A frame scheduled while an authenticated route was active could execute after access revalidation changed the account to `disabled`. Because `syncPersistentShell()` republishes shell mode and hides authentication UI, that stale frame could overwrite the disabled-account presentation.

Deferred shell synchronization now executes only while the same route is still active and the React shell is still in shell mode. Management and board-specific frames also validate their owning presentation before synchronizing. This makes a later authorization transition authoritative over earlier deferred presentation work.

## Transient access-context recovery

The recovery UI previously called `consumeReturnRoute()` after successful access-context restoration, but the `render-auth-recovery` path did not persist the protected route because it did not redirect through the normal anonymous-login path. The result was an empty return route and navigation to Home.

The recovery renderer now records the current protected route before showing the recovery UI. Login, registration, and verification routes are excluded from return-route persistence. A successful retry therefore resumes the protected route that was awaiting access validation.

## Certification boundary

The corrective does not implement M40-M43 presentation recovery. It changes only M39-owned auth/authorization lifecycle coordination and the M39 certification assertions. Account, Users, and Settings presentation recovery remain downstream work.

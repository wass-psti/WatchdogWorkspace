# M54 browser integration intrinsic-title fixture synchronization corrective — 2026-09-24

## Originating failure
Candidate 05 progressed through the M50 historical architecture correction and then failed inside the aggregate browser integration suite on `Enter confirms rename once through the persistence service`.

## Root cause
The production inline-edit controller persists intrinsic item-title changes through the dedicated CAS command `setItemTitle({ itemId, value, expectedValue })`. The historical browser integration fixture still supplied and asserted the retired `updateItem` mutation shape. The missing `setItemTitle` stub caused the controller's fail-closed recovery path to restore the previous title, producing a false historical regression.

## Corrective change
The fixture now mocks `setItemTitle`, records the intrinsic-title command shape, verifies exactly one persistence call for Enter confirmation, and verifies the expected-value CAS boundary for both Enter and explicit-confirm flows. Production application behavior is unchanged.

## Exit condition
The browser integration suite must pass with the current intrinsic-title persistence contract, followed by the complete M54 fail-closed verification sequence.

# M38 Historical Verifier Synchronization Corrective Hotfix

## Scope

This corrective synchronizes three historical route-ownership verifiers with the Architecture 46 M38 backend-capability gate without weakening the original M13 React ownership contract.

## Corrected verifiers

- `verify-stage-c-m13-account-settings-user-management.mjs`
- `verify-v1240-architecture-phase3.mjs`
- `verify-v1250-architecture-phase4.mjs`

## Preserved authority

At Architecture 46 and later, Account, Users, and Settings must still terminate at `showAuthenticatedManagement(...)`, but only through `gateBackendCapability(...)`. The synchronized verifiers therefore require the gated delegation and reject the pre-M38 direct delegation at Architecture 46+.

For historical architectures below 46, the original direct-delegation assertion remains valid.

## Reason

M38 intentionally inserts fail-closed backend capability validation before exposing backend-dependent modules. The previous historical verifiers compared literal pre-M38 route strings and therefore reported false regressions even though the React management authority remained intact behind the new gate.

## Certification rule

M38 must not be activated unless the complete historical verifier sweep passes after this synchronization. This hotfix does not change application product behavior.

## Final synchronization discovered by full 148-verifier sweep

The first corrective synchronized the M13, Phase 3, and Phase 4 verifiers. The subsequent complete historical sweep exposed one additional stale literal route assertion in `verify-settings.mjs`. Architecture 46+ now requires that verifier to assert the M38-gated Settings delegation and reject direct bypass, while preserving the pre-Architecture-46 direct-delegation expectation.

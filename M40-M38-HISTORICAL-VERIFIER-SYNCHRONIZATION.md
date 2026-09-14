# M40 / M38 Historical Verifier Synchronization

The M40 capability-gate authority corrective preserves every M38 capability requirement while moving the authoritative gate from renderer-level wrappers to `resolveBackendCapabilityPresentation()` before lifecycle ownership is committed.

Historical M13, Settings, Phase Three, Phase Four, and M38 verifiers now branch by architecture:

- Architecture 46–47 continues to recognize renderer-level `gateBackendCapability(...)` wiring.
- Architecture 48+ requires direct protected renderers plus the M40 precommit capability resolver and rejects renderer re-gating.

This synchronization prevents historical checks from forcing the time-of-check/time-of-use race back into the current architecture. No historical product requirement is relaxed: protected modules remain fail-closed behind M38 capability readiness.

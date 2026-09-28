# M72 corrective — M67 successor migration regression contract

## Originating failure

The M72 corrective certification restart passed the repaired M68 gate, then failed at `feedback:test` because M67 still byte-hash-froze `src/app/shared-ui/SharedApplicationUI.tsx` even though the certified M67 baseline declares host migration ownership at M72.

## Root cause

M67's deterministic verifier did not distinguish immutable feedback/runtime authorities from the React shared-UI presentation authority explicitly handed to M72. This made the certified successor boundary internally contradictory.

## Correction

- M67 now exposes exactly one successor-migratable presentation authority: `src/app/shared-ui/SharedApplicationUI.tsx`.
- That exemption is valid only from M72 onward and is represented by `hash-frozen-through-m71-semantic-invariants-from-m72`.
- All other M67 authority hashes remain mandatory.
- M67 still verifies canonical feedback semantics, M14 toast runtime compatibility, M66 toast portal ownership, loading/error/empty-state rules, reduced-motion, and forced-colors behavior.
- M72 deterministic verification now enforces the exact one-file M67 migration allowlist in addition to the existing two-file M68 allowlist.

## Regression surface audit

The full Stage H baseline audit found that, among M72-modified React presentation files, only M67 and M68 predecessor baselines had stale byte-hash freezes. No M63-M66 or M69-M71 regression baseline freezes the other M72-modified host presentation files.

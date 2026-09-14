# Stage F M32 — Observability activation runbook

Prerequisite: Stage F M31 must remain `active-certified`.

M32 starts at `implementation-complete-pending-certification`. The activation script first changes the target to `active-pending-release-certification`, runs the static M32 verifier and observability execution vectors, and on `--release` runs performance, production build/bundle budgets, modern coverage/E2E, ESLint, strict TypeScript, and audit. Any failure restores the original target byte-for-byte. Only a successful release path transitions M32 to `active-certified`.

The production export transport is deliberately unconfigured by default. Certification verifies the transport abstraction and export semantics without sending telemetry off-device.

# Stage F M34 — Backup and Disaster Recovery Activation

Prerequisite: M33 must be `active-certified` at Architecture 41. M34 advances the application architecture to 42 and begins in `implementation-complete-pending-certification`.

## Release activation

Run `npm run backup-dr:activate:release`. The activator enters `active-pending-release-certification`, executes M34 static/execution authorities and retained M29-M33 release authorities, then writes `active-certified` only on complete success. Any failure restores the original target file byte-for-byte.

## Certification evidence

The release run must prove the M34 recovery-package integrity/preflight behavior, strict TypeScript/ESLint, M29 database authorization, M30 tests/coverage/E2E, M31 performance budgets, M32 observability, M33 service-worker/update strategy, production build/dist/preview, and dependency audit.

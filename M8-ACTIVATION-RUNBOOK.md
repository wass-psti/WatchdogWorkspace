# Stage B M8 Activation Runbook — TanStack Query Migration

## Prerequisite

Stage B M7 must be `active-certified`.

## Public commands

```bash
npm run tanstack-query:check
npm run tanstack-query:status
npm run tanstack-query:activate
npm run tanstack-query:activate:release
npm run stage-b:certify
```

All public M8 commands self-dispatch to the governed Node v22.16.0 / npm 10.9.2 toolchain.

## State transitions

1. `blocked-pending-m7-certification`
2. `implementation-complete-pending-certification`
3. `active-pending-release-certification`
4. `active-certified`

`active-certified` is written only after `release:check` completes successfully.

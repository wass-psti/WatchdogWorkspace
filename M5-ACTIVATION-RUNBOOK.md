# Stage B M5 Activation Runbook

## Prerequisite

M5 activation is intentionally blocked until Milestone 4 reports:

```text
Activation state: active-certified
Provider mounted: YES
```

If M4 is only `active-pending-release-certification`, run:

```bash
npm run design-system:activate:release
npm run design-system:status
```

## Targeted M5 activation

```bash
nvm use
node -v
npm -v
npm run governance:restore
npm run governance:check
npm run security:check
npm run corrective:check
npm run vendor-types:check
npm run interactions:check
npm run interactions:status
npm run interactions:activate
npm run interactions:status
```

Expected targeted state:

```text
M5 activation state: active-pending-release-certification
Public interaction API active: YES
```

## Final release certification

```bash
npm run interactions:activate:release
npm run interactions:status
```

Completion requires:

```text
M5 activation state: active-certified
Public interaction API active: YES
```

If real-package compilation fails after dependency installation, do not delete the dependencies. The workflow deliberately retains `dependencies-installed-pending-certification`; correct the Work Management wrapper against the installed public API and rerun `npm run interactions:activate`.

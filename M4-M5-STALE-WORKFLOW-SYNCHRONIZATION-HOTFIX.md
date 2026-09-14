# M4/M5 stale workflow synchronization hotfix

## Failure corrected

A working tree could contain an older `.github/workflows/ci.yml` or `deploy-pages.yml` while the current package already contained newer recovery templates and verifiers. The previous `governance:restore` implementation preserved any existing file, so stale workflows missing `npm run csp-dist:check` or `npm run interactions:check` survived and later M4/M5 verification failed.

## Corrective behavior

`npm run governance:restore` is now contract-aware:

- missing governed files are `RESTORED`;
- stale governed files that do not satisfy the current M4/M5 contract are `SYNCHRONIZED` from the canonical recovery bundle;
- forward-compatible workflows that already contain every current required contract remain `PRESERVED`.

Both M4 and M5 activation now run governance synchronization unconditionally before certification. A dedicated `npm run governance:sync-check` regression gate protects this behavior in local checks, release checks, CI, and deployment.

## Regression reproduced

The live CI and deployment workflows were deliberately stripped of `npm run csp-dist:check`. Running `npm run governance:restore` reported both files as `SYNCHRONIZED`, restored the current M4/M5 gate set, and both `corrective:check` and `interactions:check` passed afterward.

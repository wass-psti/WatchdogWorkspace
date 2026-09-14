# M6 governed toolchain dispatch hotfix

## Defect

The first M6 RC correctly pinned Node `22.16.0` and npm `10.9.2`, but its public M6 commands assumed the caller had already executed `nvm use`. Launching `npm run runtime-schemas:*` from Node 24/npm 11 therefore failed before M6 could perform any milestone work.

## Correction

The package now provides `scripts/run-governed-toolchain.sh` as the public Stage B toolchain entry boundary.

When a public M6/Stage-B command starts under the wrong toolchain, the dispatcher:

1. reads the required Node version from `.nvmrc`;
2. reads the required npm version from `packageManager`;
3. detects the incoming Node/npm mismatch;
4. uses an existing standard NVM installation directly when available;
5. otherwise sources `nvm.sh`, installing the governed Node through NVM only when it is missing;
6. clears Bash command hashes after switching;
7. revalidates both Node and npm;
8. executes the governed internal command only after the exact pair is active.

The following public commands now self-dispatch:

- `npm run dependencies:ensure`
- `npm run stage-b:certify`
- `npm run runtime-schemas:check`
- `npm run runtime-schemas:status`
- `npm run runtime-schemas:activate`
- `npm run runtime-schemas:activate:release`

The internal `*:governed` scripts remain the exact implementation commands used after the toolchain boundary is satisfied.

## Regression coverage

`verify-stage-b-governed-toolchain-dispatch.mjs` reproduces the reported mismatch (`Node v24.20.0 / npm 11.19.0`) with a governed NVM Node `v22.16.0 / npm 10.9.2` available but no interactive `nvm` function loaded. It verifies that the dispatcher repairs PATH and executes the command under the governed pair.

The regression runs through `bootstrap:check`, `release:check`, CI, deployment, and aggregate project verification.

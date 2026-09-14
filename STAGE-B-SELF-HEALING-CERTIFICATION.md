# Stage B self-healing certification

This package replaces the previous repeated manual repair flow.

## Guarantees

1. `governance:check` synchronizes governed repository artifacts before verifying them. Existing stale CI/deployment workflows are upgraded automatically when required M4/M5/M6 contract gates are missing.
2. Dependency-requiring commands no longer assume `node_modules` already exists. `dependencies:ensure` verifies every exact direct dependency plus local `tsc`/`vite` binaries and runs `npm ci --ignore-scripts` only when installation is required.
3. Stage B public certification commands no longer assume the shell is already using the governed Node/npm pair. `scripts/run-governed-toolchain.sh` reads `.nvmrc` and `packageManager`, switches through NVM when necessary, revalidates Node `22.16.0` and npm `10.9.2`, then executes the governed command.
4. `lint`, `build`, `verify`, `verify:dev`, `verify:preview`, `check`, and `release:check` retain dependency preflight protection.
5. `stage-b:certify` is the single ordered certification entry point. It synchronizes governance, ensures dependencies, release-certifies M4, then M5, then M6, and refuses to finish unless all three report `active-certified`.
6. The distributable ZIP contains one uniquely named root directory so it should not be extracted over an older `Work-Management-App-v1.43.2` tree.

## Certification command

After extracting this archive and entering its uniquely named directory:

```bash
npm run stage-b:certify
```

Running `nvm use` first is optional. If the current shell is on Node 24/npm 11, the Stage B dispatcher automatically enters the governed Node/npm pair before certification.

Do not copy this package over a previous working tree. The certification command performs the required preparation and stops at the first real failure.

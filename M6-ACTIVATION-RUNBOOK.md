# M6 Activation Runbook

M6 public certification commands are self-dispatching. They may be launched even if the current terminal is using a different Node/npm version, provided the governed Node can be resolved through the standard NVM installation or `nvm.sh`.

Recommended full-platform certification:

```bash
npm run stage-b:certify
```

Direct M6 certification:

```bash
npm run runtime-schemas:activate:release
npm run runtime-schemas:status
```

The dispatcher will switch to Node `22.16.0` / npm `10.9.2` automatically before executing the governed implementation.

Expected final M6 status:

```text
M5 prerequisite state: active-certified
M6 activation state: active-certified
Target Zod: 4.5.4
package.json Zod: 4.5.4
package-lock root Zod: 4.5.4
resolved Zod: 4.5.4
```

If certification fails after Zod is installed/locked, do not remove the dependency. The milestone remains in a truthful pending-certification state until the first failing source/runtime gate is corrected.

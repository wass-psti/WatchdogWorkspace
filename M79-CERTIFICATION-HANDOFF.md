# M79 Certification Handoff

Canonical input is the newest valid M79 continuation candidate derived from the exact M78 certified baseline (`8414ed0a...e662f2`, source `43718888...7866a`).

Required fail-closed order: environment -> artifact/source validation -> dependency installation/integrity -> static verification -> deterministic tests -> browser/E2E -> dedicated M79 certification -> post-certification state/artifact validation -> historical regression -> checksum/package hygiene -> final checkpoint.

A certified M79 ZIP/PASS record is valid only if every required gate succeeds and the final local sentinel is reached. Do not certify from an earlier M78 or M79 candidate once a newer valid M79 checkpoint exists.

## Corrective v4 performance state
M79 preserves the certified M31 initial CSS ceiling of 590000 bytes. The v3 certification measured 597728 bytes and failed closed. Corrective v4 hoists 37 mode-invariant theme roles, prunes unused successor-only aliases, and removes six unreferenced palette steps without changing mode-dependent semantics. Full local certification remains required.
## Corrective v5 Shell semantic-verifier synchronization
The v4 certification proved the unchanged M31 production CSS budget at exactly 590000 bytes, then failed in the historical Shell UI verifier because SM1/SM2/SM5/SM6 counted physical declarations across light, dark, and system-dark scopes. M79 v4 intentionally hoists mode-invariant Shell semantic roles into shared `:root` to avoid redundant CSS. Corrective v5 synchronizes the full known Shell declaration-count verifier family to validate effective semantic availability, scope uniqueness, non-redundant overrides, and resolvable custom-property dependencies while retaining legacy three-scope enforcement when M79 is absent. `npm run verify:ui` passes across the complete UI verifier chain after this correction. Full local fail-closed certification remains required.


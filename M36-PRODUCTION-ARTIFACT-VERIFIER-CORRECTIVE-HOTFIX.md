# M36 Production Artifact Verifier Corrective Hotfix

## Scope

This corrective addresses the production-cutover artifact false positive observed after the M36 production build succeeded. The original M36 artifact verifier rejected any text occurrence of `src/main.ts` inside deployable text assets. That rule was too broad because Vite and Work Management runtime metadata legitimately preserve source identity strings after bundling even though the browser does not load those source files.

Observed release-chain behavior before this corrective:

- the production Vite build completed successfully;
- `verify:dist` passed with hashed JavaScript/CSS assets and no public source maps;
- the M36 artifact verifier then failed on a generated JavaScript chunk containing a metadata string for `src/main.ts`;
- M36 release-mode activation failed closed and restored the pending state, which is the correct transactional behavior.

## Corrective implementation

`scripts/verify-production-cutover-artifact.mjs` now uses `executable-reference-only-v2` semantics.

Allowed:

- Vite manifest source identity metadata such as `"src": "src/main.ts"`;
- bundled application/runtime metadata values such as `performanceStartupInstrumentation: "src/main.ts"`.

Still rejected fail-closed:

- HTML `src`/`href` references to the source entry;
- JavaScript static imports/exports from the source entry;
- JavaScript dynamic imports of the source entry;
- network/worker source-entry URLs;
- JavaScript DOM `src`/`href` assignments to the source entry;
- JavaScript `setAttribute("src"|"href", ...)` source-entry references;
- service-worker registration against the source entry;
- CSS `url(...)` references to the source entry;
- executable/network/resource references targeting `localhost` or `127.0.0.1`;
- Vite development-client references;
- unresolved `%BASE_URL%` placeholders;
- public source maps;
- missing required production artifacts.

The existing `scripts/verify-dist.mjs` remains authoritative for Vite manifest-to-emitted-file mapping, hashed production shell assets, embedded runtime entries, service-worker asset membership, and public source-map policy.

## Regression coverage

`scripts/verify-production-cutover-execution.mjs` covers eighteen vectors:

- valid production fixture;
- allowed bundled source-identity metadata;
- allowed Vite manifest source-identity metadata;
- allowed localhost/loopback validation/fallback policy values;
- forbidden source map;
- forbidden localhost fetch target;
- forbidden loopback DOM resource target;
- missing service worker;
- forbidden HTML source-entry reference;
- forbidden dynamic source-entry import;
- forbidden static source-entry import;
- forbidden network source-entry reference;
- forbidden DOM source-entry assignment;
- forbidden DOM source-entry attribute assignment;
- forbidden service-worker source-entry registration;
- forbidden Vite development-client HTML reference;
- forbidden Vite development-client import;
- forbidden unresolved `%BASE_URL%` placeholder.

The M36 architecture verifier asserts both the corrective source-entry policy and its regression coverage.

## Certification state

This corrective does not self-certify M36. The source target remains `implementation-complete-pending-certification` until the corrected full release-mode chain succeeds and the external production deployment requirements are satisfied. M35 remains the required `active-certified` prerequisite. The supplied certification run proved M35 activation successfully, and this corrective baseline carries that governed `active-certified` state forward so the user does not have to re-certify an unchanged M35 implementation before rerunning M36.

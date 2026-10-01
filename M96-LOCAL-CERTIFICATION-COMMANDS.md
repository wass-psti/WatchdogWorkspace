# M96 Local Certification — v4 Corrective Continuation

**Continuation state:** IMPLEMENTATION COMPLETE — LOCAL VERIFICATION/CERTIFICATION REMAINS

The v4 corrective checkpoint synchronizes the historical M95→M94 source guard with M96 successor authority while preserving strict predecessor protection. The local certifier now fail-fast validates the M96 source guard, the direct M95→M96 delegation, and the historical `token-theme:source-guard` chain before dependency installation.

Required fail-closed order:

1. environment preparation;
2. workspace/repository checksum and source-guard validation;
3. exact dependency installation and integrity validation;
4. static verification, typecheck, lint, and production build;
5. deterministic automated tests;
6. browser/E2E gate;
7. dedicated M96 certification;
8. post-certification state validation;
9. 212-verifier historical regression plus aggregate `release:check`;
10. checksum/package hygiene;
11. final checkpoint validation;
12. certified artifact publication and Downloads handoff.

No certified artifact or PASS state is valid if any required stage fails, is skipped, or remains indeterminate.

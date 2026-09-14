# M42 Hosted Certification Revision Binding Corrective

## Defect

The hosted certification workflow named its artifact with `github.sha`, but the final PASS record did not bind the certified baseline to the exact Git revision that executed certification. Manual dispatch also did not require the intended commit SHA. A successful run could therefore certify a valid but unintended revision without that mismatch being explicit in the certification record.

## Corrective

- `workflow_dispatch` requires `expected_commit_sha`.
- The hosted runner fails before certification unless `expected_commit_sha == GITHUB_SHA`.
- The finalizer records `CERTIFIED SOURCE TREE SHA-256` and `CERTIFIED SOURCE COMMIT` in the PASS record.
- The finalizer re-verifies both provenance bindings before committing certified artifacts.
- The hosted workflow independently recomputes the M42 source-tree digest and verifies both source-tree and commit bindings in the PASS record.
- The deterministic hosted-workflow verifier and M42 static contract enforce these requirements.

No Users/RBAC runtime, UI, migration, or database business logic is changed by this corrective.

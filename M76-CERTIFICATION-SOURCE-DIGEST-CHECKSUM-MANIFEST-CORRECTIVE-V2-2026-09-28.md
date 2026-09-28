# M76 Certification Source Digest / Checksum Manifest Corrective v2 — 2026-09-28

## Root cause
M76 source identity included `CHECKSUMS.sha256`, even though that manifest is regenerated after staged certification state activation. The state files are normalized by the source-tree digest, but the regenerated checksum manifest records their active-certified bytes and therefore changes after `SOURCE_BEFORE` is captured.

## Correction
`CHECKSUMS.sha256` is excluded from normalized M76 source identity as derived integrity metadata. It remains independently fail-closed through `sha256sum -c CHECKSUMS.sha256` plus certified-artifact and package-hygiene verification.

This removes the self-referential source-digest dependency while retaining payload-integrity enforcement.

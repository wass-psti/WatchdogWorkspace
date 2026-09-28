# M75 corrective — M42 cross-platform staged file-mode reproducibility

## Originating failure
The M75 corrective-v2 local certification failed in the M42 finalizer rollback successful-publication fixture on macOS after staged secret scanning passed. The M42 source-tree digest includes stable file modes, while the staged payload is materialized through the host tar implementation.

## Root cause
Archive extraction is not a cross-platform permission-normalization contract. BSD tar on macOS may apply the caller's umask differently from GNU tar when restoring regular-file modes. That can leave source and staged payloads byte-identical but mode-different, causing the fail-closed content+mode certification parity digest to reject an otherwise valid staged copy.

## Correction
M42 now captures the certified source manifest before dedicated certification, including each stable file's certified mode. After staging, private/generated/local files are pruned and symlinks are rejected. The finalizer then reapplies the exact certified modes to staged regular files before the staged secret scan and the existing full content+mode parity check.

This does not weaken certification parity: missing files, extra files, changed bytes, changed types, symlinks, or incorrect final modes still fail. It only makes the staging transport deterministic across archive implementations.

## Regression protection
M75 deterministic verification requires source-manifest capture and staged certified-mode restoration to occur before the staged secret scan and staged source parity check.

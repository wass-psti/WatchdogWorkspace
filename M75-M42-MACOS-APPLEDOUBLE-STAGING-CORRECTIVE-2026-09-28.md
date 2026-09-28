# M75 corrective — M42 macOS AppleDouble staging reproducibility

## Originating failure

The M75 corrective-v1 local certification reached the inherited M42 finalizer rollback suite. The staged secret-scan ordering correction worked, but the stubbed successful-publication case failed normalized source parity on macOS after the staged payload passed secret scanning.

## Root cause

M42 stages the project through the platform `tar`/`zip` tools. On macOS, Archive Utility/libarchive copyfile behavior can materialize AppleDouble `._*` metadata sidecars unless `COPYFILE_DISABLE=1` is set. These files are filesystem metadata, not repository source, and were not part of the pre-certification source tree. Their appearance in the staged payload caused a macOS-only parity mismatch.

## Correction

- set `COPYFILE_DISABLE=1` for both M42 tar creation/extraction and ZIP publication;
- prune any `._*` sidecars from the staged payload before security/parity validation;
- classify `._*` as local/generated metadata in the M42 certification-tree helper;
- forbid `._*` in the staged-package hygiene check and ZIP exclusion list;
- extend the M42 finalizer rollback success fixture with an explicit AppleDouble sentinel and require that it is absent from the certified baseline.

The staged secret scan remains before normalized source parity. The parity gate remains mandatory and unchanged for actual source files and modes.

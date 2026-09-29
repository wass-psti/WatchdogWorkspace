# M77 Git-Restorable Source Identity Corrective v7 — 2026-09-28

## Origin

The corrective-v6 locally certified source was published successfully at commit `c969c07147fe8f4ed174c2ac97eb287bc5062f08`, and all 23 hosted GitHub Actions workflows completed successfully. The final fresh-clone restoration proof nevertheless failed: the certified archive normalized source SHA was `b12ec07151da5b4f74f770dd856f339ca88b8454d6667d0c2048fd2fb3e5cd04`, while a fresh Git clone of the exact published commit produced `6c214e08721a317df0ff31645de2e7d7bb95ba96466e6197dcf55b3c5088c9f2`.

## Root cause

The M77 certification-tree identity hashed raw POSIX permission bits (`stat.mode & 0o777`). Those bits are not fully represented by Git. Git preserves file type and the executable bit for regular files, but it does not preserve archive-specific read/write permission variants such as `0666` versus `0644` or `0777` versus `0755`.

The certified ZIP and pre-commit publication workspace therefore could share identical contents and archive permissions while a deterministic fresh Git checkout legitimately normalized those permissions, changing the old M77 tree hash even though the Git-restorable repository state was identical.

## Corrective delta

M77 source identity now hashes Git-restorable mode semantics:

- regular non-executable file: `100644`
- regular executable file: `100755`
- symbolic link: `120000`

Raw non-Git-restorable POSIX permission bits are no longer part of M77 source identity.

The deterministic M77 verifier now proves both directions:

1. changing only archive/read-write permission variants (`0666` → `0644`, `0777` → `0755`) must not change source identity;
2. changing the Git-tracked executable bit (`0755` → `0644`) must change source identity.

## Scope boundary

This corrective changes certification/restoration identity semantics only. It does not modify production application behavior, database schema, migrations, RLS, grants, RPCs, UI behavior, or deployment topology.

## Exit criterion

The corrective loop exits only after a newly certified v7 baseline is published and a fresh clone of that exact Git commit reproduces the certified M77 source SHA, with all required hosted workflows successful.

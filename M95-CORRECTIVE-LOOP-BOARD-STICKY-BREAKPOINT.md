# M95 Corrective Loop — Board Sticky Breakpoint

## Classification

**CORRECTIVE LOOP**

## Origin

The v9 local certification run passed the prior Shell M2 mobile-drawer containment failure and proceeded through M95 browser verification, dedicated certification, post-certification state validation, all 211 historical verifiers, adaptive CSS budget validation, build/dist/cutover/preview gates, and into the aggregate browser integration suite.

## Failed gate

`release:check` → aggregate browser integration suite → Monday-style Board presentation audit.

## Exact failure

At the 820px compact-workspace scenario the existing browser assertion failed with `desktop Board view/toolbar chrome remains sticky`.

## Root-cause classification

**Implementation — responsive breakpoint ownership regression.**

A Board narrow-mode media block that releases `.monday-board-control-stack` from sticky positioning and converts `.monday-board-toolbar` from grid to flex had been normalized from its historical narrow threshold into the canonical tablet query (`max-width:52.5rem`, 840px). That caused the narrow/mobile presentation mode to activate at 820px even though the certified Board presentation contract requires sticky/grid composition above the narrow boundary.

## Corrective delta

The narrow-mode block is now governed by the canonical M95 narrow breakpoint (`max-width:40rem`, 640px). The independent tablet-level `max-width:52.5rem` rule remains in place for intentional progressive disclosure of lower-priority People/Columns commands. No browser assertion was weakened or removed.

## Forward evidence

Repository-level M95 responsive verification, historical Board/Shell verifiers, syntax/type/lint/build checks, and deterministic tests must remain green after this delta. The decisive runtime evidence is a clean replay of the same Monday-style Board audit at 1440, 1080, 820, 390, and coarse-pointer 390 viewports.

## Exit criterion

The loop exits only when the unchanged aggregate browser audit passes the 820px sticky/grid contract and all remaining package-hygiene, final-checkpoint, certified-publication, checksum, and Downloads-handoff gates pass.

## Status

**ACTIVE — corrected in repository; local runtime replay remains.**

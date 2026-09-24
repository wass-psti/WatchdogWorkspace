# M52 Playwright Template Content Corrective — 2026-09-23

## Origin
Candidate 03 authenticated Playwright host-route scenarios reached the board capability assertions and failed because Playwright `toContainText()` was applied to an HTML `<template>` element.

## Root cause
`HTMLTemplateElement` stores its markup in the template content fragment rather than exposing that markup as rendered text on the host element. Playwright therefore observed an empty text value even though the menu capability markup existed in `template.innerHTML`.

## Correction
The Owner, Editor, and Viewer board menu templates remain scoped to their stable board-card `data-board-id` containers. The test now reads each template's `innerHTML` via `locator.evaluate()` and performs positive/negative `Archive board` capability assertions against the stored markup.

No RBAC expectation, platform role, Board membership rule, or embedded-module role mapping was weakened.

## Exit condition
Candidate 04 must complete 10/10 authenticated Playwright scenarios, then build/dist/preview, dedicated M52 certification, post-certification state validation, historical regression, certified payload hygiene, and final checkpoint validation.

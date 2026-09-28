# M77 Certification Handoff

Canonical input: the M77 continuation candidate generated from active-certified M76.

Required fail-closed order: environment → artifact/source validation → dependency materialization → M77 static → M77 deterministic → exact Playwright browser provisioning → Chromium/Firefox/WebKit × device matrix → complete release gate → dedicated M77 certification → post-certification artifact verification → historical regression → package hygiene → final checkpoint.

A certified M77 ZIP/PASS record is valid only when every gate succeeds and the terminal sentinel `ALL REQUIRED M77 LOCAL CERTIFICATION GATES PASSED` is reached.

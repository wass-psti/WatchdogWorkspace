# M88 Certification Handoff

Canonical input: M87 certified baseline ZIP SHA-256 `260ed2de533e7f9536f63c91b5b69b152326d9f3bb7e3a65d3a4cf3c75aaab25` and normalized source SHA-256 `5420f687989d0ca2bc0c9670e901c0e5fa5560a061a6436056826959910a370f`.

M88 remains pending local certification until dependency, static, deterministic, browser/E2E, dedicated certification, post-certification, historical regression, package hygiene, final checkpoint and certified publication gates pass.

Corrective v2 note: the first local certification exposed an M88 CSS-budget regression (`615680 > 612000`). The corrective checkpoint removes duplicated predecessor CSS without weakening the M31 budget. Full clean local certification must be restarted from Stage 1 against the corrective-v2 RC.


Corrective v3 note: corrective-v2 measured `initialCssRawBytes=612320`. M84's own authority declares 612000 historical provenance rather than a permanent limit, so M88 now registers an evidence-based successor ceiling of 613000 with 680 bytes measured headroom. The full fail-closed certification must restart from Stage 1 and prove `performance:bundle` against this governed M88 threshold.

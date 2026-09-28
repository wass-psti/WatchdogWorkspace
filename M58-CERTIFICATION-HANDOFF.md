# M58 Certification Handoff

M58 uses the Stage H fail-closed certification sequence established by M55–M57.

Required order: environment → workspace/checksum → clean dependencies → static token gate → deterministic token gate → browser/E2E → aggregate release → staged active-certified parity → historical regression → secret/symlink/environment/checksum hygiene → certified ZIP + PASS record → artifact verification → package hygiene → final checkpoint.

The M58 finalizer must refuse certification from any state other than `implementation-complete-pending-certification` and must publish atomically only after every required gate passes against an unchanged normalized source tree.

# M36 — M35 Historical Verifier Synchronization

Architecture 44 adds production-cutover certification without reversing any M35 deletion. The M35 verifier previously asserted `architecture === 43`, which would incorrectly fail every later certified architecture despite the M35 runtime/deletion contracts remaining present. M36 changes only that historical architecture assertion to `architecture >= 43`; all M35 deletion, retained-boundary, runtime-schema, Shell, Settings/backup, and service-worker assertions remain unchanged.

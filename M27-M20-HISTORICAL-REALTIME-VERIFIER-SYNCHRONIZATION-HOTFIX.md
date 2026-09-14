# M27 — M20 historical Realtime verifier synchronization

Stage F M27 intentionally transfers client-side realtime transport/token lifecycle ownership from the Board feature adapter to the platform realtime authority while preserving the certified M20 server protocol, private Board topic, Broadcast/Presence semantics, canonical RPC refetch model, reconnect behavior, and accessible Board status lifecycle.

The historical M20 verifier previously required Board-internal implementation markers (`resolveRealtimeClient`, a feature-owned client reference, and direct Board service composition). Those markers became stale under Architecture 35 even though the M20 behavior remained intact.

The M20 verifier now validates the preserved behavioral contract plus M27 platform delegation: Boards request typed `board` topics, transport/token timers are not feature-owned, platform services construct the shared realtime authority, and the Board service remains the domain adapter. The M20 execution vectors continue to validate the low-level Supabase protocol independently.

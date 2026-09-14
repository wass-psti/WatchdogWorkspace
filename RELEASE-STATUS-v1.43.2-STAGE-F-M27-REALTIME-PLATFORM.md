# Release status — Stage F M27 Realtime platform architecture

- Version: 1.43.2
- Architecture: 35
- State: implementation-complete-pending-certification
- Prerequisite: M26 active-certified
- Realtime authority: authenticated private-channel platform
- Transport: existing Supabase Realtime WebSocket client
- Board adapter: migrated to platform-owned realtime
- Shared access-token refresh: implemented
- Same-topic reference counting: implemented
- Active channel limit: 24 by default
- Active realtime namespace: board
- Reserved namespaces: module, platform
- TimeTracker/FuelTrack+/TradeLink realtime migration: intentionally deferred behind existing iframe compatibility boundaries
- New external dependency: none
- Supabase migration: none

M27 is complete at the implementation level when realtime transport ownership is centralized in platform services, Boards consume that authority without changing certified M20 server semantics, topic/channel lifecycle is bounded, and non-authorized namespaces remain disabled rather than being exposed optimistically.

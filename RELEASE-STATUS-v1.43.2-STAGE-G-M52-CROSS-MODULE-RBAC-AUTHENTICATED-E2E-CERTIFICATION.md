# Work Management App v1.43.2 — Stage G M52

Milestone: Cross-Module RBAC & Authenticated E2E Certification
State: active-certified
Semantics: 1.43.2-m52-v1

M52 certifies the host/application authorization boundary across Admin/General Manager, HR, Supervisor, Employee, and disabled accounts. It covers Boards, Users, Settings, Account, TimeTracker, FuelTrack+, and TradeLink with Playwright against a controlled Supabase-compatible backend fixture.

Authorization boundaries:
- Work Management platform role controls host administration and module access.
- Users is Admin/General Manager only.
- Account, Settings, and Boards collection are available to active authenticated accounts.
- Board permissions remain board-member-role scoped and are not inferred from platform role.
- Embedded modules receive application-scoped roles through the identity bridge.
- Disabled accounts fail closed across host and embedded routes.

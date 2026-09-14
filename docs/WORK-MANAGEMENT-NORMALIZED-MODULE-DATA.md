# Work Management — Stage E M22 Normalized module data foundation

Canonical registry: `config/modules.ts`. Typed contract/schema/service normalize TimeTracker, FuelTrack+, and TradeLink over the existing authorized Supabase module-state RPCs. Legacy keys remain the server representation. Malformed registered state is surfaced as invalid; unknown historical state is surfaced as unmapped and is not silently discarded. Same-origin iframe islands remain for later Stage E milestones. No Supabase migration or external dependency is required.

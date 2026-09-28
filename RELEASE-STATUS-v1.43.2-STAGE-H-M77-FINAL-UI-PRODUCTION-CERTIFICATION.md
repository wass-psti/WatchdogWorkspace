# Work Management App v1.43.2 — Stage H M77

**Milestone:** Cross-Device, Cross-Browser & Final UI Production Certification  
**State:** active-certified

The original M77 baseline was certified, but post-publication hosted CI exposed an inherited M49 CDP portability defect. Subsequent fail-closed corrective certification also exposed a mobile iframe settlement race and repository-source mutation caused by historical disposable-Supabase verification runners inheriting repository process working directory state.

The cumulative corrective implementation now includes the M49 CDP portability fix, mobile iframe settlement fix, and comprehensive workspace/process-CWD isolation for retained disposable database runners and Supabase CLI probes. The current repository remains intentionally pending certification until the complete corrective-v6 local pipeline and required hosted workflows pass.

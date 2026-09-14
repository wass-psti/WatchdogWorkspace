# M40 Motion Historical Verifier Synchronization

Milestone 40 centralizes route-transition overlay cleanup and focus transfer in the route ownership/lifecycle coordinator instead of performing those effects directly inside the `hashchange` callback.

`verify-motion.mjs` now preserves the original motion guarantees while recognizing Architecture 48 ownership semantics:

- hash navigation still renders through `transitionUpdate(..., 'route')`;
- command palette, account menu, tooltip, global overlays, and mobile navigation are cleared before a committed route presentation transition;
- focus moves to the shell main content only after the current route generation commits;
- stale route generations cannot steal focus;
- the legacy duplicate hashchange-specific cleanup/focus choreography is rejected under Architecture 48;
- the root document View Transition remains disabled and existing reduced-motion/content/ripple/module-frame motion contracts remain required.

This synchronization changes the verifier's ownership expectation only. It does not relax the motion or accessibility contract.

The Shell M7 responsive/accessibility and Shell M8 production-integration historical verifiers are synchronized to the same Architecture 48 focus ownership boundary. They continue to require hash-route rendering and main-content focus transfer, but now also require the route-generation stale-focus guard rather than requiring focus code to be embedded literally in the hashchange callback.

The historical v1.23 Phase 2 architecture verifier is also synchronized for Architecture 48: central route-policy certification now recognizes presentation-owner resolution and the two-argument ownership transition required by M40, while retaining redirect/login policy assertions and the existing executable ownership/auth-gating behavior tests.

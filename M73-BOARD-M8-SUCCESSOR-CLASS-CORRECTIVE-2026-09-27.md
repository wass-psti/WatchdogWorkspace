# M73 Board M8 successor-class corrective

The M8 Kanban accessibility verifier previously required an exact pre-M73 `class` attribute. M73 adds certified shared semantic classes while preserving `role=region`, labels, and keyboard focusability. The verifier now checks those semantic invariants while allowing additive M73 classes; M73 deterministic verification requires this successor-aware contract.

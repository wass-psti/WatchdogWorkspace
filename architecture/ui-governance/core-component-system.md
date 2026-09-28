# Core Component System — M64

M64 consolidates the shared component ownership model without rewriting certified consumers. The typed React design-system API is canonical for new shared component work. `assets/css/foundation/components.css` remains the framework-agnostic presentation compatibility authority and the existing Ark-based interaction components remain certified behavioral authorities.

M64 adds typed Badge and Toolbar components because those presentation primitives already existed in `components.css` but had no canonical React API. Forms/data entry remain M65-owned, overlays M66-owned, and feedback/empty/error UX M67-owned. Host and application migrations remain M72–M76.

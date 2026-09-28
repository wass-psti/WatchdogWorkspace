# M67 System Feedback Architecture

M67 consolidates system-feedback semantics without rewriting certified feature consumers.

## Ownership
- M63 owns live-region mechanics.
- M14 remains the compatibility authority for the global toast queue.
- M66 owns `#toastRoot` page-lifetime portal ownership.
- M67 owns shared feedback taxonomy and typed presentation semantics.

## Rules
1. Persistent feedback remains visible in context and is not a live region by default.
2. Empty states describe absence and do not announce automatically.
3. Loading states expose `aria-busy` and visible explanatory text.
4. Recoverable errors expose action slots; assertive announcement is explicit, never inferred merely from red/error styling.
5. Transient announcement semantics reuse M63 `WMLiveRegion`.
6. Color is supplementary; text and structure carry meaning.
7. Existing application/module toast and error implementations remain compatibility authorities until M72–M76.

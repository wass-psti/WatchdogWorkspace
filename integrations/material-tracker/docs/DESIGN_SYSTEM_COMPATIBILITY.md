# Material Tracker Design-System Compatibility

Material Tracker is prepared as an embedded Work Management module without owning global UI state.

## Host-owned surfaces
- Application shell, navigation, authentication, active workspace, account menu, and appearance remain host-owned.
- Tailwind preflight is disabled.
- Module tokens are scoped beneath `[data-module="material-tracker"]`.
- The module does not import external fonts.
- Embedded mode never mutates the document-level light/dark class.

## Local primitive compatibility layer
`src/components/ui/*` is retained as a module-local compatibility layer because the generated Material Tracker UI depends on its exact Radix/shadcn-style prop contracts. These components are not exported globally and are reachable only through `@material/components/*` aliases. This avoids host namespace collisions while preserving behavior. A future host-native visual refactor may replace individual wrappers incrementally without changing the module integration contract.

## Overlay and toast behavior
Material Tracker overlays remain module-triggered and use the same host CSS token namespace. They do not install a second router, authentication provider, or document theme controller.

# M78 — Visual-System Foundation & Repository Baseline Guard

M78 establishes the governed starting architecture for the Workspace-wide Futuristic Minimalist migration. It is intentionally non-visual: production presentation/runtime files are frozen to M77 while ownership, migration boundaries, provenance, and deterministic regression guards are established.

## Scope

1. Bind the program to the certified M77 source identity and published commit.
2. Inventory current presentation ownership after completion of the M56-M77 UI program.
3. Define successor mutation ownership for M79-M98.
4. Freeze all production presentation/runtime roots against an M77 byte-and-mode manifest for M78.
5. Provide a reusable M77 restoration verifier for clean restored baselines.
6. Add aggregate `check` and `release:check` enforcement so the M78 guard cannot be bypassed by normal project verification.

## Non-goals

M78 does not intentionally restyle or refactor application screens. It does not change tokens, themes, component visuals, shell geometry, Boards UI, embedded-module UI, authentication UI, data layout, responsive behavior, accessibility behavior, or motion behavior.

M78 also does not modify database schema/migrations, backend APIs, Supabase policies, runtime persistence, authorization, routing, or module business logic.

## Exit criteria

- Static M78 architecture/inventory verification passes.
- Deterministic protected-presentation manifest verification passes.
- M77 restoration verifier proves the supplied authoritative baseline restores certified source SHA `4a07b2a7dbc876159858b208bd366e38115030702434fcde501f35c2bd6cd5b9`.
- Existing applicable lint/type/build and regression gates are executed successfully to the extent supported by the environment.
- Repository-complete M78 continuation ZIP restores the same M78 checkpoint source state.

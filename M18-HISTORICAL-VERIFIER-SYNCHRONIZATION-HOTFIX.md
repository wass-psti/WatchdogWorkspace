# M18 Historical Verifier Synchronization Hotfix

Milestone 18 expands the Main Table hidden keyboard guidance to document both Tab and logical arrow-key navigation across virtualized row/column windows. The historical Boards Milestone 8 verifier previously required the exact pre-virtualization sentence `Use Tab to move through interactive cells.`.

The verifier now checks the two preserved semantic guarantees independently:

- `Use Tab or arrow keys to move through interactive cells.`
- `Column resize handles support Arrow Left and Arrow Right.`

No historical accessibility requirement is weakened. The synchronization only accepts the stronger M18 copy while retaining the original keyboard resize contract.

## Final historical verifier synchronization set

During complete M18 release certification, the aggregate historical verifier
chain exposed three source-text compatibility assertions whose protected
runtime behavior remained intact.

### v1.19 Work Boards

Historical expectation:

`dragDrop.bind(root)`

Current authority:

`dragDrop?.bind(root)`

The controller remains bound to the Board root. Optional chaining reflects the
current nullable controller lifecycle and preserves null-safe activation.

The historical verifier accepts both the original direct binding syntax and
the current null-safe binding syntax.

### v1.23 Architecture Phase 2

Historical expectation:

`dragDrop.dispose()`

Current authority:

`dragDrop?.dispose()`

Board deactivation still performs the complete historical cleanup contract:

- pending Board data loads are cancelled;
- deferred preference persistence is cancelled;
- drag/drop listeners are disposed;
- Item Workspace state is reset;
- column workflows are reset;
- dialogs are closed.

The current M18 lifecycle additionally resets table virtualization state and
cancels both virtualization animation-frame queues before route ownership is
released.

The historical verifier now accepts both direct and null-safe drag/drop
disposal syntax. No runtime cleanup behavior was weakened.

### v1.33 Grouped Board Sheet

Historical expectation required the exact contiguous markup fragment:

`data-open-item="${item.id}" title="Open`

The current item-name control remains the direct Item Workspace trigger but now
contains logical grid-coordinate metadata between those attributes and uses a
more descriptive item-specific tooltip.

The synchronized verifier now checks the behavioral contract instead:

- the item-name renderer remains `item-inline-title`;
- the renderer carries `data-open-item="${item.id}"`;
- the Board event runtime handles `[data-open-item]`;
- the handler delegates directly to `itemWorkspace.open(itemId)`.

This preserves the original v1.33 guarantee without depending on HTML attribute
ordering or obsolete tooltip wording.

## Scope

These synchronizations modify historical verification only.

They do not change:

- Board runtime behavior;
- virtualization policy;
- Item Workspace behavior;
- drag/drop behavior;
- application dependencies;
- Supabase schema or migrations;
- M17 TanStack Table decision;
- architecture version 27.

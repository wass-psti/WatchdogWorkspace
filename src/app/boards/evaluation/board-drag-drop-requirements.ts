export type BoardDragDropRequirementSupport = 'native' | 'adapter' | 'product-owned';
export type BoardDragDropRequirementCriticality = 'required' | 'important' | 'optional';

export interface BoardDragDropRequirement {
  readonly id: string;
  readonly label: string;
  readonly criticality: BoardDragDropRequirementCriticality;
  readonly support: BoardDragDropRequirementSupport;
  readonly rationale: string;
}

export const BOARD_DRAG_DROP_REQUIREMENTS = Object.freeze([
  {
    id: 'react-19-compatibility',
    label: 'Remain compatible with the certified React 19.2 runtime',
    criticality: 'required',
    support: 'native',
    rationale: 'The current @dnd-kit/react 0.5.x adapter declares React and React DOM 18 or 19 peer compatibility.',
  },
  {
    id: 'pointer-touch-keyboard-sensors',
    label: 'Support pointer, touch, and keyboard interaction without a separate HTML5 backend',
    criticality: 'required',
    support: 'native',
    rationale: 'dnd-kit exposes sensor-driven drag primitives and keyboard support suitable for mouse, touch, and keyboard input.',
  },
  {
    id: 'collision-and-overlay-primitives',
    label: 'Provide collision detection and drag-overlay primitives for dense Board surfaces',
    criticality: 'important',
    support: 'native',
    rationale: 'The modern dnd-kit packages expose collision, geometry, droppable, draggable, sortable, and overlay building blocks.',
  },
  {
    id: 'item-table-reorder',
    label: 'Preserve item reordering within a Table group',
    criticality: 'required',
    support: 'adapter',
    rationale: 'Sortable primitives can model ordering, but Work Management must translate drag outcomes into stable Board item IDs and command-service positions.',
  },
  {
    id: 'cross-group-item-move',
    label: 'Preserve cross-group item movement with target position',
    criticality: 'required',
    support: 'adapter',
    rationale: 'Drop targets can identify groups, while Work Management must preserve group membership, target position, optimistic state, rollback, and persistence semantics.',
  },
  {
    id: 'kanban-status-move',
    label: 'Preserve Kanban status-lane movement and same-lane no-op suppression',
    criticality: 'required',
    support: 'adapter',
    rationale: 'Droppable lanes map well to dnd-kit, but status normalization and no-op suppression remain Board domain behavior.',
  },
  {
    id: 'group-reorder',
    label: 'Preserve Board group structural reordering',
    criticality: 'required',
    support: 'adapter',
    rationale: 'Sortable primitives can represent groups, but position persistence and history remain application-owned.',
  },
  {
    id: 'column-reorder',
    label: 'Preserve dynamic Board column structural reordering',
    criticality: 'required',
    support: 'adapter',
    rationale: 'Dynamic columns require Work Management identifiers, sticky geometry, resize coexistence, and command-service ordering around the library primitives.',
  },
  {
    id: 'keyboard-order-contracts',
    label: 'Preserve Arrow/Home/End reorder commands, focus restoration, and boundary feedback',
    criticality: 'required',
    support: 'adapter',
    rationale: 'dnd-kit has keyboard support, but the certified Work Management keyboard contract and focus recovery must remain explicit and testable.',
  },
  {
    id: 'screen-reader-announcements',
    label: 'Preserve Board-specific live-region announcements',
    criticality: 'required',
    support: 'adapter',
    rationale: 'dnd-kit provides accessibility infrastructure, while Work Management must retain domain-specific announcement wording and outcomes.',
  },
  {
    id: 'optimistic-history-rollback',
    label: 'Preserve optimistic mutations, rollback, undo, and redo',
    criticality: 'required',
    support: 'product-owned',
    rationale: 'History and rollback are Board transaction semantics and must remain outside any drag/drop library.',
  },
  {
    id: 'command-service-authority',
    label: 'Keep BoardCommandService authoritative for persisted movement',
    criticality: 'required',
    support: 'product-owned',
    rationale: 'A drag/drop package may produce intent but must never become a persistence or domain-command authority.',
  },
  {
    id: 'virtualization-drag-freeze',
    label: 'Preserve M18 virtualization source-row stability during an active drag',
    criticality: 'required',
    support: 'product-owned',
    rationale: 'M18 deliberately freezes virtualization window rerenders while a mounted source row is owned by drag; a migration must reproduce this lifecycle boundary.',
  },
  {
    id: 'overlay-editor-isolation',
    label: 'Prevent drag activation from stealing interactive editors, menus, links, and overlays',
    criticality: 'required',
    support: 'adapter',
    rationale: 'Sensor activation constraints can help, but existing Board interaction and overlay ownership rules must be mapped explicitly.',
  },
  {
    id: 'disposable-route-lifecycle',
    label: 'Dispose all drag sensors/listeners on Board ownership transitions',
    criticality: 'required',
    support: 'adapter',
    rationale: 'The current controllers use AbortController-backed cleanup. Any provider or DOM-manager replacement must prove equivalent teardown and remount idempotency.',
  },
  {
    id: 'non-react-board-island',
    label: 'Fit the current Board DOM presentation engine without dual drag ownership',
    criticality: 'required',
    support: 'product-owned',
    rationale: 'The certified Board facade is React-owned at the route boundary, but the production drag surfaces are still rendered and event-bound by assets/js/boards-ui.ts.',
  },
  {
    id: 'native-html5-interop',
    label: 'Account for the current native DragEvent/dataTransfer implementation boundary',
    criticality: 'important',
    support: 'adapter',
    rationale: 'The current controllers use native dragstart/dragover/drop events. dnd-kit is sensor-driven, so event ownership changes rather than being a drop-in handler swap.',
  },
  {
    id: 'server-state-separation',
    label: 'Keep TanStack Query and repositories authoritative for server state',
    criticality: 'required',
    support: 'product-owned',
    rationale: 'Drag/drop produces movement intent only and must not create a competing data cache or persistence layer.',
  },
] as const satisfies readonly BoardDragDropRequirement[]);

export type BoardTableRequirementSupport = 'native' | 'adapter' | 'external';
export type BoardTableRequirementCriticality = 'required' | 'important' | 'optional';

export interface BoardTableRequirement {
  readonly id: string;
  readonly label: string;
  readonly criticality: BoardTableRequirementCriticality;
  readonly support: BoardTableRequirementSupport;
  readonly rationale: string;
}

export const BOARD_TABLE_REQUIREMENTS = Object.freeze([
  {
    id: 'react-19-compatibility',
    label: 'Remain compatible with the certified React 19.2 runtime',
    criticality: 'required',
    support: 'native',
    rationale: 'The evaluated React adapter supports React 18 or newer, which includes the certified React 19.2 runtime.',
  },
  {
    id: 'headless-markup',
    label: 'Preserve Work Management semantic markup and Monday-style presentation',
    criticality: 'required',
    support: 'native',
    rationale: 'TanStack Table is headless and does not require vendor-owned DOM or styling.',
  },
  {
    id: 'stable-row-identifiers',
    label: 'Preserve stable Board item identifiers independently of display order',
    criticality: 'required',
    support: 'native',
    rationale: 'The candidate supports application-defined row identity rather than positional identity.',
  },
  {
    id: 'typed-dynamic-columns',
    label: 'Map configurable Board columns to typed dynamic column definitions',
    criticality: 'required',
    support: 'native',
    rationale: 'Dynamic accessor/display column definitions align with the existing Board column registry.',
  },
  {
    id: 'sorting-filtering',
    label: 'Controlled sorting and filtering backed by existing Board preferences',
    criticality: 'required',
    support: 'adapter',
    rationale: 'Table features exist, but Work Management must remain authoritative for preference persistence and value normalization.',
  },
  {
    id: 'row-selection',
    label: 'Scoped row selection and range selection',
    criticality: 'required',
    support: 'adapter',
    rationale: 'Selection primitives exist, but group-scoped selection and existing history semantics must remain Work Management-owned.',
  },
  {
    id: 'column-sizing-ordering',
    label: 'Persistent column sizing, ordering, and sticky identity-column behavior',
    criticality: 'required',
    support: 'adapter',
    rationale: 'Sizing and ordering are available, while persistence, keyboard resizing, and sticky Work Management geometry require an adapter.',
  },
  {
    id: 'board-group-sections',
    label: 'Preserve Board groups as independent collapsible sections with group actions',
    criticality: 'required',
    support: 'external',
    rationale: 'Work Management groups are product structure, not a direct replacement for generic table row-grouping semantics.',
  },
  {
    id: 'typed-cell-editors',
    label: 'Preserve typed inline editors, explicit Enter/Escape/save/cancel, and no save-on-blur',
    criticality: 'required',
    support: 'external',
    rationale: 'TanStack Table does not own Work Management cell editors or persistence lifecycles.',
  },
  {
    id: 'drag-drop',
    label: 'Preserve item, group, and column drag/drop plus keyboard structural reordering',
    criticality: 'required',
    support: 'external',
    rationale: 'Drag/drop remains an application concern and must continue through the certified Board controllers or a separately governed adapter.',
  },
  {
    id: 'optimistic-history',
    label: 'Preserve optimistic mutations, rollback, undo/redo, and command-service ordering',
    criticality: 'required',
    support: 'external',
    rationale: 'These are Board domain/application semantics and must not move into a table library.',
  },
  {
    id: 'accessibility-keyboard',
    label: 'Preserve current keyboard grid navigation, resize/reorder controls, focus recovery, and ARIA contracts',
    criticality: 'required',
    support: 'external',
    rationale: 'Headless table state does not replace the product-specific keyboard and accessibility interaction layer.',
  },
  {
    id: 'overlay-item-workspace',
    label: 'Preserve menus, popovers, dialogs, Item Workspace, and M11 global overlay ownership',
    criticality: 'important',
    support: 'external',
    rationale: 'These surfaces are outside table-state responsibility and remain governed by existing React/overlay boundaries.',
  },
  {
    id: 'server-state',
    label: 'Preserve TanStack Query as authoritative Board server-state coordinator',
    criticality: 'required',
    support: 'external',
    rationale: 'TanStack Table must consume already-resolved Board data and must not become a fetch/cache authority.',
  },
  {
    id: 'client-state',
    label: 'Preserve Zustand and Board preference services as client-state authorities',
    criticality: 'required',
    support: 'adapter',
    rationale: 'Any table state must be controlled by or translated to existing Work Management state rather than creating a competing store.',
  },
  {
    id: 'virtualization',
    label: 'Permit future row virtualization without making it an M17 prerequisite',
    criticality: 'optional',
    support: 'external',
    rationale: 'Virtualization is a separate concern and is not needed to evaluate core table-state fit.',
  },
] as const satisfies readonly BoardTableRequirement[]);

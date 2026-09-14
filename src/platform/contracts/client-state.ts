export type ShellNavigationMode = 'expanded' | 'compact';
export type ShellSectionId = 'favorites' | 'applications' | 'boards';

export interface ShellNavigationPersistentState {
  readonly mode: ShellNavigationMode;
  readonly width: number;
  readonly pinned: boolean;
}

export interface ShellNavigationTransientState {
  readonly peek: boolean;
  readonly resizing: boolean;
  readonly mobileOpen: boolean;
}

export interface ShellNavigationClientState extends ShellNavigationPersistentState, ShellNavigationTransientState {}

export type ShellSectionClientState = Readonly<Record<ShellSectionId, boolean>>;

export interface ShellClientState {
  readonly navigation: ShellNavigationClientState;
  readonly sections: ShellSectionClientState;
  readonly resourceSearchQuery: string;
}

export interface WorkManagementClientStateSnapshot {
  readonly shell: ShellClientState;
}

export interface WorkManagementClientStateSeed {
  readonly navigation?: Partial<ShellNavigationPersistentState>;
  readonly sections?: Partial<ShellSectionClientState>;
}

export interface WorkManagementClientStateService {
  getSnapshot(): WorkManagementClientStateSnapshot;
  hydratePersistentShell(seed: WorkManagementClientStateSeed): WorkManagementClientStateSnapshot;
  updateShellNavigation(patch: Partial<ShellNavigationClientState>): WorkManagementClientStateSnapshot;
  setShellSection(section: ShellSectionId, expanded: boolean): WorkManagementClientStateSnapshot;
  setShellResourceSearchQuery(query: string): WorkManagementClientStateSnapshot;
  resetTransientShellState(): WorkManagementClientStateSnapshot;
  subscribe(listener: (snapshot: WorkManagementClientStateSnapshot, previous: WorkManagementClientStateSnapshot) => void): () => void;
}

export type ClientStateOwnershipKind =
  | 'server-state'
  | 'authentication-session'
  | 'persistent-domain-state'
  | 'persistent-preference'
  | 'shared-client-state'
  | 'feature-local-ui-state'
  | 'form-workflow-state'
  | 'derived-state';

export interface ClientStateOwnershipRule {
  readonly kind: ClientStateOwnershipKind;
  readonly authority: string;
  readonly examples: readonly string[];
  readonly mayUseZustand: boolean;
}

export const WORK_MANAGEMENT_CLIENT_STATE_OWNERSHIP = Object.freeze({
  serverState: Object.freeze({
    kind: 'server-state',
    authority: 'TanStack Query v5 + repositories',
    examples: Object.freeze(['Board lists', 'Board records', 'Item Workspace server data']),
    mayUseZustand: false,
  }),
  authenticationSession: Object.freeze({
    kind: 'authentication-session',
    authority: 'Work Management auth runtime + Supabase Auth',
    examples: Object.freeze(['session', 'identity', 'platform role', 'module assignments']),
    mayUseZustand: false,
  }),
  persistentDomainState: Object.freeze({
    kind: 'persistent-domain-state',
    authority: 'Supabase Postgres/RPC/Storage',
    examples: Object.freeze(['Board domain data', 'embedded module operational state', 'files']),
    mayUseZustand: false,
  }),
  persistentPreference: Object.freeze({
    kind: 'persistent-preference',
    authority: 'explicit preference persistence adapter with client-state hydration',
    examples: Object.freeze(['shell navigation mode/width/pin', 'shell section expansion']),
    mayUseZustand: true,
  }),
  sharedClientState: Object.freeze({
    kind: 'shared-client-state',
    authority: 'Work Management Zustand client-state service',
    examples: Object.freeze(['shell navigation transient state', 'shell resource search query']),
    mayUseZustand: true,
  }),
  featureLocalUiState: Object.freeze({
    kind: 'feature-local-ui-state',
    authority: 'owning feature/controller',
    examples: Object.freeze(['Board selection', 'inline editor draft', 'Home filters']),
    mayUseZustand: false,
  }),
  formWorkflowState: Object.freeze({
    kind: 'form-workflow-state',
    authority: 'owning form/workflow controller',
    examples: Object.freeze(['validation feedback', 'submission progress', 'unsaved form draft']),
    mayUseZustand: false,
  }),
  derivedState: Object.freeze({
    kind: 'derived-state',
    authority: 'selectors/computation from authoritative inputs',
    examples: Object.freeze(['filtered modules', 'visible Board items', 'capability-derived affordances']),
    mayUseZustand: false,
  }),
} as const satisfies Readonly<Record<string, ClientStateOwnershipRule>>);

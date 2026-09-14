import { createStore, type StoreApi } from 'zustand/vanilla';
import type {
  ShellClientState,
  ShellNavigationClientState,
  ShellSectionClientState,
  ShellSectionId,
  WorkManagementClientStateSeed,
  WorkManagementClientStateService,
  WorkManagementClientStateSnapshot,
} from '../../../../src/platform/contracts/client-state.ts';

export const ZUSTAND_VERSION = '5.0.15' as const;

const DEFAULT_SECTIONS: ShellSectionClientState = Object.freeze({
  favorites: true,
  applications: true,
  boards: true,
});

const DEFAULT_NAVIGATION: ShellNavigationClientState = Object.freeze({
  mode: 'expanded',
  width: 256,
  pinned: true,
  peek: false,
  resizing: false,
  mobileOpen: false,
});

const DEFAULT_SHELL: ShellClientState = Object.freeze({
  navigation: DEFAULT_NAVIGATION,
  sections: DEFAULT_SECTIONS,
  resourceSearchQuery: '',
});

const DEFAULT_SNAPSHOT: WorkManagementClientStateSnapshot = Object.freeze({ shell: DEFAULT_SHELL });

type ClientStateStoreApi = StoreApi<WorkManagementClientStateSnapshot>;

const finiteWidth = (value: unknown, fallback: number): number => {
  const number = Number(value);
  return Number.isFinite(number) && number > 0 ? number : fallback;
};

const freezeNavigation = (value: ShellNavigationClientState): ShellNavigationClientState => Object.freeze({ ...value });
const freezeSections = (value: ShellSectionClientState): ShellSectionClientState => Object.freeze({ ...value });
const freezeShell = (value: ShellClientState): ShellClientState => Object.freeze({
  ...value,
  navigation: freezeNavigation(value.navigation),
  sections: freezeSections(value.sections),
});
const freezeSnapshot = (value: WorkManagementClientStateSnapshot): WorkManagementClientStateSnapshot => Object.freeze({ shell: freezeShell(value.shell) });

export function createWorkManagementClientStateService(initial: WorkManagementClientStateSeed = {}): WorkManagementClientStateService {
  const store: ClientStateStoreApi = createStore<WorkManagementClientStateSnapshot>()(() => DEFAULT_SNAPSHOT);

  const replaceShell = (next: ShellClientState): WorkManagementClientStateSnapshot => {
    const snapshot = freezeSnapshot({ shell: next });
    store.setState(snapshot, true);
    return snapshot;
  };

  const service: WorkManagementClientStateService = {
    getSnapshot: () => store.getState(),
    hydratePersistentShell(seed) {
      const current = store.getState().shell;
      const navigation = seed.navigation ?? {};
      const sections = seed.sections ?? {};
      return replaceShell({
        ...current,
        navigation: {
          ...current.navigation,
          mode: navigation.mode === 'compact' ? 'compact' : navigation.mode === 'expanded' ? 'expanded' : current.navigation.mode,
          width: finiteWidth(navigation.width, current.navigation.width),
          pinned: typeof navigation.pinned === 'boolean' ? navigation.pinned : current.navigation.pinned,
        },
        sections: {
          favorites: typeof sections.favorites === 'boolean' ? sections.favorites : current.sections.favorites,
          applications: typeof sections.applications === 'boolean' ? sections.applications : current.sections.applications,
          boards: typeof sections.boards === 'boolean' ? sections.boards : current.sections.boards,
        },
      });
    },
    updateShellNavigation(patch) {
      const current = store.getState().shell;
      return replaceShell({
        ...current,
        navigation: {
          ...current.navigation,
          ...patch,
          width: patch.width === undefined ? current.navigation.width : finiteWidth(patch.width, current.navigation.width),
        },
      });
    },
    setShellSection(section: ShellSectionId, expanded: boolean) {
      const current = store.getState().shell;
      return replaceShell({
        ...current,
        sections: { ...current.sections, [section]: Boolean(expanded) },
      });
    },
    setShellResourceSearchQuery(query: string) {
      const current = store.getState().shell;
      return replaceShell({ ...current, resourceSearchQuery: String(query ?? '') });
    },
    resetTransientShellState() {
      const current = store.getState().shell;
      return replaceShell({
        ...current,
        navigation: { ...current.navigation, peek: false, resizing: false, mobileOpen: false },
        resourceSearchQuery: '',
      });
    },
    subscribe(listener) {
      return store.subscribe((snapshot, previous) => listener(snapshot, previous));
    },
  };

  if (initial.navigation || initial.sections) service.hydratePersistentShell(initial);
  return Object.freeze(service);
}

/**
 * One page-lifetime client-state service for shell-shared state only. Server state,
 * auth/session state, feature-local UI state, form workflow state, and domain
 * persistence intentionally remain outside this store.
 */
export const workManagementClientState = createWorkManagementClientStateService();

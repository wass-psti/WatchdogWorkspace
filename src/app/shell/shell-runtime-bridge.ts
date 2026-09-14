export type ReactShellMode = 'standalone' | 'shell';
export type ReactShellWorkspaceMode = 'page' | 'module';

export interface ReactShellRuntimeSnapshot {
  readonly mode: ReactShellMode;
  readonly navigationMarkup: string;
  readonly online: boolean;
  readonly cloudModeLabel: string;
  readonly platformVersion: string;
  readonly activeRoute: string;
  readonly workspaceMode: ReactShellWorkspaceMode;
}

export interface ReactShellRuntimePatch {
  readonly mode?: ReactShellMode;
  readonly navigationMarkup?: string;
  readonly online?: boolean;
  readonly cloudModeLabel?: string;
  readonly platformVersion?: string;
  readonly activeRoute?: string;
  readonly workspaceMode?: ReactShellWorkspaceMode;
}

const DEFAULT_SNAPSHOT: ReactShellRuntimeSnapshot = Object.freeze({
  mode: 'standalone',
  navigationMarkup: '',
  online: true,
  cloudModeLabel: 'Starting workspace',
  platformVersion: '1.43.2',
  activeRoute: 'boot',
  workspaceMode: 'page',
});

let snapshot = DEFAULT_SNAPSHOT;
const listeners = new Set<() => void>();

function freezeSnapshot(next: ReactShellRuntimeSnapshot): ReactShellRuntimeSnapshot {
  return Object.freeze({ ...next });
}

function publish(patch: ReactShellRuntimePatch): ReactShellRuntimeSnapshot {
  const next = freezeSnapshot({ ...snapshot, ...patch });
  if (
    next.mode === snapshot.mode
    && next.navigationMarkup === snapshot.navigationMarkup
    && next.online === snapshot.online
    && next.cloudModeLabel === snapshot.cloudModeLabel
    && next.platformVersion === snapshot.platformVersion
    && next.activeRoute === snapshot.activeRoute
    && next.workspaceMode === snapshot.workspaceMode
  ) return snapshot;
  snapshot = next;
  for (const listener of listeners) listener();
  return snapshot;
}

export const reactShellRuntime = Object.freeze({
  getSnapshot: (): ReactShellRuntimeSnapshot => snapshot,
  subscribe(listener: () => void): () => void {
    listeners.add(listener);
    return () => { listeners.delete(listener); };
  },
  showStandalone(activeRoute: string = 'standalone'): ReactShellRuntimeSnapshot {
    return publish({ mode: 'standalone', activeRoute });
  },
  showShell(patch: Omit<ReactShellRuntimePatch, 'mode'> = {}): ReactShellRuntimeSnapshot {
    return publish({ ...patch, mode: 'shell' });
  },
  update(patch: ReactShellRuntimePatch): ReactShellRuntimeSnapshot {
    return publish(patch);
  },
});

export function resolveReactShellRoot(): HTMLElement {
  const root = document.querySelector<HTMLElement>('[data-wm-react-shell-root]');
  if (!root) throw new Error('Work Management React shell root is missing.');
  return root;
}

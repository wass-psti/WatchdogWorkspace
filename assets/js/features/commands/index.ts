import { modules } from '../../../../config/modules.ts';
import type { ApplicationCommand, CommandPaletteContext, CommandSnapshot } from '../../../../src/platform/contracts/commands.ts';
import type { IconSet, Navigate, ToastRenderer, EscapeHtml } from '../../../../src/platform/contracts/ui.ts';
import { sharedApplicationUiRuntime } from '../../../../src/app/shared-ui/shared-application-ui-runtime.ts';
import { downloadWorkspaceBackup } from '../../core/backup.ts';
import { createCommandRegistry } from './command-registry.ts';

export interface CommandPaletteAuthPort {
  readonly isAuthenticated: boolean;
  readonly canManageUsers: boolean;
  readonly isCloudEnabled: boolean;
  canAccessModule(moduleId: string): boolean;
}

export interface CommandPaletteFeatureOptions {
  readonly auth: CommandPaletteAuthPort;
  readonly navigate: Navigate;
  readonly icons: IconSet;
  readonly escapeHtml: EscapeHtml;
  readonly toast: ToastRenderer;
  readonly motionEnabled: () => boolean;
  readonly getUserLabel?: (() => string) | null;
}

export interface CommandPaletteFeature {
  open(): void;
  close(options?: Readonly<{ immediate?: boolean }>): void;
  update(query: string): void;
  handleAction(action: Element | null, eventTarget?: Element | null): Promise<boolean>;
  handleInput(target: EventTarget | null): boolean;
  handleKeydown(event: KeyboardEvent): boolean;
  readonly registry: ReturnType<typeof createCommandRegistry>;
  activate(): void;
  deactivate(): void;
}

const errorMessage = (error: unknown, fallback: string): string => error instanceof Error ? error.message : fallback;
const commandSnapshot = ({ id, title, subtitle, icon, keywords }: ApplicationCommand): CommandSnapshot => Object.freeze({ id, title, subtitle, icon, keywords });
const activeElement = (): HTMLElement | null => typeof HTMLElement !== 'undefined' && document.activeElement instanceof HTMLElement ? document.activeElement : null;

/**
 * Stage C M14 command authority adapter.
 *
 * The typed registry and command semantics remain feature-owned here. React owns
 * command-palette presentation, focus, overlay lifecycle, and shared UI state
 * through sharedApplicationUiRuntime.
 */
export function createCommandPaletteFeature(options: CommandPaletteFeatureOptions): CommandPaletteFeature {
  const { auth, navigate, icons, toast, motionEnabled, getUserLabel } = options;
  const registry = createCommandRegistry();
  const moduleIcon = (mod: (typeof modules)[number]): string => mod.icon === 'fuel' ? icons.fuel : mod.icon === 'trade' ? icons.trade : icons.clock;

  modules.forEach((mod) => registry.register({
    id: `module:${mod.id}`,
    title: mod.name,
    subtitle: `${mod.eyebrow} · ${mod.capabilities.join(', ')}`,
    icon: moduleIcon(mod),
    keywords: mod.capabilities,
    when: () => auth.canAccessModule(mod.id),
    run: () => navigate(`app/${mod.id}`),
  }));
  registry.register({ id: 'navigate:home', title: 'Applications', subtitle: 'Work Management home', icon: icons.grid, keywords: ['home', 'launcher'], run: () => navigate('') });
  registry.register({ id: 'navigate:boards', title: 'Boards', subtitle: 'Create and manage collaborative work boards', icon: icons.boards, keywords: ['tasks', 'work'], run: () => navigate('boards') });
  registry.register({ id: 'navigate:settings', title: 'Settings', subtitle: 'Appearance, backup, cloud and storage health', icon: icons.settings, run: () => navigate('settings') });
  registry.register({ id: 'navigate:users', title: 'Users', subtitle: 'Manage accounts, roles and access status', icon: icons.users, when: () => auth.canManageUsers, run: () => navigate('users') });
  registry.register({ id: 'navigate:account', title: 'Account', subtitle: 'Profile, security and session controls', icon: icons.user, when: () => auth.isCloudEnabled, run: () => navigate(auth.isAuthenticated ? 'account' : 'login') });
  registry.register({
    id: 'workspace:backup', title: 'Export workspace backup', subtitle: 'Download an integrity-checked M34 recovery package', icon: icons.download, keywords: ['recovery', 'json', 'export'],
    run: async () => {
      try {
        const count = await downloadWorkspaceBackup(modules);
        toast(`Backup exported with ${count} data entr${count === 1 ? 'y' : 'ies'}.`);
      } catch (error) {
        toast(errorMessage(error, 'Backup export failed.'), 'warning');
      }
    },
  });

  function context(): CommandPaletteContext {
    return { authenticated: auth.isAuthenticated, canManageUsers: auth.canManageUsers, user: getUserLabel?.() || '' };
  }

  function list(query: string): readonly CommandSnapshot[] {
    const normalized = String(query || '').trim().toLowerCase();
    return Object.freeze(registry.list(context())
      .filter((command) => !normalized || `${command.title} ${command.subtitle} ${command.keywords.join(' ')}`.toLowerCase().includes(normalized))
      .map(commandSnapshot));
  }

  sharedApplicationUiRuntime.configureCommandPalette({
    list,
    execute: (id) => registry.execute(id, context()),
    motionEnabled,
  });

  function open(): void { sharedApplicationUiRuntime.openCommandPalette(activeElement()); }
  function close({ immediate = false }: Readonly<{ immediate?: boolean }> = {}): void { sharedApplicationUiRuntime.closeCommandPalette({ immediate, restoreFocus: true }); }
  function update(query: string): void { sharedApplicationUiRuntime.updateCommandQuery(query); }

  async function handleAction(action: Element | null): Promise<boolean> {
    if (action?.matches('button[data-command]')) {
      open();
      return true;
    }
    return false;
  }

  function handleInput(_target: EventTarget | null): boolean { return false; }

  function handleKeydown(event: KeyboardEvent): boolean {
    if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
      event.preventDefault();
      sharedApplicationUiRuntime.toggleCommandPalette(activeElement());
      return true;
    }
    return false;
  }

  function deactivate(): void { sharedApplicationUiRuntime.closeCommandPalette({ immediate: true, restoreFocus: false }); }
  return Object.freeze({ open, close, update, handleAction, handleInput, handleKeydown, registry, activate() {}, deactivate });
}

export { createCommandRegistry } from './command-registry.ts';
export const COMMANDS_FEATURE = Object.freeze({ id: 'commands', architecture: 'registry-react-shared-ui', shortcut: 'Mod+K' });

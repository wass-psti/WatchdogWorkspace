import type { PlatformPreferences, ThemePreference } from '../../core/platform.ts';
import { applyTheme, getPreferences, savePreferences } from '../../core/platform.ts';
import { createOverlayManager } from '../../platform/ui/overlay-manager.ts';
import { resolveGlobalOverlayRoot } from '../../platform/ui/global-overlay-runtime.ts';
import { cssPixelValue, focusMenuItem, focusMenuItemByTypeahead, menuItemElements, positionAnchoredSurface } from '../../platform/ui/floating-surface.ts';
import type { EscapeHtml } from '../../../../src/platform/contracts/ui.ts';

interface AccountMenuAuthPort {
  readonly isCloudEnabled: boolean;
  readonly isAuthenticated: boolean;
  readonly isAccountActive: boolean;
  readonly canManageUsers: boolean;
  readonly platformRoleLabel: string;
  readonly user?: Readonly<{ readonly id?: string | null; readonly email?: string | null; readonly user_metadata?: unknown }> | null;
  readonly profile?: Readonly<{ readonly display_name?: string | null; readonly email?: string | null; readonly status?: string | null }> | null;
}

interface AccountMenuOptions {
  readonly auth: AccountMenuAuthPort;
  readonly navigate: (route: string) => unknown;
  readonly escapeHtml: EscapeHtml;
  readonly onPreferencesChanged?: (preferences: PlatformPreferences) => void;
  readonly onSignOut?: () => Promise<void> | void;
  readonly documentRef?: Document;
}

type MenuCloseOptions = Readonly<{ restoreFocus?: boolean; immediate?: boolean }>;
type MenuItemAction = 'profile' | 'settings' | 'users' | 'appearance' | 'signout';

const ACCOUNT_MENU_ID = 'wmShellAccountMenu';
const APPEARANCE_MENU_ID = 'wmShellAppearanceMenu';

const profileGlyphs = Object.freeze({
  profile: '<svg viewBox="0 0 20 20" aria-hidden="true"><circle cx="10" cy="6.5" r="3.25"/><path d="M4.25 17c.35-3.1 2.6-5 5.75-5s5.4 1.9 5.75 5"/></svg>',
  settings: '<svg viewBox="0 0 20 20" aria-hidden="true"><circle cx="10" cy="10" r="2.6"/><path d="M10 2.75v1.6M10 15.65v1.6M2.75 10h1.6M15.65 10h1.6M4.87 4.87 6 6M14 14l1.13 1.13M15.13 4.87 14 6M6 14l-1.13 1.13"/></svg>',
  users: '<svg viewBox="0 0 20 20" aria-hidden="true"><circle cx="7.25" cy="7" r="2.5"/><path d="M2.75 16c.3-2.7 2.05-4.45 4.5-4.45s4.2 1.75 4.5 4.45M13 5.2a2.2 2.2 0 0 1 0 4.25M13.9 11.6c1.85.5 3 1.95 3.35 4.4"/></svg>',
  theme: '<svg viewBox="0 0 20 20" aria-hidden="true"><circle cx="10" cy="10" r="3"/><path d="M10 2.5v1.4M10 16.1v1.4M2.5 10h1.4M16.1 10h1.4M4.7 4.7l1 1M14.3 14.3l1 1M15.3 4.7l-1 1M5.7 14.3l-1 1"/></svg>',
  chevron: '<svg viewBox="0 0 20 20" aria-hidden="true"><path d="m8 5.5 4.5 4.5L8 14.5"/></svg>',
  logout: '<svg viewBox="0 0 20 20" aria-hidden="true"><path d="M8.2 3.25H4.75A1.75 1.75 0 0 0 3 5v10a1.75 1.75 0 0 0 1.75 1.75H8.2M11.5 6.3 15.2 10l-3.7 3.7M15 10H7.5"/></svg>',
  check: '<svg viewBox="0 0 20 20" aria-hidden="true"><path d="m5.5 10.2 2.8 2.8 6.2-6.2"/></svg>',
});

const normalizeLabel = (value: string): string => value.trim().toLocaleLowerCase();

export function createAccountProfileMenu({
  auth,
  navigate,
  escapeHtml,
  onPreferencesChanged = () => {},
  onSignOut = () => {},
  documentRef = document,
}: AccountMenuOptions) {
  const esc = escapeHtml;
  const overlay = createOverlayManager({ scope: 'shell-account', documentRef });
  let root: HTMLElement | null = null;
  let submenu: HTMLElement | null = null;
  let trigger: HTMLElement | null = null;
  let typeahead = '';
  let typeaheadTimer = 0;

  const displayName = (): string => {
    const metadata = auth.user?.user_metadata && typeof auth.user.user_metadata === 'object' && !Array.isArray(auth.user.user_metadata)
      ? auth.user.user_metadata as Record<string, unknown>
      : {};
    const metadataName = typeof metadata.display_name === 'string' ? metadata.display_name : '';
    return auth.profile?.display_name || metadataName || auth.user?.email?.split('@')[0] || 'Account';
  };

  const initials = (): string => {
    const label = displayName().trim();
    const parts = label.split(/\s+/).filter(Boolean);
    const first = parts[0] ?? '';
    const last = parts[parts.length - 1] ?? '';
    return (parts.length > 1 ? `${first.charAt(0)}${last.charAt(0)}` : label.slice(0, 2)).toUpperCase();
  };

  const currentIndex = (container: HTMLElement | null): number => menuItemElements(container).findIndex((item) => item === documentRef.activeElement);

  const handleMenuKeyboard = (event: KeyboardEvent, container: HTMLElement, isSubmenu = false): void => {
    const items = menuItemElements(container);
    if (!items.length) return;
    const index = currentIndex(container);
    if (event.key === 'ArrowDown') { event.preventDefault(); focusMenuItem(container, index + 1); return; }
    if (event.key === 'ArrowUp') { event.preventDefault(); focusMenuItem(container, index <= 0 ? items.length - 1 : index - 1); return; }
    if (event.key === 'Home') { event.preventDefault(); focusMenuItem(container, 0); return; }
    if (event.key === 'End') { event.preventDefault(); focusMenuItem(container, items.length - 1); return; }
    if (event.key === 'ArrowRight' && !isSubmenu) {
      const target = documentRef.activeElement instanceof HTMLElement ? documentRef.activeElement : null;
      if (target?.dataset.accountMenuAction === 'appearance') { event.preventDefault(); openAppearance(target); }
      return;
    }
    if (event.key === 'ArrowLeft' && isSubmenu) {
      event.preventDefault();
      closeAppearance({ restoreFocus: true });
      return;
    }
    if (event.key.length === 1 && !event.altKey && !event.ctrlKey && !event.metaKey) {
      typeahead += normalizeLabel(event.key);
      window.clearTimeout(typeaheadTimer);
      typeaheadTimer = window.setTimeout(() => { typeahead = ''; }, 600);
      const match = focusMenuItemByTypeahead(container, typeahead, documentRef.activeElement);
      if (match) event.preventDefault();
    }
  };

  const positionMenu = (menu: HTMLElement, anchor: HTMLElement, { submenuPlacement = false } = {}): void => {
    const root = documentRef.documentElement;
    const gutter = cssPixelValue(root, '--wm-shell-overlay-gutter', 12);
    const gap = cssPixelValue(root, '--wm-shell-overlay-gap', 8);
    const maxHeight = cssPixelValue(root, '--wm-shell-account-menu-max-height', 640);
    const minWidth = submenuPlacement
      ? cssPixelValue(root, '--wm-shell-account-submenu-width', 276)
      : cssPixelValue(root, '--wm-shell-account-menu-width', 340);
    positionAnchoredSurface({
      surface: menu,
      anchor,
      placement: submenuPlacement ? 'right-start' : 'bottom-end',
      gutter,
      gap,
      minWidth,
      maxWidth: minWidth,
      maxHeight,
    });
  };

  const themeMarkup = (): string => {
    const current = getPreferences().theme;
    const themes: readonly ThemePreference[] = ['system', 'light', 'dark'];
    return themes.map((theme) => `<button type="button" class="shell-account-menu-item shell-account-theme-item ${current === theme ? 'is-selected' : ''}" role="menuitemradio" aria-checked="${current === theme}" data-account-theme="${theme}"><span class="shell-account-menu-item-copy"><strong>${theme.charAt(0).toUpperCase() + theme.slice(1)}</strong><small>${theme === 'system' ? 'Follow your device appearance' : `Always use ${theme} mode`}</small></span><span class="shell-account-check" aria-hidden="true">${current === theme ? profileGlyphs.check : ''}</span></button>`).join('');
  };

  const closeAppearance = ({ restoreFocus = false }: MenuCloseOptions = {}): void => {
    const activeTrigger = root?.querySelector<HTMLElement>('[data-account-menu-action="appearance"]') ?? null;
    if (submenu) {
      overlay.release(APPEARANCE_MENU_ID);
      submenu.remove();
      submenu = null;
    }
    activeTrigger?.setAttribute('aria-expanded', 'false');
    if (restoreFocus) activeTrigger?.focus();
  };

  const openAppearance = (anchor: HTMLElement): void => {
    if (submenu) { closeAppearance({ restoreFocus: false }); return; }
    submenu = documentRef.createElement('div');
    submenu.id = APPEARANCE_MENU_ID;
    submenu.className = 'wm-shell-floating-surface wm-shell-menu-surface shell-account-menu shell-account-submenu';
    submenu.setAttribute('role', 'menu');
    submenu.setAttribute('aria-label', 'Appearance');
    submenu.innerHTML = `<div class="shell-account-menu-subhead"><strong>Appearance</strong><small>Choose how Work Management looks.</small></div><div class="shell-account-menu-section">${themeMarkup()}</div>`;
    resolveGlobalOverlayRoot(documentRef).appendChild(submenu);
    anchor.setAttribute('aria-expanded', 'true');
    positionMenu(submenu, anchor, { submenuPlacement: true });
    submenu.addEventListener('keydown', (event) => handleMenuKeyboard(event, submenu as HTMLElement, true));
    submenu.addEventListener('click', (event) => {
      const button = event.target instanceof Element ? event.target.closest<HTMLButtonElement>('[data-account-theme]') : null;
      if (!button) return;
      const theme = button.dataset.accountTheme as ThemePreference | undefined;
      if (!theme || !['system', 'light', 'dark'].includes(theme)) return;
      const next: PlatformPreferences = { ...getPreferences(), theme };
      if (!savePreferences(next)) return;
      applyTheme(theme);
      onPreferencesChanged(getPreferences());
      submenu?.querySelectorAll<HTMLElement>('[data-account-theme]').forEach((item) => {
        const selected = item.dataset.accountTheme === theme;
        item.classList.toggle('is-selected', selected);
        item.setAttribute('aria-checked', String(selected));
        const check = item.querySelector<HTMLElement>('.shell-account-check');
        if (check) check.innerHTML = selected ? profileGlyphs.check : '';
      });
    });
    overlay.open({ id: APPEARANCE_MENU_ID, element: submenu, trigger: anchor, parentId: ACCOUNT_MENU_ID, close: (options) => closeAppearance({ restoreFocus: options?.restoreFocus === true }) });
    requestAnimationFrame(() => focusMenuItem(submenu, 0));
  };

  const close = ({ restoreFocus = false }: MenuCloseOptions = {}): void => {
    const restoreTarget = trigger;
    closeAppearance({ restoreFocus: false });
    if (root) {
      overlay.release(ACCOUNT_MENU_ID);
      root.remove();
      root = null;
    }
    restoreTarget?.setAttribute('aria-expanded', 'false');
    if (restoreFocus && restoreTarget?.isConnected) restoreTarget.focus();
    trigger = null;
  };

  const accountHeaderMarkup = (): string => `<div class="shell-account-menu-header">
    <span class="shell-account-menu-avatar" aria-hidden="true">${esc(initials())}</span>
    <span class="shell-account-menu-identity"><strong>${esc(displayName())}</strong><small>${esc(auth.user?.email || auth.profile?.email || '')}</small><span>${esc(auth.platformRoleLabel)}</span></span>
    <span class="shell-account-status ${auth.isAccountActive ? 'is-active' : 'is-warning'}">${auth.isAccountActive ? 'Active' : 'Restricted'}</span>
  </div>`;

  const item = (action: MenuItemAction, label: string, icon: string, meta = '', extra = ''): string => `<button type="button" class="shell-account-menu-item" role="menuitem" data-account-menu-action="${action}" ${extra}><span class="shell-account-menu-icon" aria-hidden="true">${icon}</span><span class="shell-account-menu-item-copy"><strong>${esc(label)}</strong>${meta ? `<small>${esc(meta)}</small>` : ''}</span>${action === 'appearance' ? `<span class="shell-account-menu-chevron" aria-hidden="true">${profileGlyphs.chevron}</span>` : ''}</button>`;

  const markup = (): string => `${accountHeaderMarkup()}
    <div class="shell-account-menu-section" role="group" aria-label="Account">
      <span class="shell-account-menu-section-title">Account</span>
      ${item('profile', 'My profile & security', profileGlyphs.profile, 'Profile, password, sessions and access')}
    </div>
    <div class="shell-account-menu-section" role="group" aria-label="Work Management">
      <span class="shell-account-menu-section-title">Work Management</span>
      ${auth.canManageUsers ? item('users', 'User management', profileGlyphs.users, 'Roles, access and account status') : ''}
      ${item('settings', 'Platform settings', profileGlyphs.settings, 'Appearance, storage and diagnostics')}
    </div>
    <div class="shell-account-menu-section" role="group" aria-label="Preferences">
      <span class="shell-account-menu-section-title">Preferences</span>
      ${item('appearance', 'Appearance', profileGlyphs.theme, `Current: ${getPreferences().theme}`, 'aria-haspopup="menu" aria-expanded="false" aria-controls="wmShellAppearanceMenu"')}
    </div>
    <div class="shell-account-menu-section shell-account-menu-session" role="group" aria-label="Session">
      ${item('signout', 'Sign out', profileGlyphs.logout, 'End this browser session')}
    </div>`;

  const open = (nextTrigger: HTMLElement): void => {
    if (!auth.isCloudEnabled || !auth.isAuthenticated) return;
    if (root) { close({ restoreFocus: false }); return; }
    trigger = nextTrigger;
    root = documentRef.createElement('div');
    root.id = ACCOUNT_MENU_ID;
    root.className = 'wm-shell-floating-surface wm-shell-menu-surface shell-account-menu shell-account-profile-menu';
    root.setAttribute('role', 'menu');
    root.setAttribute('aria-label', 'Account menu');
    root.setAttribute('tabindex', '-1');
    root.innerHTML = markup();
    resolveGlobalOverlayRoot(documentRef).appendChild(root);
    trigger.setAttribute('aria-expanded', 'true');
    positionMenu(root, trigger);
    root.addEventListener('keydown', (event) => handleMenuKeyboard(event, root as HTMLElement));
    root.addEventListener('click', async (event) => {
      const action = event.target instanceof Element ? event.target.closest<HTMLButtonElement>('[data-account-menu-action]') : null;
      if (!action) return;
      const kind = action.dataset.accountMenuAction as MenuItemAction | undefined;
      if (kind === 'appearance') { openAppearance(action); return; }
      if (kind === 'profile') { close({ restoreFocus: false }); navigate('account'); return; }
      if (kind === 'settings') { close({ restoreFocus: false }); navigate('settings'); return; }
      if (kind === 'users') { close({ restoreFocus: false }); if (auth.canManageUsers) navigate('users'); return; }
      if (kind === 'signout') { close({ restoreFocus: false }); await onSignOut(); }
    });
    overlay.open({ id: ACCOUNT_MENU_ID, element: root, trigger, close: (options) => close({ restoreFocus: options?.restoreFocus === true }) });
    requestAnimationFrame(() => focusMenuItem(root, 0));
  };

  const toggle = (nextTrigger: HTMLElement): void => root ? close({ restoreFocus: true }) : open(nextTrigger);

  const reposition = (): void => {
    if (root && trigger?.isConnected) positionMenu(root, trigger);
    const appearanceTrigger = root?.querySelector<HTMLElement>('[data-account-menu-action="appearance"]') ?? null;
    if (submenu && appearanceTrigger) positionMenu(submenu, appearanceTrigger, { submenuPlacement: true });
  };

  return Object.freeze({
    open,
    close,
    toggle,
    reposition,
    get isOpen() { return Boolean(root); },
    dispose() { close(); overlay.dispose(); window.clearTimeout(typeaheadTimer); },
  });
}

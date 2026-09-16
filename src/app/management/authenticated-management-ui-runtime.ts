import { auth, AUTH_EVENT } from '../../../assets/js/core/auth.ts';
import {
  DEFAULT_PREFERENCES,
  applyDensity,
  applyTheme,
  getPreferences,
  getStorageHealth,
  requestPersistentStorage,
  runPlatformDiagnostics,
  savePreferences,
  verifyModuleCompatibility,
  type DiagnosticResult,
  type PlatformPreferences,
  type StorageHealth,
  type ThemePreference,
} from '../../../assets/js/core/platform.ts';
import { downloadWorkspaceBackup, inspectBackupFile, restoreWorkspaceBackupGuarded } from '../../../assets/js/core/backup.ts';
import { modules } from '../../../config/modules.ts';
import { applicationManifest } from '../../../config/application-manifest.ts';
import { createAccountService } from '../../../assets/js/features/account/account-service.ts';
import { storage } from '../../../assets/js/core/storage.ts';
import { EMPTY_SETTINGS_EVIDENCE, SETTINGS_EVIDENCE_STORAGE_KEY,
  SETTINGS_EVIDENCE_VERSION, mergeSettingsEvidence, normalizeSettingsEvidence, type SettingsEvidenceSnapshot } from '../../../assets/js/features/settings/settings-recovery.ts';

export type AuthenticatedManagementUIView = 'hidden' | 'account' | 'settings' | 'users';
export type AuthenticatedManagementUIFeedbackTone = 'success' | 'warning';

export interface AccountOperationFeedback { readonly tone: 'success' | 'warning'; readonly message: string; readonly action: string; readonly at: string; }

export interface AuthenticatedManagementUIRuntimeSnapshot {
  readonly view: AuthenticatedManagementUIView;
  readonly accountBusy: readonly string[];
  readonly settingsBusy: readonly string[];
  readonly storageHealth: StorageHealth | null;
  readonly diagnostics: DiagnosticResult | null;
  readonly compatibility: DiagnosticResult | null;
  readonly backendStatus: DiagnosticResult | null;
  readonly authRevision: number;
  readonly preferenceRevision: number;
  readonly accountFeedback: AccountOperationFeedback | null;
}

interface RuntimeCallbacks {
  readonly navigate: (route: string) => unknown;
  readonly toast: (message: string, tone?: AuthenticatedManagementUIFeedbackTone) => unknown;
  readonly onPreferencesChanged: (preferences: PlatformPreferences, meta: Readonly<{ reason: string }>) => void;
  readonly resetLauncherFilters: () => void;
  readonly setAuthenticationFeedback: (message?: string, tone?: AuthenticatedManagementUIFeedbackTone) => void;
}

const DEFAULT_CALLBACKS: RuntimeCallbacks = Object.freeze({
  navigate: () => undefined,
  toast: () => undefined,
  onPreferencesChanged: () => undefined,
  resetLauncherFilters: () => undefined,
  setAuthenticationFeedback: () => undefined,
});

const DEFAULT_SNAPSHOT: AuthenticatedManagementUIRuntimeSnapshot = Object.freeze({
  view: 'hidden',
  accountBusy: Object.freeze([]),
  settingsBusy: Object.freeze([]),
  storageHealth: null,
  diagnostics: null,
  compatibility: null,
  backendStatus: null,
  authRevision: 0,
  preferenceRevision: 0,
  accountFeedback: null,
});

let callbacks: RuntimeCallbacks = DEFAULT_CALLBACKS;

const errorMessage = (error: unknown, fallback: string): string => error instanceof Error ? error.message : fallback;
const freezeStrings = (values: readonly string[]): readonly string[] => Object.freeze([...values]);
const uniqueBusy = (values: readonly string[]): readonly string[] => freezeStrings([...new Set(values)]);

function freezeSnapshot(next: AuthenticatedManagementUIRuntimeSnapshot): AuthenticatedManagementUIRuntimeSnapshot {
  return Object.freeze({ ...next, accountBusy: freezeStrings(next.accountBusy), settingsBusy: freezeStrings(next.settingsBusy) });
}

function readSettingsEvidence(): SettingsEvidenceSnapshot {
  return normalizeSettingsEvidence(storage.get(SETTINGS_EVIDENCE_STORAGE_KEY, EMPTY_SETTINGS_EVIDENCE));
}

const initialEvidence = readSettingsEvidence();
let snapshot = freezeSnapshot({ ...DEFAULT_SNAPSHOT, compatibility: initialEvidence.compatibility, diagnostics: initialEvidence.diagnostics, backendStatus: initialEvidence.backendStatus });
let epoch = 0;
const accountService = createAccountService(auth);
const listeners = new Set<() => void>();

function publish(patch: Partial<AuthenticatedManagementUIRuntimeSnapshot>): AuthenticatedManagementUIRuntimeSnapshot {
  const next = freezeSnapshot({ ...snapshot, ...patch });
  if (
    next.view === snapshot.view
    && next.accountBusy.join('|') === snapshot.accountBusy.join('|')
    && next.settingsBusy.join('|') === snapshot.settingsBusy.join('|')
    && next.storageHealth === snapshot.storageHealth
    && next.diagnostics === snapshot.diagnostics
    && next.compatibility === snapshot.compatibility
    && next.backendStatus === snapshot.backendStatus
    && next.authRevision === snapshot.authRevision
    && next.preferenceRevision === snapshot.preferenceRevision
    && next.accountFeedback === snapshot.accountFeedback
  ) return snapshot;
  snapshot = next;
  for (const listener of listeners) listener();
  return snapshot;
}

function withBusy(kind: 'accountBusy' | 'settingsBusy', action: string, busy: boolean): void {
  const current = snapshot[kind];
  const next = busy ? uniqueBusy([...current, action]) : freezeStrings(current.filter((item) => item !== action));
  if (kind === 'accountBusy') publish({ accountBusy: next });
  else publish({ settingsBusy: next });
}

function cloneDefaults(): PlatformPreferences {
  return {
    theme: DEFAULT_PREFERENCES.theme,
    compact: DEFAULT_PREFERENCES.compact,
    favorites: [...DEFAULT_PREFERENCES.favorites],
    recent: [],
  };
}

async function verifyModules(): Promise<DiagnosticResult> {
  const results = await Promise.all(modules.filter((module) => module.status === 'active').map((module) => verifyModuleCompatibility(module)));
  return Object.freeze({
    checkedAt: new Date().toISOString(),
    checks: Object.freeze(results.flatMap((result) => result.checks.map((check) => ({ ...check, label: `${result.moduleName}: ${check.label}` })))),
    passed: results.every((result) => result.passed),
  });
}


function persistSettingsEvidence(patch: Partial<Pick<SettingsEvidenceSnapshot, 'compatibility' | 'diagnostics' | 'backendStatus'>>): boolean {
  const current = normalizeSettingsEvidence({
    version: SETTINGS_EVIDENCE_VERSION,
    compatibility: snapshot.compatibility,
    diagnostics: snapshot.diagnostics,
    backendStatus: snapshot.backendStatus,
  });
  const next = mergeSettingsEvidence(current, patch);
  publish({ compatibility: next.compatibility, diagnostics: next.diagnostics, backendStatus: next.backendStatus });
  return storage.set(SETTINGS_EVIDENCE_STORAGE_KEY, next);
}

async function refreshBackendStatus(ticket: number = epoch): Promise<DiagnosticResult | null> {
  try {
    const backendStatus = await auth.diagnostics();
    if (ticket === epoch) persistSettingsEvidence({ backendStatus });
    return backendStatus;
  } catch (error) {
    console.warn('[Work Management] M43 authentication/backend status refresh failed', error);
    return null;
  }
}

async function refreshStorageHealth(ticket: number = epoch): Promise<StorageHealth | null> {
  try {
    const health = await getStorageHealth();
    if (ticket === epoch) publish({ storageHealth: health });
    return health;
  } catch (error) {
    console.warn('[Work Management] M13 storage-health query failed', error);
    return null;
  }
}

export const authenticatedManagementUiRuntime = Object.freeze({
  getSnapshot: (): AuthenticatedManagementUIRuntimeSnapshot => snapshot,
  resetForTest(): AuthenticatedManagementUIRuntimeSnapshot {
    epoch += 1;
    snapshot = freezeSnapshot({ ...DEFAULT_SNAPSHOT });
    for (const listener of listeners) listener();
    return snapshot;
  },
  subscribe(listener: () => void): () => void {
    listeners.add(listener);
    return () => { listeners.delete(listener); };
  },
  configure(next: Partial<RuntimeCallbacks>): void {
    callbacks = Object.freeze({ ...callbacks, ...next });
  },
  activate(): AuthenticatedManagementUIRuntimeSnapshot {
    return snapshot;
  },
  deactivate(): AuthenticatedManagementUIRuntimeSnapshot {
    epoch += 1;
    return publish({ view: 'hidden', accountBusy: Object.freeze([]), settingsBusy: Object.freeze([]) });
  },
  show(view: Exclude<AuthenticatedManagementUIView, 'hidden'>): AuthenticatedManagementUIRuntimeSnapshot {
    const next = publish({ view });
    if (view === 'settings') { void refreshStorageHealth(); void refreshBackendStatus(); }
    return next;
  },
  hide(): AuthenticatedManagementUIRuntimeSnapshot {
    epoch += 1;
    return publish({ view: 'hidden', accountBusy: Object.freeze([]), settingsBusy: Object.freeze([]) });
  },
  preferences(): PlatformPreferences { return getPreferences(); },
  async saveProfile(displayName: string): Promise<void> {
    if (snapshot.accountBusy.includes('save-profile')) return;
    withBusy('accountBusy', 'save-profile', true);
    publish({ accountFeedback: null });
    try {
      await accountService.saveProfile(displayName);
      const feedback = Object.freeze({ tone: 'success' as const, message: 'Profile updated from the authenticated backend.', action: 'save-profile', at: new Date().toISOString() });
      publish({ accountFeedback: feedback });
      callbacks.toast(feedback.message);
    } catch (error) {
      const message = errorMessage(error, 'Account settings could not be updated.');
      publish({ accountFeedback: Object.freeze({ tone: 'warning' as const, message, action: 'save-profile', at: new Date().toISOString() }) });
      callbacks.toast(message, 'warning');
    } finally {
      withBusy('accountBusy', 'save-profile', false);
    }
  },
  async changePassword(password: string, confirmPassword: string): Promise<void> {
    if (snapshot.accountBusy.includes('change-password')) return;
    withBusy('accountBusy', 'change-password', true);
    publish({ accountFeedback: null });
    try {
      const outcome = await accountService.changePassword(password, confirmPassword);
      if (outcome.signedOutGlobally) {
        callbacks.setAuthenticationFeedback('Password changed and all sessions were revoked. Sign in again with your new password.', 'success');
        callbacks.navigate('login');
      } else if (outcome.warning) {
        publish({ accountFeedback: Object.freeze({ tone: 'warning' as const, message: outcome.warning, action: 'change-password', at: new Date().toISOString() }) });
        callbacks.toast(outcome.warning, 'warning');
      }
    } catch (error) {
      const message = errorMessage(error, 'Password could not be updated.');
      publish({ accountFeedback: Object.freeze({ tone: 'warning' as const, message, action: 'change-password', at: new Date().toISOString() }) });
      callbacks.toast(message, 'warning');
    } finally {
      withBusy('accountBusy', 'change-password', false);
    }
  },
  async signOut(scope: 'local' | 'global'): Promise<void> {
    const action = scope === 'global' ? 'signout-all' : 'signout';
    if (snapshot.accountBusy.includes(action)) return;
    withBusy('accountBusy', action, true);
    publish({ accountFeedback: null });
    try {
      await accountService.signOut(scope);
      callbacks.setAuthenticationFeedback('', 'success');
      callbacks.navigate('login');
    } catch (error) {
      const message = errorMessage(error, 'Session revocation could not be completed.');
      publish({ accountFeedback: Object.freeze({ tone: 'warning' as const, message, action, at: new Date().toISOString() }) });
      callbacks.setAuthenticationFeedback(message, 'warning');
      callbacks.toast(message, 'warning');
    } finally {
      withBusy('accountBusy', action, false);
    }
  },
  async refreshAccess(): Promise<void> {
    if (snapshot.accountBusy.includes('refresh-access')) return;
    withBusy('accountBusy', 'refresh-access', true);
    publish({ accountFeedback: null });
    try {
      await accountService.refreshAccess();
      const feedback = Object.freeze({ tone: 'success' as const, message: 'Session and account access refreshed from the authenticated backend.', action: 'refresh-access', at: new Date().toISOString() });
      publish({ accountFeedback: feedback });
      callbacks.toast(feedback.message);
    } catch (error) {
      const message = errorMessage(error, 'Session and account access could not be refreshed.');
      publish({ accountFeedback: Object.freeze({ tone: 'warning' as const, message, action: 'refresh-access', at: new Date().toISOString() }) });
      callbacks.toast(message, 'warning');
    } finally {
      withBusy('accountBusy', 'refresh-access', false);
    }
  },
  setTheme(theme: ThemePreference): void {
    if (!['system', 'light', 'dark'].includes(theme)) return;
    const next: PlatformPreferences = { ...getPreferences(), theme };
    if (!savePreferences(next)) {
      callbacks.toast('Theme preference could not be saved.', 'warning');
      return;
    }
    const saved = getPreferences();
    applyTheme(saved.theme);
    callbacks.onPreferencesChanged(saved, { reason: 'theme' });
    publish({ preferenceRevision: snapshot.preferenceRevision + 1 });
  },
  async runSettingAction(action: 'density' | 'compatibility' | 'persist' | 'refresh-storage' | 'refresh-auth' | 'diagnostics' | 'export-backup' | 'reset-platform'): Promise<void> {
    if (snapshot.settingsBusy.includes(action)) return;
    const ticket = epoch;
    withBusy('settingsBusy', action, true);
    try {
      if (action === 'density') {
        const current = getPreferences();
        if (!savePreferences({ ...current, compact: !current.compact })) throw new Error('Workspace spacing could not be saved because shell preference storage is unavailable.');
        const saved = getPreferences();
        applyDensity(saved.compact);
        callbacks.onPreferencesChanged(saved, { reason: 'density' });
        publish({ preferenceRevision: snapshot.preferenceRevision + 1 });
        callbacks.toast(`Workspace spacing changed to ${saved.compact ? 'Compact' : 'Comfortable'}.`);
      } else if (action === 'compatibility') {
        const compatibility = await verifyModules();
        if (ticket === epoch) persistSettingsEvidence({ compatibility });
        callbacks.toast(compatibility.passed ? 'Application compatibility verification passed.' : 'Application compatibility verification found an issue.', compatibility.passed ? 'success' : 'warning');
      } else if (action === 'persist') {
        const result = await requestPersistentStorage();
        await refreshStorageHealth(ticket);
        if (!result.supported) callbacks.toast('This browser does not expose the Persistent Storage API. This affects shell preferences only; application records use authenticated cloud persistence.', 'warning');
        else if (result.granted) callbacks.toast(result.already ? 'Persistent storage was already granted.' : 'Persistent storage granted.');
        else callbacks.toast(result.reason === 'error' ? 'The persistent-storage request failed. Browser storage remains available under normal policy.' : 'The browser declined persistent storage for shell preferences. Application records continue to use authenticated cloud persistence.', 'warning');
      } else if (action === 'refresh-storage') {
        await refreshStorageHealth(ticket);
        callbacks.toast('Browser storage status refreshed.');
      } else if (action === 'refresh-auth') {
        const backendStatus = await refreshBackendStatus(ticket);
        if (backendStatus) callbacks.toast(backendStatus.passed ? 'Authentication and backend status verified.' : 'Authentication or backend status requires attention.', backendStatus.passed ? 'success' : 'warning');
        else callbacks.toast('Authentication and backend status could not be refreshed.', 'warning');
      } else if (action === 'diagnostics') {
        const platform = await runPlatformDiagnostics(modules, applicationManifest);
        const authDiagnostics = await auth.diagnostics();
        const diagnostics: DiagnosticResult = Object.freeze({
          checkedAt: platform.checkedAt,
          checks: Object.freeze([...platform.checks, ...authDiagnostics.checks]),
          passed: platform.passed && authDiagnostics.passed,
        });
        if (ticket === epoch) persistSettingsEvidence({ diagnostics, backendStatus: authDiagnostics });
        await refreshStorageHealth(ticket);
        callbacks.toast(diagnostics.passed ? 'Platform verification passed.' : 'Platform verification found an issue requiring attention.', diagnostics.passed ? 'success' : 'warning');
      } else if (action === 'export-backup') {
        const count = await downloadWorkspaceBackup(modules);
        callbacks.toast(`Backup exported with ${count} data entr${count === 1 ? 'y' : 'ies'}.`);
      } else if (action === 'reset-platform') {
        if (!globalThis.confirm('Reset Work Management shell preferences? Registered application data will not be deleted.')) return;
        if (!savePreferences(cloneDefaults())) throw new Error('Shell preferences could not be reset because shell preference storage is unavailable.');
        const saved = getPreferences();
        callbacks.resetLauncherFilters();
        applyTheme(saved.theme);
        applyDensity(saved.compact);
        callbacks.onPreferencesChanged(saved, { reason: 'reset' });
        publish({ preferenceRevision: snapshot.preferenceRevision + 1 });
        callbacks.toast('Shell preferences reset to defaults. Registered application data was preserved.');
      }
    } catch (error) {
      console.error('[Work Management] M43 Settings action failed', action, error);
      callbacks.toast(errorMessage(error, 'The requested setting could not be completed.'), 'warning');
    } finally {
      withBusy('settingsBusy', action, false);
      publish({});
    }
  },

  async updateUserAccess(input: Readonly<{ userId: string; platformRole: import('../../types/auth.ts').PlatformRole; status: 'active' | 'disabled' }>): Promise<unknown> {
    try {
      return await auth.updateUserAccess(input);
    } catch (error) {
      callbacks.toast(errorMessage(error, 'User access could not be updated.'), 'warning');
      throw error;
    }
  },
  async restoreBackup(file: File): Promise<void> {
    const action = 'import-backup';
    if (snapshot.settingsBusy.includes(action)) return;
    const ticket = epoch;
    withBusy('settingsBusy', action, true);
    try {
      const inspection = await inspectBackupFile(file, modules);
      const { payload, preflight } = inspection;
      const when = payload.createdAt ? new Date(payload.createdAt).toLocaleString() : 'unknown time';
      const integrityNote = preflight.integrity === 'verified' ? ' SHA-256 integrity is verified.' : ' WARNING: this is a legacy backup without an M34 integrity manifest.';
      const warningNote = preflight.warnings.length ? ` ${preflight.warnings.map((warning) => warning.message).join(' ')}` : '';
      const checkpointNote = ' A pre-restore recovery checkpoint of the current workspace will be downloaded before any restore mutation begins.';
      if (!globalThis.confirm(`Restore ${payload.entryCount || Object.keys(payload.data).length} validated data entries from backup created ${when}?${integrityNote}${warningNote}${checkpointNote} Current matching data will be overwritten.`)) return;
      const result = await restoreWorkspaceBackupGuarded(payload, modules);
      const saved = getPreferences();
      const restoredEvidence = readSettingsEvidence();
      publish({ compatibility: restoredEvidence.compatibility, diagnostics: restoredEvidence.diagnostics, backendStatus: restoredEvidence.backendStatus });
      applyTheme(saved.theme);
      applyDensity(saved.compact);
      callbacks.onPreferencesChanged(saved, { reason: 'backup-restore' });
      publish({ preferenceRevision: snapshot.preferenceRevision + 1 });
      callbacks.toast(`Restored ${result.restored} data entr${result.restored === 1 ? 'y' : 'ies'}. Reloading…`);
      globalThis.setTimeout(() => globalThis.location.reload(), 900);
    } catch (error) {
      console.error('[Work Management] M43 backup restore failed', error);
      callbacks.toast(errorMessage(error, 'Backup restore failed.'), 'warning');
    } finally {
      withBusy('settingsBusy', action, false);
      if (ticket === epoch) publish({});
    }
  },
});

auth.addEventListener(AUTH_EVENT, () => {
  publish({ authRevision: snapshot.authRevision + 1 });
});

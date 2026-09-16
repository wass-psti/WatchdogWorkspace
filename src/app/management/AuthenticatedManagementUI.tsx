import { useLayoutEffect, useMemo, useRef, useState, type ButtonHTMLAttributes, type ChangeEvent, type FormEvent, type ReactNode } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { auth } from '../../../assets/js/core/auth.ts';
import { formatBytes } from '../../../assets/js/ui/format.ts';
import { modules } from '../../../config/modules.ts';
import type { DiagnosticResult, ThemePreference } from '../../../assets/js/core/platform.ts';
import type { PlatformRole } from '../../types/auth.ts';
import { WMIcon } from '../../design-system/icons/index.tsx';
import { authenticatedManagementUiRuntime } from './authenticated-management-ui-runtime.ts';
import { describeAccountSession } from '../../../assets/js/features/account/account-service.ts';
import { presentationReadinessRuntime } from '../composition/presentation-readiness-runtime.ts';
import { useAuthenticatedManagementUiRuntime } from './useAuthenticatedManagementUiRuntime.ts';
import { useReactShellRuntime } from '../shell/useReactShellRuntime.ts';

interface UserDirectoryRecord {
  readonly id: string;
  readonly email: string;
  readonly display_name: string;
  readonly platform_role: PlatformRole;
  readonly status: 'active' | 'disabled';
  readonly is_bootstrap_admin: boolean;
  readonly is_self: boolean;
  readonly is_last_active_admin: boolean;
}

const PLATFORM_ROLES = new Set<PlatformRole>(['admin_general_manager', 'hr', 'supervisor', 'employee']);
const USER_DIRECTORY_QUERY_KEY = Object.freeze(['work-management', 'admin', 'user-directory'] as const);

const isRecord = (value: unknown): value is Record<string, unknown> => value !== null && typeof value === 'object' && !Array.isArray(value);

function parseUserDirectoryRecord(value: unknown): UserDirectoryRecord | null {
  if (!isRecord(value)) return null;
  const id = typeof value.id === 'string' ? value.id.trim() : '';
  const email = typeof value.email === 'string' ? value.email : '';
  const displayName = typeof value.display_name === 'string' ? value.display_name : '';
  const role = typeof value.platform_role === 'string' && PLATFORM_ROLES.has(value.platform_role as PlatformRole) ? value.platform_role as PlatformRole : null;
  const status = value.status === 'active' || value.status === 'disabled' ? value.status : null;
  if (!id || !role || !status) return null;
  return Object.freeze({
    id, email, display_name: displayName, platform_role: role, status,
    is_bootstrap_admin: value.is_bootstrap_admin === true,
    is_self: value.is_self === true,
    is_last_active_admin: value.is_last_active_admin === true,
  });
}

function displayName(): string {
  const metadata = auth.user?.user_metadata && typeof auth.user.user_metadata === 'object' ? auth.user.user_metadata as Record<string, unknown> : {};
  return auth.profile?.display_name || (typeof metadata.display_name === 'string' ? metadata.display_name : '') || auth.user?.email?.split('@')[0] || 'User';
}

function userInitials(): string {
  const parts = displayName().trim().split(/\s+/).filter(Boolean);
  const first = parts[0] ?? '';
  if (!first) return 'U';
  const initials = parts.length === 1 ? first.slice(0, 2) : `${first[0] ?? ''}${parts.at(-1)?.[0] ?? ''}`;
  return initials.toUpperCase();
}

function sessionExpiryText(): string {
  const expiresAt = Number(auth.state?.session?.expires_at || 0);
  return expiresAt ? new Date(expiresAt).toLocaleString() : 'Unavailable';
}

function ManagementTopbar({ title, subtitle }: Readonly<{ title: string; subtitle: string }>) {
  const online = useReactShellRuntime((snapshot) => snapshot.online);
  return (
    <header className="topbar" data-wm-management-topbar="">
      <div><span className="top-eyebrow">WORK MANAGEMENT</span><h1>{title}</h1><p>{subtitle}</p></div>
      <div className="top-actions">
        <span className={`connection-pill ${online ? '' : 'offline'}`}><i />{online ? 'Online' : 'Offline'}</span>
        <button className="icon-btn mobile-command" data-command type="button" aria-label="Search"><WMIcon name="search" /></button>
        <button className="secondary-btn account-pill" data-account-menu-trigger type="button" aria-label={`Open account menu for ${displayName()}`} aria-haspopup="menu" aria-expanded="false" aria-controls="wmShellAccountMenu">
          <span className="avatar mini">{userInitials()}</span>
          <span><b>{displayName()}</b><small>{auth.platformRoleLabel}</small></span>
        </button>
      </div>
    </header>
  );
}

function BusyButton({ busy, children, ...props }: Readonly<{ busy: boolean; children: ReactNode }> & ButtonHTMLAttributes<HTMLButtonElement>) {
  return <button {...props} disabled={props.disabled || busy} aria-busy={busy || undefined}>{busy ? 'Working…' : children}</button>;
}

function DiagnosticList({ result }: Readonly<{ result: DiagnosticResult | null }>) {
  if (!result?.checks.length) return null;
  return <><div className="diagnostic-list">{result.checks.map((check) => <span key={`${check.id}:${check.label}`} className={`diagnostic-item ${check.ok ? 'pass' : 'fail'}`}><i /><b>{check.label}</b><small>{check.detail}</small></span>)}</div><small>Last checked {new Date(result.checkedAt).toLocaleString()}</small></>;
}

function AccountView() {
  const runtime = useAuthenticatedManagementUiRuntime((snapshot) => snapshot);
  const busy = new Set(runtime.accountBusy);
  const assignments = modules.map((module) => ({ module, role: auth.moduleRole(module.id), allowed: auth.canAccessModule(module.id) }));
  const session = describeAccountSession(auth);

  const submitProfile = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const values = new FormData(event.currentTarget);
    void authenticatedManagementUiRuntime.saveProfile(String(values.get('displayName') || ''));
  };

  const submitPassword = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    const values = new FormData(form);
    void authenticatedManagementUiRuntime.changePassword(String(values.get('password') || ''), String(values.get('confirmPassword') || '')).then(() => {
      if (auth.isAuthenticated) form.reset();
    });
  };

  return <>
    <ManagementTopbar title="Account" subtitle="Profile, security, session controls, and application authorization." />
    <main id="main" className="page account-page" data-wm-management-view="account" tabIndex={-1}>
      {auth.hasBootstrapRoleMismatch ? <section className="settings-card"><div className="settings-row"><div><span>RBAC RECONCILIATION</span><h2>Bootstrap administrator role is not applied</h2><p>{auth.state.notice || 'The database still reports this protected bootstrap account as a non-administrator. Run the RBAC reconciliation migration and refresh access.'}</p></div><span className="status warning"><i />Action required</span></div></section> : null}
      {runtime.accountFeedback ? <section className="settings-card" data-wm-account-feedback={runtime.accountFeedback.tone}><div className="settings-row"><div><span>ACCOUNT OPERATION</span><h2>{runtime.accountFeedback.tone === 'success' ? 'Completed' : 'Action required'}</h2><p>{runtime.accountFeedback.message}</p><small>{new Date(runtime.accountFeedback.at).toLocaleString()}</small></div><span className={`status ${runtime.accountFeedback.tone === 'success' ? 'success' : 'warning'}`}><i />{runtime.accountFeedback.tone}</span></div></section> : null}
      <section className="settings-card">
        <div className="settings-row"><div><span>IDENTITY</span><h2>{displayName()}</h2><p>{auth.user?.email || ''}</p><small>User ID: {auth.user?.id || ''}</small></div><span className={`status ${auth.isAccountActive ? 'success' : 'warning'}`}><i />{auth.profile?.status || 'unknown'}</span></div>
        <div className="settings-row"><div><span>PLATFORM ROLE</span><h2>{auth.platformRoleLabel}</h2><p>Cloud profile and module assignments are the authoritative shell-access model.</p></div><span className={`status ${auth.isPlatformAdmin ? 'warning' : 'success'}`}><i />{auth.isPlatformAdmin ? 'Elevated' : 'Standard'}</span></div>
      </section>
      <section className="settings-card settings-secondary">
        <div className="settings-row account-form-row"><div><span>PROFILE SETTINGS</span><h2>Display name</h2><p>Update the name shown throughout Work Management. Email identity is managed by Supabase Auth.</p></div><form className="inline-account-form" data-wm-management-form="profile" onSubmit={submitProfile}><input name="displayName" maxLength={80} minLength={2} defaultValue={displayName()} required aria-label="Display name" /><BusyButton type="submit" className="secondary-btn" busy={busy.has('save-profile')}>Save profile</BusyButton></form></div>
        <div className="settings-row"><div><span>SESSION STATUS</span><h2>{session.label}</h2><p>{session.detail}</p>{auth.state.error ? <small>{auth.state.error}</small> : null}</div><span className={`status ${session.tone}`}><i />{session.label}</span></div>
        <div className="settings-row role-map-row"><div><span>MODULE ACCESS</span><h2>Role mapping</h2><p>Roles are loaded from the cloud account and propagated into each integrated module without exposing authentication tokens.</p><div className="role-map-list">{assignments.map(({ module, role, allowed }) => <div key={module.id}><span className={`module-mini-icon ${module.accent}`}>{module.name.slice(0, 1)}</span><span><b>{module.name}</b><small>{role}</small></span><span className={`status ${allowed ? 'success' : 'muted'}`}><i />{allowed ? 'Allowed' : 'Restricted'}</span></div>)}</div></div><div><BusyButton type="button" className="secondary-btn" busy={busy.has('refresh-access')} onClick={() => void authenticatedManagementUiRuntime.refreshAccess()}>Refresh session &amp; access</BusyButton></div></div>
        <div className="settings-row account-form-row"><div><span>SECURITY</span><h2>Change password</h2><p>A successful password change signs out every active Work Management session and requires a fresh login.</p></div><form className="inline-account-form password-form" data-wm-management-form="password" onSubmit={submitPassword}><input name="password" type="password" autoComplete="new-password" minLength={10} placeholder="New password" required /><input name="confirmPassword" type="password" autoComplete="new-password" minLength={10} placeholder="Confirm password" required /><BusyButton type="submit" className="secondary-btn" busy={busy.has('change-password')}>Change password</BusyButton></form></div>
        <div className="settings-row"><div><span>SESSION</span><h2>Authenticated session</h2><p>Current session expiry: {sessionExpiryText()}. Sign out locally or revoke all Work Management refresh sessions for this account.</p></div><div className="settings-actions"><BusyButton type="button" className="secondary-btn" busy={busy.has('signout')} onClick={() => void authenticatedManagementUiRuntime.signOut('local')}>Sign out this browser</BusyButton><BusyButton type="button" className="secondary-btn" busy={busy.has('signout-all')} onClick={() => void authenticatedManagementUiRuntime.signOut('global')}>Sign out all sessions</BusyButton></div></div>
      </section>
    </main>
  </>;
}

function SettingsView() {
  const runtime = useAuthenticatedManagementUiRuntime((snapshot) => snapshot);
  const prefs = authenticatedManagementUiRuntime.preferences();
  const backupInput = useRef<HTMLInputElement>(null);
  const busy = new Set(runtime.settingsBusy);
  const health = runtime.storageHealth;
  const usagePct = health?.quota && health.usage != null ? Math.min(100, (health.usage / health.quota) * 100) : null;
  const themes: readonly ThemePreference[] = ['system', 'light', 'dark'];
  const storageCopy = !health
    ? 'Checking storage capabilities…'
    : `${health.available ? 'Shell preference storage is writable.' : 'Shell preference storage is unavailable or blocked.'} ${health.persistent ? 'Persistent storage is granted.' : health.persistenceSupported ? 'Persistent storage has not been granted.' : 'This browser does not expose persistent-storage controls.'}`;

  const selectBackup = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.currentTarget.files?.[0];
    if (file) void authenticatedManagementUiRuntime.restoreBackup(file);
    event.currentTarget.value = '';
  };

  return <>
    <ManagementTopbar title="Settings" subtitle="Platform-level controls, recovery, storage health, and appearance." />
    <main id="main" className="page settings-page" data-wm-management-view="settings" tabIndex={-1}>
      <section className="settings-card">
        <div className="settings-row" data-wm-setting="theme"><div><span>APPEARANCE</span><h2>Interface theme</h2><p>Use your operating-system preference or keep Work Management in a fixed theme.</p></div><div className="theme-options">{themes.map((theme) => <button key={theme} type="button" className={`theme-chip ${prefs.theme === theme ? 'selected' : ''}`} data-wm-management-theme={theme} aria-pressed={prefs.theme === theme} onClick={() => authenticatedManagementUiRuntime.setTheme(theme)}>{theme.charAt(0).toUpperCase() + theme.slice(1)}</button>)}</div></div>
        <div className="settings-row" data-wm-setting="density"><div><span>DENSITY</span><h2>Workspace spacing</h2><p>Compact mode reduces shell card, page, and settings spacing while leaving isolated application interfaces unchanged.</p><small>Current mode: {prefs.compact ? 'Compact' : 'Comfortable'} · saved to this browser</small></div><BusyButton type="button" className="secondary-btn" busy={busy.has('density')} onClick={() => void authenticatedManagementUiRuntime.runSettingAction('density')}><span className={`density-switch ${prefs.compact ? 'on' : ''}`}><i /></span>{prefs.compact ? 'Compact' : 'Comfortable'}</BusyButton></div>
        <div className="settings-row" data-wm-setting="compatibility"><div><span>MODULE ISOLATION</span><h2>Application compatibility</h2><p>Validate every registered application runtime, storage contract, and safe local-data access without modifying module data.</p><DiagnosticList result={runtime.compatibility} /></div><div className="settings-actions"><span className={`status ${runtime.compatibility ? (runtime.compatibility.passed ? 'success' : 'warning') : 'success'}`}><i />{runtime.compatibility ? (runtime.compatibility.passed ? 'Verified' : 'Attention') : 'Protected'}</span><BusyButton type="button" className="secondary-btn" busy={busy.has('compatibility')} onClick={() => void authenticatedManagementUiRuntime.runSettingAction('compatibility')}>{runtime.compatibility ? 'Verify again' : 'Verify applications'}</BusyButton></div></div>
      </section>
      <section className="settings-card settings-secondary">
        <div className="settings-row" data-wm-setting="storage-health"><div><span>STORAGE HEALTH</span><h2>Shell preference persistence</h2><p>{storageCopy}</p>{usagePct != null && health ? <><div className="storage-meter"><span style={{ width: `${usagePct.toFixed(2)}%` }} /></div><small>{formatBytes(health.usage)} used of approximately {formatBytes(health.quota)}</small></> : <small>Storage quota information is not available from this browser.</small>}</div>{!health ? <BusyButton type="button" className="secondary-btn" busy={busy.has('refresh-storage')} onClick={() => void authenticatedManagementUiRuntime.runSettingAction('refresh-storage')}>Refresh status</BusyButton> : health.persistent ? <div className="settings-actions"><span className="status success"><i />Persistent</span><BusyButton type="button" className="secondary-btn" busy={busy.has('refresh-storage')} onClick={() => void authenticatedManagementUiRuntime.runSettingAction('refresh-storage')}>Refresh status</BusyButton></div> : <div className="settings-actions">{health.persistenceSupported ? <BusyButton type="button" className="secondary-btn" busy={busy.has('persist')} onClick={() => void authenticatedManagementUiRuntime.runSettingAction('persist')}>Request persistence</BusyButton> : null}<BusyButton type="button" className="secondary-btn" busy={busy.has('refresh-storage')} onClick={() => void authenticatedManagementUiRuntime.runSettingAction('refresh-storage')}>Refresh status</BusyButton></div>}</div>
        <div className="settings-row" data-wm-setting="auth-backend"><div><span>CLOUD &amp; IDENTITY</span><h2>Authentication backend</h2><p>{auth.isCloudEnabled ? (auth.isConfigured ? (auth.isAuthenticated ? `Connected to Supabase as ${auth.user?.email || 'authenticated user'}. Shell authorization is enforced by cloud role mappings.` : 'Supabase is configured. Sign in to activate cloud identity and module authorization.') : 'Cloud mode is enabled but the public Supabase URL or publishable key is missing.') : 'Local-only mode is active. Configure Supabase to enable login, registration, sessions, cloud profiles and module role mapping.'}</p><small>Server secrets are never stored in the GitHub Pages client. Workspace backups explicitly exclude authentication session tokens.</small><DiagnosticList result={runtime.backendStatus} /></div><div className="settings-actions"><span className={`status ${runtime.backendStatus ? (runtime.backendStatus.passed ? 'success' : 'warning') : (!auth.isConfigured ? 'warning' : 'success')}`}><i />{runtime.backendStatus ? (runtime.backendStatus.passed ? 'Verified' : 'Attention') : (auth.isConfigured ? 'Configured' : 'Setup required')}</span><BusyButton type="button" className="secondary-btn" busy={busy.has('refresh-auth')} onClick={() => void authenticatedManagementUiRuntime.runSettingAction('refresh-auth')}>Refresh backend status</BusyButton><button type="button" className="secondary-btn" data-account>{auth.isAuthenticated ? 'Open account' : 'Sign in'}</button></div></div>
        <div className="settings-row diagnostics-row" data-wm-setting="diagnostics"><div><span>SYSTEM DIAGNOSTICS</span><h2>Platform verification</h2><p>Run non-destructive checks for shell preferences, authenticated cloud configuration, module registry correctness, and active application runtime availability.</p><DiagnosticList result={runtime.diagnostics} /></div><BusyButton type="button" className="secondary-btn" busy={busy.has('diagnostics')} onClick={() => void authenticatedManagementUiRuntime.runSettingAction('diagnostics')}>{runtime.diagnostics ? 'Run again' : 'Run diagnostics'}</BusyButton></div>
        <div className="settings-row" data-wm-setting="backup-recovery"><div><span>BACKUP &amp; RECOVERY</span><h2>Workspace backup</h2><p>Export an M34 recovery package with a SHA-256 integrity manifest. Restore performs integrity/preflight checks and downloads a pre-restore checkpoint before transactional recovery; legacy raw backups remain supported with an unverified warning.</p></div><div className="settings-actions"><BusyButton type="button" className="secondary-btn" busy={busy.has('export-backup')} onClick={() => void authenticatedManagementUiRuntime.runSettingAction('export-backup')}>Export backup</BusyButton><BusyButton type="button" className="secondary-btn" busy={busy.has('import-backup')} onClick={() => backupInput.current?.click()}>Restore backup</BusyButton><input ref={backupInput} id="wmBackupFileInput" type="file" accept="application/json,.json" hidden aria-hidden="true" onChange={selectBackup} /></div></div>
        <div className="settings-row danger-row" data-wm-setting="preference-reset"><div><span>PLATFORM RESET</span><h2>Reset shell preferences</h2><p>Reset Work Management theme, spacing, favorites, recent application history, and launcher filters only. Registered application data is explicitly excluded.</p></div><BusyButton type="button" className="secondary-btn" busy={busy.has('reset-platform')} onClick={() => void authenticatedManagementUiRuntime.runSettingAction('reset-platform')}>Reset preferences</BusyButton></div>
      </section>
    </main>
  </>;
}

function UsersView() {
  useAuthenticatedManagementUiRuntime((snapshot) => snapshot.authRevision);
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState('');
  const [busyUsers, setBusyUsers] = useState<ReadonlySet<string>>(() => new Set());
  const [feedback, setFeedback] = useState<Readonly<{ tone: 'success' | 'warning'; message: string }> | null>(null);
  const directory = useQuery({
    queryKey: USER_DIRECTORY_QUERY_KEY,
    queryFn: () => auth.listUsers(),
    enabled: auth.canManageUsers,
    staleTime: 30_000,
  });
  const rows = useMemo(() => {
    const parsed = (directory.data ?? []).map(parseUserDirectoryRecord).filter((row): row is UserDirectoryRecord => row !== null);
    const q = filter.trim().toLowerCase();
    return parsed.filter((user) => !q || `${user.display_name} ${user.email} ${auth.roleLabel(user.platform_role)} ${user.status}`.toLowerCase().includes(q));
  }, [directory.data, filter]);

  if (!auth.canManageUsers) return <>
    <ManagementTopbar title="Access restricted" subtitle="User administration is available only to Admin/General Manager accounts." />
    <main id="main" className="page" data-wm-management-view="users-denied" tabIndex={-1}><div className="empty"><strong><WMIcon name="alert" /></strong><h2>Administrator access required</h2><p>Your account is not authorized to manage Work Management users or roles.</p><button className="primary-btn" data-nav="" type="button">Return to applications</button></div></main>
  </>;

  const submitUser = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    const userId = form.dataset.userId || '';
    if (!userId || busyUsers.has(userId)) return;
    const current = rows.find((user) => user.id === userId);
    if (!current) return;
    const values = new FormData(form);
    const role = String(values.get('platformRole') || current.platform_role) as PlatformRole;
    const status = String(values.get('status') || current.status);
    if (!PLATFORM_ROLES.has(role) || (status !== 'active' && status !== 'disabled')) return;
    if (current.is_bootstrap_admin && (role !== 'admin_general_manager' || status !== 'active')) {
      setFeedback({ tone:'warning', message:'The bootstrap administrator cannot be demoted or disabled.' });
      return;
    }
    if (current.is_self && status === 'disabled') {
      setFeedback({ tone:'warning', message:'You cannot disable your own active administrator account.' });
      return;
    }
    if (current.is_last_active_admin && (role !== 'admin_general_manager' || status !== 'active')) {
      setFeedback({ tone:'warning', message:'At least one active Admin/General Manager is required.' });
      return;
    }
    setBusyUsers((value) => new Set([...value, userId]));
    setFeedback(null);
    try {
      const result = await authenticatedManagementUiRuntime.updateUserAccess({ userId, platformRole: role, status });
      const updated = parseUserDirectoryRecord(result);
      if (updated) {
        queryClient.setQueryData(USER_DIRECTORY_QUERY_KEY, (existing: readonly unknown[] | undefined) =>
          (existing ?? []).map((record) => isRecord(record) && record.id === userId ? updated : record));
      }
      if (!auth.canManageUsers) {
        setFeedback({ tone:'success', message:'Your role was updated successfully. This account no longer has user-management permission.' });
        return;
      }
      const refreshed = await directory.refetch();
      if (refreshed.isError) {
        setFeedback({ tone:'warning', message:'User access was updated, but the directory could not be refreshed. Retry Refresh to reconcile the latest server state.' });
      } else {
        setFeedback({ tone:'success', message:'User access updated transactionally. Platform and module roles are synchronized.' });
      }
    } catch (error) {
      setFeedback({ tone:'warning', message:error instanceof Error ? error.message : 'User access could not be updated.' });
    } finally {
      setBusyUsers((value) => new Set([...value].filter((id) => id !== userId)));
    }
  };

  return <>
    <ManagementTopbar title="Users" subtitle="Manage Work Management account roles and access status." />
    <main id="main" className="page users-page" data-wm-management-view="users" tabIndex={-1}>
      <section className="section-block users-intro"><div className="section-title"><div><span>ACCESS CONTROL</span><h3>User management</h3></div><p>Role and status changes are executed through serialized protected Supabase RPCs and synchronized into module role assignments in the same transaction.</p></div><div className="role-policy"><span><b>Admin/General Manager</b> Full platform administration</span><span><b>HR</b> HR-aligned workforce access</span><span><b>Supervisor</b> Supervisory access</span><span><b>Employee</b> Default least-privilege access</span></div></section>
      <section className="settings-card user-directory-card">
        {feedback ? <div className={`user-directory-state ${feedback.tone === 'warning' ? 'error' : ''}`} data-wm-user-feedback={feedback.tone} role="status"><strong>{feedback.tone === 'warning' ? 'Action requires attention' : 'User access updated'}</strong><p>{feedback.message}</p></div> : null}
        {directory.isLoading ? <div className="user-directory-state"><span className="button-spinner" aria-hidden="true" /><strong>Loading user directory…</strong></div> : directory.isError ? <div className="user-directory-state error"><strong>User directory unavailable</strong><p>{directory.error instanceof Error ? directory.error.message : 'The user directory could not be loaded.'}</p><button className="secondary-btn" type="button" onClick={() => { setFeedback(null); void directory.refetch(); }}>Retry</button></div> : <><div className="user-toolbar"><label className="app-search"><WMIcon name="search" /><input id="userDirectorySearch" value={filter} onChange={(event) => setFilter(event.currentTarget.value)} placeholder="Search name, email, role, or status" autoComplete="off" /></label><button className="secondary-btn" type="button" disabled={directory.isFetching} aria-busy={directory.isFetching || undefined} onClick={() => { setFeedback(null); void directory.refetch(); }}>{directory.isFetching ? 'Refreshing…' : 'Refresh'}</button></div><div className="user-directory" role="list">{rows.length ? rows.map((user) => {
          const busy = busyUsers.has(user.id);
          const roleLocked = user.is_bootstrap_admin || user.is_last_active_admin;
          const statusLocked = user.is_bootstrap_admin || user.is_self || user.is_last_active_admin;
          const fullyProtected = roleLocked && statusLocked;
          const protection = user.is_bootstrap_admin ? 'Bootstrap administrator' : user.is_last_active_admin ? 'Last active administrator' : user.is_self ? 'Current administrator' : '';
          return <form key={`${user.id}:${user.platform_role}:${user.status}`} className="user-row" data-wm-management-form="user-access" data-user-id={user.id} data-user-bootstrap={user.is_bootstrap_admin || undefined} data-user-self={user.is_self || undefined} data-user-last-admin={user.is_last_active_admin || undefined} role="listitem" onSubmit={(event) => void submitUser(event)}>
            <div className="user-identity"><span className="avatar mini">{(user.display_name || user.email || 'U').slice(0, 2).toUpperCase()}</span><span><strong>{user.display_name || 'Unnamed user'}</strong><small>{user.email}</small>{protection ? <em>{protection}</em> : null}</span></div>
            <label><span>Role</span><select name="platformRole" defaultValue={user.platform_role} disabled={roleLocked}>{auth.supportedPlatformRoles().map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></label>
            <label><span>Status</span><select name="status" defaultValue={user.status} disabled={statusLocked}><option value="active">Active</option><option value="disabled">Disabled</option></select></label>
            <div className="user-row-actions"><span className={`status ${user.status === 'active' ? 'success' : 'warning'}`}><i />{user.status}</span>{fullyProtected ? <span className="status success"><i />Protected</span> : <BusyButton className="secondary-btn" type="submit" busy={busy}>Save</BusyButton>}</div>
          </form>;
        }) : <div className="user-directory-state"><strong>No matching accounts</strong><p>Adjust the search query to view other registered users.</p></div>}</div></>}
      </section>
    </main>
  </>;
}

export function AuthenticatedManagementUI() {
  const runtime = useAuthenticatedManagementUiRuntime((snapshot) => snapshot);
  useLayoutEffect(() => {
    if (runtime.view === 'hidden') return;
    const main = document.querySelector<HTMLElement>('[data-wm-authenticated-management-ui-host] #main');
    if (!main) return;
    const owner = 'management' as const;
    presentationReadinessRuntime.acknowledge(owner, main);
    return () => presentationReadinessRuntime.release(owner, main);
  }, [runtime.view, runtime.authRevision]);
  if (runtime.view === 'hidden') return null;
  return (
    <div className="workspace" data-workspace-root="" aria-label="Workspace content" data-wm-authenticated-management-ui-host="" data-wm-composition-owner="react-management" data-wm-management-route={runtime.view}>
      {runtime.view === 'account' ? <AccountView /> : runtime.view === 'settings' ? <SettingsView /> : <UsersView />}
    </div>
  );
}

const SESSION_KEY = 'wm.platform.auth.session.v1';
const IDENTITY_KEY = 'wm.platform.identity.v1';

function parseJson(value) {
  if (!value) return null;
  try { return JSON.parse(value); } catch { return null; }
}

export function resolveWorkspaceHostContext() {
  const injected = globalThis.__WATCHDOG_WORKSPACE__;
  if (injected?.session?.access_token) {
    return {
      session: injected.session,
      workspaceId: injected.workspaceId || injected.activeWorkspaceId || null,
      embedded: true,
    };
  }

  if (typeof localStorage === 'undefined') return { session: null, workspaceId: null, embedded: false };
  const authSession = parseJson(localStorage.getItem(SESSION_KEY));
  const identity = parseJson(localStorage.getItem(IDENTITY_KEY));
  const session = authSession?.access_token
    ? {
        ...authSession,
        user: authSession.user || identity?.user || identity || null,
      }
    : null;
  return {
    session,
    workspaceId: identity?.workspaceId || identity?.activeWorkspaceId || null,
    embedded: false,
  };
}

export { SESSION_KEY, IDENTITY_KEY };

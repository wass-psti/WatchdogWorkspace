import { auth, AUTH_EVENT } from '../../../assets/js/core/auth.ts';

export type AuthenticationUIView = 'hidden' | 'boot' | 'login' | 'register' | 'verify' | 'disabled' | 'recovery';
export type AuthenticationUIFeedbackTone = 'success' | 'warning';

export interface AuthenticationUIRegistrationDraft {
  readonly displayName: string;
  readonly email: string;
}

export interface AuthenticationUIRuntimeSnapshot {
  readonly view: AuthenticationUIView;
  readonly feedbackMessage: string;
  readonly feedbackTone: AuthenticationUIFeedbackTone;
  readonly pendingConfirmationEmail: string;
  readonly needsConfirmation: boolean;
  readonly registrationDraft: AuthenticationUIRegistrationDraft;
  readonly callbackProcessing: boolean;
  readonly authRevision: number;
}

export interface AuthenticationUIRuntimePatch {
  readonly view?: AuthenticationUIView;
  readonly feedbackMessage?: string;
  readonly feedbackTone?: AuthenticationUIFeedbackTone;
  readonly pendingConfirmationEmail?: string;
  readonly needsConfirmation?: boolean;
  readonly registrationDraft?: AuthenticationUIRegistrationDraft;
  readonly callbackProcessing?: boolean;
  readonly authRevision?: number;
}

const RETURN_ROUTE_KEY = 'wm.platform.auth.return-to.v1';

const DEFAULT_SNAPSHOT: AuthenticationUIRuntimeSnapshot = Object.freeze({
  view: 'boot',
  feedbackMessage: '',
  feedbackTone: 'success',
  pendingConfirmationEmail: '',
  needsConfirmation: false,
  registrationDraft: Object.freeze({ displayName: '', email: '' }),
  callbackProcessing: false,
  authRevision: 0,
});

let snapshot = DEFAULT_SNAPSHOT;
const listeners = new Set<() => void>();

const freezeDraft = (draft: AuthenticationUIRegistrationDraft): AuthenticationUIRegistrationDraft => Object.freeze({ ...draft });
const freezeSnapshot = (next: AuthenticationUIRuntimeSnapshot): AuthenticationUIRuntimeSnapshot => Object.freeze({
  ...next,
  registrationDraft: freezeDraft(next.registrationDraft),
});

function publish(patch: AuthenticationUIRuntimePatch): AuthenticationUIRuntimeSnapshot {
  const next = freezeSnapshot({
    ...snapshot,
    ...patch,
    registrationDraft: patch.registrationDraft ? freezeDraft(patch.registrationDraft) : snapshot.registrationDraft,
  });
  if (
    next.view === snapshot.view
    && next.feedbackMessage === snapshot.feedbackMessage
    && next.feedbackTone === snapshot.feedbackTone
    && next.pendingConfirmationEmail === snapshot.pendingConfirmationEmail
    && next.needsConfirmation === snapshot.needsConfirmation
    && next.registrationDraft.displayName === snapshot.registrationDraft.displayName
    && next.registrationDraft.email === snapshot.registrationDraft.email
    && next.callbackProcessing === snapshot.callbackProcessing
    && next.authRevision === snapshot.authRevision
  ) return snapshot;
  snapshot = next;
  for (const listener of listeners) listener();
  return snapshot;
}

function cleanReturnRoute(value: string): string {
  const cleaned = String(value || '').replace(/^#\/?/, '');
  if (!cleaned || ['login', 'register', 'verify'].includes(cleaned.split('/')[0] ?? '')) return '';
  return cleaned;
}

export const authenticationUiRuntime = Object.freeze({
  getSnapshot: (): AuthenticationUIRuntimeSnapshot => snapshot,
  subscribe(listener: () => void): () => void {
    listeners.add(listener);
    return () => { listeners.delete(listener); };
  },
  show(view: Exclude<AuthenticationUIView, 'hidden'>): AuthenticationUIRuntimeSnapshot {
    return publish({ view, callbackProcessing: false });
  },
  showCallbackProgress(): AuthenticationUIRuntimeSnapshot {
    return publish({ view: 'verify', callbackProcessing: true });
  },
  completeCallbackProgress(): AuthenticationUIRuntimeSnapshot {
    return publish({ callbackProcessing: false });
  },
  hide(): AuthenticationUIRuntimeSnapshot {
    return publish({ view: 'hidden', callbackProcessing: false });
  },
  setFeedback(message = '', tone: AuthenticationUIFeedbackTone = 'success'): AuthenticationUIRuntimeSnapshot {
    return publish({
      feedbackMessage: String(message || ''),
      feedbackTone: tone === 'warning' ? 'warning' : 'success',
    });
  },
  setPendingConfirmationEmail(email: string): AuthenticationUIRuntimeSnapshot {
    return publish({ pendingConfirmationEmail: String(email || '').trim() });
  },
  setNeedsConfirmation(needsConfirmation: boolean): AuthenticationUIRuntimeSnapshot {
    return publish({ needsConfirmation: Boolean(needsConfirmation) });
  },
  setRegistrationDraft(draft: AuthenticationUIRegistrationDraft): AuthenticationUIRuntimeSnapshot {
    return publish({
      registrationDraft: {
        displayName: String(draft.displayName || ''),
        email: String(draft.email || '').trim(),
      },
    });
  },
  consumeReturnRoute(): string {
    let target = '';
    try {
      target = sessionStorage.getItem(RETURN_ROUTE_KEY) || '';
      sessionStorage.removeItem(RETURN_ROUTE_KEY);
    } catch {}
    return cleanReturnRoute(target);
  },
  activate(): AuthenticationUIRuntimeSnapshot {
    return snapshot;
  },
  deactivate(): AuthenticationUIRuntimeSnapshot {
    return publish({ view: 'hidden', callbackProcessing: false });
  },
  resetForTest(): AuthenticationUIRuntimeSnapshot {
    snapshot = DEFAULT_SNAPSHOT;
    for (const listener of listeners) listener();
    return snapshot;
  },
});

auth.addEventListener(AUTH_EVENT, () => {
  publish({ authRevision: snapshot.authRevision + 1 });
});

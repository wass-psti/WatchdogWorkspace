import { useEffect, useMemo, useRef, type KeyboardEvent as ReactKeyboardEvent } from 'react';
import { createOverlayManager } from '../../../assets/js/platform/ui/overlay-manager.ts';
import { sharedApplicationUiRuntime } from './shared-application-ui-runtime.ts';
import { useSharedApplicationUiRuntime } from './useSharedApplicationUiRuntime.ts';

function CommandPalette() {
  const command = useSharedApplicationUiRuntime((snapshot) => snapshot.command);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const dialogRef = useRef<HTMLDivElement | null>(null);
  const overlay = useMemo(() => createOverlayManager({ scope: 'react-shared-command-palette' }), []);

  useEffect(() => () => overlay.dispose(), [overlay]);

  useEffect(() => {
    if (command.phase === 'closed') return;
    const dialog = dialogRef.current;
    if (!dialog) return;
    overlay.open({
      id: 'global-command-palette',
      element: dialog,
      close: ({ restoreFocus = false } = {}) => {
        sharedApplicationUiRuntime.closeCommandPalette({ immediate: true, restoreFocus });
      },
    });
    const frame = globalThis.requestAnimationFrame?.(() => {
      // Route transitions can synchronously close the palette before React has
      // committed its removal. Never let a stale autofocus frame reclaim focus
      // from the newly committed route owner.
      if (sharedApplicationUiRuntime.getSnapshot().command.phase === 'closed') return;
      inputRef.current?.focus();
    }) ?? 0;
    return () => {
      if (frame) globalThis.cancelAnimationFrame?.(frame);
      overlay.release('global-command-palette');
    };
  }, [command.phase, overlay]);

  if (command.phase === 'closed') return null;

  const handleKeyDown = (event: ReactKeyboardEvent<HTMLDivElement>): void => {
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      sharedApplicationUiRuntime.moveCommandSelection(1);
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      sharedApplicationUiRuntime.moveCommandSelection(-1);
    } else if (event.key === 'Enter' && event.target === inputRef.current) {
      event.preventDefault();
      void sharedApplicationUiRuntime.executeSelectedCommand();
    } else if (event.key === 'Escape') {
      event.preventDefault();
      sharedApplicationUiRuntime.closeCommandPalette();
    } else if (event.key === 'Tab') {
      const dialog = dialogRef.current;
      if (!dialog) return;
      const focusable = [...dialog.querySelectorAll<HTMLElement>('button:not(:disabled),input:not(:disabled),[tabindex]:not([tabindex="-1"])')];
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable.at(-1);
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last?.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first?.focus();
      }
    }
  };

  return (
    <div
      className={`command-backdrop${command.phase === 'closing' ? ' closing' : ''}`}
      data-wm-shared-command-palette=""
      aria-hidden={command.phase === 'closing' ? true : undefined}
    >
      <div ref={dialogRef} className="command-dialog" role="dialog" aria-modal="true" aria-label="Command palette" data-command-dialog onKeyDown={handleKeyDown}>
        <div className="command-input-wrap">
          <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>
          <input
            ref={inputRef}
            id="commandInput"
            autoComplete="off"
            placeholder="Search applications, capabilities and commands…"
            aria-label="Command search"
            aria-controls="commandResults"
            aria-activedescendant={command.items[command.selection] ? `wm-command-${command.items[command.selection]?.id.replace(/[^a-zA-Z0-9_-]/g, '-')}` : undefined}
            value={command.query}
            onChange={(event) => sharedApplicationUiRuntime.updateCommandQuery(event.currentTarget.value)}
          />
        </div>
        <div className="command-results" id="commandResults" role="listbox" aria-label="Available commands">
          {command.items.length ? command.items.map((item, index) => {
            const selected = index === command.selection;
            const resultId = `wm-command-${item.id.replace(/[^a-zA-Z0-9_-]/g, '-')}`;
            return (
              <button
                id={resultId}
                key={item.id}
                type="button"
                className={`command-result${selected ? ' selected' : ''}`}
                role="option"
                aria-selected={selected}
                data-command-id={item.id}
                data-command-index={index}
                onPointerMove={() => sharedApplicationUiRuntime.selectCommand(index)}
                onFocus={() => sharedApplicationUiRuntime.selectCommand(index)}
                onClick={() => void sharedApplicationUiRuntime.executeCommand(item.id)}
              >
                <span aria-hidden="true" dangerouslySetInnerHTML={{ __html: item.icon }} />
                <div><strong>{item.title}</strong><small>{item.subtitle}</small></div>
                <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14M14 7l5 5-5 5"/></svg>
              </button>
            );
          }) : <div className="command-empty" role="status">No matching commands.</div>}
        </div>
        <footer><span><kbd>↑</kbd><kbd>↓</kbd> navigate <kbd>↵</kbd> open</span><span><kbd>Esc</kbd> close</span></footer>
      </div>
    </div>
  );
}

function UpdateBanner() {
  const update = useSharedApplicationUiRuntime((snapshot) => snapshot.update);
  if (!update.available) return null;
  return (
    <div className="update-banner" data-wm-shared-update-banner="" role="status">
      <span>A newer Work Management build is ready. Updating reloads open Work Management tabs.</span>
      <button type="button" disabled={update.applying} aria-busy={update.applying || undefined} onClick={() => void sharedApplicationUiRuntime.applyUpdate()}>{update.applying ? 'Updating…' : 'Update now'}</button>
      <button type="button" disabled={update.applying} aria-label="Dismiss update" onClick={() => sharedApplicationUiRuntime.dismissUpdate()}>×</button>
    </div>
  );
}

function ToastStack() {
  const toasts = useSharedApplicationUiRuntime((snapshot) => snapshot.toasts);
  return <>{toasts.map((toast) => <div key={toast.id} className={`toast ${toast.tone} visible`} data-wm-shared-toast={toast.id} role="status"><span aria-hidden="true">{toast.tone === 'success' ? '✓' : '!'}</span><strong>{toast.message}</strong></div>)}</>;
}

export function SharedApplicationOverlayLayer() {
  return <><CommandPalette /><UpdateBanner /></>;
}

export function SharedApplicationToastLayer() {
  return <ToastStack />;
}

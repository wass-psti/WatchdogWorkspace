import { useEffect, useState, type CSSProperties } from 'react';
import { RuntimeApplicationBoundary } from '../composition/RuntimeApplicationBoundary.tsx';
import { useWorkManagementClientState } from '../composition/useWorkManagementClientState.ts';
import { useReactShellRuntime } from './useReactShellRuntime.ts';
import { GlobalOverlayHost } from '../overlays/GlobalOverlayHost.tsx';
import { AuthenticationUI } from '../auth/AuthenticationUI.tsx';
import { useAuthenticationUiRuntime } from '../auth/useAuthenticationUiRuntime.ts';
import { AuthenticatedManagementUI } from '../management/AuthenticatedManagementUI.tsx';
import { useAuthenticatedManagementUiRuntime } from '../management/useAuthenticatedManagementUiRuntime.ts';
import { BoardPresentationFacade } from '../boards/BoardPresentationFacade.tsx';
import { useBoardPresentationFacadeRuntime } from '../boards/useBoardPresentationFacadeRuntime.ts';

const navigationGlyphs = Object.freeze({
  collapse: <svg viewBox="0 0 20 20" aria-hidden="true"><path d="m12.7 4.8-5.2 5.2 5.2 5.2" /></svg>,
  menu: <svg viewBox="0 0 20 20" aria-hidden="true"><path d="M3 5.25h14M3 10h14M3 14.75h14" /></svg>,
  pin: <svg viewBox="0 0 20 20" aria-hidden="true"><path d="M7 3.5h6M8 3.5v4l-2 2.25v1h8v-1L12 7.5v-4M10 10.75V17" /></svg>,
});

function useMedia(query: string): boolean {
  const [matches, setMatches] = useState(() => globalThis.matchMedia?.(query).matches ?? false);
  useEffect(() => {
    const media = globalThis.matchMedia?.(query);
    if (!media) return;
    const update = () => setMatches(media.matches);
    update();
    media.addEventListener('change', update);
    return () => media.removeEventListener('change', update);
  }, [query]);
  return matches;
}

export function WorkManagementShell() {
  const runtime = useReactShellRuntime((snapshot) => snapshot);
  const shell = useWorkManagementClientState((snapshot) => snapshot.shell);
  const authenticationView = useAuthenticationUiRuntime((snapshot) => snapshot.view);
  const managementView = useAuthenticatedManagementUiRuntime((snapshot) => snapshot.view);
  const boardPresentationView = useBoardPresentationFacadeRuntime((snapshot) => snapshot.view);
  const mobile = useMedia('(max-width: 620px)');
  const tablet = useMedia('(max-width: 900px) and (min-width: 621px)');
  const shellActive = runtime.mode === 'shell';
  const authenticationActive = authenticationView !== 'hidden';
  const managementActive = managementView !== 'hidden';
  const boardPresentationActive = boardPresentationView !== 'hidden';
  const desktopInteractive = shellActive && !mobile && !tablet;
  const visuallyExpanded = shell.navigation.mode === 'expanded' || (desktopInteractive && !shell.navigation.pinned && shell.navigation.peek);
  const mobileOpen = shellActive && mobile && shell.navigation.mobileOpen;
  const collapseLabel = mobile ? 'Close navigation' : (visuallyExpanded ? 'Collapse navigation' : 'Expand navigation');
  const pinLabel = shell.navigation.pinned ? 'Unpin navigation' : 'Pin navigation';
  const resizeAvailable = desktopInteractive && visuallyExpanded;

  useEffect(() => {
    document.body.classList.toggle('shell-navigation-open', mobileOpen);
    document.body.classList.toggle('shell-navigation-resizing', shellActive && shell.navigation.resizing);
    return () => {
      document.body.classList.remove('shell-navigation-open');
      document.body.classList.remove('shell-navigation-resizing');
    };
  }, [mobileOpen, shell.navigation.resizing, shellActive]);

  return (
    <div data-wm-react-shell-root="" data-wm-react-shell-mode={runtime.mode}>
      <div
        className={shellActive ? 'shell' : undefined}
        data-wm-react-shell-layout=""
        data-workspace-shell={shellActive ? '' : undefined}
        data-shell-navigation-state={shellActive ? shell.navigation.mode : undefined}
        data-shell-navigation-pinned={shellActive ? String(shell.navigation.pinned) : undefined}
        data-shell-navigation-peek={shellActive ? String(shell.navigation.peek && !shell.navigation.pinned) : undefined}
        data-shell-navigation-resizing={shellActive && shell.navigation.resizing ? '' : undefined}
        data-shell-mobile-open={shellActive ? String(mobileOpen) : undefined}
        style={shellActive ? { '--wm-shell-navigation-user-width': `${shell.navigation.width}px` } as CSSProperties : undefined}
      >
        {shellActive ? <>
          <a className="shell-skip-link" data-shell-skip href="#main">Skip to main content</a>
          <button className="shell-mobile-navigation-trigger" data-shell-navigation-mobile-toggle type="button" aria-label={mobileOpen ? 'Close navigation' : 'Open navigation'} data-shell-tooltip={mobileOpen ? 'Close navigation' : 'Open navigation'} data-shell-tooltip-placement="bottom" aria-controls="primarySidebar" aria-expanded={mobileOpen} aria-haspopup="dialog">{navigationGlyphs.menu}</button>
          <button className="shell-sidebar-backdrop" data-shell-navigation-dismiss type="button" tabIndex={-1} aria-hidden="true" aria-label="Close navigation" />
          <aside
            className="sidebar"
            id="primarySidebar"
            aria-hidden={mobile ? !mobileOpen : undefined}
            role={mobile ? 'dialog' : undefined}
            aria-modal={mobile && mobileOpen ? true : undefined}
            aria-label={mobile ? 'Navigation menu' : 'Primary navigation'}
          >
            <div className="shell-sidebar-header">
              <button className="brand" data-nav="" aria-label="Work Management home" data-shell-tooltip="Work Management home" data-shell-tooltip-mode="compact"><span className="brand-mark"><i /><i /><i /><i /></span><span className="brand-copy"><strong>Work</strong><small>Management</small></span></button>
              <div className="shell-sidebar-header-actions">
                <button className="shell-sidebar-pin" data-shell-navigation-pin type="button" aria-label={pinLabel} data-shell-tooltip={pinLabel} data-shell-tooltip-variant="action" aria-pressed={shell.navigation.pinned} disabled={!resizeAvailable} tabIndex={resizeAvailable ? 0 : -1}>{navigationGlyphs.pin}</button>
                <button className="shell-sidebar-collapse" data-shell-navigation-toggle type="button" aria-label={collapseLabel} data-shell-tooltip={collapseLabel} data-shell-tooltip-variant="action" aria-controls="primarySidebar" aria-expanded={mobile ? mobileOpen : visuallyExpanded}>{navigationGlyphs.collapse}</button>
              </div>
            </div>
            <div className="shell-navigation-scroll">
              <nav data-shell-nav aria-label="Main" dangerouslySetInnerHTML={{ __html: runtime.navigationMarkup }} />
            </div>
            <div className="sidebar-foot"><span className={`health-dot ${runtime.online ? '' : 'offline'}`} /><div><strong>{runtime.online ? 'Platform ready' : 'Offline mode'}</strong><small>v{runtime.platformVersion} · {runtime.cloudModeLabel}</small></div></div>
            <button type="button" className="shell-sidebar-resizer" data-shell-resizer role="separator" aria-label="Resize navigation" aria-orientation="vertical" aria-valuemin={224} aria-valuemax={360} aria-valuenow={shell.navigation.width} aria-valuetext={`${shell.navigation.width} pixels`} aria-keyshortcuts="ArrowLeft ArrowRight Home End" aria-disabled={!resizeAvailable} disabled={!resizeAvailable} tabIndex={resizeAvailable ? 0 : -1} data-shell-tooltip="Drag to resize. Arrow keys use 8px steps; Shift uses 24px." data-shell-tooltip-placement="right" />
            <span className="wm-visually-hidden shell-navigation-status" data-shell-navigation-status aria-live="polite" aria-atomic="true" />
          </aside>
        </> : null}
        {authenticationActive ? <AuthenticationUI /> : null}
        {managementActive ? <AuthenticatedManagementUI /> : null}
        <BoardPresentationFacade
          {...(shellActive ? { className: 'workspace' } : {})}
          inert={mobileOpen || authenticationActive || managementActive}
        />
        <RuntimeApplicationBoundary
          {...(shellActive ? { className: `workspace${runtime.workspaceMode === 'module' ? ' module-workspace' : ''}` } : {})}
          workspace={shellActive}
          inert={mobileOpen || authenticationActive || managementActive || boardPresentationActive}
          hidden={authenticationActive || managementActive || boardPresentationActive}
        />
      </div>
      <GlobalOverlayHost />
    </div>
  );
}

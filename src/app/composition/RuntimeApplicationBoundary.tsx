import { memo, useEffect, useRef } from 'react';
import { mountRuntimeApplication } from './runtime-adapter.ts';

function renderBoundaryFailure(host: HTMLElement): void {
  host.className = 'boot-screen';
  host.setAttribute('role', 'alert');
  host.setAttribute('data-wm-react-boundary-state', 'failed');
  const title = document.createElement('strong');
  title.textContent = 'Work Management could not start.';
  const detail = document.createElement('small');
  detail.textContent = 'Reload the page. If the problem persists, contact your platform administrator.';
  host.replaceChildren(title, detail);
}

export interface RuntimeApplicationBoundaryProps {
  readonly className?: string;
  readonly workspace?: boolean;
  readonly inert?: boolean;
  readonly hidden?: boolean;
}

function RuntimeApplicationBoundaryComponent({ className, workspace = false, inert = false, hidden = false }: RuntimeApplicationBoundaryProps) {
  const hostRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    let active = true;
    void mountRuntimeApplication(host).then(() => {
      if (!active) return;
      host.setAttribute('data-wm-react-boundary-state', 'ready');
    }).catch((error: unknown) => {
      console.error('[Work Management] Legacy composition startup failed', error);
      if (active) renderBoundaryFailure(host);
    });

    return () => { active = false; };
  }, []);

  return (
    <div
      ref={hostRef}
      className={className}
      data-workspace-root={workspace ? '' : undefined}
      aria-label={workspace ? 'Workspace content' : undefined}
      inert={inert ? true : undefined}
      hidden={hidden}
      data-wm-runtime-host=""
      data-wm-react-boundary-state="starting"
      data-wm-composition-owner="runtime-route-content"
    />
  );
}

/**
 * The runtime route-content host is page-lifetime stable. React may update shell
 * attributes around it, but never re-creates or renders its imperative children.
 */
export const RuntimeApplicationBoundary = memo(RuntimeApplicationBoundaryComponent);

import React, { useEffect, useState } from 'react';
import App from '@material/generated/App';
import { initializeMaterialTrackerRuntime } from './platform/integration/bootstrap';
import { MaterialTrackerRuntimeProvider } from './platform/integration/runtime-context';
import './index.css';
import '@material/generated/theme-tokens.css';

export default function MaterialTrackerApp({ session, workspaceId, embedded = true }) {
  const [state, setState] = useState({ loading: true, error: null, runtime: null });

  useEffect(() => {
    let active = true;
    initializeMaterialTrackerRuntime({ session, workspaceId, embedded })
      .then((runtime) => active && setState({ loading: false, error: null, runtime }))
      .catch((error) => active && setState({ loading: false, error, runtime: null }));
    return () => { active = false; };
  }, [session, workspaceId, embedded]);

  if (state.loading) {
    return <div data-module="material-tracker" className="p-6 text-sm text-muted-foreground">Loading Material Tracker…</div>;
  }
  if (state.error) {
    return (
      <div data-module="material-tracker" className="p-6">
        <div className="rounded-lg border border-destructive/40 bg-destructive/5 p-4 text-sm text-destructive">
          Material Tracker could not initialize: {state.error.message}
        </div>
      </div>
    );
  }
  return (
    <MaterialTrackerRuntimeProvider runtime={state.runtime}>
      <div data-module="material-tracker"><App runtime={state.runtime} /></div>
    </MaterialTrackerRuntimeProvider>
  );
}

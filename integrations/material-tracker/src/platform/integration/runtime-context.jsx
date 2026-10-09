import React, { createContext, useContext } from 'react';

const MaterialTrackerRuntimeContext = createContext({
  embedded: false,
  role: null,
  canWrite: false,
  canAdmin: false,
  user: null,
  workspaceId: null,
});

export function MaterialTrackerRuntimeProvider({ runtime, children }) {
  return (
    <MaterialTrackerRuntimeContext.Provider value={runtime || {}}>
      {children}
    </MaterialTrackerRuntimeContext.Provider>
  );
}

export function useMaterialTrackerRuntime() {
  return useContext(MaterialTrackerRuntimeContext);
}

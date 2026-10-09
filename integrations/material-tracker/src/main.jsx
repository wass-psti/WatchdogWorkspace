import React from 'react';
import ReactDOM from 'react-dom/client';
import MaterialTrackerApp from './MaterialTrackerApp';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <MaterialTrackerApp embedded={globalThis.parent !== globalThis} />
  </React.StrictMode>,
);

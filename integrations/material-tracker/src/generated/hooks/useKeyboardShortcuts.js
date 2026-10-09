import { useEffect, useRef } from 'react';

export function useKeyboardShortcuts({ onEscape, onNewItem, onHelp, onCommandPalette }) {
  // Tier 3 Fix #15: Stabilize callbacks with refs to prevent re-registering listener on every identity change
  const cbRef = useRef({ onEscape, onNewItem, onHelp, onCommandPalette });
  cbRef.current = { onEscape, onNewItem, onHelp, onCommandPalette };

  useEffect(() => {
    const handler = (e) => {
      const tag = e.target?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;

      if (e.key === 'Escape' && cbRef.current.onEscape) cbRef.current.onEscape();
      if ((e.metaKey || e.ctrlKey) && e.key === 'n') { e.preventDefault(); cbRef.current.onNewItem?.(); }
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') { e.preventDefault(); cbRef.current.onCommandPalette?.(); }
      if (e.key === '?' && cbRef.current.onHelp) { e.preventDefault(); cbRef.current.onHelp(); }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []); // Empty deps — never re-registers
}

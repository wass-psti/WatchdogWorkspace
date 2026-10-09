import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@material/components/ui/dialog';
import { Kbd } from '@material/components/ui/kbd';

const shortcuts = [
  { keys: ['Esc'], description: 'Close detail panel' },
  { keys: ['⌘', 'K'], description: 'Open command palette' },
  { keys: ['⌘', 'N'], description: 'Add new material' },
  { keys: ['↑', '↓'], description: 'Navigate table rows' },
  { keys: ['Enter'], description: 'Open focused item' },
  { keys: ['Shift', 'Click'], description: 'Multi-level column sort' },
  { keys: ['Dbl-Click'], description: 'Inline edit cell' },
  { keys: ['?'], description: 'Show this help' },
];

export function KeyboardShortcutsDialog({ open, onOpenChange }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-[family-name:var(--font-heading)] text-lg">Keyboard Shortcuts</DialogTitle>
          <DialogDescription>Use these shortcuts to navigate faster.</DialogDescription>
        </DialogHeader>
        <div className="mt-4 space-y-3">
          {shortcuts.map((s) => (
            <div key={s.description} className="flex items-center justify-between py-2 border-b border-border/30 last:border-0">
              <span className="text-sm text-foreground">{s.description}</span>
              <div className="flex items-center gap-1">
                {s.keys.map((k) => (
                  <Kbd key={k} className="text-xs px-2 py-0.5 h-6 min-w-[24px] flex items-center justify-center">{k}</Kbd>
                ))}
              </div>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default KeyboardShortcutsDialog;

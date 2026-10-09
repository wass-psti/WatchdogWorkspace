import React from 'react';
import { Button } from '@material/components/ui/button';
import { Popover, PopoverTrigger, PopoverContent } from '@material/components/ui/popover';
import { Columns3 } from 'lucide-react';

const DEFAULT_HIDDEN = new Set(['php', 'exUsd', 'exEur', 'landed', 'totalLanded', 'totalVat', 'supplierPo', 'account']);

export function getDefaultVisibility(cols) {
  const vis = {};
  cols.forEach(c => {
    if (c.cmt) { vis[c.key] = true; return; }
    vis[c.key] = !DEFAULT_HIDDEN.has(c.key);
  });
  return vis;
}

export function ColumnToggle({ cols, visibility, onToggle, onBatchSet }) {
  const toggleable = cols.filter(c => !c.cmt);
  const visCount = toggleable.filter(c => visibility[c.key]).length;

  // P1 Fix: "Show All" uses batch update when available, falls back to individual toggles
  const handleShowAll = () => {
    if (onBatchSet) {
      const updated = { ...visibility };
      toggleable.forEach(c => { updated[c.key] = true; });
      onBatchSet(updated);
    } else {
      toggleable.forEach(c => { if (!visibility[c.key]) onToggle(c.key); });
    }
  };

  // P1 Fix: "Reset" uses batch update when available
  const handleReset = () => {
    if (onBatchSet) {
      const updated = { ...visibility };
      toggleable.forEach(c => { updated[c.key] = !DEFAULT_HIDDEN.has(c.key); });
      onBatchSet(updated);
    } else {
      toggleable.forEach(c => {
        const shouldBeVisible = !DEFAULT_HIDDEN.has(c.key);
        if (visibility[c.key] !== shouldBeVisible) onToggle(c.key);
      });
    }
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="h-9 rounded-lg text-xs font-semibold gap-1.5 px-3 shrink-0 no-pdf">
          <Columns3 className="size-3" />Columns
          <span className="text-muted-foreground font-normal">({visCount})</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-56 p-0">
        <div className="px-3 py-2 border-b border-border/40">
          <p className="text-xs font-semibold text-foreground">Show columns</p>
        </div>
        <div className="max-h-64 overflow-y-auto overscroll-contain">
          <div className="p-2 space-y-0.5">
            {toggleable.map(c => (
              <label key={c.key}
                className="flex items-center gap-2.5 px-2 py-1.5 rounded-md hover:bg-muted/50 cursor-pointer text-xs select-none">
                <input type="checkbox" checked={!!visibility[c.key]} onChange={() => onToggle(c.key)}
                  className="size-3.5 rounded accent-[hsl(var(--primary))] cursor-pointer" />
                <span className="text-foreground">{c.label}</span>
              </label>
            ))}
          </div>
        </div>
        <div className="px-3 py-2 border-t border-border/40 flex gap-2">
          <Button variant="ghost" size="sm" className="h-7 text-[11px] flex-1"
            onClick={handleShowAll}>Show All</Button>
          <Button variant="ghost" size="sm" className="h-7 text-[11px] flex-1"
            onClick={handleReset}>Reset</Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
export default ColumnToggle;

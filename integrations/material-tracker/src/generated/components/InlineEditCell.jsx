import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Input } from '@material/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@material/components/ui/select';

export function InlineEditCell({ value, onSave, type = 'text', options, children }) {
  const [editing, setEditing] = useState(false);
  const [editValue, setEditValue] = useState(value ?? '');
  const inputRef = useRef(null);
  const containerRef = useRef(null);

  // P1 Fix: Sync editValue when value prop changes while not editing
  // Prevents stale values when re-entering edit mode after external updates
  useEffect(() => {
    if (!editing) {
      setEditValue(value ?? '');
    }
  }, [value, editing]);

  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus();
      if (inputRef.current.select) inputRef.current.select();
    }
  }, [editing]);

  // P1 Fix: Close select mode on outside click via document listener
  useEffect(() => {
    if (!editing || type !== 'select') return;
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        // Check if the click is inside a select portal (popover content)
        const portal = e.target.closest('[data-radix-popper-content-wrapper]');
        if (!portal) {
          setEditing(false);
        }
      }
    };
    // Delay listener so the opening click doesn't immediately close
    const tid = setTimeout(() => {
      document.addEventListener('mousedown', handleClickOutside);
    }, 100);
    return () => {
      clearTimeout(tid);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [editing, type]);

  const handleSave = useCallback(() => {
    setEditing(false);
    // P2 Fix: Distinguish between clearing a number (→ null) and entering 0
    if (type === 'number') {
      const isEmpty = editValue === '' || editValue === null || editValue === undefined;
      const finalVal = isEmpty ? null : Number(editValue);
      const prevEmpty = value === null || value === undefined || value === '';
      // If both are empty, no change. Otherwise compare values.
      if (isEmpty && prevEmpty) return;
      if (!isEmpty && !prevEmpty && Number(editValue) === value) return;
      onSave?.(finalVal);
    } else {
      if (String(editValue) !== String(value ?? '')) onSave?.(editValue);
    }
  }, [editValue, value, type, onSave]);

  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Enter') handleSave();
    if (e.key === 'Escape') { setEditValue(value ?? ''); setEditing(false); }
    e.stopPropagation();
  }, [handleSave, value]);

  if (editing) {
    if (type === 'select' && options) {
      return (
        <div ref={containerRef} className="animate-in fade-in zoom-in-95 duration-150">
          <Select
            value={String(editValue)}
            onValueChange={(v) => { onSave?.(v); setEditing(false); }}
            onOpenChange={(open) => {
              // P1 Fix: When the select dropdown closes without selection, exit edit mode
              if (!open) {
                // Small delay to let onValueChange fire first if a selection was made
                setTimeout(() => setEditing(false), 50);
              }
            }}
            defaultOpen
          >
            <SelectTrigger className="h-7 text-xs w-[80px] border-primary/30 ring-1 ring-primary/10">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>{options.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}</SelectContent>
          </Select>
        </div>
      );
    }
    return (
      <div className="animate-in fade-in zoom-in-95 duration-150">
        <Input
          ref={inputRef}
          type={type === 'number' ? 'number' : 'text'}
          value={editValue}
          onChange={e => setEditValue(e.target.value)}
          onBlur={handleSave}
          onKeyDown={handleKeyDown}
          step={type === 'number' ? 'any' : undefined}
          className="h-7 text-xs w-[90px] px-1.5 border-primary/30 ring-1 ring-primary/10 shadow-sm"
          onClick={e => e.stopPropagation()}
        />
      </div>
    );
  }

  return (
    <span
      ref={containerRef}
      onDoubleClick={(e) => { e.stopPropagation(); setEditValue(value ?? ''); setEditing(true); }}
      className="cursor-text hover:bg-primary/[0.06] hover:ring-1 hover:ring-primary/20 rounded px-1 -mx-1 transition-all duration-150 inline-block"
      title="Double-click to edit"
    >
      {children}
    </span>
  );
}

export default InlineEditCell;

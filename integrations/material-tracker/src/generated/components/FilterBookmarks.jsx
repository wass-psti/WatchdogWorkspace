import React, { useState } from 'react';
import { Button } from '@material/components/ui/button';
import { Popover, PopoverTrigger, PopoverContent } from '@material/components/ui/popover';
import { Input } from '@material/components/ui/input';
import { Bookmark, Plus, Trash2, Check } from 'lucide-react';

export function FilterBookmarks({ savedViews, onSave, onApply, onDelete }) {
  const [naming, setNaming] = useState(false);
  const [viewName, setViewName] = useState('');

  const handleSave = () => {
    if (!viewName.trim()) return;
    onSave?.(viewName.trim());
    setViewName('');
    setNaming(false);
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="h-9 rounded-lg text-xs font-semibold gap-1.5 px-3 shrink-0 no-pdf" onClick={() => {}}>
          <Bookmark className="size-3" />Views
          {savedViews?.length > 0 && <span className="text-muted-foreground font-normal">({savedViews.length})</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-60 p-0">
        <div className="px-3 py-2 border-b border-border/40">
          <p className="text-xs font-semibold text-foreground">Saved Views</p>
        </div>
        <div className="max-h-48 overflow-y-auto">
          {!savedViews?.length && !naming && <p className="text-xs text-muted-foreground p-3 text-center">No saved views yet</p>}
          {savedViews?.map((v, i) => (
            <div key={v.name} className="flex items-center gap-2 px-3 py-2 hover:bg-muted/50 group">
              <button onClick={() => onApply?.(v.filters)} className="flex-1 text-left text-xs font-medium text-foreground truncate cursor-pointer">{v.name}</button>
              <Button variant="ghost" size="icon" className="size-5 rounded-full opacity-0 group-hover:opacity-100 shrink-0"
                onClick={() => onDelete?.(i)} aria-label="Delete view"><Trash2 className="size-3 text-muted-foreground" /></Button>
            </div>
          ))}
          {naming && (
            <div className="flex items-center gap-1.5 px-3 py-2">
              <Input value={viewName} onChange={e => setViewName(e.target.value)} placeholder="View name…"
                className="h-7 text-xs flex-1" ref={el => el?.focus()}
                onKeyDown={e => { if (e.key === 'Enter') handleSave(); if (e.key === 'Escape') setNaming(false); }} />
              <Button variant="ghost" size="icon" className="size-6 rounded-full shrink-0" onClick={handleSave} aria-label="Save"><Check className="size-3" /></Button>
            </div>
          )}
        </div>
        <div className="px-3 py-2 border-t border-border/40">
          <Button variant="ghost" size="sm" className="w-full h-7 text-[11px] gap-1.5" onClick={() => setNaming(true)}>
            <Plus className="size-3" />Save Current View
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}

export default FilterBookmarks;

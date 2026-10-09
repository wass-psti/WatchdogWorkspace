import React, { useMemo, useState } from 'react';
import { CommandDialog, CommandInput, CommandList, CommandEmpty, CommandGroup, CommandItem, CommandSeparator, CommandShortcut } from '@material/components/ui/command';
import { Package } from 'lucide-react';
import Fuse from 'fuse.js';

export function CommandPalette({ open, onOpenChange, items, onSelectItem, actions }) {
  // P2 Fix: Stabilize Fuse instance — only rebuild when item count changes or dialog opens,
  // not on every items array reference change (which happens on every fetch/update cycle)
  const itemsLenRef = React.useRef(0);
  const fuse = useMemo(() => {
    if (!items?.length) return null;
    itemsLenRef.current = items.length;
    return new Fuse(items, {
      keys: ['name', 'brand', 'vendorDetails', 'materialDescription'],
      threshold: 0.3,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items?.length, open]);

  const [query, setQuery] = useState('');

  const filteredItems = useMemo(() => {
    if (!items?.length) return [];
    if (!query) return items.slice(0, 8);
    if (!fuse) return [];
    return fuse.search(query).slice(0, 8).map(r => r.item);
  }, [fuse, query, items]);

  return (
    <CommandDialog open={open} onOpenChange={(v) => { onOpenChange(v); if (!v) setQuery(''); }}
      title="Command Palette" description="Search items and actions…">
      <CommandInput placeholder="Type a command or search…" value={query} onValueChange={setQuery} />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>
        <CommandGroup heading="Actions">
          {actions?.map(a => (
            <CommandItem key={a.id} onSelect={() => { a.action(); onOpenChange(false); setQuery(''); }} className="gap-2">
              {a.icon && <a.icon className="size-4" />}
              <span>{a.label}</span>
              {a.shortcut && <CommandShortcut>{a.shortcut}</CommandShortcut>}
            </CommandItem>
          ))}
        </CommandGroup>
        {filteredItems.length > 0 && (
          <>
            <CommandSeparator />
            <CommandGroup heading="Materials">
              {filteredItems.map(item => (
                <CommandItem key={item.id} onSelect={() => { onSelectItem(item); onOpenChange(false); setQuery(''); }} className="gap-2">
                  <Package className="size-4 text-muted-foreground" />
                  <span className="font-medium truncate">{item.name}</span>
                  {item.brand && <span className="text-muted-foreground text-xs ml-auto shrink-0">{item.brand}</span>}
                </CommandItem>
              ))}
            </CommandGroup>
          </>
        )}
      </CommandList>
    </CommandDialog>
  );
}

export default CommandPalette;

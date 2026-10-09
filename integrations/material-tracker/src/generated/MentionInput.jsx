import React, { useState, useRef, useEffect } from 'react';
import { Textarea } from '@material/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@material/components/ui/avatar';

const initials = (name) => name?.split(' ').map(n => n[0]).join('').slice(0, 2) || '?';

export function MentionInput({ value, onChange, onKeyDown, placeholder, className, users = [] }) {
  const [showDrop, setShowDrop] = useState(false);
  const [query, setQuery] = useState('');
  const [selIdx, setSelIdx] = useState(0);
  const [atPos, setAtPos] = useState(-1);
  const cursorRef = useRef(0);
  const textareaRef = useRef(null);
  // Queue a cursor position to set after next value update
  const pendingCursorRef = useRef(null);

  const filtered = query
    ? users.filter(u => u.name.toLowerCase().includes(query.toLowerCase())).slice(0, 5)
    : users.slice(0, 5);

  const handleChange = (e) => {
    const val = e.target.value;
    const cursor = e.target.selectionStart;
    cursorRef.current = cursor;
    onChange(val);
    const before = val.slice(0, cursor);
    const atMatch = before.match(/@([^\]@\n]*)$/);
    if (atMatch && !before.slice(atMatch.index).includes(']')) {
      setShowDrop(true);
      setQuery(atMatch[1]);
      setAtPos(atMatch.index);
      setSelIdx(0);
    } else {
      setShowDrop(false);
    }
  };

  // P6 Fix: Programmatically reposition cursor after mention insertion
  useEffect(() => {
    if (pendingCursorRef.current != null && textareaRef.current) {
      const pos = pendingCursorRef.current;
      pendingCursorRef.current = null;
      // Set cursor position on next frame after React updates the textarea value
      requestAnimationFrame(() => {
        if (textareaRef.current) {
          textareaRef.current.selectionStart = pos;
          textareaRef.current.selectionEnd = pos;
          textareaRef.current.focus();
        }
      });
    }
  }, [value]);

  const selectUser = (user) => {
    const before = value.slice(0, atPos);
    const after = value.slice(cursorRef.current);
    const mention = `@[${user.name}](${user.id})`;
    const newValue = before + mention + ' ' + after;
    // Queue cursor to position right after the mention + space
    pendingCursorRef.current = before.length + mention.length + 1;
    onChange(newValue);
    setShowDrop(false);
  };

  const handleKey = (e) => {
    if (showDrop && filtered.length > 0) {
      if (e.key === 'ArrowDown') { e.preventDefault(); setSelIdx(i => Math.min(i + 1, filtered.length - 1)); return; }
      if (e.key === 'ArrowUp') { e.preventDefault(); setSelIdx(i => Math.max(i - 1, 0)); return; }
      if (e.key === 'Tab') { e.preventDefault(); selectUser(filtered[selIdx]); return; }
      if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); selectUser(filtered[selIdx]); return; }
      if (e.key === 'Escape') { e.preventDefault(); setShowDrop(false); return; }
    }
    onKeyDown?.(e);
  };

  return (
    <div className="relative flex-1">
      <Textarea ref={textareaRef} value={value} onChange={handleChange} onKeyDown={handleKey}
        placeholder={placeholder} className={className} />
      {showDrop && filtered.length > 0 && (
        <div className="absolute bottom-full left-0 mb-1 w-60 max-h-40 overflow-y-auto rounded-lg border border-border bg-popover shadow-md z-50">
          {filtered.map((u, i) => (
            <div key={u.id} onMouseDown={(e) => { e.preventDefault(); selectUser(u); }}
              className={`flex items-center gap-2 px-3 py-1.5 text-xs cursor-pointer transition-colors ${i === selIdx ? 'bg-accent text-accent-foreground' : 'hover:bg-muted'}`}>
              <Avatar size="sm">
                {u.photo_thumb && <AvatarImage src={u.photo_thumb} />}
                <AvatarFallback className="text-[9px] bg-primary/10 text-primary">{initials(u.name)}</AvatarFallback>
              </Avatar>
              <span className="font-medium text-foreground truncate">{u.name}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
export default MentionInput;

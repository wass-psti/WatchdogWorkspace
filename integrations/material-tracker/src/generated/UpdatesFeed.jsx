import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Skeleton } from '@material/components/ui/skeleton';
import { Avatar, AvatarFallback } from '@material/components/ui/avatar';
import { MessageCircle } from 'lucide-react';
import BoardSDK from '@material/api/BoardSDK.js';

const board = new BoardSDK();
const fmtDate = (d) => new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });

export function UpdatesFeed({ itemId }) {
  const [updates, setUpdates] = useState([]);
  const [loading, setLoading] = useState(true);
  // P1 Fix: Generation ref to prevent stale fetch results when switching items rapidly
  const fetchGenRef = useRef(0);

  const fetchUpdates = useCallback(async () => {
    const gen = ++fetchGenRef.current;
    try {
      const result = await board.item(itemId).withUpdates().execute();
      if (gen !== fetchGenRef.current) return;
      setUpdates(result.updates || []);
    } catch (err) {
      if (gen !== fetchGenRef.current) return;
      console.error('Fetch updates failed:', err);
    }
    finally {
      if (gen === fetchGenRef.current) setLoading(false);
    }
  }, [itemId]);

  useEffect(() => {
    setLoading(true);
    setUpdates([]); // Clear previous item's updates immediately
    fetchUpdates();
  }, [fetchUpdates]);

  if (loading) return (
    <div className="p-6 space-y-4">{Array.from({ length: 4 }).map((_, i) => (
      <div key={i} className="flex gap-3"><Skeleton className="size-7 rounded-full shrink-0" />
        <div className="flex-1 space-y-2"><Skeleton className="h-3 w-24" /><Skeleton className="h-4 w-full" /></div></div>
    ))}</div>
  );

  if (!updates.length) return (
    <div className="flex flex-col items-center py-14 px-6">
      <MessageCircle className="size-10 text-muted-foreground/30 mb-3" />
      <p className="text-sm font-medium text-foreground">No activity yet</p>
      <p className="text-xs text-muted-foreground mt-1">Updates and changes will appear here</p>
    </div>
  );

  return (
    <div className="p-5 space-y-4">
      {updates.map(u => (
        <div key={u.id} className="flex gap-3">
          <Avatar className="size-7 shrink-0 border border-border/40">
            <AvatarFallback className="text-[10px] font-bold bg-primary/10 text-primary">
              {u.creator?.name?.split(' ').map(n => n[0]).join('') || '?'}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <div className="flex items-baseline gap-2">
              <span className="text-xs font-semibold text-foreground">{u.creator?.name || 'Unknown'}</span>
              <span className="text-[10px] text-muted-foreground">{fmtDate(u.created_at)}</span>
            </div>
            <p className="text-sm text-muted-foreground mt-0.5 whitespace-pre-wrap break-words leading-relaxed">{u.text_body}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
export default UpdatesFeed;

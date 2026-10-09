import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Button } from '@material/components/ui/button';
import { Input } from '@material/components/ui/input';
import { Badge } from '@material/components/ui/badge';
import { Skeleton } from '@material/components/ui/skeleton';
import { Plus, Loader2, CheckCircle2, Circle, Clock } from 'lucide-react';
import BoardSDK from '@material/api/BoardSDK.js';
import { toast } from 'sonner';

const board = new BoardSDK();
const STATUS_MAP = {
  'Done': { icon: CheckCircle2, cls: 'text-[hsl(var(--chart-2))] bg-[hsl(var(--chart-2)/.08)]' },
  'Working on it': { icon: Clock, cls: 'text-[hsl(var(--chart-4))] bg-[hsl(var(--chart-4)/.08)]' },
  'Stuck': { icon: Circle, cls: 'text-destructive bg-destructive/10' },
};
const STATUSES = ['Working on it', 'Done', 'Stuck'];

export function SubitemsPanel({ itemId, canWrite = false }) {
  const [subitems, setSubitems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newName, setNewName] = useState('');
  const [creating, setCreating] = useState(false);
  // P1 Fix: Generation ref to prevent stale fetch results when switching items rapidly
  const fetchGenRef = useRef(0);

  const fetchSubitems = useCallback(async () => {
    const gen = ++fetchGenRef.current;
    try {
      const result = await board.item(itemId).withSubItems(["status", "date"]).execute();
      // Only apply results if this is still the current fetch generation
      if (gen !== fetchGenRef.current) return;
      setSubitems(result.subitems || []);
    } catch (err) {
      if (gen !== fetchGenRef.current) return;
      console.error('Fetch subitems failed:', err);
      toast.error('Failed to load tasks');
    }
    finally {
      if (gen === fetchGenRef.current) setLoading(false);
    }
  }, [itemId]);

  useEffect(() => {
    setLoading(true);
    setSubitems([]); // Clear previous item's subitems immediately
    fetchSubitems();
  }, [fetchSubitems]);

  const handleCreate = async () => {
    if (!canWrite || !newName.trim() || creating) return;
    setCreating(true);
    try {
      const sub = await board.item(itemId).subitem().create({ name: newName.trim() })
        .returnColumns(["status", "date"]).execute();
      setSubitems(prev => [...prev, sub]);
      setNewName('');
      toast.success('Task added');
    } catch (err) {
      console.error('Create subitem failed:', err);
      toast.error('Failed to create task');
    }
    finally { setCreating(false); }
  };

  const cycleStatus = async (sub) => {
    if (!canWrite) return;
    const idx = STATUSES.indexOf(sub.status || '');
    const next = STATUSES[(idx + 1) % STATUSES.length];
    const prev = sub.status;
    setSubitems(prevSubs => prevSubs.map(s => s.id === sub.id ? { ...s, status: next } : s));
    try {
      await board.item(itemId).subitem(sub.id).update({ status: next }).execute();
    } catch (err) {
      console.error('Update status failed:', err);
      toast.error('Status update failed');
      setSubitems(prevSubs => prevSubs.map(s => s.id === sub.id ? { ...s, status: prev } : s));
    }
  };

  if (loading) return <div className="p-6 space-y-3">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-10 rounded-lg" />)}</div>;
  return (
    <div className="p-5 space-y-4">
      {canWrite && (
        <div className="flex items-center gap-2">
          <Input value={newName} onChange={e => setNewName(e.target.value)} placeholder="Add a task..."
            className="flex-1 h-9 rounded-lg bg-background text-sm" onKeyDown={e => e.key === 'Enter' && handleCreate()} />
          <Button size="sm" onClick={handleCreate} disabled={creating || !newName.trim()} className="rounded-lg h-9 px-3 shrink-0">
            {creating ? <Loader2 className="size-3.5 animate-spin" /> : <Plus className="size-3.5" />}
          </Button>
        </div>
      )}
      {!subitems.length && <p className="text-sm text-muted-foreground text-center py-8">No tasks yet. Add one above.</p>}
      <div className="space-y-1.5">
        {subitems.map(sub => {
          const st = STATUS_MAP[sub.status] || { icon: Circle, cls: 'text-muted-foreground bg-muted/30' };
          const Icon = st.icon;
          return (
            <div key={sub.id} className="flex items-center gap-3 px-3 py-2.5 rounded-lg border border-border/30 hover:border-border/60 transition-colors">
              <button onClick={() => cycleStatus(sub)} disabled={!canWrite} className={`shrink-0 ${canWrite ? 'cursor-pointer' : 'cursor-default'}`} aria-label={canWrite ? 'Change status' : 'Task status'}>
                <Icon className={`size-4 ${st.cls.split(' ')[0]}`} />
              </button>
              <span className={`text-sm flex-1 ${sub.status === 'Done' ? 'line-through text-muted-foreground' : 'text-foreground'}`}>{sub.name}</span>
              <Badge variant="outline" className={`text-[10px] px-2 py-0 h-5 rounded-full font-semibold border-0 ${st.cls}`}>
                {sub.status || 'New'}</Badge>
            </div>
          );
        })}
      </div>
    </div>
  );
}
export default SubitemsPanel;

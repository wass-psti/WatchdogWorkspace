import React, { useState, useMemo, useRef } from 'react';
import { Sheet, SheetContent, SheetTitle, SheetDescription } from '@material/components/ui/sheet';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@material/components/ui/tabs';
import { Badge } from '@material/components/ui/badge';
import { ClipboardList, History, FileText } from 'lucide-react';
import BoardSDK from '@material/api/BoardSDK.js';
import { retryOn429 } from '@material/generated/helpers/rateLimitedQueue';
import { createItemAtTop } from '@material/generated/helpers/createItemAtTop';
import ItemEditForm from '@material/generated/ItemEditForm';
import DetailView from '@material/generated/DetailView';
import SubitemsPanel from '@material/generated/SubitemsPanel';
import UpdatesFeed from '@material/generated/UpdatesFeed';
import { toast } from 'sonner';

const board = new BoardSDK();

export function ItemDetail({ item, open, onClose, onUpdated, onDeleted, onDuplicated, items, canWrite = false }) {
  const [editing, setEditing] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [duplicating, setDuplicating] = useState(false);
  const [tab, setTab] = useState('details');
  // Item 22: Scroll tracking for glassmorphism header
  const [scrolled, setScrolled] = useState(false);

  const visitedTasksRef = useRef(new Set());
  if (tab === 'tasks' && item) visitedTasksRef.current.add(item.id);
  const hasVisitedTasks = item ? visitedTasksRef.current.has(item.id) : false;

  const liveItem = useMemo(() => {
    if (!item || !items?.length) return item;
    return items.find(i => i.id === item.id) || item;
  }, [item, items]);

  const handleDelete = async () => {
    if (!canWrite) return;
    setDeleting(true);
    try { await board.item(liveItem.id).archive().execute(); onDeleted?.(liveItem.id); }
    catch (err) { console.error('Failed to delete item:', err); toast.error('Delete failed'); }
    finally { setDeleting(false); }
  };
  const handleMove = async (groupId) => {
    if (!canWrite) return;
    const label = groupId === 'new_group' ? 'Engineering Services' : 'Items for Quotation';
    onUpdated?.({ ...liveItem, group: { id: groupId, title: label } });
    toast.success(`Moved to ${label}`);
    try { await retryOn429(() => board.item(liveItem.id).update().inGroup(groupId).execute(), 3, 1000); }
    catch (err) { console.error('Move failed:', err); onUpdated?.(liveItem); toast.error('Move failed — reverted'); }
  };
  const handleDuplicate = async () => {
    if (!canWrite) return;
    setDuplicating(true);
    try {
      const fields = {};
      ['sourceType','materialDescription','brand','quantity','buyingPrice','currency','shippingCost','shippingCostCurrency','leadtimeInWeeks','exRateUsd','exRateEur','vendorDetails','rfqRefNo'].forEach(k => { if (liveItem[k]) fields[k] = liveItem[k]; });
      if (liveItem.dateRequired) fields.dateRequired = new Date(liveItem.dateRequired);
      const newItem = await createItemAtTop({ name: `${liveItem.name} (copy)`, group: liveItem.group?.id, ...fields });
      onDuplicated?.(newItem);
    } catch (err) { console.error('Duplicate failed:', err); toast.error('Duplicate failed'); }
    finally { setDuplicating(false); }
  };

  const prevItemIdRef = useRef(null);
  // P1 Fix: Reset tab to "details" when switching between different items
  // Without this, if user is on "activity" tab for item A and clicks item B,
  // they'd immediately fire an activity fetch for item B instead of seeing details
  if (item && item.id !== prevItemIdRef.current) {
    prevItemIdRef.current = item.id;
    if (tab !== 'details') setTab('details');
    if (editing) setEditing(false);
    if (scrolled) setScrolled(false);
  }

  if (!liveItem) return null;
  return (
    <Sheet open={open} onOpenChange={(v) => { if (!v) { onClose(); setEditing(false); setTab('details'); setScrolled(false); } }}>
      <SheetContent className="sm:max-w-lg overflow-hidden p-0 gap-0">
        {/* Item 22: Scrollable container for glassmorphism effect */}
        <div className="overflow-y-auto h-full" onScroll={(e) => setScrolled(e.currentTarget.scrollTop > 10)}>
          {/* Item 22: Glassmorphism sticky header */}
          <div className={`sticky top-0 z-10 transition-all duration-300 ${scrolled ? 'backdrop-blur-md bg-card/80 shadow-sm' : ''}`}>
            <div className="h-[2px] bg-gradient-to-r from-primary via-[hsl(var(--chart-5))] to-transparent shrink-0" />
            <div className={`px-6 pt-5 pb-4 border-b transition-colors duration-300 ${scrolled ? 'border-border/60' : 'border-border/40 bg-gradient-to-br from-primary/[0.05] via-[hsl(var(--chart-5)/.02)] to-transparent'}`}>
              <SheetTitle className="text-xl font-bold font-[family-name:var(--font-heading)]">{liveItem.name}</SheetTitle>
              <SheetDescription className="mt-1.5">
                <Badge className="text-[11px] px-2.5 py-0 h-[20px] rounded-full font-semibold bg-primary/10 text-primary border-0">{liveItem.group?.title || 'Item'}</Badge>
              </SheetDescription>
            </div>
          </div>
          <Tabs value={tab} onValueChange={setTab} className="flex-1 flex flex-col">
            <TabsList className="w-full justify-start rounded-none border-b border-border/40 bg-muted/20 px-4 h-10 shrink-0">
              <TabsTrigger value="details" className="text-xs gap-1.5 data-[state=active]:shadow-none"><FileText className="size-3" />Details</TabsTrigger>
              <TabsTrigger value="tasks" className="text-xs gap-1.5 data-[state=active]:shadow-none"><ClipboardList className="size-3" />Tasks</TabsTrigger>
              <TabsTrigger value="activity" className="text-xs gap-1.5 data-[state=active]:shadow-none"><History className="size-3" />Activity</TabsTrigger>
            </TabsList>
            <TabsContent value="details" className="mt-0 flex-1">
              {editing && canWrite ? <ItemEditForm item={liveItem} onUpdated={onUpdated} onDone={() => setEditing(false)} />
               : <DetailView item={liveItem} canWrite={canWrite} onEdit={() => { if (canWrite) setEditing(true); }} onDelete={handleDelete} deleting={deleting}
                   onMove={handleMove} onDuplicate={handleDuplicate} duplicating={duplicating} />}
            </TabsContent>
            <TabsContent value="tasks" className="mt-0 flex-1" forceMount={hasVisitedTasks || undefined}>
              <div className={tab !== 'tasks' ? 'hidden' : ''}>
                {hasVisitedTasks && <SubitemsPanel itemId={liveItem.id} canWrite={canWrite} />}
              </div>
            </TabsContent>
            <TabsContent value="activity" className="mt-0 flex-1">{tab === 'activity' && <UpdatesFeed itemId={liveItem.id} />}</TabsContent>
          </Tabs>
        </div>
      </SheetContent>
    </Sheet>
  );
}
export default ItemDetail;

import React, { useState, useCallback, useMemo, useRef, useEffect, Suspense } from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@material/components/ui/tabs';
import { Toaster } from '@material/components/ui/sonner';
import { useItems, useAggregates } from '@material/generated/hooks/useItems';
import { useForexRates } from '@material/generated/hooks/useForexRates';
import { useRateSync } from '@material/generated/hooks/useRateSync';
import { useKeyboardShortcuts } from '@material/generated/hooks/useKeyboardShortcuts';
import { useStarredItems } from '@material/generated/hooks/useStarredItems';
import { usePresence } from '@material/generated/hooks/usePresence';
import { useSavedViews } from '@material/generated/hooks/useSavedViews';
import KPISection from '@material/generated/KPISection';
import ItemsTable from '@material/generated/ItemsTable';
import AddItemForm from '@material/generated/AddItemForm';
import AppHeader from '@material/generated/AppHeader';
import ConfirmDeleteDialog from '@material/generated/ConfirmDeleteDialog';
import ForexBanner from '@material/generated/ForexBanner';
import KeyboardShortcutsDialog from '@material/generated/components/KeyboardShortcutsDialog';
import CommandPalette from '@material/generated/components/CommandPalette';
import BulkPasteImport from '@material/generated/components/BulkPasteImport';
import BoardSDK from '@material/api/BoardSDK.js';
import { rateLimitedQueue } from '@material/generated/helpers/rateLimitedQueue';
import { createItemAtTop } from '@material/generated/helpers/createItemAtTop';
import { toast } from 'sonner';
import { Plus, RefreshCw, Moon, ClipboardPaste } from 'lucide-react';
import { initTheme, toggleTheme } from '@material/generated/utils/themeManager';

// Tier 3 Fix #18: Lazy-load heavy ItemDetail component
const ItemDetail = React.lazy(() => import('@material/generated/ItemDetail'));

// Tier 3 Fix #14: Lightweight error boundary for non-critical sections
class SectionErrorBoundary extends React.Component {
  constructor(props) { super(props); this.state = { hasError: false }; }
  static getDerivedStateFromError() { return { hasError: true }; }
  componentDidCatch(error, info) { console.error(`${this.props.name || 'Section'} error:`, error, info); }
  render() {
    if (this.state.hasError) return (
      <div className="rounded-xl border border-border/40 bg-muted/20 px-4 py-3 text-xs text-muted-foreground">
        <span className="font-medium">{this.props.name || 'Section'}</span> failed to render.{' '}
        <button onClick={() => this.setState({ hasError: false })} className="underline cursor-pointer text-primary">Retry</button>
      </div>
    );
    return this.props.children;
  }
}

const board = new BoardSDK();

function App({ runtime }) {
  const [sourceFilter, setSourceFilter] = useState('all');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [debouncedVendor, setDebouncedVendor] = useState('');
  const [selectedItem, setSelectedItem] = useState(null);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [activeTab, setActiveTab] = useState('items');
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [showCommandPalette, setShowCommandPalette] = useState(false);
  const [overdueOnly, setOverdueOnly] = useState(false);
  const [headerCompressed, setHeaderCompressed] = useState(false);
  const [hasUnseenChanges, setHasUnseenChanges] = useState(false);
  const lastSeenCountRef = useRef(null);
  const recentRef = useRef(new Set()); const [, bumpRecent] = useState(0);
  const deleteTimersRef = useRef(new Map());
  
  // Initialize theme from localStorage on mount
  useEffect(() => { initTheme(); }, []);

  const { data: aggData, loading: aggLoading, isRefreshing: aggRefreshing, manualRefresh: aggRefresh, sourceOptions } = useAggregates();
  const { rates: forexRates, loading: forexLoading, manualRefresh: forexRefresh } = useForexRates();
  const { items, setItems, loading, loadingMore, loadMore, hasMore, isRefreshing, lastRefreshed, manualRefresh, invalidateCache, searchTruncated } = useItems({
    sourceFilter: sourceFilter === 'all' ? null : sourceFilter, searchTerm: debouncedSearch || null, vendorTerm: debouncedVendor || null,
  });
  const { starred, toggle: toggleStar, isStarred } = useStarredItems();
  const { otherUsers } = usePresence();
  const { views: savedViews, save: saveView, remove: removeView } = useSavedViews();
  const getShipCurrency = useCallback((item) => item.shippingCostCurrency || 'PHP', []);

  // Item 28: Header compression on scroll
  useEffect(() => {
    const handler = () => setHeaderCompressed(window.scrollY > 120);
    window.addEventListener('scroll', handler, { passive: true });
    return () => window.removeEventListener('scroll', handler);
  }, []);

  // Item 25: Notification badge — detect changes while on other tabs
  useEffect(() => {
    if (!items.length) return;
    if (lastSeenCountRef.current === null) { lastSeenCountRef.current = items.length; return; }
    if (items.length !== lastSeenCountRef.current && activeTab !== 'items') setHasUnseenChanges(true);
  }, [items.length, activeTab]);
  useEffect(() => {
    if (activeTab === 'items' && items.length) { setHasUnseenChanges(false); lastSeenCountRef.current = items.length; }
  }, [activeTab, items.length]);

  // D3: Rate fallback — only runs once when items first arrive and forex is missing
  const rateFallbackRef = useRef({ usd: null, eur: null });
  const fallbackDone = useRef(false);
  // Tier 2: Track items arrival with a ref to avoid re-running on every items array change
  const itemsRef = useRef(items);
  itemsRef.current = items;
  const [fallbackReady, setFallbackReady] = useState(false);
  useEffect(() => {
    if (fallbackDone.current || !items.length || (forexRates?.usd && forexRates?.eur)) return;
    const u = itemsRef.current.find(i => i.exRateUsd), e = itemsRef.current.find(i => i.exRateEur);
    const usd = u?.exRateUsd ? parseFloat(u.exRateUsd) : null, eur = e?.exRateEur ? parseFloat(e.exRateEur) : null;
    if (usd || eur) { rateFallbackRef.current = { usd, eur }; fallbackDone.current = true; setFallbackReady(true); }
  }, [items.length, forexRates?.usd, forexRates?.eur]);
  // Tier 2: effectiveRates no longer depends on `items` — uses fallbackReady signal instead
  const effectiveRates = useMemo(() => ({ usd: forexRates?.usd ?? rateFallbackRef.current.usd, eur: forexRates?.eur ?? rateFallbackRef.current.eur }), [forexRates?.usd, forexRates?.eur, fallbackReady]);
  const { syncItems } = useRateSync(items, setItems, effectiveRates, { enabled: !!runtime?.canWrite });
  const handleLoadMore = useCallback(() => { loadMore((n) => syncItems(n)); }, [loadMore, syncItems]);
  const handleSearch = useCallback((val) => setDebouncedSearch(val), []);
  const handleVendorSearch = useCallback((val) => setDebouncedVendor(val), []);
  const handleRefresh = useCallback(() => Promise.all([manualRefresh(), aggRefresh(), forexRefresh()]).catch(err => { console.error('Refresh failed:', err); }), [manualRefresh, aggRefresh, forexRefresh]);
  // Tier 1: Stabilize handleRefresh identity for commandActions memoization
  const handleRefreshRef = useRef(handleRefresh);
  handleRefreshRef.current = handleRefresh;
  const stableRefresh = useCallback(() => handleRefreshRef.current(), []);

  // Ship currency change
  const handleShipCurrencyChange = useCallback((itemId, currency) => {
    let prev = null;
    setItems(p => p.map(i => { if (i.id === itemId) { prev = i.shippingCostCurrency || 'PHP'; return { ...i, shippingCostCurrency: currency }; } return i; }));
    board.item(itemId).update({ shippingCostCurrency: currency }).execute().catch(err => {
      console.error('Ship currency update failed:', err); toast.error('Failed — reverted');
      setItems(p => p.map(i => i.id === itemId ? { ...i, shippingCostCurrency: prev } : i));
    });
  }, [setItems]);

  // Item 6: Source type toggle
  const handleSourceTypeChange = useCallback((itemId, sourceType) => {
    let prev = null;
    setItems(p => p.map(i => { if (i.id === itemId) { prev = i.sourceType; return { ...i, sourceType }; } return i; }));
    board.item(itemId).update({ sourceType }).execute().catch(err => {
      console.error('Source type update failed:', err); toast.error('Failed — reverted');
      setItems(p => p.map(i => i.id === itemId ? { ...i, sourceType: prev } : i));
    });
  }, [setItems]);

  // Item 16: Inline cell editing
  const handleInlineEdit = useCallback((itemId, field, value) => {
    let prev = null;
    setItems(p => p.map(i => { if (i.id === itemId) { prev = i[field]; return { ...i, [field]: value }; } return i; }));
    board.item(itemId).update({ [field]: value }).execute().catch(err => {
      console.error('Inline edit failed:', err); toast.error('Edit failed — reverted');
      setItems(p => p.map(i => i.id === itemId ? { ...i, [field]: prev } : i));
    });
  }, [setItems]);

  // Tier 1 Fix #2: Use itemsRef to avoid stale closure in handleQuickDuplicate
  const handleQuickDuplicate = useCallback(async (itemId) => {
    const item = itemsRef.current.find(i => i.id === itemId); if (!item) return;
    try {
      const fields = {};
      ['sourceType','materialDescription','brand','quantity','buyingPrice','currency','shippingCost','shippingCostCurrency','leadtimeInWeeks','exRateUsd','exRateEur','vendorDetails','rfqRefNo'].forEach(k => { if (item[k]) fields[k] = item[k]; });
      if (item.dateRequired) fields.dateRequired = new Date(item.dateRequired);
      const newItem = await createItemAtTop({ name: `${item.name} (copy)`, group: item.group?.id, ...fields });
      setItems(p => [newItem, ...p]); flashRecent(newItem.id); toast.success('Item duplicated');
    } catch (err) { console.error('Duplicate failed:', err); toast.error('Duplicate failed'); }
  }, [setItems]);

  // Item 4: Quick delete with undo — Tier 1 Fix #1: uses setItems(prev => ...) + ref snapshot to avoid stale closure
  const handleQuickDelete = useCallback((itemId) => {
    // Snapshot from ref at call time for undo restoration
    const snapshotItems = itemsRef.current;
    const deletedItem = snapshotItems.find(i => i.id === itemId); if (!deletedItem) return;
    const deletedIndex = snapshotItems.indexOf(deletedItem);
    setItems(p => p.filter(i => i.id !== itemId));
    // P1 Fix: Clear this item from selectedIds so bulk action bar doesn't show phantom count
    setSelectedIds(p => { if (!p.has(itemId)) return p; const n = new Set(p); n.delete(itemId); return n; });
    // Clear any previous pending delete for this item (e.g. rapid clicks)
    if (deleteTimersRef.current.has(itemId)) clearTimeout(deleteTimersRef.current.get(itemId));
    toast('Item archived', { action: { label: 'Undo', onClick: () => {
      clearTimeout(deleteTimersRef.current.get(itemId));
      deleteTimersRef.current.delete(itemId);
      setItems(p => { const c = [...p]; c.splice(Math.min(deletedIndex, c.length), 0, deletedItem); return c; }); toast.success('Item restored');
    } }, duration: 5000 });
    const tid = setTimeout(() => {
      deleteTimersRef.current.delete(itemId);
      board.item(itemId).archive().execute().catch(err => { console.error('Delete failed:', err); setItems(p => [deletedItem, ...p]); toast.error('Delete failed — restored'); });
    }, 5200);
    deleteTimersRef.current.set(itemId, tid);
  }, [setItems]);

  // Item 27: Saved views
  const handleSaveView = useCallback((name) => { saveView(name, { sourceFilter, overdueOnly }); }, [saveView, sourceFilter, overdueOnly]);
  const handleApplyView = useCallback((filters) => {
    if (filters.sourceFilter != null) setSourceFilter(filters.sourceFilter);
    if (filters.overdueOnly != null) setOverdueOnly(filters.overdueOnly);
  }, []);

  // Item 14: Command palette actions — uses stableRefresh to avoid identity churn
  const commandActions = useMemo(() => [
    ...(runtime?.canWrite ? [
      { id: 'add', label: 'Add Material', icon: Plus, action: () => setActiveTab('add'), shortcut: '⌘N' },
      { id: 'bulk', label: 'Bulk Import', icon: ClipboardPaste, action: () => setActiveTab('bulk') },
    ] : []),
    { id: 'refresh', label: 'Refresh Data', icon: RefreshCw, action: stableRefresh, shortcut: '' },
    ...(runtime?.embedded ? [] : [{ id: 'dark', label: 'Toggle Dark Mode', icon: Moon, action: toggleTheme }]),
  ], [stableRefresh, runtime?.embedded]);

  useKeyboardShortcuts({
    onEscape: () => { if (selectedItem) setSelectedItem(null); },
    onNewItem: () => { if (runtime?.canWrite) setActiveTab('add'); },
    onHelp: () => setShowShortcuts(true),
    onCommandPalette: () => setShowCommandPalette(true),
  });

  const flashTimers = useRef(new Map());
  const flashRecent = useCallback((id) => {
    recentRef.current.add(id); bumpRecent(c => c + 1);
    if (flashTimers.current.has(id)) clearTimeout(flashTimers.current.get(id));
    const tid = setTimeout(() => { recentRef.current.delete(id); flashTimers.current.delete(id); bumpRecent(c => c + 1); }, 2500);
    flashTimers.current.set(id, tid);
  }, []);
  useEffect(() => { return () => {
    flashTimers.current.forEach(tid => clearTimeout(tid));
    deleteTimersRef.current.forEach(tid => clearTimeout(tid));
  }; }, []);

  // P3 Fix: Memoize detail panel handlers to enable downstream memoization
  const handleItemUpdated = useCallback((u) => { setItems(p => p.map(i => i.id === u.id ? { ...i, ...u } : i)); setSelectedItem(u); invalidateCache?.(); }, [setItems, invalidateCache]);
  // Supports both single item and array of items (for bulk import batching)
  const handleItemCreated = useCallback((nOrArray) => {
    if (Array.isArray(nOrArray)) {
      // Bulk path: batch all items into a single state update, single cache invalidation, no individual toasts
      setItems(p => [...nOrArray, ...p]);
      nOrArray.forEach(n => flashRecent(n.id));
      invalidateCache?.();
      return;
    }
    const n = nOrArray;
    setItems(p => [n, ...p]); flashRecent(n.id); toast.success('Material added'); invalidateCache?.();
  }, [setItems, flashRecent, invalidateCache]);
  const handleItemDeleted = useCallback((id) => { setItems(p => p.filter(i => i.id !== id)); setSelectedItem(null); toast.success('Item deleted'); invalidateCache?.(); }, [setItems, invalidateCache]);
  const handleDuplicated = useCallback((n) => { setItems(p => [n, ...p]); setSelectedItem(n); flashRecent(n.id); toast.success('Item duplicated'); invalidateCache?.(); }, [setItems, flashRecent, invalidateCache]);

  // Bulk actions — Tier 1 Fix #3: store timeout in ref for cleanup
  const executeBulkDelete = useCallback(async (ids) => {
    // P2 Fix: Snapshot with original indices so undo can restore items at correct positions
    const currentItems = itemsRef.current;
    const snapshotWithIndex = [];
    currentItems.forEach((item, index) => {
      if (ids.has(item.id)) snapshotWithIndex.push({ item, index });
    });
    setItems(p => p.filter(i => !ids.has(i.id))); setSelectedIds(new Set());
    toast(`${ids.size} item${ids.size > 1 ? 's' : ''} archived`, { action: { label: 'Undo', onClick: () => {
      // Cancel the pending bulk archive timeout
      if (deleteTimersRef.current.has('__bulk__')) { clearTimeout(deleteTimersRef.current.get('__bulk__')); deleteTimersRef.current.delete('__bulk__'); }
      // Restore items at their original positions (or nearest valid index)
      setItems(p => {
        const result = [...p];
        for (const { item, index } of snapshotWithIndex) {
          result.splice(Math.min(index, result.length), 0, item);
        }
        return result;
      });
      toast.success(`${snapshotWithIndex.length} restored`);
    } }, duration: 5000 });
    const tid = setTimeout(() => {
      deleteTimersRef.current.delete('__bulk__');
      rateLimitedQueue([...ids].map(id => () => board.item(id).archive().execute()), { delay: 600 }).catch(() => toast.error('Some deletions failed'));
    }, 5200);
    deleteTimersRef.current.set('__bulk__', tid);
  }, [setItems]);

  const handleBulkDelete = useCallback((ids) => setDeleteConfirm({ ids, count: ids.size }), []);
  const handleBulkMove = useCallback(async (ids, groupId) => {
    const label = groupId === 'new_group' ? 'Engineering Services' : 'Items for Quotation';
    setItems(p => p.map(i => ids.has(i.id) ? { ...i, group: { id: groupId, title: label } } : i)); setSelectedIds(new Set());
    const tid = toast.loading(`Moving 0/${ids.size}…`);
    rateLimitedQueue([...ids].map(id => () => board.item(id).update().inGroup(groupId).execute()), { delay: 600, onProgress: (d, t) => toast.loading(`Moving ${d}/${t}…`, { id: tid }) })
      .then(() => toast.success(`Moved ${ids.size} to ${label}`, { id: tid })).catch(() => toast.error('Some moves failed', { id: tid }));
  }, [setItems]);
  // Item 11: Single item drag-move between groups
  const handleItemDragMove = useCallback((itemId, targetGroupId) => {
    handleBulkMove(new Set([itemId]), targetGroupId);
  }, [handleBulkMove]);

  const handleBulkSourceType = useCallback(async (ids, sourceType) => {
    setItems(p => p.map(i => ids.has(i.id) ? { ...i, sourceType } : i)); setSelectedIds(new Set());
    const tid = toast.loading(`Updating 0/${ids.size}…`);
    rateLimitedQueue([...ids].map(id => () => board.item(id).update({ sourceType }).execute()), { delay: 600, onProgress: (d, t) => toast.loading(`Updating ${d}/${t}…`, { id: tid }) })
      .then(() => toast.success(`${ids.size} set to ${sourceType}`, { id: tid })).catch(() => toast.error('Some updates failed', { id: tid }));
  }, [setItems]);

  return (
    <main className="min-h-screen bg-background">
      <Toaster position="bottom-right" />
      <ConfirmDeleteDialog open={!!deleteConfirm} onOpenChange={(v) => { if (!v) setDeleteConfirm(null); }} count={deleteConfirm?.count || 0} onConfirm={() => { executeBulkDelete(deleteConfirm.ids); setDeleteConfirm(null); }} />
      <KeyboardShortcutsDialog open={showShortcuts} onOpenChange={setShowShortcuts} />
      <CommandPalette open={showCommandPalette} onOpenChange={setShowCommandPalette} items={items} onSelectItem={setSelectedItem} actions={commandActions} />
      <AppHeader embedded={runtime?.embedded} isRefreshing={isRefreshing || aggRefreshing} lastRefreshed={lastRefreshed} onRefresh={handleRefresh} pageLoading={loading || aggLoading} compressed={headerCompressed} otherUsers={otherUsers} />
      <div className="px-4 sm:px-6 md:px-10 py-4 sm:py-6 max-w-[1440px] mx-auto space-y-4 sm:space-y-6">
        <SectionErrorBoundary name="Key Metrics">
          <KPISection data={aggData} loading={aggLoading} isRefreshing={aggRefreshing} forexRates={effectiveRates} sourceFilter={sourceFilter} onFilterChange={setSourceFilter} />
        </SectionErrorBoundary>
        <SectionErrorBoundary name="Forex Rates">
          <ForexBanner rates={effectiveRates} loading={forexLoading && !effectiveRates?.usd && !effectiveRates?.eur} />
        </SectionErrorBoundary>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-5">
          <TabsList className="w-fit">
            <TabsTrigger value="items" className="relative">All Items{hasUnseenChanges && <span className="absolute -top-0.5 -right-0.5 size-2 rounded-full bg-destructive animate-ping" />}</TabsTrigger>
            {runtime?.canWrite && <TabsTrigger value="add">Add Material</TabsTrigger>}
            {runtime?.canWrite && <TabsTrigger value="bulk">Bulk Import</TabsTrigger>}
          </TabsList>
          <TabsContent value="items" className="mt-0">
            <ItemsTable items={items} loading={loading} loadingMore={loadingMore} hasMore={hasMore} onLoadMore={handleLoadMore} onSelect={setSelectedItem} effectiveRates={effectiveRates}
              onSearch={handleSearch} sourceFilter={sourceFilter} onFilterChange={setSourceFilter} selectedIds={selectedIds} setSelectedIds={setSelectedIds}
              onBulkDelete={handleBulkDelete} onBulkMove={handleBulkMove} onBulkSourceType={handleBulkSourceType}
              starred={starred} onToggleStar={toggleStar} isStarred={isStarred} recentIds={recentRef.current}
              getShipCurrency={getShipCurrency} onShipCurrencyChange={handleShipCurrencyChange} onVendorSearch={handleVendorSearch} isRefetching={isRefreshing}
              onSourceTypeChange={handleSourceTypeChange} onDuplicate={handleQuickDuplicate} onDelete={handleQuickDelete} onAddMaterial={() => setActiveTab('add')}
              onInlineEdit={handleInlineEdit} onItemMove={handleItemDragMove}
              overdueOnly={overdueOnly} onOverdueToggle={setOverdueOnly}
              sourceOptions={sourceOptions} searchTruncated={searchTruncated}
              savedViews={savedViews} onSaveView={handleSaveView} onApplyView={handleApplyView} onDeleteView={removeView}
              canWrite={!!runtime?.canWrite} />
          </TabsContent>
          {runtime?.canWrite && <TabsContent value="add"><AddItemForm onCreated={handleItemCreated} forexRates={effectiveRates} /></TabsContent>}
          {runtime?.canWrite && <TabsContent value="bulk">{activeTab === 'bulk' && <BulkPasteImport onCreated={handleItemCreated} forexRates={effectiveRates} />}</TabsContent>}
        </Tabs>
        <Suspense fallback={null}>
          <ItemDetail item={selectedItem} open={!!selectedItem} canWrite={!!runtime?.canWrite} onClose={() => setSelectedItem(null)} onUpdated={handleItemUpdated} onDeleted={handleItemDeleted} onDuplicated={handleDuplicated} items={items} />
        </Suspense>
      </div>
    </main>
  );
}
export default App;

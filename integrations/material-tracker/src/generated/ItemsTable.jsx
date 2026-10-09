import React, { useState, useRef, useMemo, useCallback, useEffect } from 'react';
import { Table, TableBody, TableHead, TableHeader, TableRow, TableCell } from '@material/components/ui/table';
import { Badge } from '@material/components/ui/badge'; import { Button } from '@material/components/ui/button';
import { Package, ChevronDown, ChevronUp, ChevronRight, MessageSquare, Layers, Loader2, Star, Plus, Info } from 'lucide-react';
import { COLS, buildGroups } from '@material/generated/tableColumns'; import { getDefaultVisibility } from '@material/generated/ColumnToggle'; import { useColumnPrefs } from '@material/generated/hooks/useColumnPrefs';
import { usePdfExport } from '@material/skills/pdf-export.jsx'; import { useXlsxExport } from '@material/skills/xlsx-export.jsx'; import { buildImportCompatibleWorkbook, buildImportCompatibleCsv, downloadText } from '@material/import-export/export-engine';
import ItemRow from '@material/generated/ItemRow'; import TableToolbar from '@material/generated/TableToolbar'; import TableFooterStats from '@material/generated/TableFooterStats';
import BulkActionBar from '@material/generated/BulkActionBar'; import ScrollToTop from '@material/generated/ScrollToTop';
import MaterialCard from '@material/generated/components/MaterialCard';
import { useVirtualRows } from '@material/generated/hooks/useVirtualRows';

class TableErrorBoundary extends React.Component {
  constructor(props) { super(props); this.state = { hasError: false }; }
  static getDerivedStateFromError() { return { hasError: true }; }
  componentDidCatch(error, info) { console.error('Table render error:', error, info); }
  render() {
    if (this.state.hasError) return (<div className="flex flex-col items-center py-12 px-6"><Package className="size-8 text-destructive/40 mb-3" /><p className="text-sm font-semibold">Something went wrong</p><Button variant="outline" size="sm" onClick={() => this.setState({ hasError: false })} className="mt-3">Try Again</Button></div>);
    return this.props.children;
  }
}

function ItemsTableInner({ items, loading, loadingMore, hasMore, onLoadMore, onSelect, effectiveRates,
  onSearch, sourceFilter, onFilterChange, selectedIds, setSelectedIds, onBulkDelete, onBulkMove, onBulkSourceType,
  starred, onToggleStar, isStarred, recentIds, getShipCurrency, onShipCurrencyChange, onVendorSearch, isRefetching,
  onSourceTypeChange, onDuplicate, onDelete, onAddMaterial, onInlineEdit, onItemMove,
  overdueOnly, onOverdueToggle, sourceOptions, searchTruncated, savedViews, onSaveView, onApplyView, onDeleteView, canWrite = false }) {
  const [expandedCmtId, setExpandedCmtId] = useState(null);
  // Item 19: Multi-level sort
  const [sortStack, setSortStack] = useState([]);
  const { colVis, toggleCol, batchSetVis, colWidths, setColWidth, colOrder, setColOrder } = useColumnPrefs(getDefaultVisibility(COLS));
  const [density, setDensity] = useState('comfortable'), [collapsedGroups, setCollapsedGroups] = useState(new Set());
  const tableRef = useRef(null), scrollRef = useRef(null);
  const { exportToPdf, isExporting } = usePdfExport();
  const { exportToXlsx, isExporting: isXlsxExporting } = useXlsxExport();
  const [starredFirst, setStarredFirst] = useState(true);
  const [focusedIdx, setFocusedIdx] = useState(-1);
  const [scrollShadow, setScrollShadow] = useState({ left: false, right: false });
  // Item 11: Drag state
  const [dragOverGroup, setDragOverGroup] = useState(null);
  // Item 20: Mobile detection
  const [isMobile, setIsMobile] = useState(typeof window !== 'undefined' && window.innerWidth < 640);

  useEffect(() => { const h = () => setIsMobile(window.innerWidth < 640); window.addEventListener('resize', h); return () => window.removeEventListener('resize', h); }, []);

  // Tier 2 Fix #12: rAF-guarded scroll shadow check to batch to paint frames
  const rafPendingRef = useRef(false);
  const checkScrollShadowRaw = useCallback(() => {
    const el = scrollRef.current; if (!el) return;
    const left = el.scrollLeft > 1, right = el.scrollLeft + el.clientWidth < el.scrollWidth - 1;
    setScrollShadow(prev => (prev.left === left && prev.right === right) ? prev : { left, right });
  }, []);
  const checkScrollShadow = useCallback(() => {
    if (rafPendingRef.current) return;
    rafPendingRef.current = true;
    requestAnimationFrame(() => {
      rafPendingRef.current = false;
      checkScrollShadowRaw();
    });
  }, [checkScrollShadowRaw]);

  const toggleCmt = useCallback((id) => setExpandedCmtId(p => p === id ? null : id), []);
  const toggleSelect = useCallback((id) => { if (!canWrite) return; setSelectedIds(p => { const s = new Set(p); if (s.has(id)) s.delete(id); else s.add(id); return s; }); }, [canWrite, setSelectedIds]);
  const toggleGroup = useCallback((gid) => setCollapsedGroups(p => { const s = new Set(p); if (s.has(gid)) s.delete(gid); else s.add(gid); return s; }), []);

  // Item 19: Multi-sort handler — shift+click adds to stack
  const handleSort = useCallback((c, isShift) => {
    if (!c.sortable) return;
    setSortStack(prev => {
      const idx = prev.findIndex(s => s.key === c.key);
      if (isShift) {
        if (idx >= 0) { const u = [...prev]; u[idx] = { ...u[idx], dir: u[idx].dir === 'asc' ? 'desc' : 'asc' }; return u; }
        if (prev.length >= 3) return prev;
        return [...prev, { key: c.key, dir: 'asc' }];
      }
      if (idx >= 0) return [{ key: c.key, dir: prev[idx].dir === 'asc' ? 'desc' : 'asc' }];
      return [{ key: c.key, dir: 'asc' }];
    });
  }, []);

  // Item 13: Column ordering
  const visCols = useMemo(() => {
    let visible = COLS.filter(c => colVis[c.key]);
    if (colOrder?.length) {
      const oMap = new Map(colOrder.map((k, i) => [k, i]));
      visible = [...visible].sort((a, b) => (oMap.get(a.key) ?? 999) - (oMap.get(b.key) ?? 999));
    }
    return visible;
  }, [colVis, colOrder]);

  // Item 13: Column reorder via drag
  const handleColReorder = useCallback((srcKey, tgtKey) => {
    const order = colOrder || COLS.map(c => c.key);
    const si = order.indexOf(srcKey), ti = order.indexOf(tgtKey);
    if (si < 0 || ti < 0 || si === ti) return;
    const n = [...order]; n.splice(si, 1); n.splice(ti, 0, srcKey);
    setColOrder(n);
  }, [colOrder, setColOrder]);

  // P1 Fix: Normalize overdue comparison to midnight-vs-midnight to match getDateProximity
  // Items due "Today" should NOT count as overdue
  const { filtered, overdueCount } = useMemo(() => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    let count = 0;
    const filteredList = [];
    for (const i of items) {
      let isOverdue = false;
      try {
        if (i.dateRequired) {
          const d = new Date(i.dateRequired);
          d.setHours(0, 0, 0, 0);
          isOverdue = d < now;
        }
      } catch {}
      if (isOverdue) count++;
      if (!overdueOnly || isOverdue) filteredList.push(i);
    }
    return { filtered: filteredList, overdueCount: count };
  }, [items, overdueOnly]);

  // Item 19: Multi-level sort
  const sorted = useMemo(() => {
    if (!sortStack.length) return filtered;
    return [...filtered].sort((a, b) => {
      for (const { key, dir } of sortStack) {
        const cd = COLS.find(c => c.key === key);
        if (!cd?.sortFn) continue;
        try { const cmp = dir === 'asc' ? cd.sortFn(a, b) : cd.sortFn(b, a); if (cmp !== 0) return cmp; } catch { continue; }
      }
      return 0;
    });
  }, [filtered, sortStack]);

  // Tier 2 Fix #9: Key on starred size rather than Set reference to avoid recompute on every toggle
  const starredSize = starred?.size ?? 0;
  const sortedWithStars = useMemo(() => {
    if (!starredFirst || !starredSize) return sorted;
    const s = [], u = [];
    for (const it of sorted) { (starred.has(it.id) ? s : u).push(it); }
    return s.length ? s.concat(u) : sorted;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sorted, starredSize, starredFirst]);

  const flatItemIds = useMemo(() => {
    if (!sortedWithStars.length) return [];
    const groups = buildGroups(sortedWithStars);
    return groups.flatMap(g => collapsedGroups.has(g.id) ? [] : g.items.map(it => it.id));
  }, [sortedWithStars, collapsedGroups]);

  useEffect(() => {
    const handler = (e) => {
      const tag = e.target.tagName; if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || e.target.isContentEditable) return;
      // P4 Fix: Skip row navigation if inside an inline edit cell or a dropdown portal
      if (e.target.closest('[data-radix-popper-content-wrapper]') || e.target.closest('[role="listbox"]')) return;
      if (e.key === 'ArrowDown') { e.preventDefault(); setFocusedIdx(p => Math.min(p + 1, flatItemIds.length - 1)); }
      else if (e.key === 'ArrowUp') { e.preventDefault(); setFocusedIdx(p => Math.max(p - 1, 0)); }
      else if (e.key === 'Enter' && focusedIdx >= 0 && focusedIdx < flatItemIds.length) {
        e.preventDefault(); const item = sortedWithStars.find(i => i.id === flatItemIds[focusedIdx]); if (item) onSelect(item);
      }
    };
    document.addEventListener('keydown', handler); return () => document.removeEventListener('keydown', handler);
  }, [flatItemIds, focusedIdx, sortedWithStars, onSelect]);
  // P5 Fix: Also reset keyboard focus when groups are collapsed/expanded,
  // since flatItemIds changes and focusedIdx would point to a different item
  useEffect(() => { setFocusedIdx(-1); }, [items.length, overdueOnly, sortStack, collapsedGroups]);

  useEffect(() => { const el = scrollRef.current; if (!el || loading) return; const ro = new ResizeObserver(checkScrollShadow); ro.observe(el); checkScrollShadow(); return () => ro.disconnect(); }, [loading, sortedWithStars.length, checkScrollShadow, visCols.length]);

  const groups = useMemo(() => !loading && sortedWithStars.length ? buildGroups(sortedWithStars) : [], [loading, sortedWithStars]);
  const allSelected = sortedWithStars.length > 0 && sortedWithStars.every(i => selectedIds.has(i.id));
  const handleXlsx = () => exportToXlsx(buildImportCompatibleWorkbook(sortedWithStars), 'material-tracker-materials.xlsx');
  const handleCsv = () => downloadText(buildImportCompatibleCsv(sortedWithStars), 'material-tracker-materials.csv');

  // Tier 1: Render budget as derived value — eliminates extra re-render via rAF
  // On first paint after new data (items.length changes), cap at 30 for fast initial render.
  // Once groups are known, immediately show all (no async state bump needed).
  const itemsLenRef = useRef(items.length);
  const hasNewData = items.length !== itemsLenRef.current;
  if (hasNewData) itemsLenRef.current = items.length;
  const totalRows = useMemo(() => groups.reduce((s, g) => s + (collapsedGroups.has(g.id) ? 0 : g.items.length), 0), [groups, collapsedGroups]);
  // After initial skeleton→data transition, render all rows immediately.
  // The initial cap of 30 only applies on the very first render when groups haven't resolved yet.
  const renderBudget = totalRows || 30;

  // Tier 3: Lightweight virtualization for 200+ row boards
  const { visibleIds, isActive: isVirtualized, registerPlaceholder } = useVirtualRows(flatItemIds, { threshold: 150, rootMargin: '600px' });

  // Item 11: Drop handler for group zones
  const handleItemDrop = useCallback((itemId, targetGroupId) => {
    if (!canWrite) { setDragOverGroup(null); return; }
    const item = items.find(i => i.id === itemId);
    if (!item || item.group?.id === targetGroupId) { setDragOverGroup(null); return; }
    onItemMove?.(itemId, targetGroupId);
    setDragOverGroup(null);
  }, [canWrite, items, onItemMove]);

  const hasBulkBar = selectedIds.size > 0;

  return (
    <div className="rounded-2xl border border-border/40 bg-card shadow-lg overflow-hidden relative transition-shadow duration-300 hover:shadow-xl">
      <div className="h-[2px] bg-gradient-to-r from-primary via-[hsl(var(--chart-5))] to-transparent animate-gradient-shift" />
      <TableToolbar onSearch={onSearch} sourceFilter={sourceFilter} onFilterChange={onFilterChange}
        itemCount={sortedWithStars.length} loading={loading} overdueOnly={overdueOnly} onOverdueToggle={onOverdueToggle}
        overdueCount={overdueCount} onVendorSearch={onVendorSearch} isRefetching={isRefetching}
        onExport={() => exportToPdf(tableRef, 'materials.pdf')} isExporting={isExporting}
        onXlsxExport={handleXlsx} isXlsxExporting={isXlsxExporting} onCsvExport={handleCsv}
        cols={COLS} colVisibility={colVis} onColToggle={toggleCol} onBatchSetVis={batchSetVis}
        density={density} onDensityToggle={() => setDensity(d => d === 'comfortable' ? 'compact' : 'comfortable')}
        sourceOptions={sourceOptions}
        savedViews={savedViews} onSaveView={onSaveView} onApplyView={onApplyView} onDeleteView={onDeleteView} />
      <TableErrorBoundary>
        {loading ? <TableSkeleton /> : !sortedWithStars.length ? <EmptyState overdueOnly={overdueOnly} onAddMaterial={canWrite ? onAddMaterial : null} /> : (
          <>
            {/* Item 20: Mobile card view */}
            {isMobile ? (
              <div className="grid grid-cols-1 gap-3 p-3 sm:p-4">
                {sortedWithStars.slice(0, renderBudget).map((item, idx) => (
                  <div key={item.id} className="animate-group-expand" style={{ animationDelay: `${Math.min(idx, 8) * 30}ms` }}>
                    <MaterialCard item={item} onSelect={onSelect} isStarred={isStarred?.(item.id)} onToggleStar={onToggleStar}
                      canWrite={canWrite} onDuplicate={canWrite ? onDuplicate : null} onDelete={canWrite ? onDelete : null} onSourceTypeChange={canWrite ? onSourceTypeChange : null} effectiveRates={effectiveRates} getShipCurrency={getShipCurrency} />
                  </div>
                ))}
              </div>
            ) : (
              <div className="relative">
                {scrollShadow.left && <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-card via-card/80 to-transparent z-[5] pointer-events-none transition-opacity duration-200" />}
                {scrollShadow.right && <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-card via-card/80 to-transparent z-[5] pointer-events-none transition-opacity duration-200" />}
                <div className="overflow-x-auto overscroll-x-contain styled-scrollbar" onScroll={checkScrollShadow} ref={(el) => { tableRef.current = el; scrollRef.current = el; }}>
                  <Table>
                    <TableHeader><TableRow className="bg-muted/60 hover:bg-muted/60 border-b-2 border-border/60">
                      <TableHead className="w-6 px-1" />
                      <TableHead className="w-8 px-2">{canWrite && <input type="checkbox" aria-label="Select all" className="size-3.5 rounded cursor-pointer accent-[hsl(var(--primary))]" checked={allSelected} onChange={() => setSelectedIds(allSelected ? new Set() : new Set(sortedWithStars.map(i => i.id)))} />}</TableHead>
                      <TableHead className="w-8 px-1"><button onClick={() => setStarredFirst(p => !p)} className="cursor-pointer" aria-label={starredFirst ? 'Disable starred first' : 'Enable starred first'}><Star className={`size-3.5 transition-colors ${starredFirst ? 'fill-[hsl(var(--chart-4))] text-[hsl(var(--chart-4))]' : 'text-muted-foreground/30'}`} /></button></TableHead>
                      {visCols.map(c => <SortHead key={c.key || c.label} col={c} sortStack={sortStack} onSort={handleSort}
                        colWidth={colWidths[c.key]} onResize={setColWidth} onColReorder={handleColReorder} />)}
                      <TableHead className="w-8 px-1 sticky right-0 bg-muted/60 z-[3]" />
                    </TableRow></TableHeader>
                    <TableBody>{groups.map(g => <GroupRows key={g.id} group={g} cols={visCols} effectiveRates={effectiveRates}
                      expandedCmtId={expandedCmtId} toggleCmt={toggleCmt} onSelect={onSelect} selectedIds={selectedIds}
                      toggleSelect={toggleSelect} collapsed={collapsedGroups.has(g.id)} onToggle={() => toggleGroup(g.id)}
                      density={density} isStarred={isStarred} onToggleStar={onToggleStar} recentIds={recentIds}
                      getShipCurrency={getShipCurrency} onShipCurrencyChange={onShipCurrencyChange}
                      renderBudget={renderBudget} focusedId={focusedIdx >= 0 ? flatItemIds[focusedIdx] : null}
                      onSourceTypeChange={onSourceTypeChange} onDuplicate={onDuplicate} onDelete={onDelete}
                      onInlineEdit={onInlineEdit} colWidths={colWidths}
                      visibleIds={visibleIds} isVirtualized={isVirtualized} registerPlaceholder={registerPlaceholder}
                      dragOverGroup={dragOverGroup} setDragOverGroup={setDragOverGroup} onItemDrop={handleItemDrop} canWrite={canWrite} />)}
                      {loadingMore && [1,2,3,4].map(i => <TableRow key={`s${i}`}><TableCell colSpan={visCols.length + 4} className="py-1.5"><div className="h-9 rounded-lg animate-shimmer" style={{ animationDelay: `${i * 100}ms` }} /></TableCell></TableRow>)}
                    </TableBody>
                  </Table>
                </div>
              </div>
            )}
          </>
        )}
      </TableErrorBoundary>
      {!loading && sortedWithStars.length > 0 && (
        <div className={`border-t border-border/50 px-4 sm:px-5 py-3 flex items-center justify-between bg-muted/20 flex-wrap gap-3 transition-all ${hasBulkBar ? 'pb-16' : ''}`}>
          <TableFooterStats items={sortedWithStars} />
          <div className="flex items-center gap-3">
            {searchTruncated && (
              <div className="flex items-center gap-1.5 text-xs text-[hsl(var(--chart-4))] bg-[hsl(var(--chart-4)/.06)] px-2.5 py-1 rounded-full border border-[hsl(var(--chart-4)/.15)]">
                <Info className="size-3 shrink-0" />
                <span className="font-medium">More results may exist — try a more specific search</span>
              </div>
            )}
            <p className="text-xs text-muted-foreground">
              <span className="font-bold text-foreground tabular-nums">{sortedWithStars.length}</span> materials
            </p>
            {hasMore && (
              <Button variant="outline" size="sm" onClick={onLoadMore} disabled={loadingMore}
                className="gap-1.5 rounded-full px-5 h-8 text-xs font-semibold border-primary/20 text-primary hover:bg-primary/5 hover:border-primary/40 hover:shadow-sm transition-all duration-200 active:scale-95">
                {loadingMore ? (
                  <Loader2 className="size-3.5 animate-spin" />
                ) : (
                  <ChevronDown className="size-3.5" />
                )}
                {loadingMore ? 'Loading…' : 'Load More'}
              </Button>
            )}
          </div>
        </div>)}
      {(isExporting || isXlsxExporting) && <div className="absolute inset-0 bg-background/60 backdrop-blur-[2px] flex items-center justify-center z-10 rounded-2xl animate-in fade-in duration-200"><div className="flex items-center gap-2.5 bg-card px-5 py-3 rounded-xl shadow-xl border border-border/60"><Loader2 className="size-4 animate-spin text-primary" /><span className="text-sm font-medium text-foreground">Exporting…</span></div></div>}
      {canWrite && <BulkActionBar selectedIds={selectedIds} onClear={() => setSelectedIds(new Set())} onDelete={onBulkDelete} onMove={onBulkMove} onBulkSourceType={onBulkSourceType} />}
      <ScrollToTop hasBulkBar={hasBulkBar} />
    </div>);
}

// Item 19: SortHead with multi-sort badges + Item 13: resize handle + column reorder
function SortHead({ col: c, sortStack, onSort, colWidth, onResize, onColReorder }) {
  if (c.cmt) return <TableHead className="w-10 px-1 text-center"><MessageSquare className="size-3 text-muted-foreground/40 mx-auto" /></TableHead>;
  const sortEntry = sortStack.find(s => s.key === c.key);
  const sortIdx = sortStack.findIndex(s => s.key === c.key);
  const isName = c.bold && c.key === 'name';
  const stickyClass = isName ? 'sticky left-0 bg-muted/60 z-[3] shadow-[2px_0_4px_-2px_rgba(0,0,0,0.06)]' : '';
  const widthStyle = colWidth ? { width: `${colWidth}px`, minWidth: `${colWidth}px` } : undefined;

  // Item 13: Resize handle
  const handleResizeStart = (e) => {
    e.preventDefault(); e.stopPropagation();
    const startX = e.clientX;
    const startW = e.currentTarget.parentElement.offsetWidth;
    const onMove = (ev) => onResize(c.key, Math.max(50, startW + ev.clientX - startX));
    const onUp = () => { document.removeEventListener('mousemove', onMove); document.removeEventListener('mouseup', onUp); };
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
  };

  return (
    <TableHead onClick={(e) => onSort(c, e.shiftKey)} style={widthStyle}
      draggable={!isName} onDragStart={(e) => { e.dataTransfer.setData('col-key', c.key); e.dataTransfer.effectAllowed = 'move'; }}
      onDragOver={(e) => { e.preventDefault(); e.currentTarget.classList.add('bg-primary/10'); }}
      onDragLeave={(e) => { e.currentTarget.classList.remove('bg-primary/10'); }}
      onDrop={(e) => { e.preventDefault(); e.currentTarget.classList.remove('bg-primary/10'); const src = e.dataTransfer.getData('col-key'); if (src) onColReorder(src, c.key); }}
      className={`text-[11px] font-bold uppercase tracking-wider text-muted-foreground/70 whitespace-nowrap py-3.5 relative group/head ${c.right ? 'text-right' : ''} ${c.sortable ? 'cursor-pointer hover:text-foreground select-none' : ''} ${stickyClass}`}>
      <span className="inline-flex items-center gap-0.5">
        {c.label}
        {c.sortable && sortEntry && (sortEntry.dir === 'asc' ? <ChevronUp className="size-3" /> : <ChevronDown className="size-3" />)}
        {sortStack.length > 1 && sortIdx >= 0 && <span className="text-[8px] font-extrabold text-primary ml-0.5">{sortIdx + 1}</span>}
      </span>
      {/* Item 13: Resize handle */}
      <div className="absolute right-0 top-0 bottom-0 w-1.5 cursor-col-resize opacity-0 group-hover/head:opacity-100 hover:!bg-primary/40 bg-border/30 transition-opacity z-10"
        onMouseDown={handleResizeStart} onClick={e => e.stopPropagation()} />
    </TableHead>);
}

// Tier 3: Lightweight placeholder row for virtualized off-screen items
const VirtualPlaceholder = React.memo(function VirtualPlaceholder({ id, colSpan, registerPlaceholder }) {
  const refCb = useCallback((el) => { registerPlaceholder(id, el); }, [id, registerPlaceholder]);
  return (
    <TableRow className="h-12" ref={refCb} data-virtual-id={id}>
      <TableCell colSpan={colSpan} className="p-0" />
    </TableRow>
  );
});

// Item 11: Group rows with drop zone — Tier 3 Fix #17: content-visibility on group header
function GroupRows({ group: g, cols, effectiveRates, expandedCmtId, toggleCmt, onSelect, selectedIds, toggleSelect, collapsed, onToggle, density, isStarred, onToggleStar, recentIds, getShipCurrency, onShipCurrencyChange, renderBudget, focusedId, onSourceTypeChange, onDuplicate, onDelete, onInlineEdit, colWidths, visibleIds, isVirtualized, registerPlaceholder, dragOverGroup, setDragOverGroup, onItemDrop, canWrite }) {
  const isDragOver = dragOverGroup === g.id;
  return (<React.Fragment>
    <TableRow role="button" tabIndex={0} className={`hover:bg-transparent border-none cursor-pointer transition-colors [content-visibility:auto] [contain-intrinsic-size:auto_40px] ${isDragOver ? '!bg-primary/10' : ''}`}
      onClick={onToggle}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onToggle(); } }}
      onDragOver={(e) => { if (!canWrite) return; e.preventDefault(); e.dataTransfer.dropEffect = 'move'; setDragOverGroup(g.id); }}
      onDragLeave={() => canWrite && setDragOverGroup(null)}
      onDrop={(e) => { if (!canWrite) return; e.preventDefault(); const id = e.dataTransfer.getData('text/plain'); if (id) onItemDrop(id, g.id); }}>
      <TableCell colSpan={cols.length + 4} className="p-0">
        <div className={`flex items-center gap-2 px-5 py-2.5 border-l-[3px] transition-all ${isDragOver ? 'bg-primary/[0.12] border-l-primary' : 'bg-gradient-to-r from-primary/[0.07] via-primary/[0.03] to-transparent border-l-primary'}`}>
          {collapsed ? <ChevronRight className="size-3.5 text-primary/60" /> : <ChevronDown className="size-3.5 text-primary/60" />}
          <Layers className="size-3.5 text-primary/60" />
          <span className="text-[11px] font-extrabold text-primary uppercase tracking-[0.12em] font-[family-name:var(--font-heading)]">{g.label}</span>
          <Badge className="text-[10px] px-2 py-0 h-[18px] rounded-full font-bold bg-primary/10 text-primary border-0 shadow-none">{g.items.length}</Badge>
          {isDragOver && <span className="text-[10px] text-primary font-semibold ml-auto">Drop here</span>}
        </div>
      </TableCell>
    </TableRow>
    {!collapsed && g.items.map((it, idx) => {
      if (idx >= renderBudget) return null;
      // Tier 3: Virtualization — render placeholder for off-screen rows in large lists
      if (isVirtualized && visibleIds && !visibleIds.has(it.id)) {
        return <VirtualPlaceholder key={it.id} id={it.id} colSpan={cols.length + 4} registerPlaceholder={registerPlaceholder} />;
      }
      return <ItemRow key={it.id} item={it} idx={idx} cols={cols} effectiveRates={effectiveRates}
        isCommentOpen={expandedCmtId === it.id} toggleCmt={toggleCmt} onSelect={onSelect} selected={selectedIds.has(it.id)}
        onToggleSelect={toggleSelect} density={density} isStarred={isStarred?.(it.id)} onToggleStar={onToggleStar} isRecent={recentIds?.has(it.id)}
        getShipCurrency={getShipCurrency} onShipCurrencyChange={onShipCurrencyChange}
        isFocused={focusedId === it.id} onSourceTypeChange={onSourceTypeChange} onDuplicate={onDuplicate} onDelete={onDelete}
        onInlineEdit={canWrite ? onInlineEdit : null} colWidths={colWidths} canWrite={canWrite} />;
    })}
  </React.Fragment>);
}

const TableSkeleton = () => (<div className="p-5 space-y-2.5">{[...Array(Math.max(3, Math.min(15, Math.floor((window.innerHeight - 320) / 48))))].map((_, i) => (
  <div key={i} className="flex items-center gap-3 px-3 py-2" style={{ opacity: 1 - i * 0.04 }}>
    <div className="size-4 rounded animate-shimmer shrink-0" />
    <div className="h-4 rounded animate-shimmer flex-[2]" style={{ animationDelay: `${i * 80}ms` }} />
    <div className="h-4 rounded animate-shimmer flex-1 hidden sm:block" style={{ animationDelay: `${i * 80 + 40}ms` }} />
    <div className="h-4 rounded animate-shimmer w-16" style={{ animationDelay: `${i * 80 + 80}ms` }} />
    <div className="h-4 rounded animate-shimmer w-20 hidden md:block" style={{ animationDelay: `${i * 80 + 120}ms` }} />
  </div>
))}</div>);

const EmptyState = ({ overdueOnly: o, onAddMaterial }) => (
  <div className="flex flex-col items-center py-20 px-6">
    <div className="animate-float">
      <div className="size-16 rounded-2xl bg-primary/[0.06] border border-primary/10 flex items-center justify-center mb-4">
        <Package className="size-7 text-primary/40" />
      </div>
    </div>
    <h3 className="text-base font-bold text-foreground font-[family-name:var(--font-heading)]">
      {o ? 'No overdue materials' : 'No materials found'}
    </h3>
    <p className="text-sm text-muted-foreground mt-1.5 mb-5 text-center max-w-[280px]">
      {o ? 'All items are on track — looking good!' : 'Try adjusting your filters or search, or add a new material to get started'}
    </p>
    {!o && onAddMaterial && (
      <Button onClick={onAddMaterial}
        className="gap-1.5 rounded-full px-6 h-10 font-semibold shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200">
        <Plus className="size-4" />Add Material
      </Button>
    )}
  </div>
);

export const ItemsTable = React.memo(ItemsTableInner);
export default ItemsTable;

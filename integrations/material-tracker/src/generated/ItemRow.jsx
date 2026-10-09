import React, { memo, useRef, useState, useEffect, useMemo, Suspense } from 'react';
import { TableRow, TableCell } from '@material/components/ui/table';
import { Badge } from '@material/components/ui/badge';
import { Button } from '@material/components/ui/button';
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from '@material/components/ui/tooltip';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator } from '@material/components/ui/dropdown-menu';
import { MessageSquare, Star, Copy, Check, MoreHorizontal, Eye, Trash2, GripVertical } from 'lucide-react';
import { getDateProximity } from '@material/generated/utils/dateProximity';
import { calcPhp } from '@material/generated/utils/calculations';
import { toast } from 'sonner';
import InlineEditCell from '@material/generated/components/InlineEditCell';

// Tier 3 Fix #18: Lazy-load CommentsPanel — heavy component only rendered when comments are opened
const CommentsPanel = React.lazy(() => import('@material/generated/CommentsPanel'));

function copyToClipboard(text) { navigator.clipboard.writeText(text).then(() => toast.success('Copied to clipboard')).catch(() => {}); }

// Item 16: Inline-editable column definitions
const EDITABLE_MAP = {
  buyingPrice: { type: 'number', field: 'buyingPrice' },
  qty: { type: 'number', field: 'quantity' },
  vendor: { type: 'text', field: 'vendorDetails' },
  lead: { type: 'number', field: 'leadtimeInWeeks' },
  currency: { type: 'select', field: 'currency', options: ['PHP', 'USD', 'EUR'] },
};

function renderCell(col, value, item) {
  if (col.badge) {
    const imp = value === 'Import';
    return (<Badge variant="outline" className={`rounded-full text-[11px] px-2.5 py-0 h-[22px] gap-1.5 font-semibold border-0 ${imp ? 'bg-[hsl(var(--chart-5)/.08)] text-[hsl(var(--chart-5))]' : 'bg-[hsl(var(--chart-2)/.08)] text-[hsl(var(--chart-2))]'}`}>
      <span className={`size-1.5 rounded-full shrink-0 ${imp ? 'bg-[hsl(var(--chart-5))]' : 'bg-[hsl(var(--chart-2))]'}`} />{value || '—'}</Badge>);
  }
  if (col.dateBadge && item?.dateRequired) {
    const prox = getDateProximity(item.dateRequired);
    return (<div className="flex items-center gap-1.5"><span className="text-[13px] text-foreground">{value}</span>
      {prox && <Badge variant="outline" className={`text-[9px] px-1.5 py-0 h-[16px] rounded-full font-bold border ${prox.cls}`}>{prox.label}</Badge>}</div>);
  }
  if (col.bold) return (
    <span className="inline-flex items-center gap-1.5 group/copy">
      <span className="font-semibold text-foreground text-[13px] font-[family-name:var(--font-heading)]">{value || '—'}</span>
      {value && <button onClick={e => { e.stopPropagation(); copyToClipboard(value); }}
        className="opacity-0 group-hover/copy:opacity-60 hover:!opacity-100 transition-opacity cursor-pointer" aria-label="Copy"><Copy className="size-3 text-muted-foreground" /></button>}
    </span>);
  if (col.truncate) {
    const has = value != null && value !== '';
    return (<TooltipProvider><Tooltip><TooltipTrigger asChild>
      <span className="block max-w-[220px] truncate text-muted-foreground text-[13px] cursor-default">{has ? value : '—'}</span>
    </TooltipTrigger>{has && value.length > 30 && <TooltipContent className="max-w-[300px] whitespace-pre-wrap text-xs">{value}</TooltipContent>}</Tooltip></TooltipProvider>);
  }
  const has = value != null && value !== '';
  return <span className={`text-[13px] ${has ? 'text-foreground' : 'text-muted-foreground'}`}>{has ? value : '—'}</span>;
}

function ShipCurrencyCell({ item, getShipCurrency, onShipCurrencyChange, py, canWrite }) {
  const [flash, setFlash] = useState(false);
  const handleChange = (e) => { e.stopPropagation(); onShipCurrencyChange?.(item.id, e.target.value); setFlash(true); };
  useEffect(() => { if (!flash) return; const t = setTimeout(() => setFlash(false), 1200); return () => clearTimeout(t); }, [flash]);
  if (!canWrite) return <TableCell className={`${py} whitespace-nowrap`}><span className="text-[12px] text-foreground">{getShipCurrency?.(item) || 'PHP'}</span></TableCell>;
  return (
    <TableCell className={`${py} whitespace-nowrap relative`} onClick={e => e.stopPropagation()}>
      <div className="relative inline-flex items-center">
        <select value={getShipCurrency?.(item) || 'PHP'} onChange={handleChange}
          className={`text-[12px] h-7 px-1.5 rounded-md border border-border/50 bg-background text-foreground cursor-pointer focus:ring-1 focus:ring-primary/30 outline-none transition-all ${flash ? 'border-[hsl(var(--chart-2))] ring-1 ring-[hsl(var(--chart-2)/.3)]' : ''}`}>
          <option value="PHP">PHP</option><option value="USD">USD</option><option value="EUR">EUR</option>
        </select>
        {flash && <Check className="size-3 text-[hsl(var(--chart-2))] ml-1 animate-in fade-in zoom-in duration-200" />}
      </div>
    </TableCell>
  );
}

function SourceTypeBadge({ item, onSourceTypeChange, canWrite }) {
  const imp = item.sourceType === 'Import';
  const badge = <Badge variant="outline" className={`rounded-full text-[11px] px-2.5 py-0 h-[22px] gap-1.5 font-semibold border-0 transition-colors ${imp ? 'bg-[hsl(var(--chart-5)/.08)] text-[hsl(var(--chart-5))]' : 'bg-[hsl(var(--chart-2)/.08)] text-[hsl(var(--chart-2))]'}`}><span className={`size-1.5 rounded-full shrink-0 transition-colors ${imp ? 'bg-[hsl(var(--chart-5))]' : 'bg-[hsl(var(--chart-2))]'}`} />{item.sourceType || '—'}</Badge>;
  if (!canWrite) return badge;
  return (
    <button onClick={(e) => { e.stopPropagation(); onSourceTypeChange?.(item.id, item.sourceType === 'Import' ? 'Local' : 'Import'); }}
      className="cursor-pointer group/badge transition-transform hover:scale-105 active:scale-95" aria-label={`Toggle source type from ${item.sourceType}`}>
      <Badge variant="outline" className={`rounded-full text-[11px] px-2.5 py-0 h-[22px] gap-1.5 font-semibold border-0 transition-colors ${imp ? 'bg-[hsl(var(--chart-5)/.08)] text-[hsl(var(--chart-5))]' : 'bg-[hsl(var(--chart-2)/.08)] text-[hsl(var(--chart-2))]'}`}>
        <span className={`size-1.5 rounded-full shrink-0 transition-colors ${imp ? 'bg-[hsl(var(--chart-5))]' : 'bg-[hsl(var(--chart-2))]'}`} />{item.sourceType || '—'}
      </Badge>
    </button>
  );
}

function ItemRowInner({ item, idx, cols, effectiveRates, isCommentOpen, toggleCmt, onSelect, selected, onToggleSelect, density, isStarred, onToggleStar, isRecent, getShipCurrency, onShipCurrencyChange, isFocused, onSourceTypeChange, onDuplicate, onDelete, onInlineEdit, colWidths, onDragStart, canWrite = false }) {
  const isOpen = isCommentOpen;
  // P1 Fix: Normalize overdue comparison to midnight-vs-midnight so items due "Today"
  // don't get the red overdue border. Matches the getDateProximity logic.
  const overdue = useMemo(() => {
    if (!item.dateRequired) return false;
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const d = new Date(item.dateRequired);
    d.setHours(0, 0, 0, 0);
    return d < now;
  }, [item.dateRequired]);
  const py = density === 'compact' ? 'py-1.5' : 'py-3';
  const wasOpened = useRef(false);
  if (isOpen) wasOpened.current = true;
  const rowRef = useRef(null);

  useEffect(() => { if (isFocused && rowRef.current) rowRef.current.scrollIntoView({ block: 'nearest', behavior: 'smooth' }); }, [isFocused]);

  const contentVisibilityCls = useMemo(() => isOpen ? '' : '[content-visibility:auto] [contain-intrinsic-size:auto_48px]', [isOpen]);

  // Item 11: Native drag handlers
  const handleDragStart = (e) => {
    e.dataTransfer.setData('text/plain', item.id);
    e.dataTransfer.effectAllowed = 'move';
    const ghost = document.createElement('div');
    ghost.className = 'bg-card border border-primary/30 rounded-lg px-3 py-1.5 text-sm font-medium shadow-lg fixed';
    ghost.textContent = item.name;
    ghost.style.cssText = 'position:fixed;top:-999px;left:-999px;z-index:9999;';
    document.body.appendChild(ghost);
    e.dataTransfer.setDragImage(ghost, 0, 0);
    setTimeout(() => { try { document.body.removeChild(ghost); } catch {} }, 0);
    onDragStart?.(item.id);
  };

  return (
    <React.Fragment>
      <TableRow ref={rowRef} onClick={() => onSelect(item)} data-item-id={item.id}
        style={!isRecent && idx <= 8 ? { animationDelay: `${idx * 25}ms` } : undefined}
        className={`cursor-pointer group transition-all duration-150 border-b border-border/30 border-l-[3px] border-l-transparent hover:bg-accent/50 hover:border-l-primary hover:translate-x-[2px] ${contentVisibilityCls} ${idx % 2 === 1 ? 'bg-muted/[0.04]' : ''} ${overdue ? '!border-l-destructive' : ''} ${selected ? '!bg-primary/[0.06] !border-l-primary/60' : ''} ${isRecent ? 'bg-[hsl(var(--chart-2)/.06)]' : 'animate-group-expand'} ${isFocused ? 'ring-2 ring-inset ring-primary/40 bg-primary/[0.04]' : ''}`}>
        {/* Item 11: Drag handle */}
        <TableCell className="w-6 px-1" onClick={e => e.stopPropagation()}>
          {canWrite && <div draggable onDragStart={handleDragStart} className="cursor-grab active:cursor-grabbing opacity-0 group-hover:opacity-60 transition-opacity">
            <GripVertical className="size-3.5 text-muted-foreground" />
          </div>}
        </TableCell>
        <TableCell className="w-8 px-2" onClick={e => e.stopPropagation()}>
          {canWrite && <input type="checkbox" checked={!!selected} onChange={() => onToggleSelect(item.id)} aria-label="Select item"
            className="size-3.5 rounded border-border cursor-pointer accent-[hsl(var(--primary))]" />}
        </TableCell>
        <TableCell className="w-8 px-1" onClick={e => e.stopPropagation()}>
          <button onClick={() => onToggleStar?.(item.id)} className="cursor-pointer" aria-label="Star item">
            <Star className={`size-3.5 transition-colors ${isStarred ? 'fill-[hsl(var(--chart-4))] text-[hsl(var(--chart-4))]' : 'text-muted-foreground/30 hover:text-muted-foreground'} ${isRecent ? 'animate-ring-pulse rounded-full' : ''}`} />
          </button>
        </TableCell>
        {cols.map(c => {
          if (c.cmt) return (<TableCell key="cmt" className="px-1 text-center">
            <Button variant="ghost" size="icon" className="size-7 rounded-full" aria-label="Comments"
              onClick={e => { e.stopPropagation(); toggleCmt(item.id); }}>
              <MessageSquare className={`size-3.5 transition-all duration-200 ${isOpen ? 'text-primary fill-primary/20' : 'text-muted-foreground/40 group-hover:text-muted-foreground'}`} />
            </Button></TableCell>);
          if (c.shipCurrencySelect) return <ShipCurrencyCell key={c.key} item={item} getShipCurrency={getShipCurrency} onShipCurrencyChange={onShipCurrencyChange} py={py} canWrite={canWrite} />;
          if (c.badge && c.key === 'sourceType') return (
            <TableCell key={c.key} className={`${py} whitespace-nowrap`} onClick={e => e.stopPropagation()}>
              <SourceTypeBadge item={item} onSourceTypeChange={onSourceTypeChange} canWrite={canWrite} />
            </TableCell>);
          const val = c.get(item, effectiveRates, getShipCurrency);
          const widthStyle = colWidths?.[c.key] ? { width: `${colWidths[c.key]}px`, minWidth: `${colWidths[c.key]}px` } : undefined;
          // Item 5: Sticky name column
          if (c.bold && c.key === 'name') return (
            <TableCell key={c.key} style={widthStyle} className={`${py} whitespace-nowrap sticky left-0 bg-card z-[3] shadow-[2px_0_4px_-2px_rgba(0,0,0,0.06)] group-hover:bg-accent/50 transition-colors duration-150 ${selected ? '!bg-primary/[0.06]' : ''} ${isFocused ? '!bg-primary/[0.04]' : ''}`}>
              {renderCell(c, val, item)}
            </TableCell>);
          // Item 16: Inline editing
          const editable = EDITABLE_MAP[c.key];
          if (canWrite && editable && onInlineEdit) {
            const rawVal = item[editable.field];
            return (
              <TableCell key={c.key} style={widthStyle} className={`${py} whitespace-nowrap ${c.right ? 'text-right tabular-nums' : ''}`} onClick={e => e.stopPropagation()}>
                <InlineEditCell value={rawVal} type={editable.type} options={editable.options}
                  onSave={(v) => onInlineEdit(item.id, editable.field, v)}>
                  {renderCell(c, val, item)}
                </InlineEditCell>
                {/* Item 24: Contextual tooltip for buyingPrice */}
                {c.key === 'buyingPrice' && rawVal != null && (
                  <span className="text-[9px] text-muted-foreground/50 block mt-0.5">₱{Math.round(calcPhp(item)).toLocaleString()}</span>
                )}
              </TableCell>);
          }
          return (<TableCell key={c.key || c.label} style={widthStyle} className={`${py} whitespace-nowrap ${c.right ? 'text-right tabular-nums' : ''}`}>{renderCell(c, val, item)}</TableCell>);
        })}
        <TableCell className="w-8 px-1 sticky right-0 bg-card z-[3] group-hover:bg-accent/50 transition-colors duration-150" onClick={e => e.stopPropagation()}>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="size-7 rounded-full opacity-0 group-hover:opacity-100 focus-visible:opacity-100 transition-opacity" aria-label="Row actions">
                <MoreHorizontal className="size-3.5 text-muted-foreground" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-40">
              <DropdownMenuItem onClick={() => onSelect(item)} className="gap-2 text-xs"><Eye className="size-3.5" />View Details</DropdownMenuItem>
              {canWrite && onDuplicate && <DropdownMenuItem onClick={() => onDuplicate(item.id)} className="gap-2 text-xs"><Copy className="size-3.5" />Duplicate</DropdownMenuItem>}
              <DropdownMenuSeparator />
              {canWrite && onDelete && <DropdownMenuItem onClick={() => onDelete(item.id)} variant="destructive" className="gap-2 text-xs"><Trash2 className="size-3.5" />Delete</DropdownMenuItem>}
            </DropdownMenuContent>
          </DropdownMenu>
        </TableCell>
      </TableRow>
      {wasOpened.current && <TableRow className={`hover:bg-transparent bg-primary/[0.02] border-b-2 border-primary/10 ${isOpen ? '' : 'hidden'}`}>
        <TableCell colSpan={cols.length + 4} className="p-0"><Suspense fallback={<div className="px-4 py-3 text-xs text-muted-foreground">Loading comments…</div>}><CommentsPanel itemId={item.id} canWrite={canWrite} /></Suspense></TableCell></TableRow>}
    </React.Fragment>);
}

export const ItemRow = memo(ItemRowInner);
export default ItemRow;

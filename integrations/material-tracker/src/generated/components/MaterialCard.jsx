import React from 'react';
import { Badge } from '@material/components/ui/badge';
import { Button } from '@material/components/ui/button';
import { Star, MoreHorizontal, Eye, Copy, Trash2, Calendar, DollarSign, Package } from 'lucide-react';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator } from '@material/components/ui/dropdown-menu';
import { fmt } from '@material/generated/utils/calculations';
import { getDateProximity } from '@material/generated/utils/dateProximity';

const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : null;

export function MaterialCard({ item, onSelect, isStarred, onToggleStar, onDuplicate, onDelete, onSourceTypeChange, canWrite = false }) {
  const imp = item.sourceType === 'Import';
  const prox = item.dateRequired ? getDateProximity(item.dateRequired) : null;

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onSelect(item)}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onSelect(item); } }}
      className="bg-card rounded-xl border border-border/40 p-4 cursor-pointer
        hover:shadow-md hover:border-primary/30
        active:scale-[0.98] active:shadow-sm
        focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:outline-none
        transition-all duration-200 ease-out
        [content-visibility:auto] [contain-intrinsic-block-size:auto_160px]"
    >
      {/* Header row */}
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <h3 className="text-sm font-bold text-foreground font-[family-name:var(--font-heading)] truncate leading-tight">
            {item.name}
          </h3>
          {item.brand && (
            <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
              <Package className="size-3 shrink-0 opacity-50" />
              {item.brand}
            </p>
          )}
        </div>
        <div className="flex items-center gap-0.5 shrink-0">
          <button
            onClick={(e) => { e.stopPropagation(); onToggleStar?.(item.id); }}
            className="cursor-pointer p-1.5 -m-1 rounded-full hover:bg-muted/60 transition-colors active:scale-90"
            aria-label={isStarred ? 'Unstar item' : 'Star item'}
          >
            <Star className={`size-4 transition-all duration-200 ${isStarred ? 'fill-[hsl(var(--chart-4))] text-[hsl(var(--chart-4))] scale-110' : 'text-muted-foreground/30'}`} />
          </button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon"
                className="size-8 rounded-full"
                aria-label="Actions"
                onClick={e => e.stopPropagation()}>
                <MoreHorizontal className="size-4 text-muted-foreground" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-36">
              <DropdownMenuItem onClick={() => onSelect(item)} className="gap-2 text-xs">
                <Eye className="size-3.5" />View
              </DropdownMenuItem>
              {onDuplicate && (
                <DropdownMenuItem onClick={() => onDuplicate(item.id)} className="gap-2 text-xs">
                  <Copy className="size-3.5" />Duplicate
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              {onDelete && (
                <DropdownMenuItem onClick={() => onDelete(item.id)} className="gap-2 text-xs text-destructive">
                  <Trash2 className="size-3.5" />Delete
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Status badges */}
      <div className="mt-2.5 flex items-center gap-2 flex-wrap">
        {canWrite ? (
          <button
            onClick={(e) => { e.stopPropagation(); onSourceTypeChange?.(item.id, imp ? 'Local' : 'Import'); }}
            className="cursor-pointer active:scale-95 transition-transform"
            aria-label={`Toggle source to ${imp ? 'Local' : 'Import'}`}
          >
            <Badge variant="outline" className={`rounded-full text-[10px] px-2 py-0 h-[20px] gap-1 font-semibold border-0 transition-colors ${imp ? 'bg-[hsl(var(--chart-5)/.08)] text-[hsl(var(--chart-5))]' : 'bg-[hsl(var(--chart-2)/.08)] text-[hsl(var(--chart-2))]'}`}>
              <span className={`size-1.5 rounded-full transition-colors ${imp ? 'bg-[hsl(var(--chart-5))]' : 'bg-[hsl(var(--chart-2))]'}`} />
              {item.sourceType || '—'}
            </Badge>
          </button>
        ) : (
          <Badge variant="outline" className={`rounded-full text-[10px] px-2 py-0 h-[20px] gap-1 font-semibold border-0 ${imp ? 'bg-[hsl(var(--chart-5)/.08)] text-[hsl(var(--chart-5))]' : 'bg-[hsl(var(--chart-2)/.08)] text-[hsl(var(--chart-2))]'}`}>
            <span className={`size-1.5 rounded-full ${imp ? 'bg-[hsl(var(--chart-5))]' : 'bg-[hsl(var(--chart-2))]'}`} />
            {item.sourceType || '—'}
          </Badge>
        )}
        {prox && (
          <Badge variant="outline" className={`text-[9px] px-1.5 py-0 h-[16px] rounded-full font-bold border ${prox.cls}`}>
            {prox.label}
          </Badge>
        )}
      </div>

      {/* Data grid */}
      <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1.5">
        <div className="flex items-center gap-1.5">
          <DollarSign className="size-3 text-muted-foreground/40 shrink-0" />
          <span className="text-xs text-muted-foreground">Price:</span>
          <span className="text-xs font-semibold text-foreground tabular-nums">
            {fmt(item.buyingPrice) || '—'} {item.currency}
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-muted-foreground">Qty:</span>
          <span className="text-xs font-semibold text-foreground tabular-nums">
            {item.quantity || '—'}
          </span>
        </div>
        {item.dateRequired && (
          <div className="flex items-center gap-1.5 col-span-2">
            <Calendar className="size-3 text-muted-foreground/40 shrink-0" />
            <span className="text-xs text-foreground">{fmtDate(item.dateRequired)}</span>
          </div>
        )}
        {item.vendorDetails && (
          <div className="col-span-2 text-[11px] text-muted-foreground truncate mt-0.5">
            {item.vendorDetails}
          </div>
        )}
      </div>
    </div>
  );
}

export default MaterialCard;

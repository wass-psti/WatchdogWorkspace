import React from 'react';
import { Button } from '@material/components/ui/button';
import { Badge } from '@material/components/ui/badge';
import { Trash2, ArrowRightLeft, X, MapPin, Globe } from 'lucide-react';

export function BulkActionBar({ selectedIds, onClear, onDelete, onMove, onBulkSourceType }) {
  const count = selectedIds.size;
  if (!count) return null;
  return (
    <div className="sticky bottom-4 mx-5 z-10 no-pdf animate-slide-up-in">
      <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-card/95 backdrop-blur-md border border-border/60 shadow-xl flex-wrap">
        <Badge className="rounded-full px-2.5 h-6 text-[11px] font-bold bg-primary text-primary-foreground shadow-sm">
          {count}
        </Badge>
        <span className="text-sm font-medium text-foreground">selected</span>
        <div className="flex-1" />
        {onBulkSourceType && (
          <>
            <Button size="sm" variant="outline" onClick={() => onBulkSourceType(selectedIds, 'Local')}
              className="gap-1.5 rounded-full px-3 h-8 text-xs font-semibold hover:bg-[hsl(var(--chart-2)/.08)] hover:border-[hsl(var(--chart-2)/.3)] transition-colors">
              <MapPin className="size-3" />Local
            </Button>
            <Button size="sm" variant="outline" onClick={() => onBulkSourceType(selectedIds, 'Import')}
              className="gap-1.5 rounded-full px-3 h-8 text-xs font-semibold hover:bg-[hsl(var(--chart-5)/.08)] hover:border-[hsl(var(--chart-5)/.3)] transition-colors">
              <Globe className="size-3" />Import
            </Button>
            <div className="w-px h-5 bg-border/60" />
          </>
        )}
        <Button size="sm" variant="outline" onClick={() => onMove(selectedIds, 'new_group')}
          className="gap-1.5 rounded-full px-3 h-8 text-xs font-semibold hidden sm:inline-flex">
          <ArrowRightLeft className="size-3" />→ Engineering
        </Button>
        <Button size="sm" variant="outline" onClick={() => onMove(selectedIds, 'topics')}
          className="gap-1.5 rounded-full px-3 h-8 text-xs font-semibold hidden sm:inline-flex">
          <ArrowRightLeft className="size-3" />→ Quotation
        </Button>
        {/* Mobile: Combined move button */}
        <div className="sm:hidden flex gap-1">
          <Button size="sm" variant="outline" onClick={() => onMove(selectedIds, 'new_group')}
            className="gap-1 rounded-full px-2.5 h-8 text-[11px] font-semibold">
            <ArrowRightLeft className="size-3" />Eng.
          </Button>
          <Button size="sm" variant="outline" onClick={() => onMove(selectedIds, 'topics')}
            className="gap-1 rounded-full px-2.5 h-8 text-[11px] font-semibold">
            <ArrowRightLeft className="size-3" />Quot.
          </Button>
        </div>
        <div className="w-px h-5 bg-border/60" />
        <Button size="sm" variant="outline" onClick={() => onDelete(selectedIds)}
          className="gap-1.5 rounded-full px-3 h-8 text-xs font-semibold text-destructive border-destructive/30 hover:bg-destructive/10 hover:border-destructive/50 transition-colors">
          <Trash2 className="size-3" />Delete
        </Button>
        <Button size="icon" variant="ghost" onClick={onClear}
          className="size-8 rounded-full shrink-0 hover:bg-muted transition-colors"
          aria-label="Clear selection">
          <X className="size-3.5" />
        </Button>
      </div>
    </div>
  );
}
export default BulkActionBar;

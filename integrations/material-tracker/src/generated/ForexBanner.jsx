import React from 'react';
import { Badge } from '@material/components/ui/badge';
import { Skeleton } from '@material/components/ui/skeleton';
import { ArrowRightLeft, TrendingUp } from 'lucide-react';

const fmt = (v) => v != null
  ? v.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  : '—';

export function ForexBanner({ rates, loading }) {
  if (loading) return (
    <div className="flex gap-3">
      <Skeleton className="h-8 w-48 rounded-lg" />
      <Skeleton className="h-8 w-48 rounded-lg" />
    </div>
  );
  if (!rates?.usd && !rates?.eur) return null;
  return (
    <div className="flex flex-wrap items-center gap-2 sm:gap-3 px-3 py-2 rounded-lg border border-border/30 bg-muted/20">
      <div className="flex items-center gap-1.5 text-xs sm:text-sm text-muted-foreground">
        <ArrowRightLeft className="size-3 sm:size-3.5" />
        <span className="hidden sm:inline">Exchange Rates:</span>
        <span className="sm:hidden">Rates:</span>
      </div>
      {rates.usd != null && (
        <Badge variant="outline" className="bg-[hsl(var(--chart-2)/0.06)] border-[hsl(var(--chart-2)/0.2)] text-xs gap-1 transition-all hover:bg-[hsl(var(--chart-2)/0.1)]">
          <TrendingUp className="size-3 text-[hsl(var(--chart-2))]" />
          USD → ₱{fmt(rates.usd)}
        </Badge>
      )}
      {rates.eur != null && (
        <Badge variant="outline" className="bg-[hsl(var(--chart-4)/0.06)] border-[hsl(var(--chart-4)/0.2)] text-xs gap-1 transition-all hover:bg-[hsl(var(--chart-4)/0.1)]">
          <TrendingUp className="size-3 text-[hsl(var(--chart-4))]" />
          EUR → ₱{fmt(rates.eur)}
        </Badge>
      )}
    </div>
  );
}

export default ForexBanner;

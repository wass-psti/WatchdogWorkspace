import React, { useState, Suspense } from 'react';
import { Card, CardContent } from '@material/components/ui/card';
import { Skeleton } from '@material/components/ui/skeleton';
import { Button } from '@material/components/ui/button';
import { Package, TrendingUp, MapPin, Globe, DollarSign, Euro, ChevronUp, ChevronDown } from 'lucide-react';
import { useAnimatedNumber } from '@material/generated/hooks/useAnimatedNumber';
import { useHistoricalTrend } from '@material/generated/hooks/useHistoricalTrend';

// Tier 3 Fix #19: Lazy-load Recharts so ~40KB chunk loads after first paint
const LazyPieChartWrapper = React.lazy(() => import('@material/generated/components/PieChartWrapper'));

const fmtRate = (v) => v != null ? `₱${v.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '—';

function AnimatedCount({ value }) {
  const animated = useAnimatedNumber(typeof value === 'number' ? value : 0, 700);
  if (typeof value !== 'number') return <span>{value ?? '—'}</span>;
  return <span>{animated.toLocaleString()}</span>;
}
function AnimatedCurrency({ value, formatFn }) {
  const animated = useAnimatedNumber(typeof value === 'number' ? value : 0, 700);
  if (value == null) return <span>—</span>;
  return <span>{formatFn(animated)}</span>;
}

// Item 18: SVG Sparkline
function Sparkline({ data, width = 56, height = 20 }) {
  if (!data?.length || data.length < 2) return null;
  const max = Math.max(...data), min = Math.min(...data);
  const range = max - min || 1;
  const pts = data.map((v, i) => `${(i / (data.length - 1)) * width},${height - ((v - min) / range) * (height - 4) - 2}`).join(' ');
  const up = data[data.length - 1] >= data[0];
  return (
    <svg width={width} height={height} className="inline-block ml-1 opacity-60">
      <polyline points={pts} fill="none" stroke={up ? 'hsl(var(--chart-2))' : 'hsl(var(--chart-4))'} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// Item 12: Cost breakdown mini-chart
function CostBreakdownChart({ bySource }) {
  if (!bySource?.length) return null;
  const data = bySource.filter(s => s.totalBuying > 0).map(s => ({
    name: s.sourceType || 'Unknown',
    value: s.totalBuying || 0,
    fill: s.sourceType === 'Local' ? 'hsl(var(--chart-2))' : 'hsl(var(--chart-5))',
  }));
  if (!data.length) return null;
  const total = data.reduce((s, d) => s + d.value, 0);
  const formatCurrency = (v) => v >= 1000000 ? `${(v / 1000000).toFixed(1)}M` : v >= 1000 ? `${(v / 1000).toFixed(0)}K` : v.toFixed(0);
  return (
    <Card className="border border-border/40 shadow-none col-span-2 md:col-span-2 lg:col-span-2">
      <CardContent className="p-4 flex items-center gap-4">
        <div className="size-[72px] shrink-0">
          <Suspense fallback={<Skeleton className="size-[72px] rounded-full" />}>
            <LazyPieChartWrapper data={data} />
          </Suspense>
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1.5">Cost by Source</p>
          {data.map(d => (
            <div key={d.name} className="flex items-center gap-1.5 mb-0.5">
              <span className="size-2 rounded-full shrink-0" style={{ backgroundColor: d.fill }} />
              <span className="text-[11px] text-muted-foreground">{d.name}:</span>
              <span className="text-[11px] font-semibold text-foreground">₱{formatCurrency(d.value)}</span>
              <span className="text-[9px] text-muted-foreground">({total > 0 ? Math.round(d.value / total * 100) : 0}%)</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export function KPISection({ data, loading, forexRates, sourceFilter, onFilterChange, isRefreshing }) {
  const [collapsed, setCollapsed] = useState(false);
  const { trendData } = useHistoricalTrend('5709787703');
  const totalItems = data?.totals?.count ?? 0;
  const totalBuying = data?.totals?.totalBuying ?? 0;
  const localCount = data?.bySource?.find(s => s.sourceType === 'Local')?.count ?? 0;
  const importCount = data?.bySource?.find(s => s.sourceType === 'Import')?.count ?? 0;
  const formatCurrency = (val) => { if (val >= 1000000) return `₱${(val / 1000000).toFixed(1)}M`; if (val >= 1000) return `₱${(val / 1000).toFixed(1)}K`; return `₱${val.toFixed(0)}`; };

  const metrics = [
    { label: 'Total Items', rawValue: totalItems, value: loading ? null : totalItems, icon: Package, color: 'text-[hsl(var(--chart-1))]', bg: 'bg-[hsl(var(--chart-1)/.08)]', isCount: true, showSparkline: true },
    { label: 'Total Buying', rawValue: totalBuying, value: loading ? null : formatCurrency(totalBuying), icon: TrendingUp, color: 'text-[hsl(var(--chart-2))]', bg: 'bg-[hsl(var(--chart-2)/.08)]', isCurrency: true },
    { label: 'Local', rawValue: localCount, value: loading ? null : localCount, icon: MapPin, color: 'text-[hsl(var(--chart-4))]', bg: 'bg-[hsl(var(--chart-4)/.08)]', filter: 'Local', isCount: true },
    { label: 'Import', rawValue: importCount, value: loading ? null : importCount, icon: Globe, color: 'text-[hsl(var(--chart-5))]', bg: 'bg-[hsl(var(--chart-5)/.08)]', filter: 'Import', isCount: true },
    { label: 'USD Rate', value: fmtRate(forexRates?.usd), icon: DollarSign, color: 'text-[hsl(var(--chart-2))]', bg: 'bg-[hsl(var(--chart-2)/.08)]' },
    { label: 'EUR Rate', value: fmtRate(forexRates?.eur), icon: Euro, color: 'text-[hsl(var(--chart-1))]', bg: 'bg-[hsl(var(--chart-1)/.08)]' },
  ];
  const handleClick = (m) => { if (!m.filter || !onFilterChange) return; onFilterChange(sourceFilter === m.filter ? 'all' : m.filter); };

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Key Metrics</span>
        <Button variant="ghost" size="sm" onClick={() => setCollapsed(c => !c)} className="h-6 px-2 text-[10px] text-muted-foreground gap-1">
          {collapsed ? <><ChevronDown className="size-3" />Show</> : <><ChevronUp className="size-3" />Hide</>}
        </Button>
      </div>
      {!collapsed && (
        <div className={`grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3 transition-opacity duration-500 ${isRefreshing ? 'opacity-60' : 'opacity-100'}`}>
          {metrics.map((m, i) => {
            if (m.value === null) return (
              <div key={m.label} className="h-[88px] rounded-xl animate-shimmer" />
            );
            const active = m.filter && sourceFilter === m.filter;
            return (
              <Card key={m.label} onClick={() => handleClick(m)}
                className={`border shadow-none animate-kpi-entrance transition-all duration-200 ${m.filter ? 'cursor-pointer hover:shadow-md hover:border-primary/30 hover:-translate-y-0.5 active:translate-y-0 active:shadow-sm' : 'border-border/60'} ${active ? 'border-primary/50 ring-1 ring-primary/20 shadow-md -translate-y-0.5' : ''}`}
                style={{ animationDelay: `${i * 60}ms` }}>
                <CardContent className="p-3">
                  <div className="flex items-center gap-2.5">
                    <div className={`flex items-center justify-center size-8 rounded-lg ${m.bg} transition-transform duration-200 ${active ? 'scale-110' : ''}`}>
                      <m.icon className={`size-3.5 ${m.color}`} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[10px] text-muted-foreground truncate font-medium">{m.label}</p>
                      <div className="flex items-center">
                        <p className="text-base font-semibold text-foreground truncate font-[family-name:var(--font-heading)]">
                          {m.isCount ? <AnimatedCount value={m.rawValue} /> : m.isCurrency ? <AnimatedCurrency value={m.rawValue} formatFn={formatCurrency} /> : m.value}
                        </p>
                        {m.showSparkline && trendData && <Sparkline data={trendData} />}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
          {/* Item 12: Cost breakdown chart */}
          <CostBreakdownChart bySource={data?.bySource} />
        </div>
      )}
    </div>
  );
}
export default KPISection;

import React, { useMemo, useRef, memo } from 'react';
import { Calculator, Clock, AlertTriangle, TrendingUp, Coins } from 'lucide-react';
import { calcPhp } from '@material/generated/utils/calculations';

// P4 Fix: Full-pass fingerprint replaces stride-based sampling.
// The stride approach missed inline edits on non-sampled rows (items between sample points),
// causing stale footer totals. Since we only hash 3 numeric fields per item, the O(n)
// pass is negligible (<1ms for 500 items) and guarantees correctness.
// P5 Fix: Fingerprint must include ALL fields used by the stats computation.
// Previously omitted leadtimeInWeeks and dateRequired, causing stale "Avg Lead"
// and "Overdue" counts after inline-editing leadtime or updating dates in the
// detail panel. Adding exRateUsd/exRateEur too since calcPhp depends on them.
function computeFingerprint(items) {
  if (!items.length) return '';
  const parts = [items.length];
  for (let i = 0; i < items.length; i++) {
    const it = items[i];
    parts.push(
      it.buyingPrice ?? 'n',
      it.quantity ?? 'n',
      it.currency ?? 'n',
      it.leadtimeInWeeks ?? 'n',
      it.dateRequired ? (typeof it.dateRequired === 'string' ? it.dateRequired : it.dateRequired.toISOString()) : 'n',
      it.exRateUsd ?? 'n',
      it.exRateEur ?? 'n'
    );
  }
  return parts.join('|');
}

function TableFooterStatsInner({ items }) {
  const prevStatsRef = useRef(null);
  const prevFingerprintRef = useRef('');

  const stats = useMemo(() => {
    if (!items.length) return null;
    const fp = computeFingerprint(items);
    if (fp === prevFingerprintRef.current && prevStatsRef.current) {
      return prevStatsRef.current;
    }
    prevFingerprintRef.current = fp;

    // P2 Fix: Convert all buying prices to PHP before summing
    const totalCostPhp = items.reduce((s, i) => {
      const phpValue = calcPhp(i) || 0;
      return s + phpValue * (i.quantity || 1);
    }, 0);

    const withLead = items.filter(i => i.leadtimeInWeeks != null && i.leadtimeInWeeks > 0);
    const avgLead = withLead.length ? (withLead.reduce((s, i) => s + i.leadtimeInWeeks, 0) / withLead.length).toFixed(1) : null;
    // P4 Fix: Normalize overdue comparison to midnight — matches getDateProximity & ItemsTable logic
    const nowMidnight = new Date();
    nowMidnight.setHours(0, 0, 0, 0);
    const overdueCount = items.filter(i => {
      if (!i.dateRequired) return false;
      const d = new Date(i.dateRequired);
      d.setHours(0, 0, 0, 0);
      return d < nowMidnight;
    }).length;
    const totalQty = items.reduce((s, i) => s + (i.quantity || 0), 0);
    const currMap = {};
    items.forEach(i => { const c = i.currency || 'N/A'; currMap[c] = (currMap[c] || 0) + 1; });
    const currencies = Object.entries(currMap).sort((a, b) => b[1] - a[1]);
    const result = { totalCostPhp, avgLead, overdueCount, totalQty, currencies };
    prevStatsRef.current = result;
    return result;
  }, [items]);

  if (!stats) return null;

  const fmtCost = (v) => {
    if (v >= 1000000) return `₱${(v / 1000000).toFixed(1)}M`;
    if (v >= 1000) return `₱${(v / 1000).toFixed(1)}K`;
    return `₱${v.toFixed(0)}`;
  };

  return (
    <div className="flex items-center gap-4 flex-wrap">
      <Stat icon={TrendingUp} label="Total (PHP)" value={fmtCost(stats.totalCostPhp)} color="text-[hsl(var(--chart-1))]" />
      <Stat icon={Calculator} label="Total Qty" value={stats.totalQty} color="text-[hsl(var(--chart-2))]" />
      {stats.avgLead && <Stat icon={Clock} label="Avg Lead" value={`${stats.avgLead} wks`} color="text-[hsl(var(--chart-4))]" />}
      {stats.overdueCount > 0 && <Stat icon={AlertTriangle} label="Overdue" value={stats.overdueCount} color="text-destructive" />}
      {stats.currencies.length > 1 && (
        <Stat icon={Coins} label="By Currency"
          value={stats.currencies.map(([c, n]) => `${n} ${c}`).join(' · ')}
          color="text-[hsl(var(--chart-5))]" />
      )}
    </div>
  );
}

function Stat({ icon: Icon, label, value, color }) {
  return (
    <div className="flex items-center gap-1.5">
      <Icon className={`size-3 ${color}`} />
      <span className="text-[10px] text-muted-foreground">{label}:</span>
      <span className="text-[11px] font-bold text-foreground">{value}</span>
    </div>
  );
}

export const TableFooterStats = memo(TableFooterStatsInner);
export default TableFooterStats;

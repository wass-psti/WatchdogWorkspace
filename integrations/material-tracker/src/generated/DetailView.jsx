import React from 'react';
import { Button } from '@material/components/ui/button';
import { Badge } from '@material/components/ui/badge';
import { Separator } from '@material/components/ui/separator';
import { Pencil, Trash2, Loader2, Tag, DollarSign, Calculator, Clock, Building2, ArrowRightLeft, Copy } from 'lucide-react';
import { SectionLabel } from '@material/generated/FormComponents';
import { fmt, calcLanded, calcTotalLanded, calcTotalCostVatin, calcSelling } from '@material/generated/utils/calculations';

const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—';

export function DetailView({ item, onEdit, onDelete, deleting, onMove, onDuplicate, duplicating, canWrite = false }) {
  const f = (label, val) => (
    <div className="pl-3 border-l-2 border-primary/10">
      <p className="text-[10px] font-bold text-muted-foreground/70 uppercase tracking-[0.1em]">{label}</p>
      <p className="text-[13px] font-medium text-foreground mt-0.5 whitespace-pre-wrap leading-relaxed">{val ?? '—'}</p>
    </div>
  );
  const imp = item.sourceType === 'Import';
  const targetGroup = item.group?.id === 'new_group' ? 'topics' : 'new_group';
  const targetLabel = targetGroup === 'new_group' ? 'Engineering' : 'Quotation';
  return (
    <div>
      <div className="px-6 py-5">
        <SectionLabel icon={Tag} label="Identification" />
        <div className="grid grid-cols-2 gap-x-6 gap-y-4 mt-3">
          {f('Part Number', item.name)}
          <div className="pl-3 border-l-2 border-primary/10">
            <p className="text-[10px] font-bold text-muted-foreground/70 uppercase tracking-[0.1em]">Source Type</p>
            <Badge variant="outline" className={`mt-1 rounded-full text-[11px] px-2.5 py-0 h-[22px] gap-1.5 font-semibold border-0 ${
              imp ? 'bg-[hsl(var(--chart-5)/.08)] text-[hsl(var(--chart-5))]' : 'bg-[hsl(var(--chart-2)/.08)] text-[hsl(var(--chart-2))]'}`}>
              <span className={`size-1.5 rounded-full shrink-0 ${imp ? 'bg-[hsl(var(--chart-5))]' : 'bg-[hsl(var(--chart-2))]'}`} />
              {item.sourceType || '—'}
            </Badge>
          </div>
          {f('RFQ Ref No', item.rfqRefNo)}
        </div>
        <div className="mt-4">{f('Material Description', item.materialDescription)}</div>
        <div className="grid grid-cols-2 gap-x-6 gap-y-4 mt-4">{f('Brand', item.brand)}{f('Quantity', item.quantity)}</div>
      </div>
      <Separator className="opacity-30" />
      <div className="px-6 py-5">
        <SectionLabel icon={Building2} label="Supplier & Schedule" />
        <div className="grid grid-cols-2 gap-x-6 gap-y-4 mt-3">
          {f('Vendor Details', item.vendorDetails)}{f('Date Required', fmtDate(item.dateRequired))}
          {f('Account', item.accounts?.linkedItems?.map(x => x.name).join(', '))}
          {f('Supplier PO', item.supplierPoNo?.linkedItems?.map(x => x.name).join(', '))}
        </div>
      </div>
      <Separator className="opacity-30" />
      <div className="px-6 py-5">
        <SectionLabel icon={DollarSign} label="Pricing & Cost" />
        <div className="grid grid-cols-2 gap-x-6 gap-y-4 mt-3">
          {f('Buying Price', fmt(item.buyingPrice))}{f('Currency', item.currency)}
          {f('Shipping Cost', fmt(item.shippingCost))}{f('Ship. Currency', item.shippingCostCurrency || 'PHP')}
          <div className="col-span-2">{f('Selling Price (VAT-EX)', fmt(calcSelling(item, item.shippingCostCurrency)))}</div>
        </div>
      </div>
      <Separator className="opacity-30" />
      <div className="px-6 py-5">
        <SectionLabel icon={Calculator} label="Calculated Totals" />
        <div className="mt-3 rounded-xl bg-gradient-to-br from-muted/40 to-muted/10 border border-border/30 p-4 grid grid-cols-2 gap-x-6 gap-y-3">
          {f('Landed Buying Cost', fmt(calcLanded(item, item.shippingCostCurrency)))}{f('Total Landed Buying', fmt(calcTotalLanded(item, item.shippingCostCurrency)))}
        </div>
      </div>
      <Separator className="opacity-30" />
      <div className="px-6 py-5">
        <SectionLabel icon={Clock} label="Logistics" />
        <div className="mt-3">{f('Leadtime (weeks)', item.leadtimeInWeeks)}</div>
        {/* Item 21: Animated progress timeline for leadtime */}
        {item.leadtimeInWeeks > 0 && item.createdAt && (() => {
          const elapsedWeeks = (Date.now() - new Date(item.createdAt).getTime()) / (7 * 24 * 60 * 60 * 1000);
          const progress = Math.min(elapsedWeeks / item.leadtimeInWeeks, 1);
          const barColor = progress >= 1 ? 'hsl(var(--destructive))' : progress > 0.75 ? 'hsl(var(--chart-4))' : 'hsl(var(--primary))';
          return (
            <div className="mt-3 pl-3 border-l-2 border-primary/10">
              <p className="text-[10px] font-bold text-muted-foreground/70 uppercase tracking-[0.1em] mb-1.5">Leadtime Progress</p>
              <div className="h-2.5 rounded-full bg-muted overflow-hidden">
                <div className="h-full rounded-full transition-all duration-1000 ease-out"
                  style={{ width: `${progress * 100}%`, backgroundColor: barColor }} />
              </div>
              <div className="flex justify-between mt-1">
                <span className="text-[10px] text-muted-foreground">{elapsedWeeks.toFixed(1)} of {item.leadtimeInWeeks} weeks</span>
                <span className={`text-[10px] font-semibold ${progress >= 1 ? 'text-destructive' : 'text-foreground'}`}>{Math.round(progress * 100)}%</span>
              </div>
            </div>
          );
        })()}
      </div>
      {canWrite && (
        <div className="px-6 py-4 border-t border-border/40 bg-gradient-to-r from-muted/30 to-transparent flex items-center gap-2 sticky bottom-0 flex-wrap">
          <Button size="sm" onClick={onEdit} className="gap-1.5 rounded-full px-5 h-8 font-semibold shadow-sm">
            <Pencil className="size-3.5" />Edit</Button>
          <Button size="sm" variant="outline" onClick={onDuplicate} disabled={duplicating}
            className="gap-1.5 rounded-full px-4 h-8 font-semibold">
            {duplicating ? <Loader2 className="size-3.5 animate-spin" /> : <Copy className="size-3.5" />}Duplicate</Button>
          <Button size="sm" variant="outline" onClick={() => onMove(targetGroup)}
            className="gap-1.5 rounded-full px-4 h-8 font-semibold"><ArrowRightLeft className="size-3.5" />→ {targetLabel}</Button>
          <Button size="sm" variant="outline" onClick={onDelete} disabled={deleting}
            className="gap-1.5 rounded-full px-4 h-8 font-semibold text-destructive border-destructive/30 hover:bg-destructive/10">
            {deleting ? <Loader2 className="size-3.5 animate-spin" /> : <Trash2 className="size-3.5" />}Delete</Button>
        </div>
      )}
    </div>
  );
}
export default DetailView;

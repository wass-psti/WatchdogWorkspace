import React, { useState } from 'react';
import { Button } from '@material/components/ui/button';
import { Input } from '@material/components/ui/input';
import { Textarea } from '@material/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@material/components/ui/select';
import { Separator } from '@material/components/ui/separator';
import { Package, Loader2, Plus, Tag, DollarSign, Info, Building2 } from 'lucide-react';
import { createItemAtTop } from '@material/generated/helpers/createItemAtTop';
import { SectionLabel, Field } from '@material/generated/FormComponents';
import { toast } from 'sonner';

const ic = "bg-background rounded-xl h-10 border-border/50 shadow-sm focus-visible:border-primary/40 focus-visible:ring-primary/20";
const EMPTY = { name: '', group: 'new_group', sourceType: '', materialDescription: '', brand: '', quantity: '', buyingPrice: '', currency: '', rfqRefNo: '', vendorDetails: '', dateRequired: '', shippingCost: '', shippingCostCurrency: 'PHP', leadtimeInWeeks: '' };

export function AddItemForm({ onCreated, forexRates }) {
  const [form, setForm] = useState({ ...EMPTY });
  const [saving, setSaving] = useState(false);
  const u = (k, v) => setForm(f => ({ ...f, [k]: v }));
  // P3 Fix: Validate numeric fields are positive — reject negative quantities and prices
  const valid = form.name.trim() && form.sourceType && form.materialDescription.trim() && form.brand.trim()
    && form.quantity && Number(form.quantity) > 0
    && form.buyingPrice && Number(form.buyingPrice) > 0
    && form.currency;
  const handleSubmit = async (e) => { e.preventDefault(); if (!valid) return;
    setSaving(true);
    try {
      const p = { name: form.name.trim(), sourceType: form.sourceType, materialDescription: form.materialDescription.trim(),
        brand: form.brand.trim(), quantity: Number(form.quantity), buyingPrice: Number(form.buyingPrice), currency: form.currency };
      if (form.rfqRefNo.trim()) p.rfqRefNo = form.rfqRefNo.trim();
      if (form.vendorDetails.trim()) p.vendorDetails = form.vendorDetails.trim();
      if (form.dateRequired) p.dateRequired = new Date(form.dateRequired);
      if (form.shippingCost) p.shippingCost = Number(form.shippingCost);
      if (form.shippingCostCurrency) p.shippingCostCurrency = form.shippingCostCurrency;
      if (form.leadtimeInWeeks) p.leadtimeInWeeks = Number(form.leadtimeInWeeks);
      if (forexRates?.usd != null) p.exRateUsd = String(forexRates.usd.toFixed(2));  if (forexRates?.eur != null) p.exRateEur = String(forexRates.eur.toFixed(2));
      const newItem = await createItemAtTop({ ...p, group: form.group });
      setForm({ ...EMPTY }); onCreated?.(newItem);
    } catch (err) { console.error('Create failed:', err); toast.error('Failed to add material'); } finally { setSaving(false); }
  };
  const panel = "mt-2 rounded-xl bg-muted/[0.06] border border-border/20 p-4 space-y-4";
  return (
    <div className="max-w-2xl rounded-2xl border border-border/40 bg-card shadow-lg overflow-hidden">
      <div className="h-[2px] bg-gradient-to-r from-primary via-[hsl(var(--chart-5))] to-transparent" />
      <div className="px-4 sm:px-6 py-5 border-b border-border/40 bg-gradient-to-br from-primary/[0.05] via-[hsl(var(--chart-5)/.02)] to-transparent flex items-center gap-3">
        <div className="size-11 rounded-xl bg-gradient-to-br from-primary/15 to-primary/5 border border-primary/10 shadow-sm flex items-center justify-center shrink-0"><Package className="size-5 text-primary" /></div>
        <div><h2 className="text-lg font-bold text-foreground font-[family-name:var(--font-heading)]">New Material</h2><p className="text-xs text-muted-foreground mt-0.5">Fill in the required details</p></div></div>
      <form onSubmit={handleSubmit}>
        <div className="px-4 sm:px-6 py-5">
          <SectionLabel icon={Tag} label="Identification" />
          <div className={panel}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Item Name" required><Input value={form.name} onChange={e => u('name', e.target.value)} className={ic} placeholder="Part number" /></Field>
              <Field label="Group"><Select value={form.group} onValueChange={v => u('group', v)}>
                <SelectTrigger className={ic}><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="topics">Items for Quotation</SelectItem><SelectItem value="new_group">Engineering Services</SelectItem></SelectContent></Select></Field>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Source Type" required><Select value={form.sourceType} onValueChange={v => u('sourceType', v)}>
                <SelectTrigger className={ic}><SelectValue placeholder="Select..." /></SelectTrigger>
                <SelectContent><SelectItem value="Local">Local</SelectItem><SelectItem value="Import">Import</SelectItem></SelectContent></Select></Field>
              <Field label="Brand" required><Input value={form.brand} onChange={e => u('brand', e.target.value)} className={ic} placeholder="Manufacturer" /></Field>
            </div>
            <Field label="Material Description" required>
              <Textarea value={form.materialDescription} onChange={e => u('materialDescription', e.target.value)} rows={3}
                className="bg-background rounded-xl border-border/50 shadow-sm min-h-[80px] focus-visible:border-primary/40" placeholder="Full material specification..." />
            </Field>
          </div>
        </div>
        <Separator className="opacity-30" />
        <div className="px-4 sm:px-6 py-5">
          <SectionLabel icon={DollarSign} label="Pricing & Cost" />
          <div className={panel}>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
              <Field label="Quantity" required><Input type="number" min="1" value={form.quantity} onChange={e => u('quantity', e.target.value)} className={ic} placeholder="0" /></Field>
              <Field label="Buying Price" required><Input type="number" min="0" step="0.01" value={form.buyingPrice} onChange={e => u('buyingPrice', e.target.value)} className={ic} placeholder="0.00" /></Field>
              <Field label="Currency" required><Select value={form.currency} onValueChange={v => u('currency', v)}>
                <SelectTrigger className={ic}><SelectValue placeholder="Select..." /></SelectTrigger>
                <SelectContent><SelectItem value="PHP">PHP</SelectItem><SelectItem value="USD">USD</SelectItem><SelectItem value="EUR">EUR</SelectItem></SelectContent></Select></Field>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
              <Field label="Shipping Cost"><Input type="number" step="0.01" value={form.shippingCost} onChange={e => u('shippingCost', e.target.value)} className={ic} placeholder="0.00" /></Field>
              <Field label="Ship. Currency"><Select value={form.shippingCostCurrency} onValueChange={v => u('shippingCostCurrency', v)}>
                <SelectTrigger className={ic}><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="PHP">PHP</SelectItem><SelectItem value="USD">USD</SelectItem><SelectItem value="EUR">EUR</SelectItem></SelectContent></Select></Field>
              <Field label="Leadtime (weeks)"><Input type="number" value={form.leadtimeInWeeks} onChange={e => u('leadtimeInWeeks', e.target.value)} className={ic} placeholder="e.g. 4" /></Field>
            </div>
            {forexRates?.usd != null && <div className="flex items-center gap-2 text-[11px] text-muted-foreground pt-2 border-t border-border/20"><Info className="size-3 shrink-0" /><span>Rates: USD ₱{forexRates.usd.toFixed(2)} · EUR ₱{forexRates.eur?.toFixed(2) ?? '—'}</span></div>}
          </div>
        </div>
        <Separator className="opacity-30" />
        <div className="px-4 sm:px-6 py-5">
          <SectionLabel icon={Building2} label="Supplier & Schedule" />
          <div className={panel}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Vendor Details"><Input value={form.vendorDetails} onChange={e => u('vendorDetails', e.target.value)} className={ic} placeholder="Supplier" /></Field>
              <Field label="Date Required"><Input type="date" value={form.dateRequired} onChange={e => u('dateRequired', e.target.value)} className={ic} /></Field>
            </div>
            <Field label="RFQ Ref No"><Input value={form.rfqRefNo} onChange={e => u('rfqRefNo', e.target.value)} className={ic} placeholder="Reference number" /></Field>
          </div>
        </div>
        <div className="px-4 sm:px-6 py-4 border-t border-border/40 bg-gradient-to-r from-muted/30 to-transparent flex items-center gap-3">
          <Button type="submit" disabled={saving || !valid} className="gap-1.5 rounded-full px-6 h-10 font-semibold shadow-sm hover:shadow-md transition-all duration-200 active:scale-95">{saving ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4" />}Add Material</Button>
        </div>
      </form>
    </div>
  );
}
export default AddItemForm;

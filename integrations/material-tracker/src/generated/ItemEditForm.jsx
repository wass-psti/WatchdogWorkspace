import React, { useState } from 'react';
import { Button } from '@material/components/ui/button';
import { Input } from '@material/components/ui/input';
import { Textarea } from '@material/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@material/components/ui/select';
import { Separator } from '@material/components/ui/separator';
import { Save, X, Loader2, Tag, DollarSign, Clock, PenLine } from 'lucide-react';
import BoardSDK from '@material/api/BoardSDK.js';
import { SectionLabel, Field } from '@material/generated/FormComponents';
import { toast } from 'sonner';

const board = new BoardSDK();
const ic = "bg-background rounded-xl h-10 border-border/50 shadow-sm focus-visible:border-primary/40 focus-visible:ring-primary/20";

export function ItemEditForm({ item, onUpdated, onDone }) {
  const [form, setForm] = useState({
    name: item.name || '', sourceType: item.sourceType || '',
    materialDescription: item.materialDescription || '', brand: item.brand || '',
    quantity: item.quantity ?? '', buyingPrice: item.buyingPrice ?? '',
    currency: item.currency || '', shippingCost: item.shippingCost ?? '', shippingCostCurrency: item.shippingCostCurrency || 'PHP',
    leadtimeInWeeks: item.leadtimeInWeeks ?? '', rfqRefNo: item.rfqRefNo || '',
    vendorDetails: item.vendorDetails || '',
    dateRequired: item.dateRequired ? new Date(item.dateRequired).toISOString().split('T')[0] : '',
  });
  const [saving, setSaving] = useState(false);
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  // P5 Fix: Prevent saving with an empty name — matches AddItemForm's validation
  const nameValid = form.name.trim().length > 0;
  const handleSave = async () => {
    if (!nameValid) return;
    setSaving(true); const prev = { ...item }; const u = {};
    if (form.name.trim() !== item.name) u.name = form.name.trim();
    if (form.sourceType && form.sourceType !== item.sourceType) u.sourceType = form.sourceType;
    if (form.materialDescription !== (item.materialDescription || '')) u.materialDescription = form.materialDescription;
    if (form.brand !== (item.brand || '')) u.brand = form.brand;
    // P2 Fix: Allow clearing numeric fields — detect when user blanks a field that previously had a value
    const numChanged = (formVal, itemVal) => {
      if (formVal === '' || formVal === null) return itemVal != null; // clearing a set value
      return Number(formVal) !== itemVal;
    };
    if (numChanged(form.quantity, item.quantity)) u.quantity = form.quantity === '' ? null : Number(form.quantity);
    if (numChanged(form.buyingPrice, item.buyingPrice)) u.buyingPrice = form.buyingPrice === '' ? null : Number(form.buyingPrice);
    if (form.currency && form.currency !== item.currency) u.currency = form.currency;
    if (numChanged(form.shippingCost, item.shippingCost)) u.shippingCost = form.shippingCost === '' ? null : Number(form.shippingCost);
    if (form.shippingCostCurrency && form.shippingCostCurrency !== (item.shippingCostCurrency || 'PHP')) u.shippingCostCurrency = form.shippingCostCurrency;
    if (numChanged(form.leadtimeInWeeks, item.leadtimeInWeeks)) u.leadtimeInWeeks = form.leadtimeInWeeks === '' ? null : Number(form.leadtimeInWeeks);
    if (form.rfqRefNo !== (item.rfqRefNo || '')) u.rfqRefNo = form.rfqRefNo;
    if (form.vendorDetails !== (item.vendorDetails || '')) u.vendorDetails = form.vendorDetails;
    const od = item.dateRequired ? new Date(item.dateRequired).toISOString().split('T')[0] : '';
    // P1 Fix: Allow clearing dates — previously falsy check blocked empty string from being detected as a change
    if (form.dateRequired !== od) {
      if (form.dateRequired) u.dateRequired = new Date(form.dateRequired);
      else if (item.dateRequired) u.dateRequired = null; // Clear the date
    }
    if (!Object.keys(u).length) { setSaving(false); onDone?.(); return; }
    onUpdated?.({ ...item, ...u });
    try { await board.item(item.id).update(u).execute(); toast.success('Changes saved'); onDone?.(); }
    catch (err) { console.error('Update failed:', err); onUpdated?.(prev); toast.error('Save failed — reverted'); }
    finally { setSaving(false); }
  };
  return (
    <div>
      <div className="px-6 py-3 flex items-center gap-2 border-b border-border/30 bg-[hsl(var(--chart-4)/.04)]"><PenLine className="size-3.5 text-[hsl(var(--chart-4))]" /><span className="text-[11px] font-bold text-[hsl(var(--chart-4))] uppercase tracking-wider">Editing</span></div>
      <div className="px-6 py-5 space-y-4">
        <SectionLabel icon={Tag} label="Identification" />
        <Field label="Part Number"><Input value={form.name} onChange={e => set('name', e.target.value)} className={ic} /></Field>
        <Field label="Source Type">
          <Select value={form.sourceType} onValueChange={v => set('sourceType', v)}>
            <SelectTrigger className={ic}><SelectValue /></SelectTrigger>
            <SelectContent><SelectItem value="Local">Local</SelectItem><SelectItem value="Import">Import</SelectItem></SelectContent>
          </Select>
        </Field>
        <Field label="Material Description">
          <Textarea value={form.materialDescription} onChange={e => set('materialDescription', e.target.value)}
            rows={3} className="bg-background rounded-xl border-border/50 shadow-sm min-h-[80px] focus-visible:border-primary/40" />
        </Field>
        <Field label="Brand"><Input value={form.brand} onChange={e => set('brand', e.target.value)} className={ic} /></Field>
      </div>
      <Separator className="opacity-30" />
      <div className="px-6 py-5 space-y-4">
        <SectionLabel icon={DollarSign} label="Pricing & Cost" />
        <div className="grid grid-cols-2 gap-4">
          <Field label="Quantity"><Input type="number" value={form.quantity} onChange={e => set('quantity', e.target.value)} className={ic} /></Field>
          <Field label="Buying Price"><Input type="number" value={form.buyingPrice} onChange={e => set('buyingPrice', e.target.value)} className={ic} /></Field>
        </div>
        <div className="grid grid-cols-3 gap-4">
          <Field label="Currency">
            <Select value={form.currency} onValueChange={v => set('currency', v)}>
              <SelectTrigger className={ic}><SelectValue /></SelectTrigger>
              <SelectContent><SelectItem value="PHP">PHP</SelectItem><SelectItem value="USD">USD</SelectItem><SelectItem value="EUR">EUR</SelectItem></SelectContent>
            </Select>
          </Field>
          <Field label="Shipping Cost"><Input type="number" value={form.shippingCost} onChange={e => set('shippingCost', e.target.value)} className={ic} /></Field>
          <Field label="Ship. Currency">
            <Select value={form.shippingCostCurrency} onValueChange={v => set('shippingCostCurrency', v)}>
              <SelectTrigger className={ic}><SelectValue /></SelectTrigger>
              <SelectContent><SelectItem value="PHP">PHP</SelectItem><SelectItem value="USD">USD</SelectItem><SelectItem value="EUR">EUR</SelectItem></SelectContent>
            </Select>
          </Field>
        </div>
      </div>
      <Separator className="opacity-30" />
      <div className="px-6 py-5 space-y-4">
        <SectionLabel icon={Clock} label="Logistics & Supplier" />
        <div className="grid grid-cols-2 gap-4">
          <Field label="Leadtime (weeks)"><Input type="number" value={form.leadtimeInWeeks} onChange={e => set('leadtimeInWeeks', e.target.value)} className={ic} /></Field>
          <Field label="Date Required"><Input type="date" value={form.dateRequired} onChange={e => set('dateRequired', e.target.value)} className={ic} /></Field>
        </div>
        <Field label="Vendor Details"><Input value={form.vendorDetails} onChange={e => set('vendorDetails', e.target.value)} className={ic} placeholder="Supplier name" /></Field>
        <Field label="RFQ Ref No"><Input value={form.rfqRefNo} onChange={e => set('rfqRefNo', e.target.value)} className={ic} placeholder="Reference number" /></Field>
      </div>
      <div className="px-6 py-4 border-t border-border/40 bg-gradient-to-r from-muted/30 to-transparent flex items-center gap-3 sticky bottom-0">
        <Button size="sm" onClick={handleSave} disabled={saving || !nameValid} className="gap-1.5 rounded-full px-5 h-8 font-semibold shadow-sm">{saving ? <Loader2 className="size-3.5 animate-spin" /> : <Save className="size-3.5" />}Save Changes</Button>
        <Button size="sm" variant="outline" onClick={onDone} className="gap-1.5 rounded-full px-5 h-8 font-semibold"><X className="size-3.5" />Cancel</Button>
      </div>
    </div>
  );
}
export default ItemEditForm;

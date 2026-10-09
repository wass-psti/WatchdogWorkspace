import { fmt, calcPhp, calcShippingPhp, calcLanded, calcTotalLanded, calcSelling, calcTotalCostVatin } from '@material/generated/utils/calculations';

const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—';

// P0 Fix: Sort helpers that use item's own shippingCostCurrency so sort order matches display
const getItemShipCur = (i) => i.shippingCostCurrency || 'PHP';

export const COLS = [
  { label: 'Part Number', key: 'name', get: (i) => i.name, bold: true, sortable: true, sortFn: (a, b) => (a.name || '').localeCompare(b.name || '') },
  { label: 'Created', key: 'createdAt', get: (i) => fmtDate(i.createdAt), sortable: true, sortFn: (a, b) => new Date(a.createdAt) - new Date(b.createdAt) },
  { label: '', key: 'cmt', cmt: true },
  { label: 'Selling Price (VAT-EX)', key: 'selling', get: (i, r, sc) => fmt(calcSelling(i, sc?.(i))), right: true, sortable: true,
    sortFn: (a, b) => (calcSelling(a, getItemShipCur(a)) || 0) - (calcSelling(b, getItemShipCur(b)) || 0) },
  { label: 'Requestor', key: 'creator', get: (i) => i.creator?.name },
  { label: 'Source Type', key: 'sourceType', get: (i) => i.sourceType, badge: true, sortable: true, sortFn: (a, b) => (a.sourceType || '').localeCompare(b.sourceType || '') },
  { label: 'RFQ Ref No', key: 'rfqRefNo', get: (i) => i.rfqRefNo },
  { label: 'Description', key: 'desc', get: (i) => i.materialDescription, truncate: true },
  { label: 'Brand', key: 'brand', get: (i) => i.brand, sortable: true, sortFn: (a, b) => (a.brand || '').localeCompare(b.brand || '') },
  { label: 'Vendor', key: 'vendor', get: (i) => i.vendorDetails, truncate: true, sortable: true, sortFn: (a, b) => (a.vendorDetails || '').localeCompare(b.vendorDetails || '') },
  { label: 'Account', key: 'account', get: (i) => i.accounts?.linkedItems?.map(x => x.name).join(', '), truncate: true },
  { label: 'Supplier PO', key: 'supplierPo', get: (i) => i.supplierPoNo?.linkedItems?.map(x => x.name).join(', '), truncate: true },
  { label: 'Qty', key: 'qty', get: (i) => i.quantity, right: true, sortable: true, sortFn: (a, b) => (a.quantity || 0) - (b.quantity || 0) },
  { label: 'Buying Price', key: 'buyingPrice', get: (i) => fmt(i.buyingPrice), right: true, sortable: true, sortFn: (a, b) => (a.buyingPrice || 0) - (b.buyingPrice || 0) },
  { label: 'Currency', key: 'currency', get: (i) => i.currency },
  { label: 'PHP Equiv', key: 'php', get: (i) => fmt(calcPhp(i)), right: true, sortable: true,
    sortFn: (a, b) => (calcPhp(a) || 0) - (calcPhp(b) || 0) },
  { label: 'Ex. USD', key: 'exUsd', get: (i, rates) => fmt(rates?.usd), right: true },
  { label: 'Ex. EUR', key: 'exEur', get: (i, rates) => fmt(rates?.eur), right: true },
  { label: 'Shipping', key: 'shipping', get: (i) => fmt(i.shippingCost), right: true, sortable: true, sortFn: (a, b) => (a.shippingCost || 0) - (b.shippingCost || 0) },
  { label: 'Ship. Cur', key: 'shipCur', get: (i, r, sc) => sc?.(i) || 'PHP', shipCurrencySelect: true },
  { label: 'Ship. PHP/Unit', key: 'shipPhp', get: (i, r, sc) => fmt(calcShippingPhp(i, sc?.(i))), right: true },
  { label: 'Landed Cost', key: 'landed', get: (i, r, sc) => fmt(calcLanded(i, sc?.(i))), right: true, sortable: true,
    sortFn: (a, b) => (calcLanded(a, getItemShipCur(a)) || 0) - (calcLanded(b, getItemShipCur(b)) || 0) },
  { label: 'Total Landed', key: 'totalLanded', get: (i, r, sc) => fmt(calcTotalLanded(i, sc?.(i))), right: true, sortable: true,
    sortFn: (a, b) => (calcTotalLanded(a, getItemShipCur(a)) || 0) - (calcTotalLanded(b, getItemShipCur(b)) || 0) },
  { label: 'Lead (wks)', key: 'lead', get: (i) => i.leadtimeInWeeks, right: true, sortable: true, sortFn: (a, b) => (a.leadtimeInWeeks || 0) - (b.leadtimeInWeeks || 0) },
  { label: 'Date Required', key: 'dateReq', get: (i) => fmtDate(i.dateRequired), dateBadge: true, sortable: true, sortFn: (a, b) => (new Date(a.dateRequired || 0)) - (new Date(b.dateRequired || 0)) },
];

const GROUP_ORDER = ['new_group', 'topics'];
const GROUP_LABELS = { new_group: 'Engineering Services', topics: 'Items for Quotation' };

export function buildGroups(items) {
  const map = {};
  items.forEach(it => { const gid = it.group?.id || 'other'; if (!map[gid]) map[gid] = []; map[gid].push(it); });
  const ordered = GROUP_ORDER.filter(g => map[g]);
  Object.keys(map).forEach(g => { if (!ordered.includes(g)) ordered.push(g); });
  return ordered.map(g => ({ id: g, label: GROUP_LABELS[g] || g, items: map[g] }));
}

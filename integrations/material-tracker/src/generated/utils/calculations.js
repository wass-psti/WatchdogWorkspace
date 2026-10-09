export const fmt = (v) => {
  if (v == null || v === '') return null;
  const n = typeof v === 'string' ? parseFloat(v.replace(/,/g, '')) : v;
  if (isNaN(n)) return null;
  return n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

export const calcPhp = (i) => i.currency === 'PHP' ? (i.buyingPrice || 0)
  : (i.currency === 'USD' || i.currency === 'EUR')
    ? Math.round((i.buyingPrice || 0) * (parseFloat(i.currency === 'USD' ? i.exRateUsd : i.exRateEur) || 0) * 100) / 100
    : 0;

// Total shipping cost converted to PHP (used internally for totals)
export const calcShippingPhpTotal = (i, shipCur) => {
  const cur = shipCur || 'PHP';
  if (cur === 'PHP') return (i.shippingCost || 0);
  if (cur === 'USD' || cur === 'EUR')
    return Math.round((i.shippingCost || 0) * (parseFloat(cur === 'USD' ? i.exRateUsd : i.exRateEur) || 0) * 100) / 100;
  return 0;
};

// Per-unit shipping cost in PHP (shipping is already per-unit on the board)
export const calcShippingPhp = (i, shipCur) => {
  return calcShippingPhpTotal(i, shipCur);
};

export const calcLanded = (i, shipCur) => calcPhp(i) + calcShippingPhp(i, shipCur);
export const calcTotalLanded = (i, shipCur) => (i.quantity || 0) * calcLanded(i, shipCur);
export const calcSelling = (i, shipCur) => i.sourceType === 'Import' ? calcLanded(i, shipCur) * 1.30 * 1.30
  : i.sourceType === 'Local' ? calcLanded(i, shipCur) * 1.30 : null;
export const calcTotalCostVatin = (i, shipCur) => {
  const sp = calcSelling(i, shipCur);
  return sp != null ? (i.quantity || 0) * sp * 1.12 : null;
};

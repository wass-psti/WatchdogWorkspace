function stripBom(text) { return text.charCodeAt(0) === 0xFEFF ? text.slice(1) : text; }

export function parseCsv(text, { maxRows = 10000, maxColumns = 100 } = {}) {
  const source = stripBom(String(text ?? ''));
  const rows = [];
  let row = [], field = '', quoted = false;
  for (let i = 0; i <= source.length; i++) {
    const ch = i < source.length ? source[i] : '\n';
    if (quoted) {
      if (ch === '"' && source[i + 1] === '"') { field += '"'; i++; }
      else if (ch === '"') quoted = false;
      else field += ch;
      continue;
    }
    if (ch === '"' && field === '') { quoted = true; continue; }
    if (ch === ',') { row.push(field); field = ''; if (row.length > maxColumns) throw new Error(`CSV exceeds the ${maxColumns}-column safety limit.`); continue; }
    if (ch === '\r' && source[i + 1] === '\n') continue;
    if (ch === '\n' || ch === '\r') {
      row.push(field); field = '';
      if (row.some((value) => String(value).trim() !== '')) rows.push(row);
      row = [];
      if (rows.length > maxRows) throw new Error(`CSV exceeds the ${maxRows}-row safety limit.`);
      continue;
    }
    field += ch;
  }
  if (quoted) throw new Error('Malformed CSV: unterminated quoted field.');
  return rows;
}

export function csvEscape(value) {
  const text = value == null ? '' : String(value);
  return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

export function stringifyCsv(rows) {
  return rows.map((row) => row.map(csvEscape).join(',')).join('\r\n') + '\r\n';
}

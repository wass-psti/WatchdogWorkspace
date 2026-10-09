function ascii(value) {
  return String(value ?? '')
    .normalize('NFKD')
    .replace(/[^\x20-\x7E]/g, '?')
    .replace(/\\/g, '\\\\')
    .replace(/\(/g, '\\(')
    .replace(/\)/g, '\\)');
}

export function wrapPdfLine(text, max = 150) {
  const src = String(text ?? '').replace(/\s+/g, ' ').trim();
  if (!src) return [''];
  const out = [];
  let rest = src;
  while (rest.length > max) {
    let cut = rest.lastIndexOf(' ', max);
    if (cut < Math.floor(max * 0.6)) cut = max;
    out.push(rest.slice(0, cut));
    rest = rest.slice(cut).trimStart();
  }
  out.push(rest);
  return out;
}

export function buildPdfBytes(lines, { title = 'Material Sourcing Export' } = {}) {
  const pageSize = 68;
  const pages = [];
  const source = [title, '', ...lines];
  for (let i = 0; i < source.length; i += pageSize) pages.push(source.slice(i, i + pageSize));
  if (!pages.length) pages.push([title]);

  const objects = new Map();
  const pageRefs = [];
  let nextId = 4;
  for (const pageLines of pages) {
    const pageId = nextId++;
    const contentId = nextId++;
    pageRefs.push(`${pageId} 0 R`);
    const commands = ['BT', '/F1 6 Tf', '24 570 Td', '7 TL'];
    pageLines.forEach((line, idx) => {
      if (idx > 0) commands.push('T*');
      commands.push(`(${ascii(line)}) Tj`);
    });
    commands.push('ET');
    const stream = commands.join('\n');
    objects.set(pageId, `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 842 595] /Resources << /Font << /F1 3 0 R >> >> /Contents ${contentId} 0 R >>`);
    objects.set(contentId, `<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`);
  }
  objects.set(1, '<< /Type /Catalog /Pages 2 0 R >>');
  objects.set(2, `<< /Type /Pages /Kids [${pageRefs.join(' ')}] /Count ${pageRefs.length} >>`);
  objects.set(3, '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>');

  const maxId = nextId - 1;
  let pdf = '%PDF-1.4\n%MaterialTracker\n';
  const offsets = new Array(maxId + 1).fill(0);
  for (let id = 1; id <= maxId; id++) {
    offsets[id] = pdf.length;
    pdf += `${id} 0 obj\n${objects.get(id)}\nendobj\n`;
  }
  const xrefOffset = pdf.length;
  pdf += `xref\n0 ${maxId + 1}\n0000000000 65535 f \n`;
  for (let id = 1; id <= maxId; id++) pdf += `${String(offsets[id]).padStart(10, '0')} 00000 n \n`;
  pdf += `trailer\n<< /Size ${maxId + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF\n`;
  return new TextEncoder().encode(pdf);
}

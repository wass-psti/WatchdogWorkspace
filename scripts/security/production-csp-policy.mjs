const NAMED_ENTITIES = Object.freeze({
  amp: '&',
  apos: "'",
  gt: '>',
  lt: '<',
  quot: '"',
});

export function decodeHtmlEntities(value) {
  return String(value ?? '').replace(/&(#x[0-9a-f]+|#\d+|amp|apos|gt|lt|quot);/gi, (match, entity) => {
    const normalized = String(entity).toLowerCase();
    if (normalized.startsWith('#x')) {
      const codePoint = Number.parseInt(normalized.slice(2), 16);
      return Number.isFinite(codePoint) ? String.fromCodePoint(codePoint) : match;
    }
    if (normalized.startsWith('#')) {
      const codePoint = Number.parseInt(normalized.slice(1), 10);
      return Number.isFinite(codePoint) ? String.fromCodePoint(codePoint) : match;
    }
    return NAMED_ENTITIES[normalized] ?? match;
  });
}

function parseHtmlAttributes(tag) {
  const attributes = new Map();
  const attributePattern = /([:\w-]+)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/g;
  for (const match of tag.matchAll(attributePattern)) {
    const name = String(match[1] ?? '').toLowerCase();
    const rawValue = match[2] ?? match[3] ?? match[4] ?? '';
    attributes.set(name, decodeHtmlEntities(rawValue));
  }
  return attributes;
}

export function extractContentSecurityPolicy(html) {
  for (const match of String(html ?? '').matchAll(/<meta\b[^>]*>/gi)) {
    const attributes = parseHtmlAttributes(match[0]);
    if ((attributes.get('http-equiv') ?? '').toLowerCase() !== 'content-security-policy') continue;
    return attributes.get('content') ?? '';
  }
  return null;
}

export function parseContentSecurityPolicy(policy) {
  const directives = new Map();
  for (const segment of String(policy ?? '').split(';')) {
    const tokens = segment.trim().split(/\s+/).filter(Boolean);
    if (!tokens.length) continue;
    const [name, ...values] = tokens;
    directives.set(String(name).toLowerCase(), values);
  }
  return directives;
}

function exactDirective(directives, name, expected) {
  const actual = directives.get(name) ?? [];
  return actual.length === expected.length && actual.every((token, index) => token === expected[index]);
}

export function validateProductionContentSecurityPolicy(policy) {
  const directives = parseContentSecurityPolicy(policy);
  const errors = [];

  if (!exactDirective(directives, 'script-src', ["'self'"])) {
    errors.push("script-src must contain exactly 'self'");
  }
  const scriptSources = directives.get('script-src') ?? [];
  if (scriptSources.includes("'unsafe-inline'") || scriptSources.includes("'unsafe-eval'")) {
    errors.push('script-src must not contain unsafe-inline or unsafe-eval');
  }
  if (!exactDirective(directives, 'object-src', ["'none'"])) {
    errors.push("object-src must contain exactly 'none'");
  }
  if (!exactDirective(directives, 'base-uri', ["'self'"])) {
    errors.push("base-uri must contain exactly 'self'");
  }
  return errors;
}

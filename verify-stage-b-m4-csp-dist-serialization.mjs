import assert from 'node:assert/strict';
import fs from 'node:fs';
import {
  decodeHtmlEntities,
  extractContentSecurityPolicy,
  validateProductionContentSecurityPolicy,
} from './scripts/security/production-csp-policy.mjs';

const productionPolicy = "default-src 'self'; base-uri 'self'; object-src 'none'; script-src 'self'; style-src 'self' 'unsafe-inline'";
const serializedVariants = [
  `<meta http-equiv="Content-Security-Policy" content="${productionPolicy}">`,
  `<meta http-equiv="Content-Security-Policy" content="${productionPolicy.replaceAll("'", '&#39;')}">`,
  `<meta content="${productionPolicy.replaceAll("'", '&#x27;')}" http-equiv="Content-Security-Policy">`,
  `<meta content="${productionPolicy.replaceAll("'", '&apos;')}" http-equiv="content-security-policy">`,
];

for (const html of serializedVariants) {
  const extracted = extractContentSecurityPolicy(`<!doctype html><html><head>${html}</head></html>`);
  assert.equal(extracted, productionPolicy, 'CSP extraction must normalize Vite/HTML quote serialization.');
  assert.deepEqual(validateProductionContentSecurityPolicy(extracted), [], 'Governed production CSP must pass semantic validation.');
}

assert.equal(decodeHtmlEntities('&#39;self&#39;'), "'self'");
assert.deepEqual(
  validateProductionContentSecurityPolicy("script-src 'self' https://example.com; object-src 'none'; base-uri 'self'"),
  ["script-src must contain exactly 'self'"],
  'The verifier must reject additional executable script origins.',
);
assert.deepEqual(
  validateProductionContentSecurityPolicy("script-src 'self' 'unsafe-inline'; object-src 'none'; base-uri 'self'"),
  ["script-src must contain exactly 'self'", 'script-src must not contain unsafe-inline or unsafe-eval'],
  'The verifier must reject unsafe inline script execution.',
);

const distVerifier = fs.readFileSync('scripts/verify-dist.mjs', 'utf8');
assert.ok(distVerifier.includes('extractContentSecurityPolicy'), 'dist verifier must parse CSP semantically.');
assert.ok(distVerifier.includes('validateProductionContentSecurityPolicy'), 'dist verifier must validate decoded CSP directives.');
assert.equal(distVerifier.includes('index.includes("script-src \'self\'")'), false, 'dist verifier must not depend on raw HTML quote serialization.');

console.log('Stage B M4 production CSP serialization compatibility verification: PASS');

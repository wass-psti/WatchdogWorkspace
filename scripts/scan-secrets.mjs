import { readFile, readdir, stat } from 'node:fs/promises';
import { extname, relative, resolve } from 'node:path';
import process from 'node:process';

const root = resolve(import.meta.dirname, '..');
const ignoredDirectories = new Set(['.git', 'node_modules', 'dist', '.vite']);
const ignoredFiles = new Set(['package-lock.json', 'CHECKSUMS.sha256']);
const allowedExtensions = new Set(['.js', '.mjs', '.ts', '.tsx', '.json', '.yml', '.yaml', '.html', '.css', '.md', '.sh', '.sql', '.env', '.txt', '.toml', '.svg', '.webmanifest']);
const allowedFileNames = new Set(['.npmrc', '.nvmrc', '.gitignore', 'npmrc', 'nvmrc']);
const patterns = [
  ['private key', /-----BEGIN (?:RSA |EC |OPENSSH |DSA )?PRIVATE KEY-----/g],
  ['GitHub token', /\b(?:gh[pousr]_[A-Za-z0-9]{30,}|github_pat_[A-Za-z0-9_]{50,})\b/g],
  ['AWS access key', /\bAKIA[0-9A-Z]{16}\b/g],
  ['OpenAI secret key', /\bsk-(?:proj-|svcacct-)?[A-Za-z0-9_-]{20,}\b/g],
  ['Slack token', /\bxox[baprs]-[A-Za-z0-9-]{20,}\b/g],
  ['Stripe live secret', /\bsk_live_[A-Za-z0-9]{20,}\b/g],
  ['npm access token', /\bnpm_[A-Za-z0-9]{20,}\b/g],
];

const findings = [];
async function walk(directory) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    if (entry.isDirectory() && ignoredDirectories.has(entry.name)) continue;
    const full = resolve(directory, entry.name);
    if (entry.isDirectory()) {
      await walk(full);
      continue;
    }
    if (!entry.isFile() || ignoredFiles.has(entry.name)) continue;
    const rel = relative(root, full);
    if (rel.startsWith('apps/') && /(?:^|\/)archive(?:d)?\//i.test(rel)) continue;
    if (!allowedExtensions.has(extname(entry.name)) && !entry.name.startsWith('.env') && !allowedFileNames.has(entry.name)) continue;
    const info = await stat(full);
    if (info.size > 2_000_000) continue;
    const text = await readFile(full, 'utf8');
    const lines = text.split(/\r?\n/);
    for (let index = 0; index < lines.length; index += 1) {
      const line = lines[index];
      for (const [label, pattern] of patterns) {
        pattern.lastIndex = 0;
        if (pattern.test(line)) findings.push(`${rel}:${index + 1}: ${label}`);
      }
      if (/\b(?:SUPABASE_SERVICE_ROLE_KEY|SERVICE_ROLE_KEY)\s*=\s*['"]?[^\s'"$<{][^\s'"]{15,}/.test(line)) {
        findings.push(`${rel}:${index + 1}: Supabase service-role credential`);
      }
      if (/(?:^|:)_authToken\s*=\s*(?!\$\{)[^\s#'"]{8,}/i.test(line)) {
        findings.push(`${rel}:${index + 1}: literal npm auth token assignment`);
      }
      if (/(?:^|:)(?:_auth|_password)\s*=\s*(?!\$\{)[A-Za-z0-9+/=]{16,}/i.test(line)) {
        findings.push(`${rel}:${index + 1}: literal npm auth credential assignment`);
      }
    }
  }
}

await walk(root);
if (findings.length) {
  console.error('High-confidence secret scan: FAIL');
  for (const finding of findings) console.error(`- ${finding}`);
  process.exit(1);
}
console.log('High-confidence secret scan: PASS');

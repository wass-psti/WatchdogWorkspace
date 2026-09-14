import { mkdtemp, mkdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { analyzePerformanceBudget, enforcePerformanceBudgets } from './lib/performance-budget-analysis.mjs';

const root = await mkdtemp(join(tmpdir(), 'wm-m31-budget-fixture-'));
try {
  await mkdir(join(root, '.vite'), { recursive: true });
  await mkdir(join(root, 'build'), { recursive: true });
  const manifest = {
    'index.html': { file: 'build/index.js', src: 'index.html', isEntry: true, imports: ['_shared.js'], dynamicImports: ['src/lazy.ts'], css: ['build/index.css'] },
    '_shared.js': { file: 'build/shared.js', imports: ['_deep.js'], css: ['build/shared.css'] },
    '_deep.js': { file: 'build/deep.js', css: ['build/shared.css'] },
    'src/lazy.ts': { file: 'build/lazy.js', src: 'src/lazy.ts', isDynamicEntry: true, css: ['build/lazy.css'] },
    'secondary.ts': { file: 'build/secondary.js', src: 'secondary.ts', isEntry: true },
  };
  await writeFile(join(root, '.vite/manifest.json'), JSON.stringify(manifest));
  const files = {
    'build/index.js': 100,
    'build/shared.js': 200,
    'build/deep.js': 300,
    'build/lazy.js': 400,
    'build/secondary.js': 500,
    'build/index.css': 50,
    'build/shared.css': 75,
    'build/lazy.css': 125,
    'index.html': 25,
  };
  for (const [file, bytes] of Object.entries(files)) await writeFile(join(root, file), 'x'.repeat(bytes));
  const budgets = {
    entrySource: 'index.html',
    initialJsRawBytes: 600,
    initialCssRawBytes: 125,
    largestInitialChunkRawBytes: 300,
    totalManifestJsRawBytes: 1500,
    largestAnyJsChunkRawBytes: 500,
    totalBuildRawBytes: 3000,
  };
  const metrics = await analyzePerformanceBudget({ distRoot: pathToFileURL(`${root}/`), budgets });
  if (metrics.initialJsRawBytes !== 600) throw new Error(`Fixture initial JS mismatch: ${metrics.initialJsRawBytes}`);
  if (metrics.initialCssRawBytes !== 125) throw new Error(`Fixture initial CSS mismatch: ${metrics.initialCssRawBytes}`);
  if (metrics.largestInitialChunk.bytes !== 300) throw new Error('Fixture largest initial chunk mismatch.');
  if (metrics.totalManifestJsRawBytes !== 1500) throw new Error(`Fixture total manifest JS mismatch: ${metrics.totalManifestJsRawBytes}`);
  if (metrics.largestAnyJsChunk.bytes !== 500) throw new Error('Fixture largest any JS chunk mismatch.');
  if (metrics.initialManifestKeys.includes('src/lazy.ts')) throw new Error('Dynamic import leaked into initial closure.');
  if (!metrics.initialManifestKeys.includes('_deep.js')) throw new Error('Recursive static import missing from initial closure.');
  enforcePerformanceBudgets(metrics, budgets);
  let rejected = false;
  try { enforcePerformanceBudgets(metrics, { ...budgets, largestAnyJsChunkRawBytes: 499 }); } catch { rejected = true; }
  if (!rejected) throw new Error('Budget enforcement fixture failed to reject an oversized all-JS chunk.');
  console.log('M31 performance budget analysis fixtures: PASS (URL root; Vite static closure; dynamic exclusion; dedupe; largest-any enforcement)');
} finally {
  await rm(root, { recursive: true, force: true });
}

import { defineConfig, loadEnv } from 'vite';
import { runtimeAssetsSource } from './scripts/lib/service-worker-build-manifest.mjs';
import { cp, mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const rootDir = dirname(fileURLToPath(import.meta.url));
const RELEASE = '1.43.2';
const PRODUCTION_CSP = [
  "default-src 'self'",
  "base-uri 'self'",
  "object-src 'none'",
  "script-src 'self'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https://*.supabase.co",
  "font-src 'self' data:",
  "connect-src 'self' https://*.supabase.co wss://*.supabase.co",
  "frame-src 'self'",
  "worker-src 'self' blob:",
  "manifest-src 'self'",
  "media-src 'self' blob: https://*.supabase.co",
  "form-action 'self'",
].join('; ');

function normalizeBase(value) {
  const raw = String(value || './').trim();
  if (!raw || raw === '.') return './';
  if (raw === './' || raw === '/') return raw;
  const withLeading = raw.startsWith('/') ? raw : `/${raw}`;
  return withLeading.endsWith('/') ? withLeading : `${withLeading}/`;
}

function parseSourceMap(value) {
  const normalized = String(value || 'false').trim().toLowerCase();
  if (normalized === 'false' || normalized === '0' || normalized === 'off') return false;
  if (normalized === 'true' || normalized === '1' || normalized === 'on') return true;
  if (normalized === 'inline') return 'inline';
  return 'hidden';
}

async function copyFileFromRoot(source, outputRoot, destination = source) {
  const from = resolve(rootDir, source);
  const to = resolve(outputRoot, destination);
  await mkdir(dirname(to), { recursive: true });
  await cp(from, to, { force: true });
}

function securityBaselineHtmlPlugin() {
  return {
    name: 'work-management-security-baseline',
    apply: 'build',
    transformIndexHtml() {
      return {
        tags: [
          {
            tag: 'meta',
            attrs: { 'http-equiv': 'Content-Security-Policy', content: PRODUCTION_CSP },
            injectTo: 'head-prepend',
          },
          {
            tag: 'meta',
            attrs: { name: 'referrer', content: 'strict-origin-when-cross-origin' },
            injectTo: 'head-prepend',
          },
        ],
      };
    },
  };
}

function workManagementRuntimePlugin() {
  return {
    name: 'work-management-runtime-assets',
    apply: 'build',
    async writeBundle(outputOptions, bundle) {
      const outputRoot = resolve(rootDir, outputOptions.dir || 'dist');

      // Embedded application UI remains isolated, while the shared host/identity/cloud
      // runtime is now a TypeScript build entry. The copied HTML is rewritten to the
      // stable emitted bootstrap path after Vite compiles that runtime boundary.
      await cp(resolve(rootDir, 'apps'), resolve(outputRoot, 'apps'), {
        recursive: true,
        force: true,
        filter: (source) => !source.includes(`${resolve(rootDir, 'apps')}/.DS_Store`),
      });

      const embeddedSupportFiles = [
        'assets/css/foundation/tokens.css',
        'assets/css/foundation/themes.css',
        'assets/css/foundation/primitives.css',
        'assets/css/foundation/module-unification.css',
        'assets/css/foundation/components.css',
        'assets/css/foundation/application-migration.css',
        'assets/css/motion-design.css',
      ];
      for (const file of embeddedSupportFiles) await copyFileFromRoot(file, outputRoot);

      for (const embeddedHtml of ['apps/time-tracker/index.html', 'apps/fueltrack-plus/runtime.html', 'apps/tradelink/runtime.html']) {
        const outputHtml = resolve(outputRoot, embeddedHtml);
        const html = await readFile(outputHtml, 'utf8');
        await writeFile(outputHtml, html
          .replace('../../assets/js/runtime/module-bootstrap.ts', '../../assets/js/runtime/module-bootstrap.js')
          .replace('../../assets/js/runtime/motion-orchestrator.ts', '../../assets/js/runtime/motion-orchestrator.js')
          .replace('../../assets/js/runtime/motion-design.ts', '../../assets/js/runtime/motion-design.js'), 'utf8');
      }

      await copyFileFromRoot('service-worker.js', outputRoot);

      const emitted = Object.values(bundle)
        .map((entry) => entry.fileName)
        .filter((fileName) => !fileName.endsWith('.map') && !fileName.startsWith('.vite/'))
        .map((fileName) => `./${fileName}`);
      const core = [
        './',
        './index.html',
        './manifest.webmanifest',
        './assets/icon.svg',
        './config/runtime-assets.js',
        ...embeddedSupportFiles.map((file) => `./${file}`),
        ...emitted,
      ];
      const runtimeAssetFile = resolve(outputRoot, 'config/runtime-assets.js');
      await mkdir(dirname(runtimeAssetFile), { recursive: true });
      await writeFile(runtimeAssetFile, runtimeAssetsSource(core), 'utf8');

      // Keep the manifest/icon contract stable for the generated service worker.
      // Vite already copies public/, but this check makes a failed copy obvious.
      await Promise.all([
        readFile(resolve(outputRoot, 'manifest.webmanifest'), 'utf8'),
        readFile(resolve(outputRoot, 'assets/icon.svg'), 'utf8'),
      ]);
    },
  };
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, rootDir, 'VITE_');
  return {
    base: normalizeBase(env.VITE_BASE_PATH),
    publicDir: 'public',
    resolve: {
      alias: {
        '@': resolve(rootDir, 'src'),
        '@types': resolve(rootDir, 'src/types'),
        '@platform': resolve(rootDir, 'src/platform'),
        '@boards': resolve(rootDir, 'src/features/boards'),
      },
    },
    plugins: [securityBaselineHtmlPlugin(), workManagementRuntimePlugin()],
    server: {
      host: '127.0.0.1',
      port: 5173,
    },
    preview: {
      host: '127.0.0.1',
      port: 4173,
    },
    build: {
      outDir: 'dist',
      emptyOutDir: true,
      assetsDir: 'build',
      target: 'baseline-widely-available',
      sourcemap: parseSourceMap(env.VITE_BUILD_SOURCEMAP),
      manifest: true,
      cssCodeSplit: true,
      reportCompressedSize: true,
      license: { fileName: '.vite/licenses.md' },
      rolldownOptions: {
        // Copied embedded application HTML imports named APIs from stable Vite entries.
        // Preserve those entry signatures even when manual code-splitting groups are active.
        preserveEntrySignatures: 'strict',
        input: {
          index: resolve(rootDir, 'index.html'),
          'module-bootstrap': resolve(rootDir, 'assets/js/runtime/module-bootstrap.ts'),
          'motion-orchestrator': resolve(rootDir, 'assets/js/runtime/motion-orchestrator.ts'),
          'motion-design': resolve(rootDir, 'assets/js/runtime/motion-design.ts'),
          'fueltrack-analytics': resolve(rootDir, 'assets/js/runtime/fueltrack-analytics.ts'),
        },
        output: {
          entryFileNames: (chunk) => {
            if (chunk.name === 'module-bootstrap') return 'assets/js/runtime/module-bootstrap.js';
            if (chunk.name === 'motion-orchestrator') return 'assets/js/runtime/motion-orchestrator.js';
            if (chunk.name === 'motion-design') return 'assets/js/runtime/motion-design.js';
            if (chunk.name === 'fueltrack-analytics') return 'assets/js/runtime/fueltrack-analytics.js';
            return 'build/[name]-[hash].js';
          },
          chunkFileNames: 'build/[name]-[hash].js',
          assetFileNames: 'build/[name]-[hash][extname]',
          codeSplitting: {
            groups: [
              {
                name: 'analytics-vendor',
                test: /[\\/]node_modules[\\/](?:echarts|zrender)[\\/]/,
                priority: 60,
                entriesAware: true,
                maxSize: 500000,
              },
              {
                name: 'boards',
                test: /[\\/]assets[\\/]js[\\/](?:features[\\/]boards[\\/]|core[\\/]boards\\.ts$|boards-ui\\.ts$)/,
                priority: 30,
              },
              {
                name: 'identity',
                test: /[\\/]assets[\\/]js[\\/](?:features[\\/](?:auth|account|user-management)[\\/]|core[\\/]auth\\.ts$|platform[\\/]auth[\\/])/,
                priority: 20,
              },
              {
                name: 'platform',
                test: /[\\/]assets[\\/]js[\\/](?:runtime|platform)[\\/]/,
                priority: 10,
                minSize: 12000,
                entriesAware: true,
                maxSize: 500000,
              },
            ],
          },
        },
      },
    },
  };
});

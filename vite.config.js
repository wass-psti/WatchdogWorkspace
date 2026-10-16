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

      // M145: no embedded standalone application is shipped. A future
      // integration must explicitly register its assets and verified entrypoint.
      const embeddedSupportFiles = [];
      // Vite also emits a fingerprinted manifest under build/. Its relative
      // ./assets/icon.svg resolves to build/assets/icon.svg, not root/assets/.
      // Keep both paths valid without changing PWA scope or the source manifest.
      await copyFileFromRoot('public/assets/icon.svg', outputRoot, 'build/assets/icon.svg');

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
        './build/assets/icon.svg',
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
        // Preserve only shared host entry signatures; no standalone app entry remains.
        preserveEntrySignatures: 'strict',
        input: {
          index: resolve(rootDir, 'index.html'),
          'module-bootstrap': resolve(rootDir, 'assets/js/runtime/module-bootstrap.ts'),
          'motion-orchestrator': resolve(rootDir, 'assets/js/runtime/motion-orchestrator.ts'),
          'motion-design': resolve(rootDir, 'assets/js/runtime/motion-design.ts'),
        },
        output: {
          entryFileNames: (chunk) => {
            if (chunk.name === 'module-bootstrap') return 'assets/js/runtime/module-bootstrap.js';
            if (chunk.name === 'motion-orchestrator') return 'assets/js/runtime/motion-orchestrator.js';
            if (chunk.name === 'motion-design') return 'assets/js/runtime/motion-design.js';
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

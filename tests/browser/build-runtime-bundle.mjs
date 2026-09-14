import { fileURLToPath } from 'node:url';
import { build as viteBuild } from 'vite';

const entry = fileURLToPath(new URL('./runtime-globals-entry.ts', import.meta.url));

export async function buildBrowserRuntimeBundle() {
  const result = await viteBuild({
    configFile: false,
    logLevel: 'silent',
    build: {
      write: false,
      target: 'es2022',
      minify: false,
      sourcemap: false,
      lib: {
        entry,
        name: 'WorkManagementBrowserIntegrationRuntime',
        formats: ['iife'],
      },
    },
  });

  const outputs = Array.isArray(result)
    ? result.flatMap((entryResult) => entryResult.output ?? [])
    : result.output ?? [];
  const chunk = outputs.find((output) => output.type === 'chunk' && output.isEntry);
  if (!chunk?.code) throw new Error('Browser integration runtime bundle was not emitted by Vite.');
  if ((chunk.imports?.length ?? 0) > 0 || (chunk.dynamicImports?.length ?? 0) > 0) {
    throw new Error('Browser integration runtime bundle must be self-contained and contain no external static or dynamic chunk imports.');
  }
  return chunk.code;
}

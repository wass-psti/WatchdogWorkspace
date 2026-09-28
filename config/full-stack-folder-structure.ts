export type FullStackArea =
  | 'frontend'
  | 'backend'
  | 'shared'
  | 'infrastructure'
  | 'quality'
  | 'delivery';

export interface FullStackOwnershipBoundary {
  readonly area: FullStackArea;
  readonly purpose: string;
  readonly canonicalPaths: readonly string[];
  readonly invariants: readonly string[];
}

export const fullStackFolderStructureVersion = 1 as const;

export const fullStackFolderStructure = Object.freeze([
  Object.freeze({
    area: 'frontend',
    purpose: 'Browser presentation, client orchestration, design system, and embedded application compatibility runtimes.',
    canonicalPaths: Object.freeze(['src/app', 'src/features', 'src/design-system', 'assets/js', 'assets/css', 'apps', 'public']),
    invariants: Object.freeze([
      'Preserve route, state, authentication, authorization, module-host, and browser-runtime behavior.',
      'Do not import Supabase migrations, database tests, or server-only Edge Function implementation into browser code.',
    ]),
  }),
  Object.freeze({
    area: 'backend',
    purpose: 'Supabase database, RLS/RPC, migrations, and trusted Edge Function execution.',
    canonicalPaths: Object.freeze(['supabase/functions', 'supabase/migrations', 'supabase/schema.sql', 'supabase/tests', 'supabase/config.toml']),
    invariants: Object.freeze([
      'Preserve schema, RPC, RLS, storage, realtime, and Edge Function contracts.',
      'Server-side authorization remains authoritative for persistent protected operations.',
    ]),
  }),
  Object.freeze({
    area: 'shared',
    purpose: 'Cross-layer contracts, runtime schemas, types, and application/module manifests.',
    canonicalPaths: Object.freeze(['src/platform/contracts', 'src/runtime-schemas', 'src/types', 'config/application-manifest.ts', 'config/modules.ts']),
    invariants: Object.freeze([
      'Shared code remains feature-neutral and does not own business presentation.',
      'Runtime schemas remain the validation authority at untrusted data boundaries.',
    ]),
  }),
  Object.freeze({
    area: 'infrastructure',
    purpose: 'Build, runtime configuration, CI/CD, service-worker, and platform configuration.',
    canonicalPaths: Object.freeze(['config', 'vite.config.js', 'tsconfig.json', 'eslint.config.mjs', 'vitest.config.mjs', 'playwright.config.mjs', '.github', 'service-worker.js']),
    invariants: Object.freeze([
      'Configuration changes must not bypass established security, environment, build, or deployment contracts.',
      'Public browser configuration must not contain server secrets.',
    ]),
  }),
  Object.freeze({
    area: 'quality',
    purpose: 'Static, deterministic, browser/E2E, type, database, regression, and certification verification.',
    canonicalPaths: Object.freeze(['tests', 'supabase/tests', 'verify-project.sh']),
    invariants: Object.freeze([
      'Historical verification remains executable after structural evolution.',
      'Certification remains fail-closed.',
    ]),
  }),
  Object.freeze({
    area: 'delivery',
    purpose: 'Automation, governance, release evidence, operational documentation, and packaging.',
    canonicalPaths: Object.freeze(['scripts', 'governance-artifacts', 'release-artifacts', 'docs']),
    invariants: Object.freeze([
      'Certified artifacts are created only after all required gates pass.',
      'Operational automation may inspect runtime code but runtime code must not depend on release tooling.',
    ]),
  }),
] satisfies readonly FullStackOwnershipBoundary[]);

export const fullStackCompatibilityPaths = Object.freeze({
  browserEntry: 'src/main.ts',
  appComposition: 'src/app/composition',
  browserRuntime: 'assets/js/runtime',
  moduleRoot: 'apps',
  backendRoot: 'supabase',
  configurationRoot: 'config',
  testRoot: 'tests',
} as const);

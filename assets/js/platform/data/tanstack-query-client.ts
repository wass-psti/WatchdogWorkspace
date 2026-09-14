import { QueryClient as TanStackQueryClient } from '@tanstack/react-query';

export const TANSTACK_QUERY_VERSION = '5.102.8' as const;

export interface WorkManagementTanStackQueryClientOptions {
  readonly defaultStaleTime?: number;
}

const nonNegativeNumber = (value: number | undefined, fallback: number): number => {
  const normalized = Number(value ?? fallback);
  return Number.isFinite(normalized) && normalized >= 0 ? normalized : fallback;
};

/**
 * Creates the native TanStack Query v5 client used for Work Management server state.
 * Compatibility defaults intentionally avoid surprise background refetches while the
 * legacy imperative shell remains mounted beneath the React composition boundary.
 */
export function createTanStackQueryClient(options: WorkManagementTanStackQueryClientOptions = {}): TanStackQueryClient {
  const staleTime = nonNegativeNumber(options.defaultStaleTime, 10_000);
  return new TanStackQueryClient({
    defaultOptions: {
      queries: {
        staleTime,
        retry: false,
        refetchOnMount: false,
        refetchOnReconnect: false,
        refetchOnWindowFocus: false,
      },
      mutations: {
        retry: false,
      },
    },
  });
}

/**
 * Page-lifetime native cache shared by QueryClientProvider and the imperative
 * compatibility facade. This prevents React and the legacy shell from creating
 * parallel server-state caches during the Stage B migration.
 */
export const workManagementTanStackQueryClient = createTanStackQueryClient();

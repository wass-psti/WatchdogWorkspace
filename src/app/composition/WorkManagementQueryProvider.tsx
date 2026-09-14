import type { PropsWithChildren } from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import { workManagementTanStackQueryClient } from '../../../assets/js/platform/data/tanstack-query-client.ts';

/**
 * React-facing owner of the page-lifetime TanStack Query client. The legacy shell
 * receives the exact same native client through platform-services.ts, preventing
 * duplicate caches while feature presentation migrates incrementally to React.
 */
export function WorkManagementQueryProvider({ children }: PropsWithChildren) {
  return (
    <QueryClientProvider client={workManagementTanStackQueryClient}>
      {children}
    </QueryClientProvider>
  );
}

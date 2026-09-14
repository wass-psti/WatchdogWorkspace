import {
  MutationObserver,
  hashKey,
  type QueryClient as TanStackQueryClient,
  type QueryKey as TanStackQueryKey,
} from '@tanstack/react-query';
import type {
  QueryClient,
  QueryClientOptions,
  QueryEvent,
  QueryFetchOptions,
  QueryKey,
  QueryKeyPart,
  QueryMutationOptions,
  QuerySnapshotEntry,
  QueryStateSnapshot,
} from '../../../../src/platform/contracts/query.ts';
import { createTanStackQueryClient } from './tanstack-query-client.ts';

type QueryListener = (event: QueryEvent) => void;

const topLevelParts = (value: QueryKey): readonly QueryKeyPart[] =>
  Array.isArray(value) ? value : [value as QueryKeyPart];

const toTanStackKey = (value: QueryKey): TanStackQueryKey => topLevelParts(value);

/**
 * Preserve the pre-M8 Work Management prefix contract rather than adopting
 * TanStack's broader object-partial matching semantics. Each top-level key
 * segment must match structurally; only additional trailing segments are
 * considered descendants.
 */
const matchesWorkManagementPrefix = (candidate: TanStackQueryKey, prefix: QueryKey): boolean => {
  const target = toTanStackKey(prefix);
  if (target.length > candidate.length) return false;
  return target.every((part, index) => hashKey([part]) === hashKey([candidate[index]]));
};

export const queryKey = (...parts: QueryKeyPart[]): string => hashKey(parts);

function errorMessage(error: unknown): string | null {
  return error instanceof Error ? error.message : typeof error === 'string' ? error : null;
}

const abortedReason = (signal: AbortSignal): unknown => {
  if ('reason' in signal && signal.reason !== undefined) return signal.reason;
  return new DOMException('The operation was aborted.', 'AbortError');
};

/**
 * Compatibility facade over TanStack Query v5.
 *
 * Existing non-React repositories continue to consume the Work Management-owned
 * QueryClient contract while TanStack Query owns query hashing, cache state,
 * request de-duplication, invalidation, mutation state, and garbage collection.
 *
 * Compatibility rules retained during M8:
 * - repository query functions begin in a microtask, matching the pre-M8 client;
 * - fresh cache hits and de-duplicated followers do not emit duplicate events;
 * - prefix invalidation/removal matches whole top-level key segments exactly;
 * - synchronous repository mutation functions remain supported.
 */
export function createQueryClient(
  options: QueryClientOptions = {},
  nativeClient: TanStackQueryClient = createTanStackQueryClient(
    options.defaultStaleTime === undefined
      ? {}
      : { defaultStaleTime: options.defaultStaleTime },
  ),
): QueryClient {
  const diagnostics = options.diagnostics ?? null;
  const defaultStaleTime = Math.max(0, Number(options.defaultStaleTime ?? 10_000) || 0);
  const listeners = new Set<QueryListener>();

  const notify = (event: QueryEvent): void => {
    for (const listener of [...listeners]) {
      try {
        listener(event);
      } catch {
        // Subscriber failures must never corrupt server-state progression.
      }
    }
  };

  const keyId = (key: QueryKey): string => hashKey(toTanStackKey(key));

  const fetchQuery = async <T>(fetchOptions: QueryFetchOptions<T>): Promise<T> => {
    if (typeof fetchOptions.queryFn !== 'function') throw new TypeError('queryFn must be a function.');

    const tanstackKey = toTanStackKey(fetchOptions.key);
    const id = keyId(fetchOptions.key);
    const staleTime = Math.max(0, Number(fetchOptions.staleTime ?? defaultStaleTime) || 0);
    const currentState = nativeClient.getQueryState<T>(tanstackKey);
    const currentData = nativeClient.getQueryData<T>(tanstackKey);
    const now = Date.now();

    // Preserve the pre-M8 fast-path: a fresh cache read produces no fetch
    // diagnostic/event and does not schedule a query function.
    const isFresh = !fetchOptions.force
      && currentData !== undefined
      && currentState !== undefined
      && !currentState.isInvalidated
      && now - currentState.dataUpdatedAt <= staleTime;
    if (isFresh) return currentData;

    // TanStack owns request de-duplication. Track whether this facade call is
    // the request owner so followers don't duplicate Work Management events.
    const ownsFetch = currentState?.fetchStatus === undefined || currentState.fetchStatus === 'idle';

    if (fetchOptions.force && ownsFetch && currentState !== undefined) {
      // Explicit invalidation guarantees a force request even if updatedAt was
      // manually written into the future. Refetching is still performed below.
      await nativeClient.invalidateQueries({
        queryKey: tanstackKey,
        exact: true,
        refetchType: 'none',
      });
    }

    if (ownsFetch) {
      diagnostics?.debug('QUERY_FETCH', 'Fetching server state through TanStack Query.', { key: id });
    }

    try {
      const data = await nativeClient.fetchQuery<T>({
        queryKey: tanstackKey,
        staleTime,
        queryFn: ({ signal, queryKey: resolvedKey }) => Promise.resolve().then(() => {
          if (signal.aborted) throw abortedReason(signal);
          return fetchOptions.queryFn({ signal, queryKey: resolvedKey });
        }),
      });
      if (ownsFetch) {
        diagnostics?.debug('QUERY_SUCCESS', 'Server state resolved through TanStack Query.', { key: id });
        notify({ type: 'query:success', key: id, data });
      }
      return data;
    } catch (error: unknown) {
      if (ownsFetch) {
        diagnostics?.warn('QUERY_FAILURE', errorMessage(error) || 'Server-state request failed.', {
          key: id,
          code: typeof error === 'object' && error !== null && 'code' in error ? String(error.code ?? '') || null : null,
        });
        notify({ type: 'query:error', key: id, error });
      }
      throw error;
    }
  };

  const invalidateQueries = (prefix: QueryKey): number => {
    const id = keyId(prefix);
    const predicate = (query: { readonly queryKey: TanStackQueryKey }): boolean =>
      matchesWorkManagementPrefix(query.queryKey, prefix);
    const count = nativeClient.getQueryCache().findAll({ predicate }).length;
    if (count > 0) {
      void nativeClient.invalidateQueries({ predicate, refetchType: 'none' });
      notify({ type: 'query:invalidate', key: id, count });
    }
    return count;
  };

  const removeQueries = (prefix: QueryKey): number => {
    const id = keyId(prefix);
    const predicate = (query: { readonly queryKey: TanStackQueryKey }): boolean =>
      matchesWorkManagementPrefix(query.queryKey, prefix);
    const count = nativeClient.getQueryCache().findAll({ predicate }).length;
    if (count > 0) {
      nativeClient.removeQueries({ predicate });
      notify({ type: 'query:remove', key: id, count });
    }
    return count;
  };

  const mutate = async <TInput, TResult>(mutation: QueryMutationOptions<TInput, TResult>): Promise<TResult> => {
    if (typeof mutation.mutationFn !== 'function') throw new TypeError('mutationFn must be a function.');
    const id = keyId(mutation.key);
    const observer = new MutationObserver<TResult, unknown, TInput, unknown>(nativeClient, {
      mutationKey: toTanStackKey(mutation.key),
      mutationFn: async (input) => mutation.mutationFn(input),
      retry: false,
    });

    notify({ type: 'mutation:start', key: id });
    diagnostics?.debug('MUTATION_START', 'Persisting server-state mutation through TanStack Query.', { key: id });
    try {
      const result = await observer.mutate(mutation.input);
      for (const target of mutation.invalidate ?? []) invalidateQueries(target);
      diagnostics?.debug('MUTATION_SUCCESS', 'Server-state mutation persisted through TanStack Query.', { key: id });
      notify({ type: 'mutation:success', key: id, data: result });
      return result;
    } catch (error: unknown) {
      diagnostics?.warn('MUTATION_FAILURE', errorMessage(error) || 'Server-state mutation failed.', { key: id });
      notify({ type: 'mutation:error', key: id, error });
      throw error;
    } finally {
      observer.reset();
    }
  };

  const client: QueryClient = {
    fetchQuery,
    mutate,
    getQueryData<T = unknown>(key: QueryKey): T | undefined {
      return nativeClient.getQueryData<T>(toTanStackKey(key));
    },
    getQueryState(key: QueryKey): QueryStateSnapshot | undefined {
      const state = nativeClient.getQueryState(toTanStackKey(key));
      if (!state) return undefined;
      return Object.freeze({
        status: state.status,
        fetchStatus: state.fetchStatus,
        hasData: state.data !== undefined,
        error: errorMessage(state.error),
      });
    },
    setQueryData<T>(key: QueryKey, data: T, setOptions: Readonly<{ updatedAt?: number }> = {}): T {
      nativeClient.setQueryData<T>(
        toTanStackKey(key),
        data,
        setOptions.updatedAt === undefined ? undefined : { updatedAt: setOptions.updatedAt },
      );
      notify({ type: 'query:set', key: keyId(key), data });
      return data;
    },
    invalidateQueries,
    removeQueries,
    clear(): void {
      nativeClient.clear();
      notify({ type: 'query:clear' });
    },
    subscribe(listener: QueryListener): () => void {
      if (typeof listener !== 'function') return () => undefined;
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    snapshot(): readonly QuerySnapshotEntry[] {
      return Object.freeze(nativeClient.getQueryCache().getAll().map((query) => Object.freeze({
        key: query.queryHash,
        updatedAt: query.state.isInvalidated ? 0 : query.state.dataUpdatedAt,
        pending: query.state.fetchStatus !== 'idle',
        hasData: query.state.data !== undefined,
        error: errorMessage(query.state.error),
      })));
    },
  };

  return Object.freeze(client);
}

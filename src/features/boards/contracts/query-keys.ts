import type { QueryKeyPart } from '../../../platform/contracts/query.ts';
import type { BoardLifecycleStatus } from './domain.ts';

export const boardUserQueryScope = (userId: string | null | undefined): readonly QueryKeyPart[] =>
  Object.freeze(['boards-user', String(userId || 'anonymous')]);

export const boardListQueryPrefix = (userId: string | null | undefined): readonly QueryKeyPart[] =>
  Object.freeze([...boardUserQueryScope(userId), 'list']);

export const boardListQueryKey = (
  userId: string | null | undefined,
  status: BoardLifecycleStatus = 'active',
): readonly QueryKeyPart[] => Object.freeze([...boardListQueryPrefix(userId), status]);

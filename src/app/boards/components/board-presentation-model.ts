import type { BoardPresentationFacadeSnapshot } from '../board-presentation-facade-runtime.ts';

export type BoardPresentationRouteModel =
  | Readonly<{ kind: 'inactive'; view: 'hidden'; boardId: null; ariaLabel: 'Board workspace content' }>
  | Readonly<{ kind: 'collection'; view: 'boards'; boardId: null; ariaLabel: 'Boards collection' }>
  | Readonly<{ kind: 'workspace'; view: 'board'; boardId: string; ariaLabel: 'Board workspace' }>;

export function deriveBoardPresentationRouteModel(snapshot: BoardPresentationFacadeSnapshot): BoardPresentationRouteModel {
  if (snapshot.view === 'hidden') {
    return Object.freeze({ kind: 'inactive', view: 'hidden', boardId: null, ariaLabel: 'Board workspace content' });
  }
  if (snapshot.view === 'boards') {
    return Object.freeze({ kind: 'collection', view: 'boards', boardId: null, ariaLabel: 'Boards collection' });
  }
  const boardId = String(snapshot.boardId ?? '').trim();
  if (!boardId) throw new Error('Active Board workspace presentation requires a board identifier.');
  return Object.freeze({ kind: 'workspace', view: 'board', boardId, ariaLabel: 'Board workspace' });
}

import type { BoardItem } from '../../../../../src/features/boards/contracts/domain.ts';
import type { BoardGroupId, BoardItemId, StatusLabelId } from '../../../../../src/types/identifiers.ts';

export interface BoardItemMoveSnapshot {
  readonly id: BoardItemId;
  readonly group_id: BoardGroupId;
  readonly position: number;
  readonly status: StatusLabelId | null;
}

export type BoardItemMoveMode = 'positioned' | 'status-only';

const isArchived = (item: BoardItem): boolean => Boolean(item.archived || item.archived_at);

export function snapshotBoardItemMoveState(items: readonly BoardItem[]): readonly BoardItemMoveSnapshot[] {
  return items.map((item) => Object.freeze({ id: item.id, group_id: item.group_id, position: item.position, status: item.status }));
}

export function restoreBoardItemMoveState(items: readonly BoardItem[], snapshot: readonly BoardItemMoveSnapshot[]): void {
  const byId = new Map(snapshot.map((entry) => [String(entry.id), entry] as const));
  for (const item of items) {
    const saved = byId.get(String(item.id));
    if (saved) Object.assign(item, saved);
  }
}

export function applyBoardItemMove(
  items: readonly BoardItem[],
  item: BoardItem,
  groupId: BoardGroupId,
  position: number,
  status: StatusLabelId | null,
  mode: BoardItemMoveMode = 'positioned',
): void {
  if (mode === 'status-only') {
    Object.assign(item, { status });
    return;
  }

  const active = items.filter((entry) => !isArchived(entry));
  const sourceGroup = item.group_id;
  active
    .filter((entry) => String(entry.group_id) === String(sourceGroup) && String(entry.id) !== String(item.id) && entry.position > item.position)
    .forEach((entry) => { Object.assign(entry, { position: entry.position - 1 }); });

  const targetPeers = active
    .filter((entry) => String(entry.group_id) === String(groupId) && String(entry.id) !== String(item.id))
    .sort((left, right) => left.position - right.position || String(left.id).localeCompare(String(right.id)));
  const target = Math.max(0, Math.min(Math.trunc(Number(position) || 0), targetPeers.length));
  targetPeers
    .filter((entry) => entry.position >= target)
    .forEach((entry) => { Object.assign(entry, { position: entry.position + 1 }); });
  Object.assign(item, { group_id: groupId, position: target, status });
}

export function assertUniqueCanonicalItemIds(items: readonly BoardItem[]): void {
  const seen = new Set<string>();
  for (const item of items) {
    const id = String(item.id);
    if (seen.has(id)) throw new Error(`Duplicate Board item identifier detected during movement: ${id}`);
    seen.add(id);
  }
}

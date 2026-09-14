import type { BoardVirtualColumnWindow, BoardVirtualRowWindow } from '../../../../../src/features/boards/virtualization/board-table-virtualization.ts';
import {
  BOARD_TABLE_VIRTUALIZATION_POLICY,
  boardVirtualColumnContains,
  boardVirtualColumnOffset,
  boardVirtualRowContains,
  calculateBoardVirtualColumnWindow,
  calculateBoardVirtualRowWindow,
} from '../../../../../src/features/boards/virtualization/board-table-virtualization.ts';

interface RowViewportState {
  scrollOffset: number;
  viewportHeight: number;
}

interface ColumnViewportState {
  scrollOffset: number;
  viewportWidth: number;
}

export interface BoardTableVirtualizationController {
  readonly rowWindow: (groupId: string, totalRows: number, rowHeight: number, forceFull?: boolean) => BoardVirtualRowWindow;
  readonly columnWindow: (widths: readonly number[], forceFull?: boolean) => BoardVirtualColumnWindow;
  readonly updateRowsFromViewport: (root: HTMLElement, rowHeight: number, forceFull?: boolean) => boolean;
  readonly updateColumnsFromScroller: (scroller: HTMLElement, widths: readonly number[], forceFull?: boolean) => boolean;
  readonly ensureRowVisible: (groupId: string, rowIndex: number, totalRows: number, rowHeight: number, forceFull?: boolean) => boolean;
  readonly ensureColumnVisible: (columnIndex: number, widths: readonly number[], forceFull?: boolean) => { readonly changed: boolean; readonly scrollLeft: number };
  readonly reset: () => void;
}

const nearViewport = (rect: DOMRect): boolean => rect.bottom >= -window.innerHeight && rect.top <= window.innerHeight * 2;

export function createBoardTableVirtualizationController(): BoardTableVirtualizationController {
  const rowViewports = new Map<string, RowViewportState>();
  let columnViewport: ColumnViewportState = {
    scrollOffset: 0,
    viewportWidth: BOARD_TABLE_VIRTUALIZATION_POLICY.defaultColumnViewportPx,
  };

  const rowWindow = (groupId: string, totalRows: number, rowHeight: number, forceFull = false): BoardVirtualRowWindow => {
    const viewport = rowViewports.get(groupId) ?? {
      scrollOffset: 0,
      viewportHeight: BOARD_TABLE_VIRTUALIZATION_POLICY.defaultViewportRows * rowHeight,
    };
    return calculateBoardVirtualRowWindow({ totalRows, rowHeight, forceFull, ...viewport });
  };

  const columnWindow = (widths: readonly number[], forceFull = false): BoardVirtualColumnWindow => calculateBoardVirtualColumnWindow({
    widths,
    forceFull,
    scrollOffset: columnViewport.scrollOffset,
    viewportWidth: columnViewport.viewportWidth,
  });

  const updateRowsFromViewport = (root: HTMLElement, rowHeight: number, forceFull = false): boolean => {
    let changed = false;
    root.querySelectorAll<HTMLElement>('tbody.board-item-list[data-group-id][data-virtual-row-total]').forEach((tbody) => {
      const groupId = tbody.dataset.groupId;
      const totalRows = Number(tbody.dataset.virtualRowTotal ?? 0);
      if (!groupId || totalRows < BOARD_TABLE_VIRTUALIZATION_POLICY.rowThreshold || forceFull) return;
      const rect = tbody.getBoundingClientRect();
      if (!nearViewport(rect)) return;
      const viewportTop = Math.max(0, rect.top);
      const viewportBottom = Math.min(window.innerHeight, rect.bottom);
      const viewportHeight = Math.max(rowHeight, viewportBottom - viewportTop || window.innerHeight);
      const scrollOffset = Math.max(0, Math.min(totalRows * rowHeight, -rect.top));
      const previous = rowViewports.get(groupId);
      const next = { scrollOffset, viewportHeight };
      const previousWindow = rowWindow(groupId, totalRows, rowHeight, false);
      rowViewports.set(groupId, next);
      const nextWindow = rowWindow(groupId, totalRows, rowHeight, false);
      if (!previous || previousWindow.start !== nextWindow.start || previousWindow.end !== nextWindow.end) changed = true;
    });
    return changed;
  };

  const updateColumnsFromScroller = (scroller: HTMLElement, widths: readonly number[], forceFull = false): boolean => {
    if (forceFull || widths.length < BOARD_TABLE_VIRTUALIZATION_POLICY.columnThreshold) return false;
    const previous = columnWindow(widths, false);
    columnViewport = {
      scrollOffset: Math.max(0, scroller.scrollLeft),
      viewportWidth: Math.max(1, scroller.clientWidth),
    };
    const next = columnWindow(widths, false);
    return previous.start !== next.start || previous.end !== next.end;
  };

  const ensureRowVisible = (groupId: string, rowIndex: number, totalRows: number, rowHeight: number, forceFull = false): boolean => {
    const current = rowWindow(groupId, totalRows, rowHeight, forceFull);
    if (!current.enabled || boardVirtualRowContains(current, rowIndex)) return false;
    const viewport = rowViewports.get(groupId) ?? {
      scrollOffset: 0,
      viewportHeight: BOARD_TABLE_VIRTUALIZATION_POLICY.defaultViewportRows * rowHeight,
    };
    rowViewports.set(groupId, {
      scrollOffset: Math.max(0, rowIndex * rowHeight - viewport.viewportHeight / 2),
      viewportHeight: viewport.viewportHeight,
    });
    return true;
  };

  const ensureColumnVisible = (columnIndex: number, widths: readonly number[], forceFull = false): { readonly changed: boolean; readonly scrollLeft: number } => {
    const current = columnWindow(widths, forceFull);
    if (!current.enabled || boardVirtualColumnContains(current, columnIndex)) {
      return Object.freeze({ changed: false, scrollLeft: columnViewport.scrollOffset });
    }
    const targetOffset = boardVirtualColumnOffset(widths, columnIndex);
    columnViewport = { ...columnViewport, scrollOffset: targetOffset };
    return Object.freeze({ changed: true, scrollLeft: targetOffset });
  };

  const reset = (): void => {
    rowViewports.clear();
    columnViewport = {
      scrollOffset: 0,
      viewportWidth: BOARD_TABLE_VIRTUALIZATION_POLICY.defaultColumnViewportPx,
    };
  };

  return Object.freeze({ rowWindow, columnWindow, updateRowsFromViewport, updateColumnsFromScroller, ensureRowVisible, ensureColumnVisible, reset });
}

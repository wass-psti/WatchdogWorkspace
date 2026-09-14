import { describe, expect, it } from 'vitest';
import {
  BOARD_TABLE_VIRTUALIZATION_POLICY,
  boardVirtualColumnContains,
  boardVirtualColumnOffset,
  boardVirtualRowContains,
  calculateBoardVirtualColumnWindow,
  calculateBoardVirtualRowWindow,
} from '../../../src/features/boards/virtualization/board-table-virtualization.ts';

describe('board virtualization planner', () => {
  it('keeps small row sets fully rendered', () => {
    const window = calculateBoardVirtualRowWindow({ totalRows: 40, scrollOffset: 300, viewportHeight: 440, rowHeight: 44 });
    expect(window).toEqual({ enabled: false, start: 0, end: 40, leadingHeight: 0, trailingHeight: 0, total: 40 });
  });

  it('creates an overscanned and chunk-aligned row window for large boards', () => {
    const window = calculateBoardVirtualRowWindow({ totalRows: 500, scrollOffset: 4400, viewportHeight: 440, rowHeight: 44 });
    expect(window.enabled).toBe(true);
    expect(window.start % BOARD_TABLE_VIRTUALIZATION_POLICY.rowWindowChunk).toBe(0);
    expect(window.end).toBeGreaterThan(window.start);
    expect(window.leadingHeight).toBe(window.start * 44);
    expect(window.trailingHeight).toBe((500 - window.end) * 44);
    expect(boardVirtualRowContains(window, window.start)).toBe(true);
    expect(boardVirtualRowContains(window, window.end)).toBe(false);
  });

  it('forces a full row render when requested', () => {
    expect(calculateBoardVirtualRowWindow({ totalRows: 500, scrollOffset: 4400, viewportHeight: 440, rowHeight: 44, forceFull: true }).enabled).toBe(false);
  });

  it('keeps small column sets fully rendered', () => {
    const window = calculateBoardVirtualColumnWindow({ widths: [120, 140, 160], scrollOffset: 100, viewportWidth: 300 });
    expect(window.enabled).toBe(false);
    expect(window.start).toBe(0);
    expect(window.end).toBe(3);
  });

  it('creates a bounded column window and computes offsets', () => {
    const widths = Array.from({ length: 24 }, (_, index) => 120 + (index % 3) * 20);
    const window = calculateBoardVirtualColumnWindow({ widths, scrollOffset: 1400, viewportWidth: 720 });
    expect(window.enabled).toBe(true);
    expect(window.start).toBeGreaterThanOrEqual(0);
    expect(window.end).toBeLessThanOrEqual(widths.length);
    expect(window.end).toBeGreaterThan(window.start);
    expect(boardVirtualColumnContains(window, window.start)).toBe(true);
    expect(boardVirtualColumnContains(window, window.end)).toBe(false);
    expect(boardVirtualColumnOffset(widths, 3)).toBe(widths[0] + widths[1] + widths[2]);
  });

  it('normalizes invalid dimensions rather than producing invalid windows', () => {
    const rows = calculateBoardVirtualRowWindow({ totalRows: 200, scrollOffset: Number.NaN, viewportHeight: 0, rowHeight: Number.NaN });
    const columns = calculateBoardVirtualColumnWindow({ widths: Array(18).fill(Number.NaN), scrollOffset: Number.POSITIVE_INFINITY, viewportWidth: 0 });
    expect(Number.isFinite(rows.leadingHeight)).toBe(true);
    expect(Number.isFinite(rows.trailingHeight)).toBe(true);
    expect(Number.isFinite(columns.leadingWidth)).toBe(true);
    expect(Number.isFinite(columns.trailingWidth)).toBe(true);
  });
});

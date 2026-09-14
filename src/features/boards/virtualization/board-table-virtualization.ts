export const BOARD_TABLE_VIRTUALIZATION_POLICY = Object.freeze({
  rowThreshold: 160,
  columnThreshold: 18,
  rowOverscan: 16,
  rowWindowChunk: 8,
  columnOverscanPx: 320,
  defaultViewportRows: 18,
  defaultColumnViewportPx: 960,
} as const);

export interface BoardVirtualRowWindow {
  readonly enabled: boolean;
  readonly start: number;
  readonly end: number;
  readonly leadingHeight: number;
  readonly trailingHeight: number;
  readonly total: number;
}

export interface BoardVirtualColumnWindow {
  readonly enabled: boolean;
  readonly start: number;
  readonly end: number;
  readonly leadingWidth: number;
  readonly trailingWidth: number;
  readonly total: number;
}

export interface BoardVirtualRowWindowInput {
  readonly totalRows: number;
  readonly scrollOffset: number;
  readonly viewportHeight: number;
  readonly rowHeight: number;
  readonly forceFull?: boolean;
}

export interface BoardVirtualColumnWindowInput {
  readonly widths: readonly number[];
  readonly scrollOffset: number;
  readonly viewportWidth: number;
  readonly forceFull?: boolean;
}

const clamp = (value: number, minimum: number, maximum: number): number => Math.min(maximum, Math.max(minimum, value));
const positiveFinite = (value: number, fallback: number): number => Number.isFinite(value) && value > 0 ? value : fallback;
const widthSum = (widths: readonly number[], start = 0, end = widths.length): number => {
  let sum = 0;
  for (let index = start; index < end; index += 1) sum += positiveFinite(widths[index] ?? 160, 160);
  return sum;
};

const normalizedWidthsWithPrefix = (widths: readonly number[]): Readonly<{ widths: readonly number[]; prefix: readonly number[]; totalWidth: number }> => {
  const normalized = new Array<number>(widths.length);
  const prefix = new Array<number>(widths.length + 1);
  prefix[0] = 0;
  for (let index = 0; index < widths.length; index += 1) {
    const width = positiveFinite(widths[index] ?? 160, 160);
    normalized[index] = width;
    prefix[index + 1] = (prefix[index] ?? 0) + width;
  }
  return Object.freeze({ widths: Object.freeze(normalized), prefix: Object.freeze(prefix), totalWidth: prefix[widths.length] ?? 0 });
};

export function calculateBoardVirtualRowWindow(input: BoardVirtualRowWindowInput): BoardVirtualRowWindow {
  const total = Math.max(0, Math.floor(input.totalRows));
  const rowHeight = positiveFinite(input.rowHeight, 44);
  const viewportHeight = positiveFinite(input.viewportHeight, BOARD_TABLE_VIRTUALIZATION_POLICY.defaultViewportRows * rowHeight);
  const enabled = !input.forceFull && total >= BOARD_TABLE_VIRTUALIZATION_POLICY.rowThreshold;
  if (!enabled || total === 0) return Object.freeze({ enabled: false, start: 0, end: total, leadingHeight: 0, trailingHeight: 0, total });

  const maximumOffset = Math.max(0, total * rowHeight - viewportHeight);
  const scrollOffset = clamp(Number.isFinite(input.scrollOffset) ? input.scrollOffset : 0, 0, maximumOffset);
  const firstVisible = Math.floor(scrollOffset / rowHeight);
  const lastVisibleExclusive = Math.min(total, Math.ceil((scrollOffset + viewportHeight) / rowHeight));
  const chunk = BOARD_TABLE_VIRTUALIZATION_POLICY.rowWindowChunk;
  const rawStart = Math.max(0, firstVisible - BOARD_TABLE_VIRTUALIZATION_POLICY.rowOverscan);
  const rawEnd = Math.min(total, lastVisibleExclusive + BOARD_TABLE_VIRTUALIZATION_POLICY.rowOverscan);
  const start = Math.floor(rawStart / chunk) * chunk;
  const end = Math.min(total, Math.ceil(rawEnd / chunk) * chunk);

  return Object.freeze({
    enabled: true,
    start,
    end,
    leadingHeight: start * rowHeight,
    trailingHeight: Math.max(0, total - end) * rowHeight,
    total,
  });
}

export function calculateBoardVirtualColumnWindow(input: BoardVirtualColumnWindowInput): BoardVirtualColumnWindow {
  const normalized = normalizedWidthsWithPrefix(input.widths);
  const widths = normalized.widths;
  const prefix = normalized.prefix;
  const total = widths.length;
  const viewportWidth = positiveFinite(input.viewportWidth, BOARD_TABLE_VIRTUALIZATION_POLICY.defaultColumnViewportPx);
  const enabled = !input.forceFull && total >= BOARD_TABLE_VIRTUALIZATION_POLICY.columnThreshold;
  if (!enabled || total === 0) return Object.freeze({ enabled: false, start: 0, end: total, leadingWidth: 0, trailingWidth: 0, total });

  const totalWidth = normalized.totalWidth;
  const maximumOffset = Math.max(0, totalWidth - viewportWidth);
  const scrollOffset = clamp(Number.isFinite(input.scrollOffset) ? input.scrollOffset : 0, 0, maximumOffset);
  const overscanStart = Math.max(0, scrollOffset - BOARD_TABLE_VIRTUALIZATION_POLICY.columnOverscanPx);
  const overscanEnd = Math.min(totalWidth, scrollOffset + viewportWidth + BOARD_TABLE_VIRTUALIZATION_POLICY.columnOverscanPx);

  let start = 0;
  let cursor = 0;
  while (start < total && cursor + (widths[start] ?? 0) <= overscanStart) {
    cursor += widths[start] ?? 0;
    start += 1;
  }

  let end = start;
  let endCursor = cursor;
  while (end < total && endCursor < overscanEnd) {
    endCursor += widths[end] ?? 0;
    end += 1;
  }
  end = Math.max(start + 1, end);

  return Object.freeze({
    enabled: true,
    start,
    end: Math.min(total, end),
    leadingWidth: prefix[start] ?? 0,
    trailingWidth: Math.max(0, totalWidth - (prefix[Math.min(total, end)] ?? totalWidth)),
    total,
  });
}

export function boardVirtualRowContains(window: BoardVirtualRowWindow, rowIndex: number): boolean {
  return rowIndex >= window.start && rowIndex < window.end;
}

export function boardVirtualColumnContains(window: BoardVirtualColumnWindow, columnIndex: number): boolean {
  return columnIndex >= window.start && columnIndex < window.end;
}

export function boardVirtualColumnOffset(widths: readonly number[], columnIndex: number): number {
  return widthSum(widths, 0, clamp(Math.floor(columnIndex), 0, widths.length));
}

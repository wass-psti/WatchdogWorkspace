export type FloatingSurfacePlacement = 'bottom-end' | 'bottom-start' | 'right-start' | 'left-start' | 'right-center';

export interface FloatingSurfacePositionOptions {
  readonly surface: HTMLElement;
  readonly anchor: HTMLElement;
  readonly placement?: FloatingSurfacePlacement;
  readonly gutter?: number;
  readonly gap?: number;
  readonly minWidth?: number | null;
  readonly maxWidth?: number | null;
  readonly maxHeight?: number | null;
}

export interface FloatingSurfacePositionResult {
  readonly placement: FloatingSurfacePlacement;
  readonly left: number;
  readonly top: number;
  readonly width: number;
  readonly maxHeight: number;
}

const clamp = (value: number, min: number, max: number): number => Math.min(Math.max(value, min), Math.max(min, max));

export function cssPixelValue(element: Element, name: string, fallback: number): number {
  const value = Number.parseFloat(getComputedStyle(element).getPropertyValue(name).trim());
  return Number.isFinite(value) ? value : fallback;
}

export function positionAnchoredSurface({
  surface,
  anchor,
  placement = 'bottom-end',
  gutter = 12,
  gap = 8,
  minWidth = null,
  maxWidth = null,
  maxHeight = null,
}: FloatingSurfacePositionOptions): FloatingSurfacePositionResult {
  const anchorRect = anchor.getBoundingClientRect();
  const rect = surface.getBoundingClientRect();
  const viewportWidth = Math.max(0, window.innerWidth - gutter * 2);
  const viewportHeight = Math.max(0, window.innerHeight - gutter * 2);
  const requestedWidth = Math.max(rect.width, minWidth ?? 0);
  const width = Math.min(requestedWidth, maxWidth ?? viewportWidth, viewportWidth);
  const requestedHeight = Math.min(rect.height || viewportHeight, maxHeight ?? viewportHeight, viewportHeight);
  let resolvedPlacement = placement;
  let left = anchorRect.right - width;
  let top = anchorRect.bottom + gap;

  if (placement === 'bottom-start') left = anchorRect.left;
  if (placement === 'right-start' || placement === 'right-center') {
    left = anchorRect.right + gap;
    top = placement === 'right-center' ? anchorRect.top + (anchorRect.height - requestedHeight) / 2 : anchorRect.top;
    if (left + width > window.innerWidth - gutter && anchorRect.left - gap - width >= gutter) {
      resolvedPlacement = 'left-start';
      left = anchorRect.left - gap - width;
    }
  } else if (placement === 'left-start') {
    left = anchorRect.left - gap - width;
    top = anchorRect.top;
    if (left < gutter && anchorRect.right + gap + width <= window.innerWidth - gutter) {
      resolvedPlacement = 'right-start';
      left = anchorRect.right + gap;
    }
  } else {
    const spaceBelow = window.innerHeight - anchorRect.bottom - gap - gutter;
    const spaceAbove = anchorRect.top - gap - gutter;
    if (spaceBelow < Math.min(requestedHeight, 180) && spaceAbove > spaceBelow) {
      top = anchorRect.top - requestedHeight - gap;
      surface.dataset.verticalPlacement = 'top';
    } else {
      surface.dataset.verticalPlacement = 'bottom';
    }
  }

  left = clamp(left, gutter, window.innerWidth - width - gutter);
  top = clamp(top, gutter, window.innerHeight - requestedHeight - gutter);
  const availableHeight = Math.max(80, window.innerHeight - top - gutter);
  const effectiveMaxHeight = Math.min(maxHeight ?? viewportHeight, availableHeight, viewportHeight);

  surface.dataset.placement = resolvedPlacement;
  surface.style.left = `${Math.round(left)}px`;
  surface.style.top = `${Math.round(top)}px`;
  if (minWidth !== null || maxWidth !== null) surface.style.width = `${Math.round(width)}px`;
  surface.style.maxHeight = `${Math.round(effectiveMaxHeight)}px`;

  return Object.freeze({
    placement: resolvedPlacement,
    left: Math.round(left),
    top: Math.round(top),
    width: Math.round(width),
    maxHeight: Math.round(effectiveMaxHeight),
  });
}

export function menuItemElements(container: HTMLElement | null): HTMLElement[] {
  if (!container) return [];
  return [...container.querySelectorAll<HTMLElement>('[role="menuitem"]:not([aria-disabled="true"]),[role="menuitemradio"]:not([aria-disabled="true"]),button:not(:disabled)')]
    .filter((item, index, rows) => rows.indexOf(item) === index && !item.hidden && item.getClientRects().length > 0);
}

export function focusMenuItem(container: HTMLElement | null, index: number): HTMLElement | null {
  const items = menuItemElements(container);
  if (!items.length) return null;
  const normalized = ((index % items.length) + items.length) % items.length;
  const item = items[normalized] ?? null;
  item?.focus({ preventScroll: true });
  return item;
}

export function focusMenuItemByTypeahead(container: HTMLElement | null, query: string, active: Element | null = document.activeElement): HTMLElement | null {
  const normalized = query.trim().toLocaleLowerCase();
  if (!normalized) return null;
  const items = menuItemElements(container);
  if (!items.length) return null;
  const activeIndex = active instanceof HTMLElement ? items.indexOf(active) : -1;
  const ordered = [...items.slice(activeIndex + 1), ...items.slice(0, activeIndex + 1)];
  const match = ordered.find((item) => (item.textContent || '').trim().toLocaleLowerCase().startsWith(normalized)) ?? null;
  match?.focus({ preventScroll: true });
  return match;
}

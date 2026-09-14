import { describe, expect, it, vi } from 'vitest';
import { createWorkManagementClientStateService } from '../../../assets/js/platform/state/client-state-store.ts';

describe('Work Management client-state service', () => {
  it('starts with the governed shell defaults', () => {
    const service = createWorkManagementClientStateService();
    expect(service.getSnapshot().shell.navigation).toMatchObject({ mode: 'expanded', width: 256, pinned: true, peek: false, resizing: false, mobileOpen: false });
    expect(service.getSnapshot().shell.sections).toEqual({ favorites: true, applications: true, boards: true });
    expect(service.getSnapshot().shell.resourceSearchQuery).toBe('');
  });

  it('hydrates only valid persistent navigation values', () => {
    const service = createWorkManagementClientStateService({ navigation: { mode: 'compact', width: 320, pinned: false }, sections: { boards: false } });
    expect(service.getSnapshot().shell.navigation).toMatchObject({ mode: 'compact', width: 320, pinned: false });
    expect(service.getSnapshot().shell.sections.boards).toBe(false);
  });

  it('rejects invalid widths by retaining the prior width', () => {
    const service = createWorkManagementClientStateService();
    service.updateShellNavigation({ width: -100, peek: true });
    expect(service.getSnapshot().shell.navigation.width).toBe(256);
    expect(service.getSnapshot().shell.navigation.peek).toBe(true);
  });

  it('updates sections and shared search state', () => {
    const service = createWorkManagementClientStateService();
    service.setShellSection('applications', false);
    service.setShellResourceSearchQuery('fuel');
    expect(service.getSnapshot().shell.sections.applications).toBe(false);
    expect(service.getSnapshot().shell.resourceSearchQuery).toBe('fuel');
  });

  it('clears transient shell state without overwriting persistent preferences', () => {
    const service = createWorkManagementClientStateService({ navigation: { mode: 'compact', width: 300, pinned: false } });
    service.updateShellNavigation({ peek: true, resizing: true, mobileOpen: true });
    service.setShellResourceSearchQuery('board');
    service.resetTransientShellState();
    expect(service.getSnapshot().shell.navigation).toMatchObject({ mode: 'compact', width: 300, pinned: false, peek: false, resizing: false, mobileOpen: false });
    expect(service.getSnapshot().shell.resourceSearchQuery).toBe('');
  });

  it('notifies subscribers with immutable snapshots', () => {
    const service = createWorkManagementClientStateService();
    const listener = vi.fn();
    const unsubscribe = service.subscribe(listener);
    service.setShellSection('favorites', false);
    expect(listener).toHaveBeenCalledTimes(1);
    const [next, previous] = listener.mock.calls[0];
    expect(next.shell.sections.favorites).toBe(false);
    expect(previous.shell.sections.favorites).toBe(true);
    expect(Object.isFrozen(next)).toBe(true);
    expect(Object.isFrozen(next.shell)).toBe(true);
    unsubscribe();
  });
});

import { createElement } from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import {
  WMAlert,
  WMCard,
  WMFilterBar,
  WMFilterChip,
  WMSearchInput,
  WMSelector,
  WMSegmentedControl,
} from '../../../src/design-system/shared-primitives/index.ts';

describe('M80 shared primitive accessibility and interaction contracts', () => {
  it('provides an accessible search primitive and clear action', async () => {
    const clear = vi.fn();
    const user = userEvent.setup();
    render(createElement(WMSearchInput, { label: 'Search requests', defaultValue: 'pump', onClear: clear }));
    expect(screen.getByRole('searchbox', { name: 'Search requests' })).toHaveValue('pump');
    await user.click(screen.getByRole('button', { name: 'Clear search' }));
    expect(clear).toHaveBeenCalledTimes(1);
  });

  it('keeps selector semantics native', () => {
    render(createElement(WMSelector, { accessibleLabel: 'Status' }, [
      createElement('option', { key: 'all', value: 'all' }, 'All'),
      createElement('option', { key: 'open', value: 'open' }, 'Open'),
    ]));
    expect(screen.getByRole('combobox', { name: 'Status' })).toHaveAttribute('data-wm-shared-primitive', 'selector');
  });

  it('exposes named filter region and pressed filter state', () => {
    render(createElement(WMFilterBar, { label: 'Request filters' },
      createElement(WMFilterChip, { selected: true, count: 3 }, 'Pending')));
    expect(screen.getByRole('region', { name: 'Request filters' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Pending/ })).toHaveAttribute('aria-pressed', 'true');
  });

  it('supports segmented keyboard focus movement and selection', async () => {
    const onValueChange = vi.fn();
    const user = userEvent.setup();
    render(createElement(WMSegmentedControl, {
      label: 'Density',
      value: 'comfortable',
      onValueChange,
      options: [
        { value: 'comfortable', label: 'Comfortable' },
        { value: 'compact', label: 'Compact' },
      ],
    }));
    const comfortable = screen.getByRole('button', { name: 'Comfortable' });
    const compact = screen.getByRole('button', { name: 'Compact' });
    expect(comfortable).toHaveAttribute('aria-pressed', 'true');
    comfortable.focus();
    await user.keyboard('{ArrowRight}');
    expect(compact).toHaveFocus();
    await user.keyboard('{Enter}');
    expect(onValueChange).toHaveBeenCalledWith('compact');
  });


  it('skips disabled segmented options and wraps arrow navigation', async () => {
    const user = userEvent.setup();
    render(createElement(WMSegmentedControl, {
      label: 'View mode',
      value: 'table',
      onValueChange: vi.fn(),
      options: [
        { value: 'table', label: 'Table' },
        { value: 'timeline', label: 'Timeline', disabled: true },
        { value: 'kanban', label: 'Kanban' },
      ],
    }));
    const table = screen.getByRole('button', { name: 'Table' });
    const timeline = screen.getByRole('button', { name: 'Timeline' });
    const kanban = screen.getByRole('button', { name: 'Kanban' });
    table.focus();
    await user.keyboard('{ArrowRight}');
    expect(kanban).toHaveFocus();
    await user.keyboard('{ArrowRight}');
    expect(table).toHaveFocus();
    expect(timeline).toBeDisabled();
  });

  it('supports segmented Home and End navigation across enabled options', async () => {
    const user = userEvent.setup();
    render(createElement(WMSegmentedControl, {
      label: 'Layout',
      value: 'middle',
      onValueChange: vi.fn(),
      options: [
        { value: 'first', label: 'First' },
        { value: 'middle', label: 'Middle' },
        { value: 'last', label: 'Last' },
      ],
    }));
    const first = screen.getByRole('button', { name: 'First' });
    const middle = screen.getByRole('button', { name: 'Middle' });
    const last = screen.getByRole('button', { name: 'Last' });
    middle.focus();
    await user.keyboard('{End}');
    expect(last).toHaveFocus();
    await user.keyboard('{Home}');
    expect(first).toHaveFocus();
  });

  it('handles one enabled segmented option without losing focus', async () => {
    const user = userEvent.setup();
    render(createElement(WMSegmentedControl, {
      label: 'Single mode',
      value: 'only',
      onValueChange: vi.fn(),
      options: [{ value: 'only', label: 'Only' }],
    }));
    const only = screen.getByRole('button', { name: 'Only' });
    only.focus();
    await user.keyboard('{ArrowRight}{ArrowLeft}{Home}{End}');
    expect(only).toHaveFocus();
  });

  it('keeps globally disabled segmented controls inert', async () => {
    const onValueChange = vi.fn();
    const user = userEvent.setup();
    render(createElement(WMSegmentedControl, {
      label: 'Disabled density',
      value: 'comfortable',
      disabled: true,
      onValueChange,
      options: [
        { value: 'comfortable', label: 'Comfortable' },
        { value: 'compact', label: 'Compact' },
      ],
    }));
    const comfortable = screen.getByRole('button', { name: 'Comfortable' });
    const compact = screen.getByRole('button', { name: 'Compact' });
    expect(comfortable).toBeDisabled();
    expect(compact).toBeDisabled();
    await user.click(compact);
    expect(onValueChange).not.toHaveBeenCalled();
  });

  it('reuses certified alert and card presentation contracts', () => {
    render(createElement('div', null,
      createElement(WMAlert, { title: 'Saved', description: 'Changes are synced.', tone: 'success' }),
      createElement(WMCard, { 'aria-label': 'Summary card', elevated: true }, 'Summary')));
    expect(screen.getByText('Saved').closest('[data-wm-shared-primitive="alert"]')).toBeTruthy();
    expect(screen.getByLabelText('Summary card')).toHaveClass('wm-card');
  });
});

import { createElement } from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { WMButton, WMIconButton } from '../../../src/design-system/interactions/button.tsx';

describe('Work Management button primitives', () => {
  it('renders accessible button defaults', () => {
    render(createElement(WMButton, null, 'Save'));
    const button = screen.getByRole('button', { name: 'Save' });
    expect(button).toHaveAttribute('type', 'button');
    expect(button).toHaveAttribute('data-size', 'md');
    expect(button).toHaveAttribute('data-tone', 'neutral');
    expect(button).toHaveAttribute('data-variant', 'outline');
    expect(button).toBeEnabled();
  });

  it('exposes loading state and blocks interaction', async () => {
    const onClick = vi.fn();
    const user = userEvent.setup();
    render(createElement(WMButton, { loading: true, onClick }, 'Saving'));
    const button = screen.getByRole('button', { name: 'Saving' });
    expect(button).toBeDisabled();
    expect(button).toHaveAttribute('aria-busy', 'true');
    expect(button).toHaveAttribute('data-loading', '');
    await user.click(button);
    expect(onClick).not.toHaveBeenCalled();
  });

  it('preserves semantic props and invokes user interaction', async () => {
    const onClick = vi.fn();
    const user = userEvent.setup();
    render(createElement(WMButton, { type: 'submit', tone: 'accent', variant: 'solid', size: 'lg', onClick }, 'Create'));
    const button = screen.getByRole('button', { name: 'Create' });
    expect(button).toHaveAttribute('type', 'submit');
    expect(button).toHaveAttribute('data-tone', 'accent');
    expect(button).toHaveAttribute('data-variant', 'solid');
    expect(button).toHaveAttribute('data-size', 'lg');
    await user.click(button);
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('gives icon-only buttons an accessible name', () => {
    render(createElement(WMIconButton, { label: 'More actions' }, createElement('span', { 'aria-hidden': 'true' }, '⋯')));
    expect(screen.getByRole('button', { name: 'More actions' })).toBeInTheDocument();
  });
});

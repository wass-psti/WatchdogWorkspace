import { describe, expect, it } from 'vitest';
import { createRoutePolicyService } from '../../../assets/js/runtime/services/route-policy.ts';

const decide = (overrides = {}) => createRoutePolicyService().decide({
  route: { name: 'home' },
  initialized: true,
  status: 'authenticated',
  authenticated: true,
  ...overrides,
});

describe('route policy', () => {
  it('waits while authentication is initializing', () => {
    expect(decide({ initialized: false, status: 'initializing', authenticated: false })).toEqual({ kind: 'wait' });
    expect(decide({ status: 'restoring', authenticated: false })).toEqual({ kind: 'wait' });
  });

  it('renders the disabled-account boundary', () => {
    expect(decide({ status: 'disabled', authenticated: false })).toEqual({ kind: 'render-disabled' });
  });

  it('redirects anonymous users away from protected routes', () => {
    expect(decide({ route: { name: 'boards' }, status: 'anonymous', authenticated: false })).toEqual({
      kind: 'redirect',
      target: 'login',
      rememberReturnRoute: true,
    });
  });

  it('allows anonymous authentication routes', () => {
    expect(decide({ route: { name: 'login' }, status: 'anonymous', authenticated: false })).toEqual({ kind: 'allow' });
    expect(decide({ route: { name: 'register' }, status: 'anonymous', authenticated: false })).toEqual({ kind: 'allow' });
    expect(decide({ route: { name: 'verify' }, status: 'anonymous', authenticated: false })).toEqual({ kind: 'allow' });
  });

  it('redirects authenticated users away from login and register', () => {
    expect(decide({ route: { name: 'login' } })).toEqual({ kind: 'redirect', target: '', rememberReturnRoute: false });
    expect(decide({ route: { name: 'register' } })).toEqual({ kind: 'redirect', target: '', rememberReturnRoute: false });
  });

  it('allows authenticated protected routes', () => {
    expect(decide({ route: { name: 'board', boardId: 'board-1' } })).toEqual({ kind: 'allow' });
  });
});

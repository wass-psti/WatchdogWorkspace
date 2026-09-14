import { describe, expect, it } from 'vitest';
import { createRoutePolicyService } from '../../../assets/js/runtime/services/route-policy.ts';

const decide = (overrides = {}) => createRoutePolicyService().decide({
  route: { name: 'home' },
  initialized: true,
  status: 'authenticated',
  authenticated: true,
  canManageUsers: true,
  canAccessModule: () => true,
  ...overrides,
});

describe('M39 route authorization and recovery', () => {
  it('waits while a persisted session is restoring', () => {
    expect(decide({ status: 'restoring', authenticated: false })).toEqual({ kind: 'wait' });
  });

  it('renders the explicit access-context recovery boundary', () => {
    expect(decide({ status: 'access-error', authenticated: false })).toEqual({ kind: 'render-auth-recovery' });
  });

  it('blocks Users for identities without user-management authority', () => {
    expect(decide({ route: { name: 'users' }, canManageUsers: false })).toEqual({
      kind: 'render-forbidden',
      reason: 'users',
    });
  });

  it('blocks embedded modules when the current assignment policy denies access', () => {
    expect(decide({
      route: { name: 'app', moduleId: 'fueltrack-plus' },
      canAccessModule: () => false,
    })).toEqual({
      kind: 'render-forbidden',
      reason: 'module',
    });
  });

  it('allows an assigned embedded module', () => {
    expect(decide({
      route: { name: 'app', moduleId: 'time-tracker' },
      canAccessModule: (moduleId) => moduleId === 'time-tracker',
    })).toEqual({ kind: 'allow' });
  });
});

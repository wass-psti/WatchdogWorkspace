import type { ModuleAssignment, PlatformRole } from '../../types/auth.ts';

export const M39_AUTH_ACCESS_CONTEXT_SCHEMA_VERSION = '1.43.2-m39-v1' as const;

export type AuthSessionPersistence = 'none' | 'persistent' | 'memory-only';

export interface AuthAccessProfile {
  readonly id: string;
  readonly email?: string | null;
  readonly display_name?: string | null;
  readonly platform_role: PlatformRole;
  readonly status: 'active' | 'disabled';
  readonly created_at?: string | null;
  readonly updated_at?: string | null;
}

export interface AuthAccessContextPayload {
  readonly schema_version: typeof M39_AUTH_ACCESS_CONTEXT_SCHEMA_VERSION;
  readonly user_id: string;
  readonly profile: AuthAccessProfile;
  readonly assignments: readonly (ModuleAssignment & Readonly<{ user_id?: string | null; updated_at?: string | null }>)[];
  readonly revision: string;
}

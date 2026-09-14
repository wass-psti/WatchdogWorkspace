import * as z from 'zod';
import { moduleIdSchema, nonEmptyStringSchema, platformRoleSchema } from './primitives.ts';

export const moduleAssignmentSchema = z.object({
  module_id: moduleIdSchema,
  enabled: z.boolean(),
  role: z.string().nullable().optional(),
}).strict();

export const moduleAccessDecisionInputSchema = z.object({
  authenticated: z.boolean(),
  accountActive: z.boolean(),
  platformRole: z.union([platformRoleSchema, z.string(), z.null(), z.undefined()]),
  assignments: z.array(moduleAssignmentSchema).optional(),
  moduleId: z.union([moduleIdSchema, z.string()]),
}).strict();

export const embeddedIdentityUserSchema = z.object({
  id: nonEmptyStringSchema,
  email: nonEmptyStringSchema,
  displayName: z.string(),
}).strict();

export const embeddedModuleIdentityContextSchema = z.object({
  type: z.literal('wm:identity-context'),
  version: z.literal(1),
  moduleId: moduleIdSchema,
  user: embeddedIdentityUserSchema,
  platformRole: platformRoleSchema,
  accountStatus: z.string(),
  module: z.object({ role: z.string().nullable(), enabled: z.boolean() }).strict(),
  updatedAt: z.string(),
  allowed: z.boolean().optional(),
}).strict();

export const authenticatedUserSchema = z.object({
  id: nonEmptyStringSchema,
  email: nonEmptyStringSchema,
  displayName: z.string().nullable().optional(),
  platformRole: platformRoleSchema,
  active: z.boolean(),
}).strict();

import * as z from 'zod';
import { moduleIdSchema, nonEmptyStringSchema, nonNegativeIntegerSchema } from './primitives.ts';

export const routeNameSchema = z.enum([
  'home', 'settings', 'account', 'users', 'boards', 'board', 'login', 'register', 'verify', 'app', 'disabled', 'not-found',
]);

export const applicationRouteSchema = z.object({
  name: routeNameSchema,
  moduleId: z.string().optional(),
  boardId: z.string().optional(),
}).strict();

export const authRuntimeStatusSchema = z.enum([
  'initializing', 'restoring', 'setup-required', 'anonymous', 'authenticated', 'disabled', 'expired', 'invalid', 'terminated',
]);

export const routeAccessContextSchema = z.object({
  route: applicationRouteSchema,
  initialized: z.boolean(),
  status: authRuntimeStatusSchema,
  authenticated: z.boolean(),
}).strict();

export const routeAccessDecisionSchema = z.discriminatedUnion('kind', [
  z.object({ kind: z.literal('wait') }).strict(),
  z.object({ kind: z.literal('render-disabled') }).strict(),
  z.object({ kind: z.literal('redirect'), target: z.enum(['login', '']), rememberReturnRoute: z.boolean() }).strict(),
  z.object({ kind: z.literal('allow') }).strict(),
]);

export const runtimeOperationKindSchema = z.enum(['get', 'set', 'execute']);

export const runtimeContextValueSchema: z.ZodType<unknown> = z.lazy(() => z.union([
  z.string(),
  z.number().finite(),
  z.boolean(),
  z.null(),
  z.undefined(),
  z.array(runtimeContextValueSchema),
  z.record(z.string(), runtimeContextValueSchema),
]));

export const runtimeContextSchema = z.record(z.string(), runtimeContextValueSchema);

export const runtimeEventSchema = z.object({
  type: nonEmptyStringSchema,
  payload: z.unknown(),
  context: runtimeContextSchema,
  timestamp: nonNegativeIntegerSchema,
}).strict();

const lifecycleBase = {
  generation: nonNegativeIntegerSchema,
};

export const embeddedLifecycleStateSchema = z.discriminatedUnion('kind', [
  z.object({ kind: z.literal('uninitialized'), ...lifecycleBase, moduleId: z.null() }).strict(),
  z.object({ kind: z.literal('initializing'), ...lifecycleBase, moduleId: moduleIdSchema }).strict(),
  z.object({ kind: z.literal('ready'), ...lifecycleBase, moduleId: moduleIdSchema }).strict(),
  z.object({ kind: z.literal('suspended'), ...lifecycleBase, moduleId: moduleIdSchema, reason: z.enum(['hidden', 'host']) }).strict(),
  z.object({ kind: z.literal('failed'), ...lifecycleBase, moduleId: moduleIdSchema, message: nonEmptyStringSchema }).strict(),
  z.object({ kind: z.literal('disposed'), ...lifecycleBase, moduleId: moduleIdSchema.nullable() }).strict(),
]);

export const embeddedLifecycleEventSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('initialize'), moduleId: moduleIdSchema }).strict(),
  z.object({ type: z.literal('ready') }).strict(),
  z.object({ type: z.literal('suspend'), reason: z.enum(['hidden', 'host']) }).strict(),
  z.object({ type: z.literal('resume') }).strict(),
  z.object({ type: z.literal('fail'), message: nonEmptyStringSchema }).strict(),
  z.object({ type: z.literal('dispose') }).strict(),
]);

export const normalizedRuntimeFailureSchema = z.object({
  message: nonEmptyStringSchema,
  code: z.string(),
  status: z.number().int().positive().nullable(),
}).strict();

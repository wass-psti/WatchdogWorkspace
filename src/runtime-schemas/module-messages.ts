import * as z from 'zod';
import {
  boundedIdentifierSchema,
  moduleIdSchema,
  moduleStateScopeSchema,
  nonEmptyStringSchema,
  nonNegativeIntegerSchema,
  unknownRecordSchema,
} from './primitives.ts';
import { embeddedModuleIdentityContextSchema } from './auth.ts';

export const moduleActivityEventSchema = z.object({
  id: z.string().trim().min(8).max(160),
  type: z.enum(['submit', 'review', 'issue', 'system']).default('system'),
  title: z.string().trim().min(1).max(240),
  message: z.string().max(4000).default(''),
  requestId: nonEmptyStringSchema.nullable().default(null),
  payload: unknownRecordSchema.default({}),
}).strict();

export const moduleDataEnvelopeSchema = z.object({
  type: z.literal('wm:data:request'),
  requestId: boundedIdentifierSchema,
  moduleId: moduleIdSchema,
}).passthrough();

const requestBase = z.object({
  type: z.literal('wm:data:request'),
  requestId: boundedIdentifierSchema,
  moduleId: moduleIdSchema,
});

const listRequest = requestBase.extend({ action: z.literal('list') }).strict();
const directoryRequest = requestBase.extend({ action: z.literal('directory') }).strict();
const putRequest = requestBase.extend({
  action: z.literal('put'),
  key: nonEmptyStringSchema,
  value: z.string(),
  scope: moduleStateScopeSchema.default('shared'),
  expectedRevision: nonNegativeIntegerSchema.nullable().default(null),
}).strict();
const deleteRequest = requestBase.extend({
  action: z.literal('delete'),
  key: nonEmptyStringSchema,
  scope: moduleStateScopeSchema.default('shared'),
  expectedRevision: nonNegativeIntegerSchema.nullable().default(null),
}).strict();
const acquireLockRequest = requestBase.extend({
  action: z.literal('lock:acquire'),
  lockKey: z.string().trim().min(3),
  ttlSeconds: z.number().int().nullable().optional().transform((value) => Math.max(3, Math.min(value ?? 30, 120))),
}).strict();
const releaseLockRequest = requestBase.extend({
  action: z.literal('lock:release'),
  lockKey: nonEmptyStringSchema,
  token: nonEmptyStringSchema,
}).strict();
const attendanceCommitRequest = requestBase.extend({
  action: z.literal('attendance:commit'),
  moduleId: z.literal('time-tracker'),
  operation: z.enum(['clock-in', 'clock-out']),
  recordId: nonEmptyStringSchema.nullable().default(null),
  location: z.string().default(''),
  department: z.string().default(''),
  geo: unknownRecordSchema.default({}),
  workNote: z.string().nullable().default(null),
  attendancePolicy: unknownRecordSchema.default({}),
}).strict();
const activityListRequest = requestBase.extend({
  action: z.literal('activity:list'),
  moduleId: z.literal('fueltrack-plus'),
  beforeSequence: nonNegativeIntegerSchema.nullable().default(null),
  limit: z.number().int().positive().nullable().optional().transform((value) => Math.max(1, Math.min(value ?? 500, 2000))),
}).strict();
const activityAppendRequest = requestBase.extend({
  action: z.literal('activity:append'),
  moduleId: z.literal('fueltrack-plus'),
  event: moduleActivityEventSchema,
}).strict();
const commitRequestsActivityRequest = requestBase.extend({
  action: z.literal('commit:requests-activity'),
  moduleId: z.literal('fueltrack-plus'),
  value: z.string(),
  expectedRevision: nonNegativeIntegerSchema.nullable().optional().transform((value) => value ?? 0),
  event: moduleActivityEventSchema,
}).strict();

export const moduleDataRequestSchema = z.discriminatedUnion('action', [
  listRequest,
  directoryRequest,
  putRequest,
  deleteRequest,
  acquireLockRequest,
  releaseLockRequest,
  attendanceCommitRequest,
  activityListRequest,
  activityAppendRequest,
  commitRequestsActivityRequest,
]);

export const moduleIdentityRequestSchema = z.object({
  type: z.literal('wm:identity:request'),
  moduleId: moduleIdSchema,
}).strict();

export const moduleDataResponseSchema = z.object({
  type: z.literal('wm:data:response'),
  requestId: z.string(),
  ok: z.boolean(),
  payload: z.unknown(),
  error: z.string().nullable(),
}).strict();

export const embeddedReadyMessageSchema = z.object({
  type: z.literal('wm:host:ready'),
  detail: z.object({ name: nonEmptyStringSchema, moduleId: moduleIdSchema }).strict(),
}).strict();

export const embeddedErrorMessageSchema = z.object({
  type: z.literal('wm:host:error'),
  detail: z.object({ name: nonEmptyStringSchema, moduleId: moduleIdSchema, message: nonEmptyStringSchema }).strict(),
}).strict();

export const embeddedHostInvalidateMessageSchema = z.object({
  type: z.literal('wm:host:invalidate'),
  moduleId: moduleIdSchema,
  reason: z.enum(['backup-restore', 'host-refresh']),
}).strict();

export const embeddedHostToModuleMessageSchema = z.union([
  embeddedModuleIdentityContextSchema,
  embeddedHostInvalidateMessageSchema,
]);

import * as z from 'zod';
import { nonNegativeIntegerSchema, nonEmptyStringSchema, unknownRecordSchema } from './primitives.ts';

export const pageRequestSchema = z.object({
  cursor: z.string().nullable().optional(),
  limit: z.number().int().positive().max(2000).optional(),
}).strict();

export const persistenceEnvelopeSchema = <TSchema extends z.ZodType>(dataSchema: TSchema) => z.object({
  data: dataSchema,
  receivedAt: nonNegativeIntegerSchema,
}).strict();

export const moduleStateRowSchema = z.object({
  state_key: nonEmptyStringSchema,
  value: z.string(),
  scope: z.enum(['shared', 'user']),
  revision: nonNegativeIntegerSchema,
}).strict();

export const moduleDirectoryEntrySchema = z.object({
  id: z.string().optional(),
  email: z.string().optional(),
  role: z.string().optional(),
}).catchall(z.unknown());

export const moduleActivityItemSchema = z.object({
  id: nonEmptyStringSchema,
  sequence: nonNegativeIntegerSchema,
  type: z.string(),
  title: z.string(),
  message: z.string(),
  requestId: z.string(),
  actorUserId: z.string().nullable(),
  actorEmail: z.string(),
  actor: z.string(),
  actorRole: z.string(),
  at: z.string(),
  payload: unknownRecordSchema,
}).catchall(z.unknown());

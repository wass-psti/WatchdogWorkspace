import * as z from 'zod';
import { moduleIdSchema, nonEmptyStringSchema, nonNegativeIntegerSchema } from './primitives.ts';
export const normalizedModuleDataDescriptorSchema = z.object({ moduleId: moduleIdSchema, canonicalKey: nonEmptyStringSchema, legacyKey: nonEmptyStringSchema, scope: z.enum(['shared','user']), encoding: z.enum(['json','data-url','text']), pattern: z.string().optional() }).strict();
export const normalizedModuleDataTransportRowSchema = z.object({ state_key: nonEmptyStringSchema, value: z.string(), scope: z.enum(['shared','user']), revision: nonNegativeIntegerSchema, updated_at: z.string().optional() }).strip();
export const normalizedModuleDataTransportRowsSchema = z.array(normalizedModuleDataTransportRowSchema);
export const normalizedModuleDataMutationSchema = z.object({ state_key: nonEmptyStringSchema, revision: nonNegativeIntegerSchema, updated_at: z.string().optional() }).strip();

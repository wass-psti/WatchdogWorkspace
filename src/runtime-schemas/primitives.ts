import * as z from 'zod';

export const moduleIdSchema = z.enum(['time-tracker', 'fueltrack-plus', 'tradelink']);
export const platformRoleSchema = z.enum(['admin_general_manager', 'hr', 'supervisor', 'employee']);
export const boardRoleSchema = z.enum(['owner', 'editor', 'viewer']);
export const moduleStateScopeSchema = z.enum(['shared', 'user']);
export const nonEmptyStringSchema = z.string().trim().min(1);
export const boundedIdentifierSchema = nonEmptyStringSchema.max(240);
export const nonNegativeIntegerSchema = z.number().int().nonnegative();
export const finiteNumberSchema = z.number().finite();
export const unknownRecordSchema = z.record(z.string(), z.unknown());
export const stringArraySchema = z.array(z.string());
export const nullableNonEmptyStringSchema = nonEmptyStringSchema.nullable();

export function firstSchemaIssue(error: z.ZodError): string {
  const issue = error.issues[0];
  if (!issue) return 'Runtime schema validation failed.';
  const path = issue.path.length ? `${issue.path.join('.')}: ` : '';
  return `${path}${issue.message}`;
}

export function parseOrNull<TSchema extends z.ZodType>(schema: TSchema, value: unknown): z.output<TSchema> | null {
  const parsed = schema.safeParse(value);
  return parsed.success ? parsed.data : null;
}

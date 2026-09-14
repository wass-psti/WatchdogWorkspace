import * as z from 'zod';
import { moduleIdSchema, nonEmptyStringSchema } from './primitives.ts';

export const embeddedBrowserPermissionSchema = z.enum(['geolocation', 'clipboard-write']);
export const moduleStatusSchema = z.enum(['active', 'disabled', 'maintenance']);
export const modulePresentationModeSchema = z.enum(['same-origin-iframe', 'native-host']);
export const iframeRetirementDecisionSchema = z.enum(['retain-iframe', 'retire-iframe']);
export const iframeRetirementBlockerSchema = z.enum([
  'native-mount-contract',
  'root-scoped-dom-ownership',
  'scoped-style-ownership',
  'global-runtime-isolation',
  'direct-host-identity-consumption',
  'direct-normalized-data-consumption',
  'host-browser-permission-integration',
  'lifecycle-disposal-parity',
  'native-regression-parity',
]);

export const workManagementModuleDefinitionSchema = z.object({
  id: moduleIdSchema,
  name: nonEmptyStringSchema,
  eyebrow: nonEmptyStringSchema,
  description: nonEmptyStringSchema,
  route: nonEmptyStringSchema,
  presentationMode: modulePresentationModeSchema,
  iframeRetirement: z.object({
    decision: iframeRetirementDecisionSchema,
    blockers: z.array(iframeRetirementBlockerSchema),
    nativeBoundary: nonEmptyStringSchema.optional(),
  }).strict(),
  version: z.string().regex(/^\d+\.\d+\.\d+$/),
  status: moduleStatusSchema,
  accent: nonEmptyStringSchema,
  icon: nonEmptyStringSchema,
  capabilities: z.array(nonEmptyStringSchema),
  browserPermissions: z.array(embeddedBrowserPermissionSchema).optional(),
  storageFormat: nonEmptyStringSchema,
  cloudStateKeys: z.array(nonEmptyStringSchema),
  userStateKeys: z.array(nonEmptyStringSchema),
  cloudStatePrefixes: z.array(z.string()),
  rawStorageKeys: z.array(nonEmptyStringSchema).optional(),
  rawStoragePatterns: z.record(z.string(), z.string()).optional(),
}).strict();

export const workManagementModulesSchema = z.array(workManagementModuleDefinitionSchema)
  .superRefine((modules, context) => {
    const seen = new Set<string>();
    for (const module of modules) {
      if (seen.has(module.id)) {
        context.addIssue({ code: 'custom', message: `Duplicate module id: ${module.id}` });
      }
      seen.add(module.id);
      for (const key of module.userStateKeys) {
        if (!module.cloudStateKeys.includes(key)) {
          context.addIssue({ code: 'custom', message: `${module.id} user state key is not declared as cloud state: ${key}` });
        }
      }
      if (module.iframeRetirement.decision === 'retire-iframe') {
        if (module.presentationMode !== 'native-host') {
          context.addIssue({ code: 'custom', message: `${module.id} cannot retire iframe isolation without native-host presentation.` });
        }
        if (module.iframeRetirement.blockers.length > 0 || !module.iframeRetirement.nativeBoundary) {
          context.addIssue({ code: 'custom', message: `${module.id} cannot retire iframe isolation while blockers remain or nativeBoundary is absent.` });
        }
      } else if (module.presentationMode !== 'same-origin-iframe' || module.iframeRetirement.blockers.length === 0) {
        context.addIssue({ code: 'custom', message: `${module.id} retained iframe presentation requires explicit retirement blockers.` });
      }
    }
  });

export type RuntimeModuleDefinition = z.infer<typeof workManagementModuleDefinitionSchema>;

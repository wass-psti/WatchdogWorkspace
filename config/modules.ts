import type { ModuleId } from '../src/types/identifiers.ts';
import type { WorkManagementModuleDefinition } from '../src/types/modules.ts';
import type { NormalizedModuleDataDescriptor, NormalizedModuleDataRegistry } from '../src/platform/contracts/normalized-module-data.ts';
import { normalizedModuleDataDescriptorSchema } from '../src/runtime-schemas/normalized-module-data.ts';
import { workManagementModulesSchema } from '../src/runtime-schemas/index.ts';

const moduleDefinitions = {
  'time-tracker': {
    id: 'time-tracker',
    name: 'TimeTracker',
    eyebrow: 'Attendance & Workforce',
    description: 'Attendance, overtime, leave, reporting, calendar, roles, GPS evidence, and workforce operations.',
    route: './apps/time-tracker/index.html',
    presentationMode: 'same-origin-iframe',
    iframeRetirement: {
      decision: 'retain-iframe',
      blockers: [
        'native-mount-contract', 'root-scoped-dom-ownership', 'scoped-style-ownership',
        'global-runtime-isolation', 'direct-host-identity-consumption', 'direct-normalized-data-consumption',
        'host-browser-permission-integration', 'lifecycle-disposal-parity', 'native-regression-parity',
      ],
    },
    version: '2.0.0',
    status: 'active',
    accent: 'orange',
    icon: 'clock',
    capabilities: ['Attendance', 'Overtime', 'Leave', 'Reports', 'Calendar', 'Roles'],
    browserPermissions: ['geolocation'],
    storageFormat: 'json',
    cloudStateKeys: [
      'timetracker.attendance.v1', 'timetracker.attendance.v1.backup', 'timetracker.ui.v1',
      'timetracker.audit.v1', 'timetracker.audit.v1.backup',
      'timetracker.ot.v1', 'timetracker.ot.v1.backup',
      'timetracker.ot.activity.v1', 'timetracker.ot.activity.v1.backup',
      'timetracker.auto-gps-cache.v1',
    ],
    userStateKeys: ['timetracker.ui.v1', 'timetracker.auto-gps-cache.v1'],
    cloudStatePrefixes: [],
  },
  'fueltrack-plus': {
    id: 'fueltrack-plus',
    name: 'FuelTrack+',
    eyebrow: 'Fuel Request Operations',
    description: 'Fuel requests, approvals, analytics, refueling completion, LightFuels operations, activity, per-user role management, and cloud operational reporting.',
    route: './apps/fueltrack-plus/runtime.html',
    presentationMode: 'same-origin-iframe',
    iframeRetirement: {
      decision: 'retain-iframe',
      blockers: [
        'native-mount-contract', 'root-scoped-dom-ownership', 'scoped-style-ownership',
        'global-runtime-isolation', 'direct-host-identity-consumption', 'direct-normalized-data-consumption',
        'host-browser-permission-integration', 'lifecycle-disposal-parity', 'native-regression-parity',
      ],
    },
    version: '3.17.0',
    status: 'active',
    accent: 'blue',
    icon: 'fuel',
    capabilities: ['Fuel Requests', 'Approvals', 'Analytics', 'LightFuels', 'Activity', 'Roles', 'PDF Reports'],
    browserPermissions: ['clipboard-write'],
    storageFormat: 'json',
    cloudStateKeys: [
      'fueltrackplus.requests.v3',
      'fueltrackplus.activity.v3',
      'fueltrackplus.activity.workspace.v1',
      'fueltrackplus.preferences.v3',
      'fueltrackplus.inventory.v3',
    ],
    userStateKeys: ['fueltrackplus.preferences.v3', 'fueltrackplus.activity.workspace.v1'],
    cloudStatePrefixes: [],
  },
  tradelink: {
    id: 'tradelink',
    name: 'TradeLink',
    eyebrow: 'Commercial Documents & Approvals',
    description: 'Quotations, purchase orders, electronic sales invoices, delivery and payment documents, approval workflows, company templates, recovery, and audit operations.',
    route: './apps/tradelink/runtime.html',
    presentationMode: 'same-origin-iframe',
    iframeRetirement: {
      decision: 'retain-iframe',
      blockers: [
        'native-mount-contract', 'root-scoped-dom-ownership', 'scoped-style-ownership',
        'global-runtime-isolation', 'direct-host-identity-consumption', 'direct-normalized-data-consumption',
        'host-browser-permission-integration', 'lifecycle-disposal-parity', 'native-regression-parity',
      ],
    },
    version: '1.42.0',
    status: 'active',
    accent: 'teal',
    icon: 'trade',
    capabilities: ['Quotations', 'Purchase Orders', 'Electronic SI', 'Approvals', 'Documents', 'Recovery', 'Audit'],
    browserPermissions: ['clipboard-write'],
    storageFormat: 'json',
    rawStorageKeys: [
      'tradelink_vendor_logo_watchdog-opc', 'tradelink_vendor_logo_watchdog-sales', 'tradelink_vendor_logo_plc-systems',
      'tradelink_vendor_qr_watchdog-opc', 'tradelink_vendor_qr_watchdog-sales', 'tradelink_vendor_qr_plc-systems',
    ],
    rawStoragePatterns: {
      'tradelink_vendor_logo_watchdog-opc': '^data:image/(png|jpe?g|webp|gif);base64,',
      'tradelink_vendor_logo_watchdog-sales': '^data:image/(png|jpe?g|webp|gif);base64,',
      'tradelink_vendor_logo_plc-systems': '^data:image/(png|jpe?g|webp|gif);base64,',
      'tradelink_vendor_qr_watchdog-opc': '^data:image/(png|jpe?g|webp|gif);base64,',
      'tradelink_vendor_qr_watchdog-sales': '^data:image/(png|jpe?g|webp|gif);base64,',
      'tradelink_vendor_qr_plc-systems': '^data:image/(png|jpe?g|webp|gif);base64,',
    },
    cloudStateKeys: [
      'tradelink_state_v1',
      'tradelink_state_backup_v1',
      'tradelink_ui_v1', 'tradelink_draft_v1',
      'tradelink_vendor_logo_watchdog-opc', 'tradelink_vendor_logo_watchdog-sales', 'tradelink_vendor_logo_plc-systems',
      'tradelink_vendor_qr_watchdog-opc', 'tradelink_vendor_qr_watchdog-sales', 'tradelink_vendor_qr_plc-systems',
    ],
    userStateKeys: ['tradelink_ui_v1', 'tradelink_draft_v1'],
    cloudStatePrefixes: [],
  },
} as const satisfies Readonly<Record<ModuleId, WorkManagementModuleDefinition>>;

// Validate the untrusted/runtime shape without making Zod's mutable output the
// compile-time authority for the readonly application manifest types.
workManagementModulesSchema.parse(Object.values(moduleDefinitions));

export const modules: readonly WorkManagementModuleDefinition[] = Object.freeze(Object.values(moduleDefinitions));
export const moduleDefinitionsById: Readonly<Record<ModuleId, WorkManagementModuleDefinition>> = Object.freeze(moduleDefinitions);


const normalizedModuleDataDescriptors = Object.freeze([
  { moduleId: 'time-tracker', canonicalKey: 'attendance', legacyKey: 'timetracker.attendance.v1', scope: 'shared', encoding: 'json' },
  { moduleId: 'time-tracker', canonicalKey: 'attendance.backup', legacyKey: 'timetracker.attendance.v1.backup', scope: 'shared', encoding: 'json' },
  { moduleId: 'time-tracker', canonicalKey: 'ui', legacyKey: 'timetracker.ui.v1', scope: 'user', encoding: 'json' },
  { moduleId: 'time-tracker', canonicalKey: 'audit', legacyKey: 'timetracker.audit.v1', scope: 'shared', encoding: 'json' },
  { moduleId: 'time-tracker', canonicalKey: 'audit.backup', legacyKey: 'timetracker.audit.v1.backup', scope: 'shared', encoding: 'json' },
  { moduleId: 'time-tracker', canonicalKey: 'ot', legacyKey: 'timetracker.ot.v1', scope: 'shared', encoding: 'json' },
  { moduleId: 'time-tracker', canonicalKey: 'ot.backup', legacyKey: 'timetracker.ot.v1.backup', scope: 'shared', encoding: 'json' },
  { moduleId: 'time-tracker', canonicalKey: 'ot.activity', legacyKey: 'timetracker.ot.activity.v1', scope: 'shared', encoding: 'json' },
  { moduleId: 'time-tracker', canonicalKey: 'ot.activity.backup', legacyKey: 'timetracker.ot.activity.v1.backup', scope: 'shared', encoding: 'json' },
  { moduleId: 'time-tracker', canonicalKey: 'gps.cache', legacyKey: 'timetracker.auto-gps-cache.v1', scope: 'user', encoding: 'json' },
  { moduleId: 'fueltrack-plus', canonicalKey: 'requests', legacyKey: 'fueltrackplus.requests.v3', scope: 'shared', encoding: 'json' },
  { moduleId: 'fueltrack-plus', canonicalKey: 'activity', legacyKey: 'fueltrackplus.activity.v3', scope: 'shared', encoding: 'json' },
  { moduleId: 'fueltrack-plus', canonicalKey: 'activity.workspace', legacyKey: 'fueltrackplus.activity.workspace.v1', scope: 'user', encoding: 'json' },
  { moduleId: 'fueltrack-plus', canonicalKey: 'preferences', legacyKey: 'fueltrackplus.preferences.v3', scope: 'user', encoding: 'json' },
  { moduleId: 'fueltrack-plus', canonicalKey: 'inventory', legacyKey: 'fueltrackplus.inventory.v3', scope: 'shared', encoding: 'json' },
  { moduleId: 'tradelink', canonicalKey: 'state', legacyKey: 'tradelink_state_v1', scope: 'shared', encoding: 'json' },
  { moduleId: 'tradelink', canonicalKey: 'state.backup', legacyKey: 'tradelink_state_backup_v1', scope: 'shared', encoding: 'json' },
  { moduleId: 'tradelink', canonicalKey: 'ui', legacyKey: 'tradelink_ui_v1', scope: 'user', encoding: 'json' },
  { moduleId: 'tradelink', canonicalKey: 'draft', legacyKey: 'tradelink_draft_v1', scope: 'user', encoding: 'json' },
  { moduleId: 'tradelink', canonicalKey: 'vendor.logo.watchdog-opc', legacyKey: 'tradelink_vendor_logo_watchdog-opc', scope: 'shared', encoding: 'data-url', pattern: '^data:image/(png|jpe?g|webp|gif);base64,' },
  { moduleId: 'tradelink', canonicalKey: 'vendor.logo.watchdog-sales', legacyKey: 'tradelink_vendor_logo_watchdog-sales', scope: 'shared', encoding: 'data-url', pattern: '^data:image/(png|jpe?g|webp|gif);base64,' },
  { moduleId: 'tradelink', canonicalKey: 'vendor.logo.plc-systems', legacyKey: 'tradelink_vendor_logo_plc-systems', scope: 'shared', encoding: 'data-url', pattern: '^data:image/(png|jpe?g|webp|gif);base64,' },
  { moduleId: 'tradelink', canonicalKey: 'vendor.qr.watchdog-opc', legacyKey: 'tradelink_vendor_qr_watchdog-opc', scope: 'shared', encoding: 'data-url', pattern: '^data:image/(png|jpe?g|webp|gif);base64,' },
  { moduleId: 'tradelink', canonicalKey: 'vendor.qr.watchdog-sales', legacyKey: 'tradelink_vendor_qr_watchdog-sales', scope: 'shared', encoding: 'data-url', pattern: '^data:image/(png|jpe?g|webp|gif);base64,' },
  { moduleId: 'tradelink', canonicalKey: 'vendor.qr.plc-systems', legacyKey: 'tradelink_vendor_qr_plc-systems', scope: 'shared', encoding: 'data-url', pattern: '^data:image/(png|jpe?g|webp|gif);base64,' },
] as const satisfies readonly NormalizedModuleDataDescriptor[]);
for (const descriptor of normalizedModuleDataDescriptors) normalizedModuleDataDescriptorSchema.parse(descriptor);
const canonicalIds = new Set<string>(); const legacyIds = new Set<string>();
for (const descriptor of normalizedModuleDataDescriptors) { const canonicalId = `${descriptor.moduleId}:${descriptor.canonicalKey}`; const legacyId = `${descriptor.moduleId}:${descriptor.legacyKey}`; if (canonicalIds.has(canonicalId)) throw new Error(`Duplicate normalized module canonical key: ${canonicalId}`); if (legacyIds.has(legacyId)) throw new Error(`Duplicate normalized module legacy key: ${legacyId}`); canonicalIds.add(canonicalId); legacyIds.add(legacyId); }
export const normalizedModuleDataRegistry: NormalizedModuleDataRegistry = Object.freeze({
  descriptors: normalizedModuleDataDescriptors,
  list(moduleId: ModuleId) { return normalizedModuleDataDescriptors.filter((descriptor) => descriptor.moduleId === moduleId); },
  resolve(moduleId: ModuleId, canonicalKey: string) { return normalizedModuleDataDescriptors.find((descriptor) => descriptor.moduleId === moduleId && descriptor.canonicalKey === canonicalKey) ?? null; },
  resolveLegacy(moduleId: ModuleId, legacyKey: string) { return normalizedModuleDataDescriptors.find((descriptor) => descriptor.moduleId === moduleId && descriptor.legacyKey === legacyKey) ?? null; },
});

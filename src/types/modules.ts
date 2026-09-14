import type { ModuleId } from './identifiers.ts';

export type ModulePresentationMode = 'same-origin-iframe' | 'native-host';
export type IframeRetirementDecision = 'retain-iframe' | 'retire-iframe';
export type IframeRetirementBlocker =
  | 'native-mount-contract'
  | 'root-scoped-dom-ownership'
  | 'scoped-style-ownership'
  | 'global-runtime-isolation'
  | 'direct-host-identity-consumption'
  | 'direct-normalized-data-consumption'
  | 'host-browser-permission-integration'
  | 'lifecycle-disposal-parity'
  | 'native-regression-parity';

export interface IframeRetirementProfile {
  readonly decision: IframeRetirementDecision;
  readonly blockers: readonly IframeRetirementBlocker[];
  readonly nativeBoundary?: string;
}

export type ModuleStatus = 'active' | 'disabled' | 'maintenance';
export type ModuleAccent = 'orange' | 'blue' | 'teal' | string;
export type EmbeddedBrowserPermission = 'geolocation' | 'clipboard-write';

export interface WorkManagementModuleDefinition {
  readonly id: ModuleId;
  readonly name: string;
  readonly eyebrow: string;
  readonly description: string;
  readonly route: string;
  readonly presentationMode: ModulePresentationMode;
  readonly iframeRetirement: IframeRetirementProfile;
  readonly version: string;
  readonly status: ModuleStatus;
  readonly accent: ModuleAccent;
  readonly icon: string;
  readonly capabilities: readonly string[];
  readonly browserPermissions?: readonly EmbeddedBrowserPermission[];
  readonly storageFormat: 'json' | string;
  readonly cloudStateKeys: readonly string[];
  readonly userStateKeys: readonly string[];
  readonly cloudStatePrefixes: readonly string[];
  readonly rawStorageKeys?: readonly string[];
  readonly rawStoragePatterns?: Readonly<Record<string, string>>;
}

import assert from 'node:assert/strict';

const memory = new Map();
globalThis.localStorage = {
  setItem(k,v){ memory.set(String(k),String(v)); },
  getItem(k){ return memory.has(String(k)) ? memory.get(String(k)) : null; },
  removeItem(k){ memory.delete(String(k)); },
  key(i){ return [...memory.keys()][i] ?? null; },
  get length(){ return memory.size; }
};
globalThis.document = { documentElement: { dataset: {} } };
const capturedWindowEvents = [];
globalThis.window = {
  caches: undefined,
  dispatchEvent(event){ capturedWindowEvents.push(event); return true; },
  addEventListener(){},
  removeEventListener(){}
};
globalThis.location = { origin:'http://test.local' };
Object.defineProperty(globalThis, 'navigator', { configurable:true, value: {
  onLine: true,
  storage: {
    async estimate(){ return { usage:1024, quota:1048576 }; },
    async persisted(){ return false; },
    async persist(){ return true; }
  }
}});
globalThis.fetch = async () => ({ ok:true, status:200 });

globalThis.addEventListener = () => {};

const platform = await import('./assets/js/core/platform.ts');
const { modules } = await import('./config/modules.ts');

assert.equal(platform.savePreferences({theme:'dark',compact:true,favorites:['time-tracker'],recent:[]}), true);
assert.equal(platform.getPreferences().theme, 'dark');
assert.equal(platform.getPreferences().compact, true);
platform.applyDensity(true);
assert.equal(document.documentElement.dataset.density, 'compact');
platform.applyDensity(false);
assert.equal(document.documentElement.dataset.density, 'comfortable');

const persistence = await platform.requestPersistentStorage();
assert.deepEqual({supported:persistence.supported, granted:persistence.granted}, {supported:true, granted:true});

const health = await platform.getStorageHealth();
assert.equal(health.available, true);
assert.equal(health.quota, 1048576);
assert.equal(health.usage, 1024);

const compatibility = await platform.verifyModuleCompatibility(modules[0]);
assert.equal(compatibility.passed, true);
assert.equal(compatibility.checks.length >= 4, true);
const fuelCompatibility = await platform.verifyModuleCompatibility(modules.find((m)=>m.id === 'fueltrack-plus'));
assert.equal(fuelCompatibility.passed, true);
assert.equal(fuelCompatibility.checks.length >= 4, true);

const diagnostics = await platform.runPlatformDiagnostics(modules);
assert.equal(diagnostics.passed, true);
assert.equal(diagnostics.checks.some((c)=>c.id === 'preferences'), true);

console.log('settings-core-verification: PASS');

// Settings UI integration contracts: React route ownership with existing platform/backup authorities.
const fs = await import('node:fs');
const appSource = fs.readFileSync(new URL('./assets/js/app.ts', import.meta.url), 'utf8');
const settingsUi = fs.readFileSync(new URL('./src/app/management/AuthenticatedManagementUI.tsx', import.meta.url), 'utf8');
const settingsRuntime = fs.readFileSync(new URL('./src/app/management/authenticated-management-ui-runtime.ts', import.meta.url), 'utf8');
const manifestSource = fs.readFileSync(new URL('./config/application-manifest.ts', import.meta.url), 'utf8');
const architectureVersion = Number(manifestSource.match(/architectureVersion:\s*(\d+)/)?.[1] ?? 0);
const directSettingsDelegation = "settings: () => showAuthenticatedManagement('settings')";
const gatedSettingsDelegation = "settings: () => gateBackendCapability('settings', 'settings', () => showAuthenticatedManagement('settings'))";
if (architectureVersion >= 48) {
  assert.equal(appSource.includes(directSettingsDelegation), true, 'Settings route must delegate directly after the M40 precommit capability resolver selects Settings ownership.');
  assert.equal(appSource.includes('resolveBackendCapabilityPresentation') && appSource.includes('backendCapabilityRequirement(route)'), true, 'Architecture 48+ Settings must remain M38 capability-gated by the M40 precommit resolver.');
  assert.equal(appSource.includes(gatedSettingsDelegation), false, 'Architecture 48+ Settings must not re-check capability inside the renderer after ownership is chosen.');
} else if (architectureVersion >= 46) {
  assert.equal(appSource.includes(gatedSettingsDelegation), true, 'Settings route must preserve React M13 presentation behind the M38 backend-capability gate.');
  assert.equal(appSource.includes(directSettingsDelegation), false, 'Architecture 46+ Settings route must not bypass the M38 backend-capability gate.');
} else {
  assert.equal(appSource.includes(directSettingsDelegation), true, 'Settings route must delegate directly to React M13 presentation before Architecture 46.');
}
assert.doesNotMatch(appSource, /createSettingsFeature/);
assert.match(settingsUi, /id="wmBackupFileInput"/);
assert.match(settingsUi, /backupInput\.current\?\.click\(\)/);
assert.match(settingsUi, /authenticatedManagementUiRuntime\.restoreBackup\(file\)/);
assert.match(settingsRuntime, /const result = await requestPersistentStorage\(\)/);
assert.match(settingsRuntime, /const count = await downloadWorkspaceBackup\(modules\)/);
if (architectureVersion >= 42) {
  assert.match(settingsRuntime, /const inspection = await inspectBackupFile\(file, modules\)/);
  assert.match(settingsRuntime, /const \{ payload, preflight \} = inspection/);
  assert.match(settingsRuntime, /preflight\.integrity === 'verified'/);
  assert.match(settingsRuntime, /pre-restore recovery checkpoint/);
  assert.match(settingsRuntime, /const result = await restoreWorkspaceBackupGuarded\(payload, modules\)/);
  assert.doesNotMatch(settingsRuntime, /const payload = await parseBackupFile\(file, modules\)/);
  assert.doesNotMatch(settingsRuntime, /await restoreWorkspaceBackup\(payload\)/);
} else {
  assert.match(settingsRuntime, /const payload = await parseBackupFile\(file, modules\)/);
  assert.match(settingsRuntime, /await restoreWorkspaceBackup\(payload\)/);
}
console.log('settings-ui-wiring-verification: PASS');

const backup = await import('./assets/js/core/backup.ts');
const legacyPayload = {
  format: 'work-management-backup',
  backupVersion: 1,
  createdAt: new Date().toISOString(),
  data: {
    'wm.platform.preferences.v1': JSON.stringify({ theme: 'dark', compact: true, favorites: [], recent: [] }),
    'timetracker.attendance.v1': JSON.stringify({ version: 1, records: [], selection: { location: '', department: '' } }),
    'fueltrackplus.requests.v3': JSON.stringify([{ id: 'FT-TEST', status: 'Submitted' }])
  }
};
const legacyFile = new File([JSON.stringify(legacyPayload)], 'legacy-v1.json', { type:'application/json' });
const parsed = await backup.parseBackupFile(legacyFile, modules);
assert.equal(parsed.backupVersion, 4);
assert.deepEqual(parsed.migration, { fromVersion:1, toVersion:4 });
assert.equal(parsed.data['wm.platform.preferences.v1'], legacyPayload.data['wm.platform.preferences.v1']);
assert.equal(parsed.moduleData['time-tracker'][0].state_key, 'timetracker.attendance.v1');
assert.equal(parsed.moduleData['fueltrack-plus'][0].state_key, 'fueltrackplus.requests.v3');
assert.equal(parsed.entryCount, 3);
assert.equal(capturedWindowEvents.some((event) => event?.type === 'wm:backup-dr' && event?.detail?.type === 'import-preflight'), true);
const legacyActivityPayload = {
  ...legacyPayload,
  data: {
    ...legacyPayload.data,
    'fueltrackplus.activity.v3': JSON.stringify([{ id:'evt-1', type:'submit', title:'Created request', message:'Test event', at:new Date().toISOString() }])
  }
};
const legacyActivityFile = new File([JSON.stringify(legacyActivityPayload)], 'legacy-activity-v1.json', { type:'application/json' });
const parsedActivity = await backup.parseBackupFile(legacyActivityFile, modules);
assert.equal(parsedActivity.activityData['fueltrack-plus'].length, 1);
assert.equal(parsedActivity.moduleData['fueltrack-plus'].some((row)=>row.state_key === 'fueltrackplus.activity.v3'), false);
const backupSource = fs.readFileSync(new URL('./assets/js/core/backup.ts', import.meta.url), 'utf8');
assert.match(backupSource, /BACKUP_VERSION = 4/);
assert.match(backupSource, /list_module_state/);
assert.match(backupSource, /wm_restore_workspace_backup_v4/);
assert.match(backupSource, /list_module_activity/);
assert.match(backupSource, /validateBoardSnapshot/);
assert.match(backupSource, /SUPPORTED_BACKUP_VERSIONS/);
assert.match(backupSource, /!auth\.isAuthenticated/);
assert.doesNotMatch(backupSource, /timetracker\.attendance\.v1[^\n]*localStorage\.getItem/);
console.log('settings-backup-cloud-migration-verification: PASS');


process.exit(0);

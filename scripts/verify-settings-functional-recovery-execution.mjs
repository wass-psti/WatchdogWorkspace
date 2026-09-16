import assert from 'node:assert/strict';
import {
  EMPTY_SETTINGS_EVIDENCE,
  SETTINGS_EVIDENCE_STORAGE_KEY,
  SETTINGS_EVIDENCE_VERSION,
  mergeSettingsEvidence,
  normalizeSettingsDiagnostic,
  normalizeSettingsEvidence,
} from '../assets/js/features/settings/settings-recovery.ts';

let checks = 0;
const pass = (condition, message) => { assert.ok(condition, message); checks += 1; };
const good = { checkedAt:'2026-09-16T08:00:00.000Z', passed:true, checks:[{ id:'auth-health', label:'Supabase Auth endpoint', ok:true, detail:'HTTP 200' }] };
const mixed = { checkedAt:'2026-09-16T08:01:00.000Z', passed:true, checks:[{ id:'storage', label:'Storage', ok:false, detail:'Blocked' }] };

pass(SETTINGS_EVIDENCE_STORAGE_KEY === 'settings.evidence.v1', 'M43 evidence key is stable and scoped under wm.platform by the storage adapter');
pass(SETTINGS_EVIDENCE_VERSION === 1, 'M43 evidence schema version is 1');
pass(normalizeSettingsDiagnostic(good)?.passed === true, 'valid passing diagnostic is accepted');
pass(normalizeSettingsDiagnostic(mixed)?.passed === false, 'persisted passed=true cannot override a failed check');
pass(normalizeSettingsDiagnostic({ ...good, checkedAt:'invalid' }) === null, 'invalid timestamp is rejected');
pass(normalizeSettingsDiagnostic({ ...good, checks:[] }) === null, 'empty diagnostic evidence is rejected');
pass(normalizeSettingsEvidence(null) === EMPTY_SETTINGS_EVIDENCE, 'invalid root falls back to immutable empty evidence');
const normalized = normalizeSettingsEvidence({ version:1, compatibility:good, diagnostics:mixed, backendStatus:good });
pass(normalized.compatibility?.passed === true, 'compatibility evidence normalizes');
pass(normalized.diagnostics?.passed === false, 'diagnostic failure normalizes fail closed');
pass(normalized.backendStatus?.checks[0]?.detail === 'HTTP 200', 'backend evidence preserves bounded detail');
const merged = mergeSettingsEvidence(normalized, { diagnostics:good });
pass(merged.compatibility === normalized.compatibility, 'merge preserves untouched compatibility evidence');
pass(merged.diagnostics?.passed === true, 'merge replaces selected diagnostic evidence');
pass(merged.backendStatus === normalized.backendStatus, 'merge preserves untouched backend evidence');
const oversized = { ...good, checks:Array.from({length:200},(_,i)=>({ id:`c${i}`, label:`Check ${i}`, ok:true, detail:'ok' })) };
pass(normalizeSettingsDiagnostic(oversized) === null, 'oversized persisted diagnostic evidence is rejected fail closed');
pass(normalizeSettingsDiagnostic({ ...good, checks:[...good.checks, { id:'', label:'Malformed', ok:true, detail:'invalid' }] }) === null, 'malformed diagnostic check invalidates the persisted result rather than being filtered');
pass(Object.isFrozen(normalized) && Object.isFrozen(normalized.compatibility) && Object.isFrozen(normalized.compatibility?.checks), 'normalized evidence is immutable');
console.log(`Stage G M43 Settings Functional Recovery deterministic verification: PASS (checks=${checks})`);

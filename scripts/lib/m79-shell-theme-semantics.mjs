import fs from 'node:fs';
import assert from 'node:assert/strict';

const M79_TARGET = 'config/stage-i-m79-design-tokens-semantic-theme-target.ts';

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function readBalancedBlock(source, selectorPattern) {
  const match = selectorPattern.exec(source);
  assert.ok(match, `Required theme selector not found: ${selectorPattern}`);
  const open = source.indexOf('{', match.index + match[0].length - 1);
  assert.ok(open >= 0, `Theme selector has no declaration block: ${match[0]}`);
  let depth = 0;
  for (let index = open; index < source.length; index += 1) {
    const char = source[index];
    if (char === '{') depth += 1;
    if (char === '}') {
      depth -= 1;
      if (depth === 0) return source.slice(open + 1, index);
    }
  }
  assert.fail(`Unbalanced theme block: ${match[0]}`);
}

function declarations(block) {
  const result = new Map();
  const duplicate = new Set();
  for (const match of block.matchAll(/(--[a-z0-9-]+)\s*:\s*([^;{}]+);/gi)) {
    const [, name, value] = match;
    if (result.has(name)) duplicate.add(name);
    result.set(name, value.trim());
  }
  return { result, duplicate };
}

function assertNoDuplicates(scope, parsed, roles) {
  for (const role of roles) {
    assert.ok(!parsed.duplicate.has(role), `${scope} declares ${role} more than once`);
  }
}

function collectAllCustomProperties(...sources) {
  const names = new Set();
  for (const source of sources) {
    for (const match of source.matchAll(/(--[a-z0-9-]+)\s*:/gi)) names.add(match[1]);
  }
  return names;
}

function assertReferencesResolve(role, value, allProperties) {
  for (const match of value.matchAll(/var\(\s*(--[a-z0-9-]+)/gi)) {
    assert.ok(allProperties.has(match[1]), `${role} references unknown custom property ${match[1]}`);
  }
}

export function hasM79SuccessorAuthority() {
  if (!fs.existsSync(M79_TARGET)) return false;
  const target = fs.readFileSync(M79_TARGET, 'utf8');
  return target.includes("semanticsVersion: '1.43.2-m79-v1'")
    && /activationState:\s*'(?:implementation-complete-pending-certification|active-certified)'/.test(target);
}

export function assertM79ShellThemeRoles({ themes, tokens, roles, label }) {
  assert.ok(hasM79SuccessorAuthority(), `${label}: M79 successor authority is not active`);

  const shared = declarations(readBalancedBlock(themes, /:root\s*\{/g));
  const light = declarations(readBalancedBlock(themes, /:root\s*,\s*:root\[data-theme=["']light["']\]\s*\{/g));
  const dark = declarations(readBalancedBlock(themes, /:root\[data-theme=["']dark["']\]\s*\{/g));
  const system = declarations(readBalancedBlock(themes, /:root\[data-theme=["']system["']\]\s*\{/g));

  assertNoDuplicates('shared :root', shared, roles);
  assertNoDuplicates('light theme', light, roles);
  assertNoDuplicates('dark theme', dark, roles);
  assertNoDuplicates('system-dark theme', system, roles);

  const allProperties = collectAllCustomProperties(tokens, themes);
  const scopes = [
    ['light', light.result],
    ['dark', dark.result],
    ['system-dark', system.result],
  ];

  for (const role of roles) {
    const sharedValue = shared.result.get(role);
    const explicitModeDefinitions = scopes.filter(([, map]) => map.has(role));

    assert.ok(
      sharedValue || explicitModeDefinitions.length === scopes.length,
      `${label}: ${role} must be shared in :root or explicitly defined in light, dark and system-dark modes`,
    );

    if (sharedValue) {
      assertReferencesResolve(role, sharedValue, allProperties);
      // M79's CSS deduplication contract: invariant Shell roles belong to shared :root.
      // An explicit mode override is allowed only when it is actually mode-dependent.
      for (const [mode, map] of scopes) {
        if (!map.has(role)) continue;
        const modeValue = map.get(role);
        assert.notEqual(
          modeValue,
          sharedValue,
          `${label}: ${role} redundantly duplicates its shared value in ${mode}; remove the duplicate or make the override mode-dependent`,
        );
        assertReferencesResolve(role, modeValue, allProperties);
      }
    } else {
      for (const [mode, map] of scopes) {
        const value = map.get(role);
        assert.ok(value, `${label}: ${role} missing from ${mode}`);
        assertReferencesResolve(role, value, allProperties);
      }
    }
  }
}

export function assertLegacyThreeScopeThemeRole({ themes, role, label, atLeast = false }) {
  const escaped = escapeRegExp(role);
  const count = (themes.match(new RegExp(escaped, 'g')) ?? []).length;
  if (atLeast) {
    assert.ok(count >= 3, `${label}: ${role} must exist in light, dark and system-dark scopes`);
  } else {
    assert.equal(count, 3, `${label}: ${role} must exist exactly once in light, dark and system-dark modes`);
  }
}

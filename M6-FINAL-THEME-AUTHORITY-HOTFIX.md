# Stage B M6 — Final Browser Theme Authority Hotfix

## Corrected release blocker

The real Chromium integration suite previously failed at:

`Shell M5 Appearance uses the authoritative global theme preference`

The test fixture attempted to replace `globalThis.getPreferences`, `globalThis.savePreferences`, and `globalThis.applyTheme`. That could not affect `createAccountProfileMenu`, because the production account menu holds lexical ESM imports of those functions from `assets/js/core/platform.ts`.

## Correction

The browser integration runtime now exports the real platform preference functions through its test-only global surface. The Shell M5 integration scenario seeds the actual `wm.platform.preferences.v1` storage contract, invokes the production account-profile menu, selects Dark, and verifies all three authoritative effects:

1. `getPreferences().theme === 'dark'`
2. persisted `localStorage['wm.platform.preferences.v1'].theme === 'dark'`
3. `document.documentElement.dataset.theme === 'dark'`

The fixture restores the System preference after the scenario.

No production preference implementation was weakened or bypassed. The correction strengthens the browser test by exercising the real storage and theme authority instead of a synthetic stub.

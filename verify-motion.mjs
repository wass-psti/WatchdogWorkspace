import fs from 'node:fs';

const js = fs.readFileSync('assets/js/app.ts', 'utf8');
const css = fs.readFileSync('assets/css/app.css', 'utf8');
const manifest = fs.readFileSync('config/application-manifest.ts', 'utf8');
const architectureMatch = manifest.match(/architectureVersion:\s*(\d+)/);
const architectureVersion = architectureMatch ? Number(architectureMatch[1]) : 0;

const requiredJs = [
  'function queueEntranceMotion',
  'const transitionUpdate: TransitionUpdate',
  'function addInteractionRipple',
  'function updatePointerMotion',
  "document.addEventListener('pointerdown', (event) => {",
  "moduleFrame?.classList.add('module-frame-ready')",
];
for (const marker of requiredJs) if (!js.includes(marker)) throw new Error(`Missing motion JS marker: ${marker}`);

if (architectureVersion >= 48) {
  const lifecycleMarkers = [
    'function prepareRoutePresentationTransition(): void {',
    'commandFeature.deactivate();',
    "accountProfileMenu?.close({ restoreFocus: false });",
    'shellTooltipController.close();',
    'globalOverlayRuntime.reset();',
    'function commitRoutePresentationTransition(',
    'presentationReadinessRuntime.cancel();',
    'presentationReadinessRuntime.requestFocus({',
    'isCurrent: (revision) => routeLifecycle.isCurrent(revision)',
    "hashchange: () => { transitionUpdate(() => { render(); }, 'route'); },",
  ];
  for (const marker of lifecycleMarkers) if (!js.includes(marker)) throw new Error(`Missing Architecture 48 route-motion lifecycle marker: ${marker}`);

  const staleHashchangeChoreography = "hashchange: () => { commandFeature.close({ immediate: true }); accountProfileMenu?.close({ restoreFocus:false }); shellTooltipController.close(); transitionUpdate(() => { render(); window.requestAnimationFrame(() => focusShellMainContent({ preventScroll:false })); }, 'route'); },";
  if (js.includes(staleHashchangeChoreography)) {
    throw new Error('Architecture 48 must centralize overlay cleanup and generation-guarded focus outside the hashchange callback.');
  }
} else {
  const legacyMarker = "hashchange: () => { commandFeature.close({ immediate: true }); accountProfileMenu?.close({ restoreFocus:false }); shellTooltipController.close(); transitionUpdate(() => { render(); window.requestAnimationFrame(() => focusShellMainContent({ preventScroll:false })); }, 'route'); },";
  if (!js.includes(legacyMarker)) throw new Error(`Missing motion JS marker: ${legacyMarker}`);
}

if (js.includes('document.startViewTransition(update)')) throw new Error('Root document View Transition must remain disabled.');
const requiredCss = [
  '--motion-fast:',
  '.content-motion-enter',
  '@keyframes wm-leaf-rise',
  '.interaction-ripple',
  '.module-frame-ready',
  '.command-backdrop.closing',
  '@media(prefers-reduced-motion:reduce)',
];
for (const marker of requiredCss) if (!css.includes(marker)) throw new Error(`Missing motion CSS marker: ${marker}`);
let braces=0; for(const char of css){if(char==='{')braces++;else if(char==='}')braces--;if(braces<0)throw new Error('CSS contains an unmatched closing brace.');} if(braces!==0)throw new Error(`CSS brace balance is ${braces}, expected 0.`);
console.log(`motion-system-verification: PASS (architecture=${architectureVersion || 'unknown'})`);

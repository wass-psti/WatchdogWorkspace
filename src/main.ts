import '../assets/css/foundation/tokens.css';
import '../assets/css/foundation/themes.css';
import '../assets/css/foundation/primitives.css';
import '../assets/css/foundation/interactions.css';
import '../assets/css/app.css';
import '../assets/css/foundation/components.css';
import '../assets/css/foundation/application-migration.css';
import '../assets/css/motion-design.css';
import '../assets/css/shell-navigation.css';
import '../assets/css/shell-overlays.css';
import '../assets/css/shared-application-ui.css';
import '../assets/css/shell-account-menu.css';
import '../assets/css/shell-accessibility.css';
import '../assets/css/boards-monday.css';

// Keep the existing checked-in public-client configuration as the compatibility
// baseline, then allow Vite mode/environment values to override it at build/dev time.
import '../config/backend-config.js';
import { applyViteRuntimeConfig } from '../config/vite-runtime-config.ts';
import type { VitePublicRuntimeEnv } from '../config/vite-runtime-config.ts';

// These runtimes intentionally remain side-effect modules because the embedded
// applications share the same global motion contracts.
import '../assets/js/runtime/motion-orchestrator.ts';
import '../assets/js/runtime/motion-design.ts';

type ViteRuntimeEnv = VitePublicRuntimeEnv & Readonly<{ PROD?: boolean; DEV?: boolean; MODE?: string; BASE_URL?: string }>;
const startupMark = 'wm:startup:entry';
if (typeof performance?.mark === 'function') performance.mark(startupMark);

const viteEnv = (import.meta as ImportMeta & { readonly env: ViteRuntimeEnv }).env;
applyViteRuntimeConfig(viteEnv);

// A deployment can invalidate an older hashed async chunk while a long-lived tab
// still has the previous HTML in memory. Vite emits `vite:preloadError` for this
// condition. Recover once by reloading the document, then clear the guard after a
// successful shell import so a genuine application error can never form a loop.
const preloadRecoveryKey = 'wm:vite-preload-recovery:1.43.2';
if (viteEnv.PROD) {
  addEventListener('vite:preloadError', (event) => {
    event.preventDefault();
    try {
      if (sessionStorage.getItem(preloadRecoveryKey) === '1') return;
      sessionStorage.setItem(preloadRecoveryKey, '1');
    } catch {}
    location.reload();
  });
}

// React 19.2 now owns the top-level composition host. The established Work
// Management shell remains authoritative inside a typed legacy-runtime boundary
// until later Stage B milestones migrate presentation ownership feature by feature.
const compositionHost = document.querySelector<HTMLElement>('#app');
if (!compositionHost) throw new Error('Work Management React composition host is missing.');
const { mountReactComposition } = await import('./app/composition/mount-react-composition.tsx');
if (typeof performance?.mark === 'function') performance.mark('wm:startup:composition-loaded');
mountReactComposition(compositionHost);
if (typeof performance?.mark === 'function') {
  performance.mark('wm:startup:mounted');
  try {
    performance.measure('wm:startup:composition-import', startupMark, 'wm:startup:composition-loaded');
    performance.measure('wm:startup:mount', 'wm:startup:composition-loaded', 'wm:startup:mounted');
    performance.measure('wm:startup:total', startupMark, 'wm:startup:mounted');
  } catch {}
}

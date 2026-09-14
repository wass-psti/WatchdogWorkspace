import { spawn } from 'node:child_process';
import { allocateLoopbackPort, captureBrowserDom, delay, findBrowserBinary } from './lib/browser-cdp-smoke.mjs';
import { access } from 'node:fs/promises';
import { resolve } from 'node:path';



const mode = process.argv[2] === 'dev' ? 'dev' : 'preview';
const viteBin = resolve(process.cwd(), 'node_modules/vite/bin/vite.js');
await access(viteBin).catch(() => { throw new Error('Vite is not installed. Run npm install first.'); });
if (mode === 'preview') await access(resolve(process.cwd(), 'dist/index.html')).catch(() => { throw new Error('dist/ is missing. Run npm run build first.'); });

const port = await allocateLoopbackPort();
const args = [viteBin];
if (mode === 'preview') args.push('preview');
args.push('--host', '127.0.0.1', '--port', String(port), '--strictPort');
const viteProcessEnv = mode === 'dev'
  ? { ...process.env, VITE_SUPABASE_URL: '', VITE_SUPABASE_PUBLISHABLE_KEY: '' }
  : process.env;
const child = spawn(process.execPath, args, { cwd: process.cwd(), stdio: ['ignore', 'pipe', 'pipe'], env: viteProcessEnv });
let output = '';
child.stdout.on('data', (chunk) => { output += chunk; });
child.stderr.on('data', (chunk) => { output += chunk; });
const stop = () => { if (!child.killed) child.kill('SIGTERM'); };
process.on('exit', stop);
process.on('SIGINT', () => { stop(); process.exit(130); });

const base = `http://127.0.0.1:${port}`;
try {
  let ready = false;
  for (let i = 0; i < 120; i++) {
    try {
      const response = await fetch(`${base}/`, { redirect: 'manual' });
      if (response.ok) { ready = true; break; }
    } catch {}
    await delay(50);
  }
  if (!ready) throw new Error(`Vite ${mode} server did not become ready.\n${output}`);

  const bootstrapPath = mode === 'dev' ? '/assets/js/runtime/module-bootstrap.ts' : '/assets/js/runtime/module-bootstrap.js';
  for (const path of [
    '/', '/manifest.webmanifest', '/assets/icon.svg',
    '/apps/time-tracker/index.html', '/apps/fueltrack-plus/runtime.html', '/apps/tradelink/runtime.html',
    bootstrapPath,
  ]) {
    const response = await fetch(`${base}${path}`, { cache: 'no-store' });
    if (!response.ok) throw new Error(`${mode} request failed for ${path}: HTTP ${response.status}`);
    if (path === bootstrapPath) {
      const contentType = response.headers.get('content-type') || '';
      if (!/javascript|typescript/i.test(contentType)) throw new Error(`${mode} runtime entry returned an unexpected content type: ${contentType || '<missing>'}`);
      const body = await response.text();
      if (!body.trim() || /<html[\s>]/i.test(body)) throw new Error(`${mode} runtime entry resolved to HTML instead of executable code`);
    }
  }
  if (mode === 'dev') {
    const entry = await fetch(`${base}/src/main.ts`, { cache:'no-store' });
    if (!entry.ok) throw new Error(`development entry failed: HTTP ${entry.status}`);
  } else {
    const sw = await fetch(`${base}/service-worker.js`, { cache:'no-store' });
    const swSource = sw.ok ? await sw.text() : '';
    if (!sw.ok || !swSource.includes('work-management-v1.43.2') || !swSource.includes('WM_ACTIVATE_UPDATE')) throw new Error('production service worker is unavailable or stale');
    const releaseManifest = await fetch(`${base}/config/runtime-assets.js`, { cache:'no-store' });
    const releaseSource = releaseManifest.ok ? await releaseManifest.text() : '';
    if (!releaseManifest.ok || !releaseSource.includes('WM_RUNTIME_RELEASE') || !releaseSource.includes('m33-explicit-update-v1')) throw new Error('production service-worker release manifest is unavailable or stale');
  }

  const browserBinary = await findBrowserBinary();

  // In preview, open every copied embedded page without a parent host. The shared
  // bootstrap must still execute successfully and settle into an explicit auth/startup
  // failure state. The browser is driven through CDP with a real wall-clock deadline,
  // so a wedged Chromium process cannot stall certification indefinitely.
  if (mode === 'preview') {
    for (const path of ['/apps/time-tracker/index.html', '/apps/fueltrack-plus/runtime.html', '/apps/tradelink/runtime.html']) {
      const embedded = await captureBrowserDom(browserBinary, `${base}${path}`, {
        timeoutMs: 20_000,
        ready: (html) => /could not start|Authenticated .* access is required|Open .* through Work Management/.test(html),
      });
      if (!/could not start|Authenticated .* access is required|Open .* through Work Management/.test(embedded.dom)) {
        throw new Error(`Embedded preview did not reach an explicit startup state for ${path}; production bootstrap may be non-executable.`);
      }
    }
  }

  const browserResult = await captureBrowserDom(browserBinary, `${base}/#/login`, {
    timeoutMs: 20_000,
    ready: (html) => html.includes('data-wm-authentication-ui-view="login"') && html.includes('data-wm-authentication-ui-form="login"'),
  });
  const dom = browserResult.dom;
  if (/id="app"\s*>\s*<\/div>/.test(dom)) throw new Error('application shell remained empty after browser startup');
  if (!/Sign in|Work Management|Account backend is not configured/.test(dom)) throw new Error('application shell did not reach an expected startup state');

  // Stage C M10 browser ownership contract. The unauthenticated route still boots
  // through the real React composition, so this smoke proves the page has exactly
  // one React shell owner and one stable runtime route-content island without
  // accidentally exposing authenticated shell chrome before a session exists.
  const openingElements = (html) => html.match(/<[A-Za-z][^>]*>/g) ?? [];
  const escapeRegExp = (value) => String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const attributePattern = (attribute, value) => {
    const escapedAttribute = escapeRegExp(attribute);
    if (value === undefined) {
      return new RegExp(`\\s${escapedAttribute}(?:=(?:"[^"]*"|'[^']*'|[^\\s>]+))?(?=\\s|/?>)`);
    }
    const escapedValue = escapeRegExp(value);
    return new RegExp(`\\s${escapedAttribute}=(?:"${escapedValue}"|'${escapedValue}'|${escapedValue})(?=\\s|/?>)`);
  };
  const countElementsWithAttribute = (html, attribute, value) => {
    const pattern = attributePattern(attribute, value);
    return openingElements(html).filter((tag) => pattern.test(tag)).length;
  };
  const reactShellRoots = countElementsWithAttribute(dom, 'data-wm-react-shell-root');
  const legacyHosts = countElementsWithAttribute(dom, 'data-wm-runtime-host');
  const shellLayouts = countElementsWithAttribute(dom, 'data-wm-react-shell-layout');
  if (reactShellRoots !== 1) throw new Error(`M10 browser contract expected one React shell root; found ${reactShellRoots}.`);
  if (legacyHosts !== 1) throw new Error(`M10 browser contract expected one runtime route-content host; found ${legacyHosts}.`);
  if (shellLayouts !== 1) throw new Error(`M10 browser contract expected one React shell layout boundary; found ${shellLayouts}.`);
  const authenticatedShells = countElementsWithAttribute(dom, 'data-workspace-shell');
  const standaloneShells = countElementsWithAttribute(dom, 'data-wm-react-shell-mode', 'standalone');
  const legacyRouteOwners = countElementsWithAttribute(dom, 'data-wm-composition-owner', 'runtime-route-content');
  if (authenticatedShells !== 0) throw new Error(`M10 browser contract exposed ${authenticatedShells} authenticated shell layout element(s) on the standalone login route.`);
  if (standaloneShells !== 1) throw new Error(`M10 browser contract expected one standalone React-shell mode marker; found ${standaloneShells}.`);
  if (legacyRouteOwners !== 1) throw new Error(`M10 browser contract expected one stable runtime route-content ownership marker; found ${legacyRouteOwners}.`);

  // Stage C M11 browser ownership contract. Global portal roots are page-lifetime
  // React composition siblings, including on standalone authentication routes.
  // Legacy route renderers must not duplicate these IDs inside route content.
  const globalOverlayHosts = countElementsWithAttribute(dom, 'data-wm-global-overlay-host');
  const globalOverlayOwners = countElementsWithAttribute(dom, 'data-wm-composition-owner', 'react-global-overlays');
  const interactiveOverlayLayers = countElementsWithAttribute(dom, 'data-wm-global-overlay-layer', 'interactive');
  const toastOverlayLayers = countElementsWithAttribute(dom, 'data-wm-global-overlay-layer', 'toast');
  const overlayRoots = countElementsWithAttribute(dom, 'id', 'overlayRoot');
  const toastRoots = countElementsWithAttribute(dom, 'id', 'toastRoot');
  if (globalOverlayHosts !== 1) throw new Error(`M11 browser contract expected one React global overlay host; found ${globalOverlayHosts}.`);
  if (globalOverlayOwners !== 1) throw new Error(`M11 browser contract expected one React global overlay ownership marker; found ${globalOverlayOwners}.`);
  if (interactiveOverlayLayers !== 1 || overlayRoots !== 1) throw new Error(`M11 browser contract expected one interactive overlay layer/root; found layers=${interactiveOverlayLayers}, roots=${overlayRoots}.`);
  if (toastOverlayLayers !== 1 || toastRoots !== 1) throw new Error(`M11 browser contract expected one toast layer/root; found layers=${toastOverlayLayers}, roots=${toastRoots}.`);

  // Stage C M12 browser ownership contract. Standalone login is now rendered by
  // React while the M10 runtime route-content host remains page-lifetime mounted
  // but hidden/inert. Counts are opening-tag aware so Vite-injected CSS selectors
  // cannot produce false ownership positives.
  const authenticationHosts = countElementsWithAttribute(dom, 'data-wm-authentication-ui-host');
  const authenticationOwners = countElementsWithAttribute(dom, 'data-wm-composition-owner', 'react-authentication-ui');
  const loginViews = countElementsWithAttribute(dom, 'data-wm-authentication-ui-view', 'login');
  const loginForms = countElementsWithAttribute(dom, 'data-wm-authentication-ui-form', 'login');
  const hiddenLegacyHosts = openingElements(dom).filter((tag) => attributePattern('data-wm-runtime-host').test(tag) && attributePattern('hidden').test(tag)).length;
  if (authenticationHosts !== 1) throw new Error(`M12 browser contract expected one React authentication UI host; found ${authenticationHosts}.`);
  if (authenticationOwners !== 1) throw new Error(`M12 browser contract expected one React authentication UI ownership marker; found ${authenticationOwners}.`);
  if (loginViews !== 1 || loginForms !== 1) throw new Error(`M12 browser contract expected one React login view/form; found views=${loginViews}, forms=${loginForms}.`);
  if (hiddenLegacyHosts !== 1) throw new Error(`M12 browser contract expected the stable runtime route-content host to be hidden on login; found ${hiddenLegacyHosts}.`);

  // Stage C M13 browser exclusivity contract. Management routes require an
  // authenticated session, so the public login smoke proves the new authenticated
  // management owner is not mounted concurrently with the M12 standalone owner.
  const managementHosts = countElementsWithAttribute(dom, 'data-wm-authenticated-management-ui-host');
  const managementOwners = countElementsWithAttribute(dom, 'data-wm-composition-owner', 'react-account-settings-user-management');
  if (managementHosts !== 0 || managementOwners !== 0) throw new Error(`M13 browser exclusivity contract exposed authenticated management UI on login; hosts=${managementHosts}, owners=${managementOwners}.`);

  // Stage C M14 browser ownership contract. Shared application UI is page-lifetime
  // React composition and must exist even when the command palette/toast/update
  // surfaces are currently idle on the login route.
  const sharedApplicationUiHosts = countElementsWithAttribute(dom, 'data-wm-shared-application-ui-host');
  const sharedApplicationUiOwners = countElementsWithAttribute(dom, 'data-wm-shared-application-ui-owner', 'react-command-palette-shared-ui');
  if (sharedApplicationUiHosts !== 1 || sharedApplicationUiOwners !== 1) throw new Error(`M14 browser contract expected one React shared application UI host/owner; hosts=${sharedApplicationUiHosts}, owners=${sharedApplicationUiOwners}.`);

  // Stage D M15 browser ownership contract. The Board facade host is page-lifetime
  // React composition but remains hidden/inert on the public login route. This proves
  // the dedicated ownership boundary exists without leaking authenticated Board UI.
  const boardFacadeHosts = countElementsWithAttribute(dom, 'data-wm-board-presentation-host');
  const boardFacadeOwners = countElementsWithAttribute(dom, 'data-wm-composition-owner', 'react-board-presentation-facade');
  const hiddenBoardFacadeHosts = openingElements(dom).filter((tag) => attributePattern('data-wm-board-presentation-host').test(tag) && attributePattern('hidden').test(tag)).length;
  if (boardFacadeHosts !== 1 || boardFacadeOwners !== 1) throw new Error(`M15 browser contract expected one React Board facade host/owner; hosts=${boardFacadeHosts}, owners=${boardFacadeOwners}.`);
  if (hiddenBoardFacadeHosts !== 1) throw new Error(`M15 browser contract expected the Board facade host to remain hidden on login; found ${hiddenBoardFacadeHosts}.`);

  // Stage D M16 browser component decomposition contract. The same page-lifetime
  // M15 host remains stable, but its DOM responsibility is now delegated to the
  // focused M16 presentation surface component.
  const boardComponentSurfaces = countElementsWithAttribute(dom, 'data-wm-board-component-decomposition', 'react-board-component-decomposition-v1');
  const inactiveBoardRoutes = countElementsWithAttribute(dom, 'data-wm-board-presentation-route', 'inactive');
  if (boardComponentSurfaces !== 1 || inactiveBoardRoutes !== 1) throw new Error(`M16 browser contract expected one decomposed Board presentation surface in inactive login state; surfaces=${boardComponentSurfaces}, inactiveRoutes=${inactiveBoardRoutes}.`);

  console.log(`Vite ${mode} server/browser smoke verification: PASS (${base})`);
} finally {
  stop();
  await delay(100);
}

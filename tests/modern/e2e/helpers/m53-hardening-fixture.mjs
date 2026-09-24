import { installM52Principal, openM52Route, waitForEmbeddedIdentity } from './m52-rbac-fixture.mjs';
import { waitForM39Identity } from './m39-auth-fixture.mjs';

export const M53_MOBILE_VIEWPORT = Object.freeze({ width: 390, height: 844 });
export const M53_DESKTOP_VIEWPORT = Object.freeze({ width: 1440, height: 900 });
export const M53_ROUTE_READY_MAX_MS = 5000;

export async function installM53Admin(page) {
  const context = await installM52Principal(page, { role: 'admin_general_manager' });
  await page.route('https://m39-fixture.supabase.co/rest/v1/rpc/wm_restore_workspace_backup_v4', async (route) => {
    const request = route.request();
    const body = request.postDataJSON?.() ?? {};
    const boards = Array.isArray(body.p_boards) ? body.p_boards.length : 0;
    const moduleRows = Object.values(body.p_module_data ?? {}).reduce((count, rows) => count + (Array.isArray(rows) ? rows.length : 0), 0);
    const activityRows = Object.values(body.p_activity_data ?? {}).reduce((count, rows) => count + (Array.isArray(rows) ? rows.length : 0), 0);
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ verified: true, restored: moduleRows + activityRows + boards, boards }) });
  });
  return context;
}

export async function openM53AdminRoute(page, route) {
  const context = await installM53Admin(page);
  await page.goto(`/#/${route}`);
  await waitForM39Identity(page, { role: 'admin_general_manager' });
  return context;
}

export async function assertNoHorizontalOverflow(page, tolerance = 2) {
  const result = await page.evaluate(() => ({ width: document.documentElement.clientWidth, scrollWidth: document.documentElement.scrollWidth }));
  if (result.scrollWidth > result.width + tolerance) throw new Error(`Host horizontal overflow detected: viewport=${result.width}, scrollWidth=${result.scrollWidth}`);
}

export async function assertFrameNoHorizontalOverflow(page, moduleId, tolerance = 2, timeoutMs = 1800) {
  const started = Date.now();
  let stableSamples = 0;
  let last = null;

  while (Date.now() - started <= timeoutMs) {
    const result = await page.evaluate(async () => {
      await new Promise((resolve) => {
        requestAnimationFrame(() => {
          requestAnimationFrame(() => { resolve(); });
        });
      });
      const frame = document.querySelector('#moduleFrame');
      const doc = frame?.contentDocument;
      if (!doc) return null;
      const root = doc.documentElement;
      const body = doc.body;
      const width = root.clientWidth;
      const rootScrollWidth = root.scrollWidth;
      const bodyScrollWidth = body?.scrollWidth ?? 0;
      const widest = [...doc.querySelectorAll('body *')].reduce((winner, element) => {
        const rect = element.getBoundingClientRect();
        const extent = Math.max(rect.right, element.scrollWidth ?? 0);
        return extent > winner.extent
          ? { extent, selector: element.id ? `#${element.id}` : element.className ? `${element.tagName.toLowerCase()}.${String(element.className).trim().replace(/\s+/g, '.')}` : element.tagName.toLowerCase() }
          : winner;
      }, { extent: 0, selector: '<none>' });
      return { width, rootScrollWidth, bodyScrollWidth, scrollWidth: Math.max(rootScrollWidth, bodyScrollWidth), widest };
    });

    if (!result) throw new Error(`Embedded module document was unavailable for responsive verification: module=${moduleId}.`);
    last = result;

    if (result.scrollWidth <= result.width + tolerance) {
      stableSamples += 1;
      if (stableSamples >= 3) return;
    } else {
      stableSamples = 0;
    }
  }

  throw new Error(`Embedded horizontal overflow persisted after responsive settlement: module=${moduleId}, viewport=${last?.width ?? 'unknown'}, scrollWidth=${last?.scrollWidth ?? 'unknown'}, rootScrollWidth=${last?.rootScrollWidth ?? 'unknown'}, bodyScrollWidth=${last?.bodyScrollWidth ?? 'unknown'}, widest=${last?.widest?.selector ?? '<unknown>'}, widestExtent=${last?.widest?.extent ?? 'unknown'}`);
}

export async function timedRoute(page, route, ready) {
  const started = Date.now();
  await page.evaluate((target) => { location.hash = `#/${target}`; }, route);
  await ready();
  const elapsed = Date.now() - started;
  if (elapsed > M53_ROUTE_READY_MAX_MS) throw new Error(`${route} exceeded the M53 controlled route readiness budget: ${elapsed}ms`);
  return elapsed;
}

export { waitForEmbeddedIdentity, waitForM39Identity, openM52Route };

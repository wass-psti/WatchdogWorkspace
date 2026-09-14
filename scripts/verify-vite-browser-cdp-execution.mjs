import { captureBrowserDom, findBrowserBinary } from './lib/browser-cdp-smoke.mjs';

const assert = (condition, message) => {
  if (!condition) throw new Error(message);
};

const browser = await findBrowserBinary();
const successHtml = `<!doctype html><html><body><main id="root">boot</main><script>setTimeout(()=>{document.querySelector('#root').setAttribute('data-ready','yes');document.querySelector('#root').textContent='ready';},150);</script></body></html>`;

const success = await captureBrowserDom(browser, 'about:blank', {
  timeoutMs: 5_000,
  startupTimeoutMs: 15_000,
  documentHtml: successHtml,
  ready: (html) => html.includes('data-ready="yes"'),
});
assert(success.dom.includes('data-ready="yes"'), 'CDP browser driver did not capture the settled DOM.');
assert(success.state?.readyState === 'complete', `CDP browser driver expected readyState=complete; received ${success.state?.readyState ?? 'missing'}.`);

const startedAt = Date.now();
let timeoutError = null;
try {
  await captureBrowserDom(browser, 'about:blank', {
    timeoutMs: 1_200,
    startupTimeoutMs: 15_000,
    documentHtml: '<!doctype html><html><body><main id="root">never-ready</main></body></html>',
    ready: (html) => html.includes('data-ready="yes"'),
  });
} catch (error) {
  timeoutError = error;
}
const elapsed = Date.now() - startedAt;
assert(timeoutError instanceof Error, 'CDP browser driver must reject when the expected DOM state is never reached.');
assert(/timed out/i.test(timeoutError.message), `CDP browser driver returned the wrong bounded-timeout diagnostic: ${timeoutError.message}`);
assert(elapsed < 20_000, `CDP browser driver did not enforce a bounded wall-clock timeout; elapsed=${elapsed}ms.`);

console.log(`Vite browser CDP execution vectors: PASS (bounded timeout ${elapsed}ms)`);

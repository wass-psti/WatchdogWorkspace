import fs from 'node:fs/promises';
import http from 'node:http';
import { buildBrowserRuntimeBundle } from './build-runtime-bundle.mjs';

const [debugPort] = process.argv.slice(2);
if (!debugPort) throw new Error('Usage: node run-cdp.mjs <debugPort>');

const endpoint = `http://127.0.0.1:${debugPort}`;
let target;
for (let i = 0; i < 300; i++) {
  try {
    const rows = await fetch(`${endpoint}/json/list`).then((response) => response.json());
    target = rows.find((row) => row.type === 'page');
    if (target?.webSocketDebuggerUrl) break;
  } catch {}
  await new Promise((resolve) => {
    setTimeout(resolve, 50);
  });
}
if (!target?.webSocketDebuggerUrl) throw new Error(`Chromium DevTools endpoint did not become available at ${endpoint} within 15 seconds.`);

const ws = new WebSocket(target.webSocketDebuggerUrl);
await new Promise((resolve, reject) => {
  ws.addEventListener('open', resolve, { once: true });
  ws.addEventListener('error', reject, { once: true });
});
let sequence = 0;
const pending = new Map();
ws.addEventListener('message', (event) => {
  const message = JSON.parse(event.data);
  if (!message.id) return;
  const request = pending.get(message.id);
  if (!request) return;
  pending.delete(message.id);
  if (message.error) request.reject(new Error(message.error.message));
  else request.resolve(message.result);
});
function call(method, params = {}) {
  const id = ++sequence;
  return new Promise((resolve, reject) => {
    pending.set(id, { resolve, reject });
    ws.send(JSON.stringify({ id, method, params }));
  });
}
async function evaluate(expression, { awaitPromise = false, returnByValue = true } = {}) {
  const result = await call('Runtime.evaluate', { expression, awaitPromise, returnByValue, userGesture: true });
  if (result.exceptionDetails) {
    const detail = result.exceptionDetails.exception?.description || result.exceptionDetails.text || 'Browser evaluation failed.';
    throw new Error(detail);
  }
  return result.result?.value;
}

await call('Runtime.enable');
await call('Page.enable');

// Execute browser integration from a real loopback HTTP origin. Chromium denies
// Web Storage to opaque origins such as about:blank, while the production shell
// relies on origin-scoped localStorage and same-origin frame/message semantics.
const harnessServer = http.createServer((_request, response) => {
  response.writeHead(200, {
    'Content-Type': 'text/html; charset=utf-8',
    'Cache-Control': 'no-store',
  });
  response.end('<!doctype html><html><head><meta charset="utf-8"><title>Work Management browser integration</title></head><body></body></html>');
});
await new Promise((resolve, reject) => {
  harnessServer.once('error', reject);
  harnessServer.listen(0, '127.0.0.1', resolve);
});
const harnessAddress = harnessServer.address();
if (!harnessAddress || typeof harnessAddress === 'string') {
  harnessServer.close();
  throw new Error('Browser integration harness could not allocate a loopback HTTP port.');
}
const harnessUrl = `http://127.0.0.1:${harnessAddress.port}/integration.html`;
await call('Page.navigate', { url: harnessUrl });
for (let i = 0; i < 200; i += 1) {
  const readyState = await evaluate('document.readyState');
  if (readyState === 'complete') break;
  await new Promise((resolve) => {
    setTimeout(resolve, 25);
  });
  if (i === 199) throw new Error(`Browser integration harness did not finish loading ${harnessUrl}.`);
}
const storageAvailable = await evaluate(`(() => {
  try {
    const key = '__wm_browser_storage_probe__';
    localStorage.setItem(key, 'ok');
    const ok = localStorage.getItem(key) === 'ok';
    localStorage.removeItem(key);
    return ok;
  } catch {
    return false;
  }
})()`);
if (!storageAvailable) {
  harnessServer.close();
  throw new Error(`Browser integration harness did not acquire Web Storage at ${harnessUrl}.`);
}
// Keep browser integration geometry deterministic across Linux/macOS/Windows headless Chrome.
// Several Board assertions intentionally exercise desktop-only sticky-column behavior; relying
// on each browser's implicit headless viewport can accidentally activate the <=760px mobile CSS.
await call('Emulation.setDeviceMetricsOverride', {
  width: 1440,
  height: 1000,
  deviceScaleFactor: 1,
  mobile: false,
  screenWidth: 1440,
  screenHeight: 1000,
});
await evaluate(`document.body.dataset.wmSurface='shell'; document.body.innerHTML='<button id="returnFocus">Return focus target</button><div data-wm-global-overlay-host data-wm-composition-owner="react-global-overlays"><div id="overlayRoot" data-wm-global-overlay-layer="interactive"></div><div id="toastRoot" class="toast-root" data-wm-global-overlay-layer="toast" aria-live="polite" aria-atomic="true"></div></div><div id="boardRoot"></div><div id="itemHost" data-item-panel-host></div>'; document.title='Work Management browser integration'; true;`);

// v1.28/v1.30 motion runtime boundaries: the real Chromium release gate must execute
// both assets/js/runtime/motion-orchestrator.ts and assets/js/runtime/motion-design.ts, not merely verify that the source files exist.
const motionOrchestratorSource = await fs.readFile('assets/js/runtime/motion-orchestrator.ts', 'utf8');
if (!motionOrchestratorSource.includes("version: '1.30.0'")) {
  throw new Error('Motion orchestrator source no longer exposes the v1.30 browser contract expected by the release harness.');
}
const motionRuntimeSource = await fs.readFile('assets/js/runtime/motion-design.ts', 'utf8');
if (!motionRuntimeSource.includes("document.body.dataset.wmMotionReady = 'true'")) {
  throw new Error('Motion design runtime source no longer exposes the browser-ready contract expected by the release harness.');
}

const browserRuntimeCode = await buildBrowserRuntimeBundle();
await evaluate(browserRuntimeCode);
const browserRuntimeReady = await evaluate('globalThis.__wmBrowserRuntimeBundleReady === true');
if (!browserRuntimeReady) throw new Error('Browser integration runtime bundle did not initialize its global boundary.');

// Prove in the Chromium process that motion-design.ts initialized and published its observable runtime state.
const motionRuntimeBoundary = await evaluate(`({
  preference: document.documentElement.dataset.wmMotion ?? null,
  ready: document.body.dataset.wmMotionReady ?? null,
  apiVersion: globalThis.WorkManagementMotion?.version ?? null,
})`);
if (!['full', 'reduced'].includes(motionRuntimeBoundary?.preference)) {
  throw new Error('Real Chromium motion design runtime boundary did not publish a valid motion preference state.');
}
if (motionRuntimeBoundary?.ready !== 'true') {
  throw new Error('Real Chromium motion design runtime boundary did not publish its ready state.');
}
if (motionRuntimeBoundary?.apiVersion !== '1.30.0') {
  throw new Error(`Real Chromium motion orchestrator contract mismatch: expected 1.30.0, received ${motionRuntimeBoundary?.apiVersion ?? 'missing'}.`);
}

const finalPresentationCss = [
  await fs.readFile('assets/css/foundation/tokens.css', 'utf8'),
  await fs.readFile('assets/css/foundation/themes.css', 'utf8'),
  await fs.readFile('assets/css/foundation/primitives.css', 'utf8'),
  await fs.readFile('assets/css/app.css', 'utf8'),
  await fs.readFile('assets/css/foundation/components.css', 'utf8'),
  await fs.readFile('assets/css/foundation/application-migration.css', 'utf8'),
  await fs.readFile('assets/css/motion-design.css', 'utf8'),
  await fs.readFile('assets/css/shell-navigation.css', 'utf8'),
  await fs.readFile('assets/css/shell-overlays.css', 'utf8'),
  await fs.readFile('assets/css/shell-account-menu.css', 'utf8'),
  await fs.readFile('assets/css/shell-accessibility.css', 'utf8'),
  await fs.readFile('assets/css/boards-monday.css', 'utf8'),
].join('\n');
const themeCssSources = {
  app: await fs.readFile('assets/css/app.css', 'utf8'),
  motion: await fs.readFile('assets/css/motion-design.css', 'utf8'),
  boards: await fs.readFile('assets/css/boards-monday.css', 'utf8'),
  timeTracker: await fs.readFile('apps/time-tracker/styles.css', 'utf8'),
  fuelTrack: (await fs.readFile('apps/fueltrack-plus/styles.v3.17.0-wm6.css', 'utf8')).replace(/^@import[^\n]*\n/, ''),
  tradeLink: await fs.readFile('apps/tradelink/styles.v1.42.0-wm1.css', 'utf8'),
  finalPresentation: finalPresentationCss,
};
await evaluate(`globalThis.__wmThemeCss=${JSON.stringify(themeCssSources)}; true;`);

const testProgram = String.raw`(async () => {
  const logs=[];
  const assert=(condition,message)=>{if(!condition)throw new Error(message);logs.push('PASS '+message);};
  const wait=(ms=0)=>new Promise((resolve)=>setTimeout(resolve,ms));
  const frames=()=>new Promise((resolve)=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));
  const deferred=()=>{let resolve,reject;const promise=new Promise((r,j)=>{resolve=r;reject=j;});return{promise,resolve,reject};};
  const run=async(name,fn)=>{await fn();logs.push('✓ '+name);};

  await run('route ownership transitions', async()=>{
    const manifest={features:[{id:'home',state:'active'},{id:'boards',state:'active'},{id:'shell',state:'active'}],routes:[{id:'home',owner:'home'},{id:'boards',owner:'boards'},{id:'board',owner:'boards'}]};
    const registry=createFeatureRegistry(manifest);const transitions=[];
    for(const id of ['home','boards','shell'])registry.register(id,{activate:({to})=>transitions.push('+'+id+':'+to?.name),deactivate:({from})=>transitions.push('-'+id+':'+from?.name)});
    let route={name:'home'};const runtime=createWorkManagementClient();const rendered=[];
    const controller=createRouteController({auth:{isAuthenticated:true,state:{initialized:true,status:'active'}},parseRoute:()=>route,navigate:()=>{},runtimeClient:runtime,featureRegistry:registry,moduleHost:{detach(){}},renderers:{home:()=>rendered.push('home'),boards:()=>rendered.push('boards'),board:()=>rendered.push('board')},routePolicy:createRoutePolicyService(),deactivateModule(){},rememberReturnRoute(){}});
    controller.render();route={name:'boards'};controller.render();route={name:'board',boardId:'b1'};controller.render();
    assert(transitions.join('|')==='+home:home|-home:home|+boards:boards','same-owner board route does not churn feature lifecycle');
    assert(rendered.join('|')==='home|boards|board','route dispatch remains correct');controller.dispose();
    assert(transitions.at(-1)==='-boards:board','route controller disposes active feature');
  });

  await run('shell account profile menu interaction', async()=>{
    localStorage.removeItem('wm.platform.preferences.v1');
    assert(savePreferences({theme:'system',compact:false,favorites:[],recent:[]})&&getPreferences().theme==='system','Shell M5 browser fixture seeds the authoritative global preference store');
    applyTheme(getPreferences().theme);
    document.body.insertAdjacentHTML('beforeend','<button id="accountMenuTrigger" aria-expanded="false">Account</button>');
    const trigger=document.querySelector('#accountMenuTrigger');let signedOut=false;const navigations=[];
    const controller=createAccountProfileMenu({auth:{isCloudEnabled:true,isAuthenticated:true,isAccountActive:true,canManageUsers:true,platformRoleLabel:'Admin/General Manager',user:{email:'alex@example.com',user_metadata:{display_name:'Alex Morgan'}},profile:{display_name:'Alex Morgan',status:'active'}},navigate:(route)=>navigations.push(route),escapeHtml:(value)=>String(value).replace(/[&<>"']/g,(char)=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char])),onPreferencesChanged:()=>{},onSignOut:async()=>{signedOut=true;}});
    controller.toggle(trigger);await frames();
    const menu=document.querySelector('#wmShellAccountMenu');assert(menu?.getAttribute('role')==='menu','Shell M5 account launcher opens an accessible menu');
    assert(document.querySelector('#overlayRoot')?.contains(menu),'M11 account menu is portaled through the React-owned global overlay root');
    assert(menu.classList.contains('wm-shell-floating-surface')&&menu.classList.contains('wm-shell-menu-surface'),'Shell M6 account menu consumes the shared host floating-surface contract');
    assert(trigger.getAttribute('aria-expanded')==='true','Shell M5 account trigger exposes expanded state');
    assert(menu.textContent.includes('Alex Morgan')&&menu.textContent.includes('alex@example.com'),'Shell M5 account header renders authenticated identity');
    assert(Boolean(menu.querySelector('[data-account-menu-action="users"]')),'Shell M5 admin account menu exposes User management');
    const focused=document.activeElement;assert(focused?.getAttribute('role')==='menuitem','Shell M5 account menu moves initial focus to the first action');
    focused.dispatchEvent(new KeyboardEvent('keydown',{key:'ArrowDown',bubbles:true}));assert(document.activeElement!==focused,'Shell M5 account menu supports Arrow Down navigation');
    const appearance=menu.querySelector('[data-account-menu-action="appearance"]');appearance.focus();appearance.dispatchEvent(new KeyboardEvent('keydown',{key:'ArrowRight',bubbles:true}));await frames();
    const appearanceMenu=document.querySelector('#wmShellAppearanceMenu');assert(appearanceMenu?.getAttribute('role')==='menu','Shell M5 Appearance opens as a child menu');
    const dark=appearanceMenu.querySelector('[data-account-theme="dark"]');dark.click();await wait();assert(getPreferences().theme==='dark'&&JSON.parse(localStorage.getItem('wm.platform.preferences.v1')).theme==='dark'&&document.documentElement.dataset.theme==='dark','Shell M5 Appearance uses the authoritative global theme preference');
    document.dispatchEvent(new KeyboardEvent('keydown',{key:'Escape',bubbles:true}));await wait();assert(!document.querySelector('#wmShellAppearanceMenu')&&document.activeElement===appearance,'Shell M5 Escape closes the child menu and restores submenu-trigger focus');
    document.dispatchEvent(new KeyboardEvent('keydown',{key:'Escape',bubbles:true}));await wait();assert(!document.querySelector('#wmShellAccountMenu')&&document.activeElement===trigger,'Shell M5 Escape closes the account menu and restores launcher focus');
    controller.toggle(trigger);await frames();const signout=document.querySelector('[data-account-menu-action="signout"]');signout.click();await wait();assert(signedOut,'Shell M5 Sign out uses the existing authenticated session action');
    controller.dispose();trigger.remove();
    savePreferences({theme:'system',compact:false,favorites:[],recent:[]});applyTheme('system');
  });

  await run('Shell M6 global overlay and tooltip harmonization', async()=>{
    const shell=document.createElement('div');shell.dataset.workspaceShell='';shell.dataset.shellNavigationState='compact';shell.dataset.shellNavigationPeek='false';shell.style.cssText='position:fixed;left:0;top:0;width:60px;height:300px';
    const tooltipTrigger=document.createElement('button');tooltipTrigger.dataset.shellTooltip='Applications';tooltipTrigger.dataset.shellTooltipMode='compact';tooltipTrigger.style.cssText='position:absolute;left:8px;top:80px;width:44px;height:44px';tooltipTrigger.textContent='A';shell.appendChild(tooltipTrigger);document.body.appendChild(shell);
    const tooltips=createShellTooltipController({documentRef:document});tooltipTrigger.focus();tooltipTrigger.dispatchEvent(new FocusEvent('focusin',{bubbles:true}));await frames();
    let tooltip=document.querySelector('#wmShellTooltip');assert(tooltip?.getAttribute('role')==='tooltip'&&tooltip.textContent==='Applications','Shell M6 compact navigation exposes a shared accessible tooltip');
    assert(document.querySelector('#overlayRoot')?.contains(tooltip),'M11 shell tooltip is portaled through the React-owned global overlay root');
    assert((tooltipTrigger.getAttribute('aria-describedby')||'').includes('wmShellTooltip'),'Shell M6 tooltip links its trigger through aria-describedby');
    assert(tooltip.getBoundingClientRect().right<=innerWidth-1&&tooltip.getBoundingClientRect().bottom<=innerHeight-1,'Shell M6 tooltip remains viewport-contained through shared floating placement');
    tooltips.close();tooltipTrigger.dataset.shellTooltip='Collapse navigation';tooltipTrigger.dataset.shellTooltipVariant='action';delete tooltipTrigger.dataset.shellTooltipMode;tooltipTrigger.dispatchEvent(new FocusEvent('focusin',{bubbles:true}));await frames();
    tooltip=document.querySelector('#wmShellTooltip');const actionRect=tooltip.getBoundingClientRect();
    assert(tooltip.classList.contains('wm-shell-tooltip--action'),'Shell collapse control uses the compact action-tooltip treatment');
    assert(actionRect.height<=32&&actionRect.width<=181,'Shell collapse action tooltip remains compact and single-line: '+actionRect.width+'x'+actionRect.height);
    tooltipTrigger.click();await wait();assert(!document.querySelector('#wmShellTooltip'),'Shell action tooltip dismisses immediately when its trigger is activated');

    let closedA=0,closedB=0;const managerA=createOverlayManager({scope:'shell-m6-a',documentRef:document}),managerB=createOverlayManager({scope:'shell-m6-b',documentRef:document});
    const overlayA=document.createElement('div'),overlayB=document.createElement('div');document.body.append(overlayA,overlayB);
    managerA.open({id:'root-a',element:overlayA,trigger:tooltipTrigger,close:()=>{closedA++;overlayA.remove();}});await wait();
    assert(!document.querySelector('#wmShellTooltip'),'Shell M6 opening a menu dismisses transient shell tooltips');
    managerB.open({id:'root-b',element:overlayB,trigger:tooltipTrigger,close:()=>{closedB++;overlayB.remove();}});await wait();
    assert(closedA===1&&managerA.active===false&&managerB.topId==='root-b','Shell M6 root overlays are exclusive across independent platform scopes');
    const child=document.createElement('div');document.body.appendChild(child);managerB.open({id:'child-b',element:child,trigger:overlayB,parentId:'root-b',close:()=>child.remove()});
    assert(managerB.snapshot().map((entry)=>entry.id).join('|')==='root-b|child-b','Shell M6 preserves explicit parent-child overlay branches within one scope');
    managerA.dispose();managerB.dispose();tooltips.dispose();shell.remove();overlayA.remove();overlayB.remove();child.remove();
  });

  await run('Stage C M11 global overlay ownership authority', async()=>{
    const overlayRoot=resolveGlobalOverlayRoot();const toastRoot=resolveGlobalToastRoot();
    assert(overlayRoot.dataset.wmGlobalOverlayLayer==='interactive','M11 resolves the React-owned interactive overlay layer');
    assert(toastRoot.dataset.wmGlobalOverlayLayer==='toast','M11 resolves the React-owned toast layer');
    let closedA=0;const trigger=document.querySelector('#returnFocus');
    const first=document.createElement('div'),second=document.createElement('div');overlayRoot.append(first,second);
    const managerA=createOverlayManager({scope:'m11-a',documentRef:document}),managerB=createOverlayManager({scope:'m11-b',documentRef:document});
    managerA.open({id:'m11-root-a',element:first,trigger,close:()=>{closedA++;first.remove();}});
    assert(globalOverlayRuntime.getSnapshot().ownerScope==='m11-a'&&globalOverlayRuntime.getSnapshot().topId==='m11-root-a','M11 runtime publishes the current global owner');
    managerB.open({id:'m11-root-b',element:second,trigger,close:()=>second.remove()});
    assert(closedA===1&&globalOverlayRuntime.getSnapshot().ownerScope==='m11-b','M11 replaces the previous root overlay branch through one page-lifetime authority');
    managerA.dispose();managerB.dispose();first.remove();second.remove();
    assert(globalOverlayRuntime.getSnapshot().active===false,'M11 releases global ownership when the active branch is disposed');
  });

  await run('Stage C M12 authentication UI runtime authority', async()=>{
    authenticationUiRuntime.resetForTest();
    authenticationUiRuntime.show('login');
    assert(authenticationUiRuntime.getSnapshot().view==='login','M12 authentication UI runtime publishes React route ownership');
    authenticationUiRuntime.setPendingConfirmationEmail(' user@example.com ');
    authenticationUiRuntime.setRegistrationDraft({displayName:'Example User',email:' person@example.com '});
    const authSnapshot=authenticationUiRuntime.getSnapshot();
    assert(authSnapshot.pendingConfirmationEmail==='user@example.com'&&authSnapshot.registrationDraft.email==='person@example.com','M12 authentication UI runtime normalizes safe email state');
    assert(!('password' in authSnapshot)&&!('confirmPassword' in authSnapshot)&&!('password' in authSnapshot.registrationDraft)&&!('confirmPassword' in authSnapshot.registrationDraft),'M12 authentication UI runtime retains only safe registration draft fields');
    authenticationUiRuntime.showCallbackProgress();
    assert(authenticationUiRuntime.getSnapshot().view==='verify'&&authenticationUiRuntime.getSnapshot().callbackProcessing===true,'M12 verification callback progress remains explicit in the React route runtime');
    authenticationUiRuntime.completeCallbackProgress();
    authenticationUiRuntime.show('disabled');
    assert(authenticationUiRuntime.getSnapshot().view==='disabled','M12 disabled-account presentation is routed through the React authentication authority');
    authenticationUiRuntime.deactivate();
    assert(authenticationUiRuntime.getSnapshot().view==='hidden','M12 authentication UI runtime releases ownership when auth route deactivates');
  });

  await run('Stage C M13 authenticated management UI runtime authority', async()=>{
    authenticatedManagementUiRuntime.resetForTest();
    authenticatedManagementUiRuntime.show('account');
    assert(authenticatedManagementUiRuntime.getSnapshot().view==='account','M13 runtime publishes Account route ownership');
    authenticatedManagementUiRuntime.show('settings');
    assert(authenticatedManagementUiRuntime.getSnapshot().view==='settings','M13 runtime publishes Settings route ownership');
    authenticatedManagementUiRuntime.show('users');
    const managementSnapshot=authenticatedManagementUiRuntime.getSnapshot();
    assert(managementSnapshot.view==='users','M13 runtime publishes Users route ownership');
    assert(!('password' in managementSnapshot)&&!('confirmPassword' in managementSnapshot),'M13 runtime does not retain password-shaped shared state');
    authenticatedManagementUiRuntime.hide();
    assert(authenticatedManagementUiRuntime.getSnapshot().view==='hidden','M13 runtime releases management ownership when route deactivates');
  });

  await run('Stage C M14 shared application UI runtime authority', async()=>{
    sharedApplicationUiRuntime.resetForTest();
    let executed='';let applied=0;let dismissed=0;
    sharedApplicationUiRuntime.configureCommandPalette({list:(query)=>[{id:'navigate:home',title:'Applications',subtitle:'Work Management home',icon:'<svg></svg>',keywords:['home']},{id:'navigate:boards',title:'Boards',subtitle:'Collaborative work boards',icon:'<svg></svg>',keywords:['tasks']}].filter((item)=>!query||(item.title+' '+item.subtitle+' '+item.keywords.join(' ')).toLowerCase().includes(query.toLowerCase())),execute:(id)=>{executed=id;},motionEnabled:()=>false});
    sharedApplicationUiRuntime.configureUpdate({apply:()=>{applied++;},dismiss:()=>{dismissed++;}});
    sharedApplicationUiRuntime.openCommandPalette();
    assert(sharedApplicationUiRuntime.getSnapshot().command.phase==='open'&&sharedApplicationUiRuntime.getSnapshot().command.items.length===2,'M14 runtime opens the React command palette with registry-backed items');
    sharedApplicationUiRuntime.updateCommandQuery('board');
    assert(sharedApplicationUiRuntime.getSnapshot().command.items.length===1&&sharedApplicationUiRuntime.getSnapshot().command.items[0].id==='navigate:boards','M14 runtime filters command results without becoming the command registry authority');
    await sharedApplicationUiRuntime.executeSelectedCommand();
    assert(executed==='navigate:boards'&&sharedApplicationUiRuntime.getSnapshot().command.phase==='closed','M14 runtime delegates selected command execution and closes presentation state');
    const toastId=sharedApplicationUiRuntime.pushToast('Saved.','success',60000);
    assert(sharedApplicationUiRuntime.getSnapshot().toasts.some((toast)=>toast.id===toastId),'M14 runtime owns the global toast queue');
    sharedApplicationUiRuntime.dismissToast(toastId);
    sharedApplicationUiRuntime.showUpdate();await sharedApplicationUiRuntime.applyUpdate();sharedApplicationUiRuntime.dismissUpdate();
    assert(applied===1&&dismissed===1&&sharedApplicationUiRuntime.getSnapshot().update.available===false,'M14 runtime owns service-worker update presentation state while delegating update actions');
    sharedApplicationUiRuntime.resetForTest();
  });

  await run('Stage D M15 React Board presentation facade runtime authority', async()=>{
    boardPresentationFacadeRuntime.resetForTest();
    boardPresentationFacadeRuntime.showBoards();
    assert(boardPresentationFacadeRuntime.getSnapshot().view==='boards'&&boardPresentationFacadeRuntime.getSnapshot().boardId===null,'M15 runtime publishes React ownership for the Boards collection route');
    boardPresentationFacadeRuntime.showBoard('board-browser-1');
    assert(boardPresentationFacadeRuntime.getSnapshot().view==='board'&&boardPresentationFacadeRuntime.getSnapshot().boardId==='board-browser-1','M15 runtime publishes Board detail identity without taking domain-data authority');
    boardPresentationFacadeRuntime.hide();
    assert(boardPresentationFacadeRuntime.getSnapshot().view==='hidden'&&boardPresentationFacadeRuntime.getSnapshot().boardId===null,'M15 runtime releases Board presentation ownership when the route deactivates');
  });

  await run('modal focus and restoration', async()=>{
    const trigger=document.querySelector('#returnFocus');trigger.focus();
    const dialogs=createBoardDialogController({toast:()=>{},escapeHtml:(value)=>String(value)});
    const modal=dialogs.open({title:'Focus test',body:'<label>Name<input name="name"></label>',onSubmit:async()=>{}});await frames();
    const input=modal.wrap.querySelector('input[name="name"]');const first=modal.wrap.querySelector('.wm-modal-close');const last=modal.wrap.querySelector('button[type="submit"]');
    assert(document.activeElement===input,'dialog gives initial focus to the first form control');
    first.focus();first.dispatchEvent(new KeyboardEvent('keydown',{key:'Tab',shiftKey:true,bubbles:true,cancelable:true}));
    assert(document.activeElement===last,'Shift+Tab wraps from first dialog control to last dialog control');
    modal.wrap.dispatchEvent(new KeyboardEvent('keydown',{key:'Escape',bubbles:true,cancelable:true}));await wait(190);
    assert(!modal.wrap.isConnected,'Escape dismisses dialog');assert(document.activeElement===trigger,'dialog restores invoking focus');
  });

  await run('board confirmation dialog semantics', async()=>{
    const dialogs=createBoardDialogController({toast:()=>{},escapeHtml:(value)=>String(value)});
    const cancelled=dialogs.confirm('Delete this record permanently? This cannot be undone.');await frames();
    const destructive=document.querySelector('.board-dialog[data-dialog-tone="danger"]');
    assert(Boolean(destructive),'destructive confirmation uses the Board dialog surface');
    destructive.closest('.board-dialog-backdrop').querySelector('.wm-modal-cancel').click();
    assert(await cancelled===false,'cancelling a Board confirmation resolves false');
    const accepted=dialogs.confirm('Archive this record? You can restore it later.');await frames();
    const current=document.querySelector('.board-dialog');const submit=current.querySelector('button[type="submit"]');
    current.querySelector('form').requestSubmit(submit);
    assert(await accepted===true,'submitting a Board confirmation resolves true');
    await wait(180);
  });

  await run('iframe module-host lifecycle', async()=>{
    const events=[];const host=createModuleHost({auth:{moduleIdentityContext:(id)=>({type:'wm:identity-context',version:1,moduleId:id,user:{id:'browser-user',email:'browser@example.test',displayName:'Browser User'},platformRole:'Admin',accountStatus:'active',module:{role:'Admin',enabled:true},updatedAt:'2026-08-30T00:00:00.000Z',allowed:true})},origin:location.origin,onEvent:(event)=>events.push(event.type)});
    const iframe=document.createElement('iframe');document.body.appendChild(iframe);host.attach(iframe,{id:'time-tracker'});
    iframe.srcdoc='<body>fixture<script>const o=location.origin===\'null\'?\'*\':location.origin;addEventListener(\'message\',e=>{if(e.data?.type===\'wm:identity-context\'){document.body.dataset.identity=e.data.user?.id||\'received\';parent.postMessage({type:\'wm:host:ready\',detail:{name:\'Fixture\',moduleId:\'time-tracker\'}},o)}});parent.postMessage({type:\'wm:identity:request\',moduleId:\'time-tracker\'},o)<\/script></body>';

    for(let i=0;i<80&&!events.includes('module:ready');i++)await wait(20);
    assert(events.includes('module:attached'),'module host reports attachment');assert(events.includes('module:identity-published'),'module host publishes identity');assert(events.includes('module:ready'),'module host accepts attached iframe ready event');
    assert(iframe.contentDocument.body.dataset.identity==='browser-user','attached iframe receives identity payload');host.detach();
    assert(host.moduleId===null,'module host clears module on detach');assert(host.invalidate('host-refresh')===false,'detached host cannot invalidate a stale iframe');iframe.remove();
  });


  await run('cross-session authorization reconciliation', async()=>{
    const calls={clear:0,detach:0,publish:0,deactivate:0};
    const auth={user:{id:'browser-user'},state:{status:'authenticated'},isAccountActive:true,platformRole:'Admin',assignments:[{module_id:'time-tracker',role:'Admin',enabled:true}],canAccessModule:()=>true};
    let fingerprint=authorizationFingerprint(auth);
    auth.state.status='disabled';auth.isAccountActive=false;auth.assignments=[{module_id:'time-tracker',role:'Employee',enabled:false}];auth.canAccessModule=()=>false;
    let result=reconcileAuthorizationContext({auth,previousFingerprint:fingerprint,serverState:{clear:()=>{calls.clear+=1;}},moduleHost:{detach:()=>{calls.detach+=1;},publishIdentity:()=>{calls.publish+=1;return true;}},activeModuleId:'time-tracker',deactivateModule:()=>{calls.deactivate+=1;}});
    assert(result.changed&&result.moduleAccessRevoked,'authorization downgrade is recognized as a runtime context change');
    assert(calls.clear===1,'authorization downgrade clears stale server-state cache');
    assert(calls.detach===1&&calls.deactivate===1&&calls.publish===0,'revoked module access detaches the active embedded application');
    fingerprint=result.fingerprint;
    auth.state.status='authenticated';auth.isAccountActive=true;auth.platformRole='Employee';auth.assignments=[{module_id:'time-tracker',role:'Employee',enabled:true}];auth.canAccessModule=()=>true;
    result=reconcileAuthorizationContext({auth,previousFingerprint:fingerprint,serverState:{clear:()=>{calls.clear+=1;}},moduleHost:{detach:()=>{calls.detach+=1;},publishIdentity:()=>{calls.publish+=1;return true;}},activeModuleId:'time-tracker',deactivateModule:()=>{calls.deactivate+=1;}});
    assert(result.changed&&!result.moduleAccessRevoked,'authorized role/session refresh remains attached');
    assert(calls.clear===2&&calls.publish===1,'authorized context changes clear cache and republish embedded identity');
  });

  await run('drag/drop interaction boundary', async()=>{
    const root=document.querySelector('#boardRoot');root.innerHTML='<div draggable="true" data-item-id="i1">Item one</div><div data-drop-status="done">Done</div>';
    const items=[{id:'i1',group_id:'g1',position:0,status:'not_started'}],moves=[];const commands={moveItem:async(command)=>{moves.push(command);items[0].status=command.status;}};
    const controller=createBoardDragDropController({commands,state:{board:{board:{id:'b1'}}},canEdit:()=>true,getItems:()=>items,toast:()=>{},renderBoard:()=>{},history:null});controller.bind(root);
    const item=root.querySelector('[data-item-id]'),done=root.querySelector('[data-drop-status="done"]');let transfer=new DataTransfer();
    item.dispatchEvent(new DragEvent('dragstart',{bubbles:true,cancelable:true,dataTransfer:transfer}));done.dispatchEvent(new DragEvent('dragover',{bubbles:true,cancelable:true,dataTransfer:transfer}));done.dispatchEvent(new DragEvent('drop',{bubbles:true,cancelable:true,dataTransfer:transfer}));await wait();
    assert(moves.length===1&&moves[0].status==='done','drag/drop moves item through command service');assert(root.querySelector('[data-board-drag-live]'),'drag/drop publishes aria-live feedback');
    transfer=new DataTransfer();item.dispatchEvent(new DragEvent('dragstart',{bubbles:true,cancelable:true,dataTransfer:transfer}));done.dispatchEvent(new DragEvent('drop',{bubbles:true,cancelable:true,dataTransfer:transfer}));await wait();
    assert(moves.length===1,'drop into current status suppresses no-op server move');controller.dispose();assert(controller.activeItemId===null,'drag transient state clears on dispose');
  });

  await run('Board keyboard resize and structural reordering', async()=>{
    const root=document.querySelector('#boardRoot');
    root.innerHTML='<span id="resizeHandle" data-column-resize="c1" role="separator" tabindex="0"></span><span id="columnHandle1" data-column-drag="c1" tabindex="0"></span><span data-column-drag="c2" tabindex="0"></span><span id="groupHandle1" data-group-drag="g1" tabindex="0"></span><span data-group-drag="g2" tabindex="0"></span>';
    const resizeState={boardPrefs:{item_name_width:280,column_widths:{c1:160}}};let preferenceWrites=0;
    const patches={withItemNameWidth:(prefs,width)=>({...prefs,item_name_width:width}),withColumnWidth:(prefs,key,width)=>({...prefs,column_widths:{...(prefs.column_widths||{}),[key]:width}})};
    const resize=createColumnResizeController({state:resizeState,preferencePatches:patches,persistPreferences:()=>{preferenceWrites+=1;},history:null,renderBoardData:()=>{}});resize.bind(root);
    const resizeHandle=root.querySelector('#resizeHandle');
    assert(resizeHandle.getAttribute('aria-valuenow')==='160','keyboard resize exposes the current column width to assistive technology');
    resizeHandle.focus();resizeHandle.dispatchEvent(new KeyboardEvent('keydown',{key:'ArrowRight',bubbles:true,cancelable:true}));await wait();
    assert(resizeState.boardPrefs.column_widths.c1===168&&preferenceWrites===1,'ArrowRight resizes a focused column through persisted Board preferences');
    resizeHandle.dispatchEvent(new KeyboardEvent('keydown',{key:'ArrowLeft',shiftKey:true,bubbles:true,cancelable:true}));await wait();
    assert(resizeState.boardPrefs.column_widths.c1===144,'Shift+Arrow uses the larger accessible column-resize step');resize.dispose();

    const structureState={board:{columns:[{id:'c1',position:0},{id:'c2',position:1}],groups:[{id:'g1',position:0},{id:'g2',position:1}]}};const structureCalls=[];
    const structure=createBoardStructureDragController({state:structureState,commands:{moveColumn:async(command)=>structureCalls.push(['column',command.columnId,command.position]),moveGroup:async(command)=>structureCalls.push(['group',command.groupId,command.position])},canEdit:()=>true,toast:()=>{},renderBoardData:()=>{},history:null});structure.bind(root);
    root.querySelector('#columnHandle1').dispatchEvent(new KeyboardEvent('keydown',{key:'ArrowRight',bubbles:true,cancelable:true}));await wait();
    assert(structureState.board.columns.find((entry)=>entry.id==='c1').position===1&&structureCalls.some((entry)=>entry[0]==='column'&&entry[2]===1),'ArrowRight reorders a focused Board column');
    root.querySelector('#groupHandle1').dispatchEvent(new KeyboardEvent('keydown',{key:'ArrowDown',bubbles:true,cancelable:true}));await wait();
    assert(structureState.board.groups.find((entry)=>entry.id==='g1').position===1&&structureCalls.some((entry)=>entry[0]==='group'&&entry[2]===1),'ArrowDown reorders a focused Board group');structure.dispose();

    root.innerHTML='<table><tbody><tr class="board-item-row" draggable="true" data-item-id="i1"><td><span id="itemHandle1" class="drag-handle" data-item-drag="i1" role="button" tabindex="0" aria-label="Reorder Item one. Use Arrow Up or Arrow Down."></span></td></tr><tr class="board-item-row" draggable="true" data-item-id="i2"><td><span class="drag-handle" data-item-drag="i2" role="button" tabindex="0" aria-label="Reorder Item two. Use Arrow Up or Arrow Down."></span></td></tr></tbody></table>';
    const items=[{id:'i1',group_id:'g1',position:0,status:'not_started'},{id:'i2',group_id:'g1',position:1,status:'not_started'}],itemMoves=[];
    const itemDrag=createBoardDragDropController({commands:{moveItem:async(command)=>itemMoves.push(command)},state:{board:{board:{id:'b1'}}},canEdit:()=>true,getItems:()=>items,toast:()=>{},renderBoard:()=>{},history:null});itemDrag.bind(root);
    root.querySelector('#itemHandle1').dispatchEvent(new KeyboardEvent('keydown',{key:'ArrowDown',bubbles:true,cancelable:true}));await wait();
    assert(items.find((entry)=>entry.id==='i1').position===1&&itemMoves[0]?.position===1,'ArrowDown reorders a focused Board item within its group');
    root.querySelector('[data-item-id="i1"]').setAttribute('draggable','false');
    root.querySelector('#itemHandle1').dispatchEvent(new KeyboardEvent('keydown',{key:'ArrowUp',bubbles:true,cancelable:true}));await wait();
    assert(items.find((entry)=>entry.id==='i1').position===1&&itemMoves.length===1,'Keyboard item reorder ignores a non-draggable Board row');itemDrag.dispose();
  });

  await run('Stage D M18 Board virtualization windowing authority', async()=>{
    const rowPlan=calculateBoardVirtualRowWindow({totalRows:500,scrollOffset:4400,viewportHeight:880,rowHeight:44});
    assert(rowPlan.enabled&&rowPlan.start>0&&rowPlan.end<500,'M18 row planner bounds mounted rows for a large logical group');
    assert(rowPlan.leadingHeight+(rowPlan.end-rowPlan.start)*44+rowPlan.trailingHeight===22000,'M18 row spacer geometry preserves complete logical height');
    const widths=Array.from({length:24},(_,index)=>140+(index%3)*20);
    const columnPlan=calculateBoardVirtualColumnWindow({widths,scrollOffset:1200,viewportWidth:900});
    assert(columnPlan.enabled&&columnPlan.start>0&&columnPlan.end<24,'M18 column planner bounds mounted dynamic columns');
    const mountedWidth=widths.slice(columnPlan.start,columnPlan.end).reduce((sum,width)=>sum+width,0);
    assert(columnPlan.leadingWidth+mountedWidth+columnPlan.trailingWidth===widths.reduce((sum,width)=>sum+width,0),'M18 column spacer geometry preserves complete logical width');
    const controller=createBoardTableVirtualizationController();
    assert(controller.ensureRowVisible('g1',420,500,44)===true,'M18 logical keyboard navigation can reveal an unmounted row');
    const revealedRow=controller.rowWindow('g1',500,44);
    assert(boardVirtualRowContains(revealedRow,420),'M18 revealed row enters the mounted logical row window');
    const columnReveal=controller.ensureColumnVisible(21,widths);
    assert(columnReveal.changed&&columnReveal.scrollLeft>0,'M18 logical keyboard navigation can reveal an unmounted column');
    const revealedColumn=controller.columnWindow(widths);
    assert(boardVirtualColumnContains(revealedColumn,21),'M18 revealed column enters the mounted logical column window');
    assert(BOARD_TABLE_VIRTUALIZATION_POLICY.rowThreshold===160&&BOARD_TABLE_VIRTUALIZATION_POLICY.columnThreshold===18,'M18 browser runtime uses the governed virtualization thresholds');
    controller.reset();
  });

  await run('Board history, scoped selection and optimistic typed cells', async()=>{
    let counter=1;const history=createBoardHistoryController({toast:()=>{},onChange:()=>{}});history.push({label:'counter',undo:async()=>{counter=0;},redo:async()=>{counter=1;}});await history.undo();assert(counter===0&&history.snapshot().canRedo,'Board history exposes undo/redo state');await history.redo();assert(counter===1,'Board history replays registered redo');
    const selectionState={board:{items:[{id:'i1',group_id:'g1'},{id:'i2',group_id:'g1'},{id:'i3',group_id:'g2'}],groups:[{id:'g1',title:'One'},{id:'g2',title:'Two'}]},selectedItems:[],selectionAnchor:null};
    const selection=createBoardSelectionController({state:selectionState,commands:{},toast:()=>{},getVisibleItems:()=>selectionState.board.items,reloadBoard:async()=>{},escapeHtml:String,canEdit:()=>true});selection.toggle('i1');selection.toggle('i2',{range:true});assert(selection.selectedItems().length===2,'range selection selects contiguous items');selection.clear();selection.selectVisible(true,'g2');assert(selection.selectedItems().length===1&&selection.selectedItems()[0].id==='i3','group select-all stays scoped to its group');
    const pendingSave=deferred();const item={id:'i1',title:'Item'},column={id:'c1',name:'Done',data_type:'checkbox',system_key:null};const cellState={board:{items:[item],columns:[column],values:[],members:[]}};let renders=0;const editor=createBoardInlineEditController({state:cellState,commands:{setCell:()=>pendingSave.promise},toast:()=>{},canEdit:()=>true,allColumns:()=>[column],getCellValue:()=>cellState.board.values.find((entry)=>entry.item_id==='i1'&&entry.column_id==='c1')?.value??null,optionList:()=>[],renderBoardData:()=>{renders+=1;},history:null,escapeHtml:String});const commit=editor.commitCell(item,column,true,{label:'checkbox'});assert(cellState.board.values[0]?.value===true&&renders>0,'typed cell is updated optimistically before persistence');pendingSave.reject(new Error('simulated failure'));await commit;assert(cellState.board.values.length===0,'failed typed-cell persistence rolls optimistic state back');
  });

  await run('recorded Board menu geometry, editor recovery and activity compaction', async()=>{
    const style=document.createElement('style');style.dataset.boardStabilization='1';style.textContent=globalThis.__wmThemeCss.app;document.head.appendChild(style);
    const fixture=document.createElement('section');fixture.innerHTML='<div class="board-table-scroll" style="width:420px;overflow:auto"><table class="interactive-board-table" style="min-width:900px"><tbody><tr class="board-item-row"><td class="selection-cell">□</td><td class="drag-cell">↕</td><td class="board-item-name-cell">Item</td><td>Value</td><td class="item-actions"><details class="item-context-menu context-menu" open><summary>•••</summary><div class="context-menu-pop" style="visibility:visible">Open details</div></details></td></tr></tbody></table></div>';document.body.appendChild(fixture);
    const pop=fixture.querySelector('.item-context-menu .context-menu-pop'),action=fixture.querySelector('.item-actions');
    assert(getComputedStyle(pop).position==='fixed','row context menu escapes the horizontally clipped table with fixed positioning');
    assert(getComputedStyle(action).position==='sticky','row action column remains reachable while the table scrolls horizontally');
    fixture.remove();style.remove();

    const longItem={id:'long-item',title:'Draft item'},longColumn={id:'long-col',name:'New Long text',data_type:'long_text',system_key:null};
    const longState={board:{items:[longItem],columns:[longColumn],values:[{item_id:'long-item',column_id:'long-col',value:'original'}],members:[]}};let renderCount=0;
    const longEditor=createBoardInlineEditController({state:longState,commands:{setCell:async()=>{await wait(15);throw new Error('simulated save failure');}},toast:()=>{},canEdit:()=>true,allColumns:()=>[longColumn],getCellValue:()=>longState.board.values.find((entry)=>entry.item_id==='long-item'&&entry.column_id==='long-col')?.value??null,optionList:()=>[],renderBoardData:()=>{renderCount+=1;},history:null,escapeHtml:String});
    const anchor=document.createElement('button');anchor.textContent='Long text';document.body.appendChild(anchor);longEditor.open('long-item','long-col',anchor);await frames();
    const longForm=document.querySelector('.board-inline-popover form'),textarea=longForm?.querySelector('textarea');textarea.value='unsaved draft survives';longForm.dispatchEvent(new Event('submit',{bubbles:true,cancelable:true}));
    assert(longForm.dataset.saving==='true'&&longForm.getAttribute('aria-busy')==='true','long-text editor exposes an explicit pending-save state');await wait(35);
    assert(longForm.isConnected&&textarea.value==='unsaved draft survives','failed long-text save keeps the entered draft available for retry');
    assert(longForm.querySelector('.inline-save-error')?.textContent.includes('still here'),'failed long-text save exposes persistent inline recovery guidance');
    assert(longForm.dataset.saving==='false'&&!textarea.disabled,'failed long-text save re-enables the editor instead of silently closing');longEditor.reset();anchor.remove();

    const activityState={board:{groups:[{id:'g',title:'Group'}],items:[{id:'activity-item',group_id:'g',title:'Activity item',status:'in_progress'}],columns:[],values:[],members:[]},itemPanel:{itemId:'activity-item',tab:'activity',loading:false,error:'',data:{updates:[],files:[],activity:[
      {id:'e1',event_type:'item.cell_updated',actor_id:'u1',actor_name:'Lex',created_at:'2026-08-28T02:00:30Z',payload:{column_id:'c-long',column_name:'New Long text'}},
      {id:'e2',event_type:'item.cell_updated',actor_id:'u1',actor_name:'Lex',created_at:'2026-08-28T02:00:20Z',payload:{column_id:'c-long',column_name:'New Long text'}},
      {id:'e3',event_type:'item.cell_updated',actor_id:'u1',actor_name:'Lex',created_at:'2026-08-28T02:00:10Z',payload:{column_id:'c-long',column_name:'New Long text'}}
    ]},uploading:false}};
    const activityHtml=renderItemWorkspace({state:activityState,canEdit:()=>true,escapeHtml:String,formatDate:String,formatDay:String});const activityWrap=document.createElement('div');activityWrap.innerHTML=activityHtml;
    assert(activityWrap.textContent.includes('New Long text updated'),'Item Activity names the field that actually changed');
    assert(activityWrap.textContent.includes('×3'),'consecutive repetitive cell updates are compacted into a useful activity event');
    assert(!activityWrap.textContent.includes('item.cell_updated'),'Item Activity does not expose raw internal event codes');
  });

  await run('Item Workspace stale-response and upload isolation', async()=>{
    const host=document.querySelector('#itemHost'),a=deferred(),b=deferred(),upload=deferred(),calls=[];
    const state={board:{board:{id:'board-1'},groups:[{id:'g',title:'Group'}],items:[{id:'a',group_id:'g',title:'A',status:'in_progress'},{id:'b',group_id:'g',title:'B',status:'done'}],columns:[],values:[],members:[]},itemPanel:{itemId:null,tab:'updates',loading:false,error:'',data:{updates:[],files:[],activity:[]},uploading:false}};
    const api={getItemWorkspace:(id)=>id==='a'?a.promise:b.promise,addItemUpdate:async()=>{},uploadItemFile:async(boardId,itemId,file)=>{calls.push({boardId,itemId,name:file.name});return upload.promise;},deleteItemUpdate:async()=>{},openItemFile:async()=>{},deleteItemFile:async()=>{}};
    const renderPanel=()=>{host.innerHTML=renderItemWorkspace({state,canEdit:()=>true,escapeHtml:(v)=>String(v??'').replaceAll('&','&amp;').replaceAll('<','&lt;'),formatDate:String,formatDay:String});};
    const controller=createItemWorkspaceController({api,state,toast:()=>{},renderBoard:renderPanel,renderPanel,confirmAction:()=>true});
    controller.open('a');controller.open('b');b.resolve({updates:[{id:'b-update',author_name:'B',created_at:'now',body:'B'}],files:[],activity:[]});await wait();a.resolve({updates:[{id:'a-update',author_name:'A',created_at:'now',body:'A'}],files:[],activity:[]});await wait();
    assert(state.itemPanel.itemId==='b'&&state.itemPanel.data.updates[0].id==='b-update','late Item A response cannot overwrite Item B');
    controller.open('a');await wait();const input=document.createElement('input');input.type='file';input.dataset.itemFileInput='1';const dt=new DataTransfer();dt.items.add(new File(['x'],'proof.txt',{type:'text/plain'}));Object.defineProperty(input,'files',{value:dt.files});host.appendChild(input);
    const uploadPromise=controller.uploadFiles({target:input});controller.open('b');upload.resolve({});await uploadPromise;assert(calls[0]?.itemId==='a','upload remains bound to item selected at upload start');controller.reset();
  });



  await run('Board explicit rename, configurable Status and single-overlay interaction', async()=>{
    const root=document.querySelector('#boardRoot');
    root.innerHTML='<div class="board-item-name-cell"><button id="renameProbe" type="button" data-edit-item-title="item-1">Original item</button></div><button id="underlayItem" type="button" data-open-item="item-2">Open underlying item</button><button id="statusProbe" type="button" data-edit-cell="item-1" data-column-id="status-col">Status</button>';
    const statusColumn={id:'status-col',name:'Status',data_type:'status',system_key:'status',config:{labels:[{id:'todo',name:'To do',color:'#7f8a9a',active:true,description:'Ready to begin',position:0},{id:'working',name:'Working on it',color:'#ef8f3c',active:true,description:'In progress',position:1},{id:'done_custom',name:'Done',color:'#23b784',active:true,description:'Completed',position:2}],default_label_id:'todo'}};
    const state={board:{board:{id:'b1'},items:[{id:'item-1',group_id:'g1',title:'Original item',status:'todo'}],groups:[{id:'g1',title:'Main group'}],columns:[statusColumn],values:[],members:[]},boardPrefs:{column_filters:{}},itemStatus:'all'};
    const updates=[],cellSaves=[],statusSaves=[];let failNextRename=false;
    const coordinator=createBoardOverlayCoordinator();
    const controller=createBoardInlineEditController({state,commands:{updateItem:async(command)=>{updates.push(command);if(failNextRename){failNextRename=false;throw new Error('rename persistence failed');}},setCell:async(command)=>cellSaves.push(command),setStatusLabels:async(command)=>statusSaves.push(command),savePreferences:async(_id,prefs)=>prefs,updateColumn:async()=>{},renameGroup:async()=>{}},toast:()=>{},canEdit:()=>true,allColumns:()=>[statusColumn],getCellValue:(item,column)=>column.system_key==='status'?item.status:item.title,optionList:()=>[],renderBoardData:()=>{const cell=root.querySelector('.board-item-name-cell');if(cell)cell.innerHTML='<button id="renameProbe" type="button" data-edit-item-title="item-1">'+state.board.items[0].title+'</button>';},history:null,escapeHtml:String,overlayCoordinator:coordinator,statusLabelsFor:normalizeStatusLabels});
    const rename=root.querySelector('#renameProbe');
    controller.openTitle('item-1',rename);
    assert(root.querySelector('.inline-confirm')&&root.querySelector('.inline-cancel'),'inline rename exposes explicit Save and Cancel controls');
    let input=root.querySelector('.board-inline-input');input.value='Blur must not save';input.dispatchEvent(new FocusEvent('blur',{bubbles:false}));await wait();
    assert(state.board.items[0].title==='Original item'&&updates.length===0&&root.querySelector('.board-inline-input'),'rename blur does not save or implicitly close the explicit editor');
    input.dispatchEvent(new KeyboardEvent('keydown',{key:'Escape',bubbles:true,cancelable:true}));await wait();
    assert(state.board.items[0].title==='Original item'&&root.querySelector('#renameProbe'),'Escape cancels rename and restores the prior item name');
    controller.openTitle('item-1',root.querySelector('#renameProbe'));input=root.querySelector('.board-inline-input');input.value='Cancelled by X';root.querySelector('.inline-cancel').click();await wait();
    assert(state.board.items[0].title==='Original item'&&updates.length===0,'explicit X/cancel control restores the prior item name without persistence');
    controller.openTitle('item-1',root.querySelector('#renameProbe'));input=root.querySelector('.board-inline-input');input.value='Confirmed name';input.dispatchEvent(new KeyboardEvent('keydown',{key:'Enter',bubbles:true,cancelable:true}));await wait();
    assert(state.board.items[0].title==='Confirmed name'&&updates.at(-1)?.title==='Confirmed name','Enter confirms rename once through the persistence service');
    controller.openTitle('item-1',root.querySelector('#renameProbe'));input=root.querySelector('.board-inline-input');input.value='Confirmed by check';root.querySelector('.inline-confirm').click();await wait();
    assert(state.board.items[0].title==='Confirmed by check'&&updates.at(-1)?.title==='Confirmed by check','explicit check/confirm control persists the edited item name');
    failNextRename=true;controller.openTitle('item-1',root.querySelector('#renameProbe'));input=root.querySelector('.board-inline-input');input.value='Failed rename remains editable';root.querySelector('.inline-confirm').click();await wait();
    assert(root.querySelector('.board-inline-input')?.value==='Failed rename remains editable'&&root.querySelector('.board-inline-input')?.getAttribute('aria-invalid')==='true','failed inline rename preserves the draft and exposes an actionable error state');
    assert(state.board.items[0].title==='Confirmed by check','failed inline rename restores authoritative Board state without closing the editor');root.querySelector('.inline-cancel').click();await wait();

    const labels=normalizeStatusLabels(statusColumn);
    assert(labels.map((label)=>label.id).join('|')==='todo|working|done_custom','Status labels preserve stable internal IDs independently of visible text');
    controller.open('item-1','status-col',root.querySelector('#statusProbe'));await frames();
    let picker=document.querySelector('.board-status-popover');
    assert(picker&&picker.textContent.includes('Working on it')&&picker.querySelector('[data-manage-status-labels]'),'Status cell opens a compact colored-label picker with an intentional Manage labels action');
    picker.querySelector('[data-status-choice="working"]').click();await wait();
    assert(cellSaves.at(-1)?.value==='working'&&state.board.items[0].status==='working','Status selection persists the stable label ID rather than visible text');
    controller.open('item-1','status-col',root.querySelector('#statusProbe'));await frames();picker=document.querySelector('.board-status-popover');
    picker.querySelector('[data-manage-status-labels]').click();await frames();
    assert(picker.querySelectorAll('[data-status-label-name]').length===3&&picker.querySelector('[data-status-add]')&&picker.querySelector('[data-status-color-toggle]'),'Manage labels exposes inline rename, add, reorder/options and color controls inside one overlay');
    let todoName=picker.querySelector('[data-status-label-name="todo"]');todoName.value='Temporary draft';todoName.dispatchEvent(new Event('input',{bubbles:true}));assert(picker.querySelector('.status-manager-change-note'),'Status manager visibly tracks unsaved label configuration changes');picker.querySelector('[data-status-manager-cancel]').click();await frames();picker.querySelector('[data-manage-status-labels]').click();await frames();
    assert(picker.querySelector('[data-status-label-name="todo"]').value==='To do','Status manager Cancel discards draft configuration without persistence');
    todoName=picker.querySelector('[data-status-label-name="todo"]');todoName.value='Backlog';todoName.dispatchEvent(new Event('input',{bubbles:true}));
    picker.querySelector('[data-status-add]').click();await frames();
    let newInput=[...picker.querySelectorAll('[data-status-label-name]')].find((entry)=>entry.value==='New label');assert(newInput,'Status manager creates a new label row');const newId=newInput.dataset.statusLabelName;newInput.value='Backlog';newInput.dispatchEvent(new Event('input',{bubbles:true}));picker.querySelector('[data-status-apply]').click();await frames();
    assert(picker.querySelector('.status-manager-error')&&statusSaves.length===0,'invalid duplicate Status names remain in the editor with an actionable validation error');newInput=picker.querySelector('[data-status-label-name="'+newId+'"]');newInput.value='QA Review';newInput.dispatchEvent(new Event('input',{bubbles:true}));
    picker.querySelector('[data-status-color-toggle="todo"]').click();await frames();picker.querySelector('[data-status-color="#4f7df3"][data-status-label-id="todo"]').click();await frames();
    picker.querySelector('[data-status-move="up"][data-status-label-id="done_custom"]').click();await frames();
    picker.querySelector('[data-status-more="done_custom"]').click();await frames();picker.querySelector('[data-status-default="done_custom"]').click();await frames();
    picker.querySelector('[data-status-more="working"]').click();await frames();picker.querySelector('[data-status-toggle-active="working"]').click();await frames();assert(picker.querySelector('[data-status-label-row="working"]').classList.contains('is-inactive'),'Status manager deactivates a label');picker.querySelector('[data-status-toggle-active="working"]').click();await frames();assert(!picker.querySelector('[data-status-label-row="working"]').classList.contains('is-inactive'),'Status manager reactivates a label');
    let deletePrompted=false;const originalConfirm=globalThis.confirm;globalThis.confirm=()=>{deletePrompted=true;return true;};try{picker.querySelector('[data-status-delete="working"]').click();await frames();}finally{globalThis.confirm=originalConfirm;}assert(deletePrompted&&!picker.querySelector('[data-status-label-row="working"]'),'deleting an in-use Status label requires confirmation and removes it from the pending configuration');
    picker.querySelector('[data-status-apply]').click();await wait();
    const saved=statusSaves.at(-1);assert(saved&&saved.columnId==='status-col','Status lifecycle changes persist through the typed command service');
    assert(saved.labels.some((label)=>label.id==='todo'&&label.name==='Backlog'&&label.color==='#4f7df3'),'Status rename/recolor preserve stable label identity');
    assert(saved.labels.some((label)=>label.id===newId&&label.name==='QA Review'),'new Status labels persist with generated stable IDs');
    assert(!saved.labels.some((label)=>label.id==='working')&&saved.defaultLabelId==='done_custom','Status deletion and default configuration persist by stable IDs');
    assert(saved.labels.map((label)=>label.id).join('|').startsWith('todo|done_custom|'),'Status reorder persists deterministically');
    const reloadedColumn={...statusColumn,config:{labels:saved.labels,default_label_id:saved.defaultLabelId}};const reloaded=normalizeStatusLabels(reloadedColumn);assert(reloaded.some((label)=>label.id==='todo'&&label.name==='Backlog')&&statusConfig(reloadedColumn).defaultLabelId==='done_custom','Status configuration round-trips through a reload-compatible typed payload');
    const migratedLegacy=normalizeStatusLabels({system_key:'status',config:{options:['Not started','In progress','Blocked','Done']}});assert(migratedLegacy.map((label)=>label.id).join('|')==='not_started|in_progress|blocked|done','historical persisted Status options normalize to stable compatible IDs');
    assert(STATUS_REFERENCE_POLICY==='clear-on-label-delete','Status deletion keeps the explicit persisted-reference clearing policy');
    controller.reset();

    let closedA=0,closedB=0,underlayOpens=0;
    const triggerA=document.createElement('button'),triggerB=document.createElement('button'),overlayA=document.createElement('div'),overlayB=document.createElement('div');
    document.body.append(triggerA,triggerB,overlayA,overlayB);root.querySelector('#underlayItem').addEventListener('click',()=>underlayOpens++);
    coordinator.open({id:'a',element:overlayA,trigger:triggerA,close:()=>{closedA++;overlayA.remove();}});
    coordinator.open({id:'b',element:overlayB,trigger:triggerB,close:()=>{closedB++;overlayB.remove();}});
    assert(closedA===1&&coordinator.topId==='b','opening a new Board overlay replaces the incompatible active overlay');
    const underlay=root.querySelector('#underlayItem');underlay.dispatchEvent(new PointerEvent('pointerdown',{bubbles:true,cancelable:true}));underlay.click();await wait();
    assert(closedB===1&&underlayOpens===0,'outside dismissal does not leak the same click into an underlying item-opening action');
    underlay.click();assert(underlayOpens===1,'the underlying item action remains available after the overlay has been dismissed');
    triggerA.remove();triggerB.remove();overlayA.remove();overlayB.remove();coordinator.dispose();root.innerHTML='';
  });

  await run('Board floating menus and static workspace stability', async()=>{
    const style=document.createElement('style');style.dataset.boardOverhaulTest='1';style.textContent=globalThis.__wmThemeCss.app+'\n'+globalThis.__wmThemeCss.motion;document.head.appendChild(style);
    const root=document.querySelector('#boardRoot');
    root.innerHTML='<div data-wm-motion-static="true"><div class="board-table-scroll" style="width:220px;overflow:auto"><div style="width:700px"><span data-board-menu-host><button id="boardMenuTrigger" data-board-menu-trigger="item" aria-expanded="false">•••</button><template data-board-menu-template><button role="menuitem" data-probe-action>Open details</button><button role="menuitem">Duplicate</button></template></span></div></div><section class="board-group" id="staticBoardGroup">Group</section></div>';
    const menus=createBoardMenuController({root});
    root.addEventListener('click',(event)=>{if(menus.handleTrigger(event.target))event.preventDefault();});
    root.querySelector('#boardMenuTrigger').click();await frames();
    const menu=root.querySelector('.board-floating-menu');
    assert(menu&&!menu.hidden,'Board three-dot trigger opens a floating menu');
    assert(getComputedStyle(menu).position==='fixed','Board menu is outside scroll clipping geometry');
    assert(menu.textContent.includes('Open details'),'Board menu preserves contextual actions');
    assert(root.querySelector('#boardMenuTrigger').getAttribute('aria-expanded')==='true','Board menu exposes expanded state');
    document.dispatchEvent(new KeyboardEvent('keydown',{key:'Escape',bubbles:true,cancelable:true}));await wait();
    assert(menu.hidden&&root.querySelector('#boardMenuTrigger').getAttribute('aria-expanded')==='false','Escape closes Board menu cleanly');
    await frames();
    assert(!root.querySelector('#staticBoardGroup').classList.contains('wm-motion-reveal'),'dynamic Board workspace opts out of repeated reveal motion');
    menus.dispose();root.innerHTML='';style.remove();
  });

  await run('Item Workspace action menu overlays drawer chrome', async()=>{
    const style=document.createElement('style');style.dataset.itemMenuLayerTest='1';style.textContent=globalThis.__wmThemeCss.app+'\n'+globalThis.__wmThemeCss.motion;document.head.appendChild(style);
    const root=document.querySelector('#boardRoot');
    const state={board:{groups:[{id:'g',title:'Main group'}],items:[{id:'menu-item',group_id:'g',title:'Menu item',status:'not_started'}],columns:[],values:[],members:[]},itemPanel:{itemId:'menu-item',tab:'updates',loading:false,error:'',data:{updates:[],files:[],activity:[]},uploading:false}};
    root.innerHTML=renderItemWorkspace({state,canEdit:()=>true,escapeHtml:String,formatDate:String,formatDay:String});
    const menus=createBoardMenuController({root});const trigger=root.querySelector('[data-board-menu-trigger="item-panel"]');
    assert(trigger,'Item Workspace header uses shared floating-menu trigger');
    menus.open(trigger);await frames();
    const layer=root.querySelector('[data-board-overlay-layer]'),menu=root.querySelector('.board-floating-menu'),panel=root.querySelector('[data-item-panel]');
    assert(layer&&menu&&!menu.hidden,'Item Workspace action menu renders in dedicated overlay layer');
    assert(menu.parentElement===layer,'Item Workspace action menu is portaled outside drawer/header stacking context');
    assert(Number.parseInt(getComputedStyle(layer).zIndex,10)>Number.parseInt(getComputedStyle(panel).zIndex,10),'Item Workspace action overlay sits above drawer chrome');
    assert(menu.textContent.includes('Edit item')&&menu.textContent.includes('Archive item'),'Item Workspace menu preserves Edit and Archive actions');
    assert(trigger.getAttribute('aria-expanded')==='true','Item Workspace menu exposes expanded state');
    document.dispatchEvent(new KeyboardEvent('keydown',{key:'Escape',bubbles:true,cancelable:true}));await wait();
    assert(menu.hidden&&trigger.getAttribute('aria-expanded')==='false','Escape closes Item Workspace menu and restores trigger state');
    menus.dispose();root.innerHTML='';style.remove();
  });

  await run('Item Workspace stable tab shell and rapid switching', async()=>{
    const host=document.querySelector('#itemHost');host.innerHTML='';
    const markup=(tab,label)=>'<div class=\"item-panel-scrim\"></div><aside data-item-panel data-item-id=\"stable-item\" data-active-tab=\"'+tab+'\"><header class=\"item-panel-head\">Stable header</header><nav class=\"item-panel-tabs\"><button data-item-panel-tab=\"updates\" aria-selected=\"'+(tab==='updates')+'\" class=\"'+(tab==='updates'?'active':'')+'\">Updates</button><button data-item-panel-tab=\"files\" aria-selected=\"'+(tab==='files')+'\" class=\"'+(tab==='files'?'active':'')+'\">Files</button><button data-item-panel-tab=\"activity\" aria-selected=\"'+(tab==='activity')+'\" class=\"'+(tab==='activity'?'active':'')+'\">Activity</button></nav><div data-item-panel-body style=\"height:120px;overflow:auto\"><div data-item-tab-stage data-item-tab-content=\"'+tab+'\" style=\"height:900px\">'+label+'</div></div></aside>';
    const renderer=createItemPanelRenderer({getHost:()=>host,patchFull:(target,html)=>{target.innerHTML=html;return true;},reducedMotion:()=>false});
    renderer.render(markup('updates','Updates content'));
    const panel=host.querySelector('[data-item-panel]'),head=host.querySelector('.item-panel-head'),tabs=host.querySelector('.item-panel-tabs'),body=host.querySelector('[data-item-panel-body]');
    body.scrollTop=70;
    renderer.render(markup('files','Files content'));
    assert(host.querySelector('[data-item-panel]')===panel,'tab switch keeps Item Workspace drawer shell mounted');
    assert(host.querySelector('.item-panel-head')===head,'tab switch keeps Item Workspace header stationary');
    assert(host.querySelector('.item-panel-tabs')===tabs,'tab switch keeps Item Workspace tablist stationary');
    assert(host.querySelector('[data-item-panel-body]')===body,'tab switch keeps Item Workspace scroll viewport stationary');
    body.scrollTop=105;
    renderer.render(markup('activity','Activity content'));
    renderer.render(markup('updates','Updates return'));
    renderer.render(markup('files','Files return'));
    await frames();
    assert(panel.dataset.activeTab==='files','rapid tab switching settles on latest tab');
    assert(host.querySelector('[data-item-tab-stage]').dataset.itemTabContent==='files','rapid switching cannot leave stale tab content');
    assert(body.scrollTop===105,'returning to Files restores its independent scroll position');
    renderer.reset();host.innerHTML='';
  });

  await run('Item Workspace reduced-motion tab switching', async()=>{
    const host=document.querySelector('#itemHost');host.innerHTML='';
    const markup=(tab)=>'<aside data-item-panel data-item-id=\"reduced-item\" data-active-tab=\"'+tab+'\"><header class=\"item-panel-head\">Header</header><nav class=\"item-panel-tabs\"><button data-item-panel-tab=\"updates\" aria-selected=\"'+(tab==='updates')+'\">Updates</button><button data-item-panel-tab=\"files\" aria-selected=\"'+(tab==='files')+'\">Files</button></nav><div data-item-panel-body><div data-item-tab-stage data-item-tab-content=\"'+tab+'\">'+tab+'</div></div></aside>';
    let animations=0;const original=Element.prototype.animate;Element.prototype.animate=function(...args){animations+=1;return original.call(this,...args);};
    try{const renderer=createItemPanelRenderer({getHost:()=>host,patchFull:(target,html)=>{target.innerHTML=html;return true;},reducedMotion:()=>true});renderer.render(markup('updates'));renderer.render(markup('files'));assert(animations===0,'reduced-motion tab switching starts no content animation');renderer.reset();}finally{Element.prototype.animate=original;host.innerHTML='';}
  });

  await run('Item Workspace accessibility semantics', async()=>{
    const state={board:{groups:[{id:'g',title:'Group'}],items:[{id:'i',group_id:'g',title:'Accessible item',status:'in_progress'}],columns:[],values:[],members:[]},itemPanel:{itemId:'i',tab:'updates',loading:false,error:'',data:{updates:[],files:[],activity:[]},uploading:false}};
    const html=renderItemWorkspace({state,canEdit:()=>true,escapeHtml:String,formatDate:String,formatDay:String});const wrap=document.createElement('div');wrap.innerHTML=html;
    assert(wrap.querySelector('[data-item-panel][role="dialog"][aria-modal="true"]'),'Item Workspace has modal dialog semantics');assert(wrap.querySelector('[role="tablist"]')&&wrap.querySelectorAll('[role="tab"]').length===4&&wrap.querySelector('[data-item-panel-tab="overview"]'),'Item Workspace exposes Overview plus the certified Updates/Files/Activity tabs with tab semantics');assert(wrap.querySelector('[role="tabpanel"]'),'Item Workspace exposes a tabpanel');
  });


  await run('motion orchestrator stable-shell and navigation choreography', async()=>{
    assert(globalThis.WorkManagementMotion?.version==='1.30.0','motion orchestrator exposes the v1.30 runtime contract');
    document.body.dataset.wmSurface='shell';
    const fixture=document.createElement('section');fixture.innerHTML='<header id="stableMotionHeader">Stable chrome</header><nav class="board-tabs" id="motionTabs"><button class="active" aria-selected="true">One</button><button aria-selected="false">Two</button></nav><main id="motionRegion"><article id="oldMotionView">Old</article></main>';document.body.appendChild(fixture);
    const header=fixture.querySelector('#stableMotionHeader'),tabs=fixture.querySelector('#motionTabs');
    WorkManagementMotion.enhance(fixture);await frames();
    let indicator=tabs.querySelector('.wm-motion-indicator');assert(indicator,'shared active-navigation indicator is generated');
    const before=indicator.style.getPropertyValue('--wm-ind-x');const buttons=tabs.querySelectorAll('button');buttons[0].classList.remove('active');buttons[0].setAttribute('aria-selected','false');buttons[1].classList.add('active');buttons[1].setAttribute('aria-selected','true');WorkManagementMotion.refreshIndicators(tabs);await frames();
    indicator=tabs.querySelector('.wm-motion-indicator');assert(indicator.style.getPropertyValue('--wm-ind-x')!==before||indicator.style.getPropertyValue('--wm-ind-w')!=='0px','active-navigation indicator follows selection changes');
    const originalHeader=header;await WorkManagementMotion.exitThen(()=>{fixture.querySelector('#motionRegion').innerHTML='<article id="newMotionView">New</article>';},{selector:'#motionRegion > :first-child',duration:12});
    assert(fixture.querySelector('#stableMotionHeader')===originalHeader,'route motion preserves surrounding persistent chrome');assert(fixture.querySelector('#newMotionView'),'route motion commits only the route-owned content');
    tabs.innerHTML='<button aria-selected="false">Three</button><button class="active" aria-selected="true">Four</button>';WorkManagementMotion.refreshIndicators(tabs);await frames();assert(tabs.querySelector('.wm-motion-indicator'),'indicator rebinds after persistent navigation replaces its children');fixture.remove();
  });

  await run('motion design runtime boundary', async()=>{
    await frames();
    assert(['full','reduced'].includes(document.documentElement.dataset.wmMotion),'motion runtime publishes reduced/full preference state');
    assert(document.body.dataset.wmMotionReady==='true','motion runtime publishes ready state');
    const trigger=document.querySelector('#returnFocus');trigger.dispatchEvent(new PointerEvent('pointerdown',{bubbles:true}));
    if(document.documentElement.dataset.wmMotion==='full') assert(trigger.classList.contains('wm-motion-press'),'motion runtime adds kinetic press feedback');
  });

  await run('embedded application theme and contrast coherence', async()=>{
    const parse=(value)=>{const m=String(value).match(/rgba?\(([^)]+)\)/);if(!m)return null;const p=m[1].split(',').map(Number);return {r:p[0],g:p[1],b:p[2],a:Number.isFinite(p[3])?p[3]:1};};
    const channel=(n)=>{const c=n/255;return c<=.04045?c/12.92:((c+.055)/1.055)**2.4;};
    const luminance=(c)=>.2126*channel(c.r)+.7152*channel(c.g)+.0722*channel(c.b);
    const contrast=(a,b)=>{const A=luminance(a),B=luminance(b);return (Math.max(A,B)+.05)/(Math.min(A,B)+.05);};
    const rgb=(hex)=>{const h=hex.replace('#','');return {r:parseInt(h.slice(0,2),16),g:parseInt(h.slice(2,4),16),b:parseInt(h.slice(4,6),16),a:1};};
    const mount=(surface,css,markup,{light=false}={})=>{
      document.querySelectorAll('style[data-theme-audit]').forEach((node)=>node.remove());
      const style=document.createElement('style');style.dataset.themeAudit='1';style.textContent=css+'\n'+globalThis.__wmThemeCss.motion;document.head.appendChild(style);
      document.documentElement.classList.toggle('light',light);document.body.dataset.wmSurface=surface;document.body.innerHTML=markup;
    };

    mount('time-tracker',globalThis.__wmThemeCss.timeTracker,'<div class="overview-control-dock"><input class="overview-search" value="Search"><div class="modern-select"><button class="modern-select-trigger"><span class="modern-select-value">Information Technology</span></button></div><div class="overview-rule-chip"><span>Policy</span><strong>Late after 08:00</strong></div></div><section class="overview-section"><div class="overview-record-kpis"><div><strong>0</strong><span>Active</span></div></div><div class="overview-table-wrap"><table class="overview-table"><thead><tr><th>Name</th><th>Status</th></tr></thead><tbody><tr><td>No records</td><td>—</td></tr></tbody></table></div></section><div class="modern-select-menu is-portaled"><button class="modern-select-option selected"><span>Information Technology</span><span class="modern-select-check">✓</span></button><button class="modern-select-option"><span>HR</span></button></div>');
    const ttTrigger=getComputedStyle(document.querySelector('.modern-select-trigger')),ttMenu=getComputedStyle(document.querySelector('.modern-select-menu')),ttSelected=getComputedStyle(document.querySelector('.modern-select-option.selected'));
    const ttDock=getComputedStyle(document.querySelector('.overview-control-dock')),ttHeader=getComputedStyle(document.querySelector('.overview-table th')),ttRecords=getComputedStyle(document.querySelector('.overview-record-kpis'));
    assert(ttMenu.backgroundColor==='rgb(255, 255, 255)','TimeTracker portaled dropdown uses the current neutral surface');
    assert(ttTrigger.backgroundColor!=='rgb(247, 241, 231)','TimeTracker trigger no longer exposes the legacy warm control background');
    assert(ttSelected.backgroundColor!=='rgb(251, 233, 223)','TimeTracker selected option no longer uses the old legacy selection token');
    assert(contrast(parse(ttTrigger.color),rgb('#ffffff'))>=4.5,'TimeTracker dropdown text maintains readable contrast');
    assert(ttDock.backgroundColor!=='rgba(252, 248, 241, 0.92)' && ttDock.backgroundColor!=='rgb(252, 248, 241)','TimeTracker Overview filter dock no longer uses the legacy beige surface');
    assert(ttHeader.backgroundColor==='rgb(238, 242, 247)','TimeTracker Attendance Records header uses the current cool muted surface');
    assert(ttRecords.backgroundColor!=='rgb(248, 243, 235)','TimeTracker Attendance Records summary no longer inherits the legacy cream palette');

    const fuelMarkup='<aside class="sidebar"><button class="nav-item active">Dashboard</button></aside><main><header class="topbar"><h1>Dashboard</h1></header><section class="kpi-card"><div class="kpi-top">TOTAL SPENT</div><div class="kpi-foot">Available after refueling completion</div></section></main>';
    mount('fueltrack',globalThis.__wmThemeCss.fuelTrack,fuelMarkup,{light:true});
    const fuelBodyLight=getComputedStyle(document.body),fuelTitleLight=getComputedStyle(document.querySelector('.topbar h1')),fuelMutedLight=getComputedStyle(document.querySelector('.kpi-foot'));
    assert(fuelBodyLight.backgroundColor==='rgb(247, 249, 252)','FuelTrack+ Light Mode uses a light canvas instead of a dark motion override');
    assert(getComputedStyle(document.querySelector('.sidebar')).backgroundImage.includes('255, 255, 255'),'FuelTrack+ Light Mode sidebar uses light chrome');
    assert(contrast(parse(fuelTitleLight.color),rgb('#f7f9fc'))>=7,'FuelTrack+ Light Mode primary text has strong contrast');
    assert(contrast(parse(fuelMutedLight.color),rgb('#ffffff'))>=4.5,'FuelTrack+ Light Mode tertiary text remains readable');
    mount('fueltrack',globalThis.__wmThemeCss.fuelTrack,fuelMarkup,{light:false});
    const fuelTitleDark=getComputedStyle(document.querySelector('.topbar h1')),fuelMutedDark=getComputedStyle(document.querySelector('.kpi-foot'));
    assert(contrast(parse(fuelTitleDark.color),rgb('#101e2f'))>=7,'FuelTrack+ Dark Mode primary text remains strongly readable');
    assert(contrast(parse(fuelMutedDark.color),rgb('#101e2f'))>=4.5,'FuelTrack+ Dark Mode tertiary text remains readable');

    const tradeMarkup='<header class="topbar"><a class="brand-lockup"><span class="brand-copy"><strong>TradeLink</strong><small>PORTAL</small></span></a><nav class="nav-tabs"><button>All Documents</button><button class="active">Create New</button></nav><div class="vendor-pill"><span class="vendor-pill-name">Watchdog</span></div></header><section class="create-commandbar"><div class="document-heading"><div class="document-icon">□</div><div><h1>Quotations</h1><small>Draft autosave enabled</small></div></div></section><label class="field"><span>Client</span><input placeholder="Search saved clients by name..."></label><input id="disabledTrade" value="Q-[Will be assigned on save]" disabled>';
    mount('tradelink',globalThis.__wmThemeCss.tradeLink,tradeMarkup);
    const tradeStyles=[['brand',getComputedStyle(document.querySelector('.brand-copy strong'))],['navigation',getComputedStyle(document.querySelector('.nav-tabs button:not(.active)'))],['document heading',getComputedStyle(document.querySelector('.document-heading h1'))],['document status',getComputedStyle(document.querySelector('.document-heading small'))],['placeholder',getComputedStyle(document.querySelector('.field input'),'::placeholder')],['disabled field',getComputedStyle(document.querySelector('#disabledTrade'))]];
    for(const [name,style] of tradeStyles) assert(contrast(parse(style.color),rgb('#ffffff'))>=4.5,'TradeLink '+name+' text is readable on light surfaces');
  });

  return {status:'pass',text:'PASS\\n'+logs.join('\\n')};
})().catch((error)=>({status:'fail',text:'FAIL\\n'+(error?.stack||error?.message||String(error))}));`;

const result = await evaluate(testProgram, { awaitPromise: true });
console.log(result?.text || 'Browser integration test returned no result.');
if (result?.status !== 'pass') {
  ws.close();
  process.exit(1);
}

// Final presentation-quality audit. This deliberately exercises responsive media
// queries, enlarged root text, viewport containment, focus ownership, theme
// switching, and the mobile shell navigation against the same CSS ordering used
// by the Vite entry. Focus-ring geometry itself is verified statically by the
// final UI verifier because Chromium CDP cannot reliably force :focus-visible.
await evaluate(`globalThis.__wmFinalPresentationCss=${JSON.stringify(finalPresentationCss)}; true;`);
const auditMarkup = String.raw`
  <div class="shell" data-workspace-shell data-shell-navigation-state="expanded" data-shell-navigation-pinned="true" data-shell-navigation-peek="false" style="--wm-shell-navigation-user-width:256px">
    <button class="shell-mobile-navigation-trigger" data-shell-navigation-mobile-toggle aria-label="Open navigation">☰</button>
    <button class="shell-sidebar-backdrop" data-shell-navigation-dismiss tabindex="-1" aria-hidden="true"></button>
    <aside class="sidebar" id="primarySidebar" aria-label="Primary navigation">
      <div class="shell-sidebar-header">
        <button class="brand"><span class="brand-mark"><i></i><i></i><i></i><i></i></span><span class="brand-copy"><strong>Work Management</strong><small>Operations</small></span></button>
        <div class="shell-sidebar-header-actions"><button class="shell-sidebar-pin" data-shell-navigation-pin aria-label="Unpin navigation" data-shell-tooltip="Unpin navigation" data-shell-tooltip-variant="action" aria-pressed="true">⌖</button><button class="shell-sidebar-collapse" data-shell-navigation-toggle aria-label="Collapse navigation" data-shell-tooltip="Collapse navigation" data-shell-tooltip-variant="action">‹</button></div>
      </div>
      <div class="shell-navigation-scroll"><nav aria-label="Main">
        <div class="shell-nav-primary" data-shell-primary-navigation>
          <button class="nav-item active" aria-current="page"><span class="shell-nav-icon">◻</span><b>Applications</b></button>
          <button class="nav-item"><span class="shell-nav-icon">▦</span><b>Boards</b></button>
          <button class="nav-item"><span class="shell-nav-icon">⌕</span><b>Search</b></button>
          <button class="nav-item"><span class="shell-nav-icon">⚙</span><b>Settings</b></button>
          <button class="nav-item"><span class="shell-nav-icon">◎</span><b>Account</b></button>
          <button class="nav-item"><span class="shell-nav-icon">♙</span><b>Users</b></button>
        </div>
        <div class="shell-resource-navigation" data-shell-resource-navigation>
          <label class="shell-resource-search" aria-label="Search navigation"><span>⌕</span><input type="search" data-shell-resource-search placeholder="Search apps and boards"><button type="button" class="shell-resource-search-clear" hidden>×</button></label>
          <section class="shell-nav-section is-expanded" data-shell-section="favorites"><div class="shell-nav-section-header"><button type="button" class="shell-nav-section-toggle" aria-expanded="true"><span>Favorites</span><small>1</small><span class="shell-nav-section-chevron">⌄</span></button></div><div class="shell-nav-section-body"><button class="shell-resource-item shell-application-resource"><span class="shell-resource-icon"><span class="module-mini-icon shell-application-icon orange">◷</span></span><span class="shell-resource-copy"><b>TimeTracker</b><small>Attendance & Workforce</small></span><span class="shell-resource-favorite">★</span></button></div></section>
          <section class="shell-nav-section is-expanded" data-shell-section="applications"><div class="shell-nav-section-header"><button type="button" class="shell-nav-section-toggle" aria-expanded="true"><span>Applications</span><small>3</small><span class="shell-nav-section-chevron">⌄</span></button></div><div class="shell-nav-section-body"><button id="shellAuditResource" class="shell-resource-item shell-application-resource active" aria-current="page"><span class="shell-resource-icon"><span class="module-mini-icon shell-application-icon orange">◷</span></span><span class="shell-resource-copy"><b>TimeTracker</b><small>Attendance & Workforce · Employee</small></span><span class="shell-resource-favorite">★</span></button><button class="shell-resource-item shell-application-resource"><span class="shell-resource-icon"><span class="module-mini-icon shell-application-icon blue">⛽</span></span><span class="shell-resource-copy"><b>FuelTrack+</b><small>Fuel Request Operations · User</small></span></button><button class="shell-resource-item shell-application-resource" disabled aria-disabled="true"><span class="shell-resource-icon"><span class="module-mini-icon shell-application-icon teal">▤</span></span><span class="shell-resource-copy"><b>TradeLink</b><small>Commercial Documents · Restricted</small></span></button></div></section>
          <section class="shell-nav-section is-expanded" data-shell-section="boards"><div class="shell-nav-section-header"><button type="button" class="shell-nav-section-toggle" aria-expanded="true"><span>Boards</span><small>2</small><span class="shell-nav-section-chevron">⌄</span></button></div><div class="shell-nav-section-body"><button id="shellAuditBoardResource" class="shell-resource-item shell-board-resource"><span class="shell-resource-icon">▦</span><span class="shell-resource-copy"><b>Operations board</b><small>12 items</small></span></button><button class="shell-resource-item shell-board-resource"><span class="shell-resource-icon">▦</span><span class="shell-resource-copy"><b>Weekly planning</b><small>8 items</small></span></button></div></section>
          <div class="shell-resource-filter-empty" hidden><strong>No navigation matches</strong><small>Try another app or board name.</small></div>
        </div>
      </nav></div>
      <div class="sidebar-foot"><span class="health-dot"></span><div><strong>Platform ready</strong><small>v1.43.2 · Cloud connected</small></div></div>
      <button type="button" class="shell-sidebar-resizer" data-shell-resizer role="separator" aria-label="Resize navigation" aria-orientation="vertical" aria-valuemin="224" aria-valuemax="360" aria-valuenow="256"></button>
      <span class="wm-visually-hidden shell-navigation-status" aria-live="polite"></span>
    </aside>
    <section class="workspace">
      <header class="topbar"><div><span class="top-eyebrow">WORK MANAGEMENT</span><h1>Responsive presentation audit with intentionally long heading text</h1><p>Long supporting copy verifies text scaling without relying on a fixed header height.</p></div><div class="top-actions"><button class="wm-button wm-button--secondary">Secondary action</button><button class="wm-button wm-button--primary">Primary action with a deliberately longer label</button></div></header>
      <main class="page">
        <section class="board-list-toolbar"><div class="wm-toolbar" data-wrap="true"><label class="wm-field" style="flex:1 1 260px"><span class="wm-field-label">Search boards and operational records</span><input class="wm-field-control" value="Expanded text scaling audit"></label><button id="longAuditButton" class="wm-button wm-button--primary">Create a new operational work board</button></div></section>
        <section class="board-controls"><div class="board-controls-query"><div class="wm-search"><input class="wm-field-control" value="Search"></div></div><div class="wm-action-row"><button class="wm-button wm-button--secondary">Filter</button><button class="wm-button wm-button--secondary">Add group</button></div></section>
        <div class="wm-data-region" style="margin-top:16px"><table class="wm-table" style="min-width:760px"><thead><tr><th>Item</th><th>Status</th><th>Owner</th><th>Due date</th></tr></thead><tbody><tr><td>Long operational item remains navigable inside its own horizontal scroll region</td><td>In progress</td><td>Operations team</td><td>2026-08-31</td></tr></tbody></table></div>
      </main>
    </section>
  </div>
  <div id="auditMenu" class="wm-menu" style="position:fixed;right:4px;top:4px"><button role="menuitem">A menu action with an intentionally long accessible label that must remain inside the viewport</button></div>
  <section id="auditDialog" class="wm-dialog" style="position:fixed;left:6px;bottom:6px"><header class="wm-dialog-header"><strong>Dialog title that can wrap safely</strong><button class="wm-icon-button" aria-label="Close">×</button></header><div class="wm-dialog-body"><p>${'Scrollable dialog content. '.repeat(80)}</p><label class="wm-field"><span class="wm-field-label">Long form label for text scaling</span><input class="wm-field-control" value="Value"></label></div><footer class="wm-dialog-footer"><button class="wm-button wm-button--secondary">Cancel</button><button id="auditFocus" class="wm-button wm-button--primary">Save changes</button></footer></section>
`;

async function runPresentationViewportAudit({ width, height, rootFontSize = '16px', touch = false, theme = 'light', name }) {
  await call('Emulation.setDeviceMetricsOverride', {
    width,
    height,
    deviceScaleFactor: 1,
    mobile: false,
    screenWidth: width,
    screenHeight: height,
  });
  await call('Emulation.setTouchEmulationEnabled', { enabled: touch, maxTouchPoints: touch ? 5 : 1 });
  const outcome = await evaluate(`(()=>{
    document.querySelectorAll('style[data-final-presentation-audit]').forEach((node)=>node.remove());
    const style=document.createElement('style');style.dataset.finalPresentationAudit='1';style.textContent=globalThis.__wmFinalPresentationCss;document.head.appendChild(style);
    document.documentElement.dataset.theme=${JSON.stringify(theme)};document.documentElement.style.fontSize=${JSON.stringify(rootFontSize)};
    document.body.dataset.wmSurface='shell';document.body.innerHTML=${JSON.stringify(auditMarkup)};
    const shell=document.querySelector('.shell');if(innerWidth<=620)shell.setAttribute('data-shell-mobile-open','true');
    const checks=[];const assert=(ok,message)=>{if(!ok)throw new Error(message);checks.push(message);};
    const layoutWidth=document.documentElement.clientWidth;
    const viewportWidth=innerWidth;
    assert(document.documentElement.scrollWidth<=layoutWidth+1,'document has no unintended horizontal overflow');
    const menu=document.querySelector('#auditMenu').getBoundingClientRect();
    assert(menu.left>=-1&&menu.right<=viewportWidth+1,'menu remains inside the viewport');
    const dialog=document.querySelector('#auditDialog').getBoundingClientRect();
    assert(dialog.left>=-1&&dialog.right<=viewportWidth+1,'dialog remains horizontally contained');
    assert(dialog.height<=innerHeight-10,'dialog remains vertically usable');
    const button=document.querySelector('#longAuditButton');
    assert(button.getBoundingClientRect().right<=viewportWidth+1,'long action label does not escape the viewport');
    const dataRegion=document.querySelector('.wm-data-region');
    assert(dataRegion.scrollWidth>=dataRegion.clientWidth,'wide table remains contained in its intended scroll region');
    const sidebar=document.querySelector('.sidebar');const sidebarStyle=getComputedStyle(sidebar);const activeNav=document.querySelector('.nav-item.active');
    const shellResource=document.querySelector('#shellAuditResource');const shellSearch=document.querySelector('.shell-resource-search');const favoritesSection=document.querySelector('[data-shell-section="favorites"]');const applicationsSection=document.querySelector('[data-shell-section="applications"]');const boardsSection=document.querySelector('[data-shell-section="boards"]');
    if(innerWidth>900){
      assert(Math.abs(sidebar.getBoundingClientRect().width-256)<=1,'Shell navigation foundation uses the semantic 256px desktop width: '+sidebar.getBoundingClientRect().width+' / '+sidebarStyle.width);
      assert(shellSearch.getBoundingClientRect().height>=34,'Shell M3 resource search uses the semantic compact search height');
      assert(shellResource.getBoundingClientRect().height>=40,'Shell M3 application resources use the semantic 40px desktop row');
      assert(document.querySelector('.shell-nav-section-toggle').getBoundingClientRect().height>=32,'Shell M3 section headers use the semantic section header height');
      assert(shellResource.getAttribute('aria-current')==='page','Shell M3 resource navigation exposes current application semantics');
      const shellPin=document.querySelector('[data-shell-navigation-pin]');const shellResizer=document.querySelector('[data-shell-resizer]');
      assert(getComputedStyle(shellPin).display!=='none'&&shellPin.getBoundingClientRect().width>=28,'Shell M4 exposes a dedicated desktop pin control');
      assert(getComputedStyle(shellResizer).display!=='none'&&shellResizer.getBoundingClientRect().width>=10,'Shell M4 exposes the semantic desktop resize hit area');
      // Shell M8 removed the historical global transition:none guard, so this geometry
      // audit disables only the fixture's width animation while validating each final state.
      sidebar.style.transition='none';document.querySelector('.workspace').style.transition='none';
      assert(getComputedStyle(sidebar).position==='fixed','Shell M8 authoritative navigation owns fixed desktop sidebar positioning');
      assert(Math.abs(parseFloat(getComputedStyle(document.querySelector('.brand-mark')).width)-40)<=1,'Shell M8 semantic brand mark retains the 40px foundation geometry');
      const navStatus=document.querySelector('.shell-navigation-status'),navStatusRect=navStatus.getBoundingClientRect();
      assert(navStatusRect.width<=1&&navStatusRect.height<=1,'Shell navigation status remains assistive-only and does not become persistent visible sidebar copy');
      shell.style.setProperty('--wm-shell-navigation-user-width','320px');void sidebar.offsetWidth;
      assert(Math.abs(sidebar.getBoundingClientRect().width-320)<=1,'Shell M4 custom width updates the expanded sidebar');
      assert(Math.abs(document.querySelector('.workspace').getBoundingClientRect().left-320)<=1,'Shell M4 pinned custom width keeps workspace offset synchronized');
      const collapseControl=document.querySelector('[data-shell-navigation-toggle]');
      const sidebarHeader=document.querySelector('.shell-sidebar-header');
      const firstPrimaryNav=document.querySelector('.shell-nav-primary .nav-item');
      const collapseAnchor=collapseControl.getBoundingClientRect();
      const headerAnchor=sidebarHeader.getBoundingClientRect();
      const expandedSidebarRect=sidebar.getBoundingClientRect();
      const collapseCenter=(rect)=>({x:rect.left+rect.width/2,y:rect.top+rect.height/2});
      const expandedCollapseCenter=collapseCenter(collapseAnchor);
      assert(Math.abs(expandedCollapseCenter.x-expandedSidebarRect.right)<=2,'Shell collapse control is structurally attached to the visible expanded sidebar edge');
      assert(Math.abs(expandedCollapseCenter.y-(headerAnchor.top+headerAnchor.height/2))<=2,'Shell collapse control is vertically centered in the sidebar header');
      assert(collapseAnchor.bottom<=firstPrimaryNav.getBoundingClientRect().top,'Shell collapse control stays in the header and never drops into primary navigation');
      shell.setAttribute('data-shell-navigation-pinned','false');shell.setAttribute('data-shell-navigation-state','compact');shell.setAttribute('data-shell-navigation-peek','true');void sidebar.offsetWidth;
      const collapsePreviewAnchor=collapseControl.getBoundingClientRect();
      const previewSidebarRect=sidebar.getBoundingClientRect();
      const previewCollapseCenter=collapseCenter(collapsePreviewAnchor);
      assert(Math.abs(collapsePreviewAnchor.top-collapseAnchor.top)<=1,'Shell collapse control keeps its vertical header coordinate when unpinned preview opens');
      assert(Math.abs(previewCollapseCenter.x-previewSidebarRect.right)<=2,'Shell collapse control follows the visible preview sidebar edge instead of a stale saved-width viewport anchor');
      assert(Math.abs(sidebar.getBoundingClientRect().width-320)<=1,'Shell M4 unpinned preview restores the saved expanded width');
      assert(Math.abs(document.querySelector('.workspace').getBoundingClientRect().left-60)<=1,'Shell M4 unpinned preview overlays content without shifting the compact workspace footprint');
      assert(getComputedStyle(shellSearch).display==='grid','Shell M4 unpinned preview restores expanded navigation content');
      shell.setAttribute('data-shell-navigation-peek','false');void sidebar.offsetWidth;
      const collapseCompactAnchor=collapseControl.getBoundingClientRect();
      const compactSidebarRect=sidebar.getBoundingClientRect();
      const compactCollapseCenter=collapseCenter(collapseCompactAnchor);
      assert(Math.abs(collapseCompactAnchor.top-collapseAnchor.top)<=1,'Shell collapse control remains at the same vertical header coordinate in compact mode');
      assert(Math.abs(compactCollapseCenter.x-compactSidebarRect.right)<=2,'Shell expand control stays attached to the compact rail edge instead of floating over workspace content');
      assert(collapseCompactAnchor.bottom<=firstPrimaryNav.getBoundingClientRect().top,'Shell expand control remains in the header after navigation collapses');
      assert(Math.abs(sidebar.getBoundingClientRect().width-60)<=1,'Shell M4 unpinned navigation collapses back to the compact rail');
      shell.setAttribute('data-shell-navigation-pinned','true');shell.style.setProperty('--wm-shell-navigation-user-width','256px');
      shell.setAttribute('data-shell-navigation-state','compact');
      assert(Math.abs(sidebar.getBoundingClientRect().width-60)<=1,'Shell M2 explicit compact state uses the semantic 60px width');
      assert(Math.abs(document.querySelector('.workspace').getBoundingClientRect().left-60)<=1,'Shell M2 compact state keeps workspace offset synchronized');
      assert(getComputedStyle(shellSearch).display==='none','Shell M3 compact rail hides resource search instead of crushing it');
      assert(getComputedStyle(favoritesSection).display==='none'&&getComputedStyle(boardsSection).display==='none','Shell M3 compact rail removes duplicate Favorites and Board resource sections');
      assert(getComputedStyle(applicationsSection).display!=='none'&&getComputedStyle(shellResource).display!=='none','Shell M3 compact rail retains direct application resources');
      assert(getComputedStyle(shellResource.querySelector('.shell-resource-copy')).display==='none','Shell M3 compact application resources become icon-first');
      shell.setAttribute('data-shell-navigation-state','expanded');
    }
    if(innerWidth>620&&innerWidth<=900){
      assert(Math.abs(sidebar.getBoundingClientRect().width-60)<=1,'Shell navigation foundation uses the semantic 60px compact width: '+sidebar.getBoundingClientRect().width+' / '+sidebarStyle.width);
      assert(getComputedStyle(shellSearch).display==='none','Shell M3 tablet rail hides resource search');
      assert(getComputedStyle(applicationsSection).display!=='none'&&getComputedStyle(shellResource).display!=='none','Shell M3 tablet rail keeps application launchers available');
    }
    assert(parseFloat(getComputedStyle(activeNav).minHeight)>=36,'Shell navigation foundation keeps desktop navigation rows at least 36px');
    assert(sidebarStyle.backgroundColor!=='rgba(0, 0, 0, 0)','Shell navigation foundation provides an explicit semantic navigation surface');
    const boardControls=getComputedStyle(document.querySelector('.board-controls'));
    if(innerWidth<=1120) assert(boardControls.position!=='sticky','Board toolbar stops sticking before compact/zoom layouts can overlap content');
    if(innerWidth<=620){
      const nav=document.querySelector('.sidebar nav');
      const workspace=document.querySelector('.workspace').getBoundingClientRect();
      const drawer=sidebar.getBoundingClientRect();
      const trigger=document.querySelector('.shell-mobile-navigation-trigger').getBoundingClientRect();
      const backdropStyle=getComputedStyle(document.querySelector('.shell-sidebar-backdrop'));
      assert(getComputedStyle(nav).flexDirection==='column','Shell M2 mobile navigation uses a vertical drawer');
      assert(getComputedStyle(sidebar).position==='fixed'&&Math.abs(workspace.left)<=1,'Shell M8 mobile integration keeps the drawer off-canvas without legacy bottom-rail workspace offsets');
      assert(drawer.left>=-1&&drawer.right<=viewportWidth+1&&drawer.width<=305,'Shell M2 mobile drawer stays within the viewport');
      assert(Math.abs(workspace.width-layoutWidth)<=1&&Math.abs(workspace.left)<=1,'Shell M2 host workspace stays full width on mobile');
      assert(trigger.width>=44&&trigger.height>=44,'Shell M2 mobile trigger is at least 44px');
      assert(backdropStyle.display==='block'&&backdropStyle.pointerEvents!=='none','Shell M2 mobile drawer exposes a dismissible backdrop while open');
      assert(getComputedStyle(shellSearch).display==='grid'&&shellSearch.getBoundingClientRect().height>=44,'Shell M3 mobile drawer restores searchable resource navigation with a touch-safe field');
      assert(getComputedStyle(favoritesSection).display!=='none'&&getComputedStyle(boardsSection).display!=='none','Shell M3 mobile drawer restores Favorites and Board resource sections');
      assert(shellResource.getBoundingClientRect().height>=44,'Shell M3 mobile resource rows remain touch-safe');
      sidebar.style.transition='none';
      shell.removeAttribute('data-shell-mobile-open');void sidebar.offsetWidth;
      const closedDrawer=sidebar.getBoundingClientRect();
      assert(closedDrawer.right<=1&&getComputedStyle(sidebar).visibility==='hidden','Shell M2 mobile drawer is fully off-canvas and hidden when closed: '+JSON.stringify({left:closedDrawer.left,right:closedDrawer.right,width:closedDrawer.width,visibility:getComputedStyle(sidebar).visibility,transform:getComputedStyle(sidebar).transform}));
      shell.setAttribute('data-shell-mobile-open','true');sidebar.style.removeProperty('transition');
    }
    const focus=document.querySelector('#auditFocus');
    focus.focus();
    assert(document.activeElement===focus,'programmatic focus ownership remains stable for the primary dialog action');
    if(matchMedia('(pointer:coarse)').matches){
      assert(focus.getBoundingClientRect().height>=44,'coarse-pointer button target is at least 44px tall');
      { const field=document.querySelector('.wm-field-control'); const rect=field.getBoundingClientRect(); const style=getComputedStyle(field); assert(rect.height>=44,'coarse-pointer field target is at least 44px tall: '+JSON.stringify({height:rect.height,minHeight:style.minHeight,heightStyle:style.height,pointer:matchMedia('(pointer:coarse)').matches})); }
      assert(activeNav.getBoundingClientRect().height>=44,'Shell navigation coarse-pointer row target is at least 44px tall');
    }
    return {name:${JSON.stringify(name)},theme:${JSON.stringify(theme)},checks};
  })()`);
  console.log(`PASS final presentation viewport audit: ${name} / ${theme} (${width}x${height}, root ${rootFontSize})`);
  return outcome;
}

const finalPresentationScenarios = [
  { name:'wide desktop', width:1600, height:1000 },
  { name:'standard desktop', width:1366, height:820 },
  { name:'laptop', width:1120, height:760 },
  { name:'tablet', width:820, height:980 },
  { name:'narrow viewport', width:390, height:844 },
  { name:'200% zoom equivalent', width:720, height:650 },
  { name:'enlarged text scaling', width:820, height:980, rootFontSize:'20px' },
  { name:'coarse pointer narrow viewport', width:390, height:844, touch:true },
];
for (const scenario of finalPresentationScenarios) {
  for (const theme of ['light','dark']) {
    await runPresentationViewportAudit({ ...scenario, theme });
  }
}

const shellAccountMenuAuditMarkup = String.raw`
  <button class="wm-button wm-button--secondary account-pill" data-account-menu-trigger aria-expanded="true"><span class="avatar mini">AM</span><span><b>Alex Morgan</b><small>Admin/General Manager</small></span></button>
  <div id="shellAccountAuditMenu" class="wm-shell-floating-surface wm-shell-menu-surface shell-account-menu shell-account-profile-menu" role="menu">
    <div class="shell-account-menu-header"><span class="shell-account-menu-avatar">AM</span><span class="shell-account-menu-identity"><strong>Alex Morgan</strong><small>alex@example.com</small><span>Admin/General Manager</span></span><span class="shell-account-status is-active">Active</span></div>
    <div class="shell-account-menu-section"><span class="shell-account-menu-section-title">Account</span><button class="shell-account-menu-item" role="menuitem"><span class="shell-account-menu-icon">◎</span><span class="shell-account-menu-item-copy"><strong>My profile &amp; security</strong><small>Profile, password, sessions and access</small></span></button></div>
    <div class="shell-account-menu-section"><span class="shell-account-menu-section-title">Work Management</span><button class="shell-account-menu-item" role="menuitem"><span class="shell-account-menu-icon">♙</span><span class="shell-account-menu-item-copy"><strong>User management</strong><small>Roles, access and account status</small></span></button><button class="shell-account-menu-item" role="menuitem"><span class="shell-account-menu-icon">⚙</span><span class="shell-account-menu-item-copy"><strong>Platform settings</strong><small>Appearance, storage and diagnostics</small></span></button></div>
    <div class="shell-account-menu-section"><span class="shell-account-menu-section-title">Preferences</span><button class="shell-account-menu-item" role="menuitem"><span class="shell-account-menu-icon">◐</span><span class="shell-account-menu-item-copy"><strong>Appearance</strong><small>Current: system</small></span><span class="shell-account-menu-chevron">›</span></button></div>
    <div class="shell-account-menu-section shell-account-menu-session"><button class="shell-account-menu-item" role="menuitem"><span class="shell-account-menu-icon">↪</span><span class="shell-account-menu-item-copy"><strong>Sign out</strong><small>End this browser session</small></span></button></div>
  </div>`;

async function runShellAccountMenuAudit({ width, height, theme, touch = false, name }) {
  await call('Emulation.setTouchEmulationEnabled', { enabled:touch, maxTouchPoints:touch ? 5 : 1 });
  await call('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor:1, mobile:false, screenWidth:width, screenHeight:height });
  await evaluate(`(()=>{document.querySelectorAll('style[data-final-presentation-audit]').forEach((node)=>node.remove());const style=document.createElement('style');style.dataset.finalPresentationAudit='1';style.textContent=globalThis.__wmFinalPresentationCss+'\\n.shell-account-menu{animation:none!important;left:12px;top:64px}';document.head.appendChild(style);document.documentElement.dataset.theme=${JSON.stringify(theme)};document.body.dataset.wmSurface='shell';document.body.innerHTML=${JSON.stringify(shellAccountMenuAuditMarkup)};const assert=(ok,message)=>{if(!ok)throw new Error(message);};const trigger=document.querySelector('[data-account-menu-trigger]'),menu=document.querySelector('#shellAccountAuditMenu'),header=document.querySelector('.shell-account-menu-header'),item=document.querySelector('.shell-account-menu-item'),avatar=document.querySelector('.shell-account-menu-avatar');assert(trigger.getBoundingClientRect().height>=40,'Shell M5 account launcher uses semantic trigger geometry');assert(menu.getBoundingClientRect().width<=340&&menu.getBoundingClientRect().right<=innerWidth-1,'Shell M5 account menu remains viewport-contained at its semantic width');assert(header.getBoundingClientRect().height>=58,'Shell M5 account identity header preserves readable hierarchy');assert(avatar.getBoundingClientRect().width>=40&&avatar.getBoundingClientRect().width<=44,'Shell M5 profile avatar uses semantic identity geometry');assert(item.getBoundingClientRect().height>=(${touch}?48:42),'Shell M5 account actions meet pointer-appropriate row targets');assert(getComputedStyle(menu).boxShadow!=='none','Shell M5 account menu uses elevated host-shell presentation');assert(getComputedStyle(menu).backgroundColor!=='rgba(0, 0, 0, 0)','Shell M5 account menu has an explicit themed surface');assert(menu.classList.contains('wm-shell-floating-surface')&&menu.classList.contains('wm-shell-menu-surface'),'Shell M6 account menu uses the shared host overlay surface');assert(getComputedStyle(menu).borderRadius===getComputedStyle(document.documentElement).getPropertyValue('--wm-shell-overlay-radius').trim()||parseFloat(getComputedStyle(menu).borderRadius)>=8,'Shell M6 shared overlay radius is applied to account menus');assert(document.documentElement.scrollWidth<=document.documentElement.clientWidth+1,'Shell M5 account menu does not create document overflow');return true;})()`);
  console.log(`PASS Shell M5 account/profile menu audit: ${name} / ${theme}`);
}
for (const scenario of [
  {name:'desktop',width:1440,height:900},
  {name:'tablet',width:820,height:980},
  {name:'mobile',width:390,height:844},
  {name:'coarse pointer mobile',width:390,height:844,touch:true},
]) for (const theme of ['light','dark']) await runShellAccountMenuAudit({...scenario,theme});

const shellM7AuditMarkup = String.raw`
  <div class="shell" data-workspace-shell data-shell-navigation-state="compact" data-shell-navigation-pinned="true" data-shell-navigation-peek="false">
    <a id="shellM7Skip" class="shell-skip-link" data-shell-skip href="#main">Skip to main content</a>
    <button class="shell-mobile-navigation-trigger" type="button" aria-haspopup="dialog" aria-expanded="false">☰</button>
    <aside class="sidebar" aria-label="Primary navigation"><nav aria-label="Main"><button class="nav-item active" aria-current="page"><span class="shell-nav-icon">⌂</span><b>Applications</b></button></nav></aside>
    <section class="workspace"><header class="topbar"><div><span class="top-eyebrow">WORK MANAGEMENT</span><h1>A very long workspace heading that remains readable</h1><p>Responsive supporting copy.</p></div><div class="top-actions"><button class="mobile-command icon-btn">⌕</button><button class="account-pill" data-account-menu-trigger><span class="avatar mini">AM</span><span><b>Alex Morgan</b><small>Admin</small></span></button></div></header><main id="main" class="page" tabindex="-1"><h2>Main content</h2><button>Primary action</button></main></section>
  </div>`;

async function runShellM7Audit({width,height,theme,touch=false,rootFontSize='16px',name}) {
  await call('Emulation.setFocusEmulationEnabled',{enabled:true});
  await call('Emulation.setTouchEmulationEnabled',{enabled:touch,maxTouchPoints:touch?5:1});
  await call('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile:false,screenWidth:width,screenHeight:height});
  await evaluate(`(()=>{document.querySelectorAll('style[data-final-presentation-audit]').forEach((node)=>node.remove());const style=document.createElement('style');style.dataset.finalPresentationAudit='1';style.textContent=globalThis.__wmFinalPresentationCss;document.head.appendChild(style);document.documentElement.dataset.theme=${JSON.stringify(theme)};document.documentElement.style.fontSize=${JSON.stringify(rootFontSize)};document.body.dataset.wmSurface='shell';document.body.innerHTML=${JSON.stringify(shellM7AuditMarkup)};const assert=(ok,message)=>{if(!ok)throw new Error(message);};const skip=document.querySelector('#shellM7Skip'),main=document.querySelector('#main'),topbar=document.querySelector('.topbar'),account=document.querySelector('[data-account-menu-trigger]');assert(document.documentElement.scrollWidth<=document.documentElement.clientWidth+1,'Shell M7 minimum-width host chrome remains contained');assert(topbar.getBoundingClientRect().right<=innerWidth+1,'Shell M7 responsive and accessibility finalization keeps topbar inside viewport');assert(skip.getBoundingClientRect().width<=2,'Shell M7 skip link remains visually hidden until keyboard focus');skip.focus();const skipStyle=getComputedStyle(skip);assert(document.activeElement===skip&&skipStyle.clipPath==='none'&&parseFloat(skipStyle.minHeight)>=44,'Shell M7 skip link remains keyboard visible: '+JSON.stringify({active:document.activeElement===skip,clipPath:skipStyle.clipPath,minHeight:skipStyle.minHeight,display:skipStyle.display,width:skipStyle.width,height:skipStyle.height}));main.focus();assert(document.activeElement===main,'Shell M7 main route target accepts programmatic focus');if(${touch})assert(account.getBoundingClientRect().height>=44&&account.getBoundingClientRect().width>=44,'Shell M7 account launcher meets coarse-pointer target');return true;})()`);
  console.log(`PASS Shell M7 responsive/accessibility audit: ${name} / ${theme}`);
}
for (const scenario of [
  {name:'minimum width',width:320,height:700},
  {name:'narrow mobile',width:390,height:844},
  {name:'zoom equivalent',width:720,height:650},
  {name:'enlarged text',width:820,height:980,rootFontSize:'20px'},
  {name:'coarse pointer',width:390,height:844,touch:true},
]) for (const theme of ['light','dark']) await runShellM7Audit({...scenario,theme});

const boardPresentationMarkup = String.raw`
  <main class="page board-detail-page">
    <div class="board-workspace-shell">
      <section id="boardAuditHeader" class="board-detail-head monday-board-head" data-board-header aria-labelledby="board-workspace-title">
        <nav class="board-breadcrumb" aria-label="Board breadcrumb"><button class="wm-button wm-button--ghost wm-control--sm board-back">← <span>Boards</span></button><span class="board-breadcrumb-separator">/</span><span class="board-breadcrumb-current" aria-current="page">Operations board with an intentionally long breadcrumb name</span></nav>
        <div class="board-header-main"><div class="board-title-copy"><div class="board-title-line"><h2 id="board-workspace-title">Operations board with a deliberately long title that remains contained</h2><span class="board-role-badge">Owner</span></div><button id="boardAuditDescription" class="board-description-control" type="button"><span class="board-description-text">Operational work, ownership and delivery context remain readable at every supported viewport without creating oversized header chrome.</span><svg class="board-description-edit-icon" viewBox="0 0 24 24"><path d="m4 16-.75 4.25L7.5 19.5 18.7 8.3a2.12 2.12 0 0 0-3-3L4 16Z"/></svg></button></div><div class="wm-toolbar board-head-actions"><button id="boardAuditMembers" class="wm-button wm-button--ghost wm-control--sm secondary-btn board-head-action"><span>Members</span></button><button id="boardAuditActivity" class="wm-button wm-button--ghost wm-control--sm secondary-btn board-head-action"><span>Activity</span></button><span class="board-head-action-divider"></span><span class="board-head-menu-host"><button id="boardAuditMore" class="wm-icon-button wm-icon-button--ghost wm-control--sm secondary-btn board-more-trigger"><svg class="board-more-icon" viewBox="0 0 24 24"><circle cx="5" cy="12" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="19" cy="12" r="1.5"/></svg></button></span></div></div>
      </section>
      <div class="monday-board-control-stack" data-board-command-stack>
        <nav class="board-view-bar" aria-label="Board views"><div class="board-view-tabs view-switch" role="tablist" aria-label="Board view"><button id="boardAuditTableTab" type="button" role="tab" data-board-view="table" class="board-view-tab active" aria-selected="true" aria-controls="boardViewRegion" tabindex="0"><svg class="board-command-icon" viewBox="0 0 24 24"><path d="M4 5.5h16v13H4z"/><path d="M4 10h16M9 5.5v13"/></svg><span>Main table</span></button><button type="button" role="tab" data-board-view="kanban" class="board-view-tab" aria-selected="false" aria-controls="boardViewRegion" tabindex="-1"><svg class="board-command-icon" viewBox="0 0 24 24"><rect x="3.5" y="4" width="5" height="16" rx="1.5"/><rect x="9.5" y="4" width="5" height="11" rx="1.5"/></svg><span>Kanban</span></button></div><div id="boardAuditViewSummary" class="board-view-state-summary"><span>2 active filters</span><span>Sorted by Due date</span></div></nav>
        <section class="wm-toolbar board-controls board-controls-rich monday-board-toolbar"><div class="board-controls-primary"><span class="board-new-item-split"><button id="boardAuditNewItem" class="primary-btn board-new-item"><svg class="board-command-icon" viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg><span>New item</span></button><button id="boardAuditNewItemMenu" class="primary-btn board-new-item board-new-item-menu"><svg class="board-command-chevron" viewBox="0 0 16 16"><path d="m4 6 4 4 4-4"/></svg></button></span></div><div class="board-controls-query" data-board-command-rail><div id="boardAuditSearch" class="wm-search board-search board-command-search compact is-active" role="search"><svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="6"/></svg><input class="wm-field-control" value="delivery"><button class="board-search-clear"><svg viewBox="0 0 16 16"><path d="m4.5 4.5 7 7m0-7-7 7"/></svg></button></div><label id="boardAuditStatus" class="wm-field board-filter board-command-select board-tool-status is-active"><span class="wm-field-label">Status filter</span><svg class="board-command-icon" viewBox="0 0 24 24"><circle cx="12" cy="12" r="7"/></svg><select class="wm-field-control"><option>Working on it</option></select></label><button id="boardAuditPeople" class="secondary-btn board-command-button board-tool board-tool-people is-active"><svg class="board-command-icon" viewBox="0 0 24 24"><circle cx="9" cy="8" r="3"/></svg><span class="board-command-label">Owner</span><span class="board-tool-badge">1</span></button><button id="boardAuditFilter" class="secondary-btn board-command-button board-tool board-tool-filter is-active"><svg class="board-command-icon" viewBox="0 0 24 24"><path d="M4 6h16l-6.3 7.1v4.8L10.5 20v-6.9z"/></svg><span class="board-command-label">Filter</span><span class="board-tool-badge">2</span></button><button id="boardAuditSort" class="secondary-btn board-command-button board-tool board-tool-sort is-active"><svg class="board-command-icon" viewBox="0 0 24 24"><path d="M8 5v14M5 8l3-3 3 3M16 19V5"/></svg><span class="board-command-label">Sort</span><span class="board-tool-badge">1</span><svg class="board-command-chevron" viewBox="0 0 16 16"><path d="m4 6 4 4 4-4"/></svg></button><button id="boardAuditColumns" class="secondary-btn board-command-button board-columns-shortcut board-tool board-tool-columns"><svg class="board-command-icon" viewBox="0 0 24 24"><rect x="4" y="5" width="16" height="14" rx="1.5"/></svg><span class="board-command-label">Columns</span></button></div><div class="board-controls-secondary"><div id="boardAuditHistory" class="board-history-controls"><button class="icon-btn board-history-button"><svg class="board-command-icon" viewBox="0 0 24 24"><path d="M9 8H4v-5"/></svg></button><button class="icon-btn board-history-button" disabled><svg class="board-command-icon" viewBox="0 0 24 24"><path d="M15 8h5v-5"/></svg></button></div><button id="boardAuditToolbarMore" class="secondary-btn board-command-button board-view-options board-tool-more"><svg class="board-command-icon board-command-more-icon" viewBox="0 0 24 24"><circle cx="5" cy="12" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="19" cy="12" r="1.5"/></svg><span class="board-command-label board-more-label">More</span><svg class="board-command-chevron" viewBox="0 0 16 16"><path d="m4 6 4 4 4-4"/></svg></button></div></section>
      </div>
      <section class="board-view-region"><div class="board-table-view board-sheet-view"><section class="board-group board-sheet-group" style="--group-accent:#579bfc"><header class="board-group-header board-sheet-group-header"><div class="board-group-identity"><span class="group-accent-rail"></span><span class="group-drag-handle">⋮⋮</span><button class="group-collapse">⌄</button><div class="group-heading-copy"><button class="group-title-inline"><span>Active work</span></button><small>2 items</small></div></div></header><div id="boardAuditScroller" class="board-table-scroll"><table class="board-data-table interactive-board-table board-sheet-table" style="min-width:1800px"><thead><tr><th class="selection-cell"></th><th class="drag-cell"></th><th class="board-item-name-head"><div class="identity-column-head"><span>Item</span><small>ITEM NAME</small></div></th><th><div class="column-header-button"><span>Status</span><small>STATUS</small></div></th><th class="actions-head"></th></tr></thead><tbody><tr class="board-item-row"><td class="selection-cell"><input type="checkbox"></td><td class="drag-cell"></td><td class="board-item-name-cell"><div class="board-item-name-shell"><button class="item-inline-title">Prepare monthly close</button></div></td><td class="board-data-cell" data-column-type="status"><button class="board-cell-button"><span class="status-pill configurable-status-pill" style="background:#00c875;color:#fff">Done</span></button></td><td class="item-actions"><button class="item-more-trigger">•••</button></td></tr></tbody></table></div></section></div></section>
    </div>
  </main>`;

async function runBoardPresentationAudit({ width, height, theme, name, touch = false }) {
  await call('Emulation.setTouchEmulationEnabled', { enabled:touch, maxTouchPoints:touch ? 5 : 1 });
  await call('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor:1, mobile:false, screenWidth:width, screenHeight:height });
  const outcome = await evaluate(`(()=>{
    document.querySelectorAll('style[data-final-presentation-audit]').forEach((node)=>node.remove());
    const style=document.createElement('style');style.dataset.finalPresentationAudit='1';style.textContent=globalThis.__wmFinalPresentationCss;document.head.appendChild(style);
    document.documentElement.dataset.theme=${JSON.stringify(theme)};document.documentElement.style.fontSize='16px';document.body.dataset.wmSurface='shell';document.body.innerHTML=${JSON.stringify(boardPresentationMarkup)};
    const assert=(ok,message)=>{if(!ok)throw new Error(message);};
    const header=document.querySelector('#boardAuditHeader');
    const headerMain=document.querySelector('.board-header-main');
    const title=document.querySelector('#board-workspace-title');
    const role=document.querySelector('.board-role-badge');
    const description=document.querySelector('#boardAuditDescription');
    const breadcrumbCurrent=document.querySelector('.board-breadcrumb-current');
    const members=document.querySelector('#boardAuditMembers');
    const activity=document.querySelector('#boardAuditActivity');
    const more=document.querySelector('#boardAuditMore');
    const control=document.querySelector('.monday-board-control-stack');
    const toolbar=document.querySelector('.monday-board-toolbar');
    const newItem=document.querySelector('#boardAuditNewItem');
    const newItemMenu=document.querySelector('#boardAuditNewItemMenu');
    const activeViewTab=document.querySelector('#boardAuditTableTab');
    const viewSummary=document.querySelector('#boardAuditViewSummary');
    const search=document.querySelector('#boardAuditSearch');
    const statusCommand=document.querySelector('#boardAuditStatus');
    const peopleCommand=document.querySelector('#boardAuditPeople');
    const filterCommand=document.querySelector('#boardAuditFilter');
    const sortCommand=document.querySelector('#boardAuditSort');
    const columnsCommand=document.querySelector('#boardAuditColumns');
    const historyControls=document.querySelector('#boardAuditHistory');
    const toolbarMore=document.querySelector('#boardAuditToolbarMore');
    const group=document.querySelector('.board-sheet-group');
    const scroller=document.querySelector('#boardAuditScroller');
    const row=document.querySelector('.board-item-row td');
    const status=document.querySelector('.configurable-status-pill');
    assert(document.documentElement.scrollWidth<=document.documentElement.clientWidth+1,'Monday-style Board chrome introduces no document overflow');
    assert(document.documentElement.scrollWidth<=document.documentElement.clientWidth+1,'Board view/toolbar Milestone 3 audit: command surface has no horizontal document overflow');
    { const underline=getComputedStyle(activeViewTab,'::after'); assert(parseFloat(underline.height)>=3&&underline.backgroundColor!=='rgba(0, 0, 0, 0)','Board view/toolbar Milestone 3 audit: active view tab has semantic underline'); }
    { const expectedMin=${touch} ? 44 : 34; const expectedMax=${touch} ? 46 : 38; const heights=[newItem,newItemMenu,filterCommand,sortCommand,toolbarMore].map((node)=>node.getBoundingClientRect().height); assert(heights.every((value)=>value>=expectedMin&&value<=expectedMax),'Board view/toolbar Milestone 3 audit: primary toolbar controls share command geometry: '+JSON.stringify(heights)); }
    assert(search.querySelector('input')&&search.querySelector('svg'),'Board view/toolbar Milestone 3 audit: Search is one unified icon/input control');
    assert(getComputedStyle(header).backgroundColor===getComputedStyle(document.querySelector('.board-detail-page')).getPropertyValue('--board-surface').trim()||getComputedStyle(header).backgroundColor!=='rgba(0, 0, 0, 0)','Board shell/header Milestone 2 audit: header has a defined Board surface');
    assert(getComputedStyle(header).borderTopWidth==='1px','Board shell/header Milestone 2 audit: header uses restrained one-pixel framing');
    assert(parseFloat(getComputedStyle(header).borderTopLeftRadius)>=6,'Board shell/header Milestone 2 audit: header uses the shared surface radius');
    assert(parseFloat(getComputedStyle(title).fontSize)<=34.5,'Board shell/header Milestone 2 audit: title scale stays within the foundation maximum');
    assert(role.getBoundingClientRect().height<=26,'Board shell/header Milestone 2 audit: role badge remains compact');
    assert(description.getBoundingClientRect().height<=52,'Board shell/header Milestone 2 audit: editable description remains a compact secondary field');
    assert(breadcrumbCurrent.scrollWidth>=breadcrumbCurrent.clientWidth,'Board shell/header Milestone 2 audit: long breadcrumb is safely constrained');
    { const memberHeight=members.getBoundingClientRect().height,activityHeight=activity.getBoundingClientRect().height,moreRect=more.getBoundingClientRect(); assert(Math.abs(memberHeight-activityHeight)<=1&&memberHeight>=(${touch} ? 44 : 32)&&memberHeight<=(${touch} ? 46 : 36),'Board shell/header Milestone 2 audit: Members and Activity share compact action geometry'); assert(Math.abs(moreRect.width-moreRect.height)<=1&&moreRect.width>=(${touch} ? 44 : 32)&&moreRect.width<=(${touch} ? 46 : 36),'Board shell/header Milestone 2 audit: overflow action is a compact square target'); }
    assert(getComputedStyle(group).borderTopWidth==='0px','group hierarchy is carried by the grid instead of card framing');
    { const rowHeight=row.getBoundingClientRect().height; if(!${touch}) assert(rowHeight>=42&&rowHeight<=46,'Board spreadsheet row density follows the semantic 44px default (42-46px rendered): '+rowHeight); else assert(rowHeight>=44&&rowHeight<=58,'Coarse-pointer Board row remains usable without excessive expansion: '+rowHeight); }
    assert(Math.round(status.getBoundingClientRect().height)>=30,'configured Status remains a decisive full-cell target');
    assert(scroller.scrollWidth>scroller.clientWidth,'wide Board schema remains inside its dedicated horizontal scroller');
    if(${width} > 900){
      assert(getComputedStyle(headerMain).gridTemplateColumns.split(' ').length>=2,'Board shell/header Milestone 2 audit: desktop header keeps identity and actions in separate grid regions');
      { const headerHeight=header.getBoundingClientRect().height; assert(headerHeight<=132,'Board shell/header Milestone 2 audit: desktop header remains compact: '+headerHeight); }
      assert(members.getBoundingClientRect().left>title.getBoundingClientRect().left,'Board shell/header Milestone 2 audit: desktop action cluster stays to the right of board identity');
    } else {
      { const compactHeaderHeight=header.getBoundingClientRect().height; const compactLimit=${touch} ? 228 : 210; assert(compactHeaderHeight<=compactLimit,'Board shell/header Milestone 2 audit: compact header remains bounded when actions stack: '+compactHeaderHeight); }
      assert(members.getBoundingClientRect().top>=description.getBoundingClientRect().bottom-1,'Board shell/header Milestone 2 audit: compact action rail follows board identity without overlap');
    }
    if(${width} > 760){
      assert(getComputedStyle(control).position==='sticky','desktop Board view/toolbar chrome remains sticky');
      assert(getComputedStyle(toolbar).display==='grid','desktop Board toolbar uses stable three-region grid composition');
      assert(getComputedStyle(statusCommand).display!=='none'&&getComputedStyle(filterCommand).display!=='none'&&getComputedStyle(sortCommand).display!=='none','Board view/toolbar Milestone 3 audit: desktop keeps core query commands directly available');
      if(${width} > 1180) assert(getComputedStyle(peopleCommand).display!=='none'&&getComputedStyle(columnsCommand).display!=='none','Board view/toolbar Milestone 3 audit: wide desktop exposes People and Columns commands');
      if(${width} <= 900) assert(getComputedStyle(peopleCommand).display==='none'&&getComputedStyle(columnsCommand).display==='none','Board view/toolbar Milestone 3 audit: compact workspace progressively collapses lower-priority commands');
    } else {
      assert(getComputedStyle(control).position==='static','narrow Board chrome releases sticky positioning');
      assert(getComputedStyle(toolbar).display==='flex','narrow Board toolbar stacks without clipping');
      assert(getComputedStyle(statusCommand).display==='none'&&getComputedStyle(peopleCommand).display==='none'&&getComputedStyle(columnsCommand).display==='none'&&getComputedStyle(historyControls).display==='none','Board view/toolbar Milestone 3 audit: narrow toolbar progressively collapses secondary commands');
      assert(getComputedStyle(filterCommand).display!=='none'&&getComputedStyle(sortCommand).display!=='none'&&getComputedStyle(toolbarMore).display!=='none','Board view/toolbar Milestone 3 audit: compact overflow preserves hidden command access');
      assert(getComputedStyle(viewSummary).display==='none','Board view/toolbar Milestone 3 audit: narrow view navigation removes nonessential summary text');
    }
    if(${JSON.stringify(theme)}==='light') assert(getComputedStyle(newItem).backgroundColor==='rgb(0, 115, 234)','light Board primary creation action uses collaboration blue');
    else assert(getComputedStyle(newItem).backgroundColor==='rgb(87, 155, 252)','dark Board primary creation action uses accessible collaboration blue');
    return true;
  })()`);
  console.log(`PASS Monday-style Board presentation audit: ${name} / ${theme} (${width}x${height})`);
  return outcome;
}
for (const scenario of [{ name:'desktop', width:1440, height:900 },{ name:'intermediate desktop', width:1080, height:900 },{ name:'compact workspace', width:820, height:980 },{ name:'narrow viewport', width:390, height:844 },{ name:'coarse pointer narrow', width:390, height:844, touch:true }]) {
  for (const theme of ['light','dark']) await runBoardPresentationAudit({ ...scenario, theme });
}

// Main Table Milestone 4 audit: verifies group hierarchy, spreadsheet density,
// frozen identity geometry, responsive sticky-column fallback and in-grid creation.
const m4TableMarkup = String.raw`
  <main class="page board-detail-page">
    <section class="board-view-region">
      <div class="board-table-view board-sheet-view" role="region" aria-label="Board main table">
        <section class="board-group board-sheet-group" style="--group-accent:#579bfc" aria-labelledby="m4GroupTitle">
          <header class="board-group-header board-sheet-group-header">
            <div class="board-group-identity"><span class="group-accent-rail"></span><span class="group-drag-handle">⋮⋮</span><button class="group-collapse"><span>⌄</span></button><div class="group-heading-copy"><button id="m4GroupTitle" class="group-title-inline"><span>Active work</span></button><span class="board-group-count">2 items</span></div></div>
            <div class="board-group-actions"><button class="group-add-item-button"><span>+</span><span>Add item</span></button><button class="group-more-trigger"><span>•••</span></button></div>
          </header>
          <div id="m4Scroller" class="board-table-scroll" role="region" tabindex="0" aria-label="Active work table">
            <table id="m4Table" class="board-data-table interactive-board-table board-sheet-table" style="min-width:1640px">
              <colgroup><col class="select-col"><col class="drag-col"><col style="width:300px"><col style="width:190px"><col style="width:190px"><col style="width:190px"><col style="width:190px"><col class="actions-col"></colgroup>
              <thead><tr><th class="selection-cell"><input class="wm-checkbox" type="checkbox"></th><th class="drag-cell"></th><th id="m4ItemHead" class="board-item-name-head"><div class="identity-column-head"><span>Item</span><span class="board-column-kind">Item name</span><span class="column-resize-handle"></span></div></th><th id="m4SortedHead" class="board-column-head is-sorted has-filter"><div class="column-head-shell"><span class="column-drag-handle">⋮</span><button class="column-header-button"><span>Status</span><small>Status · Filtered</small></button><button class="column-quick-sort active"><span>↑</span></button><details class="column-context-menu"><summary><span>•••</span></summary></details><span id="m4Resize" class="column-resize-handle"></span></div></th><th class="board-column-head"><div class="column-head-shell"><span class="column-drag-handle">⋮</span><button class="column-header-button"><span>Owner</span></button><button class="column-quick-sort"><span>↕</span></button><details class="column-context-menu"><summary><span>•••</span></summary></details></div></th><th class="board-column-head"><div class="column-head-shell"><span class="column-drag-handle">⋮</span><button class="column-header-button"><span>Due date</span></button><button class="column-quick-sort"><span>↕</span></button><details class="column-context-menu"><summary><span>•••</span></summary></details></div></th><th class="board-column-head"><div class="column-head-shell"><span class="column-drag-handle">⋮</span><button class="column-header-button"><span>Priority</span></button><button class="column-quick-sort"><span>↕</span></button><details class="column-context-menu"><summary><span>•••</span></summary></details></div></th><th class="actions-head"><button class="add-column-head"><span>+</span><span>Column</span></button></th></tr></thead>
              <tbody>
                <tr id="m4SelectedRow" class="board-item-row is-selected" aria-selected="true"><td id="m4SelectCell" class="selection-cell"><input class="wm-checkbox" type="checkbox" checked></td><td id="m4DragCell" class="drag-cell"><span class="drag-handle">⋮⋮</span></td><td id="m4ItemCell" class="board-item-name-cell"><div class="board-item-name-shell"><span id="m4ItemAccent" class="board-item-accent"></span><button class="item-inline-title">Prepare monthly close</button><button class="item-title-edit-button">✎</button><button class="item-details-bubble">↗</button></div></td><td class="board-data-cell" data-column-type="status"><button class="board-cell-button"><span class="status-pill configurable-status-pill" style="background:#00c875;color:#fff">Done</span></button></td><td class="board-data-cell"><button class="board-cell-button">Alex Morgan</button></td><td class="board-data-cell"><button class="board-cell-button">Sep 08</button></td><td class="board-data-cell"><button class="board-cell-button">High</button></td><td id="m4ActionCell" class="item-actions"><button id="m4ItemMore" class="item-more-trigger"><span>•••</span></button></td></tr>
                <tr class="board-item-row"><td class="selection-cell"><input class="wm-checkbox" type="checkbox"></td><td class="drag-cell"><span class="drag-handle">⋮⋮</span></td><td class="board-item-name-cell"><div class="board-item-name-shell"><span class="board-item-accent"></span><button class="item-inline-title">Reconcile vendor invoices</button><button class="item-details-bubble">↗</button></div></td><td class="board-data-cell" data-column-type="status"><button class="board-cell-button"><span class="status-pill configurable-status-pill" style="background:#fdab3d;color:#222">Working on it</span></button></td><td class="board-data-cell"><button class="board-cell-button">Finance</button></td><td class="board-data-cell"><button class="board-cell-button">Sep 12</button></td><td class="board-data-cell"><button class="board-cell-button">Medium</button></td><td class="item-actions"><button class="item-more-trigger"><span>•••</span></button></td></tr>
                <tr id="m4AddRow" class="inline-add-row board-group-add-row"><td class="selection-cell"></td><td class="drag-cell"></td><td class="inline-add-cell" colspan="5"><div class="inline-add-shell"><span class="inline-add-plus">+</span><input value="" placeholder="Add item"><small>Enter to add · Shift+Enter to add another</small></div></td><td class="item-actions"></td></tr>
              </tbody>
            </table>
          </div>
        </section>
        <section class="board-group board-sheet-group" style="--group-accent:#a25ddc" aria-labelledby="m4EmptyTitle"><header class="board-group-header board-sheet-group-header"><div class="board-group-identity"><span class="group-accent-rail"></span><span class="group-drag-handle">⋮⋮</span><button class="group-collapse">⌄</button><div class="group-heading-copy"><button id="m4EmptyTitle" class="group-title-inline"><span>Planned work</span></button><span class="board-group-count">0 items</span></div></div></header><div class="board-table-scroll"><table class="board-data-table interactive-board-table board-sheet-table"><tbody><tr class="board-empty-row"><td class="group-empty"><div id="m4EmptyState" class="board-group-empty-state"><span class="board-empty-mark">+</span><span class="board-empty-copy"><strong>This group is ready for work</strong><small>Add the first item to start tracking work in this group.</small></span><button class="board-empty-add">Add first item</button></div></td></tr></tbody></table></div></section>
      </div>
    </section>
  </main>`;

async function runMainTableM4Audit({ width, height, theme, name, touch = false }) {
  await call('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor:1, mobile:false, screenWidth:width, screenHeight:height });
  await call('Emulation.setTouchEmulationEnabled', { enabled:touch, maxTouchPoints:touch ? 5 : 1 });
  await evaluate(`(()=>{
    document.querySelectorAll('style[data-final-presentation-audit]').forEach((node)=>node.remove());
    const style=document.createElement('style');style.dataset.finalPresentationAudit='1';style.textContent=globalThis.__wmFinalPresentationCss;document.head.appendChild(style);
    document.documentElement.dataset.theme=${JSON.stringify(theme)};document.documentElement.style.fontSize='16px';document.body.dataset.wmSurface='shell';document.body.innerHTML=${JSON.stringify(m4TableMarkup)};
    const assert=(ok,message)=>{if(!ok)throw new Error(message);};
    const groupHeader=document.querySelector('.board-sheet-group-header');
    const groupTitle=document.querySelector('.group-title-inline');
    const groupCount=document.querySelector('.board-group-count');
    const scroller=document.querySelector('#m4Scroller');
    const table=document.querySelector('#m4Table');
    const itemHead=document.querySelector('#m4ItemHead');
    const sortedHead=document.querySelector('#m4SortedHead');
    const resize=document.querySelector('#m4Resize');
    const selectedRow=document.querySelector('#m4SelectedRow');
    const selectCell=document.querySelector('#m4SelectCell');
    const dragCell=document.querySelector('#m4DragCell');
    const itemCell=document.querySelector('#m4ItemCell');
    const actionCell=document.querySelector('#m4ActionCell');
    const itemAccent=document.querySelector('#m4ItemAccent');
    const addRow=document.querySelector('#m4AddRow td');
    const emptyState=document.querySelector('#m4EmptyState');
    assert(document.documentElement.scrollWidth<=document.documentElement.clientWidth+1,'Main Table Milestone 4 audit: wide schema does not create document-level overflow');
    assert(scroller.scrollWidth>scroller.clientWidth,'Main Table Milestone 4 audit: wide schema stays inside the group horizontal scroller');
    assert(groupTitle.getBoundingClientRect().top<=groupCount.getBoundingClientRect().bottom&&groupCount.getBoundingClientRect().left>=groupTitle.getBoundingClientRect().left,'Main Table Milestone 4 audit: group title and item count form one identity row');
    assert(parseFloat(getComputedStyle(scroller).borderLeftWidth)>=4,'Main Table Milestone 4 audit: group accent is integrated into the spreadsheet frame');
    assert(parseFloat(getComputedStyle(scroller).borderTopLeftRadius)>=6,'Main Table Milestone 4 audit: spreadsheet frame uses semantic radius');
    if(!${touch}){ const headerHeight=groupHeader.getBoundingClientRect().height; assert(headerHeight>=40&&headerHeight<=52,'Main Table Milestone 4 audit: group header stays compact: '+headerHeight); }
    { const headerHeight=itemHead.getBoundingClientRect().height; assert(headerHeight>=39&&headerHeight<=42,'Main Table Milestone 4 audit: column header follows semantic 40px density: '+headerHeight); }
    { const rowHeight=selectedRow.getBoundingClientRect().height; assert(rowHeight>=42&&rowHeight<=(${touch}?58:46),'Main Table Milestone 4 audit: item row follows semantic density: '+rowHeight); }
    { const addHeight=addRow.getBoundingClientRect().height; assert(addHeight>=36&&addHeight<=45,'Main Table Milestone 4 audit: in-grid Add item row remains compact: '+addHeight); }
    assert(parseFloat(getComputedStyle(resize).width)>=9,'Main Table Milestone 4 audit: resize handle keeps a usable hit lane');
    { const marker=getComputedStyle(sortedHead,'::after'); assert(parseFloat(marker.height)>=2&&marker.backgroundColor!=='rgba(0, 0, 0, 0)','Main Table Milestone 4 audit: sorted/filtered column has a visible active marker'); }
    assert(parseFloat(getComputedStyle(itemAccent).width)>=4&&getComputedStyle(itemAccent).opacity!=='0','Main Table Milestone 4 audit: selected row retains group identity accent');
    assert(emptyState.getBoundingClientRect().height>=80,'Main Table Milestone 4 audit: empty group provides an intentional in-grid state');
    if(${width}>760){
      assert(getComputedStyle(selectCell).position==='sticky'&&Math.abs(parseFloat(getComputedStyle(selectCell).left))<1,'Main Table Milestone 4 audit: desktop selection column is frozen at the left edge');
      assert(getComputedStyle(dragCell).position==='sticky'&&parseFloat(getComputedStyle(dragCell).left)>=31,'Main Table Milestone 4 audit: desktop drag column follows selection column');
      assert(getComputedStyle(itemCell).position==='sticky'&&parseFloat(getComputedStyle(itemCell).left)>=59,'Main Table Milestone 4 audit: desktop Item column is frozen after utility columns');
    }else{
      assert(getComputedStyle(selectCell).position!=='sticky'&&getComputedStyle(dragCell).position!=='sticky','Main Table Milestone 4 audit: narrow layout releases utility columns');
      assert(getComputedStyle(itemCell).position==='sticky'&&Math.abs(parseFloat(getComputedStyle(itemCell).left))<1,'Main Table Milestone 4 audit: narrow layout keeps only Item identity frozen');
    }
    assert(getComputedStyle(actionCell).position==='sticky'&&Math.abs(parseFloat(getComputedStyle(actionCell).right))<1,'Main Table Milestone 4 audit: row actions remain reachable at the right edge');
    assert(table.getBoundingClientRect().width>=scroller.getBoundingClientRect().width,'Main Table Milestone 4 audit: table owns spreadsheet width rather than expanding page layout');
    if(${touch}) assert(document.querySelector('#m4ItemMore').getBoundingClientRect().height>=44,'Main Table Milestone 4 audit: coarse-pointer row action meets 44px target');
    return true;
  })()`);
  console.log(`PASS Main Table Milestone 4 audit: ${name} / ${theme} (${width}x${height})`);
}
for (const scenario of [{name:'desktop',width:1440,height:900},{name:'compact',width:820,height:980},{name:'narrow',width:390,height:844},{name:'coarse pointer narrow',width:390,height:844,touch:true}]) {
  for (const theme of ['light','dark']) await runMainTableM4Audit({ ...scenario, theme });
}

// Cell and Column Milestone 5 audit: verifies typed cell hierarchy, semantic
// geometry, readable editors and consistent light/dark presentation.
const m5CellMarkup = String.raw`
  <main class="page board-detail-page"><section class="board-view-region"><div class="board-table-view board-sheet-view"><section class="board-group board-sheet-group" style="--group-accent:#579bfc"><div class="board-table-scroll"><table class="board-data-table interactive-board-table board-sheet-table" style="min-width:1500px"><thead><tr>
    <th class="selection-cell"></th><th class="drag-cell"></th><th class="board-item-name-head"><div class="identity-column-head"><span>Item</span></div></th>
    <th class="board-column-head board-column-head--status"><div class="column-head-shell"><span class="column-drag-handle">⋮</span><span id="m5TypeIcon" class="board-column-type-icon board-column-type-icon--status">●</span><button class="column-header-button"><span class="column-header-title">Status</span><small class="column-header-meta">Status</small></button><button class="column-quick-sort">↕</button><details class="column-context-menu"><summary>•••</summary></details></div></th>
    <th class="actions-head"></th></tr></thead><tbody><tr id="m5Row" class="board-item-row"><td class="selection-cell"></td><td class="drag-cell"></td><td class="board-item-name-cell"><div class="board-item-name-shell"><span class="board-item-accent"></span><button class="item-inline-title">Quarter close</button></div></td>
    <td id="m5StatusCell" class="board-data-cell board-data-cell--status" data-column-type="status"><button class="board-cell-button board-cell-button--status"><span id="m5Status" class="status-pill configurable-status" style="--status-color:#00a76f"><span class="status-pill-dot"></span><span class="status-pill-label">Done</span></span></button></td>
    <td id="m5PeopleCell" class="board-data-cell board-data-cell--people" data-column-type="people"><button class="board-cell-button board-cell-button--people"><span class="board-person-cell"><span id="m5Avatar" class="board-person-avatar">AM</span><span class="board-person-name">Alex Morgan</span></span></button></td>
    <td class="board-data-cell board-data-cell--date" data-column-type="date"><button class="board-cell-button board-cell-button--date"><span class="board-date-cell"><span id="m5DateIcon" class="board-cell-leading-icon board-date-icon">□</span><span>Sep 8, 2026</span></span></button></td>
    <td class="board-data-cell board-data-cell--dropdown" data-column-type="dropdown"><button class="board-cell-button board-cell-button--dropdown"><span id="m5Choice" class="choice-pill"><span class="choice-pill-label">High priority</span></span></button></td>
    <td class="board-data-cell board-data-cell--number" data-column-type="number"><button id="m5NumberButton" class="board-cell-button board-cell-button--number"><span class="board-number-cell">12,450.75</span></button></td>
    <td class="board-data-cell board-data-cell--checkbox" data-column-type="checkbox"><button class="board-cell-button board-cell-button--checkbox"><span id="m5Check" class="check-cell checked"><span>✓</span></span></button></td>
    <td class="board-data-cell board-data-cell--email" data-column-type="email"><button class="board-cell-button board-cell-button--email"><span class="email-cell"><span class="board-cell-leading-icon">@</span><span>alex@example.com</span></span></button></td>
    <td class="board-data-cell board-data-cell--url" data-column-type="url"><button class="board-cell-button board-cell-button--url"><span class="link-cell"><span class="board-cell-leading-icon">↗</span><span>https://example.com/board</span></span></button></td>
    <td class="board-data-cell board-data-cell--text" data-column-type="text"><button class="board-cell-button board-cell-button--text"><span class="board-text-cell">Concise operational note</span></button></td><td class="item-actions"></td></tr></tbody></table></div></section></div></section>
  <div id="m5InlineEditor" class="board-inline-editor-shell"><input class="board-inline-input" value="Edit value"><span class="board-inline-editor-actions"><button class="inline-confirm">✓</button><button class="inline-cancel">×</button></span><span class="board-inline-editor-status"></span></div>
  <div class="board-inline-popover"><div class="board-choice-editor" role="listbox"><button id="m5ChoiceOption" class="board-choice-option selected"><span class="board-choice-indicator">✓</span><span>High priority</span></button></div><div class="board-person-editor"><div class="board-cell-editor-heading"><strong>Assign person</strong><small>Owner</small></div><label class="inline-picker-search"><span class="board-picker-search-icon">⌕</span><input value="Alex"></label><div class="board-person-choice-list"><button id="m5PersonChoice" class="board-person-choice selected"><span class="board-person-avatar">AM</span><span class="board-person-choice-copy"><strong>Alex Morgan</strong><small>alex@example.com</small></span><span class="board-person-choice-check">✓</span></button></div></div><div class="board-status-picker"><div class="status-choice-list"><button id="m5StatusChoice" class="status-choice selected" style="--status-color:#00a76f"><span class="status-choice-swatch"></span><span>Done</span></button></div></div></div>
  </main>`;

async function runCellColumnM5Audit({ width, height, theme, name, touch = false }) {
  await call('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor:1, mobile:false, screenWidth:width, screenHeight:height });
  await call('Emulation.setTouchEmulationEnabled', { enabled:touch, maxTouchPoints:touch ? 5 : 1 });
  await evaluate(`(()=>{
    document.querySelectorAll('style[data-final-presentation-audit]').forEach((node)=>node.remove());
    const style=document.createElement('style');style.dataset.finalPresentationAudit='1';style.textContent=globalThis.__wmFinalPresentationCss;document.head.appendChild(style);
    document.documentElement.dataset.theme=${JSON.stringify(theme)};document.documentElement.style.fontSize='16px';document.body.dataset.wmSurface='shell';document.body.innerHTML=${JSON.stringify(m5CellMarkup)};
    const assert=(ok,message)=>{if(!ok)throw new Error(message);};
    const row=document.querySelector('#m5Row'); const status=document.querySelector('#m5Status'); const avatar=document.querySelector('#m5Avatar'); const choice=document.querySelector('#m5Choice'); const check=document.querySelector('#m5Check'); const typeIcon=document.querySelector('#m5TypeIcon'); const dateIcon=document.querySelector('#m5DateIcon'); const numberButton=document.querySelector('#m5NumberButton'); const inline=document.querySelector('#m5InlineEditor'); const choiceOption=document.querySelector('#m5ChoiceOption'); const personChoice=document.querySelector('#m5PersonChoice'); const statusChoice=document.querySelector('#m5StatusChoice');
    assert(row.getBoundingClientRect().height>=42&&row.getBoundingClientRect().height<=(${touch}?58:46),'Cell and Column Milestone 5 audit: typed cells preserve row density');
    assert(status.getBoundingClientRect().height>=30&&status.getBoundingClientRect().height<=34,'Cell and Column Milestone 5 audit: Status uses semantic 32px geometry');
    assert(parseFloat(getComputedStyle(status).borderLeftWidth)>=1&&getComputedStyle(status).boxShadow!=='none','Cell and Column Milestone 5 audit: Status retains explicit color identity');
    assert(avatar.getBoundingClientRect().width>=25&&avatar.getBoundingClientRect().width<=28&&avatar.getBoundingClientRect().height>=25,'Cell and Column Milestone 5 audit: People avatar uses semantic geometry');
    assert(choice.getBoundingClientRect().height>=27&&choice.getBoundingClientRect().height<=30,'Cell and Column Milestone 5 audit: Dropdown chip uses semantic geometry');
    assert(check.getBoundingClientRect().width>=17&&check.getBoundingClientRect().width<=20&&check.getBoundingClientRect().height>=17,'Cell and Column Milestone 5 audit: Checkbox uses compact semantic control');
    assert(typeIcon.getBoundingClientRect().width>=15&&dateIcon.getBoundingClientRect().width>=15,'Cell and Column Milestone 5 audit: type/leading icons retain readable sizing');
    assert(getComputedStyle(numberButton).justifyContent==='flex-end','Cell and Column Milestone 5 audit: numeric cells align values to the trailing edge');
    assert(inline.querySelector('.board-inline-input').getBoundingClientRect().height>=35,'Cell and Column Milestone 5 audit: explicit editor input uses semantic control height');
    assert(choiceOption.getBoundingClientRect().height>=35&&personChoice.getBoundingClientRect().height>=40&&statusChoice.getBoundingClientRect().height>=35,'Cell and Column Milestone 5 audit: typed picker options use consistent target geometry');
    if(${touch}) assert(choiceOption.getBoundingClientRect().height>=44&&personChoice.getBoundingClientRect().height>=44&&statusChoice.getBoundingClientRect().height>=44,'Cell and Column Milestone 5 audit: typed picker options meet coarse-pointer targets');
    assert(document.documentElement.scrollWidth<=document.documentElement.clientWidth+1,'Cell and Column Milestone 5 audit: typed cell visuals do not create document overflow');
    return true;
  })()`);
  console.log(`PASS Cell and Column Milestone 5 audit: ${name} / ${theme} (${width}x${height})`);
}
for (const scenario of [{name:'desktop',width:1440,height:900},{name:'compact',width:820,height:980},{name:'narrow',width:390,height:844},{name:'coarse pointer narrow',width:390,height:844,touch:true}]) {
  for (const theme of ['light','dark']) await runCellColumnM5Audit({ ...scenario, theme });
}

const m6OverlayMarkup=`<main class="board-detail-page"><div class="board-overlay-layer"><div id="m6Menu" class="board-floating-menu board-menu-surface" data-menu-kind="column" data-placement="bottom" style="left:24px;top:80px;width:244px"><div class="board-menu-section-label">Column actions</div><button id="m6MenuItem" class="board-menu-item">Configure column</button><hr class="board-menu-separator"><button id="m6Danger" class="board-menu-item board-menu-item--danger" data-menu-tone="danger">Delete column permanently</button></div></div></main><div id="m6Popover" class="board-inline-popover board-popover-surface" data-placement="bottom" style="left:24px;top:240px"><div class="board-choice-editor"><button id="m6Choice" class="board-choice-option selected">High priority</button></div></div><div class="wm-modal-backdrop board-dialog-backdrop" data-dialog-state="open"><section id="m6Dialog" class="wm-dialog wm-modal board-dialog" data-dialog-tone="danger"><header class="wm-dialog-header"><div class="board-dialog-heading"><span class="top-eyebrow">WORK MANAGEMENT</span><h2>Confirm destructive action</h2></div><button class="board-dialog-close">×</button></header><form><div class="wm-dialog-body wm-modal-body"><div class="board-confirm-copy"><span class="board-confirm-symbol">!</span><p>Delete this item permanently?</p></div></div><footer class="wm-dialog-footer"><button class="wm-modal-cancel">Cancel</button><button class="board-dialog-submit danger-btn">Confirm action</button></footer></form></section></div>`;

async function runOverlayM6Audit({ width, height, theme, name, touch=false }) {
  await call('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile:false,screenWidth:width,screenHeight:height});
  await call('Emulation.setTouchEmulationEnabled',{enabled:touch,maxTouchPoints:touch?5:1});
  await evaluate(`(()=>{document.querySelectorAll('style[data-final-presentation-audit]').forEach((node)=>node.remove());const style=document.createElement('style');style.dataset.finalPresentationAudit='1';style.textContent=globalThis.__wmFinalPresentationCss+'\\n.board-floating-menu,.board-inline-popover,.board-dialog,.board-dialog-backdrop{animation:none!important}';document.head.appendChild(style);document.documentElement.dataset.theme=${JSON.stringify(theme)};document.body.dataset.wmSurface='shell';document.body.innerHTML=${JSON.stringify(m6OverlayMarkup)};const assert=(ok,message)=>{if(!ok)throw new Error(message);};const menu=document.querySelector('#m6Menu'),item=document.querySelector('#m6MenuItem'),danger=document.querySelector('#m6Danger'),pop=document.querySelector('#m6Popover'),choice=document.querySelector('#m6Choice'),dialog=document.querySelector('#m6Dialog');assert(menu.getBoundingClientRect().width<=320&&menu.getBoundingClientRect().width>=210,'Menus, Popovers and Dialogs Milestone 6 audit: menu uses bounded semantic width');assert(item.getBoundingClientRect().height>=(${touch}?44:35),'Menus, Popovers and Dialogs Milestone 6 audit: menu item target geometry is consistent');assert(getComputedStyle(menu).boxShadow!=='none'&&getComputedStyle(pop).boxShadow!=='none','Menus, Popovers and Dialogs Milestone 6 audit: transient surfaces use elevation');assert(getComputedStyle(danger).color!==getComputedStyle(item).color,'Menus, Popovers and Dialogs Milestone 6 audit: destructive commands retain distinct tone');assert(pop.getBoundingClientRect().width<=420&&pop.getBoundingClientRect().width>=270,'Menus, Popovers and Dialogs Milestone 6 audit: popover width follows semantic bounds');assert(choice.getBoundingClientRect().height>=(${touch}?44:35),'Menus, Popovers and Dialogs Milestone 6 audit: picker target geometry remains accessible');assert(dialog.getBoundingClientRect().width<=560&&dialog.getBoundingClientRect().width<=innerWidth-8,'Menus, Popovers and Dialogs Milestone 6 audit: dialog remains viewport contained');assert(document.documentElement.scrollWidth<=document.documentElement.clientWidth+1,'Menus, Popovers and Dialogs Milestone 6 audit: transient surfaces do not create document overflow');return true;})()`);
  console.log(`PASS Menus, Popovers and Dialogs Milestone 6 audit: ${name} / ${theme} (${width}x${height})`);
}
for(const scenario of [{name:'desktop',width:1440,height:900},{name:'compact',width:820,height:980},{name:'narrow',width:390,height:844},{name:'coarse pointer narrow',width:390,height:844,touch:true}]){for(const theme of ['light','dark'])await runOverlayM6Audit({...scenario,theme});}


// Kanban and Item Workspace Milestone 7 audit: verifies alternate-view hierarchy,
// lane/card density, stable collaboration drawer geometry and touch containment.
const m7KanbanWorkspaceMarkup = String.raw`
  <main class="page board-detail-page">
    <section class="board-view-region">
      <div id="m7Kanban" class="kanban-board" aria-label="Board Kanban view" data-kanban-lane-count="4">
        <section id="m7Lane" class="kanban-column" data-drop-status="working" style="--lane-color:#579bfc" aria-labelledby="m7LaneTitle">
          <header class="kanban-lane-head"><div class="kanban-lane-identity"><span class="kanban-lane-swatch"></span><div class="kanban-lane-title"><h3 id="m7LaneTitle">Working on it</h3><span class="kanban-lane-count">2</span></div></div><div class="kanban-lane-actions"><button id="m7Add" class="kanban-add-item"><svg viewBox="0 0 20 20"><path d="M10 4v12M4 10h12"/></svg><span>Add item</span></button></div></header>
          <div class="kanban-list" role="list"><article id="m7Card" class="kanban-card" role="listitem"><button class="kanban-card-open"><span class="kanban-card-context"><span class="kanban-card-group">Main group</span><span class="kanban-card-open-mark"><svg viewBox="0 0 20 20"><path d="M7 5h8v8M15 5l-9 9"/></svg></span></span><strong>Prepare operational readiness report</strong></button><footer class="kanban-card-meta"><span class="kanban-card-assignee"><span id="m7Avatar" class="kanban-avatar">AM</span><span class="kanban-assignee-name">Alex Morgan</span></span><span class="kanban-card-due"><svg viewBox="0 0 20 20"><rect x="3.5" y="5" width="13" height="11" rx="2"/></svg><span>Sep 12</span></span></footer></article><div id="m7Empty" class="kanban-empty"><svg viewBox="0 0 24 24"><rect x="4" y="5" width="16" height="14" rx="3"/></svg><div class="kanban-empty-copy"><strong>No more items</strong><span>Add an item here or drag work into this lane.</span></div><button class="kanban-empty-add">Add first item</button></div></div>
        </section>
        <section class="kanban-column" data-drop-status="done" style="--lane-color:#00c875"><header class="kanban-lane-head"><div class="kanban-lane-identity"><span class="kanban-lane-swatch"></span><div class="kanban-lane-title"><h3>Done</h3><span class="kanban-lane-count">1</span></div></div></header><div class="kanban-list"><div class="kanban-empty"><strong>No items</strong><span>Items moved here appear here.</span></div></div></section>
        <section class="kanban-column" data-drop-status="blocked" style="--lane-color:#e2445c"><header class="kanban-lane-head"><div class="kanban-lane-identity"><span class="kanban-lane-swatch"></span><div class="kanban-lane-title"><h3>Blocked</h3><span class="kanban-lane-count">0</span></div></div></header><div class="kanban-list"><div class="kanban-empty"><strong>No items</strong><span>Items moved here appear here.</span></div></div></section>
        <section class="kanban-column" data-drop-status="" style="--lane-color:#a3aab5"><header class="kanban-lane-head"><div class="kanban-lane-identity"><span class="kanban-lane-swatch"></span><div class="kanban-lane-title"><h3>No status</h3><span class="kanban-lane-count">0</span></div></div></header><div class="kanban-list"><div class="kanban-empty"><strong>No items</strong><span>Items moved here appear here.</span></div></div></section>
      </div>
    </section>
  </main>
  <div class="item-panel-scrim"></div>
  <aside id="m7Panel" class="board-item-panel" data-item-panel data-item-id="i1" data-active-tab="updates">
    <header id="m7PanelHead" class="item-panel-head"><button class="item-panel-close"><svg viewBox="0 0 20 20"><path d="m5 5 10 10M15 5 5 15"/></svg></button><div class="item-panel-identity"><div class="item-panel-context"><span class="item-panel-context-label">ITEM</span><div class="item-panel-breadcrumb"><span>Main group</span><span>/</span><span>Working on it</span></div></div><h2>Prepare operational readiness report</h2><div class="item-panel-meta"><span class="status-pill configurable-status" style="--status-color:#579bfc"><span class="item-panel-status-swatch"></span>Working on it</span><span class="item-panel-due"><svg viewBox="0 0 20 20"><rect x="3.5" y="5" width="13" height="11" rx="2"/></svg><span>Due Sep 12</span></span></div></div><button class="item-panel-more-trigger"><svg viewBox="0 0 20 20"><circle cx="4" cy="10" r="1.35"/><circle cx="10" cy="10" r="1.35"/><circle cx="16" cy="10" r="1.35"/></svg></button></header>
    <nav id="m7Tabs" class="wm-tabs item-panel-tabs" role="tablist"><button class="active" aria-selected="true"><svg viewBox="0 0 20 20"><path d="M4 5.5h12v8H8l-4 3z"/></svg><span>Updates</span><b>2</b></button><button><svg viewBox="0 0 20 20"><path d="M6 3.5h5l3 3v10H6z"/></svg><span>Files</span><b>1</b></button><button><svg viewBox="0 0 20 20"><circle cx="10" cy="10" r="6.5"/></svg><span>Activity</span><b>4</b></button></nav>
    <div id="m7PanelBody" class="item-panel-body" data-item-panel-body><div class="item-panel-tab-stage" data-item-tab-stage data-item-tab-content="updates"><div id="m7Updates" class="item-updates"><section id="m7Composer" class="item-update-compose-shell"><div class="item-update-compose-head"><div><span class="item-update-compose-kicker">UPDATE</span><h3>Share an update</h3><p>Record progress with this item.</p></div><span class="item-update-visibility"><span class="item-update-visibility-dot"></span>Board members</span></div><div class="item-update-typebar"><span class="item-update-type-label">Quick type</span><div class="item-update-prompts"><button>Progress</button><button>Decision</button></div></div><form class="item-update-composer"><div class="item-update-editor-wrap"><textarea></textarea></div><div class="item-update-compose-footer"><div class="item-update-compose-meta">0 / 5000</div><div class="item-update-compose-actions"><button class="item-update-submit">Post update</button></div></div></form></section><section class="item-update-stream"><div class="item-update-stream-head"><div><span class="item-update-stream-kicker">UPDATES</span><h3>Update history</h3></div><span class="item-update-stream-count">2 updates</span></div><div class="item-update-list"><article class="item-update"><header><span class="item-avatar">AM</span><div class="item-update-author"><strong>Alex Morgan</strong><small>Today</small></div><span class="item-update-kind">Progress</span></header><div class="item-update-copy">Operational readiness review is underway.</div></article></div></section></div><section id="m7Files" class="item-files"><div class="item-panel-section-head"><div><span>FILES</span><h3>Attachments</h3><p>Keep reference files with this item.</p></div><span class="item-panel-section-count">1 file</span></div><label id="m7Drop" class="item-file-drop"><svg viewBox="0 0 24 24"><path d="M12 16V5"/></svg><span class="item-file-drop-copy"><strong>Attach files</strong><small>Up to 20 MB each.</small></span><span class="item-file-drop-action">Browse</span></label><div class="item-file-list"><article id="m7File" class="item-file"><span class="item-file-type">PDF</span><button class="item-file-open"><strong>readiness.pdf</strong><small><span>2 MB</span><span>Alex</span><span>Today</span></small></button><button class="item-file-delete">×</button></article></div></section><section id="m7Activity" class="item-activity"><div class="item-panel-section-head"><div><span>ACTIVITY</span><h3>Item activity</h3></div><span class="item-panel-section-count">4 events</span></div><div id="m7ActivityList" class="item-activity-list"><article><span class="event-dot"></span><div class="activity-copy"><strong>Status updated</strong><p>Alex · Today</p></div></article></div></section></div></div>
  </aside>`;

async function runKanbanWorkspaceM7Audit({ width, height, theme, name, touch=false }) {
  await call('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile:false,screenWidth:width,screenHeight:height});
  await call('Emulation.setTouchEmulationEnabled',{enabled:touch,maxTouchPoints:touch?5:1});
  await evaluate(`(()=>{document.querySelectorAll('style[data-final-presentation-audit]').forEach((node)=>node.remove());const style=document.createElement('style');style.dataset.finalPresentationAudit='1';style.textContent=globalThis.__wmFinalPresentationCss+'\\n.board-item-panel,.item-panel-scrim{animation:none!important}';document.head.appendChild(style);document.documentElement.dataset.theme=${JSON.stringify(theme)};document.documentElement.style.fontSize='16px';document.body.dataset.wmSurface='shell';document.body.classList.add('board-item-panel-open');document.body.innerHTML=${JSON.stringify(m7KanbanWorkspaceMarkup)};const assert=(ok,message)=>{if(!ok)throw new Error(message);};const board=document.querySelector('#m7Kanban'),lane=document.querySelector('#m7Lane'),head=document.querySelector('.kanban-lane-head'),card=document.querySelector('#m7Card'),avatar=document.querySelector('#m7Avatar'),empty=document.querySelector('#m7Empty'),add=document.querySelector('#m7Add'),panel=document.querySelector('#m7Panel'),panelHead=document.querySelector('#m7PanelHead'),tabs=document.querySelector('#m7Tabs'),body=document.querySelector('#m7PanelBody'),updates=document.querySelector('#m7Updates'),composer=document.querySelector('#m7Composer'),drop=document.querySelector('#m7Drop'),file=document.querySelector('#m7File'),activity=document.querySelector('#m7ActivityList');assert(board.scrollWidth>=board.clientWidth,'Kanban and Item Workspace Milestone 7 audit: Kanban remains a contained horizontal work surface');assert(lane.getBoundingClientRect().width>=280&&lane.getBoundingClientRect().width<=340,'Kanban and Item Workspace Milestone 7 audit: lane width follows semantic geometry');assert(head.getBoundingClientRect().height>=52&&head.getBoundingClientRect().height<=66,'Kanban and Item Workspace Milestone 7 audit: lane header is compact and stable');assert(card.getBoundingClientRect().height>=120,'Kanban and Item Workspace Milestone 7 audit: cards preserve readable information hierarchy');assert(parseFloat(getComputedStyle(card).borderLeftWidth)>=3,'Kanban and Item Workspace Milestone 7 audit: cards retain status-lane identity');assert(avatar.getBoundingClientRect().width>=23&&avatar.getBoundingClientRect().width<=26,'Kanban and Item Workspace Milestone 7 audit: card assignee avatar uses semantic geometry');assert(empty.getBoundingClientRect().height>=180,'Kanban and Item Workspace Milestone 7 audit: empty lane remains intentional rather than collapsing');assert(getComputedStyle(panel).position==='fixed'&&panel.getBoundingClientRect().right>=document.documentElement.clientWidth-1,'Kanban and Item Workspace Milestone 7 audit: Item Workspace is a fixed collaboration drawer');assert(panel.getBoundingClientRect().width<=720&&panel.getBoundingClientRect().width<=innerWidth+1,'Kanban and Item Workspace Milestone 7 audit: drawer width remains viewport contained');assert(panelHead.getBoundingClientRect().height>=120,'Kanban and Item Workspace Milestone 7 audit: drawer identity header retains stable hierarchy');assert(tabs.getBoundingClientRect().height>=50&&tabs.getBoundingClientRect().height<=56,'Kanban and Item Workspace Milestone 7 audit: Updates Files Activity use compact stable navigation');assert(['auto','scroll'].includes(getComputedStyle(body).overflowY),'Kanban and Item Workspace Milestone 7 audit: only the drawer body owns vertical scrolling');assert(updates.getBoundingClientRect().width<=660+2,'Kanban and Item Workspace Milestone 7 audit: collaboration content uses a readable maximum width');assert(parseFloat(getComputedStyle(composer).borderTopWidth)>=1&&getComputedStyle(composer).boxShadow!=='none','Kanban and Item Workspace Milestone 7 audit: update composer is a structured Board surface');assert(drop.getBoundingClientRect().height>=108&&parseFloat(getComputedStyle(drop).borderTopWidth)>=1,'Kanban and Item Workspace Milestone 7 audit: file upload affordance is clear and bounded');assert(file.getBoundingClientRect().height>=60,'Kanban and Item Workspace Milestone 7 audit: attachments use readable row geometry');assert(parseFloat(getComputedStyle(activity).borderTopWidth)>=1,'Kanban and Item Workspace Milestone 7 audit: activity stream uses a coherent timeline surface');if(${touch}){assert(add.getBoundingClientRect().height>=44,'Kanban and Item Workspace Milestone 7 audit: lane actions meet coarse-pointer targets');assert(tabs.querySelector('button').getBoundingClientRect().height>=44,'Kanban and Item Workspace Milestone 7 audit: drawer tabs meet coarse-pointer targets');}assert(document.documentElement.scrollWidth<=document.documentElement.clientWidth+1,'Kanban and Item Workspace Milestone 7 audit: harmonized surfaces do not create document-level overflow');return true;})()`);
  console.log(`PASS Kanban and Item Workspace Milestone 7 audit: ${name} / ${theme} (${width}x${height})`);
}
for(const scenario of [{name:'desktop',width:1440,height:900},{name:'compact',width:820,height:980},{name:'narrow',width:390,height:844},{name:'coarse pointer narrow',width:390,height:844,touch:true}]){for(const theme of ['light','dark'])await runKanbanWorkspaceM7Audit({...scenario,theme});}

// Milestone 8 final Board production audit: holistic responsive composition,
// focus visibility, text scaling, touch targets and non-page overflow.
const m8FinalBoardMarkup = String.raw`
  <main class="page board-detail-page"><section class="board-workspace-shell">
    <section class="board-detail-head monday-board-head"><nav class="board-breadcrumb"><button class="board-back">Boards</button><span>/</span><span class="board-breadcrumb-current">Operational readiness and production cutover board with a deliberately long title</span></nav><div class="board-header-main"><div class="board-title-copy"><div class="board-title-line"><h2>Operational readiness and production cutover board with a deliberately long title</h2><span class="board-role-badge">Owner</span></div><button class="board-description-control"><span class="board-description-text">Coordinate long-running operational work across teams without allowing enlarged text to collide with the Board actions.</span></button></div><div class="board-head-actions"><button class="secondary-btn board-head-action">Members</button><button class="secondary-btn board-head-action">Activity</button><button class="board-more-trigger">•••</button></div></div></section>
    <div class="monday-board-control-stack"><nav class="board-view-bar"><div class="board-view-tabs"><button class="board-view-tab active" aria-selected="true">Main table</button><button class="board-view-tab">Kanban</button></div></nav><section class="board-controls monday-board-toolbar"><div class="board-controls-primary"><span class="board-new-item-split"><button class="board-new-item">New item</button><button class="board-new-item-menu">⌄</button></span></div><div class="board-controls-query"><div class="board-search compact"><input value="readiness"></div><button class="board-command-button board-tool board-tool-filter is-active">Filter</button><button class="board-command-button board-tool board-tool-sort">Sort</button></div><div class="board-controls-secondary"><button class="board-view-options">More</button></div></section></div>
    <section class="board-view-region"><div class="board-table-view board-sheet-view"><section class="board-group board-sheet-group"><header class="board-group-header board-sheet-group-header"><div class="board-group-identity"><span class="group-accent-rail"></span><span id="m8GroupHandle" class="group-drag-handle" role="button" tabindex="0">⋮⋮</span><button class="group-collapse">⌄</button><div class="group-heading-copy"><button class="group-title-inline"><span>Main group with an extended name</span></button><span class="board-group-count">12 items</span></div></div><div class="board-group-actions"><button class="group-more-trigger">•••</button></div></header><div id="m8Scroller" class="board-table-scroll" role="region" tabindex="0"><table class="board-data-table interactive-board-table board-sheet-table" style="min-width:1900px"><thead><tr><th class="selection-cell"></th><th class="drag-cell"></th><th class="board-item-name-head"><div class="identity-column-head"><span>Item</span><span id="m8Resize" class="column-resize-handle" data-column-resize="__item" role="separator" tabindex="0"></span></div></th><th class="board-column-head"><div class="column-head-shell"><span id="m8ColumnHandle" class="column-drag-handle" role="button" tabindex="0">⋮</span><button class="column-header-button"><span class="column-header-title">Status</span></button></div></th><th class="actions-head"></th></tr></thead><tbody><tr class="board-item-row is-selected"><td class="selection-cell"><input class="wm-checkbox" type="checkbox" checked></td><td class="drag-cell"><span id="m8ItemHandle" class="drag-handle" role="button" tabindex="0">⋮⋮</span></td><td class="board-item-name-cell"><div class="board-item-name-shell"><span class="board-item-accent"></span><button class="item-inline-title">Prepare production readiness documentation with a long item title</button></div></td><td class="board-data-cell"><button class="board-cell-button">Working on it</button></td><td class="item-actions"><button class="item-more-trigger">•••</button></td></tr></tbody></table></div></section></div>
      <div id="m8Kanban" class="kanban-board" role="region" tabindex="0"><section class="kanban-column"><header class="kanban-lane-head"><div class="kanban-lane-identity"><span class="kanban-lane-swatch"></span><div class="kanban-lane-title"><h3>Working on it</h3></div></div></header><div class="kanban-list"><article class="kanban-card"><button class="kanban-card-open"><strong>Prepare operational readiness report</strong></button><footer class="kanban-card-meta">Alex Morgan</footer></article></div></section><section class="kanban-column"></section><section class="kanban-column"></section></div>
    </section>
  </section></main>
  <aside id="m8Panel" class="board-item-panel"><header class="item-panel-head"><button class="item-panel-close">×</button><div class="item-panel-identity"><h2>A long item title that must remain readable under enlarged text scaling</h2></div><button class="item-panel-more-trigger">•••</button></header><nav class="item-panel-tabs" role="tablist"><button id="m8ActiveItemTab" role="tab" aria-selected="true" tabindex="0">Updates</button><button role="tab" aria-selected="false" tabindex="-1">Files</button><button role="tab" aria-selected="false" tabindex="-1">Activity</button></nav><div class="item-panel-body" role="tabpanel" tabindex="0"><div class="item-panel-tab-stage"><div class="item-updates"><section class="item-update-compose-shell"><div class="item-update-compose-head"><div><h3>Share an update</h3><p>Record progress without losing readability.</p></div></div><form class="item-update-composer"><textarea></textarea></form></section></div></div></div></aside>`;

async function runFinalBoardsM8Audit({ width, height, rootFontSize='16px', theme, name, touch=false }) {
  await call('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile:false,screenWidth:width,screenHeight:height});
  await call('Emulation.setTouchEmulationEnabled',{enabled:touch,maxTouchPoints:touch?5:1});
  await call('Emulation.setEmulatedMedia',{media:'screen',features:[]});
  await evaluate(`(()=>{document.querySelectorAll('style[data-final-presentation-audit]').forEach((node)=>node.remove());const style=document.createElement('style');style.dataset.finalPresentationAudit='1';style.textContent=globalThis.__wmFinalPresentationCss+'\\n.board-item-panel{animation:none!important}';document.head.appendChild(style);document.documentElement.dataset.theme=${JSON.stringify(theme)};document.documentElement.style.fontSize=${JSON.stringify(rootFontSize)};document.body.dataset.wmSurface='shell';document.body.className='board-item-panel-open';document.body.innerHTML=${JSON.stringify(m8FinalBoardMarkup)};const assert=(ok,message)=>{if(!ok)throw new Error(message);};const doc=document.documentElement,head=document.querySelector('.monday-board-head'),toolbar=document.querySelector('.monday-board-toolbar'),scroller=document.querySelector('#m8Scroller'),table=scroller.querySelector('table'),groupHandle=document.querySelector('#m8GroupHandle'),columnHandle=document.querySelector('#m8ColumnHandle'),itemHandle=document.querySelector('#m8ItemHandle'),resize=document.querySelector('#m8Resize'),kanban=document.querySelector('#m8Kanban'),panel=document.querySelector('#m8Panel'),activeTab=document.querySelector('#m8ActiveItemTab');assert(doc.scrollWidth<=doc.clientWidth+1,'Milestone 8 final audit: Board never creates document-level horizontal overflow');assert(head.getBoundingClientRect().width<=doc.clientWidth+1,'Milestone 8 final audit: header stays viewport-contained');assert(toolbar.getBoundingClientRect().width<=doc.clientWidth+1,'Milestone 8 final audit: command toolbar stays viewport-contained');assert(scroller.scrollWidth>scroller.clientWidth,'Milestone 8 final audit: wide spreadsheet overflow remains owned by its table scroller');assert(table.getBoundingClientRect().width>=scroller.getBoundingClientRect().width,'Milestone 8 final audit: spreadsheet retains intrinsic data width');assert(kanban.scrollWidth>=kanban.clientWidth,'Milestone 8 final audit: Kanban remains a contained horizontal region');assert(kanban.tabIndex===0&&scroller.tabIndex===0,'Milestone 8 final audit: horizontal work surfaces are keyboard focusable');assert(activeTab.tabIndex===0,'Milestone 8 final audit: active Item Workspace tab is the roving tab stop');for(const handle of [groupHandle,columnHandle,itemHandle,resize]){handle.focus();assert(document.activeElement===handle,'Milestone 8 final audit: structural control accepts keyboard focus');}if(${width}<=760)assert(getComputedStyle(groupHandle).display!=='none','Milestone 8 final audit: keyboard group reordering remains available on narrow layouts');if(${touch}){for(const target of [groupHandle,columnHandle,itemHandle,resize])assert(target.getBoundingClientRect().height>=44,'Milestone 8 final audit: coarse-pointer structural controls meet 44px targets');}assert(panel.getBoundingClientRect().width<=innerWidth+1,'Milestone 8 final audit: Item Workspace remains viewport-contained');assert(parseFloat(getComputedStyle(document.querySelector('.board-description-text')).lineHeight)>=parseFloat(getComputedStyle(document.querySelector('.board-description-text')).fontSize)*1.35,'Milestone 8 final audit: descriptive text keeps a readable line height');return true;})()`);
  console.log(`PASS Responsive, Accessibility and Final Production Polish Milestone 8 audit: ${name} / ${theme} (${width}x${height}, root ${rootFontSize})`);
}
for(const scenario of [
  {name:'wide desktop',width:1600,height:1000},
  {name:'laptop',width:1120,height:760},
  {name:'tablet',width:820,height:980},
  {name:'200% zoom equivalent',width:720,height:650},
  {name:'enlarged text',width:820,height:980,rootFontSize:'20px'},
  {name:'narrow',width:390,height:844},
  {name:'minimum supported narrow',width:320,height:700},
  {name:'coarse pointer narrow',width:390,height:844,touch:true},
]) for(const theme of ['light','dark']) await runFinalBoardsM8Audit({...scenario,theme});

// Media-preference audit for the final Board layer.
await call('Emulation.setDeviceMetricsOverride',{width:820,height:980,deviceScaleFactor:1,mobile:false,screenWidth:820,screenHeight:980});
await call('Emulation.setEmulatedMedia',{media:'screen',features:[{name:'prefers-reduced-motion',value:'reduce'}]});
await evaluate(`(()=>{document.documentElement.dataset.theme='light';document.documentElement.style.fontSize='16px';document.body.dataset.wmSurface='shell';document.body.className='board-item-panel-open';document.body.innerHTML=${JSON.stringify(m8FinalBoardMarkup)};const node=document.querySelector('.kanban-card');const style=getComputedStyle(node);if(!matchMedia('(prefers-reduced-motion: reduce)').matches)throw new Error('Milestone 8 final audit: reduced-motion emulation was not applied');if(parseFloat(style.transitionDuration)>0.001)throw new Error('Milestone 8 final audit: reduced motion must collapse decorative transitions');return true;})()`);
console.log('PASS Responsive, Accessibility and Final Production Polish Milestone 8 audit: reduced motion');

await call('Emulation.setEmulatedMedia',{media:'screen',features:[{name:'forced-colors',value:'active'}]});
await evaluate(`(()=>{document.documentElement.dataset.theme='light';document.body.dataset.wmSurface='shell';document.body.className='board-item-panel-open';document.body.innerHTML=${JSON.stringify(m8FinalBoardMarkup)};if(!matchMedia('(forced-colors: active)').matches)throw new Error('Milestone 8 final audit: forced-colors emulation was not applied');const table=getComputedStyle(document.querySelector('.board-table-scroll'));if(parseFloat(table.borderTopWidth)<1)throw new Error('Milestone 8 final audit: forced-colors retains explicit Board boundaries');const selected=getComputedStyle(document.querySelector('.board-item-row.is-selected'));if(selected.outlineStyle==='none')throw new Error('Milestone 8 final audit: forced-colors preserves selected-state identity');return true;})()`);
console.log('PASS Responsive, Accessibility and Final Production Polish Milestone 8 audit: forced colors');
await call('Emulation.setEmulatedMedia',{media:'screen',features:[]});

await call('Emulation.setTouchEmulationEnabled', { enabled: false, maxTouchPoints: 1 });
await call('Emulation.clearDeviceMetricsOverride');
console.log('Final presentation viewport/accessibility contract: PASS');
await new Promise((resolve) => {
  harnessServer.close(resolve);
});
ws.close();

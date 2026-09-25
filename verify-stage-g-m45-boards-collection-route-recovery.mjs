import fs from 'node:fs';
import assert from 'node:assert/strict';

const read=(f)=>fs.readFileSync(f,'utf8');
let checks=0; const check=(value,message)=>{assert.ok(value,message);checks+=1;};
const manifest=read('config/application-manifest.ts');
const types=read('src/types/manifest.ts');
const schema=read('src/runtime-schemas/manifest.ts');
const target=read('config/stage-g-m45-boards-collection-route-recovery-target.ts');
const m44=read('config/stage-g-m44-management-authority-consolidation-target.ts');
const listView=read('assets/js/features/boards/views/board-list-view.ts');
const boardsUi=read('assets/js/boards-ui.ts');
const dataController=read('assets/js/features/boards/controllers/board-data-controller.ts');
const repository=read('assets/js/features/boards/data/board-repository.ts');
const browser=read('tests/modern/e2e/boards-collection-route-recovery.spec.mjs');
const fixture=read('tests/modern/e2e/helpers/m45-boards-fixture.mjs');
const deterministic=read('scripts/verify-boards-collection-route-recovery-execution.mjs');
const runner=read('scripts/run-boards-collection-route-recovery-browser.mjs');
const releaseVerifier=read('scripts/verify-stage-g-m45-release.sh');
const finalizer=read('scripts/finalize-stage-g-m45.sh');
const artifactVerifier=read('scripts/verify-stage-g-m45-certified-artifact.mjs');
const tree=read('scripts/lib/stage-g-m45-certification-tree.mjs');
const workflow=read('.github/workflows/boards-collection-route-recovery.yml');
const m43Workflow=read('.github/workflows/settings-functional-recovery.yml');
const m44Workflow=read('.github/workflows/management-authority-consolidation.yml');
const m44Verifier=read('verify-stage-g-m44-management-authority-consolidation.mjs');
const workflowVerifier=read('verify-stage-g-m45-state-aware-workflows.mjs');
const finalizerTest=read('scripts/verify-stage-g-m45-finalizer-fail-closed.mjs');
const projectVerifier=read('verify-project.sh');
const release=read('RELEASE-STATUS-v1.43.2-STAGE-G-M45-BOARDS-COLLECTION-ROUTE-RECOVERY.md');
const doc=read('M45-BOARDS-COLLECTION-ROUTE-RECOVERY.md');
const readme=read('README.md');
const pkg=JSON.parse(read('package.json'));
const inventory=JSON.parse(read('regression-baseline/m37-functional-regression-inventory.json'));
const arch=Number(manifest.match(/architectureVersion:\s*(\d+)/)?.[1]||0);
const state=target.match(/activationState:\s*'([^']+)'/)?.[1]||'unknown';
const m44State=m44.match(/activationState:\s*'([^']+)'/)?.[1]||'unknown';
const renderBoardsSource=boardsUi.slice(boardsUi.indexOf('function renderBoards()'), boardsUi.indexOf('function attachListEvents(): void'));
const attachListEventsSource=boardsUi.slice(boardsUi.indexOf('function attachListEvents(): void'), boardsUi.indexOf('function openCreateBoard(): void'));
const renderBoardSource=boardsUi.slice(boardsUi.indexOf('function renderBoard(boardId: string): void'), boardsUi.indexOf('function closeColumnMenus'));
const attachBoardEventsSource=boardsUi.slice(boardsUi.indexOf('function attachBoardEvents(): void'), boardsUi.indexOf('function openEditBoard(): void'));

check(arch>=53,'Architecture 53+ preserves M45 Boards collection recovery');
check(m44State==='active-certified','M44 active-certified prerequisite');
check(target.includes('milestone: 45')&&target.includes("stage: 'G'")&&target.includes('architectureVersion: 53'),'M45 target identity');
check(['implementation-complete-pending-certification','active-certified'].includes(state),'M45 activation state is recognized');
for(const token of ["featureOwner: 'boards'","collectionController: 'assets/js/boards-ui.ts'","dataController: 'assets/js/features/boards/controllers/board-data-controller.ts'","repository: 'assets/js/features/boards/data/board-repository.ts'","collectionView: 'assets/js/features/boards/views/board-list-view.ts'","browser: 'tests/modern/e2e/boards-collection-route-recovery.spec.mjs'"]) check(target.includes(token),`M45 target authority token ${token}`);
check(target.includes('M46 remains responsible for deployed wm_* Board RPC/schema capability recovery'),'M45 preserves M46 backend boundary');
check(target.includes('M26 same-origin iframe compatibility'),'M45 preserves M26 compatibility boundary');
check(target.includes('M54 remains responsible for final production-readiness certification'),'M45 preserves M54 production boundary');

check(manifest.includes("boardCollectionRecovery: 'lifecycle-routed-collection-authority-v1'"),'manifest declares M45 Board collection recovery');
check(manifest.includes("boardCollectionController: 'assets/js/boards-ui.ts'"),'manifest declares M45 collection controller');
check(manifest.includes("boardCollectionDataController: 'assets/js/features/boards/controllers/board-data-controller.ts'"),'manifest declares M45 data controller');
check(manifest.includes("boardCollectionRepository: 'assets/js/features/boards/data/board-repository.ts'"),'manifest declares M45 repository');
check(manifest.includes("boardCollectionRoutePolicy: 'active-only-board-workspace-v1'"),'manifest declares active-only workspace route policy');
check(manifest.includes("boardCollectionBrowser: 'tests/modern/e2e/boards-collection-route-recovery.spec.mjs'"),'manifest declares M45 browser authority');
check(manifest.includes("{ id: 'boards', pattern: '#/boards', owner: 'boards' }"),'Boards collection route owner remains boards');
check(manifest.includes("{ id: 'board', pattern: '#/boards/:boardId', owner: 'boards' }"),'Board detail route owner remains boards');
for(const field of ['boardCollectionRecovery?','boardCollectionController?','boardCollectionDataController?','boardCollectionRepository?','boardCollectionRoutePolicy?','boardCollectionBrowser?']) check(types.includes(field),`manifest type models ${field}`);
for(const field of ['boardCollectionRecovery:','boardCollectionController:','boardCollectionDataController:','boardCollectionRepository:','boardCollectionRoutePolicy:','boardCollectionBrowser:']) check(schema.includes(field),`runtime schema models ${field}`);
check(schema.includes('manifest.architectureVersion >= 53')&&schema.includes("boardCollectionRecovery !== 'lifecycle-routed-collection-authority-v1'")&&schema.includes("boardCollectionRoutePolicy !== 'active-only-board-workspace-v1'"),'runtime schema enforces M45 Architecture 53 contract');

check(listView.includes("const interactive = board.status === 'active';"),'only active Board cards are interactive');
check(listView.includes('role="link" tabindex="0"'),'active cards retain keyboard-open semantics');
check(listView.includes('data-board-lifecycle="${board.status}"'),'Board card publishes lifecycle authority');
check(listView.includes("const menu = actions ?")&&listView.includes(" : '';"),'empty lifecycle menus are suppressed');
check(listView.includes('data-status="archived"')&&listView.includes('data-status="trashed"'),'active list exposes archive/trash transitions');
check(listView.includes('data-status="active"')&&listView.includes('data-board-delete'),'inactive lists expose restore/permanent-delete lifecycle actions');
check(listView.includes('`${board.name} ${board.description}`.toLowerCase().includes(q)'),'search covers Board name and description');
check(listView.includes("state.status === 'archived' ? 'No archived boards' : 'Trash is empty'"),'Archive and Trash empty states remain lifecycle-specific');

check(boardsUi.includes("card.dataset.boardLifecycle === 'active'"),'mouse card opening is lifecycle-gated');
check((boardsUi.match(/dataset\.boardLifecycle === 'active'/g)||[]).length>=2,'mouse and keyboard card opening both lifecycle-gated');
check(boardsUi.includes('onLifecycleMismatch: (board) =>'),'Board UI handles inactive direct-route loads');
check(boardsUi.includes('state.status = board.status;')&&boardsUi.includes("navigate('boards');"),'inactive direct routes return to matching collection');
check(boardsUi.includes("await loadBoards('active');")&&boardsUi.includes('navigate(`boards/${id}`)'),'creation refreshes Active before opening');
check(boardsUi.includes('const duplicateId = await commandService.duplicateBoard(boardId);')&&boardsUi.includes('navigate(`boards/${duplicateId}`)'),'duplicate navigation remains explicit');
check((boardsUi.match(/await loadBoards\('active'\);/g)||[]).length>=3,'create/list-detail duplicate flows prime Active collection');
check((boardsUi.match(/await loadBoards\(state\.status\);/g)||[]).length>=2,'list lifecycle/delete flows await current collection refresh');
check(boardsUi.includes('await loadBoards(status);')&&boardsUi.includes("navigate('boards');"),'detail archive/trash refreshes destination collection before collection navigation');
check(boardsUi.includes("function hasActiveBoard(){return state.board?.board?.status === 'active';}"),'workspace lifecycle guard is explicit');
check(boardsUi.includes('function canEdit(){return hasActiveBoard()')&&boardsUi.includes('function canManage(){return hasActiveBoard()'),'edit/manage capabilities require active lifecycle');

check(dataController.includes('onLifecycleMismatch?: ((board: BoardRecord) => void) | null'),'data controller models lifecycle mismatch hook');
check(dataController.includes("data.board.status !== 'active'"),'data controller rejects inactive Board detail payload');
check(dataController.includes('state.board = null')&&dataController.includes('onLifecycleMismatch?.(data.board)'),'inactive Board payload is cleared and routed through mismatch authority');
check(dataController.indexOf("data.board.status !== 'active'") < dataController.indexOf('onBoardLoaded?.()'),'lifecycle rejection precedes Board-loaded side effects');
check(repository.includes("rpc('wm_list_boards'")&&repository.includes("rpc('wm_create_board_configured'")&&repository.includes("rpc('wm_duplicate_board'")&&repository.includes("rpc('wm_set_board_status'")&&repository.includes("rpc('wm_delete_board_permanently'"),'Board repository retains typed RPC lifecycle authority');

const brd1=inventory.entries.find((entry)=>entry.id==='M37-BRD-001');
const brd2=inventory.entries.find((entry)=>entry.id==='M37-BRD-002');
check(brd1?.status==='resolved-m45','M37-BRD-001 is explicitly resolved by M45');
check(JSON.stringify(brd1).includes('M45')&&JSON.stringify(brd1).includes('M40'),'M37-BRD-001 resolution cites M40+M45 evidence');
check(brd2?.status==='documented-runtime-signature','M37-BRD-002 remains unresolved runtime signature');
check(JSON.stringify(brd2).includes('M46'),'M37-BRD-002 remains assigned to M46');

for(const tag of ['@m45-collection-create-open-duplicate','@m45-lifecycle-actions','@m45-inactive-route-guard']) check(browser.includes(tag),`browser suite contains ${tag}`);
check(browser.includes("collectionTab(page, 'archived')")&&browser.includes("collectionTab(page, 'trashed')"),'browser suite exercises unambiguous Archive and Trash navigation');
check(boardsUi.includes("main.dataset.boardCollectionState = state.loading ? 'loading' : state.error ? 'error' : 'ready';")&&boardsUi.includes('main.dataset.boardCollectionStatus = state.status;'),'Boards list publishes explicit collection readiness and lifecycle status');
check(browser.includes('waitForM45CollectionReady')&&browser.includes('data-board-collection-state="ready"')&&browser.includes('data-board-collection-status'),'browser suite waits for Board-specific collection readiness instead of generic shell readiness alone');
check(boardsUi.includes("main.dataset.boardDetailState = 'loading';")&&boardsUi.includes("main.dataset.boardDetailState = 'error';")&&boardsUi.includes("main.dataset.boardDetailState = 'not-found';")&&boardsUi.includes("main.dataset.boardDetailState = 'committing';")&&boardsUi.includes("main.dataset.boardDetailState = 'ready';"),'Board detail publishes explicit loading/error/not-found/committing/ready data-commit state');
check(boardsUi.includes('function scheduleBoardDetailCommittedReady')&&boardsUi.includes('requestAnimationFrame(() =>')&&boardsUi.includes('currentMain === main')&&boardsUi.includes('main.isConnected'),'Board detail readiness is deferred to an animation-frame commit check against the current connected presentation');
check(boardsUi.includes("presentationHost?.dataset.wmBoardPresentationRoute === 'workspace'")&&boardsUi.includes("String(presentationHost?.dataset.wmBoardId ?? '') === expectedId"),'Board detail commit requires the current React presentation route to own the exact Board identifier');
check(boardsUi.includes("String(currentBoard?.name ?? '').trim() === expectedName")&&boardsUi.includes("title?.textContent?.trim() === expectedName"),'Board detail commit verifies the authoritative Board payload name against the rendered workspace title');
check(boardsUi.includes('main.dataset.boardDetailId = expectedId;')&&boardsUi.includes('main.dataset.boardDetailName = expectedName;')&&boardsUi.includes('main.dataset.boardDetailCommitRevision = String(revision);'),'Board detail publishes exact id/name/revision identity only after committed render validation');
check(boardsUi.includes('BOARD_DETAIL_COMMIT_RETRY_LIMIT = 2')&&boardsUi.includes('boardDetailCommitRetryCount += 1;')&&boardsUi.includes('queueMicrotask(() =>')&&boardsUi.includes('renderBoardData();'),'Board detail commit performs a bounded source-level rerender recovery instead of unbounded polling or timeout inflation');
check(browser.includes("toHaveAttribute('data-board-detail-state', 'ready')")&&browser.includes("toHaveAttribute('data-board-detail-id', boardId)")&&browser.includes("toHaveAttribute('data-board-detail-name', boardName)"),'browser suite waits for exact Board detail committed id/name readiness');
check(browser.includes("toHaveAttribute('data-board-detail-commit-id', boardId)")&&browser.includes("toHaveAttribute('data-board-detail-commit-name', boardName)")&&browser.includes("locator('#board-workspace-title')).toHaveText(boardName)"),'browser suite consumes the header commit marker and rendered title before returning detail readiness');
check(browser.includes("boardMain.locator('[data-board-workspace-shell]')")&&browser.includes('toBeVisible()'),'browser detail readiness also requires the committed workspace shell to be visible');
check(boardsUi.includes('data-board-create-name')&&boardsUi.includes('data-board-create-description'),'create-board dialog publishes distinct deterministic control identities for name and description');
check(boardsUi.includes('submittedName !== nameControl.value || submittedDescription !== descriptionControl.value'),'create-board submission fails closed if FormData diverges from the live named controls');
check(boardsUi.includes('const draft = Object.freeze({')&&boardsUi.includes('name: nameControl.value.trim(),')&&boardsUi.includes('description: descriptionControl.value,'),'create-board command consumes one immutable snapshot with separate name and description values');
check(browser.includes("createDialog.locator('[data-board-create-name]')")&&browser.includes("createDialog.locator('[data-board-create-description]')"),'browser suite targets deterministic create-board controls rather than fuzzy textbox discovery');
check(browser.includes("toHaveAccessibleName('Board name')")&&browser.includes("toHaveAccessibleName('Description')"),'browser suite preserves accessible labels for both create-board controls');
check(browser.includes("toHaveValue('M45 Created Board')")&&browser.includes("toHaveValue('Created through M45 collection recovery')"),'browser suite proves both DOM control values immediately before submission');
check(browser.includes("contentType).toContain('application/json')"),'browser suite proves the create RPC uses the JSON transport contract');
check(browser.includes("JSON.parse(createCalls[0]?.rawBody || '{}')")&&browser.includes("p_description: 'Created through M45 collection recovery'"),'browser suite proves the raw create RPC JSON keeps name and description separate');
check(browser.includes("body?.p_name).toBe('M45 Created Board')")&&browser.includes("body?.p_description).toBe('Created through M45 collection recovery')"),'browser suite proves the parsed create RPC carries both requested fields before detail readiness assertions');
check(fixture.includes("const rawBody = request.postData() ?? ''")&&fixture.includes('JSON.parse(rawBody)'),'M45 fixture parses the raw transport JSON directly instead of relying on convenience request decoding');
check(fixture.includes("contentType = request.headers()['content-type']")&&fixture.includes('rawBody, contentType'),'M45 fixture retains raw body and content type for deterministic transport diagnostics');
check(browser.includes('waitForM39BackendPreflight')&&browser.includes("await waitForM39BackendPreflight(page, 'boards');"),'browser setup waits for authoritative Boards backend preflight before final shell/collection readiness');
check(browser.indexOf("await waitForM39BackendPreflight(page, 'boards');") < browser.indexOf('await waitForM40ApplicationReady(page);')&&browser.indexOf('await waitForM40ApplicationReady(page);') < browser.indexOf('await waitForM45CollectionReady(page, expectedStatus);'),'browser readiness ordering is preflight -> final M40 shell stability -> M45 collection readiness');
check(browser.includes('.board-floating-menu:not([hidden])')&&browser.includes("toHaveAttribute('aria-expanded', 'true')"),'browser menu helper waits for the authoritative expanded/visible menu state');
check(browser.includes("getByRole('searchbox'")||browser.includes('[data-board-search]'),'browser suite exercises search');
check(browser.includes('wm_create_board_configured')&&browser.includes('wm_duplicate_board'),'browser suite verifies create and duplicate RPC effects');
check(browser.includes('wm_set_board_status')&&browser.includes('wm_delete_board_permanently'),'browser suite verifies lifecycle and permanent delete RPC effects');
check(['wm_list_boards','wm_get_board','wm_create_board_configured','wm_duplicate_board','wm_set_board_status','wm_delete_board_permanently'].every((rpc)=>fixture.includes(rpc)),'M45 browser fixture owns full collection RPC contract');
check(fixture.includes("request.method() === 'OPTIONS'")&&fixture.includes("'access-control-allow-methods': 'POST, OPTIONS'"),'M45 browser fixture handles CORS preflight without recording or executing Board RPC mutations');
check(browser.includes('/#\\/boards\\/board-duplicate-\\d+$/')&&!browser.includes('board-duplicate-2'),'duplicate browser assertion follows the server-returned identifier shape instead of incidental fixture counter sequencing');
check(boardsUi.includes('let listEventBinding: AbortController | null = null;')&&boardsUi.includes('let boardEventBinding: AbortController | null = null;'),'Boards route event ownership uses explicit abortable bindings');
check(renderBoardsSource.includes('releaseBoardEventBinding();')&&renderBoardSource.includes('releaseListEventBinding();'),'Boards list/detail transitions release the opposite preserved-root event binding before presentation replacement');
check(renderBoardsSource.includes('boardResizeCleanup?.();')&&renderBoardsSource.includes('dragDrop?.dispose();')&&renderBoardsSource.includes('structureDrag.dispose();')&&renderBoardsSource.includes('columnResize.dispose();'),'Boards collection transition releases detail-only viewport and drag/resize interaction authority');
check(renderBoardsSource.includes('tableVirtualization.reset();')&&renderBoardsSource.includes('cancelAnimationFrame(virtualizationFrame);')&&renderBoardsSource.includes('cancelAnimationFrame(virtualizationMeasureFrame);'),'Boards collection transition clears detail virtualization state and deferred frames');
check(attachListEventsSource.includes('listEventBinding = new AbortController();')&&attachListEventsSource.includes("root.addEventListener('click', async (event: MouseEvent) =>")&&attachListEventsSource.includes('}, { signal });'),'Boards collection handlers are bound through one abortable listener owner');
check(attachBoardEventsSource.includes('boardEventBinding = new AbortController();')&&attachBoardEventsSource.includes("root.addEventListener('click', async (event: MouseEvent) =>")&&attachBoardEventsSource.includes('}, { signal });'),'Board detail handlers are bound through one abortable listener owner');
check(!boardsUi.includes("root.dataset.bound === '1'"),'Boards route handlers no longer rely on removable data-bound attributes for listener ownership');
check(browser.includes('waitForM45BoardDetailReady')&&browser.includes('data-wm-board-presentation-route="workspace"'),'browser suite waits for committed Board detail presentation instead of hash change alone');
check(browser.includes("await expect.poll(() => fixture.calls('wm_duplicate_board').length")&&browser.includes("message:'duplicate-board action should reach the authoritative RPC'")&&browser.indexOf("await expect.poll(() => fixture.calls('wm_duplicate_board').length") < browser.indexOf('const duplicateDetail = await waitForM45BoardDetailReady'),'duplicate RPC cardinality is asynchronously proven before detail-render assertions');
check(deterministic.includes('assert.ok(checks>=14)'),'deterministic suite requires complete minimum check set');
check(!deterministic.includes('check(async()=>{})'),'deterministic suite contains no no-op check');
check(runner.includes('boards-collection-route-recovery.spec.mjs')&&runner.includes('scenarios=3'),'browser runner is scoped to three M45 scenarios');

check(m44Verifier.includes("check(arch>=52"),'M44 historical verifier accepts Architecture 53+');
for(const wf of [[m43Workflow,'M43'],[m44Workflow,'M44'],[workflow,'M45']]) {
  check(wf[0].includes('id: milestone_state')&&wf[0].includes("state=active-certified")&&wf[0].includes("state=pending"),`${wf[1]} workflow is milestone-state aware`);
  check(wf[0].includes("steps.milestone_state.outputs.state == 'active-certified'")&&wf[0].includes("steps.milestone_state.outputs.state == 'pending'"),`${wf[1]} workflow separates regression from certification`);
}
check(workflow.includes('M45_SOURCE_COMMIT: ${{ github.sha }}')&&workflow.includes('M45_EXPECTED_SOURCE_COMMIT: ${{ github.sha }}'),'M45 workflow binds certification and independent artifact verification to exact SHA');
check(workflow.includes('if-no-files-found: error'),'M45 hosted artifact publication is fail-closed');
check(workflowVerifier.includes("Stage G M45 state-aware workflow verification: PASS")&&workflowVerifier.includes("M43 no longer certifies every push unconditionally")&&workflowVerifier.includes("M44 no longer certifies every push unconditionally"),'state-aware workflow verifier covers M43/M44/M45 and superseded push-certification regression');

for(const command of ['boards-collection:check','boards-collection:test','boards-collection:browser','boards-collection:status','boards-collection:verify:release','boards-collection:certify','boards-collection:package']) check(typeof pkg.scripts?.[command]==='string',`package script ${command} is registered`);
check(pkg.scripts?.check?.includes('npm run boards-collection:check')&&pkg.scripts?.check?.includes('npm run boards-collection:test')&&pkg.scripts?.check?.includes('npm run boards-collection:workflows'),'aggregate check includes M45 static, deterministic, and workflow governance gates');
check(pkg.scripts?.['release:check']?.includes('npm run boards-collection:check')&&pkg.scripts?.['release:check']?.includes('npm run boards-collection:test')&&pkg.scripts?.['release:check']?.includes('npm run boards-collection:workflows')&&pkg.scripts?.['release:check']?.includes('npm run boards-collection:browser'),'aggregate release:check includes all M45 release gates including browser verification');
check(typeof pkg.scripts?.['boards-collection:finalizer:test']==='string'&&pkg.scripts.check.includes('npm run boards-collection:finalizer:test')&&pkg.scripts['release:check'].includes('npm run boards-collection:finalizer:test'),'M45 finalizer fail-closed simulation is registered in aggregate check and release paths');
check(finalizerTest.includes('invalid commit binding')&&finalizerTest.includes('source mutation during pre-gates')&&finalizerTest.includes('prior certified artifacts')&&finalizerTest.includes('deterministic staging parity')&&finalizerTest.includes('commitFixture')&&finalizerTest.includes('reached-post-state-gate'),'M45 finalizer simulation covers provenance, source drift, prior-artifact preservation, exact-commit staging, and successful staging parity');
check(projectVerifier.includes('verify-stage-g-m45-boards-collection-route-recovery.mjs')&&projectVerifier.includes('config/stage-g-m45-boards-collection-route-recovery-target.ts'),'aggregate project verifier requires M45 governance files');
check(releaseVerifier.includes('npm run boards-collection:check')&&releaseVerifier.includes('npm run boards-collection:test')&&releaseVerifier.includes('npm run boards-collection:browser'),'M45 release verifier starts with dedicated M45 gates');
check(releaseVerifier.includes('npm run management-authority:browser')&&releaseVerifier.includes('npm run route-lifecycle:browser'),'M45 release verifier retains M44/M40 browser regressions');
check(releaseVerifier.includes('npm run verify')&&releaseVerifier.includes('npm run build'),'M45 release verifier includes historical and production build gates');
check(finalizer.includes('M45_SOURCE_COMMIT')&&finalizer.includes('implementation-complete-pending-certification')&&finalizer.includes('active-certified'),'M45 finalizer models pending-to-certified transaction');
check(finalizer.includes('stage-g-m45-certification-tree.mjs')&&finalizer.includes('verify-stage-g-m45-certified-artifact.mjs'),'M45 finalizer binds tree digest and artifact verifier');
check(finalizer.includes('git archive --format=tar')&&finalizer.includes('git rev-parse HEAD')&&finalizer.includes('git cat-file -e')&&finalizer.includes('--compare'),'M45 finalizer stages candidates from the exact bound Git commit with canonical tracked bytes/modes and parity diagnostics');
check(tree.includes('compareM45CertificationTrees')&&tree.includes("['type','mode','sha256']")&&tree.includes("mode:'120000'")&&tree.includes("'100755' : '100644'")&&tree.includes('0o111')&&tree.includes('`${field}-mismatch`'),'M45 certification tree comparator binds path/type/content and Git-significant executable mode without ambient rw-bit drift');
check(artifactVerifier.includes('M45_EXPECTED_SOURCE_COMMIT')&&artifactVerifier.includes('computeM45CertificationTreeDigest'),'artifact verifier binds exact commit and certification tree');
check(tree.includes("'CHECKSUMS.sha256'")&&tree.includes('stage-g-m45-boards-collection-route-recovery-target.ts')&&tree.includes('M45-BOARDS-COLLECTION-ROUTE-RECOVERY'),'certification tree excludes only self-referential M45 state/checksum records');
check(doc.includes('M37-BRD-002 remains open for M46')&&release.includes('M46 owns deployed `wm_*` Board RPC/schema capability recovery'),'M45 documentation preserves backend boundary');
check(readme.includes('M45')||readme.includes('Boards Collection & Route Recovery'),'README exposes current M45 recovery state');
check(!fs.readdirSync('supabase/migrations').some((name)=>/m45/i.test(name)),'M45 introduces no Supabase migration and does not blur M46 backend scope');

const hygieneFiles=[
  'verify-stage-g-m45-boards-collection-route-recovery.mjs',
  'verify-stage-g-m45-state-aware-workflows.mjs',
  'scripts/verify-stage-g-m45-finalizer-fail-closed.mjs',
  'scripts/verify-boards-collection-route-recovery-execution.mjs',
  'scripts/lib/stage-g-m45-certification-tree.mjs',
  'scripts/verify-stage-g-m45-release.sh',
  'scripts/finalize-stage-g-m45.sh',
  'scripts/verify-stage-g-m45-certified-artifact.mjs',
  '.github/workflows/boards-collection-route-recovery.yml',
  '.github/workflows/settings-functional-recovery.yml',
  '.github/workflows/management-authority-consolidation.yml',
];
for(const file of hygieneFiles){const text=read(file);check(!text.split('\n').some((line)=>/[ \t]+$/.test(line)),`${file} has no trailing whitespace`);}

assert.ok(checks>=95,`expected at least 95 M45 static checks, got ${checks}`);
console.log(`Stage G M45 Boards Collection & Route Recovery static verification: PASS (architecture=${arch}; state=${state}; checks=${checks}; browserScenarios=3)`);

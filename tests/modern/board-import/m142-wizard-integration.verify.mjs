import fs from 'node:fs';
import assert from 'node:assert/strict';
const read=(path)=>fs.readFileSync(path,'utf8');
const ui=read('assets/js/features/boards/controllers/board-import-wizard-ui.ts');
const css=read('assets/css/board-import-wizard.css');
const board=read('assets/js/boards-ui.ts');
const plan=read('src/features/boards/import/board-import-wizard-plan.ts');
const checks=[
 ['three screen stages',ui.includes("step:'upload'")&&ui.includes("'map-columns'")&&ui.includes("'handle-matches'")],
 ['file upload and drag/drop',ui.includes('data-wizard-file')&&ui.includes("addEventListener('drop'")],
 ['worksheet revalidation',ui.includes('data-wizard-sheet')&&ui.includes('parse(state.file,target.value)')],
 ['source to destination mapping',ui.includes('data-wizard-mapping')&&ui.includes('data-wizard-new-name')&&ui.includes('data-wizard-new-type')],
 ['existing/new group mapping',ui.includes('data-wizard-group')&&ui.includes('data-wizard-group-name')],
 ['all three matching choices',ui.includes('value="add-new"')&&ui.includes('value="skip"')&&ui.includes('value="update"')],
 ['commit only after full validation',ui.includes("'Import Now',!plan.configurationValid||Boolean(commitIssue)")&&ui.includes('createBoardImportWizardRpcRequest(')&&ui.includes('const result=await commitWizard(request)')],
 ['existing importer escape hatch',ui.includes('data-wizard-classic')&&ui.includes('openExistingImporter()')],
 ['board RBAC precondition',ui.includes('if (!canEdit())')],
 ['overlay lifecycle',ui.includes('overlayCoordinator.open')&&ui.includes('overlayCoordinator.release')],
 ['focus and escape keyboard',ui.includes("event.key==='Tab'")&&ui.includes("event.key==='Escape'")],
 ['M103 importer kept separate',!ui.includes('.importItemsAtomic(')&&!ui.includes('wm_import_board_items_atomic')],
 ['main Board imports wizard',board.includes('createBoardImportWizardUi')&&board.includes('importWizard.open()')],
 ['original importer preserved',board.includes('createBoardImportWorkflow')&&board.includes('openExistingImporter: () => importWorkflow.open()')],
 ['new stylesheet scoped',css.includes('.wm-import-wizard-backdrop')&&css.includes('prefers-reduced-motion')],
 ['planner invoked for validation',ui.includes('planBoardImportWizard(dataset,currentBoard,draft())')],
 ['nonmutating planner',plan.includes('mutationAllowed: false as const')],
];
for(const [name,yes] of checks){assert.equal(yes,true,name);console.log(`PASS: ${name}`);}
console.log(`M142 static integration/interaction assertions: ${checks.length} PASS (dedicated live wizard E2E remains pending)`);

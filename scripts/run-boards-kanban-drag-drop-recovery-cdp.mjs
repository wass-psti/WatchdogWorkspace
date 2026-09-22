import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { stripTypeScriptTypes } from 'node:module';
import { findBrowserBinary, captureBrowserDom } from './lib/browser-cdp-smoke.mjs';

const root=resolve(import.meta.dirname,'..');
const modules=[
  {
    key:'boardMove',
    file:'assets/js/features/boards/services/board-move-state.ts',
    exports:['snapshotBoardItemMoveState','restoreBoardItemMoveState','applyBoardItemMove','assertUniqueCanonicalItemIds'],
  },
  {
    key:'viewSwitch',
    file:'assets/js/features/boards/controllers/view-switch-controller.ts',
    exports:['createBoardViewSwitchController'],
  },
  {
    key:'kanban',
    file:'assets/js/features/boards/views/kanban-view.ts',
    exports:['buildBoardKanbanLanes','renderBoardKanbanView'],
  },
  {
    key:'drag',
    file:'assets/js/features/boards/controllers/drag-drop-controller.ts',
    exports:['createBoardDragDropController'],
    prelude:'const { applyBoardItemMove, assertUniqueCanonicalItemIds, restoreBoardItemMoveState, snapshotBoardItemMoveState } = globalThis.__m49.boardMove;',
  },
  {
    key:'structure',
    file:'assets/js/features/boards/controllers/structure-drag-controller.ts',
    exports:['reorderBoardStructureLocal','restoreBoardStructurePositions','createBoardStructureDragController'],
  },
];

const stripModuleSyntax=(source)=>stripTypeScriptTypes(source,{mode:'transform',sourceMap:false})
  .replace(/^\s*import\s+type[\s\S]*?from\s+['"][^'"]+['"];\s*$/gm,'')
  .replace(/^\s*import[\s\S]*?from\s+['"][^'"]+['"];\s*$/gm,'')
  .replace(/^\s*import\s+['"][^'"]+['"];\s*$/gm,'')
  .replace(/\bexport\s+(?=(?:async\s+)?(?:function|const|let|var|class)\b)/g,'');

const moduleParts=['globalThis.__m49 = Object.create(null);'];
for(const module of modules){
  const source=stripModuleSyntax(await readFile(resolve(root,module.file),'utf8'));
  moduleParts.push(`(() => {\n${module.prelude??''}\n${source}\nglobalThis.__m49.${module.key} = { ${module.exports.join(', ')} };\n})();`);
}

let fixture=await readFile(resolve(root,'tests/m49-cdp/m49-cdp-browser-fixture.mjs'),'utf8');
fixture=fixture.replace(/^import[^;]+;\s*$/gm,'');
const fixturePrelude=`const { renderBoardKanbanView, buildBoardKanbanLanes } = globalThis.__m49.kanban;\nconst { createBoardDragDropController } = globalThis.__m49.drag;\nconst { createBoardStructureDragController } = globalThis.__m49.structure;\nconst { createBoardViewSwitchController } = globalThis.__m49.viewSwitch;`;
const js=`${moduleParts.join('\n\n')}\n\n${fixturePrelude}\n${fixture}`.replace(/<\/script/gi,'<\\/script');
const html=`<!doctype html><html><head><meta charset="utf-8"><title>M49 CDP</title></head><body><main id="root"></main><output id="result" data-state="running">running</output><script type="module">${js}</script></body></html>`;
const browser=await findBrowserBinary();
const result=await captureBrowserDom(browser,'about:blank',{
  documentHtml:html,
  timeoutMs:20_000,
  ready:(dom)=>dom.includes('data-state="pass"')||dom.includes('data-state="fail"'),
});
assert.match(result.dom,/data-state="pass"/,`M49 browser fixture failed:\n${result.dom.slice(-6000)}`);
for(const token of ['lanes=true','keyboard=true','rollback=true','structure=true','view=true','concurrency=true']) assert.ok(result.dom.includes(token),`missing M49 browser result token ${token}`);
console.log('Stage G M49 Boards Kanban & Drag/Drop Recovery CDP browser verification: PASS (lanes=true; keyboard=true; rollback=true; structure=true; view=true; concurrency=true)');

/** M109 additive board identity/menu/performance contract checks. No live writes. */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { startingColumns, PRIMARY_ITEM_COLUMN } from '../assets/js/features/boards/board-schema.ts';
const repo=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const text=(p)=>fs.readFileSync(path.join(repo,p),'utf8');
const s=(p)=>crypto.createHash('sha256').update(fs.readFileSync(path.join(repo,p))).digest('hex');
assert.deepEqual(PRIMARY_ITEM_COLUMN,{key:'__item',name:'Item Name',required:true,position:0});
assert.equal(startingColumns([]).length,0,'Empty setup must contain only the virtual primary item field');
const custom=startingColumns(['text','status','text']);
assert.deepEqual(custom.map(x=>x.name),['New Text','New Status','New Text 2']);
assert(custom.every(x=>x.data_type!=='item_name' && x.data_type!=='title'));
const form=text('assets/js/boards-ui.ts');
const view=text('assets/js/features/boards/views/table-view.ts');
const storage=text('supabase/migrations/v1.21.4-flexible-board-creation.sql');
assert(form.includes('data-board-primary-column') && form.includes('PRIMARY_ITEM_COLUMN.name'));
assert(form.includes("mode === 'custom' ? fd.getAll('setup_column').map(String) : []"));
assert(form.includes('const columns = startingColumns(types)'));
assert(view.includes('data-column-width-key="__item"') && view.includes('PRIMARY_ITEM_COLUMN.name'));
assert(view.indexOf('data-column-width-key="__item"')<view.indexOf('${renderedColumns.map('),'Item identity must precede optional column schema');
assert(storage.includes('insert into public.work_board_items')===false || storage.includes('title'),'Do not replace existing item title identity');
const menu=text('assets/js/features/boards/controllers/board-menu-controller.ts');
assert(menu.includes("overlayLayer.setAttribute('popover', 'manual')"));
assert(menu.includes('overlayLayer.showPopover()') && menu.includes('overlayLayer.hidePopover()'));
assert(menu.includes('    position(); // No one-frame delay'));
assert(menu.includes("if (activeTrigger !== trigger || target.hidden) return"));
const manager=text('assets/js/features/boards/controllers/column-workflows.ts');
assert(manager.includes('data-primary-item-column=\"true\"') && manager.includes('PRIMARY_ITEM_COLUMN.name'));
const css=text('assets/css/app.css');
assert(css.includes('.board-overlay-layer[popover]') && css.includes('pointer-events: none;'));
assert(form.includes('let itemSearchFrame = 0;') && /itemSearchFrame = requestAnimationFrame\(\(\) => \{[\s\S]*?itemSearchFrame = 0;[\s\S]*?renderBoardViewOnly\(\);[\s\S]*?\}\);/.test(form), 'Board search must preserve inherited animation-frame coalescing');
assert(!form.includes('itemSearchTimer') && !form.includes('}, 85);'), 'Disallow timer debounce that violates the certified interaction contract');
// Historical M77/M78 no-drift remains enforceable except for four exact M109 source hashes.
const protectedGuard = text('scripts/verify-stage-i-m78-visual-system-foundation-execution.mjs');
for (const [relative, approvedHash] of [
  ['assets/js/features/boards/board-schema.ts', '9b7d0a55bb47a85436d29801d7fd62beea44cb0944a016843b6a33994e61cce1'],
  ['assets/js/features/boards/controllers/board-menu-controller.ts', '303c39ff27de01d112dbd5f0a541ee51ee2a24acd50feee7312c97d11670449b'],
  ['assets/js/features/boards/controllers/column-workflows.ts', 'd86b8ca16a694c699cca7a7fe211aa6e3d581601f20bf1897ab17fbcb8fbd36d'],
  ['assets/js/features/boards/views/table-view.ts', '575a944f918d4134b456671dc7b88e65e309e64c0d7764900afaf2aad00f8076'],
]) {
  assert.equal(s(relative), approvedHash, `M109 protected source mutation drift: ${relative}`);
  assert(protectedGuard.includes(approvedHash) && protectedGuard.includes(relative), `M78 guard lacks exact successor authorization: ${relative}`);
}
assert.equal(s('assets/js/core/auth.ts'),'b93073bd4b5a37359e5c8d499deb7f63a5e8edf448170ec4bb57aba30c76c511');
console.log('PASS M109: both board-creation paths, nonduplicated immutable identity, first-column table order, top-layer dropdown, immediate placement, frame-coalesced search, approved auth hash');

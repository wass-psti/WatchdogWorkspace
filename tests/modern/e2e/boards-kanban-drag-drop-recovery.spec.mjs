import { test, expect } from '@playwright/test';
import {
  installM39Fixture,
  seedM39Session,
  waitForM39Identity,
  waitForM39BackendPreflight,
  waitForM40ApplicationReady,
} from './helpers/m39-auth-fixture.mjs';
import { installM49BoardsKanbanFixture, M49_BOARD_ID } from './helpers/m49-boards-kanban-fixture.mjs';

async function waitForBoard(page, view = 'table') {
  const host = page.locator(`[data-wm-board-presentation-host][data-wm-board-presentation-route="workspace"][data-wm-board-id="${M49_BOARD_ID}"]`);
  await expect(host).toBeVisible();
  const detail = host.locator('.board-detail-page');
  await expect(detail).toBeVisible();
  await expect(detail.locator('.button-spinner')).toHaveCount(0);
  if (view === 'kanban') await expect(detail.getByRole('region', { name:/Board Kanban view/ })).toBeVisible();
  else await expect(detail.getByRole('region', { name:'Board main table' })).toBeVisible();
  return detail;
}

async function setup(page) {
  await seedM39Session(page, { principal:'admin' });
  await installM39Fixture(page, { principal:'admin' });
  const fixture = await installM49BoardsKanbanFixture(page);
  await page.goto(`/#/boards/${M49_BOARD_ID}`);
  await waitForM39Identity(page, { role:'admin_general_manager' });
  await waitForM39BackendPreflight(page, 'boards');
  await waitForM40ApplicationReady(page);
  const detail = await waitForBoard(page, 'table');
  return { fixture, detail };
}

const group = (page, title) => page.locator('.board-group').filter({ has:page.locator('.group-title-inline span', { hasText:title }) });
const row = (page, title) => page.locator('.board-item-row').filter({ has:page.locator('.item-inline-title', { hasText:title }) });
const lane = (page, name) => page.locator('[data-kanban-lane]').filter({ has:page.getByRole('heading', { name, exact:true }) });
const card = (page, title) => page.locator('.kanban-card').filter({ has:page.getByRole('button', { name:`Open ${title}` }) });
const itemState = (fixture, id) => fixture.snapshot().items.find((entry)=>entry.id===id);
const canonicalItems = (fixture) => fixture.snapshot().items.map(({id,group_id,position,status})=>({id,group_id,position,status})).sort((a,b)=>a.id.localeCompare(b.id));

async function switchView(page, name) {
  await page.getByRole('tab', { name, exact:true }).click();
  await expect(page.getByRole('tab', { name, exact:true })).toHaveAttribute('aria-selected','true');
  await waitForBoard(page, name === 'Kanban' ? 'kanban' : 'table');
}

async function nativeDrag(source, target) {
  const dataTransfer = await source.evaluateHandle(() => new DataTransfer());
  try {
    await source.dispatchEvent('dragstart', { dataTransfer });
    await target.dispatchEvent('dragenter', { dataTransfer });
    await target.dispatchEvent('dragover', { dataTransfer });
    await target.dispatchEvent('drop', { dataTransfer });
    await source.dispatchEvent('dragend', { dataTransfer });
  } finally {
    await dataTransfer.dispose();
  }
}

test('@m49-kanban-render-view-switch Kanban lanes preserve canonical items and serialized Table/Kanban persistence', async ({ page }) => {
  test.setTimeout(60_000);
  const { fixture } = await setup(page);
  const before = canonicalItems(fixture);

  await switchView(page,'Kanban');
  await expect(page.locator('[data-kanban-lane]')).toHaveCount(5);
  await expect(lane(page,'To do')).toBeVisible();
  await expect(lane(page,'Doing')).toBeVisible();
  await expect(lane(page,'Done')).toBeVisible();
  await expect(lane(page,'No status')).toBeVisible();
  const legacy = lane(page,'Legacy');
  await expect(legacy).toBeVisible();
  await expect(legacy).toHaveAttribute('aria-disabled','true');
  await expect(legacy).not.toHaveAttribute('data-drop-status', /.+/);
  await expect(legacy.locator('.kanban-card')).toContainText('Charlie');
  await expect(page.locator('.kanban-card')).toHaveCount(4);
  const cardIds = await page.locator('.kanban-card').evaluateAll((nodes)=>nodes.map((node)=>node.getAttribute('data-item-id')).sort());
  expect(cardIds).toEqual(['item-a1','item-a2','item-a3','item-b1']);
  expect(canonicalItems(fixture)).toEqual(before);

  const releaseTableView = fixture.holdNext('wm_set_board_view');
  const tableClick = page.getByRole('tab', { name:'Main table', exact:true }).click();
  await expect.poll(() => fixture.calls('wm_set_board_view').at(-1)?.body.p_view).toBe('table');
  const kanbanClick = page.getByRole('tab', { name:'Kanban', exact:true }).click();
  await expect(page.getByRole('tab', { name:'Kanban', exact:true })).toHaveAttribute('aria-selected','true');
  expect(fixture.calls('wm_set_board_view').slice(-1).map((entry)=>entry.body.p_view)).toEqual(['table']);
  releaseTableView();
  await Promise.all([tableClick,kanbanClick]);
  await expect.poll(() => fixture.calls('wm_set_board_view').slice(-2).map((entry)=>entry.body.p_view)).toEqual(['table','kanban']);
  await expect(page.getByRole('tab', { name:'Kanban', exact:true })).toHaveAttribute('aria-selected','true');
  expect(fixture.snapshot().board.view_mode).toBe('kanban');
  expect(canonicalItems(fixture)).toEqual(before);

  await page.reload();
  await waitForM40ApplicationReady(page);
  await waitForBoard(page,'kanban');
  await expect(page.getByRole('tab', { name:'Kanban', exact:true })).toHaveAttribute('aria-selected','true');
  await expect(page.locator('.kanban-card')).toHaveCount(4);
});

test('@m49-item-movement keyboard/native lane movement preserves hidden Table order and rolls back failed persistence', async ({ page }) => {
  test.setTimeout(60_000);
  const { fixture } = await setup(page);
  const alphaBefore = { ...itemState(fixture,'item-a1') };

  await switchView(page,'Kanban');
  const alphaHandle = card(page,'Alpha').locator('[data-kanban-item-drag="item-a1"]');
  await alphaHandle.focus();
  await page.keyboard.press('ArrowRight');
  await expect.poll(() => itemState(fixture,'item-a1')?.status).toBe('doing');
  expect(itemState(fixture,'item-a1')?.group_id).toBe(alphaBefore.group_id);
  expect(itemState(fixture,'item-a1')?.position).toBe(alphaBefore.position);
  await expect(card(page,'Alpha')).toBeVisible();

  const delta = card(page,'Delta');
  await nativeDrag(delta, lane(page,'Done'));
  await expect.poll(() => fixture.calls('wm_move_board_item').at(-1)?.body.p_item_id).toBe('item-b1');
  expect(fixture.calls('wm_move_board_item').at(-1)?.body.p_status).toBe('done_custom');
  await expect.poll(() => itemState(fixture,'item-b1')?.status).toBe('done_custom');
  expect(itemState(fixture,'item-b1')?.group_id).toBe('group-b');
  expect(itemState(fixture,'item-b1')?.position).toBe(0);

  fixture.failNext('wm_move_board_item',{ message:'Simulated item move failure' });
  const bravoHandle = card(page,'Bravo').locator('[data-kanban-item-drag="item-a2"]');
  await bravoHandle.focus();
  await page.keyboard.press('ArrowRight');
  await expect.poll(() => itemState(fixture,'item-a2')?.status).toBe('doing');
  await expect(card(page,'Bravo')).toBeVisible();
  await expect(page.locator('[data-board-drag-live]')).toContainText('could not be changed');

  await switchView(page,'Main table');
  const planningTitles = await group(page,'Planning').locator('.board-item-row .item-inline-title').allTextContents();
  expect(planningTitles).toEqual(['Alpha','Bravo','Charlie']);
  await expect(group(page,'Delivery').locator('.board-item-row .item-inline-title')).toHaveText(['Delta']);
  expect(itemState(fixture,'item-a1')?.position).toBe(0);
  expect(itemState(fixture,'item-a2')?.position).toBe(1);
  expect(itemState(fixture,'item-a3')?.position).toBe(2);
});

test('@m49-structure-drag-drop group/column native and keyboard movement are transactional and failure-safe', async ({ page }) => {
  test.setTimeout(60_000);
  const { fixture } = await setup(page);

  const planningHandle = group(page,'Planning').locator('[data-group-drag="group-a"]');
  await nativeDrag(planningHandle, group(page,'Delivery'));
  await expect.poll(() => fixture.calls('wm_move_board_group').at(-1)?.body.p_group_id).toBe('group-a');
  expect(fixture.calls('wm_move_board_group').at(-1)?.body.p_position).toBe(1);
  await expect.poll(() => fixture.snapshot().groups.slice().sort((a,b)=>a.position-b.position).map((entry)=>entry.id)).toEqual(['group-b','group-a']);
  await expect(page.locator('.board-group').first().locator('.group-title-inline')).toContainText('Delivery');

  fixture.failNext('wm_move_board_group',{ message:'Simulated group move failure' });
  const planningAfter = group(page,'Planning').locator('[data-group-drag="group-a"]');
  await planningAfter.focus();
  await expect(planningAfter).toBeFocused();
  await planningAfter.press('Home');
  await expect.poll(() => fixture.calls('wm_move_board_group').length, { message:'keyboard group move should reach the authoritative RPC after focus settles', timeout:10_000 }).toBeGreaterThanOrEqual(2);
  await expect(page.locator('.board-group').first().locator('.group-title-inline')).toContainText('Delivery');
  expect(fixture.snapshot().groups.slice().sort((a,b)=>a.position-b.position).map((entry)=>entry.id)).toEqual(['group-b','group-a']);

  const planningTable = group(page,'Planning').getByRole('table');
  const field2 = planningTable.locator('[data-column-drag="col-text-2"]');
  await nativeDrag(field2, planningTable.locator('th[data-column-id="col-status"]'));
  await expect.poll(() => fixture.calls('wm_move_board_column').at(-1)?.body.p_column_id).toBe('col-text-2');
  expect(fixture.calls('wm_move_board_column').at(-1)?.body.p_position).toBe(0);
  await expect.poll(() => fixture.snapshot().columns.slice().sort((a,b)=>a.position-b.position).map((entry)=>entry.id)).toEqual(['col-text-2','col-status','col-text-1']);

  fixture.failNext('wm_move_board_column',{ message:'Simulated column move failure' });
  const field1 = group(page,'Planning').getByRole('table').locator('[data-column-drag="col-text-1"]');
  await field1.focus();
  await expect(field1).toBeFocused();
  await field1.press('Home');
  await expect.poll(() => fixture.calls('wm_move_board_column').length, { message:'keyboard column move should reach the authoritative RPC after focus settles', timeout:10_000 }).toBeGreaterThanOrEqual(2);
  expect(fixture.snapshot().columns.slice().sort((a,b)=>a.position-b.position).map((entry)=>entry.id)).toEqual(['col-text-2','col-status','col-text-1']);
});

test('@m49-pending-rollback unresolved movement blocks overlapping structure/view mutations and view failure restores confirmed state', async ({ page }) => {
  test.setTimeout(60_000);
  const { fixture } = await setup(page);

  const releaseItemMove = fixture.holdNext('wm_move_board_item');
  const alphaHandle = row(page,'Alpha').locator('[data-item-drag="item-a1"]');
  await alphaHandle.focus();
  await page.keyboard.press('ArrowDown');
  await expect(page.locator('.board-detail-page')).toHaveAttribute('aria-busy','true');

  const planningHandle = group(page,'Planning').locator('[data-group-drag="group-a"]');
  await planningHandle.focus();
  await page.keyboard.press('End');
  await page.getByRole('tab', { name:'Kanban', exact:true }).click();
  expect(fixture.calls('wm_move_board_group')).toHaveLength(0);
  expect(fixture.calls('wm_set_board_view')).toHaveLength(0);
  await expect(page.getByRole('tab', { name:'Main table', exact:true })).toHaveAttribute('aria-selected','true');
  releaseItemMove();

  await expect.poll(() => fixture.calls('wm_move_board_item').length).toBe(1);
  await expect.poll(() => page.locator('.board-detail-page').getAttribute('aria-busy')).toBeNull();
  expect(fixture.snapshot().items.filter((entry)=>entry.group_id==='group-a').sort((a,b)=>a.position-b.position).map((entry)=>entry.title)).toEqual(['Bravo','Alpha','Charlie']);

  fixture.failNext('wm_set_board_view',{ message:'Simulated view persistence failure' });
  await page.getByRole('tab', { name:'Kanban', exact:true }).click();
  await expect.poll(() => fixture.calls('wm_set_board_view').length).toBe(1);
  await expect(page.getByRole('tab', { name:'Main table', exact:true })).toHaveAttribute('aria-selected','true');
  await expect(page.getByRole('region', { name:'Board main table' })).toBeVisible();
  expect(fixture.snapshot().board.view_mode).toBe('table');
});

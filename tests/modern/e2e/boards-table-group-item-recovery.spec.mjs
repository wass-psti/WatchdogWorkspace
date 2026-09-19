import { test, expect } from '@playwright/test';
import {
  installM39Fixture,
  seedM39Session,
  waitForM39Identity,
  waitForM39BackendPreflight,
  waitForM40ApplicationReady,
} from './helpers/m39-auth-fixture.mjs';
import { installM47BoardsTableFixture } from './helpers/m47-boards-table-fixture.mjs';

async function waitForBoard(page) {
  const host = page.locator('[data-wm-board-presentation-host][data-wm-board-presentation-route="workspace"][data-wm-board-id="board-m47"]');
  await expect(host).toBeVisible();
  const detail = host.locator('.board-detail-page');
  await expect(detail).toBeVisible();
  await expect(detail.locator('.button-spinner')).toHaveCount(0);
  const table = detail.getByRole('region', { name:'Board main table' });
  try {
    await expect(table).toBeVisible();
  } catch (error) {
    const loadError = (await detail.locator('.boards-state.error p').textContent().catch(() => null))?.trim();
    throw new Error(`M47 board table did not render${loadError ? `: ${loadError}` : '.'}`, { cause:error });
  }
  return detail;
}

async function setup(page, options = {}) {
  await seedM39Session(page, { principal:'admin' });
  await installM39Fixture(page, { principal:'admin' });
  const fixture = await installM47BoardsTableFixture(page, options);
  await page.goto('/#/boards/board-m47');
  await waitForM39Identity(page, { role:'admin_general_manager' });
  await waitForM39BackendPreflight(page, 'boards');
  await waitForM40ApplicationReady(page);
  const detail = await waitForBoard(page);
  return { fixture, detail };
}

const group = (page, title) => page.locator('.board-group').filter({ has:page.locator('.group-title-inline span', { hasText:title }) });
const row = (page, title) => page.locator('.board-item-row').filter({ has:page.locator('.item-inline-title', { hasText:title }) });

async function openItemMenu(page, title) {
  const itemRow = row(page, title);
  await expect(itemRow).toHaveCount(1);
  const trigger = itemRow.getByRole('button', { name:`More actions for ${title}`, exact:true });
  await trigger.click();
  await expect(trigger).toHaveAttribute('aria-expanded','true');
  return itemRow;
}

async function confirmAction(page) {
  const dialog = page.getByRole('dialog');
  await expect(dialog).toBeVisible();
  const button = dialog.getByRole('button', { name:/Confirm action|Continue/ });
  await button.click();
  await expect(dialog).toHaveCount(0);
}

test('@m47-group-item-crud group/item create-edit-move-duplicate-archive-restore-delete and group ordering remain coherent', async ({ page }) => {
  test.setTimeout(60_000);
  const { fixture } = await setup(page);

  const planning = group(page,'Planning');
  const inline = planning.getByRole('textbox', { name:'Add an item to Planning' });
  await inline.fill('Echo');
  await inline.press('Enter');
  await expect(row(page,'Echo')).toBeVisible();
  await expect.poll(async () => row(page,'Echo').getAttribute('data-item-id')).toMatch(/^item-new-/);

  await openItemMenu(page,'Echo');
  await page.getByRole('menuitem', { name:'Edit item' }).click();
  const edit = page.getByRole('dialog', { name:'Edit “Echo”' });
  await edit.getByRole('textbox', { name:'Item name' }).fill('Echo Updated');
  await edit.getByRole('combobox', { name:'Group' }).selectOption('group-b');
  await edit.getByRole('combobox', { name:'Status' }).selectOption('done_custom');
  await edit.getByRole('button', { name:'Save changes' }).click();
  await expect(edit).toHaveCount(0);
  await expect(group(page,'Delivery').getByRole('button', { name:'Echo Updated', exact:true })).toBeVisible();

  await openItemMenu(page,'Echo Updated');
  await page.getByRole('menuitem', { name:'Duplicate item' }).click();
  await expect(row(page,'Echo Updated copy')).toBeVisible();

  await openItemMenu(page,'Echo Updated copy');
  await page.getByRole('menuitem', { name:'Archive item' }).click();
  await confirmAction(page);
  await expect(row(page,'Echo Updated copy')).toHaveCount(0);

  await page.getByRole('button', { name:'More board view options' }).click();
  await page.getByRole('menuitem', { name:'Show archived items' }).click();
  const archived = row(page,'Echo Updated copy');
  await expect(archived).toBeVisible();
  await expect(archived.locator('[data-item-drag]')).toHaveCount(0);

  await openItemMenu(page,'Echo Updated copy');
  await page.getByRole('menuitem', { name:'Restore item' }).click();
  await expect(row(page,'Echo Updated copy')).toBeVisible();

  await openItemMenu(page,'Echo Updated copy');
  await page.getByRole('menuitem', { name:'Delete item permanently' }).click();
  await confirmAction(page);
  await expect(row(page,'Echo Updated copy')).toHaveCount(0);

  await page.getByRole('button', { name:'Add new group' }).click();
  const addGroup = page.getByRole('dialog', { name:'Add a group' });
  await addGroup.getByRole('textbox', { name:'Group name' }).fill('QA');
  await addGroup.getByRole('button', { name:'Add group' }).click();
  await expect(group(page,'QA')).toBeVisible();

  await group(page,'QA').locator('.group-title-inline').click();
  const rename = page.getByRole('textbox', { name:'Rename QA group' });
  await rename.fill('Quality');
  await rename.press('Enter');
  await expect(group(page,'Quality')).toBeVisible();

  const qualityHandle = group(page,'Quality').getByRole('button', { name:/Reorder group Quality/ });
  await qualityHandle.focus();
  await page.keyboard.press('Home');
  await expect.poll(() => fixture.calls('wm_move_board_group').length).toBeGreaterThan(0);
  await expect(page.locator('.board-group').first().locator('.group-title-inline')).toContainText('Quality');

  const qualityMenu = group(page,'Quality').getByRole('button', { name:'More actions for group Quality' });
  await qualityMenu.click();
  await page.getByRole('menuitem', { name:'Delete group and items' }).click();
  await confirmAction(page);
  await expect(group(page,'Quality')).toHaveCount(0);

  expect(fixture.calls('wm_add_board_item')).toHaveLength(1);
  expect(fixture.calls('wm_update_board_item').length).toBeGreaterThanOrEqual(1);
  expect(fixture.calls('wm_move_board_item').length).toBeGreaterThanOrEqual(1);
  expect(fixture.calls('wm_duplicate_board_item')).toHaveLength(1);
  expect(fixture.calls('wm_set_board_item_archived').map((entry)=>entry.body.p_archived)).toEqual([true,false]);
  expect(fixture.calls('wm_delete_board_item')).toHaveLength(1);
  expect(fixture.calls('wm_add_board_group')).toHaveLength(1);
  expect(fixture.calls('wm_update_board_group')).toHaveLength(1);
  expect(fixture.calls('wm_delete_board_group')).toHaveLength(1);
});

test('@m47-selection-visible-order shift-range and bulk movement follow rendered group visibility', async ({ page }) => {
  test.setTimeout(45_000);
  const { fixture } = await setup(page);

  await row(page,'Alpha').getByRole('checkbox', { name:'Select item: Alpha' }).click();
  await group(page,'Planning').getByRole('button', { name:'Collapse Planning' }).click();
  await row(page,'Delta').getByRole('checkbox', { name:'Select item: Delta' }).click({ modifiers:['Shift'] });
  const selectionBar = page.locator('[data-board-selection-bar]');
  await expect(selectionBar.locator('.selection-count span')).toHaveText('2');
  await expect(selectionBar.locator('.selection-count strong')).toHaveText('items selected');

  await selectionBar.getByRole('button', { name:'Clear selection' }).click();
  await group(page,'Planning').getByRole('button', { name:'Expand Planning' }).click();
  await row(page,'Alpha').getByRole('checkbox', { name:'Select item: Alpha' }).click();
  await row(page,'Charlie').getByRole('checkbox', { name:'Select item: Charlie' }).click({ modifiers:['Shift'] });
  await expect(selectionBar.locator('.selection-count span')).toHaveText('3');
  await expect(selectionBar.locator('.selection-count strong')).toHaveText('items selected');

  await selectionBar.getByRole('button', { name:'Move' }).click();
  const moveDialog = page.getByRole('dialog', { name:'Move 3 selected items' });
  await moveDialog.getByRole('combobox', { name:'Move to group' }).selectOption('group-b');
  await moveDialog.getByRole('button', { name:'Move items' }).click();
  await expect(moveDialog).toHaveCount(0);
  await expect(group(page,'Planning').locator('.board-item-row')).toHaveCount(0);
  await expect(group(page,'Delivery').locator('.board-item-row')).toHaveCount(4);
  expect(fixture.calls('wm_move_board_item')).toHaveLength(3);
});

test('@m47-preference-flush pending table state persists across immediate route exit and reload', async ({ page }) => {
  test.setTimeout(45_000);
  const { fixture } = await setup(page);

  await group(page,'Planning').getByRole('button', { name:'Collapse Planning' }).click();
  const statusSort = page.locator('[data-column-id="col-status"] [data-column-quick-sort]');
  await statusSort.click();
  await page.getByRole('button', { name:'Back to Boards' }).click();
  await expect(page).toHaveURL(/#\/boards$/);

  await expect.poll(() => fixture.calls('wm_set_board_preferences').length).toBeGreaterThan(0);
  const saved = fixture.snapshot().preferences;
  expect(saved.collapsed_groups).toContain('group-a');
  expect(saved.sort_column_id).toBe('col-status');
  expect(saved.sort_direction).toBe('asc');

  await page.goto('/#/boards/board-m47');
  await waitForM40ApplicationReady(page);
  await waitForBoard(page);
  await expect(group(page,'Planning')).toHaveClass(/is-collapsed/);
  await expect(page.locator('th[data-column-id="col-status"]')).toHaveAttribute('aria-sort','ascending');
});

test('@m47-virtualized-keyboard table row/column virtualization preserves logical keyboard navigation', async ({ page }) => {
  test.setTimeout(60_000);
  await setup(page, { large:true });

  const planning = group(page,'Planning');
  const tbody = planning.locator('tbody.board-item-list');
  await expect(tbody).toHaveAttribute('data-virtualized-rows','true');
  await expect(tbody).toHaveAttribute('data-virtual-row-total','180');
  expect(await planning.locator('.board-item-row').count()).toBeLessThan(180);
  const table = planning.locator('table.board-data-table');
  await expect(table).toHaveAttribute('data-virtual-columns','true');
  expect(await table.locator('th[data-column-id]').count()).toBeLessThan(21);

  const first = row(page,'Item 001').locator('.item-inline-title');
  await first.focus();
  await page.keyboard.press('End');
  await expect.poll(async () => page.evaluate(() => document.activeElement?.getAttribute('data-grid-column-index'))).toBe('21');
  await expect.poll(async () => planning.locator('.board-table-scroll').evaluate((node)=>node.scrollLeft)).toBeGreaterThan(0);

  await row(page,'Item 001').locator('.item-inline-title').focus();
  for (let index=0; index<48; index+=1) await page.keyboard.press('ArrowDown');
  await expect.poll(async () => page.evaluate(() => document.activeElement?.closest('.board-item-row')?.getAttribute('data-virtual-row-index'))).toBe('48');
  await expect(page.locator('.board-item-row[data-virtual-row-index="48"]')).toBeVisible();
});

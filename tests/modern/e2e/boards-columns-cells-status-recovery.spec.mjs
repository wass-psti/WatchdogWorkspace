import { test, expect } from '@playwright/test';
import {
  installM39Fixture,
  seedM39Session,
  waitForM39Identity,
  waitForM39BackendPreflight,
  waitForM40ApplicationReady,
} from './helpers/m39-auth-fixture.mjs';
import {
  installM48BoardsColumnsFixture,
  M48_BOARD_ID,
  M48_ADMIN_ID,
} from './helpers/m48-boards-columns-fixture.mjs';

async function waitForBoard(page) {
  const host = page.locator(`[data-wm-board-presentation-host][data-wm-board-presentation-route="workspace"][data-wm-board-id="${M48_BOARD_ID}"]`);
  await expect(host).toBeVisible();
  const detail = host.locator('.board-detail-page');
  await expect(detail).toBeVisible();
  await expect(detail.locator('.button-spinner')).toHaveCount(0);
  await expect(detail.getByRole('region', { name:'Board main table' })).toBeVisible();
  return detail;
}

async function setup(page) {
  await seedM39Session(page, { principal:'admin' });
  await installM39Fixture(page, { principal:'admin' });
  const fixture = await installM48BoardsColumnsFixture(page);
  await page.goto(`/#/boards/${M48_BOARD_ID}`);
  await waitForM39Identity(page, { role:'admin_general_manager' });
  await waitForM39BackendPreflight(page, 'boards');
  await waitForM40ApplicationReady(page);
  const detail = await waitForBoard(page);
  return { fixture, detail };
}

const group = (page, title) => page.locator('.board-group').filter({ has:page.locator('.group-title-inline span', { hasText:title }) });
const row = (page, title) => page.locator('.board-item-row').filter({ has:page.locator('.item-inline-title', { hasText:title }) });
const cellButton = (page, title, columnId) => row(page,title).locator(`td[data-column-id="${columnId}"] button[data-edit-cell]`);
const columnHeader = (page, columnId) => page.locator(`th[data-column-id="${columnId}"]`).first();

async function openColumnMenu(page, columnId) {
  const header = columnHeader(page,columnId);
  await header.locator('summary[aria-haspopup="menu"]').click();
  await expect(page.locator('.board-floating-menu:not([hidden])')).toBeVisible();
  return header;
}

async function confirmAction(page) {
  const dialog = page.locator('.wm-dialog').filter({ has:page.getByRole('heading', { name:/Confirm destructive action|Confirm action/ }) });
  await expect(dialog).toBeVisible();
  await dialog.getByRole('button', { name:/Confirm action|Continue/ }).click();
  await expect(dialog).toHaveCount(0);
}

test('@m48-typed-cells Text Number Date Dropdown Person Status editors preserve explicit save/cancel and persist typed values', async ({ page }) => {
  test.setTimeout(60_000);
  const { fixture } = await setup(page);

  const textCell = cellButton(page,'Alpha','col-text');
  await textCell.click();
  const textInput = page.getByRole('textbox', { name:'Edit Notes' });
  await textInput.fill('Draft must be cancelled');
  await textInput.press('Escape');
  await expect(textCell).toContainText('Alpha note');
  await expect(textCell).toBeFocused();
  expect(fixture.calls('wm_set_board_cell')).toHaveLength(0);

  await textCell.click();
  await page.getByRole('textbox', { name:'Edit Notes' }).fill('Alpha note updated');
  await page.getByRole('textbox', { name:'Edit Notes' }).press('Enter');
  await expect(cellButton(page,'Alpha','col-text')).toContainText('Alpha note updated');

  const numberBefore = fixture.calls('wm_set_board_cell').length;
  const numberCell = cellButton(page,'Alpha','col-number');
  await numberCell.click();
  let numberInput = page.locator('input[aria-label="Edit Estimate"]');
  await numberInput.fill('999');
  await numberInput.press('Escape');
  await expect(numberCell).toContainText('10');
  await expect(numberCell).toBeFocused();
  expect(fixture.calls('wm_set_board_cell')).toHaveLength(numberBefore);
  await numberCell.click();
  numberInput = page.locator('input[aria-label="Edit Estimate"]');
  await numberInput.fill('42.5');
  await numberInput.press('Enter');
  await expect(cellButton(page,'Alpha','col-number')).toContainText('42.5');

  const dateBefore = fixture.calls('wm_set_board_cell').length;
  const dateCell = cellButton(page,'Bravo','col-date');
  await dateCell.click();
  let dateInput = page.locator('input[aria-label="Edit Target date"]');
  await dateInput.fill('2027-01-02');
  await dateInput.press('Escape');
  await expect(dateCell).toContainText(/Sep|2026|30/);
  await expect(dateCell).toBeFocused();
  expect(fixture.calls('wm_set_board_cell')).toHaveLength(dateBefore);
  await dateCell.click();
  dateInput = page.locator('input[aria-label="Edit Target date"]');
  await dateInput.fill('2026-12-31');
  await dateInput.press('Enter');
  await expect(cellButton(page,'Bravo','col-date')).toContainText(/Dec|2026|31/);

  const dropdownBefore = fixture.calls('wm_set_board_cell').length;
  await cellButton(page,'Alpha','col-dropdown').click();
  await expect(page.getByRole('listbox', { name:'Choose Priority' })).toBeVisible();
  await page.keyboard.press('Escape');
  expect(fixture.calls('wm_set_board_cell')).toHaveLength(dropdownBefore);
  await cellButton(page,'Alpha','col-dropdown').click();
  await page.locator('[data-inline-choice="High"]').click();
  await expect(cellButton(page,'Alpha','col-dropdown')).toContainText('High');

  const personBefore = fixture.calls('wm_set_board_cell').length;
  const personCell = cellButton(page,'Alpha','col-person');
  await personCell.click();
  await expect(page.getByRole('listbox', { name:'Board members' })).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(personCell).toContainText('Alex Operator');
  await expect(personCell).toBeFocused();
  expect(fixture.calls('wm_set_board_cell')).toHaveLength(personBefore);
  await personCell.click();
  await page.locator(`[data-inline-person="${M48_ADMIN_ID}"]`).click();
  await expect(cellButton(page,'Alpha','col-person')).toContainText('M48 Admin');

  const statusBefore = fixture.calls('wm_set_board_cell').length;
  const statusCell = cellButton(page,'Alpha','col-status');
  await statusCell.click();
  await expect(page.locator('.board-status-picker')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(statusCell).toContainText('To do');
  await expect(statusCell).toBeFocused();
  expect(fixture.calls('wm_set_board_cell')).toHaveLength(statusBefore);
  await statusCell.click();
  await page.locator('[data-status-choice="doing"]').click();
  await expect(cellButton(page,'Alpha','col-status')).toContainText('Doing');

  const saved = fixture.snapshot();
  const valueOf = (itemId, columnId) => saved.values.find((entry)=>entry.item_id===itemId && entry.column_id===columnId)?.value ?? null;
  expect(valueOf('item-a1','col-text')).toBe('Alpha note updated');
  expect(valueOf('item-a1','col-number')).toBe(42.5);
  expect(valueOf('item-a2','col-date')).toBe('2026-12-31');
  expect(valueOf('item-a1','col-dropdown')).toBe('High');
  expect(valueOf('item-a1','col-person')).toBe(M48_ADMIN_ID);
  expect(saved.items.find((entry)=>entry.id==='item-a1')?.status).toBe('doing');

  await page.reload();
  await waitForM40ApplicationReady(page);
  await waitForBoard(page);
  await expect(cellButton(page,'Alpha','col-text')).toContainText('Alpha note updated');
  await expect(cellButton(page,'Alpha','col-number')).toContainText('42.5');
  await expect(cellButton(page,'Bravo','col-date')).toContainText(/Dec|2026|31/);
  await expect(cellButton(page,'Alpha','col-dropdown')).toContainText('High');
  await expect(cellButton(page,'Alpha','col-person')).toContainText('M48 Admin');
  await expect(cellButton(page,'Alpha','col-status')).toContainText('Doing');
});

test('@m48-filter-sort typed filters are exact, descending sort keeps empty values last, and preferences persist', async ({ page }) => {
  test.setTimeout(45_000);
  const { fixture } = await setup(page);

  await openColumnMenu(page,'col-dropdown');
  await page.getByRole('menuitem', { name:'Filter column' }).click();
  const filter = page.getByRole('dialog', { name:'Filter Priority' });
  await filter.getByRole('combobox').selectOption('Low');
  await filter.getByRole('button', { name:'Apply filter' }).click();
  await expect(filter).toHaveCount(0);
  await expect(row(page,'Alpha')).toBeVisible();
  await expect(row(page,'Bravo')).toHaveCount(0);
  await expect(row(page,'Charlie')).toHaveCount(0);
  await expect.poll(() => fixture.snapshot().preferences.column_filters['col-dropdown']).toBe('Low');

  await openColumnMenu(page,'col-dropdown');
  await page.getByRole('menuitem', { name:'Edit filter' }).click();
  const clearFilter = page.getByRole('dialog', { name:'Filter Priority' });
  await clearFilter.getByRole('combobox').selectOption('');
  await clearFilter.getByRole('button', { name:'Apply filter' }).click();
  await expect(row(page,'Bravo')).toBeVisible();
  await expect(row(page,'Charlie')).toBeVisible();

  await openColumnMenu(page,'col-status');
  await page.getByRole('menuitem', { name:'Filter column' }).click();
  const statusFilter = page.getByRole('dialog', { name:'Filter Status' });
  await statusFilter.getByRole('combobox').selectOption('todo');
  await statusFilter.getByRole('button', { name:'Apply filter' }).click();
  await expect(row(page,'Alpha')).toBeVisible();
  await expect(row(page,'Bravo')).toHaveCount(0);
  await expect(row(page,'Charlie')).toHaveCount(0);
  await expect.poll(() => fixture.snapshot().preferences.column_filters['col-status']).toBe('todo');

  await page.reload();
  await waitForM40ApplicationReady(page);
  await waitForBoard(page);
  await expect(row(page,'Alpha')).toBeVisible();
  await expect(row(page,'Bravo')).toHaveCount(0);
  await expect(row(page,'Charlie')).toHaveCount(0);

  await openColumnMenu(page,'col-status');
  await page.getByRole('menuitem', { name:'Edit filter' }).click();
  const clearStatus = page.getByRole('dialog', { name:'Filter Status' });
  await clearStatus.getByRole('combobox').selectOption('');
  await clearStatus.getByRole('button', { name:'Apply filter' }).click();

  let sort = columnHeader(page,'col-number').locator('[data-column-quick-sort]');
  await sort.click();
  await sort.click();
  await expect(columnHeader(page,'col-number')).toHaveAttribute('aria-sort','descending');
  let titles = await group(page,'Planning').locator('.board-item-row .item-inline-title').allTextContents();
  expect(titles.map((entry)=>entry.trim())).toEqual(['Bravo','Alpha','Charlie']);

  await expect.poll(() => fixture.snapshot().preferences.sort_direction).toBe('desc');
  expect(fixture.snapshot().preferences.sort_column_id).toBe('col-number');
  expect(fixture.calls('wm_set_board_preferences').length).toBeGreaterThan(0);

  await page.reload();
  await waitForM40ApplicationReady(page);
  await waitForBoard(page);
  await expect(columnHeader(page,'col-number')).toHaveAttribute('aria-sort','descending');
  titles = await group(page,'Planning').locator('.board-item-row .item-inline-title').allTextContents();
  expect(titles.map((entry)=>entry.trim())).toEqual(['Bravo','Alpha','Charlie']);
});

test('@m48-column-lifecycle add rename reorder resize cancel/commit and delete remain server-authoritative', async ({ page }) => {
  test.setTimeout(60_000);
  const { fixture } = await setup(page);

  const addButton = page.locator('[data-add-column]').first();
  await addButton.click();
  const picker = page.getByRole('dialog', { name:'Add column' });
  await expect(picker).toBeVisible();
  await picker.locator('[data-column-type="text"]').click();
  await expect.poll(() => fixture.calls('wm_add_board_column').length).toBe(1);
  const createCall = fixture.calls('wm_add_board_column')[0]?.body ?? null;
  expect(createCall?.p_name).toBe('New Text');
  const createdId = createCall ? fixture.snapshot().columns.find((entry)=>entry.name===createCall.p_name)?.id : null;
  expect(createdId).toMatch(/^col-new-/);

  const renameButton = columnHeader(page,createdId).locator(`[data-rename-column-inline="${createdId}"]`);
  await renameButton.click();
  const renameInput = page.getByRole('textbox', { name:`Rename ${createCall.p_name} column` });
  await renameInput.fill('QA Notes');
  await renameInput.press('Enter');
  await expect(columnHeader(page,createdId)).toContainText('QA Notes');
  expect(fixture.calls('wm_update_board_column').at(-1)?.body?.p_name).toBe('QA Notes');

  const reorder = columnHeader(page,createdId).locator(`[data-column-drag="${createdId}"]`);
  await reorder.focus();
  await page.keyboard.press('Home');
  await expect.poll(() => fixture.calls('wm_move_board_column').length).toBeGreaterThan(0);
  expect(fixture.snapshot().columns.find((entry)=>entry.id===createdId)?.position).toBe(0);

  let resize = columnHeader(page,createdId).locator(`[data-column-resize="${createdId}"]`);
  await expect(resize).toHaveAttribute('aria-valuenow','160');
  await resize.dispatchEvent('pointerdown', { button:0, pointerId:48, clientX:100, pointerType:'mouse' });
  await page.evaluate(() => window.dispatchEvent(new PointerEvent('pointermove', { pointerId:48, clientX:220, bubbles:true })));
  await page.evaluate(() => window.dispatchEvent(new PointerEvent('pointercancel', { pointerId:48, clientX:220, bubbles:true })));
  await expect(resize).toHaveAttribute('aria-valuenow','160');
  expect(fixture.snapshot().preferences.column_widths[createdId]).toBeUndefined();

  await resize.focus();
  await page.keyboard.press('ArrowRight');
  await expect.poll(() => fixture.snapshot().preferences.column_widths[createdId]).toBe(168);
  resize = columnHeader(page,createdId).locator(`[data-column-resize="${createdId}"]`);
  await expect(resize).toHaveAttribute('aria-valuenow','168');

  await cellButton(page,'Alpha',createdId).click();
  const createdCellInput = page.getByRole('textbox', { name:'Edit QA Notes' });
  await createdCellInput.fill('QA alpha');
  await createdCellInput.press('Enter');
  await expect(cellButton(page,'Alpha',createdId)).toContainText('QA alpha');

  await openColumnMenu(page,createdId);
  await page.getByRole('menuitem', { name:'Duplicate column' }).click();
  const duplicateDialog = page.getByRole('dialog', { name:'Duplicate QA Notes' });
  await duplicateDialog.locator('input[name="mode"][value="values"]').check();
  await duplicateDialog.getByRole('button', { name:'Duplicate column' }).click();
  await expect.poll(() => fixture.calls('wm_duplicate_board_column').length).toBe(1);
  const duplicate = fixture.snapshot().columns.find((entry)=>entry.name==='QA Notes copy');
  expect(duplicate?.id).toMatch(/^col-new-/);
  const duplicateId = duplicate.id;
  await expect(columnHeader(page,duplicateId)).toContainText('QA Notes copy');
  await expect(cellButton(page,'Alpha',duplicateId)).toContainText('QA alpha');
  expect(fixture.calls('wm_duplicate_board_column')[0]?.body?.p_with_values).toBe(true);

  await openColumnMenu(page,duplicateId);
  await page.getByRole('menuitem', { name:'Change column type' }).click();
  const typePicker = page.getByRole('dialog', { name:'Change column type' });
  await typePicker.locator('[data-column-type="dropdown"]').click();
  const changeDialog = page.getByRole('dialog', { name:'Change QA Notes copy type' });
  await expect(changeDialog.locator('textarea[name="options"]')).toHaveValue('Option 1\nOption 2');
  await changeDialog.locator('input[name="clear"]').check();
  await changeDialog.getByRole('button', { name:'Change type' }).click();
  await expect.poll(() => fixture.calls('wm_change_board_column_type').length).toBe(1);
  const changedDuplicate = fixture.snapshot().columns.find((entry)=>entry.id===duplicateId);
  expect(changedDuplicate?.data_type).toBe('dropdown');
  expect(changedDuplicate?.config?.options).toEqual(['Option 1','Option 2']);
  expect(fixture.snapshot().values.some((entry)=>entry.column_id===duplicateId)).toBe(false);
  expect(fixture.calls('wm_change_board_column_type')[0]?.body?.p_clear_values).toBe(true);

  await openColumnMenu(page,createdId);
  await page.getByRole('menuitem', { name:'Delete column permanently' }).click();
  const deleteDialog = page.getByRole('dialog', { name:'Delete QA Notes?' });
  const deleteAcknowledgement = deleteDialog.locator('input[name="confirm_delete"]');
  await expect(deleteAcknowledgement).toBeVisible();
  await expect(deleteAcknowledgement).toHaveAttribute('required', '');
  await deleteAcknowledgement.check();
  await deleteDialog.getByRole('button', { name:'Delete column' }).click();
  await expect(deleteDialog).toHaveCount(0);
  await expect(columnHeader(page,createdId)).toHaveCount(0);
  await expect.poll(() => fixture.snapshot().columns.some((entry)=>entry.id===createdId)).toBe(false);
  expect(fixture.snapshot().preferences.column_widths[createdId]).toBeUndefined();
  expect(fixture.calls('wm_delete_board_column')).toHaveLength(1);

  await page.reload();
  await waitForM40ApplicationReady(page);
  await waitForBoard(page);
  await expect(columnHeader(page,duplicateId)).toContainText('QA Notes copy');
  expect(fixture.snapshot().columns.find((entry)=>entry.id===duplicateId)?.data_type).toBe('dropdown');
});

test('@m48-status-lifecycle draft cancel, add/rename/reorder/deactivate/delete/default and reference clearing persist atomically', async ({ page }) => {
  test.setTimeout(60_000);
  const { fixture } = await setup(page);

  await cellButton(page,'Alpha','col-status').click();
  await page.getByRole('button', { name:'Manage labels' }).click();
  let manager = page.locator('.status-label-manager');
  const todoName = manager.locator('[data-status-label-name="todo"]');
  await todoName.fill('Discarded rename');
  await manager.getByRole('button', { name:'Cancel changes' }).click();
  expect(fixture.calls('wm_set_board_status_labels')).toHaveLength(0);
  await expect(page.locator('[data-status-choice="todo"]')).toContainText('To do');

  await page.getByRole('button', { name:'Manage labels' }).click();
  manager = page.locator('.status-label-manager');
  await manager.locator('[data-status-label-name="todo"]').fill('Backlog');
  await manager.getByRole('button', { name:'Move Doing up' }).click();

  await manager.getByRole('button', { name:'More options for Blocked' }).click();
  await manager.getByRole('button', { name:'Deactivate label' }).click();

  await manager.getByRole('button', { name:'More options for Done' }).click();
  await manager.getByRole('button', { name:'Delete label' }).click();
  await confirmAction(page);
  manager = page.locator('.status-label-manager');
  await expect(manager).toBeVisible();

  await manager.getByRole('button', { name:'+ New label' }).click();
  manager = page.locator('.status-label-manager');
  const newInput = manager.locator('[data-status-label-name]').last();
  await newInput.fill('Review');
  const newId = await newInput.getAttribute('data-status-label-name');
  expect(newId).toBeTruthy();
  await manager.locator(`[data-status-more="${newId}"]`).click();
  await manager.getByRole('button', { name:'Set as default' }).click();
  await manager.getByRole('button', { name:'Apply changes' }).click();
  await expect(page.locator('.status-label-manager')).toHaveCount(0);

  await expect.poll(() => fixture.calls('wm_set_board_status_labels').length).toBe(1);
  const call = fixture.calls('wm_set_board_status_labels')[0].body;
  expect(call.p_labels.map((entry)=>entry.name)).toContain('Backlog');
  expect(call.p_labels.map((entry)=>entry.name)).toContain('Review');
  expect(call.p_labels.some((entry)=>entry.id==='done_custom')).toBe(false);
  expect(call.p_labels.find((entry)=>entry.id==='blocked')?.active).toBe(false);
  expect(call.p_labels.findIndex((entry)=>entry.id==='doing')).toBeLessThan(call.p_labels.findIndex((entry)=>entry.id==='todo'));
  expect(call.p_default_label_id).toBe(newId);
  expect(fixture.snapshot().items.find((entry)=>entry.id==='item-b1')?.status).toBeNull();
  expect(fixture.snapshot().columns.find((entry)=>entry.id==='col-status')?.config.default_label_id).toBe(newId);
});

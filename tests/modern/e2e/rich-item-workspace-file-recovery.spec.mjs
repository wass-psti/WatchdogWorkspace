import { test, expect } from '@playwright/test';
import {
  installM39Fixture,
  seedM39Session,
  waitForM39Identity,
  waitForM39BackendPreflight,
  waitForM40ApplicationReady,
} from './helpers/m39-auth-fixture.mjs';
import { installM50RichItemWorkspaceFixture } from './helpers/m50-rich-item-workspace-fixture.mjs';

async function confirmAction(page) {
  await expect(page.locator('.board-dialog')).toBeVisible();
  await expect(page.locator('[data-item-panel]')).toHaveAttribute('aria-modal', 'false');
  await expect(page.locator('[data-item-panel]')).toHaveAttribute('inert', '');
  const dialog = page.getByRole('dialog', { name: /Confirm destructive action|Confirm action/ });
  await expect(dialog).toBeVisible();
  await dialog.getByRole('button', { name: /Confirm action|Continue/ }).click();
  await expect(page.locator('[data-item-panel]')).toHaveAttribute('aria-modal', 'true');
}

async function setup(page, { principal = 'admin', role = 'owner' } = {}) {
  await seedM39Session(page, { principal });
  await installM39Fixture(page, { principal });
  const fixture = await installM50RichItemWorkspaceFixture(page, { role });
  await page.goto(`/#/boards/${fixture.boardId}`);
  await waitForM39Identity(page, { role: principal === 'employee' ? 'employee' : 'admin_general_manager' });
  await waitForM39BackendPreflight(page, 'boards');
  await waitForM40ApplicationReady(page);
  await expect(page.locator('.board-detail-page .button-spinner')).toHaveCount(0);
  await page.locator('[data-open-item="item-a1"]').first().click();
  await expect(page.locator('[data-item-panel]')).toBeVisible();
  return fixture;
}

async function uploadFixtureFile(page, name = 'm50.txt', body = 'M50 file') {
  await page.getByRole('tab', { name: 'Files' }).click();
  await page.locator('[data-item-file-input]').setInputFiles({
    name,
    mimeType: 'text/plain',
    buffer: Buffer.from(body),
  });
  await expect(page.locator('.item-file')).toContainText(name);
  await expect(page.locator('[data-item-file-input]')).toBeEnabled();
}

test('@m50-properties-updates item properties and updates persist through authoritative reload', async ({ page }) => {
  const fixture = await setup(page);
  await page.getByRole('tab', { name: 'Overview' }).click();
  const titleForm = page.locator('[data-item-property-form][data-item-property-field="title"]');
  await titleForm.locator('input[name="value"]').fill('Alpha recovered');
  await titleForm.getByRole('button', { name: 'Save' }).click();
  await expect(page.locator('[data-item-panel] h2')).toHaveText('Alpha recovered');

  await page.getByRole('tab', { name: 'Updates' }).click();
  await page.locator('[data-item-update-input]').fill('Decision: storage authority recovered');
  await page.locator('[data-item-update-submit]').click();
  await expect(page.locator('.item-update')).toContainText('storage authority recovered');
  expect(fixture.calls('wm_set_board_cell_if_current')).toHaveLength(1);
  expect(fixture.calls('wm_set_board_cell_if_current')[0]?.body).toMatchObject({ p_item_id:'item-a1', p_value:'Alpha recovered', p_expected_value:'Alpha' });
  expect(fixture.calls('wm_update_board_item')).toHaveLength(0);
  expect(fixture.calls('wm_add_board_item_update')).toHaveLength(1);

  await page.getByRole('tab', { name: 'Activity' }).click();
  await expect(page.locator('.item-activity-list')).toContainText(/Item updated|Update posted/);
});

test('@m50-files upload download and delete preserve storage/metadata lifecycle', async ({ page }) => {
  const fixture = await setup(page);
  await uploadFixtureFile(page);
  expect(fixture.calls('storage-upload')).toHaveLength(1);
  expect(fixture.calls('wm_register_board_item_file')).toHaveLength(1);

  const downloadPromise = page.waitForEvent('download');
  await page.locator('[data-download-item-file]').click();
  await downloadPromise;
  expect(fixture.calls('storage-sign')).toHaveLength(1);
  expect(fixture.calls('storage-download')).toHaveLength(1);

  await page.locator('[data-delete-item-file]').click();
  await confirmAction(page);
  await expect.poll(() => fixture.calls('storage-delete').length).toBe(1);
  await expect.poll(() => fixture.calls('wm_delete_board_item_file').length).toBe(1);
  expect(fixture.calls().findIndex((entry) => entry.name === 'storage-delete'))
    .toBeLessThan(fixture.calls().findIndex((entry) => entry.name === 'wm_delete_board_item_file'));
  await expect(page.locator('.item-file')).toHaveCount(0);
});

test('@m50-registration-recovery committed attachment survives lost registration response without duplicate upload', async ({ page }) => {
  const fixture = await setup(page);
  fixture.failNextRegistrationResponses(2);
  await uploadFixtureFile(page, 'response-lost.txt', 'committed once');

  expect(fixture.calls('storage-upload')).toHaveLength(1);
  expect(fixture.calls('wm_register_board_item_file')).toHaveLength(2);
  expect(fixture.calls('wm_register_board_item_file-response-lost')).toHaveLength(2);
  expect(fixture.calls('wm_get_board_item_workspace').length).toBeGreaterThanOrEqual(2);
  expect(fixture.calls('storage-delete')).toHaveLength(0);
  const snapshot = fixture.snapshot();
  expect(snapshot.files).toHaveLength(1);
  expect(snapshot.storage).toHaveLength(1);
  await expect(page.locator('.item-file')).toHaveCount(1);
});

test('@m50-delete-recovery storage deletion failure preserves metadata and retry finalizes in safe order', async ({ page }) => {
  const fixture = await setup(page);
  await uploadFixtureFile(page, 'retry-delete.txt', 'delete recovery');
  fixture.failNextStorageDelete();

  await page.locator('[data-delete-item-file]').click();
  await confirmAction(page);
  await expect.poll(() => fixture.calls('storage-delete-failed').length).toBe(1);
  expect(fixture.calls('wm_delete_board_item_file')).toHaveLength(0);
  expect(fixture.snapshot().files).toHaveLength(1);
  expect(fixture.snapshot().storage).toHaveLength(1);
  await expect(page.locator('.item-file')).toContainText('retry-delete.txt');

  await page.locator('[data-delete-item-file]').click();
  await confirmAction(page);
  await expect.poll(() => fixture.calls('storage-delete').length).toBe(1);
  await expect.poll(() => fixture.calls('wm_delete_board_item_file').length).toBe(1);
  expect(fixture.calls().findIndex((entry) => entry.name === 'storage-delete'))
    .toBeLessThan(fixture.calls().findIndex((entry) => entry.name === 'wm_delete_board_item_file'));
  expect(fixture.snapshot().files).toHaveLength(0);
  expect(fixture.snapshot().storage).toHaveLength(0);
  await expect(page.locator('.item-file')).toHaveCount(0);
});

test('@m50-viewer viewer workspace remains read-only while previews/downloads remain available', async ({ page }) => {
  await setup(page, { principal: 'employee', role: 'viewer' });
  await page.getByRole('tab', { name: 'Updates' }).click();
  await expect(page.locator('[data-item-update-form]')).toHaveCount(0);
  await expect(page.getByText(/updates can be read but not posted/i)).toBeVisible();
  await page.getByRole('tab', { name: 'Files' }).click();
  await expect(page.locator('[data-item-file-input]')).toHaveCount(0);
  await expect(page.getByText(/attachments can be opened or downloaded but not uploaded/i)).toBeVisible();
  await page.getByRole('tab', { name: 'Overview' }).click();
  await expect(page.locator('[data-item-property-form]')).toHaveCount(0);
});

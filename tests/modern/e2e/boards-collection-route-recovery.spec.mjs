import { test, expect } from '@playwright/test';
import {
  installM39Fixture,
  seedM39Session,
  waitForM39Identity,
  waitForM39BackendPreflight,
  waitForM40ApplicationReady,
} from './helpers/m39-auth-fixture.mjs';
import { installM45BoardsFixture } from './helpers/m45-boards-fixture.mjs';

const collectionTab = (page, status) => page.locator(`button[data-board-status="${status}"]`);

async function waitForM45CollectionReady(page, status = 'active') {
  const main = page.locator(`#boardsMain[data-board-collection-state="ready"][data-board-collection-status="${status}"]`);
  await expect(main).toBeVisible();
  await expect(collectionTab(page, status)).toHaveAttribute('aria-pressed', 'true');
  await expect(main.locator('.button-spinner')).toHaveCount(0);
  return main;
}


async function waitForM45BoardDetailReady(page, boardId = null, boardName = null) {
  const selector = boardId
    ? `[data-wm-board-presentation-host][data-wm-board-presentation-route="workspace"][data-wm-board-id="${boardId}"]`
    : '[data-wm-board-presentation-host][data-wm-board-presentation-route="workspace"][data-wm-board-id]';
  const host = page.locator(selector);
  await expect(host).toBeVisible();
  const detail = host.locator('.board-detail-page');
  await expect(detail).toBeVisible();
  const boardMain = detail.locator('#boardMain');
  await expect(boardMain).toHaveAttribute('data-board-detail-state', 'ready');
  if (boardId) await expect(boardMain).toHaveAttribute('data-board-detail-id', boardId);
  if (boardName) await expect(boardMain).toHaveAttribute('data-board-detail-name', boardName);
  const headerHost = boardMain.locator('[data-board-header-host]');
  if (boardId) await expect(headerHost).toHaveAttribute('data-board-detail-commit-id', boardId);
  if (boardName) await expect(headerHost).toHaveAttribute('data-board-detail-commit-name', boardName);
  if (boardName) await expect(headerHost.locator('#board-workspace-title')).toHaveText(boardName);
  await expect(boardMain.locator('[data-board-workspace-shell]')).toBeVisible();
  await expect(detail.locator('.button-spinner')).toHaveCount(0);
  return detail;
}

async function setup(page, path = '/#/boards', expectedStatus = 'active') {
  await seedM39Session(page, { principal:'admin' });
  await installM39Fixture(page, { principal:'admin' });
  const fixture = await installM45BoardsFixture(page);
  await page.goto(path);
  await waitForM39Identity(page, { role:'admin_general_manager' });
  await waitForM39BackendPreflight(page, 'boards');
  await waitForM40ApplicationReady(page);
  await waitForM45CollectionReady(page, expectedStatus);
  return fixture;
}

async function confirmBoardDialog(page) {
  const dialog = page.getByRole('dialog');
  await expect(dialog).toBeVisible();
  const destructive = await dialog.getAttribute('data-dialog-tone') === 'danger';
  await dialog.getByRole('button', { name: destructive ? 'Confirm action' : 'Continue' }).click();
  await expect(dialog).toHaveCount(0);
}

async function openCardMenu(page, name) {
  const card = page.locator('.board-card').filter({ has:page.getByRole('heading', { name, exact:true }) });
  await expect(card).toHaveCount(1);
  const trigger = card.getByRole('button', { name:`More actions for ${name}`, exact:true });
  await expect(trigger).toHaveCount(1);
  await trigger.click();
  await expect(trigger).toHaveAttribute('aria-expanded', 'true');
  await expect(page.locator('.board-floating-menu:not([hidden])')).toBeVisible();
  return card;
}

test('@m45-collection-create-open-duplicate Active collection search/create/open/duplicate/navigation works end to end', async ({ page }) => {
  test.setTimeout(45_000);
  const fixture = await setup(page);
  await expect(collectionTab(page, 'active')).toHaveAttribute('aria-pressed', 'true');
  await expect(page.getByRole('heading', { name:'Alpha Roadmap' })).toBeVisible();
  await expect(page.getByRole('heading', { name:'Beta Operations' })).toBeVisible();

  const search = page.getByRole('searchbox', { name:'Search boards by name or description' });
  await search.fill('launch');
  await expect(page.getByRole('heading', { name:'Alpha Roadmap' })).toBeVisible();
  await expect(page.getByRole('heading', { name:'Beta Operations' })).toHaveCount(0);
  await search.fill('');

  const alpha = page.locator('.board-card').filter({ has:page.getByRole('heading', { name:'Alpha Roadmap' }) });
  await alpha.focus();
  await page.keyboard.press('Enter');
  await expect(page).toHaveURL(/#\/boards\/board-active-alpha$/);
  const alphaDetail = await waitForM45BoardDetailReady(page, 'board-active-alpha', 'Alpha Roadmap');
  await expect(alphaDetail.getByRole('heading', { name:'Alpha Roadmap', exact:true })).toBeVisible();
  await page.getByRole('button', { name:'Back to Boards' }).click();
  await expect(page).toHaveURL(/#\/boards$/);
  await waitForM45CollectionReady(page, 'active');

  await page.getByRole('button', { name:'+ New board' }).click();
  const createDialog = page.getByRole('dialog', { name:'Create a board' });
  await createDialog.getByRole('textbox', { name:'Board name' }).fill('M45 Created Board');
  await createDialog.getByRole('textbox', { name:'Description' }).fill('Created through M45 collection recovery');
  await createDialog.getByRole('button', { name:'Create board' }).click();
  await expect(page).toHaveURL(/#\/boards\/board-created-1$/);
  expect(fixture.calls('wm_create_board_configured')).toHaveLength(1);
  expect(fixture.calls('wm_create_board_configured')[0]?.body?.p_name).toBe('M45 Created Board');
  const createdDetail = await waitForM45BoardDetailReady(page, 'board-created-1', 'M45 Created Board');
  await expect(createdDetail.getByRole('heading', { name:'M45 Created Board', exact:true })).toBeVisible();
  await page.getByRole('button', { name:'Back to Boards' }).click();
  await waitForM45CollectionReady(page, 'active');
  await expect(page.getByRole('heading', { name:'M45 Created Board', exact:true })).toBeVisible();

  await openCardMenu(page, 'M45 Created Board');
  await page.getByRole('menuitem', { name:'Duplicate board' }).click();
  expect(fixture.calls('wm_duplicate_board')).toHaveLength(1);
  await expect(page).toHaveURL(/#\/boards\/board-duplicate-\d+$/);
  const duplicateId = page.url().split('/').at(-1);
  expect(duplicateId).toMatch(/^board-duplicate-\d+$/);
  const duplicateDetail = await waitForM45BoardDetailReady(page, duplicateId, 'M45 Created Board copy');
  await expect(duplicateDetail.getByRole('heading', { name:'M45 Created Board copy', exact:true })).toBeVisible();

  expect(fixture.calls('wm_create_board_configured')).toHaveLength(1);
  expect(fixture.calls('wm_duplicate_board')).toHaveLength(1);
  expect(fixture.calls('wm_list_boards').filter((entry) => entry.body.p_status === 'active').length).toBeGreaterThanOrEqual(3);
});

test('@m45-lifecycle-actions archive/restore/trash/delete transitions remain consistent across collections', async ({ page }) => {
  test.setTimeout(45_000);
  const fixture = await setup(page);

  await openCardMenu(page, 'Alpha Roadmap');
  await page.getByRole('menuitem', { name:'Archive board' }).click();
  await confirmBoardDialog(page);
  await expect(page.getByRole('heading', { name:'Alpha Roadmap' })).toHaveCount(0);

  await collectionTab(page, 'archived').click();
  await waitForM45CollectionReady(page, 'archived');
  const archivedAlpha = page.locator('.board-card').filter({ has:page.getByRole('heading', { name:'Alpha Roadmap' }) });
  await expect(archivedAlpha).toBeVisible();
  await expect(archivedAlpha).not.toHaveAttribute('role', 'link');
  await expect(archivedAlpha).not.toHaveAttribute('tabindex', '0');
  await openCardMenu(page, 'Alpha Roadmap');
  await page.getByRole('menuitem', { name:'Restore board' }).click();
  await confirmBoardDialog(page);
  await expect(page.getByRole('heading', { name:'Alpha Roadmap' })).toHaveCount(0);

  await collectionTab(page, 'active').click();
  await waitForM45CollectionReady(page, 'active');
  await expect(page.getByRole('heading', { name:'Alpha Roadmap' })).toBeVisible();
  await openCardMenu(page, 'Alpha Roadmap');
  await page.getByRole('menuitem', { name:'Move board to trash' }).click();
  await confirmBoardDialog(page);
  await expect(page.getByRole('heading', { name:'Alpha Roadmap' })).toHaveCount(0);

  await collectionTab(page, 'trashed').click();
  await waitForM45CollectionReady(page, 'trashed');
  const trashedAlpha = page.locator('.board-card').filter({ has:page.getByRole('heading', { name:'Alpha Roadmap' }) });
  await expect(trashedAlpha).toBeVisible();
  const before = page.url();
  await trashedAlpha.getByRole('heading', { name:'Alpha Roadmap' }).click();
  await expect(page).toHaveURL(before);

  await openCardMenu(page, 'Alpha Roadmap');
  await page.getByRole('menuitem', { name:'Delete board permanently' }).click();
  await confirmBoardDialog(page);
  await expect(page.getByRole('heading', { name:'Alpha Roadmap' })).toHaveCount(0);

  expect(fixture.calls('wm_set_board_status').map((entry) => entry.body.p_status)).toEqual(['archived','active','trashed']);
  expect(fixture.calls('wm_delete_board_permanently')).toHaveLength(1);
  expect(fixture.calls('wm_list_boards').some((entry) => entry.body.p_status === 'archived')).toBe(true);
  expect(fixture.calls('wm_list_boards').some((entry) => entry.body.p_status === 'trashed')).toBe(true);
});

test('@m45-inactive-route-guard archived/trashed direct routes redirect to matching collection and inactive viewer menus stay suppressed', async ({ page }) => {
  test.setTimeout(45_000);
  await setup(page, '/#/boards/board-archived-owner', 'archived');
  await expect(page).toHaveURL(/#\/boards$/);
  await expect(collectionTab(page, 'archived')).toHaveAttribute('aria-pressed', 'true');
  const archivedOwner = page.locator('.board-card').filter({ has:page.getByRole('heading', { name:'Archived Owner Board' }) });
  await expect(archivedOwner).toBeVisible();
  await expect(archivedOwner).not.toHaveAttribute('role', 'link');
  const archivedViewer = page.locator('.board-card').filter({ has:page.getByRole('heading', { name:'Archived Viewer Board' }) });
  await expect(archivedViewer.getByRole('button', { name:/More actions/ })).toHaveCount(0);

  await page.goto('/#/boards/board-trashed-owner');
  await waitForM40ApplicationReady(page);
  await waitForM45CollectionReady(page, 'trashed');
  await expect(page).toHaveURL(/#\/boards$/);
  await expect(collectionTab(page, 'trashed')).toHaveAttribute('aria-pressed', 'true');
  const trashedOwner = page.locator('.board-card').filter({ has:page.getByRole('heading', { name:'Trashed Owner Board' }) });
  await expect(trashedOwner).toBeVisible();
  await expect(trashedOwner).not.toHaveAttribute('role', 'link');
  const trashedViewer = page.locator('.board-card').filter({ has:page.getByRole('heading', { name:'Trashed Viewer Board' }) });
  await expect(trashedViewer.getByRole('button', { name:/More actions/ })).toHaveCount(0);
});

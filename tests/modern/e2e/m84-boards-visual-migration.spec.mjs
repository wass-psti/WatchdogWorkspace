import { test, expect } from '@playwright/test';

test('M84 Board presentation layer is loaded and preserves interactive affordances', async ({ page }) => {
  const baseURL=process.env.WM_PLAYWRIGHT_BASE_URL; if(!baseURL) throw new Error('WM_PLAYWRIGHT_BASE_URL missing');
  await page.goto(baseURL,{waitUntil:'domcontentloaded'});
  await page.evaluate(()=>{
    document.body.dataset.wmSurface='shell';
    document.body.innerHTML=`<main class="board-detail-page"><section class="board-workspace-shell"><header class="monday-board-head"><nav class="board-view-tabs"><button role="tab" aria-selected="true">Table</button><button role="tab">Kanban</button></nav></header><div class="board-toolbar"><input data-item-search type="search" aria-label="Search items"><button id="action">Add item</button></div><section class="board-view-region"><div class="board-group"><div class="board-group-head">Group</div><div class="board-table-wrap" data-group-table-scroll><table class="board-table"><thead><tr><th>Item</th><th>Status</th></tr></thead><tbody><tr aria-selected="true"><td>Example</td><td><span class="status-pill" style="--status-color:#22c55e">Done</span></td></tr></tbody></table></div></div><div class="kanban-board"><section class="kanban-column" data-kanban-lane="done"><article class="kanban-card" data-kanban-item tabindex="0">Card</article></section></div></section><aside class="board-item-panel"><header class="item-panel-head">Item</header><nav class="item-panel-tabs"><button>Overview</button></nav><div class="item-panel-body">Body</div></aside></section></main>`;
  });
  const m84Marker=await page.locator('.board-detail-page').evaluate(el=>getComputedStyle(el).getPropertyValue('--m84-board-surface').trim()); expect(m84Marker).not.toBe('');
  const card=page.locator('.kanban-card'); await expect(card).toBeVisible(); await card.focus(); await expect(card).toBeFocused();
  const panelBg=await page.locator('.board-item-panel').evaluate(el=>getComputedStyle(el).backgroundColor); expect(panelBg).not.toBe('rgba(0, 0, 0, 0)');
  const tableRadius=await page.locator('.board-table-wrap').evaluate(el=>getComputedStyle(el).borderRadius); expect(tableRadius).not.toBe('0px');
  const action=page.locator('#action'); await action.click(); await expect(action).toBeVisible();
});

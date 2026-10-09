import { storage } from '@material/api/monday-storage';
import BoardSDK from '@material/api/BoardSDK.js';

const board = new BoardSDK();

/**
 * Storage cleanup utilities to prevent unbounded growth.
 * Run periodically to remove orphaned data from archived/deleted items.
 */

/**
 * Clean orphaned comment threads.
 * Removes comment data for items that no longer exist on the board.
 *
 * @returns {Promise<{removed: number, remaining: number}>}
 */
export async function cleanComments() {
  try {
    const COMMENTS_KEY = 'material_sourcing_comments';

    const { value: commentsMap, version } = await storage()
      .key(COMMENTS_KEY)
      .get();
    if (!commentsMap || typeof commentsMap !== 'object') {
      return { removed: 0, remaining: 0 };
    }

    // Fetch all active item IDs
    const activeIds = new Set();
    let cursor = null;

    do {
      const query = board.items().withPagination({ limit: 500, cursor });
      const { items, cursor: nextCursor } = await query.execute();
      items.forEach((item) => activeIds.add(item.id));
      cursor = nextCursor;
    } while (cursor);

    // Find orphaned comment threads
    const itemIds = Object.keys(commentsMap);
    const orphaned = itemIds.filter((id) => !activeIds.has(id));

    if (orphaned.length === 0) {
      return { removed: 0, remaining: itemIds.length };
    }

    // Remove orphaned threads
    const cleaned = { ...commentsMap };
    orphaned.forEach((id) => delete cleaned[id]);

    // Save cleaned map (retry once on version conflict)
    try {
      await storage().key(COMMENTS_KEY).version(version).set(cleaned);
    } catch (vErr) {
      // Version conflict — re-fetch and retry
      const { version: freshV } = await storage().key(COMMENTS_KEY).get();
      await storage().key(COMMENTS_KEY).version(freshV).set(cleaned);
    }

    console.log(
      `[Cleanup] Removed ${orphaned.length} orphaned comment threads`
    );
    return {
      removed: orphaned.length,
      remaining: Object.keys(cleaned).length,
    };
  } catch (err) {
    console.error('[Cleanup] Failed to clean comments:', err);
    throw err;
  }
}

/**
 * Clean stale presence data.
 * Removes entries older than 7 days (way beyond the 90s stale threshold).
 *
 * @returns {Promise<{removed: number, remaining: number}>}
 */
export async function cleanPresence() {
  try {
    const PRESENCE_KEY = 'material_sourcing_presence';
    const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

    const { value: presenceData, version } = await storage()
      .key(PRESENCE_KEY)
      .get();
    if (!presenceData || typeof presenceData !== 'object') {
      return { removed: 0, remaining: 0 };
    }

    const now = Date.now();
    const userIds = Object.keys(presenceData);
    const stale = userIds.filter((uid) => {
      const lastSeen = presenceData[uid]?.lastSeen || 0;
      return now - lastSeen > SEVEN_DAYS_MS;
    });

    if (stale.length === 0) {
      return { removed: 0, remaining: userIds.length };
    }

    const cleaned = { ...presenceData };
    stale.forEach((uid) => delete cleaned[uid]);

    // Retry once on version conflict
    try {
      await storage().key(PRESENCE_KEY).version(version).set(cleaned);
    } catch (vErr) {
      const { version: freshV } = await storage().key(PRESENCE_KEY).get();
      await storage().key(PRESENCE_KEY).version(freshV).set(cleaned);
    }

    console.log(`[Cleanup] Removed ${stale.length} stale presence entries`);
    return {
      removed: stale.length,
      remaining: Object.keys(cleaned).length,
    };
  } catch (err) {
    console.error('[Cleanup] Failed to clean presence:', err);
    throw err;
  }
}

/**
 * Run all cleanup tasks.
 * Recommended: Run weekly via scheduled job or manual trigger.
 *
 * @returns {Promise<{comments: object, presence: object}>}
 */
export async function runAllCleanup() {
  console.log('[Cleanup] Starting storage cleanup...');

  const results = await Promise.allSettled([cleanComments(), cleanPresence()]);

  const [commentsResult, presenceResult] = results;

  const summary = {
    comments:
      commentsResult.status === 'fulfilled'
        ? commentsResult.value
        : { error: commentsResult.reason },
    presence:
      presenceResult.status === 'fulfilled'
        ? presenceResult.value
        : { error: presenceResult.reason },
  };

  console.log('[Cleanup] Completed:', summary);
  return summary;
}

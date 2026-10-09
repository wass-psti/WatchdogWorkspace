/**
 * Executes async operations sequentially with a delay between each,
 * and retries on 429 (TooManyConcurrentRequests) errors.
 */
export async function rateLimitedQueue(tasks, { delay = 500, retries = 3, backoff = 1000, onProgress } = {}) {
  const results = [];
  for (let i = 0; i < tasks.length; i++) {
    const result = await retryOn429(tasks[i], retries, backoff);
    results.push(result);
    if (onProgress) onProgress(i + 1, tasks.length);
    if (i < tasks.length - 1) {
      await wait(delay);
    }
  }
  return results;
}

export async function retryOn429(fn, maxRetries = 3, baseDelay = 1000) {
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      const is429 = err?.message?.includes('429') ||
        err?.message?.includes('TooManyConcurrentRequests') ||
        err?.code === 'TooManyConcurrentRequestsException';
      if (!is429 || attempt === maxRetries) throw err;
      const delayMs = baseDelay * Math.pow(2, attempt);
      console.warn(`Rate limited, retrying in ${delayMs}ms (attempt ${attempt + 1}/${maxRetries})`);
      await wait(delayMs);
    }
  }
}

function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

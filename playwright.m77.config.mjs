const baseURL = process.env.WM_PLAYWRIGHT_BASE_URL || 'http://127.0.0.1:5173';

export default {
  testDir: './tests/modern/e2e',
  fullyParallel: false,
  forbidOnly: true,
  retries: 0,
  workers: 1,
  timeout: 45_000,
  expect: { timeout: 7_000 },
  reporter: [['line']],
  use: { baseURL, headless: true, trace: 'off', screenshot: 'off', video: 'off' },
  projects: [
    { name: 'chromium', use: { browserName: 'chromium' } },
    { name: 'firefox', use: { browserName: 'firefox' } },
    { name: 'webkit', use: { browserName: 'webkit' } },
  ],
};

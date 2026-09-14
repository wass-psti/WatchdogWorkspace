const baseURL = process.env.WM_PLAYWRIGHT_BASE_URL || 'http://127.0.0.1:5173';
const executablePath = String(process.env.WM_PLAYWRIGHT_EXECUTABLE_PATH || '').trim();

export default {
  testDir: './tests/modern/e2e',
  fullyParallel: false,
  forbidOnly: true,
  retries: 0,
  workers: 1,
  timeout: 20_000,
  expect: { timeout: 5_000 },
  reporter: [['line']],
  use: {
    baseURL,
    headless: true,
    trace: 'off',
    screenshot: 'off',
    video: 'off',
    browserName: 'chromium',
    launchOptions: executablePath ? { executablePath } : {},
  },
};

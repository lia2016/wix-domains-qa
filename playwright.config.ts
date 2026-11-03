import { defineConfig } from '@playwright/test';

// Load WIX_API_KEY / WIX_ACCOUNT_ID from .env (git-ignored).
// Node's built-in loader (Node >= 20.12), so no dotenv dependency.
try {
  process.loadEnvFile('.env');
} catch (err) {
  // No .env file: fall back to variables already set in the shell.
  // Any other error (unreadable file etc.) should fail loudly.
  if ((err as NodeJS.ErrnoException).code !== 'ENOENT') throw err;
}

export default defineConfig({
  testDir: './tests',
  // These are real production endpoints, not a test env:
  // run serially to stay polite and inside the API call budget.
  fullyParallel: false,
  workers: 1,
  // A retry would hide flakiness and spend extra API calls.
  retries: 0,
  reporter: [['list'], ['html', { open: 'never' }]],
  projects: [
    {
      name: 'api',
      testDir: './tests/api',
      // No trace for API tests: a trace would record the Authorization header.
      use: { baseURL: 'https://www.wixapis.com', trace: 'off' },
    },
  ],
});

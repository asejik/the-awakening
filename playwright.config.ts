import { defineConfig, devices } from '@playwright/test'

// Smoke tests for the critical journeys (PROJECT_PLAN §11), against the local dev server wired to
// the TEST Supabase project from .env.local. Email is forced to log mode; rows are tagged source=e2e
// and deleted afterwards (e2e/teardown.ts).
const PORT = 3200

export default defineConfig({
  testDir: 'e2e',
  fullyParallel: true,
  retries: 0,
  reporter: 'list',
  globalTeardown: './e2e/teardown.ts',
  use: {
    baseURL: `http://localhost:${PORT}`,
    ...devices['Pixel 7'],
    trace: 'retain-on-failure',
  },
  webServer: {
    command: 'node --env-file=.env.local scripts/dev-server.mjs',
    env: { PORT: String(PORT), EMAIL_MODE: 'log', REGISTRATION_OPENS_AT: '', REGISTRATION_CLOSES_AT: '', RATE_LIMIT_MAX: '1000' },
    url: `http://localhost:${PORT}/api/health`,
    reuseExistingServer: false,
    timeout: 60_000,
  },
})

import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    include: ['src/**/*.test.ts', 'api/**/*.test.ts', 'shared/**/*.test.ts', 'apps-script/**/*.test.ts'],
    environment: 'node',
  },
})

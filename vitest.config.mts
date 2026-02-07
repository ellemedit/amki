import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import tsconfigPaths from 'vite-tsconfig-paths'
import { playwright } from '@vitest/browser-playwright'

export default defineConfig({
  plugins: [tsconfigPaths(), react()],
  test: {
    projects: [
      {
        extends: true,
        test: {
          name: 'node',
          environment: 'jsdom',
          include: ['**/*.test.{ts,tsx}'],
          exclude: ['node_modules', '.next'],
        },
      },
      {
        extends: true,
        test: {
          name: 'browser',
          include: ['**/*.browser-test.{ts,tsx}'],
          exclude: ['node_modules', '.next'],
          browser: {
            enabled: true,
            provider: playwright(),
            instances: [{ browser: 'chromium' }],
          },
        },
      },
    ],
  },
})

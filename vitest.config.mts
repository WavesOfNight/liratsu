import { defineConfig } from 'vitest/config'
import tsconfigPaths from 'vite-tsconfig-paths'

export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    environment: 'node',
    include: ['tests/unit/**/*.test.ts'],
    env: { PAYLOAD_SECRET: 'test-secret', ENCRYPTION_KEY: 'test-encryption-key', NEXT_PUBLIC_SERVER_URL: 'http://localhost:3000' },
  },
})

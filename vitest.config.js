import { defineConfig } from 'vitest/config'

// Dedicated test config — intentionally does NOT load vite.config.js
// (React + PWA plugins). Current tests only exercise pure logic in
// src/lib/, so the build plugins are unnecessary and emit deprecation
// warnings under Vitest. If component tests are added later, switch
// `environment` to 'jsdom' and add @vitejs/plugin-react here.
export default defineConfig({
  test: {
    include: ['src/**/*.test.{js,jsx}'],
    environment: 'node',
  },
})

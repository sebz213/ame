import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vitest/config'

// The @ path alias mirrors tsconfig.json > paths, so tests import surface
// modules the same way the app does. Vitest's default transform (oxc) uses the
// automatic JSX runtime, so the JSON-LD components render without React in
// scope. Node environment is enough: renderToStaticMarkup needs no DOM.
export default defineConfig({
  resolve: { alias: { '@': fileURLToPath(new URL('./', import.meta.url)) } },
  test: {
    environment: 'node',
    include: ['tests/**/*.test.{ts,tsx}'],
  },
})

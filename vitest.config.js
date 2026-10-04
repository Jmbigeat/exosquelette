import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    exclude: ['**/node_modules/**', '**/dist/**', 'tests/scout.test.js'],
    reporters: ['default', ['json', { outputFile: 'tests/.vitest-last-run.json' }]],
  },
});

import { defineConfig } from 'vitest/config';
import path from 'node:path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    alias: {
      '@config': path.resolve(__dirname, './src/config'),
      '@shared': path.resolve(__dirname, './src/shared'),
    },
  },
});

import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './src/test/setup.ts',
    // ISS-01 Fix: Constrain to single fork worker to prevent Windows VM
    // thread exhaustion. pool:'forks' uses child_process.fork() which is
    // more stable than worker_threads on Windows virtualised environments.
    // maxForks:1 serialises test file execution — tests within each file
    // still run concurrently. isolate:true gives each file a clean module
    // registry, preventing state leaks between test files.
    // NOTE: poolOptions was removed in Vitest 4; these are now top-level.
    pool: 'forks',
    maxForks: 1,
    minForks: 1,
    isolate: true,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});

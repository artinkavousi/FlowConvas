import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

// The website reads ARTINOS module sources (metadata only) from the sibling STUDIO
// app, so the dev server must be allowed to read outside its own root.
const repoRoot = resolve(__dirname, '..');

export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 3002,
    fs: { allow: [repoRoot] },
  },
});

import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import path from 'path';

// The Studio consumes PANELFLOW *source* (not its built dist) so edits to PANELFLOW
// hot-reload here without an npm publish (ADR-4). The `@` alias mirrors PANELFLOW's
// own internal alias so its source resolves; the Studio's own code uses relative imports.
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@artinos/panelflow': path.resolve(__dirname, '../PANELFLOW/src/export.ts'),
      '@': path.resolve(__dirname, '../PANELFLOW/src'),
      // Consuming PANELFLOW *source* across the workspace boundary can load React
      // twice (app copy + a pre-bundled copy), which breaks useSyncExternalStore
      // ("getSnapshot should be cached"). Pin every importer to the one root copy.
      react: path.resolve(__dirname, '../node_modules/react'),
      'react-dom': path.resolve(__dirname, '../node_modules/react-dom'),
    },
    dedupe: ['react', 'react-dom'],
  },
  optimizeDeps: { include: ['react', 'react-dom', 'react/jsx-runtime'] },
  build: {
    chunkSizeWarningLimit: 850,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('tweakpane')) return 'tweakpane';
          if (id.includes('three')) return 'three';
          if (id.includes('@xyflow') || id.includes('reactflow')) return 'graph';
          if (id.includes('framer-motion') || id.includes('/motion/')) return 'motion';
        },
      },
    },
  },
  server: { port: process.env.PORT ? Number(process.env.PORT) : 3001, host: '0.0.0.0' },
});

import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig } from 'vite';
import { readFileSync } from 'fs';
import dts from 'vite-plugin-dts';

const pkg = JSON.parse(readFileSync('./package.json', 'utf-8'));
const external = [
  ...Object.keys(pkg.peerDependencies || {}),
  ...Object.keys(pkg.dependencies || {}),
  'react/jsx-runtime',
  // three is provided by the host app (shared renderer instance); never bundle it
  // or its subpaths (three/webgpu, three/tsl, three/addons/*).
  /^three(\/|$)/,
];

export default defineConfig({
  plugins: [
    react(),
    dts({
      // Emit a single bundled declaration file at dist/index.d.ts.
      entryRoot: 'src',
      include: ['src/**/*.ts', 'src/**/*.tsx'],
      // Demo-only sources pull in Three.js etc. and are not part of the public API.
      exclude: ['src/demo/**', 'src/App.tsx', 'src/main.tsx', 'src/shell/viewport.tsx', 'src/shell/ThreeRuntime.ts', 'src/nodes/**', 'src/WebGPUCapabilities.ts'],
      tsconfigPath: './tsconfig.json',
      // Bundle all declarations into a single dist/index.d.ts (package.json `types`).
      bundleTypes: true,
    }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    lib: {
      entry: {
        panelflow: path.resolve(__dirname, 'src/export.ts'),
        'frost-tweakpane': path.resolve(__dirname, 'src/lib/tweakpane_frost/frost-tweakpane.js'),
      },
      name: 'PanelFlow',
      formats: ['es', 'cjs'],
      fileName: (format, entryName) => `${entryName}.${format}.js`,
    },
    rollupOptions: {
      external,
      output: {
        globals: {
          react: 'React',
          'react-dom': 'ReactDOM',
        },
      },
    },
    cssCodeSplit: false,
    chunkSizeWarningLimit: 850,
    outDir: 'dist',
  },
});

import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'node:path';
import { defineConfig } from 'vite';

const site = import.meta.dirname;
const repo = resolve(site, '..');

export default defineConfig({
  root: site,
  base: '/linkedout/',
  publicDir: resolve(site, 'public'),
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: [
      { find: /^wxt\/browser$/, replacement: resolve(site, 'demo/fake-browser.ts') },
      { find: /^@\//, replacement: `${repo}/` },
    ],
  },
  server: { fs: { allow: [repo] } },
  build: {
    outDir: resolve(repo, '.output/site'),
    emptyOutDir: true,
    rollupOptions: {
      input: {
        home: resolve(site, 'index.html'),
        privacy: resolve(site, 'privacy/index.html'),
        popup: resolve(site, 'frames/popup/index.html'),
        settings: resolve(site, 'frames/settings/index.html'),
      },
    },
  },
});

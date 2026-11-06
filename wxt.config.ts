import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'wxt';

export default defineConfig({
  modules: ['@wxt-dev/module-react'],
  vite: () => ({
    plugins: [tailwindcss()],
  }),
  manifest: {
    name: 'LinkedOut',
    description: 'A browser extension to fix Linkedin jobs',
    action: {
      default_title: 'LinkedOut',
    },
    permissions: ['storage', 'activeTab'],
  },
});

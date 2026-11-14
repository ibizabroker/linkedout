import tailwindcss from '@tailwindcss/vite';
import { loadEnv } from 'vite';
import { defineConfig } from 'wxt';
import { trackerManifest } from './lib/tracker/manifest.ts';

export default defineConfig({
  modules: ['@wxt-dev/module-react'],
  vite: () => ({
    plugins: [tailwindcss()],
  }),
  manifest: ({ mode }) => {
    const tracker = trackerManifest(loadEnv(mode, process.cwd(), 'WXT_'));
    if (tracker === undefined) {
      console.warn(
        '[linkedout] WXT_GOOGLE_CLIENT_ID or WXT_EXTENSION_KEY is not set. Building without the Job tracker.',
      );
    }
    return {
      name: 'LinkedOut',
      description: 'A browser extension to fix Linkedin jobs',
      action: {
        default_title: 'LinkedOut',
      },
      permissions: ['storage', 'activeTab', ...(tracker?.permissions ?? [])],
      ...(tracker === undefined ? {} : { key: tracker.key, oauth2: tracker.oauth2 }),
    };
  },
});

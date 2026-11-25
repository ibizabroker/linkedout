import tailwindcss from '@tailwindcss/vite';
import { loadEnv } from 'vite';
import { defineConfig } from 'wxt';
import {
  firefoxBrowserSettings,
  firefoxTrackerManifest,
  trackerManifest,
} from './lib/tracker/manifest.ts';

export default defineConfig({
  modules: ['@wxt-dev/module-react'],
  vite: () => ({
    plugins: [tailwindcss()],
  }),
  manifest: ({ mode, browser }) => {
    const env = loadEnv(mode, process.cwd(), 'WXT_');
    const base = {
      name: 'LinkedOut',
      description:
        "Hide LinkedIn jobs you've applied to, viewed or saved, skip reposts and crowded posts, block companies, and track applications.",
      action: {
        default_title: 'LinkedOut',
      },
    };

    if (browser === 'firefox') {
      const tracker = firefoxTrackerManifest(env);
      if (tracker === undefined) {
        console.warn(
          '[linkedout] WXT_FIREFOX_GOOGLE_CLIENT_ID or WXT_GOOGLE_CLIENT_ID is not set. Building without the Job tracker.',
        );
      }
      return {
        ...base,
        permissions: ['storage', 'activeTab', ...(tracker?.permissions ?? [])],
        browser_specific_settings: firefoxBrowserSettings(env),
      };
    }

    const tracker = trackerManifest(env);
    if (tracker === undefined) {
      console.warn(
        '[linkedout] WXT_GOOGLE_CLIENT_ID or WXT_EXTENSION_KEY is not set. Building without the Job tracker.',
      );
    }
    return {
      ...base,
      permissions: ['storage', 'activeTab', ...(tracker?.permissions ?? [])],
      ...(tracker === undefined ? {} : { key: tracker.key, oauth2: tracker.oauth2 }),
    };
  },
});

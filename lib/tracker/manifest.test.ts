import { describe, expect, test } from 'bun:test';
import { firefoxBrowserSettings, firefoxTrackerManifest, trackerManifest } from './manifest.ts';

describe('trackerManifest', () => {
  test('both values add the key, identity and alarms permissions, and drive.file oauth2', () => {
    expect(trackerManifest({ WXT_GOOGLE_CLIENT_ID: ' id ', WXT_EXTENSION_KEY: 'k' })).toEqual({
      key: 'k',
      permissions: ['identity', 'alarms'],
      oauth2: { client_id: 'id', scopes: ['https://www.googleapis.com/auth/drive.file'] },
    });
  });

  test('either value missing or blank adds nothing', () => {
    expect(trackerManifest({})).toBeUndefined();
    expect(trackerManifest({ WXT_GOOGLE_CLIENT_ID: 'id' })).toBeUndefined();
    expect(trackerManifest({ WXT_EXTENSION_KEY: 'k' })).toBeUndefined();
    expect(
      trackerManifest({ WXT_GOOGLE_CLIENT_ID: 'id', WXT_EXTENSION_KEY: '  ' }),
    ).toBeUndefined();
  });
});

describe('firefoxTrackerManifest', () => {
  test('prefers WXT_FIREFOX_GOOGLE_CLIENT_ID and falls back to WXT_GOOGLE_CLIENT_ID', () => {
    expect(firefoxTrackerManifest({ WXT_FIREFOX_GOOGLE_CLIENT_ID: ' ff-id ' })).toEqual({
      permissions: ['identity', 'alarms'],
    });
    expect(firefoxTrackerManifest({ WXT_GOOGLE_CLIENT_ID: ' id ' })).toEqual({
      permissions: ['identity', 'alarms'],
    });
  });

  test('missing or blank client id adds nothing', () => {
    expect(firefoxTrackerManifest({})).toBeUndefined();
    expect(firefoxTrackerManifest({ WXT_FIREFOX_GOOGLE_CLIENT_ID: '  ' })).toBeUndefined();
  });
});

describe('firefoxBrowserSettings', () => {
  test('uses default gecko id and declares no data collection', () => {
    expect(firefoxBrowserSettings({})).toEqual({
      gecko: {
        id: 'linkedout@ibizabroker.github.io',
        data_collection_permissions: {
          required: ['none'],
        },
      },
    });
  });

  test('uses WXT_FIREFOX_EXTENSION_ID when set', () => {
    expect(firefoxBrowserSettings({ WXT_FIREFOX_EXTENSION_ID: ' custom@example.com ' })).toEqual({
      gecko: {
        id: 'custom@example.com',
        data_collection_permissions: {
          required: ['none'],
        },
      },
    });
  });
});

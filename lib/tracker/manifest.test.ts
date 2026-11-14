import { describe, expect, test } from 'bun:test';
import { trackerManifest } from './manifest.ts';

describe('trackerManifest', () => {
  test('both values add the key, identity permission, and drive.file oauth2', () => {
    expect(trackerManifest({ WXT_GOOGLE_CLIENT_ID: ' id ', WXT_EXTENSION_KEY: 'k' })).toEqual({
      key: 'k',
      permissions: ['identity'],
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

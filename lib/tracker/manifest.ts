const DRIVE_FILE_SCOPE = 'https://www.googleapis.com/auth/drive.file';
const DEFAULT_FIREFOX_ID = 'linkedout@ibizabroker.github.io';

export type TrackerManifest = {
  readonly key: string;
  readonly permissions: readonly ['identity', 'alarms'];
  readonly oauth2: {
    readonly client_id: string;
    readonly scopes: readonly [typeof DRIVE_FILE_SCOPE];
  };
};

export type FirefoxTrackerManifest = {
  readonly permissions: readonly ['identity', 'alarms'];
};

export type FirefoxBrowserSettings = {
  readonly gecko: {
    readonly id: string;
    readonly data_collection_permissions: {
      readonly required: readonly ['none'];
    };
  };
};

export function trackerManifest(env: {
  readonly WXT_GOOGLE_CLIENT_ID?: string;
  readonly WXT_EXTENSION_KEY?: string;
}): TrackerManifest | undefined {
  const clientId = env.WXT_GOOGLE_CLIENT_ID?.trim();
  const key = env.WXT_EXTENSION_KEY?.trim();
  if (!clientId || !key) {
    return undefined;
  }
  return {
    key,
    permissions: ['identity', 'alarms'],
    oauth2: { client_id: clientId, scopes: [DRIVE_FILE_SCOPE] },
  };
}

export function firefoxTrackerManifest(env: {
  readonly WXT_FIREFOX_GOOGLE_CLIENT_ID?: string;
  readonly WXT_GOOGLE_CLIENT_ID?: string;
}): FirefoxTrackerManifest | undefined {
  const clientId = env.WXT_FIREFOX_GOOGLE_CLIENT_ID?.trim() || env.WXT_GOOGLE_CLIENT_ID?.trim();
  if (!clientId) {
    return undefined;
  }
  return {
    permissions: ['identity', 'alarms'],
  };
}

export function firefoxBrowserSettings(env: {
  readonly WXT_FIREFOX_EXTENSION_ID?: string;
}): FirefoxBrowserSettings {
  const id = env.WXT_FIREFOX_EXTENSION_ID?.trim() || DEFAULT_FIREFOX_ID;
  return {
    gecko: {
      id,
      data_collection_permissions: {
        required: ['none'],
      },
    },
  };
}

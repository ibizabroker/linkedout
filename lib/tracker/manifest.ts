const DRIVE_FILE_SCOPE = 'https://www.googleapis.com/auth/drive.file';

export type TrackerManifest = {
  readonly key: string;
  readonly permissions: readonly ['identity', 'alarms'];
  readonly oauth2: {
    readonly client_id: string;
    readonly scopes: readonly [typeof DRIVE_FILE_SCOPE];
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

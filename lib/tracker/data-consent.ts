import { browser } from 'wxt/browser';

const CONSENT = { data_collection: ['browsingActivity'] };

type DataCollectionPermissions = {
  request(permissions: typeof CONSENT): Promise<boolean>;
  contains(permissions: typeof CONSENT): Promise<boolean>;
  remove(permissions: typeof CONSENT): Promise<boolean>;
};

function permissions(): DataCollectionPermissions {
  return browser.permissions as unknown as DataCollectionPermissions;
}

export function requestDataConsent(): Promise<boolean> {
  return import.meta.env.FIREFOX ? permissions().request(CONSENT) : Promise.resolve(true);
}

export async function hasDataConsent(): Promise<boolean> {
  return !import.meta.env.FIREFOX || (await permissions().contains(CONSENT));
}

export async function revokeDataConsent(): Promise<void> {
  if (import.meta.env.FIREFOX) {
    await permissions().remove(CONSENT);
  }
}

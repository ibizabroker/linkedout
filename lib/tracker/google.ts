import { browser } from 'wxt/browser';
import {
  classifyCheck,
  classifySignInError,
  sheetFromId,
  type CheckResult,
  type SignInFailure,
  type TrackerSheet,
} from './domain.ts';
import {
  batchUpdateUrl,
  createFileBody,
  createFileUrl,
  findTrackerUrl,
  fileUrl,
  formatBody,
  parseFileId,
  parseFirstSheetId,
  parseFoundFileId,
  sheetPropertiesUrl,
} from './sheet-requests.ts';

const REVOKE_URL = 'https://oauth2.googleapis.com/revoke';

export class SignInError extends Error {
  readonly failure: SignInFailure;

  constructor(message: string | undefined) {
    super(message ?? 'Sign-in failed');
    this.failure = classifySignInError(message);
  }
}

export class GoogleApiError extends Error {
  readonly status: number;

  constructor(status: number) {
    super(`Google API responded ${status}`);
    this.status = status;
  }
}

async function getToken(interactive: boolean): Promise<string> {
  let token: string | undefined;
  try {
    token = (await browser.identity.getAuthToken({ interactive })).token;
  } catch (error) {
    throw new SignInError(error instanceof Error ? error.message : undefined);
  }
  if (token === undefined || token.length === 0) {
    throw new SignInError(undefined);
  }
  return token;
}

async function send(interactive: boolean, url: string, init: RequestInit = {}): Promise<Response> {
  const attempt = async (token: string): Promise<Response> =>
    fetch(url, {
      ...init,
      headers: { ...init.headers, Authorization: `Bearer ${token}` },
    });
  const token = await getToken(interactive);
  const response = await attempt(token);
  if (response.status !== 401) {
    return response;
  }
  await browser.identity.removeCachedAuthToken({ token });
  return attempt(await getToken(interactive));
}

async function sendJson(interactive: boolean, url: string, body?: unknown): Promise<unknown> {
  const response = await send(
    interactive,
    url,
    body === undefined
      ? {}
      : {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        },
  );
  if (!response.ok) {
    throw new GoogleApiError(response.status);
  }
  return response.json();
}

async function findSheet(interactive: boolean): Promise<TrackerSheet | undefined> {
  const id = parseFoundFileId(await sendJson(interactive, findTrackerUrl()));
  return id === undefined ? undefined : sheetFromId(id);
}

async function createSheet(interactive: boolean): Promise<TrackerSheet> {
  const id = parseFileId(await sendJson(interactive, createFileUrl(), createFileBody()));
  if (id === undefined) {
    throw new Error('Drive did not return a file id');
  }
  try {
    const sheetId = parseFirstSheetId(await sendJson(interactive, sheetPropertiesUrl(id)));
    if (sheetId === undefined) {
      throw new Error('The new spreadsheet has no sheet');
    }
    await sendJson(interactive, batchUpdateUrl(id), formatBody(sheetId));
  } catch (error) {
    await send(interactive, fileUrl(id), { method: 'DELETE' }).catch(() => undefined);
    throw error;
  }
  return sheetFromId(id);
}

export async function connectSheet(): Promise<TrackerSheet> {
  return (await findSheet(true)) ?? createSheet(true);
}

export function recreateSheet(): Promise<TrackerSheet> {
  return createSheet(true);
}

export async function checkSheet(sheet: TrackerSheet): Promise<CheckResult> {
  try {
    const response = await send(false, fileUrl(sheet.spreadsheetId, 'trashed'));
    const trashed =
      response.status === 200
        ? ((await response.json()) as { trashed?: unknown }).trashed === true
        : undefined;
    return classifyCheck(response.status, trashed);
  } catch {
    return 'error';
  }
}

export async function signOut(): Promise<void> {
  let token: string | undefined;
  try {
    token = (await browser.identity.getAuthToken({ interactive: false })).token;
  } catch {
    return;
  }
  if (token === undefined) {
    return;
  }
  await fetch(`${REVOKE_URL}?${new URLSearchParams({ token })}`, { method: 'POST' }).catch(
    () => undefined,
  );
  await browser.identity.removeCachedAuthToken({ token }).catch(() => undefined);
}

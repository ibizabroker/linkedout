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

  constructor(failure: SignInFailure, message: string) {
    super(message);
    this.failure = failure;
  }
}

export class GoogleApiError extends Error {
  readonly status: number;

  constructor(status: number) {
    super(`Google API responded ${status}`);
    this.status = status;
  }
}

const SIGN_IN_TIMEOUT_MS = 120_000;

function interactiveTimeout(): { readonly promise: Promise<never>; readonly stop: () => void } {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const promise = new Promise<never>((_, reject) => {
    timer = setTimeout(() => {
      reject(new SignInError('cancelled', 'Sign-in timed out'));
    }, SIGN_IN_TIMEOUT_MS);
  });
  return { promise, stop: () => clearTimeout(timer) };
}

async function getToken(interactive: boolean): Promise<string> {
  const timeout = interactive ? interactiveTimeout() : undefined;
  try {
    const request = browser.identity.getAuthToken({ interactive });
    const { token } = await (timeout === undefined
      ? request
      : Promise.race([request, timeout.promise]));
    if (token === undefined || token.length === 0) {
      throw new SignInError('failed', 'No token returned');
    }
    return token;
  } catch (error) {
    if (error instanceof SignInError) {
      throw error;
    }
    const message = error instanceof Error ? error.message : 'Sign-in failed';
    throw new SignInError(classifySignInError(message), message);
  } finally {
    timeout?.stop();
  }
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

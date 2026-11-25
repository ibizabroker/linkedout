import type { SignInFailure } from './domain.ts';

const GOOGLE_AUTH_URL = 'https://accounts.google.com/o/oauth2/v2/auth';
const DRIVE_FILE_SCOPE = 'https://www.googleapis.com/auth/drive.file';
const DEFAULT_EXPIRES_IN_SECONDS = 3600;
const TOKEN_SAFETY_MARGIN_MS = 60_000;

export const FIREFOX_TOKEN_KEY = 'tracker-auth-token';

export type CachedToken = {
  readonly token: string;
  readonly expiresAt: number;
};

export type RedirectParseResult =
  | { readonly ok: true; readonly cached: CachedToken }
  | { readonly ok: false; readonly failure: SignInFailure; readonly message: string };

export function firefoxGoogleClientId(
  env: {
    readonly WXT_FIREFOX_GOOGLE_CLIENT_ID?: unknown;
    readonly WXT_GOOGLE_CLIENT_ID?: unknown;
  } = import.meta.env as Record<string, unknown>,
): string | undefined {
  const firefoxId =
    typeof env.WXT_FIREFOX_GOOGLE_CLIENT_ID === 'string'
      ? env.WXT_FIREFOX_GOOGLE_CLIENT_ID.trim()
      : '';
  const chromeId =
    typeof env.WXT_GOOGLE_CLIENT_ID === 'string' ? env.WXT_GOOGLE_CLIENT_ID.trim() : '';
  const value = firefoxId || chromeId;
  return value.length > 0 ? value : undefined;
}

export function buildGoogleAuthUrl(params: {
  readonly clientId: string;
  readonly redirectUri: string;
  readonly state: string;
  readonly scope?: string;
}): string {
  const query = new URLSearchParams({
    client_id: params.clientId,
    redirect_uri: params.redirectUri,
    response_type: 'token',
    scope: params.scope ?? DRIVE_FILE_SCOPE,
    state: params.state,
    include_granted_scopes: 'true',
  });
  return `${GOOGLE_AUTH_URL}?${query.toString()}`;
}

export function parseGoogleAuthRedirect(
  redirectUrl: string,
  expectedState: string,
  now: number = Date.now(),
): RedirectParseResult {
  let parsed: URL;
  try {
    parsed = new URL(redirectUrl);
  } catch {
    return { ok: false, failure: 'failed', message: 'Invalid redirect URL' };
  }

  const fragment = parsed.hash.startsWith('#') ? parsed.hash.slice(1) : parsed.hash;
  const params = new URLSearchParams(fragment || parsed.search);
  const error = params.get('error');
  if (error !== null) {
    return {
      ok: false,
      failure: error === 'access_denied' ? 'cancelled' : 'failed',
      message: error,
    };
  }

  const state = params.get('state');
  if (state !== expectedState) {
    return { ok: false, failure: 'failed', message: 'OAuth state mismatch' };
  }

  const token = params.get('access_token');
  if (token === null || token.length === 0) {
    return { ok: false, failure: 'failed', message: 'No token returned' };
  }

  const rawExpires = Number(params.get('expires_in'));
  const expiresInSeconds =
    Number.isFinite(rawExpires) && rawExpires > 0 ? rawExpires : DEFAULT_EXPIRES_IN_SECONDS;

  return {
    ok: true,
    cached: {
      token,
      expiresAt: now + expiresInSeconds * 1000,
    },
  };
}

export function parseCachedToken(raw: unknown, now: number = Date.now()): string | undefined {
  if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) {
    return undefined;
  }
  const record = raw as Record<string, unknown>;
  const { token, expiresAt } = record;
  if (
    typeof token !== 'string' ||
    token.length === 0 ||
    typeof expiresAt !== 'number' ||
    !Number.isFinite(expiresAt) ||
    expiresAt <= now + TOKEN_SAFETY_MARGIN_MS
  ) {
    return undefined;
  }
  return token;
}

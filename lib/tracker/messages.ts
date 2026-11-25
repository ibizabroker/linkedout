import { parseStats, type StoredStats } from '../stats/cache.ts';
import { parseSheet, type CheckResult, type TrackerSheet } from './domain.ts';

export const TRACKER_REQUEST = 'linkedout/tracker';

export type TrackerAction =
  | 'connect'
  | 'disconnect'
  | 'recreate'
  | 'reconnect'
  | 'check'
  | 'refresh-stats';

export type ActionReply =
  | { readonly status: 'done'; readonly sheet: TrackerSheet | null }
  | { readonly status: 'cancelled' }
  | { readonly status: 'failed' };

export type StatsReply =
  | { readonly status: 'done'; readonly stats: StoredStats }
  | { readonly status: 'failed' };

export type UserAction = Exclude<TrackerAction, 'check' | 'refresh-stats'>;

const ACTIONS: readonly string[] = [
  'connect',
  'disconnect',
  'recreate',
  'reconnect',
  'check',
  'refresh-stats',
];
const CHECK_RESULTS: readonly string[] = ['ok', 'missing', 'error'];

export function parseRequest(raw: unknown): TrackerAction | undefined {
  if (typeof raw !== 'object' || raw === null) {
    return undefined;
  }
  const { type, action } = raw as Record<string, unknown>;
  return type === TRACKER_REQUEST && typeof action === 'string' && ACTIONS.includes(action)
    ? (action as TrackerAction)
    : undefined;
}

export function parseActionReply(raw: unknown): ActionReply | undefined {
  const status = (raw as { status?: unknown } | null)?.status;
  if (status === 'cancelled' || status === 'failed') {
    return { status };
  }
  if (status !== 'done') {
    return undefined;
  }
  const sheet = (raw as { sheet?: unknown }).sheet;
  if (sheet === null) {
    return { status, sheet: null };
  }
  const parsed = parseSheet(sheet);
  return parsed === null ? undefined : { status, sheet: parsed };
}

export function parseCheckReply(raw: unknown): CheckResult | undefined {
  const status = (raw as { status?: unknown } | null)?.status;
  return typeof status === 'string' && CHECK_RESULTS.includes(status)
    ? (status as CheckResult)
    : undefined;
}

export function parseStatsReply(raw: unknown): StatsReply | undefined {
  const { status, stats } = (raw ?? {}) as { status?: unknown; stats?: unknown };
  if (status === 'failed') {
    return { status };
  }
  const parsed = parseStats(stats);
  return status === 'done' && parsed !== null
    ? { status, stats: { version: 1, ...parsed } }
    : undefined;
}

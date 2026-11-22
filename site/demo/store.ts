import { parseLimitDocument, serializeLimit } from '@/lib/hide/applicants';
import { parseReplaceDocument, serializeHideSet } from '@/lib/hide/domain';
import { parsePreviewMessage, serializePageReport } from '@/lib/hide/page-report';
import type { Status } from '@/lib/tracker/columns';
import { parseRequest, type ActionReply } from '@/lib/tracker/messages';
import {
  initialState,
  pageReport,
  storageOf,
  withApplication,
  withBlock,
  withConnection,
  withHideSet,
  withLimit,
  withNewSheet,
  withPreview,
  withRenewedSignIn,
  withRowStatus,
  withTab,
  withUnblock,
  withoutConnection,
  type DemoState,
  type DemoTab,
} from './state';

const REPLACE_HIDE_SET = 'linkedout/hide-set/replace';
const REPLACE_LIMIT = 'linkedout/applicant-limit/replace';
const BLOCK_COMPANY = 'linkedout/blocklist/block';
const UNBLOCK_COMPANY = 'linkedout/blocklist/unblock';

export const CONNECT_DELAY_MS = 800;

export type StorageChange = {
  readonly oldValue?: unknown;
  readonly newValue?: unknown;
};

export type StorageChanges = Readonly<Record<string, StorageChange>>;

export type PageReportHandle = {
  readonly receive: (message: unknown) => void;
  readonly close: () => void;
};

export type DemoStore = {
  readonly getState: () => DemoState;
  readonly subscribe: (listener: () => void) => () => void;
  readonly storage: () => Record<string, unknown>;
  readonly watchStorage: (listener: (changes: StorageChanges) => void) => () => void;
  readonly handleMessage: (message: unknown) => Promise<unknown> | undefined;
  readonly openPageReport: (send: (message: unknown) => void) => PageReportHandle;
  readonly apply: (jobId: string) => void;
  readonly setRowStatus: (jobId: string, status: Status) => void;
  readonly setTab: (tab: DemoTab) => void;
  readonly reset: () => void;
};

export type StoreOptions = {
  readonly connectDelayMs?: number;
  readonly now?: () => number;
};

export function createDemoStore(options: StoreOptions = {}): DemoStore {
  const connectDelayMs = options.connectDelayMs ?? CONNECT_DELAY_MS;
  const now = options.now ?? Date.now;
  let state = initialState();
  let epoch = 0;
  const subscribers = new Set<() => void>();
  const storageWatchers = new Set<(changes: StorageChanges) => void>();
  const reports = new Set<{ send: (message: unknown) => void; last: string | undefined }>();

  function commit(next: DemoState): void {
    if (next === state) {
      return;
    }
    const before = storageOf(state);
    const after = storageOf(next);
    state = next;
    for (const listener of [...subscribers]) {
      listener();
    }
    const changes = diff(before, after);
    if (Object.keys(changes).length > 0) {
      for (const watcher of [...storageWatchers]) {
        watcher(changes);
      }
    }
    for (const report of [...reports]) {
      publish(report);
    }
  }

  function publish(report: { send: (message: unknown) => void; last: string | undefined }): void {
    const message = serializePageReport(pageReport(state));
    const text = JSON.stringify(message);
    if (text !== report.last) {
      report.last = text;
      report.send(message);
    }
  }

  function handleTracker(action: string): Promise<unknown> {
    const startedIn = epoch;
    switch (action) {
      case 'connect':
        return delay(connectDelayMs).then((): ActionReply => {
          if (epoch !== startedIn) {
            return { status: 'cancelled' };
          }
          if (state.connection === null) {
            commit(withConnection(state, now()));
          }
          return doneReply();
        });
      case 'disconnect':
        commit(withoutConnection(state));
        return Promise.resolve({ status: 'done', sheet: null });
      case 'reconnect':
        if (state.connection === null) {
          return Promise.resolve({ status: 'failed' });
        }
        commit(withRenewedSignIn(state));
        return Promise.resolve(doneReply());
      case 'recreate':
        if (state.connection === null) {
          return Promise.resolve({ status: 'failed' });
        }
        commit(withNewSheet(state));
        return Promise.resolve(doneReply());
      default:
        return Promise.resolve({ status: 'ok' });
    }
  }

  function doneReply(): ActionReply {
    return { status: 'done', sheet: state.connection?.sheet ?? null };
  }

  return {
    getState: () => state,
    subscribe(listener) {
      subscribers.add(listener);
      return () => {
        subscribers.delete(listener);
      };
    },
    storage: () => storageOf(state),
    watchStorage(listener) {
      storageWatchers.add(listener);
      return () => {
        storageWatchers.delete(listener);
      };
    },
    handleMessage(message) {
      if (!isRecord(message) || typeof message.type !== 'string') {
        return undefined;
      }
      switch (message.type) {
        case REPLACE_HIDE_SET: {
          const set = parseReplaceDocument(message.document);
          if (set === undefined) {
            return Promise.reject(new Error('Rejected hide set replace'));
          }
          commit(withHideSet(state, set));
          return Promise.resolve(serializeHideSet(set));
        }
        case REPLACE_LIMIT: {
          const limit = parseLimitDocument(message.document);
          if (limit === undefined) {
            return Promise.reject(new Error('Rejected applicant limit replace'));
          }
          commit(withLimit(state, limit));
          return Promise.resolve(serializeLimit(limit));
        }
        case BLOCK_COMPANY:
        case UNBLOCK_COMPANY: {
          const name = message.name;
          if (typeof name !== 'string' || name.trim() === '') {
            return Promise.reject(new Error('Rejected blocklist change'));
          }
          commit(
            message.type === BLOCK_COMPANY
              ? withBlock(state, name, now())
              : withUnblock(state, name),
          );
          return Promise.resolve(true);
        }
        default: {
          const action = parseRequest(message);
          return action === undefined ? undefined : handleTracker(action);
        }
      }
    },
    openPageReport(send) {
      const report: { send: (message: unknown) => void; last: string | undefined } = {
        send,
        last: undefined,
      };
      reports.add(report);
      queueMicrotask(() => {
        if (reports.has(report)) {
          publish(report);
        }
      });
      return {
        receive(message) {
          const limit = parsePreviewMessage(message);
          if (limit !== undefined && reports.has(report)) {
            commit(withPreview(state, limit));
          }
        },
        close() {
          if (reports.delete(report) && state.preview !== undefined) {
            commit(withPreview(state, undefined));
          }
        },
      };
    },
    apply(jobId) {
      commit(withApplication(state, jobId, now()));
    },
    setRowStatus(jobId, status) {
      commit(withRowStatus(state, jobId, status));
    },
    setTab(tab) {
      commit(withTab(state, tab));
    },
    reset() {
      epoch += 1;
      commit(initialState());
    },
  };
}

function diff(
  before: Record<string, unknown>,
  after: Record<string, unknown>,
): Record<string, StorageChange> {
  const changes: Record<string, StorageChange> = {};
  for (const key of new Set([...Object.keys(before), ...Object.keys(after)])) {
    if (JSON.stringify(before[key]) !== JSON.stringify(after[key])) {
      changes[key] = { oldValue: before[key], newValue: after[key] };
    }
  }
  return changes;
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

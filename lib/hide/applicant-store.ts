import { browser } from 'wxt/browser';
import {
  parseLimitDocument,
  parseStoredLimit,
  serializeLimit,
  type ApplicantLimit,
  type StoredLimitRead,
} from '@/lib/hide/applicants';

const APPLICANT_LIMIT_KEY = 'applicant-limit';
const REPLACE_LIMIT = 'linkedout/applicant-limit/replace';

export function watchApplicantLimit(onRead: (read: StoredLimitRead) => void): () => void {
  let stopped = false;

  void browser.storage.local.get(APPLICANT_LIMIT_KEY).then(
    (stored) => {
      if (!stopped) {
        onRead(parseStoredLimit(stored[APPLICANT_LIMIT_KEY]));
      }
    },
    () => {
      if (!stopped) {
        onRead({ status: 'unreadable' });
      }
    },
  );

  const onChanged: Parameters<typeof browser.storage.onChanged.addListener>[0] = (
    changes,
    areaName,
  ) => {
    const change = areaName === 'local' ? changes[APPLICANT_LIMIT_KEY] : undefined;
    if (change !== undefined) {
      onRead(parseStoredLimit(change.newValue));
    }
  };
  browser.storage.onChanged.addListener(onChanged);

  return () => {
    stopped = true;
    browser.storage.onChanged.removeListener(onChanged);
  };
}

export function requestApplicantLimit(limit: ApplicantLimit): Promise<ApplicantLimit> {
  return browser.runtime
    .sendMessage({ type: REPLACE_LIMIT, document: serializeLimit(limit) })
    .then((reply: unknown) => {
      const stored = parseLimitDocument(reply);
      if (stored === undefined) {
        throw new Error('Rejected applicant limit replace');
      }
      return stored;
    });
}

export function startApplicantLimitOwner(): void {
  browser.runtime.onMessage.addListener((message, sender) => {
    if (!isReplaceMessage(message)) {
      return;
    }
    if (sender.id !== browser.runtime.id || !extensionSender(sender)) {
      return Promise.reject(new Error('Rejected applicant limit replace'));
    }
    const next = parseLimitDocument(message.document);
    if (next === undefined) {
      return Promise.reject(new Error('Rejected applicant limit replace'));
    }
    return browser.storage.local
      .set({ [APPLICANT_LIMIT_KEY]: serializeLimit(next) })
      .then(() => serializeLimit(next));
  });
}

function extensionSender(sender: { readonly tab?: unknown; readonly url?: string }): boolean {
  return sender.tab === undefined || sender.url?.startsWith(browser.runtime.getURL('')) === true;
}

function isReplaceMessage(message: unknown): message is {
  readonly type: typeof REPLACE_LIMIT;
  readonly document: unknown;
} {
  return (
    typeof message === 'object' &&
    message !== null &&
    (message as Record<string, unknown>).type === REPLACE_LIMIT &&
    'document' in message
  );
}

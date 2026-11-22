import { ownerStore } from './owner';
import type { PageReportHandle, StorageChanges } from './store';

type Listener<Args extends unknown[]> = (...args: Args) => void;

function createEvent<Args extends unknown[]>(): {
  readonly addListener: (listener: Listener<Args>) => void;
  readonly removeListener: (listener: Listener<Args>) => void;
  readonly fire: (...args: Args) => void;
} {
  const listeners = new Set<Listener<Args>>();
  return {
    addListener: (listener) => {
      listeners.add(listener);
    },
    removeListener: (listener) => {
      listeners.delete(listener);
    },
    fire: (...args) => {
      for (const listener of [...listeners]) {
        listener(...args);
      }
    },
  };
}

function copy<T>(value: T): T {
  return value === undefined ? value : structuredClone(value);
}

const PAGE_TAB = {
  id: 1,
  active: true,
  url: 'https://www.linkedin.com/jobs/search/?keywords=frontend',
};

function createPort(name: string): {
  readonly name: string;
  readonly postMessage: (message: unknown) => void;
  readonly disconnect: () => void;
  readonly onMessage: ReturnType<typeof createEvent<[unknown]>>;
  readonly onDisconnect: ReturnType<typeof createEvent<[]>>;
} {
  const onMessage = createEvent<[unknown]>();
  const onDisconnect = createEvent<[]>();
  const handle: PageReportHandle = ownerStore().openPageReport((message) => {
    onMessage.fire(copy(message));
  });
  return {
    name,
    onMessage,
    onDisconnect,
    postMessage: (message) => {
      handle.receive(copy(message));
    },
    disconnect: () => {
      handle.close();
    },
  };
}

function selected(keys: unknown, all: Record<string, unknown>): Record<string, unknown> {
  if (keys === undefined || keys === null) {
    return all;
  }
  const wanted = typeof keys === 'string' ? [keys] : Array.isArray(keys) ? keys : Object.keys(keys);
  const result: Record<string, unknown> = {};
  for (const key of wanted) {
    if (typeof key === 'string' && Object.hasOwn(all, key)) {
      result[key] = all[key];
    }
  }
  return result;
}

const watchers = new Map<unknown, () => void>();

export const browser = {
  runtime: {
    id: 'demo',
    getURL: (path: string) => `/${path}`,
    getManifest: () => ({ name: 'LinkedOut', manifest_version: 3, oauth2: {} }),
    openOptionsPage: (): Promise<void> => {
      ownerStore().setTab('settings');
      return Promise.resolve();
    },
    sendMessage: async (message: unknown): Promise<unknown> => {
      const reply = ownerStore().handleMessage(copy(message));
      return reply === undefined ? undefined : copy(await reply);
    },
    onMessage: createEvent<[unknown, unknown]>(),
  },
  storage: {
    local: {
      get: (keys?: unknown): Promise<Record<string, unknown>> =>
        Promise.resolve(copy(selected(keys, ownerStore().storage()))),
      set: (): Promise<void> =>
        Promise.reject(new Error('The demo changes storage through messages only')),
      remove: (): Promise<void> =>
        Promise.reject(new Error('The demo changes storage through messages only')),
    },
    onChanged: {
      addListener: (listener: (changes: StorageChanges, area: string) => void): void => {
        watchers.set(
          listener,
          ownerStore().watchStorage((changes) => {
            listener(copy(changes), 'local');
          }),
        );
      },
      removeListener: (listener: (changes: StorageChanges, area: string) => void): void => {
        watchers.get(listener)?.();
        watchers.delete(listener);
      },
    },
  },
  tabs: {
    query: (): Promise<(typeof PAGE_TAB)[]> => Promise.resolve([{ ...PAGE_TAB }]),
    connect: (_tabId: number, info: { readonly name: string }) => createPort(info.name),
  },
};

if (typeof document !== 'undefined' && window.parent !== window) {
  document.addEventListener(
    'click',
    (event) => {
      const link = event.target instanceof Element ? event.target.closest('a[href]') : null;
      if (link?.getAttribute('aria-label') === 'Open sheet') {
        event.preventDefault();
        ownerStore().setTab('sheet');
      }
    },
    true,
  );
}

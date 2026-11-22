import type { DemoStore } from './store';

export type DemoWindow = Window & { __linkedoutDemo?: DemoStore };

export function ownerStore(): DemoStore {
  const store = (window.parent as DemoWindow).__linkedoutDemo;
  if (store === undefined) {
    throw new Error('The demo state owner is not running in the parent page');
  }
  return store;
}

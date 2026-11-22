import type { DemoWindow } from './owner';
import { createDemoStore, type DemoStore } from './store';

export const demoStore: DemoStore = createDemoStore();

(window as DemoWindow).__linkedoutDemo = demoStore;

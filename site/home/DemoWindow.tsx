import {
  useRef,
  type KeyboardEvent,
  type ReactElement,
  type ReactNode,
} from 'react';
import logoUrl from '@/assets/icon.svg';
import { demoStore } from '../demo/install';
import type { DemoTab } from '../demo/state';

const TABS: readonly {
  readonly id: DemoTab;
  readonly long: string;
  readonly short: string;
  readonly address: string;
}[] = [
  {
    id: 'jobs',
    long: 'Jobs',
    short: 'Jobs',
    address: 'jobs.example/search?keywords=frontend',
  },
  {
    id: 'settings',
    long: 'LinkedOut Settings',
    short: 'Settings',
    address: 'linkedout · settings',
  },
  {
    id: 'sheet',
    long: 'LinkedOut Job Tracker',
    short: 'Job Tracker',
    address: 'sheets.example/linkedout-job-tracker',
  },
];

export function DemoWindow(props: {
  readonly tab: DemoTab;
  readonly openedTabs: readonly DemoTab[];
  readonly popupOpen: boolean;
  readonly onTogglePopup: () => void;
  readonly panels: Readonly<Record<DemoTab, ReactNode>>;
}): ReactElement {
  const list = useRef<HTMLDivElement>(null);
  const visible = TABS.filter((tab) => props.openedTabs.includes(tab.id));
  const current = TABS.find((tab) => tab.id === props.tab) ?? TABS[0]!;

  function move(event: KeyboardEvent<HTMLDivElement>): void {
    const at = visible.findIndex((tab) => tab.id === props.tab);
    const target =
      event.key === 'ArrowRight'
        ? visible[(at + 1) % visible.length]
        : event.key === 'ArrowLeft'
          ? visible[(at - 1 + visible.length) % visible.length]
          : event.key === 'Home'
            ? visible[0]
            : event.key === 'End'
              ? visible[visible.length - 1]
              : undefined;
    if (target === undefined) {
      return;
    }
    event.preventDefault();
    demoStore.setTab(target.id);
    list.current?.querySelector<HTMLElement>(`#tab-${target.id}`)?.focus();
  }

  function toggle(): void {
    if (props.tab !== 'jobs') {
      demoStore.setTab('jobs');
      if (!props.popupOpen) {
        props.onTogglePopup();
      }
      return;
    }
    props.onTogglePopup();
  }

  const popupShown = props.popupOpen && props.tab === 'jobs';

  return (
    <div className="window">
      <div className="bar">
        <span className="dots" aria-hidden="true">
          <i />
          <i />
          <i />
        </span>
        <div
          ref={list}
          role="tablist"
          aria-label="Demo tabs"
          className="tabs"
          onKeyDown={move}
        >
          {visible.map((tab) => (
            <button
              key={tab.id}
              id={`tab-${tab.id}`}
              type="button"
              role="tab"
              className="tab"
              aria-selected={props.tab === tab.id}
              aria-controls={`panel-${tab.id}`}
              tabIndex={props.tab === tab.id ? 0 : -1}
              onClick={() => demoStore.setTab(tab.id)}
            >
              <span className="tab-long">{tab.long}</span>
              <span className="tab-short">{tab.short}</span>
            </button>
          ))}
        </div>
        <div className="address">{current.address}</div>
        <button
          type="button"
          className="toolbar-icon"
          aria-label="LinkedOut"
          aria-pressed={popupShown}
          onClick={toggle}
        >
          <img src={logoUrl} alt="" width={20} height={20} />
        </button>
      </div>
      <div className="window-body">
        {TABS.map((tab) => (
          <section
            key={tab.id}
            id={`panel-${tab.id}`}
            role="tabpanel"
            aria-labelledby={`tab-${tab.id}`}
            hidden={props.tab !== tab.id}
            className="panel"
          >
            {props.panels[tab.id]}
          </section>
        ))}
      </div>
    </div>
  );
}

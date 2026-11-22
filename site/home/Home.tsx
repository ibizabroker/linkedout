import { RotateCcw } from 'lucide-react';
import { useState, type ReactElement } from 'react';
import { closeBlockConfirmation } from '@/lib/block/confirm-panel';
import { demoStore } from '../demo/install';
import { DemoWindow } from './DemoWindow';
import { Frame } from './Frame';
import { Hero } from './Hero';
import { JobDetails } from './JobDetails';
import { JobList } from './JobList';
import { OpenSource } from './OpenSource';
import { PopupFrame } from './PopupFrame';
import { Footer, Topbar } from './SiteChrome';
import { SheetTable } from './SheetTable';
import { TallyLine } from './TallyLine';
import { useDemo } from './useDemo';

export function Home(): ReactElement {
  const { state, jobs, tally } = useDemo();
  const [selectedId, setSelectedId] = useState(jobs[0]?.id ?? '');
  const [popupOpen, setPopupOpen] = useState(true);
  const selected =
    jobs.find((job) => job.id === selectedId && !job.hidden) ??
    jobs.find((job) => !job.hidden);

  function reset(): void {
    closeBlockConfirmation();
    demoStore.reset();
    setSelectedId(jobs[0]?.id ?? '');
    setPopupOpen(true);
  }

  return (
    <>
      <Topbar />
      <main className="wrap">
        <Hero />
        <TallyLine tally={tally} />
        <div className="demo-head">
          <p>Live demo · fictional jobs · nothing is saved</p>
          <button type="button" className="key key--neutral" onClick={reset}>
            <RotateCcw aria-hidden="true" />
            Reset demo
          </button>
        </div>
        <DemoWindow
          tab={state.tab}
          openedTabs={state.openedTabs}
          popupOpen={popupOpen}
          onTogglePopup={() => setPopupOpen((open) => !open)}
          panels={{
            jobs: (
              <div className="jobs-panel" data-popup={popupOpen}>
                <JobList
                  jobs={jobs}
                  selectedId={selected?.id ?? ''}
                  onSelect={setSelectedId}
                />
                <JobDetails job={selected} />
                <PopupFrame open={popupOpen} hint={!state.switched} />
              </div>
            ),
            settings: (
              <Frame
                src="frames/settings/"
                title="LinkedOut Settings"
                className="fill"
              />
            ),
            sheet: <SheetTable rows={state.rows} />,
          }}
        />
        <OpenSource />
      </main>
      <Footer />
    </>
  );
}

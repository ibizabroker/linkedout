import { startPaneBlockControl } from '@/lib/block/pane-control';
import { startJobListHiding } from '@/lib/hide/page-hiding';
import { startApplicationWatch } from '@/lib/tracker/applied-watch';

export default defineContentScript({
  matches: ['*://www.linkedin.com/*'],
  main(ctx) {
    startJobListHiding(document, ctx);
    startPaneBlockControl(document, ctx);
    startApplicationWatch(document, ctx);
  },
});

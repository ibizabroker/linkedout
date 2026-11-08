import { startPaneBlockControl } from '@/lib/block/pane-control';
import { startJobListHiding } from '@/lib/hide/page-hiding';

export default defineContentScript({
  matches: ['*://www.linkedin.com/*'],
  main(ctx) {
    startJobListHiding(document, ctx);
    startPaneBlockControl(document, ctx);
  },
});

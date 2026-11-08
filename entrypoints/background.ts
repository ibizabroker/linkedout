import { startBlocklistOwner } from '@/lib/block/store';
import { startHideSetOwner } from '@/lib/hide/store';

export default defineBackground(() => {
  startHideSetOwner();
  startBlocklistOwner();
});

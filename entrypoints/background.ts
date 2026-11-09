import { startBlocklistOwner } from '@/lib/block/store';
import { startHideSetOwner } from '@/lib/hide/store';
import { startRepostCacheOwner } from '@/lib/hide/repost-store';

export default defineBackground(() => {
  startHideSetOwner();
  startBlocklistOwner();
  startRepostCacheOwner();
});

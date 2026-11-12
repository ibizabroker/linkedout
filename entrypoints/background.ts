import { startBlocklistOwner } from '@/lib/block/store';
import { startHideSetOwner } from '@/lib/hide/store';
import { startApplicantLimitOwner } from '@/lib/hide/applicant-store';
import { startRepostCacheOwner } from '@/lib/hide/repost-store';

export default defineBackground(() => {
  startHideSetOwner();
  startBlocklistOwner();
  startApplicantLimitOwner();
  startRepostCacheOwner();
});

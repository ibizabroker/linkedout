import { openBlockConfirmation } from '@/lib/block/confirm-panel';
import { requestBlock } from '@/lib/block/store';

export function confirmBlock(company: string): void {
  openBlockConfirmation(company, () => requestBlock(company));
}

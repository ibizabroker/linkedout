export const TRACKER_FILE_NAME = 'LinkedOut Job Tracker';
export const APPLICATIONS_TAB = 'Applications';

export const COLUMNS = [
  'Applied on',
  'Company',
  'Job title',
  'Status',
  'Location',
  'Workplace',
  'Applied via',
  'Applicants when applied',
  'Reposted',
  'Last update',
  'Notes',
  'Job link',
  'Job ID',
] as const;

export const STATUSES = [
  'Applied',
  'Heard back',
  'Interviewing',
  'Offer',
  'Rejected',
  'Ghosted',
  'Withdrawn',
] as const;

export type Column = (typeof COLUMNS)[number];
export type Status = (typeof STATUSES)[number];

export function columnIndex(column: Column): number {
  return COLUMNS.indexOf(column);
}

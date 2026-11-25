import { COLUMNS, columnIndex, type Column } from './columns.ts';
import type { JobFacts } from './job-facts.ts';

export type SheetCell = string | number;
export type SheetRow = readonly SheetCell[];

export function jobLink(jobId: string): string {
  return `https://www.linkedin.com/jobs/view/${jobId}/`;
}

export function buildRow(facts: JobFacts, appliedAt: number, utcOffsetMinutes: number): SheetRow {
  const when = localDateTime(appliedAt, utcOffsetMinutes);
  const cells: Record<Column, SheetCell> = {
    'Applied on': when,
    Company: facts.company,
    'Job title': facts.title,
    Status: 'Applied',
    Location: facts.location,
    Workplace: facts.workplace ?? '',
    'Applied via': facts.onsiteApply ? 'Easy Apply' : 'Company site',
    'Applicants when applied': facts.applicants ?? '',
    Reposted: facts.reposted ? 'Yes' : 'No',
    'Last update': when.slice(0, 10),
    Notes: '',
    'Job link': jobLink(facts.jobId),
    'Job ID': facts.jobId,
  };
  return COLUMNS.map((column) => cells[column]);
}

export function appliedAtOf(row: SheetRow): number {
  return new Date(String(row[columnIndex('Applied on')]).replace(' ', 'T')).getTime();
}

function localDateTime(epochMs: number, utcOffsetMinutes: number): string {
  const local = new Date(epochMs - utcOffsetMinutes * 60_000);
  return local.toISOString().slice(0, 19).replace('T', ' ');
}

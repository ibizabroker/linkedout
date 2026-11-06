import {
  failedPageReport,
  jobsListReport,
  notJobsListReport,
  type PageReport,
} from '@/lib/hide/domain';

export const PAGE_REPORT_PORT = 'linkedout-page-report';

export function serializePageReport(report: PageReport): {
  readonly kind: PageReport['kind'];
  readonly hiddenCount?: number;
} {
  if (report.kind === 'jobs-list') {
    return { kind: report.kind, hiddenCount: report.hiddenCount };
  }

  return { kind: report.kind };
}

export function parsePageReportMessage(raw: unknown): PageReport {
  if (!isRecord(raw)) {
    return failedPageReport();
  }

  if (raw.kind === 'not-jobs-list') {
    return notJobsListReport();
  }

  if (raw.kind === 'jobs-list' && typeof raw.hiddenCount === 'number') {
    try {
      return jobsListReport(raw.hiddenCount);
    } catch {
      return failedPageReport();
    }
  }

  return failedPageReport();
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

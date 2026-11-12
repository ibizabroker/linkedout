import { parseLimitDocument, serializeLimit, type ApplicantLimit } from '@/lib/hide/applicants';
import {
  failedPageReport,
  jobsListReport,
  notJobsListReport,
  type PageReport,
} from '@/lib/hide/domain';

export const PAGE_REPORT_PORT = 'linkedout-page-report';
const PREVIEW_LIMIT = 'preview-limit';

export function serializePreview(limit: ApplicantLimit): {
  readonly type: typeof PREVIEW_LIMIT;
  readonly document: ReturnType<typeof serializeLimit>;
} {
  return { type: PREVIEW_LIMIT, document: serializeLimit(limit) };
}

export function parsePreviewMessage(raw: unknown): ApplicantLimit | undefined {
  if (!isRecord(raw) || raw.type !== PREVIEW_LIMIT) {
    return undefined;
  }
  return parseLimitDocument(raw.document);
}

export function serializePageReport(report: PageReport): {
  readonly kind: PageReport['kind'];
  readonly hiddenCount?: number;
  readonly repostPaused?: boolean;
} {
  if (report.kind === 'jobs-list') {
    return {
      kind: report.kind,
      hiddenCount: report.hiddenCount,
      repostPaused: report.repostPaused,
    };
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
      return jobsListReport(raw.hiddenCount, raw.repostPaused === true);
    } catch {
      return failedPageReport();
    }
  }

  return failedPageReport();
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

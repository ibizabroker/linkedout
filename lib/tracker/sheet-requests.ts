import { APPLICATIONS_TAB, COLUMNS, STATUSES, TRACKER_FILE_NAME, columnIndex } from './columns.ts';

const DRIVE = 'https://www.googleapis.com/drive/v3/files';
const SHEETS = 'https://sheets.googleapis.com/v4/spreadsheets';

const TRACKER_PROPERTIES = { linkedout: 'tracker' } as const;

export function findTrackerUrl(): string {
  const q = "appProperties has { key='linkedout' and value='tracker' } and trashed=false";
  return `${DRIVE}?${new URLSearchParams({ q, fields: 'files(id)' })}`;
}

export function createFileUrl(): string {
  return `${DRIVE}?${new URLSearchParams({ fields: 'id' })}`;
}

export function createFileBody(): {
  readonly name: string;
  readonly mimeType: string;
  readonly appProperties: typeof TRACKER_PROPERTIES;
} {
  return {
    name: TRACKER_FILE_NAME,
    mimeType: 'application/vnd.google-apps.spreadsheet',
    appProperties: TRACKER_PROPERTIES,
  };
}

export function fileUrl(id: string, fields?: string): string {
  const base = `${DRIVE}/${encodeURIComponent(id)}`;
  return fields === undefined ? base : `${base}?${new URLSearchParams({ fields })}`;
}

export function sheetPropertiesUrl(id: string): string {
  const fields = 'sheets.properties.sheetId';
  return `${SHEETS}/${encodeURIComponent(id)}?${new URLSearchParams({ fields })}`;
}

export function batchUpdateUrl(id: string): string {
  return `${SHEETS}/${encodeURIComponent(id)}:batchUpdate`;
}

export function parseFirstSheetId(raw: unknown): number | undefined {
  const sheets = (raw as { sheets?: unknown } | null)?.sheets;
  if (!Array.isArray(sheets)) {
    return undefined;
  }
  const sheetId = (sheets[0] as { properties?: { sheetId?: unknown } } | undefined)?.properties
    ?.sheetId;
  return typeof sheetId === 'number' ? sheetId : undefined;
}

export function parseFileId(raw: unknown): string | undefined {
  const id = (raw as { id?: unknown } | null)?.id;
  return typeof id === 'string' && id.length > 0 ? id : undefined;
}

export function parseFoundFileId(raw: unknown): string | undefined {
  const files = (raw as { files?: unknown } | null)?.files;
  return Array.isArray(files) ? parseFileId(files[0]) : undefined;
}

export function formatBody(sheetId: number): { readonly requests: readonly object[] } {
  const statusColumn = columnIndex('Status');
  return {
    requests: [
      {
        updateSheetProperties: {
          properties: {
            sheetId,
            title: APPLICATIONS_TAB,
            gridProperties: { frozenRowCount: 1 },
          },
          fields: 'title,gridProperties.frozenRowCount',
        },
      },
      {
        updateCells: {
          range: {
            sheetId,
            startRowIndex: 0,
            endRowIndex: 1,
            startColumnIndex: 0,
            endColumnIndex: COLUMNS.length,
          },
          rows: [
            {
              values: COLUMNS.map((name) => ({
                userEnteredValue: { stringValue: name },
                userEnteredFormat: { textFormat: { bold: true } },
              })),
            },
          ],
          fields: 'userEnteredValue,userEnteredFormat.textFormat.bold',
        },
      },
      {
        setBasicFilter: {
          filter: {
            range: {
              sheetId,
              startRowIndex: 0,
              startColumnIndex: 0,
              endColumnIndex: COLUMNS.length,
            },
          },
        },
      },
      {
        setDataValidation: {
          range: {
            sheetId,
            startRowIndex: 1,
            startColumnIndex: statusColumn,
            endColumnIndex: statusColumn + 1,
          },
          rule: {
            condition: {
              type: 'ONE_OF_LIST',
              values: STATUSES.map((status) => ({ userEnteredValue: status })),
            },
            strict: true,
            showCustomUi: true,
          },
        },
      },
    ],
  };
}

import {
  APPLICATIONS_TAB,
  COLUMNS,
  STATUSES,
  TRACKER_FILE_NAME,
  columnIndex,
  type Column,
} from './columns.ts';
import type { SheetCell, SheetRow } from './row.ts';

const DRIVE = 'https://www.googleapis.com/drive/v3/files';
const SHEETS = 'https://sheets.googleapis.com/v4/spreadsheets';

const STATUS_RULE = {
  condition: {
    type: 'ONE_OF_LIST',
    values: STATUSES.map((status) => ({ userEnteredValue: status })),
  },
  strict: true,
  showCustomUi: true,
} as const;

const DATE_RULE = { condition: { type: 'DATE_IS_VALID' }, strict: true } as const;
const DATE_FORMAT = { type: 'DATE', pattern: 'yyyy-mm-dd' } as const;

const TRACKER_PROPERTIES = { linkedout: 'tracker' } as const;

export function findTrackerUrl(): string {
  const q = "appProperties has { key='linkedout' and value='tracker' } and trashed=false";
  return `${DRIVE}?${new URLSearchParams({ q, fields: 'files(id,name)' })}`;
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

type CellKind = 'text' | 'number' | 'dateTime' | 'date' | 'status' | 'link';

const CELL_KIND: Record<Column, CellKind> = {
  'Applied on': 'dateTime',
  Company: 'text',
  'Job title': 'text',
  Status: 'status',
  Location: 'text',
  Workplace: 'text',
  'Applied via': 'text',
  'Applicants when applied': 'number',
  Reposted: 'text',
  'Last update': 'date',
  Notes: 'text',
  'Job link': 'link',
  'Job ID': 'text',
};

const PLAIN = { textFormat: { bold: false } } as const;

export function appendCellsBody(
  sheetId: number,
  row: SheetRow,
): { readonly requests: readonly object[] } {
  return {
    requests: [
      {
        appendCells: {
          sheetId,
          rows: [{ values: COLUMNS.map((column, i) => cellData(CELL_KIND[column], row[i] ?? '')) }],
          fields: 'userEnteredValue,userEnteredFormat,dataValidation',
        },
      },
    ],
  };
}

function cellData(kind: CellKind, value: SheetCell): object {
  if (value === '') {
    return { userEnteredFormat: PLAIN };
  }
  switch (kind) {
    case 'number':
      return typeof value === 'number'
        ? { userEnteredValue: { numberValue: value }, userEnteredFormat: PLAIN }
        : text(value);
    case 'dateTime':
    case 'date': {
      const serial = sheetsSerial(String(value));
      if (serial === undefined) {
        return text(value);
      }
      return {
        userEnteredValue: { numberValue: serial },
        userEnteredFormat: {
          ...PLAIN,
          numberFormat:
            kind === 'date' ? DATE_FORMAT : { type: 'DATE_TIME', pattern: 'yyyy-mm-dd hh:mm' },
        },
        ...(kind === 'date' ? { dataValidation: DATE_RULE } : {}),
      };
    }
    case 'status':
      return { ...text(value), dataValidation: STATUS_RULE };
    case 'link':
      return {
        userEnteredValue: { stringValue: String(value) },
        userEnteredFormat: { textFormat: { bold: false, link: { uri: String(value) } } },
      };
    case 'text':
      return text(value);
    default:
      return unexpectedKind(kind);
  }
}

function text(value: SheetCell): object {
  return { userEnteredValue: { stringValue: String(value) }, userEnteredFormat: PLAIN };
}

function unexpectedKind(kind: never): never {
  throw new Error(`Unexpected cell kind: ${String(kind)}`);
}

const SERIAL_EPOCH_DAYS = 25569;

export function sheetsSerial(local: string): number | undefined {
  const match = /^(\d{4})-(\d{2})-(\d{2})(?: (\d{2}):(\d{2}):(\d{2}))?$/.exec(local);
  if (match === null) {
    return undefined;
  }
  const [, y, mo, d, h = '0', mi = '0', se = '0'] = match;
  const ms = Date.UTC(Number(y), Number(mo) - 1, Number(d), Number(h), Number(mi), Number(se));
  return ms / 86_400_000 + SERIAL_EPOCH_DAYS;
}

export function appliedOnUrl(id: string): string {
  const letter = String.fromCharCode(65 + columnIndex('Applied on'));
  const range = encodeURIComponent(`${APPLICATIONS_TAB}!${letter}:${letter}`);
  const query = new URLSearchParams({
    valueRenderOption: 'UNFORMATTED_VALUE',
    dateTimeRenderOption: 'SERIAL_NUMBER',
  });
  return `${SHEETS}/${encodeURIComponent(id)}/values/${range}?${query}`;
}

export function sheetTabsUrl(id: string): string {
  const fields = 'sheets.properties(sheetId,title)';
  return `${SHEETS}/${encodeURIComponent(id)}?${new URLSearchParams({ fields })}`;
}

export function parseApplicationsSheetId(raw: unknown): number | undefined {
  const sheets = (raw as { sheets?: unknown } | null)?.sheets;
  if (!Array.isArray(sheets)) {
    return undefined;
  }
  const props = sheets.map(
    (sheet) =>
      (sheet as { properties?: { sheetId?: unknown; title?: unknown } } | null)?.properties,
  );
  const tab = props.find((p) => p?.title === APPLICATIONS_TAB) ?? props[0];
  return typeof tab?.sheetId === 'number' ? tab.sheetId : undefined;
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

export function parseFoundFile(
  raw: unknown,
): { readonly id: string; readonly name?: string } | undefined {
  const files = (raw as { files?: unknown } | null)?.files;
  if (!Array.isArray(files)) {
    return undefined;
  }
  const id = parseFileId(files[0]);
  const name = (files[0] as { name?: unknown } | undefined)?.name;
  return id === undefined ? undefined : { id, ...(typeof name === 'string' ? { name } : {}) };
}

export function formatBody(sheetId: number): { readonly requests: readonly object[] } {
  const statusColumn = columnIndex('Status');
  const dateColumn = columnIndex('Last update');
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
          rule: STATUS_RULE,
        },
      },
      {
        setDataValidation: {
          range: {
            sheetId,
            startRowIndex: 1,
            startColumnIndex: dateColumn,
            endColumnIndex: dateColumn + 1,
          },
          rule: DATE_RULE,
        },
      },
      {
        repeatCell: {
          range: {
            sheetId,
            startRowIndex: 1,
            startColumnIndex: dateColumn,
            endColumnIndex: dateColumn + 1,
          },
          cell: { userEnteredFormat: { numberFormat: DATE_FORMAT } },
          fields: 'userEnteredFormat.numberFormat',
        },
      },
    ],
  };
}

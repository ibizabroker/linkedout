import { describe, expect, test } from 'bun:test';
import { COLUMNS, STATUSES } from './columns.ts';
import {
  appendCellsBody,
  appliedOnUrl,
  parseApplicationsSheetId,
  createFileBody,
  findTrackerUrl,
  formatBody,
  parseFileId,
  parseFirstSheetId,
  parseFoundFile,
} from './sheet-requests.ts';

type Request = Record<string, Record<string, any>>;

function requests(): Request[] {
  return formatBody(7).requests as Request[];
}

function find(kind: string): Record<string, any> {
  const found = requests().find((request) => kind in request);
  if (found === undefined) {
    throw new Error(`no ${kind} request`);
  }
  return found[kind] as Record<string, any>;
}

describe('sheet creation', () => {
  test('the file is a spreadsheet named for the tracker and tagged for later lookup', () => {
    expect(createFileBody()).toEqual({
      name: 'LinkedOut Job Tracker',
      mimeType: 'application/vnd.google-apps.spreadsheet',
      appProperties: { linkedout: 'tracker' },
    });
  });

  test('the lookup asks Drive for live files with the tracker tag', () => {
    const url = new URL(findTrackerUrl());
    expect(url.pathname).toBe('/drive/v3/files');
    expect(url.searchParams.get('q')).toBe(
      "appProperties has { key='linkedout' and value='tracker' } and trashed=false",
    );
    expect(url.searchParams.get('fields')).toBe('files(id,name)');
  });
});

describe('sheet formatting', () => {
  test('the header row holds every column in order, in bold', () => {
    const { rows, range } = find('updateCells');
    const values = rows[0].values as { userEnteredValue: { stringValue: string } }[];
    expect(values.map((cell) => cell.userEnteredValue.stringValue)).toEqual([...COLUMNS]);
    expect(range).toEqual({
      sheetId: 7,
      startRowIndex: 0,
      endRowIndex: 1,
      startColumnIndex: 0,
      endColumnIndex: COLUMNS.length,
    });
    expect(JSON.stringify(rows)).toContain('"bold":true');
  });

  test('the first tab is renamed and row 1 is frozen', () => {
    const { properties } = find('updateSheetProperties');
    expect(properties.title).toBe('Applications');
    expect(properties.gridProperties).toEqual({ frozenRowCount: 1 });
  });

  test('the filter spans every column from the header down', () => {
    expect(find('setBasicFilter').filter.range).toEqual({
      sheetId: 7,
      startRowIndex: 0,
      startColumnIndex: 0,
      endColumnIndex: COLUMNS.length,
    });
  });

  test('Status is a strict dropdown from row 2 down', () => {
    const { range, rule } = find('setDataValidation');
    expect(range).toEqual({ sheetId: 7, startRowIndex: 1, startColumnIndex: 3, endColumnIndex: 4 });
    expect(COLUMNS[3]).toBe('Status');
    expect(rule.condition.type).toBe('ONE_OF_LIST');
    expect(
      rule.condition.values.map((v: { userEnteredValue: string }) => v.userEnteredValue),
    ).toEqual([...STATUSES]);
    expect(rule.strict).toBe(true);
    expect(rule.showCustomUi).toBe(true);
  });

  test('every Last update cell below the header is a date with a date picker', () => {
    const column = COLUMNS.indexOf('Last update');
    const range = {
      sheetId: 7,
      startRowIndex: 1,
      startColumnIndex: column,
      endColumnIndex: column + 1,
    };
    const validation = requests()
      .map((request) => request.setDataValidation)
      .find((v) => v?.range.startColumnIndex === column);
    expect(validation?.range).toEqual(range);
    expect(validation?.rule).toEqual({ condition: { type: 'DATE_IS_VALID' }, strict: true });
    const format = find('repeatCell');
    expect(format.range).toEqual(range);
    expect(format.cell.userEnteredFormat.numberFormat).toEqual({
      type: 'DATE',
      pattern: 'yyyy-mm-dd',
    });
  });
});

describe('response parsing', () => {
  test('reads the first sheet id, including 0', () => {
    expect(parseFirstSheetId({ sheets: [{ properties: { sheetId: 0 } }] })).toBe(0);
    expect(parseFirstSheetId({ sheets: [] })).toBeUndefined();
    expect(parseFirstSheetId({})).toBeUndefined();
    expect(parseFirstSheetId(null)).toBeUndefined();
  });

  test('reads a created file id', () => {
    expect(parseFileId({ id: 'abc' })).toBe('abc');
    expect(parseFileId({ id: '' })).toBeUndefined();
    expect(parseFileId({})).toBeUndefined();
  });

  test('reads the first search hit, or nothing for an empty search', () => {
    expect(parseFoundFile({ files: [{ id: 'abc', name: 'My jobs' }, { id: 'def' }] })).toEqual({
      id: 'abc',
      name: 'My jobs',
    });
    expect(parseFoundFile({ files: [{ id: 'abc' }] })).toEqual({ id: 'abc' });
    expect(parseFoundFile({ files: [] })).toBeUndefined();
    expect(parseFoundFile({})).toBeUndefined();
  });
});

describe('appending a row', () => {
  const row = [
    '2026-11-14 18:09:39',
    '=HYPERLINK("x")',
    'Engineer',
    'Applied',
    'San Francisco, CA',
    '',
    'Company site',
    116,
    'Yes',
    '2026-11-14',
    '',
    'https://www.linkedin.com/jobs/view/1/',
    '1',
  ] as const;
  const cells = (
    appendCellsBody(7, row).requests[0] as {
      appendCells: { sheetId: number; rows: { values: Record<string, any>[] }[]; fields: string };
    }
  ).appendCells;
  const cell = (column: (typeof COLUMNS)[number]) =>
    cells.rows[0]!.values[COLUMNS.indexOf(column)]!;

  test('one row goes to the Applications tab with its own values, format, and validation', () => {
    expect(cells.sheetId).toBe(7);
    expect(cells.rows[0]!.values.length).toBe(COLUMNS.length);
    expect(cells.fields).toBe('userEnteredValue,userEnteredFormat,dataValidation');
  });

  test('no cell inherits the bold header', () => {
    for (const value of cells.rows[0]!.values) {
      expect(value.userEnteredFormat.textFormat.bold).toBe(false);
    }
  });

  test('Status is the Applied choice of the status dropdown', () => {
    expect(cell('Status').userEnteredValue).toEqual({ stringValue: 'Applied' });
    expect(cell('Status').dataValidation.condition.type).toBe('ONE_OF_LIST');
    expect(cell('Status').dataValidation.showCustomUi).toBe(true);
    expect(
      cell('Status').dataValidation.condition.values.map(
        (v: { userEnteredValue: string }) => v.userEnteredValue,
      ),
    ).toEqual([...STATUSES]);
  });

  test('Last update is a date with a date picker, Applied on a date and time', () => {
    expect(cell('Last update').userEnteredValue).toEqual({ numberValue: 46340 });
    expect(cell('Last update').userEnteredFormat.numberFormat).toEqual({
      type: 'DATE',
      pattern: 'yyyy-mm-dd',
    });
    expect(cell('Last update').dataValidation.condition.type).toBe('DATE_IS_VALID');
    const appliedSeconds = Math.round(
      (cell('Applied on').userEnteredValue.numberValue - 46340) * 86400,
    );
    expect(appliedSeconds).toBe(18 * 3600 + 9 * 60 + 39);
    expect(cell('Applied on').userEnteredFormat.numberFormat.type).toBe('DATE_TIME');
  });

  test('text is stored as text, so a title that looks like a formula never runs', () => {
    expect(cell('Company').userEnteredValue).toEqual({ stringValue: '=HYPERLINK("x")' });
    expect(cell('Job ID').userEnteredValue).toEqual({ stringValue: '1' });
  });

  test('the applicant count is a number and the job link is clickable', () => {
    expect(cell('Applicants when applied').userEnteredValue).toEqual({ numberValue: 116 });
    expect(cell('Job link').userEnteredFormat.textFormat.link).toEqual({
      uri: 'https://www.linkedin.com/jobs/view/1/',
    });
  });

  test('empty cells stay empty', () => {
    expect(cell('Notes').userEnteredValue).toBeUndefined();
    expect(cell('Workplace').userEnteredValue).toBeUndefined();
  });

  test('the Applications tab is found by name, falling back to the first tab', () => {
    const tabs = (...t: [number, string][]) => ({
      sheets: t.map(([sheetId, title]) => ({ properties: { sheetId, title } })),
    });
    expect(parseApplicationsSheetId(tabs([0, 'Notes'], [5, 'Applications']))).toBe(5);
    expect(parseApplicationsSheetId(tabs([3, 'Renamed']))).toBe(3);
    expect(parseApplicationsSheetId({})).toBeUndefined();
  });
});

describe('applied-on read', () => {
  test('asks for only the Applied on column of the Applications tab, as serial numbers', () => {
    expect(appliedOnUrl('abc')).toBe(
      'https://sheets.googleapis.com/v4/spreadsheets/abc/values/Applications!A%3AA?valueRenderOption=UNFORMATTED_VALUE&dateTimeRenderOption=SERIAL_NUMBER',
    );
  });
});

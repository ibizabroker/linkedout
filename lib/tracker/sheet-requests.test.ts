import { describe, expect, test } from 'bun:test';
import { COLUMNS, STATUSES } from './columns.ts';
import {
  createFileBody,
  findTrackerUrl,
  formatBody,
  parseFileId,
  parseFirstSheetId,
  parseFoundFileId,
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
    expect(url.searchParams.get('fields')).toBe('files(id)');
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
    expect(parseFoundFileId({ files: [{ id: 'abc' }, { id: 'def' }] })).toBe('abc');
    expect(parseFoundFileId({ files: [] })).toBeUndefined();
    expect(parseFoundFileId({})).toBeUndefined();
  });
});

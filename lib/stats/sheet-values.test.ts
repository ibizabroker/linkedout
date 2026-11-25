import { describe, expect, test } from 'bun:test';
import {
  assembleJobFacts,
  parseApplicationDetails,
  parseGeoNames,
  parsePostingDetails,
} from '../tracker/job-facts.ts';
import details from '../tracker/fixtures/details.json';
import geo from '../tracker/fixtures/geo.json';
import postings from '../tracker/fixtures/postings.json';
import { buildRow } from '../tracker/row.ts';
import { sheetsSerial } from '../tracker/sheet-requests.ts';
import { parseAppliedTimes } from './sheet-values.ts';

const JOB_ID = '4480699030';

function factsForFixture() {
  const detail = parseApplicationDetails(details).get(JOB_ID);
  const posting = parsePostingDetails(postings).get(JOB_ID);
  if (detail === undefined || posting === undefined) {
    throw new Error('fixture is missing the job');
  }
  return assembleJobFacts(JOB_ID, detail, posting, parseGeoNames(geo));
}

describe('parseAppliedTimes', () => {
  test('reads back the instant the writer stored, to the second', () => {
    const appliedAt = new Date(2026, 10, 14, 18, 9, 39).getTime();
    const offset = new Date(appliedAt).getTimezoneOffset();
    const serial = sheetsSerial(String(buildRow(factsForFixture(), appliedAt, offset)[0]));
    expect(parseAppliedTimes({ values: [[serial]] })).toEqual([appliedAt]);
  });

  test('a day with a different UTC offset still reads as local wall-clock', () => {
    const summer = new Date(2026, 6, 4, 8, 15, 0).getTime();
    const winter = new Date(2026, 0, 4, 8, 15, 0).getTime();
    const serials = [summer, winter].map((time) =>
      sheetsSerial(
        String(buildRow(factsForFixture(), time, new Date(time).getTimezoneOffset())[0]),
      ),
    );
    expect(parseAppliedTimes({ values: serials.map((serial) => [serial]) })).toEqual([
      winter,
      summer,
    ]);
  });

  test('blanks, text, bad numbers and empty rows are skipped', () => {
    const raw = {
      values: [
        ['Applied on'],
        [],
        [''],
        ['2026-05-20'],
        [Number.NaN],
        [sheetsSerial('2026-05-20 12:00:00')],
      ],
    };
    expect(parseAppliedTimes(raw)).toEqual([new Date(2026, 4, 20, 12).getTime()]);
  });

  test('a missing or malformed response has no times', () => {
    expect(parseAppliedTimes({})).toEqual([]);
    expect(parseAppliedTimes(null)).toEqual([]);
  });

  test('times come back sorted', () => {
    const times = parseAppliedTimes({ values: [[46163], [46162], [46162.5]] });
    expect(times).toEqual([...times].sort((a, b) => a - b));
    expect(times.length).toBe(3);
  });
});

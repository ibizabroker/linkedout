import { describe, expect, test } from 'bun:test';
import details from './fixtures/details.json';
import geo from './fixtures/geo.json';
import postings from './fixtures/postings.json';
import {
  assembleJobFacts,
  parseApplicationDetails,
  parseGeoNames,
  parsePostingDetails,
  workplaceFromPage,
  type JobFacts,
} from './job-facts.ts';
import { buildRow } from './row.ts';

const detailsById = parseApplicationDetails(details);
const postingsById = parsePostingDetails(postings);
const geoNames = parseGeoNames(geo);

function factsFor(jobId: string): JobFacts {
  const detail = detailsById.get(jobId);
  const posting = postingsById.get(jobId);
  if (detail === undefined || posting === undefined) {
    throw new Error(`fixture is missing ${jobId}`);
  }
  return assembleJobFacts(jobId, detail, posting, geoNames);
}

const PST = 480;
const NOV_14_2026_1809_PST = 1794708579385;

describe('job facts from LinkedIn batches', () => {
  test('a company-site application with no workplace type', () => {
    expect(factsFor('4480699030')).toEqual({
      jobId: '4480699030',
      applied: true,
      appliedAt: 1794708579385,
      onsiteApply: false,
      title: 'Software Engineer - Mercury Command',
      company: 'Mercury',
      location: 'San Francisco, CA',
      workplace: null,
      reposted: true,
      applicants: 116,
    });
  });

  test('workplace urns 1, 2, and 3 read as On-site, Remote, and Hybrid', () => {
    expect(factsFor('4463906975').workplace).toBe('On-site');
    expect(factsFor('4482178406').workplace).toBe('Remote');
    expect(factsFor('4487547179').workplace).toBe('Hybrid');
  });

  test('an Easy Apply job reads as onsite apply and a job not applied to has no time', () => {
    const facts = factsFor('4489502813');
    expect(facts.onsiteApply).toBe(true);
    expect(facts.applied).toBe(false);
    expect(facts.appliedAt).toBe(null);
  });

  test('responses without the expected entities read as empty', () => {
    expect(parseApplicationDetails({}).size).toBe(0);
    expect(parsePostingDetails({ included: 'x' }).size).toBe(0);
    expect(parseGeoNames(null).size).toBe(0);
  });
});

describe('workplace from the job page', () => {
  const subtitle = (text: string): string => `{\\"children\\":[\\"${text}\\"],\\"x\\":1}`;

  test('the company and place line carries the workplace LinkedIn shows', () => {
    expect(workplaceFromPage(subtitle('Mercury \u2022 San Francisco, CA (On-site)'))).toBe(
      'On-site',
    );
    expect(workplaceFromPage(subtitle('Figma \u2022 New York, NY (Remote)'))).toBe('Remote');
    expect(
      workplaceFromPage(subtitle('QuoteWell \u2022 Austin, Texas Metropolitan Area (Hybrid)')),
    ).toBe('Hybrid');
  });

  test('a line with no workplace, or none at all, reads as unknown', () => {
    expect(workplaceFromPage(subtitle('Amazon Web Services (AWS) \u2022 Brooklyn, NY'))).toBe(null);
    expect(workplaceFromPage('<main>nothing here</main>')).toBe(null);
  });
});

describe('row builder', () => {
  test('a company-site application fills every column in sheet order', () => {
    const facts = factsFor('4480699030');
    expect(buildRow(facts, NOV_14_2026_1809_PST, PST)).toEqual([
      '2026-11-14 18:09:39',
      'Mercury',
      'Software Engineer - Mercury Command',
      'Applied',
      'San Francisco, CA',
      '',
      'Company site',
      116,
      'Yes',
      '2026-11-14',
      '',
      'https://www.linkedin.com/jobs/view/4480699030/',
      '4480699030',
    ]);
  });

  test('an Easy Apply, remote, not reposted job', () => {
    const facts = { ...factsFor('4482178406'), onsiteApply: true };
    const row = buildRow(facts, NOV_14_2026_1809_PST, 0);
    expect(row[0]).toBe('2026-11-15 02:09:39');
    expect(row[4]).toBe('New York, NY');
    expect(row[5]).toBe('Remote');
    expect(row[6]).toBe('Easy Apply');
    expect(row[7]).toBe(1048);
    expect(row[8]).toBe('No');
  });

  test('a missing applicant count leaves the cell empty', () => {
    expect(buildRow({ ...factsFor('4480699030'), applicants: null }, 0, 0)[7]).toBe('');
  });
});

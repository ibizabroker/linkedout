import { describe, expect, test } from 'bun:test';
import { parseHTML } from 'linkedom';
import { fetchJobPage, jobIdOf, readJobPage } from './job-page.ts';

const screen = (body: string): string =>
  `<main data-sdui-screen="com.linkedin.sdui.flagshipnav.jobs.JobDetails"><p>${body}</p></main>`;

describe('readJobPage', () => {
  test('reads Reposted with a unit and age', () => {
    expect(readJobPage(screen('Reposted 1 week ago'))?.reposted).toBe(true);
    expect(readJobPage(screen('Reposted 2 days ago'))?.reposted).toBe(true);
    expect(readJobPage(screen('Reposted 3 months ago'))?.reposted).toBe(true);
  });

  test('a plain posted age is not reposted', () => {
    expect(readJobPage(screen('2 days ago Over 100 people clicked apply'))?.reposted).toBe(false);
  });

  test('a page that is not the job details screen is unknown', () => {
    expect(readJobPage('<main>Reposted 1 week ago</main>')).toBeUndefined();
  });
});

describe('jobIdOf', () => {
  const card = (html: string): Element =>
    parseHTML(`<html><body><ul>${html}</ul></body></html>`).document.querySelector('ul')!
      .firstElementChild!;

  test('reads the occludable id', () => {
    expect(jobIdOf(card('<li data-occludable-job-id="123"></li>'))).toBe('123');
  });

  test('reads the component key', () => {
    expect(jobIdOf(card('<div componentkey="job-card-component-ref-456"></div>'))).toBe('456');
  });

  test('rejects anything that is not digits', () => {
    expect(jobIdOf(card('<li data-occludable-job-id="../x"></li>'))).toBeUndefined();
  });
});

describe('fetchJobPage', () => {
  const respond = (status: number, body = ''): typeof fetch =>
    (async () => new Response(body, { status })) as unknown as typeof fetch;

  test('a job details page yields facts', async () => {
    const outcome = await fetchJobPage('1', respond(200, screen('Reposted 1 day ago')));
    expect(outcome).toEqual({ kind: 'page', facts: { reposted: true } });
  });

  test('429, 403, 999, 5xx, and network errors mean limited', async () => {
    for (const status of [429, 403, 999, 503]) {
      expect(await fetchJobPage('1', respond(status))).toEqual({ kind: 'limited' });
    }
    const down = (async () => {
      throw new TypeError('offline');
    }) as unknown as typeof fetch;
    expect(await fetchJobPage('1', down)).toEqual({ kind: 'limited' });
  });

  test('a missing job or an unreadable page fails without limiting', async () => {
    expect(await fetchJobPage('1', respond(404))).toEqual({ kind: 'failed' });
    expect(await fetchJobPage('1', respond(200, '<html>login</html>'))).toEqual({ kind: 'failed' });
  });

  test('a non-numeric id never reaches the network', async () => {
    const never = (async () => {
      throw new Error('fetched');
    }) as unknown as typeof fetch;
    expect(await fetchJobPage('../x', never)).toEqual({ kind: 'failed' });
  });
});

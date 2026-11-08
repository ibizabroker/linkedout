import { describe, expect, test } from 'bun:test';
import { parseHTML } from 'linkedom';

const win = parseHTML('<!doctype html><html><head></head><body></body></html>');
globalThis.document = win.document as unknown as Document;
globalThis.HTMLElement = win.HTMLElement as unknown as typeof HTMLElement;
globalThis.Event = win.Event as unknown as typeof Event;

const { openBlockConfirmation, closeBlockConfirmation } = await import('./confirm-panel.ts');

const flush = () => new Promise((resolve) => setTimeout(resolve, 5));

function panels(): Element[] {
  return [...document.querySelectorAll('[data-linkedout-panel]')];
}

function button(host: Element, label: string): HTMLButtonElement {
  const buttons = [...host.shadowRoot!.querySelectorAll('button')] as HTMLButtonElement[];
  return buttons.find((b) => b.textContent === label)!;
}

function click(target: Element): void {
  target.dispatchEvent(new Event('click'));
}

function pressEscape(): void {
  const event = new Event('keydown', { bubbles: true, cancelable: true });
  Object.defineProperty(event, 'key', { value: 'Escape' });
  document.dispatchEvent(event);
}

describe('block confirmation panel', () => {
  test('a late block result does not close or re-notify a newer panel', async () => {
    document.body.innerHTML = '';
    let resolveFirst!: () => void;
    let firstClosed = 0;
    let secondClosed = 0;
    openBlockConfirmation(
      'CBRE',
      () => new Promise<void>((resolve) => (resolveFirst = resolve)),
      () => (firstClosed += 1),
    );
    click(button(panels()[0]!, 'Block'));
    pressEscape();
    expect(firstClosed).toBe(1);

    openBlockConfirmation(
      'Acme',
      () => Promise.resolve(),
      () => (secondClosed += 1),
    );
    resolveFirst();
    await flush();
    expect(firstClosed).toBe(1);
    expect(panels().length).toBe(1);

    closeBlockConfirmation();
    expect(panels().length).toBe(0);
    expect(secondClosed).toBe(1);
  });

  test('a rejected write re-enables Block, refocuses it and announces one error', async () => {
    document.body.innerHTML = '';
    let rejectWrite!: (reason: unknown) => void;
    openBlockConfirmation('CBRE', () => new Promise<void>((_, reject) => (rejectWrite = reject)));
    const host = panels()[0]!;
    const block = button(host, 'Block');
    let focused = 0;
    block.focus = () => (focused += 1);
    click(block);
    expect(block.disabled).toBe(true);
    rejectWrite(new Error('no'));
    await flush();
    expect(block.disabled).toBe(false);
    expect(focused).toBe(1);
    const errors = host.shadowRoot!.querySelectorAll('p.error');
    expect(errors.length).toBe(1);
    expect(errors[0]!.getAttribute('role')).toBe('alert');
    closeBlockConfirmation();
  });
});

export function pickCompanyName(paragraphs: readonly string[]): string | undefined {
  const name = paragraphs[1]?.replace(/\s+/g, ' ').trim();
  return name === undefined || name === '' ? undefined : name;
}

const SECONDS_PER_DAY = 86_400;

function fromSerial(serial: number): number {
  const days = Math.floor(serial);
  const seconds = Math.round((serial - days) * SECONDS_PER_DAY);
  return new Date(1899, 11, 30 + days, 0, 0, seconds).getTime();
}

export function parseAppliedTimes(raw: unknown): number[] {
  const rows = (raw as { values?: unknown } | null)?.values;
  if (!Array.isArray(rows)) {
    return [];
  }
  const times: number[] = [];
  for (const row of rows) {
    const cell: unknown = Array.isArray(row) ? row[0] : undefined;
    if (typeof cell === 'number' && Number.isFinite(cell)) {
      times.push(fromSerial(cell));
    }
  }
  return times.sort((a, b) => a - b);
}

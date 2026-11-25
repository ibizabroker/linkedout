export function compareToAverage(value: number, average: number): string | undefined {
  if (average <= 0) {
    return undefined;
  }
  if (value >= average) {
    return `${(value / average).toFixed(1)}× your average`;
  }
  return `${Math.round((1 - value / average) * 100)}% below average`;
}

export function groupBy<T>(arr: T[], fn: (item: T) => PropertyKey): Record<string, T[]> {
  const result: Record<string, T[]> = {};
  for (const item of arr) {
    const key = String(fn(item));
    if (result[key]) {
      result[key]!.push(item);
    } else {
      result[key] = [item];
    }
  }
  return result;
}

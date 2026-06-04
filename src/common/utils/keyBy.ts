export function keyBy<T>(arr: T[], fn: (item: T) => PropertyKey): Record<string, T> {
  const result: Record<string, T> = {};
  for (const item of arr) {
    result[String(fn(item))] = item;
  }
  return result;
}

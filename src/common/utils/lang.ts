export function set<T extends Record<string, any>>(obj: T, path: (string | number)[], value: unknown): void {
  let current: any = obj;
  for (let i = 0; i < path.length - 1; i++) {
    const key = path[i]!;
    if (!(key in current)) {
      current[key] = {};
    }
    current = current[key];
  }
  current[path[path.length - 1]!] = value;
}

export function keyBy<T>(arr: T[], fn: (item: T) => PropertyKey): Record<string, T> {
  const result: Record<string, T> = {};
  for (const item of arr) {
    result[String(fn(item))] = item;
  }
  return result;
}

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

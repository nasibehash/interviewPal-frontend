/**
 * localStorage/sessionStorage can throw (private windows, blocked site data) or return garbage.
 * These helpers never throw and always fall back to the provided default.
 */
export function readJson<T>(storage: () => Storage, key: string, fallback: T): T {
  try {
    const raw = storage().getItem(key);
    return raw === null ? fallback : (JSON.parse(raw) as T);
  } catch {
    return fallback;
  }
}

export function writeJson(storage: () => Storage, key: string, value: unknown): void {
  try {
    storage().setItem(key, JSON.stringify(value));
  } catch {
    // storage unavailable or full: the app keeps working without persistence
  }
}

export function removeKey(storage: () => Storage, key: string): void {
  try {
    storage().removeItem(key);
  } catch {
    // ignore
  }
}

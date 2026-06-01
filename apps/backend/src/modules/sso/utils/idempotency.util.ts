
/**
 * Simple in-memory idempotency guard keyed by a composite string.
 * Prevents duplicate 'initiate' actions for 30 seconds if user double-clicks.
 */
const cache = new Map<string, number>();
const TTL_MS = 30_000;

export function makeKey(
  uid: string,
  dept_tag: string,
  service_id: string,
  caf_id: string,
  app_id: string,
) {
  return `${uid}|${dept_tag}|${service_id}|${caf_id}|${app_id}`;
}

export function ensureOnce(key: string): boolean {
  const now = Date.now();
  const prev = cache.get(key) || 0;
  if (now - prev < TTL_MS) return false;
  cache.set(key, now);
  return true;
}

export function releaseKey(key: string) {
  cache.delete(key);
}

const store = new Map();
const MAX_ENTRIES = 128;

export function getCached(key) {
  const hit = store.get(key);
  if (!hit || hit.expiresAt < Date.now()) {
    store.delete(key);
    return null;
  }
  return hit.value;
}

export function setCached(key, value, ttlMs = 10 * 60 * 1000) {
  if (store.size >= MAX_ENTRIES) {
    const oldest = store.keys().next().value;
    store.delete(oldest);
  }
  store.set(key, { value, expiresAt: Date.now() + ttlMs });
  return value;
}

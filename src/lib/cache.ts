/** Petit cache mémoire à durée de vie (TTL), partagé par le process Node. */
type Entry<T> = { at: number; value: T; pending?: Promise<T> }
const store = new Map<string, Entry<unknown>>()

export async function cached<T>(key: string, ttlMs: number, load: () => Promise<T>): Promise<T> {
  const hit = store.get(key) as Entry<T> | undefined
  if (hit && Date.now() - hit.at < ttlMs) return hit.value
  if (hit?.pending) return hit.pending
  const pending = load()
    .then((value) => {
      store.set(key, { at: Date.now(), value })
      return value
    })
    .catch((err) => {
      // En cas d'erreur on sert la dernière valeur connue si elle existe.
      if (hit) {
        store.set(key, { at: Date.now() - ttlMs / 2, value: hit.value })
        return hit.value
      }
      store.delete(key)
      throw err
    })
  store.set(key, { at: hit?.at ?? 0, value: hit?.value as T, pending })
  return pending
}

export function clearCache(prefix = ''): void {
  for (const k of store.keys()) if (k.startsWith(prefix)) store.delete(k)
}

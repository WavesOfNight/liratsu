/**
 * Cache mémoire des identifiants résolus. Module sans dépendance, pour pouvoir être
 * invalidé depuis les hooks Payload sans créer d'import circulaire avec la config.
 */
type Entry = { at: number; value: unknown }
let entry: Entry | null = null

export const settingsCache = {
  get<T>(ttl: number): T | null {
    return entry && Date.now() - entry.at < ttl ? (entry.value as T) : null
  },
  set(value: unknown) {
    entry = { at: Date.now(), value }
  },
}

export function invalidateSettingsCache(): void {
  entry = null
}

/**
 * Chargement des sprites/tileset personnalisés (uploadés dans l'admin) avant de lancer
 * une partie. Une clé sans image reste `undefined` : le moteur garde son art intégré.
 */
export type SpriteOverrides = Partial<Record<string, HTMLImageElement>>

export async function loadOverrides(urls: Record<string, string>): Promise<SpriteOverrides> {
  const entries = await Promise.all(
    Object.entries(urls).map(async ([key, url]): Promise<[string, HTMLImageElement] | null> => {
      try {
        const img = new Image()
        img.decoding = 'sync'
        img.src = url
        await img.decode()
        return [key, img]
      } catch {
        return null
      }
    }),
  )
  return Object.fromEntries(entries.filter((e): e is [string, HTMLImageElement] => e !== null))
}

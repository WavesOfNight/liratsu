/**
 * Dernières vidéos YouTube via le flux RSS public de la chaîne (aucune clé API).
 * Parseur minimaliste : on n'extrait que les champs nécessaires.
 */
import { cached } from './cache'
import { getIntegrations } from './settings'

export type Video = { id: string; title: string; published: string; thumbnail: string; url: string }

const decode = (s: string) =>
  s
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")

export function parseYouTubeFeed(xml: string): Video[] {
  const entries = xml.split('<entry>').slice(1)
  return entries
    .map((e) => {
      const id = /<yt:videoId>([^<]+)<\/yt:videoId>/.exec(e)?.[1]
      const title = /<title>([^<]*)<\/title>/.exec(e)?.[1]
      const published = /<published>([^<]+)<\/published>/.exec(e)?.[1]
      if (!id || !title) return null
      return {
        id,
        title: decode(title),
        published: published ?? '',
        thumbnail: `https://i.ytimg.com/vi/${id}/hqdefault.jpg`,
        url: `https://www.youtube.com/watch?v=${id}`,
      }
    })
    .filter((v): v is Video => v !== null)
}

export async function getLatestVideos(count = 4): Promise<Video[]> {
  const { youtube } = await getIntegrations()
  if (!/^UC[\w-]{22}$/.test(youtube.channelId)) return []
  return cached(`yt:${youtube.channelId}`, 30 * 60_000, async () => {
    const r = await fetch(`https://www.youtube.com/feeds/videos.xml?channel_id=${youtube.channelId}`, { cache: 'no-store' })
    if (!r.ok) throw new Error(`YouTube RSS ${r.status}`)
    return parseYouTubeFeed(await r.text())
  }).then((v) => v.slice(0, count))
}

/**
 * Résout l'identifiant de chaîne (UC…) à partir d'un pseudo (@handle), sans clé API :
 * on lit le lien canonique présent dans la page publique de la chaîne.
 */
export async function resolveChannelId(handle: string): Promise<string | null> {
  const clean = handle.replace(/^@/, '')
  return cached(`yt:handle:${clean.toLowerCase()}`, 24 * 3600_000, async () => {
    const r = await fetch(`https://www.youtube.com/@${clean}`, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36' },
      cache: 'no-store',
    })
    if (!r.ok) return null
    const html = await r.text()
    return /"channelId":"(UC[\w-]{22})"/.exec(html)?.[1] ?? /channel\/(UC[\w-]{22})/.exec(html)?.[1] ?? null
  })
}

async function fetchChannelVideos(handle: string): Promise<Video[]> {
  const id = await resolveChannelId(handle)
  if (!id) return []
  return cached(`yt:videos:${id}`, 15 * 60_000, async () => {
    const r = await fetch(`https://www.youtube.com/feeds/videos.xml?channel_id=${id}`, { cache: 'no-store' })
    if (!r.ok) return []
    return parseYouTubeFeed(await r.text())
  })
}

const normalizeForMatch = (s: string) =>
  s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()

/**
 * Cherche, dans le flux (RSS : les ~15 vidéos les plus récentes) d'une chaîne YouTube, la VOD
 * correspondant à une date de stream — la convention observée sur la chaîne est
 * « <Jeu> - Rediff DD/MM/YYYY … ». Recherche au mieux : ne trouve que les VOD assez récentes
 * pour être encore dans le flux ; au-delà, la saisie manuelle du lien reste toujours possible.
 */
export async function findVodForDate(handle: string, dateIso: string, gameName?: string | null): Promise<Video | null> {
  const videos = await fetchChannelVideos(handle).catch(() => [])
  if (!videos.length) return null
  const target = new Date(dateIso)
  const dd = String(target.getDate()).padStart(2, '0')
  const mm = String(target.getMonth() + 1).padStart(2, '0')
  const yyyy = target.getFullYear()
  const datePatterns = [`${dd}/${mm}/${yyyy}`, `${dd}-${mm}-${yyyy}`, `${dd}.${mm}.${yyyy}`]
  const candidates = videos.filter((v) => datePatterns.some((p) => v.title.includes(p)))
  if (candidates.length === 0) return null
  if (candidates.length === 1 || !gameName) return candidates[0]
  const wantedGame = normalizeForMatch(gameName)
  return candidates.find((v) => normalizeForMatch(v.title).includes(wantedGame)) ?? candidates[0]
}

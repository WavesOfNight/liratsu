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

/**
 * Intégration Twitch Helix : statut live, planning, clips (cache serveur 60 s),
 * et OAuth pour la connexion optionnelle des viewers à l'Espace communauté.
 */
import { cached } from './cache'
import { getIntegrations } from './settings'

const HELIX = 'https://api.twitch.tv/helix'

async function appToken(clientId: string, clientSecret: string): Promise<string> {
  return cached(`twitch:token:${clientId}`, 50 * 60 * 1000, async () => {
    const r = await fetch('https://id.twitch.tv/oauth2/token', {
      method: 'POST',
      body: new URLSearchParams({ client_id: clientId, client_secret: clientSecret, grant_type: 'client_credentials' }),
    })
    if (!r.ok) throw new Error(`Twitch token: ${r.status}`)
    return ((await r.json()) as { access_token: string }).access_token
  })
}

async function helix<T>(path: string): Promise<T | null> {
  const { twitch } = await getIntegrations()
  if (!twitch.clientId || !twitch.clientSecret) return null
  const token = await appToken(twitch.clientId, twitch.clientSecret)
  const r = await fetch(`${HELIX}${path}`, {
    headers: { 'Client-Id': twitch.clientId, Authorization: `Bearer ${token}` },
    cache: 'no-store',
  })
  if (r.status === 404) return null
  if (!r.ok) throw new Error(`Twitch ${path}: ${r.status}`)
  return (await r.json()) as T
}

async function broadcasterId(login: string): Promise<string | null> {
  return cached(`twitch:user:${login}`, 24 * 3600 * 1000, async () => {
    const d = await helix<{ data: { id: string }[] }>(`/users?login=${encodeURIComponent(login)}`)
    return d?.data[0]?.id ?? null
  })
}

export type LiveStatus = {
  configured: boolean
  channel: string
  isLive: boolean
  title?: string
  game?: string
  viewers?: number
  startedAt?: string
  thumbnail?: string
}

export async function getLiveStatus(): Promise<LiveStatus> {
  const { twitch } = await getIntegrations()
  const channel = twitch.channelLogin
  if (!twitch.clientId || !twitch.clientSecret) return { configured: false, channel, isLive: false }
  return cached(`twitch:live:${channel}`, 60_000, async () => {
    const d = await helix<{ data: { title: string; game_name: string; viewer_count: number; started_at: string; thumbnail_url: string }[] }>(
      `/streams?user_login=${encodeURIComponent(channel)}`,
    )
    const s = d?.data[0]
    if (!s) return { configured: true, channel, isLive: false }
    return {
      configured: true,
      channel,
      isLive: true,
      title: s.title,
      game: s.game_name,
      viewers: s.viewer_count,
      startedAt: s.started_at,
      thumbnail: s.thumbnail_url.replace('{width}', '640').replace('{height}', '360'),
    }
  })
}

export type ScheduleItem = { start: string; title: string; category?: string; boxArtUrl?: string; canceled?: boolean }

export async function getSchedule(): Promise<ScheduleItem[] | null> {
  const { twitch } = await getIntegrations()
  if (!twitch.clientId) return null
  return cached(`twitch:schedule:${twitch.channelLogin}`, 10 * 60_000, async () => {
    const id = await broadcasterId(twitch.channelLogin)
    if (!id) return null
    const d = await helix<{ data: { segments: { start_time: string; title: string; category: { name: string } | null; canceled_until: string | null }[] | null } }>(
      `/schedule?broadcaster_id=${id}&first=10`,
    )
    const segs = d?.data?.segments
    if (!segs?.length) return null
    // Une seule recherche de jaquette par catégorie distincte (mise en cache 6 h).
    const categories = [...new Set(segs.map((s) => s.category?.name).filter((c): c is string => Boolean(c)))]
    const boxArt = new Map<string, string>()
    await Promise.all(
      categories.map(async (cat) => {
        const [hit] = await searchGameBoxArt(cat).catch(() => [])
        if (hit) boxArt.set(cat, hit.boxArtUrl)
      }),
    )
    return segs.map((s) => ({ start: s.start_time, title: s.title, category: s.category?.name, boxArtUrl: s.category?.name ? boxArt.get(s.category.name) : undefined, canceled: Boolean(s.canceled_until) }))
  })
}

export type GameResult = { id: string; name: string; boxArtUrl: string }

/**
 * Recherche un jeu par nom (nom officiel + jaquette officielle) via l'API Twitch — les
 * mêmes identifiants (Client ID/Secret) que le reste de l'intégration Twitch, aucune clé
 * supplémentaire à saisir. Utilisé pour illustrer joliment le planning des streams.
 */
export async function searchGameBoxArt(query: string): Promise<GameResult[]> {
  const q = query.trim()
  if (q.length < 2) return []
  const { twitch } = await getIntegrations()
  if (!twitch.clientId || !twitch.clientSecret) return []
  return cached(`twitch:game-search:${q.toLowerCase()}`, 6 * 3600_000, async () => {
    const d = await helix<{ data: { id: string; name: string; box_art_url: string }[] }>(`/search/categories?query=${encodeURIComponent(q)}&first=8`)
    return (d?.data ?? []).map((g) => ({ id: g.id, name: g.name, boxArtUrl: g.box_art_url.replace('{width}', '188').replace('{height}', '250') }))
  })
}

export type Clip = { id: string; url: string; title: string; thumbnail: string; views: number; createdAt: string; duration: number }

export async function getClips(count = 6): Promise<Clip[]> {
  const { twitch } = await getIntegrations()
  if (!twitch.clientId) return []
  return cached(`twitch:clips:${twitch.channelLogin}:${count}`, 30 * 60_000, async () => {
    const id = await broadcasterId(twitch.channelLogin)
    if (!id) return []
    const since = new Date(Date.now() - 90 * 24 * 3600 * 1000).toISOString()
    const d = await helix<{ data: { id: string; url: string; title: string; thumbnail_url: string; view_count: number; created_at: string; duration: number }[] }>(
      `/clips?broadcaster_id=${id}&first=${Math.min(20, count)}&started_at=${since}`,
    )
    return (d?.data ?? []).slice(0, count).map((c) => ({
      id: c.id,
      url: c.url,
      title: c.title,
      thumbnail: c.thumbnail_url,
      views: c.view_count,
      createdAt: c.created_at,
      duration: c.duration,
    }))
  })
}

/** URL d'autorisation OAuth (connexion viewer, portée minimale : aucune). */
export async function getOAuthUrl(redirectUri: string, state: string): Promise<string | null> {
  const { twitch } = await getIntegrations()
  if (!twitch.oauthEnabled || !twitch.clientId) return null
  const p = new URLSearchParams({ client_id: twitch.clientId, redirect_uri: redirectUri, response_type: 'code', scope: '', state })
  return `https://id.twitch.tv/oauth2/authorize?${p}`
}

export async function exchangeOAuthCode(code: string, redirectUri: string): Promise<{ id: string; login: string; displayName: string; avatar: string } | null> {
  const { twitch } = await getIntegrations()
  const r = await fetch('https://id.twitch.tv/oauth2/token', {
    method: 'POST',
    body: new URLSearchParams({
      client_id: twitch.clientId,
      client_secret: twitch.clientSecret,
      code,
      grant_type: 'authorization_code',
      redirect_uri: redirectUri,
    }),
  })
  if (!r.ok) return null
  const { access_token } = (await r.json()) as { access_token: string }
  const u = await fetch(`${HELIX}/users`, { headers: { 'Client-Id': twitch.clientId, Authorization: `Bearer ${access_token}` } })
  if (!u.ok) return null
  const user = ((await u.json()) as { data: { id: string; login: string; display_name: string; profile_image_url: string }[] }).data[0]
  // Le jeton utilisateur n'est pas conservé : on n'en a besoin que pour identifier le compte.
  await fetch('https://id.twitch.tv/oauth2/revoke', { method: 'POST', body: new URLSearchParams({ client_id: twitch.clientId, token: access_token }) }).catch(() => {})
  return user ? { id: user.id, login: user.login, displayName: user.display_name, avatar: user.profile_image_url } : null
}

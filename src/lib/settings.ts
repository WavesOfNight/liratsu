/**
 * Accès serveur aux réglages et identifiants.
 *
 * Priorité : valeur saisie dans l'admin (déchiffrée) > variable d'environnement.
 * Un petit cache mémoire (30 s) évite de relire la base à chaque requête ; il est
 * invalidé à chaque enregistrement dans l'admin (hook revalidateAll).
 */
import { getPayloadClient } from './payload'
import { settingsCache } from './settingsCache'

export { invalidateSettingsCache } from './settingsCache'
const TTL = 30_000

const pick = (...values: (string | null | undefined)[]): string => values.find((v) => typeof v === 'string' && v.trim() !== '')?.trim() ?? ''

export type ResolvedIntegrations = {
  twitch: { channelLogin: string; clientId: string; clientSecret: string; oauthEnabled: boolean }
  youtube: { channelId: string; vodChannelHandle: string }
  stripe: { publishableKey: string; secretKey: string; webhookSecret: string }
  paypal: { clientId: string; clientSecret: string; webhookId: string; apiBase: string }
  gelato: { apiKey: string; webhookToken: string }
  smtp: { host: string; port: number; secure: boolean; user: string; password: string; from: string; adminNotify: string }
  discord: { scheduleWebhookUrl: string }
  analytics: { provider: 'none' | 'umami' | 'plausible'; scriptUrl: string; siteId: string }
  testMode: boolean
}

type Raw = Record<string, Record<string, unknown> | undefined>
const s = (obj: unknown, key: string): string => {
  const v = (obj as Record<string, unknown> | undefined)?.[key]
  return typeof v === 'string' ? v : ''
}

export async function getIntegrations(): Promise<ResolvedIntegrations> {
  const hit = settingsCache.get<ResolvedIntegrations>(TTL)
  if (hit) return hit
  const payload = await getPayloadClient()
  const [raw, shop] = await Promise.all([
    payload.findGlobal({ slug: 'integrations', context: { revealSecrets: true }, depth: 0 }) as Promise<unknown>,
    payload.findGlobal({ slug: 'shop-settings', depth: 0 }),
  ])
  const r = raw as Raw
  const env = process.env
  const testMode = shop?.testMode !== false

  const stripeRaw = (r.stripe?.[testMode ? 'test' : 'live'] ?? {}) as Record<string, unknown>
  const paypalRaw = (r.paypal?.[testMode ? 'sandbox' : 'live'] ?? {}) as Record<string, unknown>

  const value: ResolvedIntegrations = {
    testMode,
    twitch: {
      channelLogin: pick(s(r.twitch, 'channelLogin'), env.TWITCH_CHANNEL_LOGIN, 'liratsu'),
      clientId: pick(s(r.twitch, 'clientId'), env.TWITCH_CLIENT_ID),
      clientSecret: pick(s(r.twitch, 'clientSecret'), env.TWITCH_CLIENT_SECRET),
      oauthEnabled: Boolean(r.twitch?.oauthEnabled),
    },
    youtube: {
      channelId: pick(s(r.youtube, 'channelId'), env.YOUTUBE_CHANNEL_ID),
      vodChannelHandle: pick(s(r.youtube, 'vodChannelHandle'), env.YOUTUBE_VOD_CHANNEL_HANDLE, 'LiratsuVOD'),
    },
    stripe: {
      publishableKey: pick(s(stripeRaw, 'publishableKey'), testMode ? env.STRIPE_TEST_PUBLISHABLE_KEY : env.STRIPE_LIVE_PUBLISHABLE_KEY),
      secretKey: pick(s(stripeRaw, 'secretKey'), testMode ? env.STRIPE_TEST_SECRET_KEY : env.STRIPE_LIVE_SECRET_KEY),
      webhookSecret: pick(s(stripeRaw, 'webhookSecret'), testMode ? env.STRIPE_TEST_WEBHOOK_SECRET : env.STRIPE_LIVE_WEBHOOK_SECRET),
    },
    paypal: {
      clientId: pick(s(paypalRaw, 'clientId'), testMode ? env.PAYPAL_SANDBOX_CLIENT_ID : env.PAYPAL_LIVE_CLIENT_ID),
      clientSecret: pick(s(paypalRaw, 'clientSecret'), testMode ? env.PAYPAL_SANDBOX_CLIENT_SECRET : env.PAYPAL_LIVE_CLIENT_SECRET),
      webhookId: pick(s(paypalRaw, 'webhookId'), testMode ? env.PAYPAL_SANDBOX_WEBHOOK_ID : env.PAYPAL_LIVE_WEBHOOK_ID),
      apiBase: testMode ? 'https://api-m.sandbox.paypal.com' : 'https://api-m.paypal.com',
    },
    gelato: {
      apiKey: pick(s(r.gelato, 'apiKey'), env.GELATO_API_KEY),
      webhookToken: pick(s(r.gelato, 'webhookToken'), env.GELATO_WEBHOOK_TOKEN),
    },
    smtp: {
      host: pick(s(r.smtp, 'host'), env.SMTP_HOST),
      port: Number(r.smtp?.port ?? env.SMTP_PORT ?? 587) || 587,
      secure: Boolean(r.smtp?.secure ?? env.SMTP_SECURE === 'true'),
      user: pick(s(r.smtp, 'user'), env.SMTP_USER),
      password: pick(s(r.smtp, 'password'), env.SMTP_PASSWORD),
      from: pick(s(r.smtp, 'from'), env.SMTP_FROM, 'Liratsu <no-reply@liratsu.fr>'),
      adminNotify: pick(s(r.smtp, 'adminNotify'), env.ADMIN_NOTIFY_EMAIL),
    },
    discord: {
      scheduleWebhookUrl: pick(s(r.discord, 'scheduleWebhookUrl'), env.DISCORD_SCHEDULE_WEBHOOK_URL),
    },
    analytics: {
      provider: (s(r.analytics, 'provider') || 'none') as ResolvedIntegrations['analytics']['provider'],
      scriptUrl: s(r.analytics, 'scriptUrl'),
      siteId: s(r.analytics, 'siteId'),
    },
  }
  settingsCache.set(value)
  return value
}

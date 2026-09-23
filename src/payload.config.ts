import { postgresAdapter } from '@payloadcms/db-postgres'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import path from 'path'
import { buildConfig } from 'payload'
import { fileURLToPath } from 'url'
import sharp from 'sharp'
import { fr } from '@payloadcms/translations/languages/fr'

import { ActivityLog, GameSessions, Scores } from './collections/Arcade'
import { Announcements, Downloads, Fanarts, Guestbook, Members, NotifySignups, PollVotes, Polls, ProtectedFiles, SurpriseCodes } from './collections/Community'
import { LegalPages } from './collections/LegalPages'
import { Media } from './collections/Media'
import { Categories, Coupons, Customers, Orders, Products, ShippingZones, WebhookEvents } from './collections/Shop'
import { Users } from './collections/Users'
import { EasterEggs } from './globals/EasterEggs'
import { GameSettings } from './globals/GameSettings'
import { Integrations } from './globals/Integrations'
import { LegalIdentity } from './globals/LegalIdentity'
import { ModerationSettings } from './globals/ModerationSettings'
import { BiographyPage, HomePage, LinksPage } from './globals/Pages'
import { ShopSettings } from './globals/ShopSettings'
import { SiteSettings } from './globals/SiteSettings'
import { Theme } from './globals/Theme'
import { withActivityLog } from './hooks/activityLog'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

const { collections, globals } = withActivityLog(
  [
    Users,
    Media,
    // Boutique
    Products,
    Categories,
    Orders,
    Customers,
    Coupons,
    ShippingZones,
    // Communauté
    Guestbook,
    Fanarts,
    Polls,
    PollVotes,
    Announcements,
    Downloads,
    ProtectedFiles,
    SurpriseCodes,
    NotifySignups,
    Members,
    // Arcade
    Scores,
    GameSessions,
    // Légal & système
    LegalPages,
    ActivityLog,
    WebhookEvents,
  ],
  [SiteSettings, Theme, HomePage, BiographyPage, LinksPage, ShopSettings, EasterEggs, GameSettings, ModerationSettings, LegalIdentity, Integrations],
)

export default buildConfig({
  serverURL: process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3000',
  admin: {
    user: Users.slug,
    importMap: { baseDir: path.resolve(dirname) },
    meta: {
      titleSuffix: ' · Liratsu Admin',
      icons: [{ rel: 'icon', type: 'image/svg+xml', url: '/favicon.svg' }],
    },
    components: {
      graphics: {
        Logo: '@/components/admin/AdminLogo#AdminLogo',
        Icon: '@/components/admin/AdminLogo#AdminIcon',
      },
      providers: ['@/components/admin/TwoFactorGate#TwoFactorGate'],
      beforeDashboard: ['@/components/admin/Dashboard#Dashboard'],
      beforeNavLinks: ['@/components/admin/moderation/ModerationNavLink#ModerationNavLink'],
      views: {
        moderation: { Component: '@/components/admin/moderation/ModerationView#ModerationView', path: '/moderation' },
      },
    },
  },
  i18n: { supportedLanguages: { fr }, fallbackLanguage: 'fr' },
  collections,
  globals,
  editor: lexicalEditor(),
  secret: process.env.PAYLOAD_SECRET || '',
  typescript: { outputFile: path.resolve(dirname, 'payload-types.ts') },
  db: postgresAdapter({
    pool: { connectionString: process.env.DATABASE_URL || '' },
    // En production on n'utilise que les migrations versionnées (npm run migrate).
    push: process.env.NODE_ENV !== 'production' && process.env.PAYLOAD_DB_PUSH !== 'false',
    migrationDir: path.resolve(dirname, 'migrations'),
  }),
  upload: { limits: { fileSize: 15 * 1024 * 1024 } },
  sharp,
  graphQL: { disable: true },
  csrf: [process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3000'],
  cors: [process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3000'],
})

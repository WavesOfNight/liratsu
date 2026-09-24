import { withPayload } from '@payloadcms/next/withPayload'
import type { NextConfig } from 'next'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(__filename)

/** En-têtes de sécurité appliqués partout (la CSP du site public est posée par src/proxy.ts). */
const securityHeaders = [
  { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), payment=(self "https://www.paypal.com"), gamepad=(self)' },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'Cross-Origin-Opener-Policy', value: 'same-origin-allow-popups' },
]

const nextConfig: NextConfig = {
  poweredByHeader: false,
  images: {
    formats: ['image/avif', 'image/webp'],
    localPatterns: [{ pathname: '/api/media/file/**' }, { pathname: '/api/fanarts/file/**' }, { pathname: '/api/game-assets/file/**' }, { pathname: '/img/**' }],
    remotePatterns: [
      { protocol: 'https', hostname: 'static-cdn.jtvnw.net' },
      { protocol: 'https', hostname: 'clips-media-assets2.twitch.tv' },
      { protocol: 'https', hostname: 'i.ytimg.com' },
    ],
  },
  serverExternalPackages: ['pdfkit', 'embedded-postgres'],
  async headers() {
    return [
      { source: '/:path*', headers: securityHeaders },
      // Cette route sert des jeux « code personnalisé » dans une iframe de notre propre
      // page (CustomGameFrame) : elle a besoin d'être embarquable par nous-mêmes ; sa propre
      // Content-Security-Policy (posée par la route elle-même) restreint tout le reste.
      { source: '/api/site/arcade/:slug/render', headers: [{ key: 'X-Frame-Options', value: 'SAMEORIGIN' }] },
    ]
  },
  webpack: (webpackConfig) => {
    webpackConfig.resolve.extensionAlias = {
      '.cjs': ['.cts', '.cjs'],
      '.js': ['.ts', '.tsx', '.js', '.jsx'],
      '.mjs': ['.mts', '.mjs'],
    }
    return webpackConfig
  },
  turbopack: { root: path.resolve(dirname) },
}

export default withPayload(nextConfig, { devBundleServerPackages: false })

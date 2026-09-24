/**
 * Proxy Next.js (ex-middleware) : Content-Security-Policy avec nonce pour le site public.
 * Compatible avec les embeds autorisés (Twitch, YouTube nocookie, TikTok, Instagram, PayPal, Stripe).
 * L'admin Payload (/admin) et l'API ont leurs propres en-têtes (voir next.config.ts).
 */
import { NextResponse, type NextRequest } from 'next/server'

const extraHosts = (process.env.CSP_EXTRA_HOSTS ?? '').split(/[\s,]+/).filter(Boolean).join(' ')

export function proxy(request: NextRequest) {
  const nonce = Buffer.from(crypto.randomUUID()).toString('base64')
  const isDev = process.env.NODE_ENV !== 'production'
  const csp = [
    `default-src 'self'`,
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic' https://www.paypal.com${isDev ? ` 'unsafe-eval'` : ''}`,
    // Les attributs style="" de React nécessitent 'unsafe-inline' pour les styles (pas pour les scripts).
    `style-src 'self' 'unsafe-inline'`,
    `img-src 'self' data: blob: https://static-cdn.jtvnw.net https://clips-media-assets2.twitch.tv https://i.ytimg.com https://www.paypalobjects.com https://*.paypal.com`,
    `font-src 'self'`,
    `connect-src 'self' https://www.paypal.com https://*.paypal.com${extraHosts ? ' ' + extraHosts : ''}${isDev ? ' ws:' : ''}`,
    // 'self' : nécessaire pour embarquer /api/site/arcade/<slug>/render (jeux « code personnalisé »),
    // qui a sa propre CSP restrictive (sans réseau) et n'est chargé que dans une iframe sandboxée.
    `frame-src 'self' https://player.twitch.tv https://clips.twitch.tv https://www.youtube-nocookie.com https://www.tiktok.com https://www.instagram.com https://www.paypal.com https://*.paypal.com`,
    `media-src 'self'`,
    `object-src 'none'`,
    `base-uri 'self'`,
    `form-action 'self' https://checkout.stripe.com https://www.paypal.com`,
    `frame-ancestors 'none'`,
    ...(isDev ? [] : ['upgrade-insecure-requests']),
  ].join('; ')

  const requestHeaders = new Headers(request.headers)
  requestHeaders.set('x-nonce', nonce)
  requestHeaders.set('Content-Security-Policy', csp)
  const response = NextResponse.next({ request: { headers: requestHeaders } })
  response.headers.set('Content-Security-Policy', csp)
  return response
}

export const config = {
  matcher: [
    {
      source: '/((?!api|admin|_next/static|_next/image|fonts|img|favicon|robots.txt|sitemap.xml).*)',
      missing: [
        { type: 'header', key: 'next-router-prefetch' },
        { type: 'header', key: 'purpose', value: 'prefetch' },
      ],
    },
  ],
}

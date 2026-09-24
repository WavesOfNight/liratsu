/**
 * Proxy Next.js (ex-middleware) : Content-Security-Policy avec nonce pour le site public,
 * et page de maintenance si activée dans Réglages du site > Maintenance.
 * Compatible avec les embeds autorisés (Twitch, YouTube nocookie, TikTok, Instagram, PayPal, Stripe).
 * L'admin Payload (/admin) et l'API ont leurs propres en-têtes (voir next.config.ts) et ne passent
 * jamais par ici (voir le matcher plus bas) : le mode maintenance ne peut donc pas bloquer la connexion.
 */
import { NextResponse, type NextRequest } from 'next/server'
import { getMaintenanceState } from '@/lib/site'

const extraHosts = (process.env.CSP_EXTRA_HOSTS ?? '').split(/[\s,]+/).filter(Boolean).join(' ')

const escapeHtml = (s: string) => s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c] as string)

function maintenancePage(message: string, csp: string): NextResponse {
  const html = `<!doctype html>
<html lang="fr"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex">
<title>Maintenance · Liratsu</title>
<style>
  html,body{height:100%;margin:0;font-family:ui-rounded,'Segoe UI',sans-serif;background:linear-gradient(160deg,#3fa9f5,#1e6fd9);display:grid;place-items:center;color:#0b1a3a}
  .card{max-width:480px;margin:24px;padding:32px 28px;background:#fff;border-radius:24px;box-shadow:0 20px 50px rgba(11,26,58,.35);text-align:center;border:3px solid #fff}
  .icon{font-size:2.6rem}
  h1{margin:8px 0 4px;color:#1e6fd9}
  p{line-height:1.5;font-size:1.05rem}
</style></head>
<body><div class="card"><div class="icon">🛠️✦</div><h1>De retour très vite !</h1><p>${escapeHtml(message)}</p></div></body></html>`
  return new NextResponse(html, {
    status: 503,
    headers: { 'Content-Type': 'text/html; charset=utf-8', 'Retry-After': '3600', 'Content-Security-Policy': csp },
  })
}

export async function proxy(request: NextRequest) {
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

  try {
    const maintenance = await getMaintenanceState()
    if (maintenance.enabled) return maintenancePage(maintenance.message, csp)
  } catch {
    // En cas d'erreur (ex. base de données momentanément indisponible), on ne bloque jamais
    // le site public pour cette raison : on continue comme si la maintenance était désactivée.
  }

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

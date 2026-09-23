/**
 * Polices auto-hébergées (RGPD : aucun appel à Google Fonts).
 * Fichiers copiés depuis @fontsource via `npm run fonts` dans /public/fonts.
 */
import localFont from 'next/font/local'

export const fredoka = localFont({
  src: [
    { path: '../../public/fonts/fredoka-latin-500-normal.woff2', weight: '500', style: 'normal' },
    { path: '../../public/fonts/fredoka-latin-600-normal.woff2', weight: '600', style: 'normal' },
    { path: '../../public/fonts/fredoka-latin-700-normal.woff2', weight: '700', style: 'normal' },
  ],
  variable: '--font-display',
  display: 'swap',
  fallback: ['ui-rounded', 'system-ui', 'sans-serif'],
})

export const quicksand = localFont({
  src: [
    { path: '../../public/fonts/quicksand-latin-500-normal.woff2', weight: '500', style: 'normal' },
    { path: '../../public/fonts/quicksand-latin-600-normal.woff2', weight: '600', style: 'normal' },
    { path: '../../public/fonts/quicksand-latin-700-normal.woff2', weight: '700', style: 'normal' },
  ],
  variable: '--font-body',
  display: 'swap',
  fallback: ['system-ui', 'sans-serif'],
})

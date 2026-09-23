/**
 * Copie les polices Fredoka et Quicksand (woff2, latin + latin-ext) depuis les paquets
 * @fontsource vers /public/fonts. Aucune requête vers Google Fonts en production (RGPD).
 *
 * Usage : npm run fonts
 */
import { copyFileSync, existsSync, mkdirSync } from 'node:fs'
import path from 'node:path'

const out = path.resolve('public/fonts')
mkdirSync(out, { recursive: true })

const families = ['fredoka', 'quicksand']
const weights = [500, 600, 700]
const subsets = ['latin', 'latin-ext']

let n = 0
for (const family of families) {
  for (const weight of weights) {
    for (const subset of subsets) {
      const file = `${family}-${subset}-${weight}-normal.woff2`
      const src = path.resolve('node_modules/@fontsource', family, 'files', file)
      if (!existsSync(src)) continue
      copyFileSync(src, path.join(out, file))
      n++
    }
  }
}
console.log(`✔ ${n} fichiers de police copiés dans public/fonts`)

import sharp from 'sharp'
import { z } from 'zod'
import { error, guard, json } from '@/lib/api'
import { averageHash } from '@/lib/moderation/imageHash'
import { getModerationSettings, notifyModerators } from '@/lib/moderation/notify'
import { analyzeText } from '@/lib/moderation/textFilter'
import { getPayloadClient } from '@/lib/payload'
import { getSection } from '@/lib/site'

const MAX = 8 * 1024 * 1024
const TYPES = new Map([
  ['image/png', 'png'],
  ['image/jpeg', 'jpg'],
  ['image/webp', 'webp'],
  ['image/gif', 'gif'],
] as const)

const fields = z.object({
  title: z.string().trim().min(2).max(80),
  artist: z.string().trim().min(2).max(40),
  artistLink: z.union([z.url().max(300), z.literal('')]).optional(),
  contactEmail: z.union([z.email().max(200), z.literal('')]).optional(),
  license: z.literal('on', { error: 'Merci d’accorder la licence d’affichage.' }),
  website: z.string().max(0).optional(),
})

/**
 * Envoi de fanart (multipart) :
 *  1. type, taille et dimensions filtrés ; l'image doit être décodable (sharp) ;
 *  2. ré-encodage : suppression des métadonnées EXIF (position GPS, appareil…) ;
 *  3. empreinte visuelle pour repérer les doublons ;
 *  4. filtre automatique des textes (titre, pseudo, lien) ;
 *  5. enregistrement « en attente » + alerte aux modérateurs (modération a priori).
 */
export async function POST(req: Request) {
  const blocked = guard(req, 'fanart', 3, 60 * 60_000)
  if (blocked) return blocked
  if ((await getSection('community')).status !== 'on') return error('Espace communauté fermé.', 403)
  if (Number(req.headers.get('content-length') ?? 0) > MAX + 50_000) return error('Image trop lourde (8 Mo max).', 413)

  const form = await req.formData().catch(() => null)
  if (!form) return error('Formulaire invalide.')
  const parsed = fields.safeParse(Object.fromEntries([...form.entries()].filter(([, v]) => typeof v === 'string')))
  if (!parsed.success) return error(parsed.error.issues[0]?.message ?? 'Champs invalides.', 422)
  const file = form.get('image')
  if (!(file instanceof File)) return error('Image manquante.')
  const ext = TYPES.get(file.type as never)
  if (!ext) return error('Formats acceptés : PNG, JPG, WEBP, GIF.')
  if (file.size > MAX) return error('Image trop lourde (8 Mo max).', 413)

  const original = Buffer.from(await file.arrayBuffer())
  const meta = await sharp(original).metadata().catch(() => null)
  if (!meta?.format || !meta.width || !meta.height || meta.width > 12000 || meta.height > 12000) return error('Image illisible.')
  if (meta.width < 200 || meta.height < 200) return error('Image trop petite (200 × 200 px minimum).')

  // Ré-encodage : rotate() applique l'orientation EXIF puis sharp supprime toutes les métadonnées.
  const animated = ext === 'gif'
  const img = sharp(original, { animated }).rotate()
  const clean =
    ext === 'jpg'
      ? await img.jpeg({ quality: 92, mozjpeg: true }).toBuffer()
      : ext === 'png'
        ? await img.png({ compressionLevel: 9 }).toBuffer()
        : ext === 'webp'
          ? await img.webp({ quality: 92 }).toBuffer()
          : await img.gif().toBuffer()

  const payload = await getPayloadClient()
  const { settings, filter } = await getModerationSettings(payload)

  // Filtre des textes (titre + pseudo : refus si insulte ; lien d'artiste hors liste : simple signalement)
  const text = analyzeText(`${parsed.data.title}\n${parsed.data.artist}`, filter)
  if (text.verdict === 'block') return error(text.reason ?? 'Texte refusé.', 422)
  const flags = new Set<string>(text.flags)
  const matches = [...text.matches]

  // Doublons (même image, même redimensionnée ou ré-enregistrée)
  const fileHash = await averageHash(clean)
  if (fileHash) {
    const dup = await payload.find({ collection: 'fanarts', where: { and: [{ fileHash: { equals: fileHash } }, { status: { not_equals: 'rejected' } }] }, limit: 1, depth: 0 })
    if (dup.docs.length) {
      if (settings.rejectDuplicates !== false) return error('Ce dessin a déjà été envoyé ✦ Merci ! Il est peut-être en attente de validation.', 409)
      flags.add('duplicate')
    }
  }
  if (parsed.data.artistLink) {
    const link = analyzeText(parsed.data.artistLink, { ...filter, links: 'review' })
    if (link.flags.includes('link')) {
      flags.add('link')
      matches.push(parsed.data.artistLink)
    }
  }

  const doc = await payload.create({
    collection: 'fanarts',
    data: {
      status: 'pending',
      title: parsed.data.title,
      artist: parsed.data.artist,
      artistLink: parsed.data.artistLink || undefined,
      contactEmail: parsed.data.contactEmail || undefined,
      licenseAccepted: true,
      fileHash: fileHash ?? undefined,
      flags: [...flags] as never,
      flaggedTerms: matches.join(' · ') || undefined,
    },
    file: { data: clean, mimetype: file.type, name: `fanart-${Date.now()}.${ext}`, size: clean.length },
  })
  void notifyModerators(payload, { kind: 'fanart', title: `« ${doc.title} » par ${doc.artist}`, flags: [...flags] }).catch(() => null)
  return json({ ok: true })
}

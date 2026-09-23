import sharp from 'sharp'
import { z } from 'zod'
import { error, guard, json } from '@/lib/api'
import { getPayloadClient } from '@/lib/payload'
import { getSection } from '@/lib/site'

const MAX = 8 * 1024 * 1024
const TYPES = new Map([
  ['image/png', 'png'],
  ['image/jpeg', 'jpg'],
  ['image/webp', 'webp'],
  ['image/gif', 'gif'],
])

const fields = z.object({
  title: z.string().trim().min(2).max(80),
  artist: z.string().trim().min(2).max(40),
  artistLink: z.union([z.url().max(300), z.literal('')]).optional(),
  contactEmail: z.union([z.email().max(200), z.literal('')]).optional(),
  license: z.literal('on', { error: 'Merci d’accorder la licence d’affichage.' }),
  website: z.string().max(0).optional(),
})

/** Envoi de fanart (multipart). Type et taille filtrés, image vérifiée par sharp, modération a priori. */
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
  const ext = TYPES.get(file.type)
  if (!ext) return error('Formats acceptés : PNG, JPG, WEBP, GIF.')
  if (file.size > MAX) return error('Image trop lourde (8 Mo max).', 413)

  const buffer = Buffer.from(await file.arrayBuffer())
  // Vérifie que le contenu est bien une image décodable (et pas un fichier déguisé).
  const meta = await sharp(buffer).metadata().catch(() => null)
  if (!meta?.format || meta.width! > 12000 || meta.height! > 12000) return error('Image illisible.')

  const payload = await getPayloadClient()
  await payload.create({
    collection: 'fanarts',
    data: {
      status: 'pending',
      title: parsed.data.title,
      artist: parsed.data.artist,
      artistLink: parsed.data.artistLink || undefined,
      contactEmail: parsed.data.contactEmail || undefined,
      licenseAccepted: true,
    },
    file: { data: buffer, mimetype: file.type, name: `fanart-${Date.now()}.${ext}`, size: buffer.length },
  })
  return json({ ok: true })
}

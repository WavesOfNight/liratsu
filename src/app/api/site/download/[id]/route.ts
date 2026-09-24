import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { error, guard } from '@/lib/api'
import { readMemberId, readUnlocks } from '@/lib/community'
import { getPayloadClient } from '@/lib/payload'

/**
 * Téléchargement d'un fichier (fond d'écran, pack…). Les contenus « surprise » exigent
 * un déblocage (code surprise) ; les fichiers ne sont jamais exposés directement.
 */
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const blocked = guard(req, 'download', 60, 10 * 60_000)
  if (blocked) return blocked
  const { id } = await params
  const format = new URL(req.url).searchParams.get('format')
  const payload = await getPayloadClient()
  const dl = await payload.findByID({ collection: 'downloads', id, depth: 1 }).catch(() => null)
  if (!dl) return error('Introuvable.', 404)

  if (dl.locked) {
    const cookie = req.headers.get('cookie')
    let unlocked = readUnlocks(cookie).includes(Number(dl.id))
    const memberId = readMemberId(cookie)
    if (!unlocked && memberId) {
      const member = await payload.findByID({ collection: 'members', id: memberId, depth: 1 }).catch(() => null)
      unlocked = Boolean(member?.unlockedCodes?.some((c) => typeof c === 'object' && c.unlocks?.some((u) => (typeof u === 'object' ? u.id : u) === dl.id)))
    }
    if (!unlocked) return error('Ce contenu est une surprise : il faut un code pour le débloquer ✦', 403)
  }

  const entry = dl.files?.find((f) => f.format === format) ?? dl.files?.[0]
  const file = entry?.file
  if (!file || typeof file !== 'object' || !file.filename) return error('Fichier indisponible.', 404)
  // Lu depuis une variable d'environnement (pas de path.resolve(process.cwd(), 'literal') en dur) :
  // en déploiement par releases, ce dossier est un lien symbolique qui sort du dossier de la
  // release, et le traceur de build de Next.js (Turbopack) refuse de le suivre s'il détecte
  // l'appel littéral au moment du build — voir .env.example.
  const dir = path.resolve(process.env.PROTECTED_FILES_DIR || 'protected-files')
  const full = path.resolve(dir, file.filename)
  if (!full.startsWith(dir + path.sep)) return error('Chemin invalide.', 400)
  const data = await readFile(full).catch(() => null)
  if (!data) return error('Fichier indisponible.', 404)
  return new Response(new Uint8Array(data), {
    headers: {
      'Content-Type': file.mimeType ?? 'application/octet-stream',
      'Content-Disposition': `attachment; filename="${encodeURIComponent(file.filename)}"`,
      'Cache-Control': 'private, no-store',
      'X-Content-Type-Options': 'nosniff',
    },
  })
}

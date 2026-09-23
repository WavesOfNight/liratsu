/** Réglages de modération + notifications (modérateurs, artistes). */
import type { Payload, PayloadRequest } from 'payload'
import { escapeHtml as esc, layoutEmail, sendMail } from '../mail'
import { getIntegrations } from '../settings'
import { parseList, type FilterOptions } from './textFilter'

export async function getModerationSettings(payload: Payload) {
  const s = await payload.findGlobal({ slug: 'moderation-settings', depth: 0 })
  const filter: FilterOptions = {
    links: (s.links as FilterOptions['links']) ?? 'block',
    allowedDomains: parseList(s.allowedDomains),
    extraBlocked: parseList(s.blockedWords),
    extraWatched: parseList(s.watchedWords),
    blockPersonal: s.blockPersonal !== false,
  }
  return { settings: s, filter }
}

async function siteUrl(payload: Payload) {
  const s = await payload.findGlobal({ slug: 'site-settings', depth: 0 })
  return (s.siteUrl || process.env.NEXT_PUBLIC_SERVER_URL || 'https://liratsu.fr').replace(/\/$/, '')
}

/** Prévient l'équipe qu'un nouvel envoi attend une validation. */
export async function notifyModerators(payload: Payload, item: { kind: 'fanart' | 'guestbook'; title: string; flags: string[] }) {
  const { settings } = await getModerationSettings(payload)
  if (settings.notify === false) return
  const { smtp } = await getIntegrations()
  const to = parseList(settings.notifyEmails).join(', ') || smtp.adminNotify
  if (!to) return
  const base = await siteUrl(payload)
  const what = item.kind === 'fanart' ? 'Nouveau fanart' : 'Nouveau message du livre d’or'
  await sendMail({
    to,
    subject: `🛡️ ${what} à modérer${item.flags.length ? ` (⚠️ ${item.flags.join(', ')})` : ''}`,
    html: layoutEmail(
      what,
      `<p>${esc(item.title)}</p>${item.flags.length ? `<p>Alertes automatiques : <strong>${esc(item.flags.join(', '))}</strong></p>` : ''}<p><a href="${base}/admin/moderation">Ouvrir la file de modération</a></p>`,
      base,
    ),
    text: `${what} à modérer : ${item.title}. ${base}/admin/moderation`,
  })
}

/**
 * Informe l'artiste de la décision (si un email a été laissé et si l'option est active).
 * Appelée depuis un hook : `req` permet de relire le fanart dans la même transaction.
 */
export async function notifyArtist(payload: Payload, fanartId: number | string, req?: PayloadRequest) {
  const { settings } = await getModerationSettings(payload)
  if (settings.emailArtist === false) return
  const f = await payload.findByID({ collection: 'fanarts', id: fanartId, depth: 0, overrideAccess: true, showHiddenFields: true, req })
  if (!f.contactEmail || (f.status !== 'approved' && f.status !== 'rejected')) return
  const base = await siteUrl(payload)
  const approved = f.status === 'approved'
  const body = approved
    ? `<p>Coucou ${esc(f.artist)} ✦</p><p>Ton fanart « ${esc(f.title)} » a été validé : il est maintenant visible dans la galerie de l’Espace communauté. Merci infiniment !</p><p><a href="${base}/communaute">Voir la galerie</a></p>`
    : `<p>Coucou ${esc(f.artist)},</p><p>Merci pour ton envoi « ${esc(f.title)} ». Il n’a malheureusement pas pu être publié${f.rejectionReason ? ` : <strong>${esc(f.rejectionReason)}</strong>` : ''}.</p><p>N’hésite pas à en proposer un autre ✦</p>`
  await sendMail({
    to: f.contactEmail,
    subject: approved ? '✦ Ton fanart est en ligne !' : 'Ton fanart n’a pas pu être publié',
    html: layoutEmail(approved ? 'Fanart validé' : 'Fanart non publié', `${body}<p>Liratsu</p>`, base),
    text: approved ? `Ton fanart « ${f.title} » est en ligne : ${base}/communaute` : `Ton fanart « ${f.title} » n’a pas pu être publié. ${f.rejectionReason ?? ''}`,
  })
}

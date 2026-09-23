/**
 * Envoi d'emails transactionnels via Nodemailer (SMTP configuré dans l'admin).
 * Sans SMTP configuré, les emails sont journalisés (utile en dev) et non envoyés.
 */
import nodemailer from 'nodemailer'
import { getIntegrations } from './settings'

export type Mail = { to: string; subject: string; html: string; text: string; attachments?: { filename: string; content: Buffer }[] }

export async function sendMail(mail: Mail): Promise<{ sent: boolean }> {
  const { smtp } = await getIntegrations()
  if (!smtp.host) {
    console.info(`[mail] SMTP non configuré — email non envoyé à ${mail.to} : ${mail.subject}`)
    return { sent: false }
  }
  const transport = nodemailer.createTransport({
    host: smtp.host,
    port: smtp.port,
    secure: smtp.secure,
    auth: smtp.user ? { user: smtp.user, pass: smtp.password } : undefined,
  })
  await transport.sendMail({ from: smtp.from, ...mail })
  return { sent: true }
}

const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c] as string)

/** Gabarit HTML aero minimal, compatible clients mail (tables + styles inline). */
export function layoutEmail(title: string, bodyHtml: string, siteUrl: string): string {
  return `<!doctype html><html lang="fr"><body style="margin:0;background:#eaf5ff;font-family:Arial,Helvetica,sans-serif;color:#1B2240">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:linear-gradient(#bfe8ff,#eaf5ff);padding:24px 12px"><tr><td align="center">
<table role="presentation" width="100%" style="max-width:560px;background:#ffffff;border-radius:18px;overflow:hidden;border:2px solid #ffffff;box-shadow:0 10px 30px rgba(30,111,217,.2)">
<tr><td style="background:linear-gradient(#7fd0ff,#2a86e0);padding:10px 16px;color:#fff;font-weight:bold;font-size:14px">✦ ${esc(title)}</td></tr>
<tr><td style="padding:24px 24px 8px;font-size:15px;line-height:1.6">${bodyHtml}</td></tr>
<tr><td style="padding:8px 24px 24px;font-size:12px;color:#46507a">Boutique officielle Liratsu · <a href="${esc(siteUrl)}" style="color:#1E6FD9">${esc(siteUrl.replace(/^https?:\/\//, ''))}</a><br>Site édité par Reads Records.</td></tr>
</table></td></tr></table></body></html>`
}

export { esc as escapeHtml }

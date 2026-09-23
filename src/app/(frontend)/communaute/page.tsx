import type { Metadata } from 'next'
import { cookies } from 'next/headers'
import Image from 'next/image'
import { notFound } from 'next/navigation'
import React from 'react'
import { AeroWindow } from '@/components/AeroWindow'
import { ComingSoon } from '@/components/ComingSoon'
import { FanartForm, GuestbookForm, PollWidget, RedeemForm } from '@/components/community/CommunityForms'
import { RichText } from '@/components/RichText'
import { MEMBER_COOKIE, readMemberId, readUnlocks, UNLOCK_COOKIE } from '@/lib/community'
import { getSection, getSiteData, mediaUrl } from '@/lib/site'
import styles from './community.module.css'

export const metadata: Metadata = {
  title: 'Espace communauté',
  description: 'Un coin rien qu’à vous : fonds d’écran, livre d’or, fanarts, sondages et petites surprises pour les viewers de Liratsu.',
  alternates: { canonical: '/communaute' },
}

const MOOD: Record<string, string> = { star: '⭐', heart: '💖', fish: '🐟', bubble: '🫧', music: '🎵' }
const FORMAT: Record<string, string> = { phone: '📱 Téléphone', tablet: '📟 Tablette', desktop: '🖥️ PC', zip: '📦 Archive' }

export default async function CommunityPage() {
  const section = await getSection('community')
  if (section.status === 'off') notFound()
  if (section.status === 'soon') return <ComingSoon title="Espace communauté" section="community" text={section.teaserText} notifyForm={section.notifyForm} />

  const { payload, integrations } = await getSiteData()
  const jar = await cookies()
  const cookieHeader = jar
    .getAll()
    .filter((c) => c.name === UNLOCK_COOKIE || c.name === MEMBER_COOKIE)
    .map((c) => `${c.name}=${c.value}`)
    .join('; ')
  const unlocks = readUnlocks(cookieHeader)
  const memberId = readMemberId(cookieHeader)

  const [announcements, polls, guestbook, fanarts, downloads, member] = await Promise.all([
    payload.find({ collection: 'announcements', sort: '-pinned,-publishedAt', limit: 5, depth: 0 }),
    payload.find({ collection: 'polls', where: { active: { equals: true } }, sort: '-createdAt', limit: 3, depth: 0 }),
    payload.find({ collection: 'guestbook', where: { status: { equals: 'approved' } }, sort: '-createdAt', limit: 30, depth: 0, overrideAccess: false }),
    payload.find({ collection: 'fanarts', where: { status: { equals: 'approved' } }, sort: '-createdAt', limit: 24, depth: 0, overrideAccess: false }),
    payload.find({ collection: 'downloads', sort: '-createdAt', limit: 50, depth: 2 }),
    memberId ? payload.findByID({ collection: 'members', id: memberId, depth: 1 }).catch(() => null) : null,
  ])
  const memberUnlocks = new Set(
    (member?.unlockedCodes ?? []).flatMap((c) => (typeof c === 'object' ? (c.unlocks ?? []).map((u) => Number(typeof u === 'object' ? u.id : u)) : [])),
  )
  const isUnlocked = (id: number) => unlocks.includes(id) || memberUnlocks.has(id)

  return (
    <div className="container">
      <header className="page-head">
        <h1>Espace communauté</h1>
        <p>Un coin rien qu’à vous : contenus et petites surprises pour les viewers ✦</p>
      </header>

      {integrations.twitch.oauthEnabled && (
        <div className={styles.memberBar}>
          {member ? (
            <>
              {member.avatarUrl && <img src={`/_next/image?url=${encodeURIComponent(member.avatarUrl)}&w=64&q=75`} alt="" width={32} height={32} className={styles.memberAvatar} />}
              <span>
                Connecté·e en tant que <strong>{member.displayName}</strong>
              </span>
              <form action="/api/site/auth/twitch/logout" method="post">
                <button className="candy-btn candy-btn--ghost candy-btn--small">Se déconnecter</button>
              </form>
            </>
          ) : (
            // eslint-disable-next-line @next/next/no-html-link-for-pages -- route API (redirection OAuth), pas une page
            <a className="candy-btn candy-btn--small" href="/api/site/auth/twitch/login">
              Se connecter avec Twitch
            </a>
          )}
        </div>
      )}

      <div className="stack">
        {announcements.docs.length > 0 && (
          <AeroWindow title="Annonces" icon="star">
            <ul className={styles.announcements}>
              {announcements.docs.map((a) => (
                <li key={a.id}>
                  <strong>
                    {a.pinned && '📌 '}
                    {a.title}
                  </strong>
                  {a.body && <RichText data={a.body} />}
                </li>
              ))}
            </ul>
          </AeroWindow>
        )}

        <div className="grid-2">
          <AeroWindow title="Fonds d’écran & surprises" icon="heart">
            <ul className={styles.downloads}>
              {downloads.docs.map((d) => {
                const open = !d.locked || isUnlocked(Number(d.id))
                const preview = mediaUrl(d.preview, 'thumb')
                return (
                  <li key={d.id} className={open ? '' : styles.locked}>
                    {preview && <Image src={preview} alt="" width={240} height={240} className={styles.dlPreview} />}
                    <strong>{d.title}</strong>
                    {open ? (
                      <div className={styles.formats}>
                        {d.files?.map((f) => (
                          <a key={f.id ?? f.format} className="candy-btn candy-btn--small candy-btn--ghost" href={`/api/site/download/${d.id}?format=${f.format}`}>
                            {FORMAT[f.format] ?? f.format}
                          </a>
                        ))}
                      </div>
                    ) : (
                      <span className="sticker sticker--pink">🔒 surprise</span>
                    )}
                  </li>
                )
              })}
              {downloads.docs.length === 0 && <li className="muted">Bientôt des fonds d’écran ici !</li>}
            </ul>
          </AeroWindow>

          <AeroWindow title="Code surprise" icon="star" id="codes">
            <p style={{ marginTop: 0 }}>Un code donné en live, trouvé dans un easter egg ou gagné dans The Saac ? Entre-le ici pour débloquer une surprise !</p>
            <RedeemForm />
          </AeroWindow>
        </div>

        {polls.docs.length > 0 && (
          <AeroWindow title="Sondages" icon="bubble">
            <div className="grid-2">
              {polls.docs.map((p) => (
                <PollWidget
                  key={p.id}
                  id={Number(p.id)}
                  question={p.question}
                  open={!p.closesAt || new Date(p.closesAt) > new Date()}
                  options={(p.options ?? []).map((o) => ({ label: o.label, votes: o.votes ?? 0 }))}
                />
              ))}
            </div>
          </AeroWindow>
        )}

        <AeroWindow title="Galerie des fanarts" icon="pencil">
          {fanarts.docs.length ? (
            <ul className={styles.fanarts}>
              {fanarts.docs.map((f) => {
                const src = (f.sizes?.thumb?.url || f.url || '').replace(/^https?:\/\/[^/]+/, '')
                return (
                  <li key={f.id}>
                    <a href={(f.url ?? '').replace(/^https?:\/\/[^/]+/, '')} target="_blank" rel="noopener noreferrer">
                      <Image src={src} alt={`${f.title} par ${f.artist}`} width={300} height={300} />
                    </a>
                    <span>
                      <strong>{f.title}</strong> par{' '}
                      {f.artistLink ? (
                        <a href={f.artistLink} target="_blank" rel="noopener noreferrer nofollow ugc">
                          {f.artist}
                        </a>
                      ) : (
                        f.artist
                      )}
                    </span>
                  </li>
                )
              })}
            </ul>
          ) : (
            <p className="muted">Aucun fanart pour l’instant… sois le premier ou la première !</p>
          )}
          <details className={styles.details}>
            <summary className="candy-btn candy-btn--lagoon candy-btn--small">Envoyer un fanart</summary>
            <div style={{ marginTop: 16 }}>
              <FanartForm />
            </div>
          </details>
        </AeroWindow>

        <div className="grid-2">
          <AeroWindow title="Livre d’or" icon="heart">
            <ul className={styles.guestbook}>
              {guestbook.docs.map((g) => (
                <li key={g.id}>
                  <div className={styles.gbHead}>
                    <span aria-hidden="true">{MOOD[g.mood ?? 'star']}</span>
                    <strong>{g.name}</strong>
                    <time className="muted" dateTime={g.createdAt}>
                      {new Date(g.createdAt).toLocaleDateString('fr-FR')}
                    </time>
                  </div>
                  <p>{g.message}</p>
                  {g.reply && <p className={styles.reply}>↳ Liratsu : {g.reply}</p>}
                </li>
              ))}
              {guestbook.docs.length === 0 && <li className="muted">Le livre d’or attend ton premier message !</li>}
            </ul>
          </AeroWindow>
          <AeroWindow title="Signer le livre d’or" icon="pencil">
            <GuestbookForm />
          </AeroWindow>
        </div>
      </div>
    </div>
  )
}

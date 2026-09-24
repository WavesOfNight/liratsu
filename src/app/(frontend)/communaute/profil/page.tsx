import type { Metadata } from 'next'
import { cookies } from 'next/headers'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import React from 'react'
import { AeroWindow } from '@/components/AeroWindow'
import { ComingSoon } from '@/components/ComingSoon'
import { ProfileForm } from '@/components/community/ProfileForm'
import { MEMBER_COOKIE, readMemberId } from '@/lib/community'
import { getSection, getSiteData } from '@/lib/site'
import styles from '../community.module.css'

export const metadata: Metadata = { title: 'Mon profil', robots: { index: false } }

const STATUS_MESSAGES: Record<string, { kind: 'ok' | 'error'; text: string }> = {
  'discord:ok': { kind: 'ok', text: 'Compte Discord lié ✦' },
  'discord:erreur': { kind: 'error', text: 'La liaison du compte Discord a échoué, réessaie.' },
  'discord:deja-lie': { kind: 'error', text: 'Ce compte Discord est déjà lié à un autre membre.' },
  'discord:annule': { kind: 'error', text: 'Liaison Discord annulée.' },
}

export default async function ProfilePage({ searchParams }: { searchParams: Promise<{ discord?: string }> }) {
  const section = await getSection('community')
  if (section.status === 'off') notFound()
  if (section.status === 'soon') return <ComingSoon title="Mon profil" section="community" text={section.teaserText} notifyForm={section.notifyForm} />

  const { discord } = await searchParams
  const banner = discord ? STATUS_MESSAGES[`discord:${discord}`] : null

  const { payload, integrations } = await getSiteData()
  const jar = await cookies()
  const memberCookie = jar.get(MEMBER_COOKIE)
  const memberId = readMemberId(memberCookie ? `${MEMBER_COOKIE}=${memberCookie.value}` : null)
  const member = memberId ? await payload.findByID({ collection: 'members', id: memberId, depth: 0 }).catch(() => null) : null

  return (
    <div className="container">
      <header className="page-head">
        <h1>Mon profil</h1>
        <p>Tes infos, ton adresse et tes comptes liés ✦</p>
      </header>

      {banner && (
        <p className={`form-msg ${banner.kind === 'error' ? 'form-msg--error' : ''}`} role={banner.kind === 'error' ? 'alert' : 'status'}>
          {banner.text}
        </p>
      )}

      {!member ? (
        <div className="stack" style={{ gap: 16, justifyItems: 'center', textAlign: 'center', padding: '32px 0' }}>
          <p>Connecte-toi avec Twitch pour accéder à ton profil.</p>
          {/* eslint-disable-next-line @next/next/no-html-link-for-pages -- route API (redirection OAuth), pas une page */}
          <a className="candy-btn" href="/api/site/auth/twitch/login">
            Se connecter avec Twitch
          </a>
        </div>
      ) : (
        <AeroWindow title={`Profil de ${member.displayName}`} icon="star">
          <div className={styles.memberBar} style={{ justifyContent: 'flex-start', marginBottom: 20 }}>
            {member.avatarUrl && (
              <img src={`/_next/image?url=${encodeURIComponent(member.avatarUrl)}&w=128&q=75`} alt="" width={56} height={56} className={styles.memberAvatar} />
            )}
            <strong>{member.displayName}</strong>
          </div>
          <ProfileForm
            member={{ email: member.email ?? null, savedAddress: member.savedAddress ?? null, discordUsername: member.discordUsername ?? null }}
            discordEnabled={Boolean(integrations.discord.clientId)}
          />
          <p style={{ marginTop: 24 }}>
            <Link href="/communaute" className="candy-btn candy-btn--ghost candy-btn--small">
              ← Retour à l’Espace communauté
            </Link>
          </p>
        </AeroWindow>
      )}
    </div>
  )
}

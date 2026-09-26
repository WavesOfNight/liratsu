import type { Metadata } from 'next'
import { cookies } from 'next/headers'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import React from 'react'
import { CustomGameFrame } from '@/components/arcade/CustomGameFrame'
import { RatsuLoader } from '@/game/ratsu/RatsuLoader'
import { MEMBER_COOKIE, readMemberId } from '@/lib/community'
import { getSection, getSiteData } from '@/lib/site'

type Props = { params: Promise<{ slug: string }> }

async function load(slug: string) {
  const { payload } = await getSiteData()
  const r = await payload.find({ collection: 'games', where: { and: [{ slug: { equals: slug } }, { status: { not_equals: 'off' } }] }, limit: 1, depth: 0 })
  return r.docs[0] ?? null
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const g = await load(slug)
  if (!g) return {}
  return {
    title: g.title,
    description: g.tagline || `${g.title} : un mini-jeu de l’Arcade Liratsu.`,
    alternates: { canonical: `/arcade/${slug}` },
  }
}

export default async function ArcadeGamePage({ params }: Props) {
  if ((await getSection('arcade')).status !== 'on') notFound()
  const { slug } = await params
  const g = await load(slug)
  if (!g || g.status === 'soon') notFound()

  let member: { displayName: string } | null = null
  if (g.engine === 'ratsu') {
    const { payload } = await getSiteData()
    const jar = await cookies()
    const memberCookie = jar.get(MEMBER_COOKIE)
    const memberId = readMemberId(memberCookie ? `${MEMBER_COOKIE}=${memberCookie.value}` : null)
    const doc = memberId ? await payload.findByID({ collection: 'members', id: memberId, depth: 0 }).catch(() => null) : null
    member = doc ? { displayName: doc.displayName } : null
  }

  return (
    <div className="container">
      <nav style={{ margin: '24px 0 8px' }}>
        <Link href="/arcade">← Retour à l’arcade</Link>
      </nav>
      <header className="page-head" style={{ paddingTop: 8 }}>
        <h1>{g.title}</h1>
        {g.tagline && <p>{g.tagline}</p>}
      </header>
      {g.engine === 'ratsu' ? <RatsuLoader member={member} /> : <CustomGameFrame slug={g.slug ?? slug} title={g.title} hasCode={Boolean(g.code?.trim())} />}
    </div>
  )
}

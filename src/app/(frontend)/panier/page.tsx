import type { Metadata } from 'next'
import { cookies } from 'next/headers'
import { notFound } from 'next/navigation'
import React from 'react'
import { AeroWindow } from '@/components/AeroWindow'
import { Checkout } from '@/components/shop/Checkout'
import { MEMBER_COOKIE, readMemberId } from '@/lib/community'
import { getPayloadClient } from '@/lib/payload'
import { getSection } from '@/lib/site'

export const metadata: Metadata = { title: 'Mon panier', robots: { index: false } }

export default async function CartPage() {
  if ((await getSection('shop')).status !== 'on') notFound()

  const jar = await cookies()
  const memberCookie = jar.get(MEMBER_COOKIE)
  const memberId = readMemberId(memberCookie ? `${MEMBER_COOKIE}=${memberCookie.value}` : null)
  const payload = await getPayloadClient()
  const member = memberId ? await payload.findByID({ collection: 'members', id: memberId, depth: 0 }).catch(() => null) : null

  return (
    <div className="container">
      <header className="page-head">
        <h1>Mon panier</h1>
      </header>
      <AeroWindow title="Panier.exe" icon="shop">
        <Checkout
          member={
            member
              ? { displayName: member.displayName, avatarUrl: member.avatarUrl ?? null, email: member.email ?? null, savedAddress: member.savedAddress ?? null }
              : null
          }
        />
      </AeroWindow>
    </div>
  )
}

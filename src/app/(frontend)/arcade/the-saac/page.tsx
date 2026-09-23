import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import React from 'react'
import { SaacLoader } from '@/game/saac/SaacLoader'
import { getSection, getSiteData } from '@/lib/site'

export const metadata: Metadata = {
  title: 'The Saac',
  description: 'The Saac : un die & retry aquatique 100 % original. Bulles, poissons rouges, pop-ups d’erreur, défi du jour et classement.',
  alternates: { canonical: '/arcade/the-saac' },
}

export default async function SaacPage() {
  if ((await getSection('arcade')).status !== 'on') notFound()
  const { payload } = await getSiteData()
  const settings = await payload.findGlobal({ slug: 'game-settings', depth: 0 })
  if (settings.saac?.enabled === false) notFound()
  return (
    <div className="container">
      <nav style={{ margin: '24px 0 8px' }}>
        <Link href="/arcade">← Retour à l’arcade</Link>
      </nav>
      <header className="page-head" style={{ paddingTop: 8 }}>
        <h1>The Saac</h1>
        <p>Nage, tire des bulles, survis aux poissons rouges enragés et aux pop-ups d’erreur. Une seule vie !</p>
      </header>
      <SaacLoader />
    </div>
  )
}
